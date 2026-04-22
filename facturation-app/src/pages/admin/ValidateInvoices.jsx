import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Paper, Button, Grid, Card, CardContent, CardActions,
  Chip, IconButton, Tooltip, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert, Snackbar, Skeleton, Avatar,
} from '@mui/material';
import {
  CheckCircle, Cancel, Visibility, Refresh, Search, Close,
  Receipt, Event, Person, PictureAsPdf, TaskAlt, HourglassEmpty,
} from '@mui/icons-material';
import AdminLayout from '../../components/common/AdminLayout';
import {
  auth, db, ref, get,
  getAllFacturesFlat, updateFactureByPath,
} from '../../services/firebaseService';
import { generateInvoicePDF } from '../../services/pdfService';

// ─── Helpers ─────────────────────────────────────────────────────────
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');
const fmtMoney = (n) => (Number(n) || 0).toLocaleString('fr-FR');

// ─── StatCard ────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, bg }) {
  return (
    <Card sx={{
      bgcolor: '#0F1623', border: '1px solid rgba(110,231,183,0.08)',
      borderRadius: 3, transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 8px 32px ${color}18` },
    }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '16px !important' }}>
        <Box sx={{ bgcolor: bg, borderRadius: '10px', p: 1.2, color, flexShrink: 0 }}>{icon}</Box>
        <Box>
          <Typography sx={{ color: '#64748B', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {label}
          </Typography>
          <Typography sx={{ fontWeight: 700, color: '#F1F5F9', fontSize: '1.75rem', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
            {value}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Carte facture ───────────────────────────────────────────────────
function PendingInvoiceCard({ facture, onView, onValidate, onReject, onPdf, loading }) {
  return (
    <Card sx={{
      bgcolor: '#0F1623', border: '1px solid rgba(234,179,8,0.2)',
      borderRadius: 3, transition: 'all 0.2s',
      '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 40px rgba(234,179,8,0.15)', borderColor: 'rgba(234,179,8,0.4)' },
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Avatar sx={{ bgcolor: 'rgba(234,179,8,0.15)', color: '#EAB308', width: 38, height: 38 }}>
              <Receipt sx={{ fontSize: 20 }} />
            </Avatar>
            <Box>
              <Typography sx={{ color: '#F1F5F9', fontWeight: 700, fontSize: '0.95rem', fontFamily: 'monospace' }}>
                {facture.numero || `#${(facture.id || '').slice(0, 6)}`}
              </Typography>
              <Typography sx={{ color: '#64748B', fontSize: '0.72rem' }}>
                {fmtDate(facture.date_creation)}
              </Typography>
            </Box>
          </Box>
          <Chip
            label="En attente" size="small"
            icon={<HourglassEmpty sx={{ fontSize: '14px !important' }} />}
            sx={{ bgcolor: 'rgba(234,179,8,0.15)', color: '#EAB308', fontWeight: 600, fontSize: '0.7rem', border: '1px solid rgba(234,179,8,0.3)', '& .MuiChip-icon': { color: '#EAB308' } }}
          />
        </Box>

        {(facture.client_nom || facture.client_id) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1, color: '#94A3B8' }}>
            <Person sx={{ fontSize: 15 }} />
            <Typography sx={{ fontSize: '0.82rem' }}>
              {facture.client_nom || `Client ${String(facture.client_id || '').slice(0, 6)}`}
            </Typography>
          </Box>
        )}

        {facture.date_depot && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1, color: '#94A3B8' }}>
            <Event sx={{ fontSize: 15 }} />
            <Typography sx={{ fontSize: '0.82rem' }}>Déposée le {fmtDate(facture.date_depot)}</Typography>
          </Box>
        )}

        <Divider sx={{ my: 1.5, borderColor: 'rgba(255,255,255,0.05)' }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Typography sx={{ color: '#64748B', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total TTC</Typography>
          <Typography sx={{ color: '#6EE7B7', fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.02em' }}>
            {fmtMoney(facture.total_ttc)} DH
          </Typography>
        </Box>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 1 }}>
        <Tooltip title="Détails">
          <IconButton size="small" onClick={() => onView(facture)} sx={{ color: '#3B82F6', bgcolor: 'rgba(59,130,246,0.08)' }}>
            <Visibility fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="PDF">
          <IconButton size="small" onClick={() => onPdf(facture)} sx={{ color: '#EF4444', bgcolor: 'rgba(239,68,68,0.08)' }}>
            <PictureAsPdf fontSize="small" />
          </IconButton>
        </Tooltip>
        <Box sx={{ flex: 1 }} />
        <Button
          size="small" startIcon={<Cancel />} disabled={loading}
          onClick={() => onReject(facture)}
          sx={{ color: '#EF4444', borderColor: 'rgba(239,68,68,0.3)', textTransform: 'none', '&:hover': { bgcolor: 'rgba(239,68,68,0.1)' } }}
          variant="outlined"
        >
          Rejeter
        </Button>
        <Button
          size="small" startIcon={<CheckCircle />} disabled={loading}
          onClick={() => onValidate(facture)}
          sx={{ bgcolor: '#22C55E', color: '#F1F5F9', textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#16A34A' } }}
          variant="contained"
        >
          Valider
        </Button>
      </CardActions>
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────────────────
export default function ValidateInvoices() {
  const [loading, setLoading] = useState(true);
  const [factures, setFactures] = useState([]);
  const [search, setSearch] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [actionLoading, setActionLoading] = useState(false);

  const [detailDialog, setDetailDialog] = useState({ open: false, facture: null });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, facture: null, action: null });

  // ── Chargement ────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getAllFacturesFlat();
      // Enrichir avec le nom du client si possible
      const clientsSnap = await get(ref(db, 'clients'));
      const clients = clientsSnap.val() || {};
      const enriched = list.map((f) => {
        const c = f.client_id && clients[f.client_id];
        return c ? { ...f, client_nom: c.nom, client_email: c.email, client_tel: c.tel, client_adresse: c.adresse } : f;
      });
      setFactures(enriched);
    } catch (e) {
      console.error(e);
      setSnackbar({ open: true, message: 'Erreur de chargement', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Liste des factures en attente filtrées ────────────────────────
  const pending = useMemo(() => {
    const list = factures.filter((f) => (f.statut || 'En attente') === 'En attente' && !f.validated_by_admin);
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((f) =>
      (f.numero || '').toLowerCase().includes(q) ||
      (f.client_nom || '').toLowerCase().includes(q) ||
      String(f.total_ttc || '').includes(q)
    );
  }, [factures, search]);

  const stats = useMemo(() => {
    const enAttente = factures.filter((f) => (f.statut || 'En attente') === 'En attente');
    const validees = factures.filter((f) => f.validated_by_admin || f.statut === 'Payée');
    const rejetees = factures.filter((f) => f.statut === 'Rejetée');
    const montantEnAttente = enAttente.reduce((s, f) => s + (Number(f.total_ttc) || 0), 0);
    return { enAttente: enAttente.length, validees: validees.length, rejetees: rejetees.length, montantEnAttente };
  }, [factures]);

  // ── Actions ───────────────────────────────────────────────────────
  const handleValidate = async (facture) => {
    setActionLoading(true);
    try {
      await updateFactureByPath(facture, {
        statut: 'Payée',
        validated_by_admin: true,
        validated_at: new Date().toISOString(),
        validated_by: auth.currentUser?.email || 'admin',
      });
      setSnackbar({ open: true, message: `Facture ${facture.numero || ''} validée`, severity: 'success' });
      setConfirmDialog({ open: false, facture: null, action: null });
      loadData();
    } catch (e) {
      console.error(e);
      setSnackbar({ open: true, message: 'Erreur lors de la validation', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (facture) => {
    setActionLoading(true);
    try {
      await updateFactureByPath(facture, {
        statut: 'Rejetée',
        validated_by_admin: false,
        rejected_at: new Date().toISOString(),
        rejected_by: auth.currentUser?.email || 'admin',
      });
      setSnackbar({ open: true, message: `Facture ${facture.numero || ''} rejetée`, severity: 'warning' });
      setConfirmDialog({ open: false, facture: null, action: null });
      loadData();
    } catch (e) {
      console.error(e);
      setSnackbar({ open: true, message: 'Erreur lors du rejet', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePdf = (facture) => {
    try {
      generateInvoicePDF(facture, {
        nom: facture.client_nom,
        email: facture.client_email,
        tel: facture.client_tel,
        adresse: facture.client_adresse,
      });
    } catch (e) {
      console.error(e);
      setSnackbar({ open: true, message: 'Erreur génération PDF', severity: 'error' });
    }
  };

  return (
    <AdminLayout>
      {/* En-tête */}
      <Box sx={{ mb: { xs: 3, md: 4 }, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{
            fontWeight: 800,
            background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
            backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent',
            mb: 0.5, fontFamily: "'Syne', sans-serif", letterSpacing: '-0.03em',
            fontSize: { xs: '1.4rem', md: '1.9rem' },
          }}>
            Validation des factures
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            Validez ou rejetez les factures en attente de traitement
          </Typography>
        </Box>
        <Tooltip title="Actualiser">
          <span>
            <IconButton onClick={loadData} disabled={loading} sx={{
              color: '#6EE7B7', bgcolor: 'rgba(110,231,183,0.08)',
              border: '1px solid rgba(110,231,183,0.2)', borderRadius: '10px',
              '&:hover': { bgcolor: 'rgba(110,231,183,0.16)' },
            }}>
              <Refresh sx={{ fontSize: 20, animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* KPIs */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 2, md: 3 } }}>
        <Grid item xs={6} md={3}>
          <StatCard icon={<HourglassEmpty sx={{ fontSize: 26 }} />} label="À valider" value={loading ? '—' : stats.enAttente} color="#EAB308" bg="rgba(234,179,8,0.1)" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard icon={<TaskAlt sx={{ fontSize: 26 }} />} label="Validées" value={loading ? '—' : stats.validees} color="#22C55E" bg="rgba(34,197,94,0.1)" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard icon={<Cancel sx={{ fontSize: 26 }} />} label="Rejetées" value={loading ? '—' : stats.rejetees} color="#EF4444" bg="rgba(239,68,68,0.1)" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard icon={<Receipt sx={{ fontSize: 26 }} />} label="Montant en attente" value={loading ? '—' : `${fmtMoney(stats.montantEnAttente)} DH`} color="#3B82F6" bg="rgba(59,130,246,0.1)" />
        </Grid>
      </Grid>

      {/* Recherche */}
      <Paper sx={{ bgcolor: '#0F1623', border: '1px solid rgba(110,231,183,0.08)', borderRadius: 3, p: 2, mb: 3 }}>
        <TextField
          fullWidth placeholder="Rechercher par numéro, client, montant..." size="small"
          value={search} onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search sx={{ color: '#64748B', fontSize: 20 }} /></InputAdornment>,
            endAdornment: search && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearch('')} sx={{ color: '#64748B' }}>
                  <Close sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ),
            sx: {
              color: '#F1F5F9', bgcolor: '#080C14', borderRadius: '10px',
              '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
              '&:hover fieldset': { borderColor: 'rgba(110,231,183,0.3)' },
              '&.Mui-focused fieldset': { borderColor: '#6EE7B7' },
              '& input::placeholder': { color: '#475569', opacity: 1 },
            },
          }}
        />
      </Paper>

      {/* Liste des cartes */}
      {loading ? (
        <Grid container spacing={2}>
          {Array(3).fill(null).map((_, i) => (
            <Grid item xs={12} md={6} lg={4} key={i}>
              <Skeleton variant="rectangular" height={220} sx={{ bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : pending.length === 0 ? (
        <Paper sx={{ bgcolor: '#0F1623', border: '1px solid rgba(110,231,183,0.08)', borderRadius: 3, p: 6, textAlign: 'center' }}>
          <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
            <TaskAlt sx={{ fontSize: 40, color: '#22C55E' }} />
          </Box>
          <Typography variant="h6" sx={{ color: '#F1F5F9', fontWeight: 700, mb: 1 }}>
            {search ? 'Aucun résultat' : 'Aucune facture en attente'}
          </Typography>
          <Typography sx={{ color: '#64748B' }}>
            {search ? 'Essayez un autre terme de recherche.' : 'Toutes les factures ont été traitées.'}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {pending.map((f) => (
            <Grid item xs={12} md={6} lg={4} key={f.id || f._path}>
              <PendingInvoiceCard
                facture={f}
                loading={actionLoading}
                onView={(fac) => setDetailDialog({ open: true, facture: fac })}
                onPdf={handlePdf}
                onValidate={(fac) => setConfirmDialog({ open: true, facture: fac, action: 'validate' })}
                onReject={(fac) => setConfirmDialog({ open: true, facture: fac, action: 'reject' })}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog de détail */}
      <Dialog
        open={detailDialog.open}
        onClose={() => setDetailDialog({ open: false, facture: null })}
        maxWidth="md" fullWidth
        PaperProps={{ sx: { bgcolor: '#0F1623', borderRadius: '16px', border: '1px solid rgba(110,231,183,0.15)' } }}
      >
        <DialogTitle sx={{ color: '#F1F5F9', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: "'Syne', sans-serif" }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Receipt sx={{ color: '#6EE7B7' }} />
            Facture {detailDialog.facture?.numero}
          </Box>
          <IconButton onClick={() => setDetailDialog({ open: false, facture: null })} sx={{ color: '#64748B' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>
          {detailDialog.facture && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ color: '#64748B', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', mb: 0.5 }}>Client</Typography>
                  <Typography sx={{ color: '#F1F5F9', fontWeight: 600 }}>{detailDialog.facture.client_nom || '—'}</Typography>
                  <Typography sx={{ color: '#94A3B8', fontSize: '0.82rem' }}>{detailDialog.facture.client_email || ''}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ color: '#64748B', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', mb: 0.5 }}>Date de création</Typography>
                  <Typography sx={{ color: '#F1F5F9', fontWeight: 600 }}>{fmtDate(detailDialog.facture.date_creation)}</Typography>
                  {detailDialog.facture.date_depot && (
                    <Typography sx={{ color: '#94A3B8', fontSize: '0.82rem' }}>Dépôt : {fmtDate(detailDialog.facture.date_depot)}</Typography>
                  )}
                </Grid>
              </Grid>

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)', mb: 2 }} />

              <Typography sx={{ color: '#64748B', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', mb: 1 }}>Articles</Typography>
              <TableContainer sx={{ bgcolor: '#080C14', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>Désignation</TableCell>
                      <TableCell align="center" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>Qté</TableCell>
                      <TableCell align="right" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>P.U.</TableCell>
                      <TableCell align="right" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(detailDialog.facture.articles || []).map((a, i) => {
                      const q = Number(a.quantite ?? a.qte ?? 1);
                      const pu = Number(a.prix_unitaire ?? a.prix ?? 0);
                      return (
                        <TableRow key={i}>
                          <TableCell sx={{ color: '#F1F5F9' }}>{a.designation || a.nom || '—'}</TableCell>
                          <TableCell align="center" sx={{ color: '#94A3B8' }}>{q}</TableCell>
                          <TableCell align="right" sx={{ color: '#94A3B8' }}>{fmtMoney(pu)} DH</TableCell>
                          <TableCell align="right" sx={{ color: '#F1F5F9', fontWeight: 600 }}>{fmtMoney(q * pu)} DH</TableCell>
                        </TableRow>
                      );
                    })}
                    {(!detailDialog.facture.articles || detailDialog.facture.articles.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} sx={{ color: '#64748B', textAlign: 'center' }}>Aucun article</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 2, alignItems: 'flex-end' }}>
                <Typography sx={{ color: '#94A3B8', fontSize: '0.85rem' }}>
                  Total HT : <strong style={{ color: '#F1F5F9' }}>{fmtMoney(detailDialog.facture.total_ht)} DH</strong>
                </Typography>
                <Typography sx={{ color: '#94A3B8', fontSize: '0.85rem' }}>
                  TVA : <strong style={{ color: '#F1F5F9' }}>{fmtMoney(detailDialog.facture.tva)} DH</strong>
                </Typography>
                <Typography sx={{ color: '#6EE7B7', fontSize: '1.1rem', fontWeight: 800 }}>
                  TTC : {fmtMoney(detailDialog.facture.total_ttc)} DH
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.05)', p: 2, gap: 1 }}>
          <Button startIcon={<PictureAsPdf />} onClick={() => handlePdf(detailDialog.facture)} sx={{ color: '#EF4444' }}>PDF</Button>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="outlined" startIcon={<Cancel />}
            onClick={() => { setConfirmDialog({ open: true, facture: detailDialog.facture, action: 'reject' }); setDetailDialog({ open: false, facture: null }); }}
            sx={{ color: '#EF4444', borderColor: 'rgba(239,68,68,0.3)' }}
          >
            Rejeter
          </Button>
          <Button
            variant="contained" startIcon={<CheckCircle />}
            onClick={() => { setConfirmDialog({ open: true, facture: detailDialog.facture, action: 'validate' }); setDetailDialog({ open: false, facture: null }); }}
            sx={{ bgcolor: '#22C55E', '&:hover': { bgcolor: '#16A34A' } }}
          >
            Valider
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmation */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => !actionLoading && setConfirmDialog({ open: false, facture: null, action: null })}
        maxWidth="xs" fullWidth
        PaperProps={{ sx: { bgcolor: '#0F1623', borderRadius: '16px', border: `1px solid ${confirmDialog.action === 'validate' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}` } }}
      >
        <DialogTitle sx={{ color: '#F1F5F9', fontWeight: 700 }}>
          {confirmDialog.action === 'validate' ? 'Valider la facture ?' : 'Rejeter la facture ?'}
        </DialogTitle>
        <DialogContent>
          <Alert
            severity={confirmDialog.action === 'validate' ? 'success' : 'error'}
            sx={{ mb: 2, borderRadius: 2 }}
          >
            {confirmDialog.action === 'validate'
              ? `La facture ${confirmDialog.facture?.numero || ''} sera marquée comme payée.`
              : `La facture ${confirmDialog.facture?.numero || ''} sera rejetée. Cette action est réversible.`}
          </Alert>
          {confirmDialog.facture && (
            <Typography sx={{ color: '#94A3B8', fontSize: '0.85rem' }}>
              Client : <strong style={{ color: '#F1F5F9' }}>{confirmDialog.facture.client_nom || '—'}</strong><br />
              Montant TTC : <strong style={{ color: '#6EE7B7' }}>{fmtMoney(confirmDialog.facture.total_ttc)} DH</strong>
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button disabled={actionLoading} onClick={() => setConfirmDialog({ open: false, facture: null, action: null })} sx={{ color: '#64748B' }}>Annuler</Button>
          {confirmDialog.action === 'validate' ? (
            <Button disabled={actionLoading} variant="contained" onClick={() => handleValidate(confirmDialog.facture)} sx={{ bgcolor: '#22C55E', '&:hover': { bgcolor: '#16A34A' } }}>
              {actionLoading ? 'Validation...' : 'Valider'}
            </Button>
          ) : (
            <Button disabled={actionLoading} variant="contained" onClick={() => handleReject(confirmDialog.facture)} sx={{ bgcolor: '#EF4444', '&:hover': { bgcolor: '#DC2626' } }}>
              {actionLoading ? 'Rejet...' : 'Rejeter'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3500} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </AdminLayout>
  );
}
