import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Paper, Button, Grid, Card, CardContent, CardActions,
  Chip, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert, Snackbar, LinearProgress, Divider,
} from '@mui/material';
import {
  Archive, Unarchive, Refresh, TableView, CalendarMonth, Receipt,
} from '@mui/icons-material';
import AdminLayout from '../../components/common/AdminLayout';
import { useCompany } from '../../contexts/CompanyContext';
import { db, ref, get, getAllFacturesFlat } from '../../services/firebaseService';
import {
  groupFacturesByYear, getFacturesByYear,
  archiveInvoicesByYear, unarchiveInvoicesByYear,
} from '../../services/archiveService';
import { exportInvoicesToExcel } from '../../services/excelService';
import { formatMoney, normalizeCurrency } from '../../utils/currency';

const fmtMad = (n) => formatMoney(n, 'MAD');
const fmtInv = (n, f) => formatMoney(n, f?.currency);
const currentYear = new Date().getFullYear();

function YearCard({ data, onArchive, onUnarchive, onExport, loading }) {
  const fullyArchived = data.active === 0 && data.total > 0;
  const partiallyArchived = data.archived > 0 && data.active > 0;

  return (
    <Card sx={{
      bgcolor: 'var(--app-bg-card)', border: '1px solid rgba(37,99,235,0.08)',
      borderRadius: 3, transition: 'all 0.2s',
      '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 32px rgba(59,130,246,0.12)' },
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ bgcolor: 'rgba(59,130,246,0.12)', borderRadius: '10px', p: 1.2, color: '#3B82F6' }}>
              <CalendarMonth />
            </Box>
            <Box>
              <Typography sx={{ color: 'var(--app-text-primary)', fontWeight: 800, fontSize: '1.4rem', fontFamily: "'Syne', sans-serif" }}>
                {data.year}
              </Typography>
              <Typography sx={{ color: 'var(--app-text-secondary)', fontSize: '0.75rem' }}>
                {data.total} facture{data.total > 1 ? 's' : ''}
              </Typography>
            </Box>
          </Box>
          {fullyArchived ? (
            <Chip label="Archivée" size="small" icon={<Archive sx={{ fontSize: '14px !important' }} />}
              sx={{ bgcolor: 'rgba(37,99,235,0.12)', color: '#2563EB', fontWeight: 600, fontSize: '0.7rem' }} />
          ) : partiallyArchived ? (
            <Chip label="Partielle" size="small"
              sx={{ bgcolor: 'rgba(234,179,8,0.12)', color: '#EAB308', fontWeight: 600, fontSize: '0.7rem' }} />
          ) : (
            <Chip label="Active" size="small"
              sx={{ bgcolor: 'rgba(59,130,246,0.12)', color: '#3B82F6', fontWeight: 600, fontSize: '0.7rem' }} />
          )}
        </Box>

        <Grid container spacing={1} sx={{ mb: 1 }}>
          <Grid item xs={6}>
            <Typography sx={{ color: 'var(--app-text-secondary)', fontSize: '0.68rem', textTransform: 'uppercase' }}>Total TTC (MAD)</Typography>
            <Typography sx={{ color: 'var(--app-text-primary)', fontWeight: 700 }}>{fmtMad(data.montantTTC)}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography sx={{ color: 'var(--app-text-secondary)', fontSize: '0.68rem', textTransform: 'uppercase' }}>Encaissé (MAD)</Typography>
            <Typography sx={{ color: '#22C55E', fontWeight: 700 }}>{fmtMad(data.montantPaye)}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography sx={{ color: 'var(--app-text-secondary)', fontSize: '0.68rem' }}>Archivées</Typography>
            <Typography sx={{ color: '#2563EB', fontWeight: 600 }}>{data.archived}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography sx={{ color: 'var(--app-text-secondary)', fontSize: '0.68rem' }}>Actives</Typography>
            <Typography sx={{ color: '#3B82F6', fontWeight: 600 }}>{data.active}</Typography>
          </Grid>
        </Grid>
      </CardContent>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

      <CardActions sx={{ px: 2, py: 1.5, flexWrap: 'wrap', gap: 1 }}>
        <Button size="small" startIcon={<TableView />} disabled={loading || data.total === 0}
          onClick={() => onExport(data.year, false)}
          sx={{ color: '#2563EB', textTransform: 'none', fontWeight: 600 }}>
          Excel (tout)
        </Button>
        {data.archived > 0 && (
          <Button size="small" startIcon={<TableView />} disabled={loading}
            onClick={() => onExport(data.year, true)}
            sx={{ color: '#94A3B8', textTransform: 'none' }}>
            Excel archivées
          </Button>
        )}
        {data.active > 0 && (
          <Button size="small" variant="contained" startIcon={<Archive />} disabled={loading}
            onClick={() => onArchive(data.year)}
            sx={{
              bgcolor: '#3B82F6', color: '#fff', textTransform: 'none', fontWeight: 600,
              ml: 'auto', borderRadius: '8px',
              '&:hover': { bgcolor: '#2563EB' },
            }}>
            Archiver {data.year}
          </Button>
        )}
        {data.archived > 0 && (
          <Button size="small" startIcon={<Unarchive />} disabled={loading}
            onClick={() => onUnarchive(data.year)}
            sx={{ color: '#94A3B8', textTransform: 'none' }}>
            Désarchiver
          </Button>
        )}
      </CardActions>
    </Card>
  );
}

export default function AnnualArchive() {
  const { filterItems } = useCompany();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [factures, setFactures] = useState([]);
  const [confirmAction, setConfirmAction] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getAllFacturesFlat();
      const clientsSnap = await get(ref(db, 'clients'));
      const clients = clientsSnap.val() || {};
      const enriched = list.map((f) => {
        const c = f.client_id && clients[f.client_id];
        return c ? { ...f, client_nom: c.nom, client_email: c.email } : f;
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

  const scopedFactures = useMemo(() => filterItems(factures), [factures, filterItems]);

  const yearStats = useMemo(() => groupFacturesByYear(scopedFactures), [scopedFactures]);

  const archivedFactures = useMemo(
    () => scopedFactures.filter((f) => f.archived).sort(
      (a, b) => new Date(b.archived_at || 0) - new Date(a.archived_at || 0)
    ),
    [scopedFactures]
  );

  const handleExport = (year, archivedOnly) => {
    const list = getFacturesByYear(factures, year, archivedOnly ? { archivedOnly: true } : {});
    if (!list.length) {
      setSnackbar({ open: true, message: 'Aucune facture à exporter', severity: 'warning' });
      return;
    }
    const suffix = archivedOnly ? '_archivees' : '';
    exportInvoicesToExcel(list, `factures_${year}${suffix}.xlsx`, `Factures ${year}`);
    setSnackbar({ open: true, message: `Export Excel : ${list.length} facture(s)`, severity: 'success' });
  };

  const handleConfirmArchive = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      const count = await archiveInvoicesByYear(confirmAction.year);
      setSnackbar({
        open: true,
        message: count ? `${count} facture(s) de ${confirmAction.year} archivée(s)` : 'Aucune facture à archiver',
        severity: count ? 'success' : 'info',
      });
      setConfirmAction(null);
      loadData();
    } catch (e) {
      console.error(e);
      setSnackbar({ open: true, message: 'Erreur lors de l\'archivage', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnarchive = async (year) => {
    setActionLoading(true);
    try {
      const count = await unarchiveInvoicesByYear(year);
      setSnackbar({
        open: true,
        message: count ? `${count} facture(s) désarchivée(s)` : 'Aucune facture archivée',
        severity: count ? 'success' : 'info',
      });
      loadData();
    } catch (e) {
      console.error(e);
      setSnackbar({ open: true, message: 'Erreur lors du désarchivage', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const totalArchived = factures.filter((f) => f.archived).length;

  return (
    <AdminLayout>
      <Box sx={{ mb: { xs: 3, md: 4 }, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{
            fontWeight: 800,
            background: 'linear-gradient(135deg, #2563EB 0%, #475569 100%)',
            backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent',
            mb: 0.5, fontFamily: "'Syne', sans-serif", letterSpacing: '-0.03em',
            fontSize: { xs: '1.4rem', md: '1.9rem' },
          }}>
            Archivage annuel
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--app-text-secondary)' }}>
            Clôturez et exportez les factures par année fiscale
          </Typography>
        </Box>
        <Tooltip title="Actualiser">
          <span>
            <IconButton onClick={loadData} disabled={loading || actionLoading} sx={{
              color: '#2563EB', bgcolor: 'rgba(37,99,235,0.08)',
              border: '1px solid rgba(37,99,235,0.2)', borderRadius: '10px',
            }}>
              <Refresh sx={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1, bgcolor: 'rgba(37,99,235,0.08)', '& .MuiLinearProgress-bar': { bgcolor: '#2563EB' } }} />}

      <Alert severity="info" sx={{
        mb: 3, bgcolor: 'rgba(59,130,246,0.08)', color: '#94A3B8',
        border: '1px solid rgba(59,130,246,0.2)', borderRadius: 2,
        '& .MuiAlert-icon': { color: '#3B82F6' },
      }}>
        L&apos;archivage marque les factures comme clôturées. Elles disparaissent des listes actives
        mais restent consultables ici et exportables en Excel.
        {totalArchived > 0 && ` (${totalArchived} facture(s) archivée(s) au total)`}
      </Alert>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: 'var(--app-bg-card)', border: '1px solid rgba(37,99,235,0.08)', borderRadius: 3 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ bgcolor: 'rgba(59,130,246,0.12)', borderRadius: '10px', p: 1.2, color: '#3B82F6' }}>
                <Receipt />
              </Box>
              <Box>
                <Typography sx={{ color: 'var(--app-text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Années</Typography>
                <Typography sx={{ color: 'var(--app-text-primary)', fontWeight: 700, fontSize: '1.5rem' }}>{yearStats.length}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: 'var(--app-bg-card)', border: '1px solid rgba(37,99,235,0.08)', borderRadius: 3 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ bgcolor: 'rgba(37,99,235,0.12)', borderRadius: '10px', p: 1.2, color: '#2563EB' }}>
                <Archive />
              </Box>
              <Box>
                <Typography sx={{ color: 'var(--app-text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Archivées</Typography>
                <Typography sx={{ color: 'var(--app-text-primary)', fontWeight: 700, fontSize: '1.5rem' }}>{totalArchived}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {yearStats.length === 0 && !loading ? (
        <Paper sx={{ bgcolor: 'var(--app-bg-card)', border: '1px solid rgba(37,99,235,0.08)', borderRadius: 3, p: 4, textAlign: 'center' }}>
          <Typography sx={{ color: 'var(--app-text-secondary)' }}>Aucune facture disponible pour l&apos;archivage.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {yearStats.map((data) => (
            <Grid item xs={12} sm={6} lg={4} key={data.year}>
              <YearCard
                data={data}
                loading={loading || actionLoading}
                onArchive={(year) => setConfirmAction({ type: 'archive', year })}
                onUnarchive={handleUnarchive}
                onExport={handleExport}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {archivedFactures.length > 0 && (
        <Paper sx={{ bgcolor: 'var(--app-bg-card)', border: '1px solid rgba(37,99,235,0.08)', borderRadius: 3, mt: 4, overflow: 'hidden' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <Typography sx={{ color: 'var(--app-text-primary)', fontWeight: 700 }}>Dernières factures archivées</Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { color: 'var(--app-text-secondary)', fontWeight: 600, fontSize: '0.72rem', borderColor: 'rgba(255,255,255,0.06)' } }}>
                  <TableCell>N° Facture</TableCell>
                  <TableCell>Année</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Devise</TableCell>
                  <TableCell align="right">TTC</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Archivée le</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {archivedFactures.slice(0, 15).map((f) => (
                  <TableRow key={f._path || f.id} sx={{ '& td': { color: '#CBD5E1', borderColor: 'rgba(255,255,255,0.04)', fontSize: '0.85rem' } }}>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{f.numero}</TableCell>
                    <TableCell>{f.archive_year || '—'}</TableCell>
                    <TableCell>{f.client_nom || f.client_id || '—'}</TableCell>
                    <TableCell>{normalizeCurrency(f.currency)}</TableCell>
                    <TableCell align="right">{fmtInv(f.total_ttc, f)}</TableCell>
                    <TableCell>
                      <Chip label={f.statut || 'En attente'} size="small"
                        sx={{ height: 22, fontSize: '0.68rem', bgcolor: 'rgba(37,99,235,0.1)', color: '#2563EB' }} />
                    </TableCell>
                    <TableCell>{f.archived_at ? new Date(f.archived_at).toLocaleDateString('fr-FR') : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Dialog open={Boolean(confirmAction)} onClose={() => !actionLoading && setConfirmAction(null)}
        PaperProps={{ sx: { bgcolor: 'var(--app-bg-card)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 3, minWidth: 360 } }}>
        <DialogTitle sx={{ color: 'var(--app-text-primary)', fontWeight: 700 }}>
          Confirmer l&apos;archivage {confirmAction?.year}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#94A3B8', fontSize: '0.9rem' }}>
            Toutes les factures non archivées de {confirmAction?.year} seront marquées comme archivées
            et retirées des listes actives.
          </Typography>
          {confirmAction?.year === currentYear && (
            <Alert severity="warning" sx={{ mt: 2, bgcolor: 'rgba(234,179,8,0.08)', color: '#EAB308', border: '1px solid rgba(234,179,8,0.2)' }}>
              Vous archivez l&apos;année en cours — les nouvelles factures resteront visibles jusqu&apos;à un nouvel archivage.
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmAction(null)} disabled={actionLoading} sx={{ color: 'var(--app-text-secondary)' }}>
            Annuler
          </Button>
          <Button variant="contained" startIcon={<Archive />} onClick={handleConfirmArchive} disabled={actionLoading}
            sx={{ bgcolor: '#3B82F6', textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#2563EB' } }}>
            {actionLoading ? 'Archivage…' : 'Archiver'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ bgcolor: 'var(--app-bg-card)', border: '1px solid rgba(37,99,235,0.2)' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
}
