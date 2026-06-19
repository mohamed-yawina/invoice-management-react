import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, Button, LinearProgress, Grid, Card, CardContent, TextField, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider, Tooltip, InputAdornment,
  Tabs, Tab, Alert, Snackbar, Avatar,
} from '@mui/material';
import {
  Visibility, PictureAsPdf, Add, Search, TrackChanges, Receipt as ReceiptIcon,
  Paid, Pending, Cancel, Close, CalendarMonth, AccountBalance, Delete,
  FilterList, Description, TableView,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  db, ref, get, getAllFacturesFlat, updateFactureByPath, deleteFactureByPath,
} from '../../services/firebaseService';
import Layout from '../../components/common/Layout';
import { useCompany } from '../../contexts/CompanyContext';
import { generateInvoicePDF } from '../../services/pdfService';
import { exportInvoicesToExcel } from '../../services/excelService';
import { getPublicAppOrigin, isLocalhostOrigin } from '../../utils/appOrigin';
import { useThemeMode } from '../../contexts/ThemeModeContext';
import { formatMoney, getInvoiceAmountMad } from '../../utils/currency';

const STATUT_STYLES = {
  'Payée': { bg: 'rgba(34,197,94,0.15)', color: '#22C55E', icon: <Paid sx={{ fontSize: 14 }} /> },
  'Rejetée': { bg: 'rgba(239,68,68,0.15)', color: '#EF4444', icon: <Cancel sx={{ fontSize: 14 }} /> },
  'En attente': { bg: 'rgba(234,179,8,0.15)', color: '#EAB308', icon: <Pending sx={{ fontSize: 14 }} /> },
};

const TYPE_VIREMENTS = ['Virement bancaire', 'Chèque', 'Espèces', 'Carte bancaire', 'Prélèvement', 'Autre'];

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');
const fmtInv = (n, inv) => formatMoney(n, inv?.currency);

export default function InvoiceHistory() {
  const { palette, gradients } = useThemeMode();
  const navigate = useNavigate();
  const { filterItems } = useCompany();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [clientsMap, setClientsMap] = useState({});
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('all');
  const [toast, setToast] = useState({ open: false, msg: '', severity: 'success' });

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailInv, setDetailInv] = useState(null);

  const [trackOpen, setTrackOpen] = useState(false);
  const [trackInv, setTrackInv] = useState(null);
  const [trackForm, setTrackForm] = useState({
    statut: 'En attente', date_depot: '', date_encaissement: '', type_virement: '',
  });
  const [saving, setSaving] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [list, clientsSnap] = await Promise.all([
        getAllFacturesFlat(),
        get(ref(db, 'clients')),
      ]);
      const sorted = list
        .filter((f) => !f.archived)
        .sort((a, b) => new Date(b.date_creation || 0) - new Date(a.date_creation || 0));
      setInvoices(sorted);
      const cmap = {};
      if (clientsSnap.exists()) {
        const raw = clientsSnap.val();
        Object.keys(raw).forEach((id) => { cmap[id] = { id, ...raw[id] }; });
      }
      setClientsMap(cmap);
    } catch (error) {
      console.error(error);
      setToast({ open: true, msg: 'Erreur de chargement', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getClientName = (inv) => {
    const c = clientsMap[inv.client_id];
    return c ? c.nom : (inv.client_id || '—');
  };

  const scopedInvoices = useMemo(() => filterItems(invoices), [invoices, filterItems]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scopedInvoices.filter((inv) => {
      if (statusTab !== 'all' && inv.statut !== statusTab) return false;
      if (!q) return true;
      const cname = (getClientName(inv) || '').toLowerCase();
      return (
        (inv.numero || '').toLowerCase().includes(q) ||
        cname.includes(q) ||
        String(inv.total_ttc || '').includes(q)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopedInvoices, search, statusTab, clientsMap]);

  const kpis = useMemo(() => {
    const total = scopedInvoices.length;
    const encaisse = scopedInvoices.filter((f) => f.statut === 'Payée')
      .reduce((s, f) => s + getInvoiceAmountMad(f), 0);
    const enAttente = scopedInvoices.filter((f) => f.statut === 'En attente').length;
    const rejetees = scopedInvoices.filter((f) => f.statut === 'Rejetée').length;
    return { total, encaisse, enAttente, rejetees };
  }, [scopedInvoices]);

  const handleViewDetail = (inv) => { setDetailInv(inv); setDetailOpen(true); };

  const handleOpenTrack = (inv) => {
    setTrackInv(inv);
    setTrackForm({
      statut: inv.statut || 'En attente',
      date_depot: inv.date_depot ? inv.date_depot.slice(0, 10) : '',
      date_encaissement: inv.date_encaissement ? inv.date_encaissement.slice(0, 10) : '',
      type_virement: inv.type_virement || '',
    });
    setTrackOpen(true);
  };

  const handleSaveTrack = async () => {
    if (!trackInv) return;
    setSaving(true);
    try {
      const payload = {
        statut: trackForm.statut,
        date_depot: trackForm.date_depot || null,
        date_encaissement: trackForm.date_encaissement || null,
        type_virement: trackForm.type_virement || null,
        updated_at: new Date().toISOString(),
      };
      await updateFactureByPath(trackInv, payload);
      setToast({ open: true, msg: 'Suivi mis à jour', severity: 'success' });
      setTrackOpen(false);
      setTrackInv(null);
      await loadData();
    } catch (error) {
      console.error(error);
      setToast({ open: true, msg: 'Erreur lors de la mise à jour', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async (inv) => {
    try {
      if (isLocalhostOrigin()) {
        setToast({
          open: true,
          msg: 'QR localhost — Paramètres → URL publique QR : http://VOTRE_IP:3000 puis regénérez le PDF',
          severity: 'warning',
        });
      }
      const client = clientsMap[inv.client_id] || null;
      await generateInvoicePDF(inv, client, { autoSave: true });
      const origin = getPublicAppOrigin();
      setToast({
        open: true,
        msg: isLocalhostOrigin(origin)
          ? 'PDF généré — configurez l\'URL publique QR dans Paramètres'
          : `PDF généré — QR : ${origin}/verify-invoice/...`,
        severity: isLocalhostOrigin(origin) ? 'warning' : 'success',
      });
    } catch (error) {
      console.error(error);
      setToast({ open: true, msg: 'Erreur génération PDF', severity: 'error' });
    }
  };

  const handleExportExcel = () => {
    if (filtered.length === 0) {
      setToast({ open: true, msg: 'Aucune facture à exporter', severity: 'warning' });
      return;
    }
    const enriched = filtered.map((inv) => ({
      ...inv,
      client_nom: getClientName(inv),
    }));
    exportInvoicesToExcel(enriched, `mes_factures_${new Date().toISOString().slice(0, 10)}.xlsx`);
    setToast({ open: true, msg: `Export Excel (${filtered.length} factures)`, severity: 'success' });
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteFactureByPath(confirmDelete);
      setConfirmDelete(null);
      setToast({ open: true, msg: 'Facture supprimée', severity: 'success' });
      await loadData();
    } catch (error) {
      console.error(error);
      setToast({ open: true, msg: 'Erreur de suppression', severity: 'error' });
    }
  };

  const getStatusChip = (statut) => {
    const style = STATUT_STYLES[statut] || STATUT_STYLES['En attente'];
    return (
      <Chip icon={style.icon} label={statut || 'En attente'} size="small"
        sx={{
          bgcolor: style.bg, color: style.color, fontWeight: 600,
          '& .MuiChip-icon': { color: style.color },
        }}
      />
    );
  };

  const clientInitials = (nom = '?') =>
    nom.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('') || 'C';

  const kpiCards = [
    {
      title: 'Total factures', value: kpis.total, icon: <ReceiptIcon />,
      gradient: 'linear-gradient(135deg, #3B82F6, #6366F1)',
      iconBg: 'rgba(59,130,246,0.15)', iconColor: '#3B82F6',
    },
    {
      title: 'Encaissé', value: formatMoney(kpis.encaisse, 'MAD'), icon: <Paid />,
      gradient: gradients.success,
      iconBg: 'rgba(34,197,94,0.15)', iconColor: '#22C55E',
    },
    {
      title: 'En attente', value: kpis.enAttente, icon: <Pending />,
      gradient: gradients.warning,
      iconBg: 'rgba(234,179,8,0.15)', iconColor: '#EAB308',
    },
    {
      title: 'Rejetées', value: kpis.rejetees, icon: <Cancel />,
      gradient: gradients.danger,
      iconBg: 'rgba(239,68,68,0.15)', iconColor: '#EF4444',
    },
  ];

  return (
    <Layout>
      {/* ─── HEADER ───────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          position: 'relative', overflow: 'hidden', borderRadius: 4, p: { xs: 3, md: 4 }, mb: 3,
          background: gradients.hero,
          border: '1px solid rgba(37,99,235,0.15)',
          '&::before': {
            content: '""', position: 'absolute', top: -60, right: -40,
            width: 200, height: 200, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37,99,235,0.12), transparent 60%)',
          },
        }}
      >
        <Grid container spacing={2} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Box sx={{
                width: 44, height: 44, borderRadius: 2,
                background: gradients.brand, display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(37,99,235,0.3)',
              }}>
                <Description sx={{ color: '#F8FAFC', fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ color: palette.text.primary, fontWeight: 800, lineHeight: 1.1 }}>
                  Mes factures
                </Typography>
                <Typography sx={{ color: palette.text.secondary, fontSize: 14 }}>
                  Gérez, suivez et téléchargez vos factures
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Button variant="contained" size="large" startIcon={<Add />}
              onClick={() => navigate('/app/invoices/new')}>
              Nouvelle facture
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* ─── KPIs ─────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {kpiCards.map((k) => (
          <Grid item xs={6} md={3} key={k.title}>
            <Card sx={{
              position: 'relative', overflow: 'hidden', borderRadius: 3,
              background: gradients.card,
              '&:hover': { transform: 'translateY(-3px)', borderColor: 'rgba(37,99,235,0.3)' },
              '&::before': {
                content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: k.gradient,
              },
            }}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography sx={{ color: palette.text.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                    {k.title}
                  </Typography>
                  <Typography variant="h5" sx={{ color: palette.text.primary, fontWeight: 800, mt: 0.5 }}>
                    {k.value}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: k.iconBg, borderRadius: 2, p: 1.25, color: k.iconColor, display: 'flex' }}>
                  {k.icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ─── TABLE ───────────────────────────────── */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', background: gradients.card }}>
        <Box sx={{
          p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center',
          borderBottom: `1px solid ${palette.line.subtle}`,
          background: 'linear-gradient(90deg, rgba(37,99,235,0.06), transparent)',
        }}>
          <TextField
            size="small" placeholder="Rechercher n°, client, montant…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 280, flex: 1 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: palette.text.muted }} /></InputAdornment> }}
          />
          <Button
            variant="outlined" size="small" startIcon={<TableView />}
            onClick={handleExportExcel} disabled={loading || filtered.length === 0}
            sx={{
              color: palette.accent.mint, borderColor: 'rgba(37,99,235,0.35)',
              textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap',
              '&:hover': { borderColor: palette.accent.mint, bgcolor: 'rgba(37,99,235,0.08)' },
            }}
          >
            Export Excel
          </Button>
          <Tabs
            value={statusTab} onChange={(_, v) => setStatusTab(v)}
            sx={{
              '& .MuiTab-root': { color: palette.text.secondary, textTransform: 'none', minHeight: 36, fontSize: 13 },
              '& .Mui-selected': { color: `${palette.accent.mint} !important` },
              '& .MuiTabs-indicator': { backgroundColor: palette.accent.mint, height: 3, borderRadius: 3 },
            }}
          >
            <Tab value="all" icon={<FilterList sx={{ fontSize: 16 }} />} iconPosition="start" label={`Toutes (${invoices.length})`} />
            <Tab value="En attente" label={`En attente (${kpis.enAttente})`} />
            <Tab value="Payée" label={`Payées (${invoices.filter(i => i.statut === 'Payée').length})`} />
            <Tab value="Rejetée" label={`Rejetées (${kpis.rejetees})`} />
          </Tabs>
        </Box>

        {loading ? (
          <Box sx={{ p: 3 }}><LinearProgress /></Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Box sx={{
              width: 80, height: 80, mx: 'auto', mb: 2,
              borderRadius: '50%', bgcolor: 'rgba(37,99,235,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ReceiptIcon sx={{ fontSize: 40, color: palette.accent.mint }} />
            </Box>
            <Typography sx={{ color: palette.text.primary, fontWeight: 600, mb: 0.5 }}>
              Aucune facture trouvée
            </Typography>
            <Typography sx={{ color: palette.text.secondary, mb: 2 }}>
              {search ? 'Essayez de modifier vos critères de recherche' : 'Commencez par créer votre première facture'}
            </Typography>
            <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/app/invoices/new')}>
              Créer une facture
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>N° Facture</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Date création</TableCell>
                  <TableCell>Dépôt</TableCell>
                  <TableCell>Encaissement</TableCell>
                  <TableCell>Type virement</TableCell>
                  <TableCell align="right">Montant TTC</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((inv) => (
                  <TableRow key={inv._path || inv.id} hover
                    sx={{ '&:hover': { bgcolor: 'rgba(37,99,235,0.06)' } }}>
                    <TableCell sx={{ color: palette.accent.mint, fontWeight: 700, fontSize: 14 }}>
                      {inv.numero || '—'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{
                          width: 28, height: 28, fontSize: 11, fontWeight: 700,
                          bgcolor: 'rgba(37,99,235,0.15)', color: palette.accent.mint,
                        }}>{clientInitials(getClientName(inv))}</Avatar>
                        <Typography sx={{ color: palette.text.primary, fontSize: 14 }}>
                          {getClientName(inv)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: palette.text.secondary, fontSize: 13 }}>{fmtDate(inv.date_creation)}</TableCell>
                    <TableCell sx={{ color: palette.text.secondary, fontSize: 13 }}>{fmtDate(inv.date_depot)}</TableCell>
                    <TableCell sx={{ color: palette.text.secondary, fontSize: 13 }}>{fmtDate(inv.date_encaissement)}</TableCell>
                    <TableCell sx={{ color: palette.text.secondary, fontSize: 13 }}>{inv.type_virement || '—'}</TableCell>
                    <TableCell align="right" sx={{ color: palette.text.primary, fontWeight: 700 }}>
                      {fmtInv(inv.total_ttc, inv)}
                    </TableCell>
                    <TableCell>{getStatusChip(inv.statut)}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <Tooltip title="Voir détail">
                          <IconButton size="small" onClick={() => handleViewDetail(inv)}
                            sx={{ color: '#3B82F6', bgcolor: 'rgba(59,130,246,0.08)', '&:hover': { bgcolor: 'rgba(59,130,246,0.18)' } }}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Suivi">
                          <IconButton size="small" onClick={() => handleOpenTrack(inv)}
                            sx={{ color: '#EAB308', bgcolor: 'rgba(234,179,8,0.08)', '&:hover': { bgcolor: 'rgba(234,179,8,0.18)' } }}>
                            <TrackChanges fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="PDF">
                          <IconButton size="small" onClick={() => handleDownloadPDF(inv)}
                            sx={{ color: '#EF4444', bgcolor: 'rgba(239,68,68,0.08)', '&:hover': { bgcolor: 'rgba(239,68,68,0.18)' } }}>
                            <PictureAsPdf fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton size="small" onClick={() => setConfirmDelete(inv)}
                            sx={{ color: palette.text.secondary, '&:hover': { color: '#EF4444', bgcolor: 'rgba(239,68,68,0.08)' } }}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* ─── DIALOG DÉTAIL ──────────────────────── */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{
          background: gradients.hero,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: `1px solid ${palette.line.subtle}`,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: 2, background: gradients.brand,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Description sx={{ color: '#F8FAFC', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ color: palette.text.primary, fontWeight: 700 }}>
                Facture {detailInv?.numero}
              </Typography>
              <Typography sx={{ color: palette.text.secondary, fontSize: 12 }}>
                Créée le {fmtDate(detailInv?.date_creation)}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setDetailOpen(false)} sx={{ color: palette.text.secondary }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {detailInv && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, bgcolor: palette.bg.card, borderRadius: 2, border: `1px solid ${palette.line.subtle}` }}>
                    <Typography sx={{ color: palette.text.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>
                      Client
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{
                        width: 40, height: 40, fontWeight: 700,
                        bgcolor: 'rgba(37,99,235,0.15)', color: palette.accent.mint,
                      }}>{clientInitials(getClientName(detailInv))}</Avatar>
                      <Box>
                        <Typography sx={{ color: palette.text.primary, fontWeight: 600 }}>
                          {getClientName(detailInv)}
                        </Typography>
                        {clientsMap[detailInv.client_id]?.email && (
                          <Typography sx={{ color: palette.text.secondary, fontSize: 13 }}>
                            {clientsMap[detailInv.client_id].email}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, bgcolor: palette.bg.card, borderRadius: 2, border: `1px solid ${palette.line.subtle}` }}>
                    <Typography sx={{ color: palette.text.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>
                      Statut
                    </Typography>
                    <Box>{getStatusChip(detailInv.statut)}</Box>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ p: 1.5, bgcolor: palette.bg.card, borderRadius: 2, border: `1px solid ${palette.line.subtle}` }}>
                    <Typography sx={{ color: palette.text.muted, fontSize: 10, textTransform: 'uppercase' }}>Date création</Typography>
                    <Typography sx={{ color: palette.text.primary, fontSize: 14 }}>{fmtDate(detailInv.date_creation)}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ p: 1.5, bgcolor: palette.bg.card, borderRadius: 2, border: `1px solid ${palette.line.subtle}` }}>
                    <Typography sx={{ color: palette.text.muted, fontSize: 10, textTransform: 'uppercase' }}>Date dépôt</Typography>
                    <Typography sx={{ color: palette.text.primary, fontSize: 14 }}>{fmtDate(detailInv.date_depot)}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ p: 1.5, bgcolor: palette.bg.card, borderRadius: 2, border: `1px solid ${palette.line.subtle}` }}>
                    <Typography sx={{ color: palette.text.muted, fontSize: 10, textTransform: 'uppercase' }}>Encaissement</Typography>
                    <Typography sx={{ color: palette.text.primary, fontSize: 14 }}>{fmtDate(detailInv.date_encaissement)}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ p: 1.5, bgcolor: palette.bg.card, borderRadius: 2, border: `1px solid ${palette.line.subtle}` }}>
                    <Typography sx={{ color: palette.text.muted, fontSize: 10, textTransform: 'uppercase' }}>Virement</Typography>
                    <Typography sx={{ color: palette.text.primary, fontSize: 14 }}>{detailInv.type_virement || '—'}</Typography>
                  </Box>
                </Grid>
              </Grid>

              <Typography sx={{ color: palette.text.primary, fontWeight: 600, mb: 1, mt: 2 }}>Articles</Typography>
              <TableContainer sx={{ bgcolor: palette.bg.card, borderRadius: 2, border: `1px solid ${palette.line.subtle}` }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Désignation</TableCell>
                      <TableCell align="right">Qté</TableCell>
                      <TableCell align="right">Prix U.</TableCell>
                      <TableCell align="right">Remise %</TableCell>
                      <TableCell align="right">Total HT</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(detailInv.articles || []).map((a, i) => {
                      const sousTotal = (a.qte || 0) * (a.prix || 0);
                      const totalHT = sousTotal - (sousTotal * ((a.remise || 0) / 100));
                      return (
                        <TableRow key={i}>
                          <TableCell sx={{ color: palette.text.primary }}>{a.designation}</TableCell>
                          <TableCell align="right" sx={{ color: palette.text.secondary }}>{a.qte}</TableCell>
                          <TableCell align="right" sx={{ color: palette.text.secondary }}>{fmtInv(a.prix, detailInv)}</TableCell>
                          <TableCell align="right" sx={{ color: palette.text.secondary }}>{a.remise || 0}%</TableCell>
                          <TableCell align="right" sx={{ color: palette.text.primary, fontWeight: 600 }}>{fmtInv(totalHT, detailInv)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Box sx={{ minWidth: 280, p: 2, bgcolor: palette.bg.card, borderRadius: 2, border: `1px solid ${palette.line.subtle}` }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography sx={{ color: palette.text.secondary }}>Total HT</Typography>
                    <Typography sx={{ color: palette.text.primary, fontWeight: 600 }}>{fmtInv(detailInv.total_ht, detailInv)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography sx={{ color: palette.text.secondary }}>TVA</Typography>
                    <Typography sx={{ color: palette.text.primary, fontWeight: 600 }}>{fmtInv(detailInv.tva, detailInv)}</Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography sx={{ color: palette.accent.mint, fontWeight: 700, fontSize: 16 }}>Total TTC</Typography>
                    <Typography sx={{ color: palette.accent.mint, fontWeight: 800, fontSize: 18 }}>
                      {fmtInv(detailInv.total_ttc, detailInv)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailOpen(false)} sx={{ color: palette.text.secondary }}>Fermer</Button>
          <Button variant="outlined" startIcon={<TrackChanges />}
            onClick={() => { setDetailOpen(false); handleOpenTrack(detailInv); }}
            sx={{ color: '#EAB308', borderColor: '#EAB308', '&:hover': { borderColor: '#FDE68A', bgcolor: 'rgba(234,179,8,0.1)' } }}>
            Suivi
          </Button>
          <Button variant="contained" startIcon={<PictureAsPdf />} onClick={() => handleDownloadPDF(detailInv)}
            sx={{ background: gradients.danger, color: '#FFF', '&:hover': { opacity: 0.9 } }}>
            Télécharger PDF
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── DIALOG SUIVI ──────────────────────── */}
      <Dialog open={trackOpen} onClose={() => setTrackOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, rgba(234,179,8,0.1), rgba(249,115,22,0.05))',
          borderBottom: `1px solid ${palette.line.subtle}`,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: 2,
              background: gradients.warning,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TrackChanges sx={{ color: '#F8FAFC', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ color: palette.text.primary, fontWeight: 700 }}>
                Suivi de la facture
              </Typography>
              <Typography sx={{ color: palette.text.secondary, fontSize: 13 }}>
                {trackInv?.numero}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            Renseignez les dates de dépôt / encaissement, le type de virement et le statut de paiement.
          </Alert>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField select fullWidth label="Statut" value={trackForm.statut}
                onChange={(e) => setTrackForm({ ...trackForm, statut: e.target.value })}>
                <MenuItem value="En attente">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Pending sx={{ fontSize: 18, color: '#EAB308' }} /> En attente
                  </Box>
                </MenuItem>
                <MenuItem value="Payée">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Paid sx={{ fontSize: 18, color: '#22C55E' }} /> Payée
                  </Box>
                </MenuItem>
                <MenuItem value="Rejetée">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Cancel sx={{ fontSize: 18, color: '#EF4444' }} /> Rejetée
                  </Box>
                </MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" label="Date de dépôt"
                value={trackForm.date_depot} InputLabelProps={{ shrink: true }}
                onChange={(e) => setTrackForm({ ...trackForm, date_depot: e.target.value })}
                InputProps={{ startAdornment: <InputAdornment position="start"><CalendarMonth sx={{ color: palette.text.muted, fontSize: 18 }} /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" label="Date d'encaissement"
                value={trackForm.date_encaissement} InputLabelProps={{ shrink: true }}
                onChange={(e) => setTrackForm({ ...trackForm, date_encaissement: e.target.value })}
                InputProps={{ startAdornment: <InputAdornment position="start"><CalendarMonth sx={{ color: palette.text.muted, fontSize: 18 }} /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField select fullWidth label="Type de virement"
                value={trackForm.type_virement}
                onChange={(e) => setTrackForm({ ...trackForm, type_virement: e.target.value })}
                InputProps={{ startAdornment: <InputAdornment position="start"><AccountBalance sx={{ color: palette.text.muted, fontSize: 18 }} /></InputAdornment> }}>
                <MenuItem value="">— Non renseigné —</MenuItem>
                {TYPE_VIREMENTS.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setTrackOpen(false)} sx={{ color: palette.text.secondary }}>Annuler</Button>
          <Button variant="contained" disabled={saving} onClick={handleSaveTrack}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm delete */}
      <Dialog open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)}
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: 2, background: gradients.danger,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Delete sx={{ color: '#FFF', fontSize: 20 }} />
          </Box>
          Supprimer la facture ?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: palette.text.secondary }}>
            Cette action est irréversible. La facture <strong style={{ color: palette.text.primary }}>
            {confirmDelete?.numero}</strong> sera supprimée définitivement.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmDelete(null)} sx={{ color: palette.text.secondary }}>Annuler</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Supprimer</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={toast.severity} onClose={() => setToast({ ...toast, open: false })} variant="filled">
          {toast.msg}
        </Alert>
      </Snackbar>
    </Layout>
  );
}
