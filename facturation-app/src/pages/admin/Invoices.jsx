import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, TextField,
  MenuItem, FormControl, InputLabel, Select, Grid, InputAdornment,
  LinearProgress, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Alert, Card, CardContent, Divider, Avatar, TablePagination, FormControlLabel, Switch,
} from '@mui/material';
import {
  Search, FilterList, CheckCircle, Cancel, Visibility, Refresh,
  PictureAsPdf, Delete, Receipt, Person, Event,
  TaskAlt, HourglassEmpty, DoNotDisturb, Download, Close, TableView,
} from '@mui/icons-material';
import AdminLayout from '../../components/common/AdminLayout';
import { useCompany } from '../../contexts/CompanyContext';
import { getCompanyDisplayName } from '../../services/companyService';
import {
  auth, db, ref, get,
  getAllFacturesFlat, updateFactureByPath, deleteFactureByPath,
} from '../../services/firebaseService';
import { generateInvoicePDF, generateInvoicesReportPDF } from '../../services/pdfService';
import { exportInvoicesToExcel } from '../../services/excelService';
import { postValidateInvoiceActions } from '../../services/invoiceValidationService';
import { formatMoney, getInvoiceAmountMad, normalizeCurrency } from '../../utils/currency';

// ─── Helpers ─────────────────────────────────────────────────────────
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');
const fmtMoney = (n) => (Number(n) || 0).toLocaleString('fr-FR');
const fmtInv = (n, f) => formatMoney(n, f?.currency);

const STATUS_META = {
  'Payée':      { color: '#22C55E', bg: 'rgba(34,197,94,0.15)', icon: <TaskAlt sx={{ fontSize: '14px !important' }} /> },
  'En attente': { color: '#EAB308', bg: 'rgba(234,179,8,0.15)', icon: <HourglassEmpty sx={{ fontSize: '14px !important' }} /> },
  'Rejetée':    { color: '#EF4444', bg: 'rgba(239,68,68,0.15)', icon: <DoNotDisturb sx={{ fontSize: '14px !important' }} /> },
};
const getStatus = (s) => STATUS_META[s] || STATUS_META['En attente'];

// ─── StatCard ────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, bg }) {
  return (
    <Card sx={{
      bgcolor: 'var(--app-bg-card)', border: '1px solid rgba(37,99,235,0.08)',
      borderRadius: 3, transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 8px 32px ${color}18` },
    }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '16px !important' }}>
        <Box sx={{ bgcolor: bg, borderRadius: '10px', p: 1.2, color, flexShrink: 0 }}>{icon}</Box>
        <Box>
          <Typography sx={{ color: 'var(--app-text-secondary)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {label}
          </Typography>
          <Typography sx={{ fontWeight: 700, color: 'var(--app-text-primary)', fontSize: '1.55rem', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
            {value}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────────────────
export default function Invoices() {
  const { filterItems } = useCompany();
  const [loading, setLoading] = useState(true);
  const [factures, setFactures] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [actionLoading, setActionLoading] = useState(false);

  const [detailDialog, setDetailDialog] = useState({ open: false, facture: null });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, facture: null, action: null });

  // ── Chargement ────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getAllFacturesFlat();
      const clientsSnap = await get(ref(db, 'clients'));
      const clients = clientsSnap.val() || {};
      const enriched = list.map((f) => {
        const c = f.client_id && clients[f.client_id];
        return c ? { ...f, client_nom: c.nom, client_email: c.email, client_tel: c.tel, client_adresse: c.adresse } : f;
      });
      enriched.sort((a, b) => new Date(b.date_creation || 0) - new Date(a.date_creation || 0));
      setFactures(enriched);
    } catch (e) {
      console.error(e);
      setSnackbar({ open: true, message: 'Erreur de chargement des factures', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const scopedFactures = useMemo(() => filterItems(factures), [factures, filterItems]);

  // ── Filtrage ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return scopedFactures.filter((f) => {
      if (!showArchived && f.archived) return false;
      if (statusFilter && (f.statut || 'En attente') !== statusFilter) return false;
      if (dateFrom && new Date(f.date_creation) < new Date(dateFrom)) return false;
      if (dateTo && new Date(f.date_creation) > new Date(dateTo + 'T23:59:59')) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = [
          f.numero, f.client_nom, f.client_email, String(f.total_ttc),
        ].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [scopedFactures, search, statusFilter, dateFrom, dateTo, showArchived]);

  const activeFactures = useMemo(() => scopedFactures.filter((f) => !f.archived), [scopedFactures]);

  const paginated = useMemo(
    () => filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filtered, page, rowsPerPage]
  );

  // ── Stats ─────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = activeFactures.length;
    const payees = activeFactures.filter((f) => f.statut === 'Payée');
    const enAttente = activeFactures.filter((f) => (f.statut || 'En attente') === 'En attente').length;
    const rejetees = activeFactures.filter((f) => f.statut === 'Rejetée').length;
    const ca = payees.reduce((s, f) => s + (Number(f.total_ttc) || 0), 0);
    return { total, payees: payees.length, enAttente, rejetees, ca };
  }, [activeFactures]);

  // ── Actions ───────────────────────────────────────────────────────
  const resetFilters = () => {
    setSearch(''); setStatusFilter(''); setDateFrom(''); setDateTo(''); setPage(0);
  };

  const handlePdf = async (facture) => {
    try {
      await generateInvoicePDF(facture, {
        nom: facture.client_nom, email: facture.client_email,
        tel: facture.client_tel, adresse: facture.client_adresse,
      });
    } catch (e) {
      console.error(e);
      setSnackbar({ open: true, message: 'Erreur génération PDF', severity: 'error' });
    }
  };

  const handleExportAll = () => {
    if (filtered.length === 0) {
      setSnackbar({ open: true, message: 'Aucune facture à exporter', severity: 'warning' });
      return;
    }
    generateInvoicesReportPDF(filtered, { title: 'Rapport des factures' });
    setSnackbar({ open: true, message: `Rapport exporté (${filtered.length} factures)`, severity: 'success' });
  };

  const handleExportExcel = () => {
    if (filtered.length === 0) {
      setSnackbar({ open: true, message: 'Aucune facture à exporter', severity: 'warning' });
      return;
    }
    const ok = exportInvoicesToExcel(filtered, `factures_${new Date().toISOString().slice(0, 10)}.xlsx`);
    if (ok) {
      setSnackbar({ open: true, message: `Export Excel (${filtered.length} factures)`, severity: 'success' });
    }
  };

  const handleValidate = async (facture) => {
    setActionLoading(true);
    try {
      await updateFactureByPath(facture, {
        statut: 'Payée', validated_by_admin: true,
        validated_at: new Date().toISOString(),
        validated_by: auth.currentUser?.email || 'admin',
      });
      setConfirmDialog({ open: false, facture: null, action: null });

      const { message, severity } = await postValidateInvoiceActions(facture);
      setSnackbar({ open: true, message, severity });
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
        statut: 'Rejetée', validated_by_admin: false,
        rejected_at: new Date().toISOString(),
        rejected_by: auth.currentUser?.email || 'admin',
      });
      setSnackbar({ open: true, message: 'Facture rejetée', severity: 'warning' });
      setConfirmDialog({ open: false, facture: null, action: null });
      loadData();
    } catch (e) {
      console.error(e);
      setSnackbar({ open: true, message: 'Erreur lors du rejet', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (facture) => {
    setActionLoading(true);
    try {
      await deleteFactureByPath(facture);
      setSnackbar({ open: true, message: 'Facture supprimée', severity: 'success' });
      setConfirmDialog({ open: false, facture: null, action: null });
      loadData();
    } catch (e) {
      console.error(e);
      setSnackbar({ open: true, message: 'Erreur lors de la suppression', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // ── Styles de champs ──────────────────────────────────────────────
  const fieldSx = {
    '& .MuiInputLabel-root': { color: 'var(--app-text-secondary)' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#2563EB' },
    '& .MuiOutlinedInput-root': {
      color: 'var(--app-text-primary)', bgcolor: 'var(--app-bg-deep)', borderRadius: '10px',
      '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
      '&:hover fieldset': { borderColor: 'rgba(37,99,235,0.3)' },
      '&.Mui-focused fieldset': { borderColor: '#2563EB' },
    },
  };

  return (
    <AdminLayout>
      {/* En-tête */}
      <Box sx={{ mb: { xs: 3, md: 4 }, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{
            fontWeight: 800,
            background: 'linear-gradient(135deg, #2563EB 0%, #475569 100%)',
            backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent',
            mb: 0.5, fontFamily: "'Syne', sans-serif", letterSpacing: '-0.03em',
            fontSize: { xs: '1.4rem', md: '1.9rem' },
          }}>
            Gestion des factures
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--app-text-secondary)' }}>
            Consultez, filtrez, validez et gérez toutes les factures
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Actualiser">
            <span>
              <IconButton onClick={loadData} disabled={loading} sx={{
                color: '#2563EB', bgcolor: 'rgba(37,99,235,0.08)',
                border: '1px solid rgba(37,99,235,0.2)', borderRadius: '10px',
                '&:hover': { bgcolor: 'rgba(37,99,235,0.12)' },
              }}>
                <Refresh sx={{ fontSize: 20, animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              </IconButton>
            </span>
          </Tooltip>
          <Button
            variant="outlined" startIcon={<TableView />}
            onClick={handleExportExcel} disabled={loading || filtered.length === 0}
            sx={{
              color: '#2563EB', borderColor: 'rgba(37,99,235,0.35)', fontWeight: 600,
              borderRadius: '10px', textTransform: 'none', px: 2,
              '&:hover': { borderColor: '#2563EB', bgcolor: 'rgba(37,99,235,0.08)' },
            }}
          >
            Excel
          </Button>
          <Button
            variant="contained" startIcon={<Download />}
            onClick={handleExportAll} disabled={loading || filtered.length === 0}
            sx={{
              bgcolor: '#2563EB', color: '#F8FAFC', fontWeight: 700,
              borderRadius: '10px', textTransform: 'none', px: 2.5,
              boxShadow: '0 0 20px rgba(37,99,235,0.25)',
              '&:hover': { bgcolor: '#1D4ED8', boxShadow: '0 0 28px rgba(37,99,235,0.35)' },
            }}
          >
            Exporter PDF
          </Button>
        </Box>
      </Box>

      {/* KPIs */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 2, md: 3 } }}>
        <Grid item xs={6} md={3}>
          <StatCard icon={<Receipt sx={{ fontSize: 26 }} />} label="Total factures" value={loading ? '—' : stats.total} color="#3B82F6" bg="rgba(59,130,246,0.1)" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard icon={<TaskAlt sx={{ fontSize: 26 }} />} label="Payées" value={loading ? '—' : stats.payees} color="#22C55E" bg="rgba(34,197,94,0.1)" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard icon={<HourglassEmpty sx={{ fontSize: 26 }} />} label="En attente" value={loading ? '—' : stats.enAttente} color="#EAB308" bg="rgba(234,179,8,0.1)" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard icon={<DoNotDisturb sx={{ fontSize: 26 }} />} label="Rejetées" value={loading ? '—' : stats.rejetees} color="#EF4444" bg="rgba(239,68,68,0.1)" />
        </Grid>
      </Grid>

      {/* Filtres */}
      <Paper sx={{ bgcolor: 'var(--app-bg-card)', border: '1px solid rgba(37,99,235,0.08)', borderRadius: 3, p: 2, mb: 3 }}>
        <Grid container spacing={1.5} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth size="small" placeholder="Rechercher N°, client, montant..."
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search sx={{ color: 'var(--app-text-secondary)', fontSize: 20 }} /></InputAdornment>,
                endAdornment: search && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearch('')} sx={{ color: 'var(--app-text-secondary)' }}>
                      <Close sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ),
                sx: {
                  color: 'var(--app-text-primary)', bgcolor: 'var(--app-bg-deep)', borderRadius: '10px',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
                  '&:hover fieldset': { borderColor: 'rgba(37,99,235,0.3)' },
                  '&.Mui-focused fieldset': { borderColor: '#2563EB' },
                  '& input::placeholder': { color: '#475569', opacity: 1 },
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small" sx={fieldSx}>
              <InputLabel>Statut</InputLabel>
              <Select
                value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                label="Statut"
                MenuProps={{ PaperProps: { sx: { bgcolor: 'var(--app-bg-card)' } } }}
              >
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="En attente">En attente</MenuItem>
                <MenuItem value="Payée">Payée</MenuItem>
                <MenuItem value="Rejetée">Rejetée</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={6} md={2}>
            <TextField
              fullWidth size="small" type="date" label="Du"
              value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
              InputLabelProps={{ shrink: true }} sx={fieldSx}
            />
          </Grid>
          <Grid item xs={6} sm={6} md={2}>
            <TextField
              fullWidth size="small" type="date" label="Au"
              value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
              InputLabelProps={{ shrink: true }} sx={fieldSx}
            />
          </Grid>
          <Grid item xs={12} sm={12} md={2}>
            <Button
              fullWidth startIcon={<FilterList />} onClick={resetFilters}
              sx={{ color: '#94A3B8', borderColor: 'rgba(255,255,255,0.1)', textTransform: 'none' }}
              variant="outlined"
            >
              Réinitialiser
            </Button>
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={showArchived}
                  onChange={(e) => { setShowArchived(e.target.checked); setPage(0); }}
                  sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#2563EB' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#2563EB' } }}
                />
              }
              label={<Typography sx={{ color: '#94A3B8', fontSize: '0.85rem' }}>Afficher les factures archivées</Typography>}
            />
          </Grid>
        </Grid>
        {(search || statusFilter || dateFrom || dateTo) && !loading && (
          <Typography sx={{ color: 'var(--app-text-secondary)', fontSize: '0.78rem', mt: 1.5 }}>
            {filtered.length} résultat{filtered.length !== 1 ? 's' : ''} sur {factures.length}
          </Typography>
        )}
      </Paper>

      {/* Tableau */}
      <Paper sx={{ bgcolor: 'var(--app-bg-card)', border: '1px solid rgba(37,99,235,0.08)', borderRadius: 3, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ p: 3 }}>
            <LinearProgress sx={{ bgcolor: '#1E2536', '& .MuiLinearProgress-bar': { bgcolor: '#2563EB' } }} />
          </Box>
        ) : (
          <>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 900 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}>
                    {['N° Facture', 'Date', 'Client', 'Société', 'Devise', 'Montant TTC', 'Statut', 'Validation', 'Actions'].map(h => (
                      <TableCell key={h} sx={{ color: 'var(--app-text-secondary)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} sx={{ py: 7, textAlign: 'center', borderBottom: 'none' }}>
                        <Receipt sx={{ color: 'var(--app-text-primary)', fontSize: 48, mb: 1 }} />
                        <Typography sx={{ color: 'var(--app-text-secondary)' }}>Aucune facture trouvée</Typography>
                      </TableCell>
                    </TableRow>
                  ) : paginated.map((f) => {
                    const st = getStatus(f.statut || 'En attente');
                    return (
                      <TableRow
                        key={f.id || f._path}
                        sx={{ borderBottom: '1px solid #E5E7EB', '&:hover': { bgcolor: 'rgba(37,99,235,0.04)' } }}
                      >
                        <TableCell sx={{ color: '#2563EB', fontFamily: 'monospace', fontWeight: 600 }}>
                          {f.numero || `#${String(f.id || '').slice(0, 6)}`}
                        </TableCell>
                        <TableCell sx={{ color: '#94A3B8' }}>{fmtDate(f.date_creation)}</TableCell>
                        <TableCell sx={{ color: 'var(--app-text-primary)' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 28, height: 28, bgcolor: 'rgba(59,130,246,0.15)', color: '#3B82F6', fontSize: '0.75rem', fontWeight: 700 }}>
                              {(f.client_nom?.[0] || '?').toUpperCase()}
                            </Avatar>
                            {f.client_nom || '—'}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: '#94A3B8', fontSize: '0.82rem' }}>
                          {getCompanyDisplayName(f)}
                        </TableCell>
                        <TableCell sx={{ color: '#94A3B8', fontWeight: 600 }}>{normalizeCurrency(f.currency)}</TableCell>
                        <TableCell sx={{ color: 'var(--app-text-primary)', fontWeight: 700 }}>{fmtInv(f.total_ttc, f)}</TableCell>
                        <TableCell>
                          <Chip
                            label={f.statut || 'En attente'} size="small" icon={st.icon}
                            sx={{ bgcolor: st.bg, color: st.color, fontWeight: 600, fontSize: '0.7rem', border: `1px solid ${st.color}30`, '& .MuiChip-icon': { color: st.color } }}
                          />
                        </TableCell>
                        <TableCell>
                          {f.validated_by_admin ? (
                            <Tooltip title={`Validée par ${f.validated_by || 'admin'}`}>
                              <CheckCircle sx={{ color: '#22C55E', fontSize: 20 }} />
                            </Tooltip>
                          ) : (
                            <Tooltip title="Non validée"><HourglassEmpty sx={{ color: '#EAB308', fontSize: 20 }} /></Tooltip>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.3 }}>
                            <Tooltip title="Détails">
                              <IconButton size="small" onClick={() => setDetailDialog({ open: true, facture: f })} sx={{ color: '#3B82F6' }}>
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Télécharger PDF">
                              <IconButton size="small" onClick={() => handlePdf(f)} sx={{ color: '#EF4444' }}>
                                <PictureAsPdf fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {f.statut !== 'Payée' && (
                              <Tooltip title="Valider">
                                <IconButton size="small" onClick={() => setConfirmDialog({ open: true, facture: f, action: 'validate' })} sx={{ color: '#22C55E' }}>
                                  <CheckCircle fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {f.statut !== 'Rejetée' && (
                              <Tooltip title="Rejeter">
                                <IconButton size="small" onClick={() => setConfirmDialog({ open: true, facture: f, action: 'reject' })} sx={{ color: '#EAB308' }}>
                                  <Cancel fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Supprimer">
                              <IconButton size="small" onClick={() => setConfirmDialog({ open: true, facture: f, action: 'delete' })} sx={{ color: '#EF4444' }}>
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Par page :"
              sx={{
                color: '#94A3B8', borderTop: '1px solid rgba(255,255,255,0.05)',
                '& .MuiSelect-icon, & .MuiIconButton-root': { color: '#94A3B8' },
              }}
            />
          </>
        )}
      </Paper>

      {/* Dialog détail */}
      <Dialog
        open={detailDialog.open}
        onClose={() => setDetailDialog({ open: false, facture: null })}
        maxWidth="md" fullWidth
        PaperProps={{ sx: { bgcolor: 'var(--app-bg-card)', borderRadius: '16px', border: '1px solid rgba(37,99,235,0.15)' } }}
      >
        <DialogTitle sx={{ color: 'var(--app-text-primary)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: "'Syne', sans-serif" }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Receipt sx={{ color: '#2563EB' }} />
            Facture {detailDialog.facture?.numero}
            {detailDialog.facture && (
              <Chip
                label={detailDialog.facture.statut || 'En attente'} size="small"
                sx={{
                  bgcolor: getStatus(detailDialog.facture.statut).bg,
                  color: getStatus(detailDialog.facture.statut).color,
                  fontWeight: 600, ml: 1,
                }}
              />
            )}
          </Box>
          <IconButton onClick={() => setDetailDialog({ open: false, facture: null })} sx={{ color: 'var(--app-text-secondary)' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>
          {detailDialog.facture && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ color: 'var(--app-text-secondary)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', mb: 0.5 }}>
                    <Person sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />Client
                  </Typography>
                  <Typography sx={{ color: 'var(--app-text-primary)', fontWeight: 600 }}>{detailDialog.facture.client_nom || '—'}</Typography>
                  {detailDialog.facture.client_email && (
                    <Typography sx={{ color: '#94A3B8', fontSize: '0.82rem' }}>{detailDialog.facture.client_email}</Typography>
                  )}
                  {detailDialog.facture.client_tel && (
                    <Typography sx={{ color: '#94A3B8', fontSize: '0.82rem' }}>Tél : {detailDialog.facture.client_tel}</Typography>
                  )}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ color: 'var(--app-text-secondary)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', mb: 0.5 }}>
                    <Event sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />Dates
                  </Typography>
                  <Typography sx={{ color: 'var(--app-text-primary)', fontSize: '0.85rem' }}>Création : <strong>{fmtDate(detailDialog.facture.date_creation)}</strong></Typography>
                  {detailDialog.facture.date_depot && (
                    <Typography sx={{ color: '#94A3B8', fontSize: '0.82rem' }}>Dépôt : {fmtDate(detailDialog.facture.date_depot)}</Typography>
                  )}
                  {detailDialog.facture.date_encaissement && (
                    <Typography sx={{ color: '#22C55E', fontSize: '0.82rem' }}>Encaissement : {fmtDate(detailDialog.facture.date_encaissement)}</Typography>
                  )}
                  {detailDialog.facture.type_virement && (
                    <Typography sx={{ color: '#94A3B8', fontSize: '0.82rem' }}>Mode : {detailDialog.facture.type_virement}</Typography>
                  )}
                </Grid>
              </Grid>

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)', mb: 2 }} />

              <Typography sx={{ color: 'var(--app-text-secondary)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', mb: 1 }}>Articles</Typography>
              <TableContainer sx={{ bgcolor: 'var(--app-bg-deep)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: 'var(--app-text-secondary)', fontWeight: 600, fontSize: '0.72rem' }}>Désignation</TableCell>
                      <TableCell align="center" sx={{ color: 'var(--app-text-secondary)', fontWeight: 600, fontSize: '0.72rem' }}>Qté</TableCell>
                      <TableCell align="right" sx={{ color: 'var(--app-text-secondary)', fontWeight: 600, fontSize: '0.72rem' }}>P.U.</TableCell>
                      <TableCell align="right" sx={{ color: 'var(--app-text-secondary)', fontWeight: 600, fontSize: '0.72rem' }}>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(detailDialog.facture.articles || []).map((a, i) => {
                      const q = Number(a.quantite ?? a.qte ?? 1);
                      const pu = Number(a.prix_unitaire ?? a.prix ?? 0);
                      return (
                        <TableRow key={i}>
                          <TableCell sx={{ color: 'var(--app-text-primary)' }}>{a.designation || a.nom || '—'}</TableCell>
                          <TableCell align="center" sx={{ color: '#94A3B8' }}>{q}</TableCell>
                          <TableCell align="right" sx={{ color: '#94A3B8' }}>{fmtInv(pu, detailDialog.facture)}</TableCell>
                          <TableCell align="right" sx={{ color: 'var(--app-text-primary)', fontWeight: 600 }}>{fmtInv(q * pu, detailDialog.facture)}</TableCell>
                        </TableRow>
                      );
                    })}
                    {(!detailDialog.facture.articles || detailDialog.facture.articles.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} sx={{ color: 'var(--app-text-secondary)', textAlign: 'center' }}>Aucun article</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 2, alignItems: 'flex-end' }}>
                <Typography sx={{ color: '#94A3B8', fontSize: '0.85rem' }}>
                  Total HT : <strong style={{ color: 'var(--app-text-primary)' }}>{fmtInv(detailDialog.facture.total_ht, detailDialog.facture)}</strong>
                </Typography>
                <Typography sx={{ color: '#94A3B8', fontSize: '0.85rem' }}>
                  TVA : <strong style={{ color: 'var(--app-text-primary)' }}>{fmtInv(detailDialog.facture.tva, detailDialog.facture)}</strong>
                </Typography>
                <Typography sx={{ color: '#2563EB', fontSize: '1.2rem', fontWeight: 800 }}>
                  TTC : {fmtInv(detailDialog.facture.total_ttc, detailDialog.facture)}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.05)', p: 2, gap: 1 }}>
          <Button startIcon={<PictureAsPdf />} onClick={() => handlePdf(detailDialog.facture)} sx={{ color: '#EF4444' }}>PDF</Button>
          <Box sx={{ flex: 1 }} />
          <Button onClick={() => setDetailDialog({ open: false, facture: null })} sx={{ color: 'var(--app-text-secondary)' }}>Fermer</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog confirmation */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => !actionLoading && setConfirmDialog({ open: false, facture: null, action: null })}
        maxWidth="xs" fullWidth
        PaperProps={{ sx: { bgcolor: 'var(--app-bg-card)', borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ color: 'var(--app-text-primary)', fontWeight: 700 }}>
          {confirmDialog.action === 'validate' && 'Valider la facture ?'}
          {confirmDialog.action === 'reject' && 'Rejeter la facture ?'}
          {confirmDialog.action === 'delete' && 'Supprimer la facture ?'}
        </DialogTitle>
        <DialogContent>
          <Alert
            severity={confirmDialog.action === 'validate' ? 'success' : confirmDialog.action === 'delete' ? 'error' : 'warning'}
            sx={{ mb: 2, borderRadius: 2 }}
          >
            {confirmDialog.action === 'validate' && `Marquer la facture ${confirmDialog.facture?.numero || ''} comme payée.`}
            {confirmDialog.action === 'reject' && `Marquer la facture ${confirmDialog.facture?.numero || ''} comme rejetée.`}
            {confirmDialog.action === 'delete' && `La facture ${confirmDialog.facture?.numero || ''} sera définitivement supprimée.`}
          </Alert>
          {confirmDialog.facture && (
            <Typography sx={{ color: '#94A3B8', fontSize: '0.85rem' }}>
              Client : <strong style={{ color: 'var(--app-text-primary)' }}>{confirmDialog.facture.client_nom || '—'}</strong><br />
              Montant TTC : <strong style={{ color: '#2563EB' }}>{fmtInv(confirmDialog.facture.total_ttc, confirmDialog.facture)}</strong>
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button disabled={actionLoading} onClick={() => setConfirmDialog({ open: false, facture: null, action: null })} sx={{ color: 'var(--app-text-secondary)' }}>Annuler</Button>
          {confirmDialog.action === 'validate' && (
            <Button disabled={actionLoading} variant="contained" onClick={() => handleValidate(confirmDialog.facture)} sx={{ bgcolor: '#22C55E', '&:hover': { bgcolor: '#16A34A' } }}>
              {actionLoading ? '...' : 'Valider'}
            </Button>
          )}
          {confirmDialog.action === 'reject' && (
            <Button disabled={actionLoading} variant="contained" onClick={() => handleReject(confirmDialog.facture)} sx={{ bgcolor: '#EAB308', color: '#FFFFFF', '&:hover': { bgcolor: '#CA8A04' } }}>
              {actionLoading ? '...' : 'Rejeter'}
            </Button>
          )}
          {confirmDialog.action === 'delete' && (
            <Button disabled={actionLoading} variant="contained" onClick={() => handleDelete(confirmDialog.facture)} sx={{ bgcolor: '#EF4444', '&:hover': { bgcolor: '#DC2626' } }}>
              {actionLoading ? '...' : 'Supprimer'}
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
