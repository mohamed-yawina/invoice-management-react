import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, TextField, Button, MenuItem, Grid, IconButton, Alert,
  Dialog, DialogContent, DialogActions, Divider, InputAdornment,
  Snackbar, Autocomplete, Chip, Card, CardContent, Tooltip,
} from '@mui/material';
import {
  Add, Delete, Save, PictureAsPdf, CheckCircle, CalendarMonth, AccountBalance,
  Person, Receipt as ReceiptIcon, Calculate, Inventory2, Description,
  ArrowBack, Info, Draw, Edit,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import SignaturePad from '../../components/common/SignaturePad';
import { db, ref, get, push } from '../../services/firebaseService';
import { jsonService } from '../../services/jsonService';
import {
  calculateSimple, calculateWithLineDiscount,
  calculateWithGlobalDiscount, calculateWithCategoryVAT,
} from '../../utils/calculations';
import { generateInvoicePDF } from '../../services/pdfService';
import { palette, gradients } from '../../theme/darkTheme';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { getUserSignature } from '../../services/signatureService';
import {
  createNotificationForUsers, getAdminUserIds, createNotification,
} from '../../services/notificationService';
import CurrencySelect from '../../components/common/CurrencySelect';
import CompanySelect from '../../components/common/CompanySelect';
import { useCompany } from '../../contexts/CompanyContext';
import { buildCompanySnapshot } from '../../services/companyService';
import { formatMoney, enrichInvoiceCurrency, DEFAULT_CURRENCY, convertToMad, convertBetweenCurrencies, catalogPriceToInvoice, CATALOG_CURRENCY, normalizeCurrency } from '../../utils/currency';

const TYPE_VIREMENTS = ['Virement bancaire', 'Chèque', 'Espèces', 'Carte bancaire', 'Prélèvement', 'Autre'];

// Badge de section illustrée
const SectionHeader = ({ icon, title, subtitle, color = palette.accent.mint }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
    <Box sx={{
      width: 42, height: 42, borderRadius: 2,
      background: `linear-gradient(135deg, ${color}22, ${color}11)`,
      border: `1px solid ${color}33`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: color,
    }}>
      {icon}
    </Box>
    <Box>
      <Typography sx={{ color: palette.text.primary, fontWeight: 700, fontSize: 15, lineHeight: 1.1 }}>
        {title}
      </Typography>
      <Typography sx={{ color: palette.text.muted, fontSize: 12 }}>
        {subtitle}
      </Typography>
    </Box>
  </Box>
);

export default function CreateInvoice() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast: notifyToast } = useNotifications();
  const { companies, activeCompanyId } = useCompany();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    clientId: '',
    numero: `F-${Date.now().toString().slice(-6)}`,
    method: 'simple',
    globalDiscount: 0,
    date_depot: '',
    type_virement: '',
    notes: '',
    currency: DEFAULT_CURRENCY,
    societeId: '',
  });

  useEffect(() => {
    if (activeCompanyId && !form.societeId) {
      setForm((f) => ({ ...f, societeId: activeCompanyId }));
    }
  }, [activeCompanyId, form.societeId]);

  const fmtForm = (n) => formatMoney(n, form.currency);

  const handleCurrencyChange = (newCurrency) => {
    const next = normalizeCurrency(newCurrency);
    const prev = form.currency;
    if (next === prev) return;
    setForm((f) => ({ ...f, currency: next }));
    setItems((prevItems) =>
      prevItems.map((item) => {
        const prix = Number(item.prix) || 0;
        return prix > 0
          ? { ...item, prix: convertBetweenCurrencies(prix, prev, next) }
          : item;
      })
    );
  };

  const [items, setItems] = useState([
    { articleId: '', designation: '', qte: 1, prix: 0, remise: 0, categorie_id: null },
  ]);
  const [result, setResult] = useState({ totalHT: 0, tva: 0, totalTTC: 0 });

  // Signature (par défaut depuis profil, modifiable par facture)
  const [defaultSignature, setDefaultSignature] = useState(null);
  const [signature, setSignature] = useState(null);
  const [sigPadOpen, setSigPadOpen] = useState(false);

  const [toast, setToast] = useState({ open: false, msg: '', severity: 'success' });
  const [successOpen, setSuccessOpen] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState(null);

  useEffect(() => { loadData(); }, []);
  useEffect(() => {
    if (!user?.uid) return;
    (async () => {
      const s = await getUserSignature(user.uid);
      setDefaultSignature(s);
      setSignature(s);
    })();
  }, [user?.uid]);

  useEffect(() => {
    calculateTotals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, form.method, form.globalDiscount]);

  const loadData = async () => {
    try {
      const [clientsData, articlesData, categoriesData] = await Promise.all([
        get(ref(db, 'clients')),
        jsonService.getArticles(),
        jsonService.getCategories(),
      ]);
      const clientsRaw = clientsData.val() || {};
      setClients(Object.keys(clientsRaw).map((id) => ({ id, ...clientsRaw[id] })));
      setArticles(articlesData || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error(error);
      setToast({ open: true, msg: 'Erreur de chargement des données', severity: 'error' });
    }
  };

  const normalize = (arr) =>
    arr.map((i) => ({
      ...i,
      quantite: Number(i.qte) || 0,
      prix_unitaire: Number(i.prix) || 0,
      remise: Number(i.remise) || 0,
      categorie_id: i.categorie_id ?? null,
    }));

  const calculateTotals = () => {
    const valid = items.filter((i) => Number(i.qte) > 0 && Number(i.prix) > 0);
    if (valid.length === 0) {
      setResult({ totalHT: 0, tva: 0, totalTTC: 0 });
      return;
    }
    const normalized = normalize(valid);
    let totals;
    switch (form.method) {
      case 'lineDiscount': totals = calculateWithLineDiscount(normalized); break;
      case 'globalDiscount': totals = calculateWithGlobalDiscount(normalized, Number(form.globalDiscount) || 0); break;
      case 'categoryVAT': totals = calculateWithCategoryVAT(normalized, categories); break;
      default: totals = calculateSimple(normalized);
    }
    setResult({
      totalHT: Number(totals.totalHT) || 0,
      tva: Number(totals.tva) || 0,
      totalTTC: Number(totals.totalTTC) || 0,
    });
  };

  const addItem = () =>
    setItems([...items, { articleId: '', designation: '', qte: 1, prix: 0, remise: 0, categorie_id: null }]);
  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx, field, value) => {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: value };
    setItems(next);
  };
  const selectArticle = (idx, article) => {
    const next = [...items];
    if (!article) {
      next[idx] = { ...next[idx], articleId: '', designation: '', prix: 0, categorie_id: null };
    } else {
      next[idx] = {
        ...next[idx],
        articleId: article.id,
        designation: article.designation,
        prix: catalogPriceToInvoice(Number(article.prix_unitaire) || 0, form.currency),
        categorie_id: article.categorie_id ?? null,
      };
    }
    setItems(next);
  };

  const validate = () => {
    if (!form.clientId) return 'Veuillez sélectionner un client';
    if (!form.numero.trim()) return 'Le numéro de facture est requis';
    if (!form.societeId) return 'Veuillez sélectionner une société émettrice';
    const valid = items.filter((i) => i.designation && Number(i.qte) > 0 && Number(i.prix) > 0);
    if (valid.length === 0) return 'Ajoutez au moins un article (désignation, quantité et prix)';
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      setToast({ open: true, msg: err, severity: 'warning' });
      return;
    }
    setLoading(true);
    try {
      const client = clients.find((c) => c.id === form.clientId) || null;
      const selectedCompany = companies.find((c) => c.id === form.societeId);
      const societeSnapshot = buildCompanySnapshot(selectedCompany);
      const cleanItems = items
        .filter((i) => i.designation && Number(i.qte) > 0 && Number(i.prix) > 0)
        .map((i) => ({
          articleId: i.articleId || null,
          designation: i.designation,
          qte: Number(i.qte) || 0,
          prix: Number(i.prix) || 0,
          remise: Number(i.remise) || 0,
          categorie_id: i.categorie_id ?? null,
        }));

      const invoice = enrichInvoiceCurrency({
        numero: form.numero,
        date_creation: new Date().toISOString(),
        client_id: form.clientId,
        client_snapshot: client
          ? { nom: client.nom, email: client.email, tel: client.tel || '', adresse: client.adresse || '' }
          : null,
        articles: cleanItems,
        total_ht: Number(result.totalHT) || 0,
        tva: Number(result.tva) || 0,
        total_ttc: Number(result.totalTTC) || 0,
        statut: 'En attente',
        validated_by_admin: false,
        method: form.method,
        globalDiscount: Number(form.globalDiscount) || 0,
        date_depot: form.date_depot || null,
        date_encaissement: null,
        type_virement: form.type_virement || null,
        notes: form.notes || '',
        signature: signature || null,
        created_by: user?.uid || null,
        created_by_email: user?.email || null,
        societe_id: form.societeId,
        societe_snapshot: societeSnapshot,
      }, form.currency);

      const newRef = await push(ref(db, 'factures'), invoice);
      const saved = { id: newRef.key, _path: `factures/${newRef.key}`, ...invoice };
      setCreatedInvoice({ invoice: saved, client });
      setSuccessOpen(true);
      notifyToast(`Facture ${invoice.numero} créée et envoyée pour validation`, 'success');

      // Notification au créateur (persistée)
      if (user?.uid) {
        await createNotification(user.uid, {
          type: 'info',
          title: 'Facture créée',
          message: `Votre facture ${invoice.numero} (${formatMoney(invoice.total_ttc, invoice.currency)}) a été envoyée pour validation.`,
          link: '/app/invoices',
          meta: { factureId: newRef.key, factureNumero: invoice.numero },
        });
      }

      // Notification à tous les admins
      try {
        const adminIds = await getAdminUserIds();
        if (adminIds.length > 0) {
          await createNotificationForUsers(adminIds, {
            type: 'warning',
            title: 'Nouvelle facture à valider',
            message: `${user?.displayName || user?.email || 'Un utilisateur'} a créé la facture ${invoice.numero} (${formatMoney(invoice.total_ttc, invoice.currency)}).`,
            link: '/admin/validate',
            meta: { factureId: newRef.key, factureNumero: invoice.numero },
          });
        }
      } catch (e) {
        console.warn('Notif admin échouée:', e);
      }
    } catch (error) {
      console.error(error);
      setToast({ open: true, msg: 'Erreur lors de la création', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCreatedPDF = async () => {
    if (!createdInvoice) return;
    try {
      await generateInvoicePDF(createdInvoice.invoice, createdInvoice.client, { autoSave: true });
    } catch (error) {
      console.error(error);
      setToast({ open: true, msg: 'Erreur PDF', severity: 'error' });
    }
  };

  const selectedArticleFor = (idx) =>
    articles.find((a) => String(a.id) === String(items[idx].articleId)) || null;

  const selectedClient = clients.find((c) => c.id === form.clientId);
  const totalItems = items.filter((i) => i.qte > 0 && i.prix > 0).length;

  return (
    <Layout>
      {/* ─── HEADER ─────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          position: 'relative', overflow: 'hidden', borderRadius: 4,
          p: { xs: 2.5, md: 3.5 }, mb: 3,
          background: gradients.hero,
          border: '1px solid rgba(110,231,183,0.15)',
          '&::before': {
            content: '""', position: 'absolute', top: -50, right: -30,
            width: 180, height: 180, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(110,231,183,0.12), transparent 60%)',
          },
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <IconButton onClick={() => navigate('/app/invoices')}
            sx={{ bgcolor: 'rgba(255,255,255,0.04)', '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }}>
            <ArrowBack sx={{ color: palette.text.primary }} />
          </IconButton>
          <Box sx={{
            width: 48, height: 48, borderRadius: 2,
            background: gradients.brand, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(110,231,183,0.3)',
          }}>
            <Description sx={{ color: '#0D0F14', fontSize: 24 }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography variant="h4" sx={{ color: palette.text.primary, fontWeight: 800, lineHeight: 1.1 }}>
              Nouvelle facture
            </Typography>
            <Typography sx={{ color: palette.text.secondary, fontSize: 14 }}>
              Remplissez les informations, ajoutez des articles et créez votre facture
            </Typography>
          </Box>
          <Chip label={`N° ${form.numero}`} sx={{
            background: 'rgba(110,231,183,0.1)',
            color: palette.accent.mint,
            border: '1px solid rgba(110,231,183,0.2)',
            fontFamily: 'monospace', fontWeight: 700,
          }} />
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* ─── COLONNE FORMULAIRE ─────────────── */}
        <Grid item xs={12} lg={8}>
          {/* Section 1 — Informations générales */}
          <Paper sx={{ borderRadius: 3, p: 3, mb: 3, background: gradients.card }}>
            <SectionHeader
              icon={<ReceiptIcon />}
              title="Informations générales"
              subtitle="Client et paramètres de la facture"
            />
        <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  select fullWidth label="Client *" value={form.clientId}
                  onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ color: palette.text.muted, fontSize: 18 }} /></InputAdornment> }}
                >
                  <MenuItem value=""><em>Sélectionner un client</em></MenuItem>
                  {clients.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <Box sx={{
                          width: 26, height: 26, borderRadius: '50%',
                          bgcolor: 'rgba(110,231,183,0.15)', color: palette.accent.mint,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700,
                        }}>
                          {c.nom?.[0]?.toUpperCase() || '?'}
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: 14 }}>{c.nom}</Typography>
                          {c.email && (
                            <Typography sx={{ fontSize: 11, color: palette.text.muted }}>{c.email}</Typography>
                          )}
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
                {clients.length === 0 && (
                  <Alert severity="warning" sx={{ mt: 1, fontSize: 12 }}>
                    Aucun client enregistré.{' '}
                    <Box component="span" sx={{ textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}
                      onClick={() => navigate('/app/clients')}>
                      Créer un client
                    </Box>
                  </Alert>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth label="N° Facture *" value={form.numero}
                  onChange={(e) => setForm({ ...form, numero: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <CompanySelect
                  companies={companies}
                  value={form.societeId}
                  onChange={(societeId) => setForm({ ...form, societeId })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <CurrencySelect
                  value={form.currency}
                  onChange={handleCurrencyChange}
                />
              </Grid>
              <Grid item xs={12} md={form.method === 'globalDiscount' ? 4 : 6}>
                <TextField
                  select fullWidth label="Méthode de calcul" value={form.method}
                  onChange={(e) => setForm({ ...form, method: e.target.value })}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Calculate sx={{ color: palette.text.muted, fontSize: 18 }} /></InputAdornment> }}
                >
                  <MenuItem value="simple">Simple HT + TVA (20%)</MenuItem>
                  <MenuItem value="lineDiscount">Remise par ligne</MenuItem>
                  <MenuItem value="globalDiscount">Remise globale</MenuItem>
                  <MenuItem value="categoryVAT">TVA par catégorie</MenuItem>
                </TextField>
              </Grid>
              {form.method === 'globalDiscount' && (
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="Remise globale (%)" type="number" value={form.globalDiscount}
                    onChange={(e) => setForm({ ...form, globalDiscount: parseFloat(e.target.value) || 0 })} />
                </Grid>
              )}
              <Grid item xs={12} md={form.method === 'globalDiscount' ? 4 : 6}>
                <TextField
                  fullWidth type="date" label="Date de dépôt (optionnel)" value={form.date_depot}
                  InputLabelProps={{ shrink: true }}
                  onChange={(e) => setForm({ ...form, date_depot: e.target.value })}
                  InputProps={{ startAdornment: <InputAdornment position="start"><CalendarMonth sx={{ color: palette.text.muted, fontSize: 18 }} /></InputAdornment> }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select fullWidth label="Type de virement (optionnel)" value={form.type_virement}
                  onChange={(e) => setForm({ ...form, type_virement: e.target.value })}
                  InputProps={{ startAdornment: <InputAdornment position="start"><AccountBalance sx={{ color: palette.text.muted, fontSize: 18 }} /></InputAdornment> }}>
                  <MenuItem value=""><em>Non renseigné</em></MenuItem>
                  {TYPE_VIREMENTS.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={2} label="Notes (optionnel)"
                  value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </Grid>
            </Grid>
          </Paper>

          {/* Section 2 — Articles */}
          <Paper sx={{ borderRadius: 3, p: 3, mb: 3, background: gradients.card }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <SectionHeader
                icon={<Inventory2 />}
                title="Articles"
                subtitle={`${totalItems} article${totalItems !== 1 ? 's' : ''} ajouté${totalItems !== 1 ? 's' : ''}`}
                color={palette.accent.blue}
              />
              <Button startIcon={<Add />} onClick={addItem}
                variant="outlined"
                sx={{
                  color: palette.accent.mint, borderColor: 'rgba(110,231,183,0.3)',
                  '&:hover': { bgcolor: 'rgba(110,231,183,0.08)', borderColor: palette.accent.mint },
                }}>
                Ajouter
              </Button>
            </Box>

            {items.map((item, idx) => {
              const sousTotal = (Number(item.qte) || 0) * (Number(item.prix) || 0);
              const afterRemise = form.method === 'lineDiscount'
                ? sousTotal - sousTotal * ((Number(item.remise) || 0) / 100)
                : sousTotal;
              const article = selectedArticleFor(idx);
              const category = categories.find((c) => String(c.id) === String(item.categorie_id));
              return (
                <Paper key={idx} variant="outlined"
                  sx={{
                    bgcolor: palette.bg.card, borderRadius: 2, p: 2, mb: 2,
                    border: `1px solid ${palette.line.subtle}`,
                    '&:hover': { borderColor: 'rgba(110,231,183,0.2)' },
                    transition: 'border-color 0.2s',
                    position: 'relative',
                  }}>
                  <Box sx={{
                    position: 'absolute', top: 10, left: -10,
                    width: 24, height: 24, borderRadius: '50%',
                    background: gradients.brand, color: '#0D0F14',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800,
                    boxShadow: '0 4px 10px rgba(110,231,183,0.3)',
                  }}>
                    {idx + 1}
                  </Box>
                  <Grid container spacing={2} alignItems="center" sx={{ pl: 1 }}>
                    <Grid item xs={12} md={4}>
                      <Autocomplete
                        options={articles}
                        value={article}
                        getOptionLabel={(o) => o?.designation || ''}
                        isOptionEqualToValue={(o, v) => String(o?.id) === String(v?.id)}
                        onChange={(_, v) => selectArticle(idx, v)}
                        renderInput={(params) => (
                          <TextField {...params} label="Article (catalogue)" size="small"
                            placeholder="Rechercher..." />
                        )}
                        renderOption={(props, option) => {
                          const converted = catalogPriceToInvoice(option.prix_unitaire, form.currency);
                          return (
                            <Box component="li" {...props} sx={{ display: 'flex', justifyContent: 'space-between !important', alignItems: 'center', gap: 1 }}>
                              <Typography sx={{ fontSize: 13 }}>{option.designation}</Typography>
                              <Box sx={{ textAlign: 'right' }}>
                                <Typography sx={{ fontSize: 12, color: palette.accent.mint, fontWeight: 600 }}>
                                  {formatMoney(converted, form.currency)}
                                </Typography>
                                {form.currency !== CATALOG_CURRENCY && (
                                  <Typography sx={{ fontSize: 10, color: palette.text.muted }}>
                                    {formatMoney(option.prix_unitaire, CATALOG_CURRENCY)} cat.
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          );
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField fullWidth size="small" label="Désignation *" value={item.designation}
                        onChange={(e) => updateItem(idx, 'designation', e.target.value)} />
                    </Grid>
                    <Grid item xs={6} md={1.2}>
                      <TextField fullWidth size="small" type="number" label="Qté" value={item.qte}
                        onChange={(e) => updateItem(idx, 'qte', parseFloat(e.target.value) || 0)} />
                    </Grid>
                    <Grid item xs={6} md={1.5}>
                      <TextField fullWidth size="small" type="number" label={`Prix U. (${form.currency})`} value={item.prix}
                        onChange={(e) => updateItem(idx, 'prix', parseFloat(e.target.value) || 0)} />
                    </Grid>
                    {form.method === 'lineDiscount' && (
                      <Grid item xs={6} md={1.2}>
                        <TextField fullWidth size="small" type="number" label="Remise %" value={item.remise}
                          onChange={(e) => updateItem(idx, 'remise', parseFloat(e.target.value) || 0)} />
                      </Grid>
                    )}
                    {form.method === 'categoryVAT' && (
                      <Grid item xs={6} md={1.5}>
                        <TextField select fullWidth size="small" label="Catégorie"
                          value={item.categorie_id ?? ''}
                          onChange={(e) => updateItem(idx, 'categorie_id', e.target.value || null)}>
                          <MenuItem value="">—</MenuItem>
                          {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.nom}</MenuItem>)}
                        </TextField>
                      </Grid>
                    )}
                    <Grid item xs={12} md={form.method === 'lineDiscount' || form.method === 'categoryVAT' ? 1 : 2}
                      sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography sx={{ color: palette.text.muted, fontSize: 10, textTransform: 'uppercase' }}>Total HT</Typography>
                        <Typography sx={{ color: palette.accent.mint, fontWeight: 700, fontSize: 13 }}>
                          {fmtForm(afterRemise)}
                        </Typography>
                      </Box>
                      <Tooltip title={items.length === 1 ? 'Au moins un article requis' : 'Supprimer'}>
                        <span>
                          <IconButton size="small" onClick={() => removeItem(idx)} disabled={items.length === 1}>
                            <Delete sx={{ color: items.length === 1 ? palette.text.faint : '#EF4444' }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Grid>
                    {form.method === 'categoryVAT' && category && (
                      <Grid item xs={12}>
                        <Chip size="small" label={`Catégorie : ${category.nom}`}
                          sx={{ bgcolor: 'rgba(110,231,183,0.1)', color: palette.accent.mint }} />
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              );
            })}

            <Button fullWidth startIcon={<Add />} onClick={addItem}
              sx={{
                mt: 1, color: palette.accent.mint,
                border: `1px dashed rgba(110,231,183,0.3)`, borderRadius: 2,
                py: 1.5,
                '&:hover': { bgcolor: 'rgba(110,231,183,0.05)', borderColor: palette.accent.mint },
              }}>
              Ajouter un autre article
            </Button>
          </Paper>
        </Grid>

        {/* ─── COLONNE RÉCAP (STICKY) ─────────── */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ position: { lg: 'sticky' }, top: { lg: 20 } }}>
            {/* Récap client */}
            {selectedClient && (
              <Card sx={{ borderRadius: 3, mb: 2, background: gradients.card }}>
                <CardContent>
                  <Typography sx={{ color: palette.text.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>
                    Facturé à
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                      width: 40, height: 40, borderRadius: '50%',
                      bgcolor: 'rgba(110,231,183,0.15)', color: palette.accent.mint,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 16,
                    }}>
                      {selectedClient.nom?.[0]?.toUpperCase() || '?'}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ color: palette.text.primary, fontWeight: 600 }}>
                        {selectedClient.nom}
                      </Typography>
                      <Typography sx={{ color: palette.text.secondary, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selectedClient.email || selectedClient.tel || 'Aucun contact'}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Totaux */}
            <Card sx={{
              borderRadius: 3, mb: 2,
              background: gradients.card,
              border: '1px solid rgba(110,231,183,0.2)',
              overflow: 'hidden',
              position: 'relative',
              '&::before': {
                content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: gradients.brand,
              },
            }}>
              <CardContent>
                <Typography sx={{ color: palette.text.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 2 }}>
                  Récapitulatif
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                  <Typography sx={{ color: palette.text.secondary }}>Articles</Typography>
                  <Typography sx={{ color: palette.text.primary, fontWeight: 600 }}>{totalItems}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                  <Typography sx={{ color: palette.text.secondary }}>Total HT</Typography>
                  <Typography sx={{ color: palette.text.primary, fontWeight: 600 }}>{formatMoney(result.totalHT, form.currency)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                  <Typography sx={{ color: palette.text.secondary }}>TVA</Typography>
                  <Typography sx={{ color: palette.text.primary, fontWeight: 600 }}>{formatMoney(result.tva, form.currency)}</Typography>
                </Box>
                <Divider sx={{ my: 1.5 }} />
                <Box sx={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  p: 1.5, bgcolor: 'rgba(110,231,183,0.08)', borderRadius: 2,
                }}>
                  <Typography sx={{ color: palette.text.primary, fontWeight: 700 }}>Total TTC</Typography>
                  <Typography sx={{
                    background: gradients.brand,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 800, fontSize: 22,
                  }}>
                    {formatMoney(result.totalTTC, form.currency)}
                  </Typography>
                </Box>
                {form.currency !== 'MAD' && (
                  <Typography sx={{ color: palette.text.muted, fontSize: 11, mt: 1, textAlign: 'right' }}>
                    ≈ {formatMoney(convertToMad(result.totalTTC, form.currency), 'MAD')}
                  </Typography>
                )}

                <Alert severity="info" icon={<Info fontSize="small" />} sx={{ mt: 2, fontSize: 12 }}>
                  Statut initial : <strong>En attente</strong>. Mettez à jour le suivi après paiement.
                </Alert>
              </CardContent>
            </Card>

            {/* Signature numérique */}
            <Card sx={{ borderRadius: 3, mb: 2, background: gradients.card, border: '1px solid rgba(110,231,183,0.12)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Draw sx={{ color: palette.accent.mint, fontSize: 18 }} />
                  <Typography sx={{ color: palette.text.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Signature numérique
                  </Typography>
                </Box>
                {signature ? (
                  <Box>
                    <Box sx={{
                      bgcolor: '#FFFFFF', p: 1.5, borderRadius: 2,
                      display: 'flex', justifyContent: 'center', alignItems: 'center',
                      minHeight: 80, mb: 1.2,
                    }}>
                      <img src={signature} alt="Signature"
                        style={{ maxWidth: '100%', maxHeight: 70, objectFit: 'contain' }} />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" startIcon={<Edit fontSize="small" />} onClick={() => setSigPadOpen(true)}
                        sx={{ flex: 1, color: palette.accent.mint, fontSize: 12 }}>
                        Modifier
                      </Button>
                      {defaultSignature && signature !== defaultSignature && (
                        <Button size="small" onClick={() => setSignature(defaultSignature)}
                          sx={{ color: palette.text.muted, fontSize: 12 }}>
                          Réinitialiser
                        </Button>
                      )}
                      <Button size="small" onClick={() => setSignature(null)}
                        sx={{ color: '#EF4444', fontSize: 12 }}>
                        Retirer
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <Button fullWidth variant="outlined" startIcon={<Draw />} onClick={() => setSigPadOpen(true)}
                      sx={{
                        color: palette.accent.mint, borderColor: 'rgba(110,231,183,0.3)', borderStyle: 'dashed',
                        py: 1.2,
                        '&:hover': { bgcolor: 'rgba(110,231,183,0.06)', borderColor: palette.accent.mint },
                      }}>
                      Ajouter une signature
                    </Button>
                    {defaultSignature && (
                      <Button size="small" fullWidth onClick={() => setSignature(defaultSignature)}
                        sx={{ mt: 0.8, color: palette.text.muted, fontSize: 12 }}>
                        Utiliser ma signature enregistrée
                      </Button>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 1.5, flexDirection: 'column' }}>
              <Button variant="contained" size="large" disabled={loading} onClick={handleSubmit} startIcon={<Save />}>
                {loading ? 'Création...' : 'Créer la facture'}
              </Button>
              <Button variant="outlined" size="large" onClick={() => navigate('/app/invoices')}
                sx={{
                  color: palette.text.secondary, borderColor: 'rgba(255,255,255,0.1)',
                  '&:hover': { borderColor: '#EF4444', color: '#EF4444', bgcolor: 'rgba(239,68,68,0.05)' },
                }}>
                Annuler
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* ─── DIALOG SUCCÈS ─────────────────── */}
      <Dialog open={successOpen} onClose={() => setSuccessOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <Box sx={{
          position: 'relative', p: 4, textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(110,231,183,0.1))',
          borderBottom: `1px solid ${palette.line.subtle}`,
        }}>
          <Box sx={{
            width: 72, height: 72, mx: 'auto', mb: 2,
            borderRadius: '50%', background: gradients.success,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 10px 30px rgba(34,197,94,0.4)',
            animation: 'pop 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            '@keyframes pop': {
              '0%': { transform: 'scale(0)' },
              '100%': { transform: 'scale(1)' },
            },
          }}>
            <CheckCircle sx={{ color: '#FFF', fontSize: 40 }} />
          </Box>
          <Typography variant="h5" sx={{ color: palette.text.primary, fontWeight: 800, mb: 0.5 }}>
            Facture créée !
          </Typography>
          <Typography sx={{ color: palette.text.secondary }}>
            La facture <strong style={{ color: palette.accent.mint }}>
              {createdInvoice?.invoice?.numero}
            </strong> a été enregistrée avec succès
          </Typography>
          <Typography variant="h4" sx={{
            mt: 2,
            background: gradients.brand,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 800,
          }}>
            {formatMoney(createdInvoice?.invoice?.total_ttc, createdInvoice?.invoice?.currency)}
          </Typography>
        </Box>
        <DialogContent>
          <Alert severity="info" sx={{ fontSize: 13 }}>
            Vous pouvez télécharger le PDF dès maintenant ou depuis la liste des factures.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => { setSuccessOpen(false); navigate('/app/invoices'); }}
            sx={{ color: palette.text.secondary }}>
            Voir mes factures
          </Button>
          <Button onClick={() => {
            setSuccessOpen(false);
            setCreatedInvoice(null);
            setForm({ ...form, numero: `F-${Date.now().toString().slice(-6)}`, notes: '' });
            setItems([{ articleId: '', designation: '', qte: 1, prix: 0, remise: 0, categorie_id: null }]);
          }} sx={{ color: palette.accent.mint }}>
            Créer une autre
          </Button>
          <Button variant="contained" startIcon={<PictureAsPdf />} onClick={handleDownloadCreatedPDF}
            sx={{ background: gradients.danger, color: '#FFF', '&:hover': { opacity: 0.9 } }}>
            Télécharger PDF
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={toast.severity} onClose={() => setToast({ ...toast, open: false })} variant="filled">
          {toast.msg}
        </Alert>
      </Snackbar>

      <SignaturePad
        open={sigPadOpen}
        onClose={() => setSigPadOpen(false)}
        onSave={(dataUrl) => setSignature(dataUrl)}
        initialValue={signature}
        title="Signature pour cette facture"
      />
    </Layout>
  );
}
