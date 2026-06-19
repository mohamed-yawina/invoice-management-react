import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Grid, Card, CardContent, Chip, Snackbar, Alert, LinearProgress, Tooltip,
} from '@mui/material';
import {
  Business, Add, Edit, Delete, Refresh, Close,
} from '@mui/icons-material';
import AdminLayout from '../../components/common/AdminLayout';
import {
  getAllCompanies, createCompany, updateCompany, deleteCompany, ensureDefaultCompany,
} from '../../services/companyService';
import { useCompany } from '../../contexts/CompanyContext';

const emptyForm = { nom: '', adresse: '', tel: '', email: '', ice: '' };

function StatCard({ icon, label, value, color, bg }) {
  return (
    <Card sx={{
      bgcolor: 'var(--app-bg-card)', border: '1px solid rgba(37,99,235,0.08)', borderRadius: 3,
      '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 8px 32px ${color}18` },
      transition: 'transform 0.2s',
    }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '16px !important' }}>
        <Box sx={{ bgcolor: bg, borderRadius: '10px', p: 1.2, color }}>{icon}</Box>
        <Box>
          <Typography sx={{ color: 'var(--app-text-secondary)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase' }}>
            {label}
          </Typography>
          <Typography sx={{ fontWeight: 700, color: 'var(--app-text-primary)', fontSize: '1.5rem' }}>{value}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function ManageCompanies() {
  const { refreshCompanies } = useCompany();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState({ open: false, editId: null, form: emptyForm });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await ensureDefaultCompany();
      setCompanies(await getAllCompanies());
    } catch (e) {
      console.error(e);
      setSnackbar({ open: true, message: 'Erreur de chargement', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => setDialog({ open: true, editId: null, form: { ...emptyForm } });

  const openEdit = (c) => setDialog({
    open: true,
    editId: c.id,
    form: { nom: c.nom || '', adresse: c.adresse || '', tel: c.tel || '', email: c.email || '', ice: c.ice || '' },
  });

  const handleSave = async () => {
    if (!dialog.form.nom?.trim()) {
      setSnackbar({ open: true, message: 'Le nom de la société est requis', severity: 'warning' });
      return;
    }
    setSaving(true);
    try {
      if (dialog.editId) {
        await updateCompany(dialog.editId, dialog.form);
        setSnackbar({ open: true, message: 'Société mise à jour', severity: 'success' });
      } else {
        await createCompany(dialog.form);
        setSnackbar({ open: true, message: 'Société créée', severity: 'success' });
      }
      setDialog({ open: false, editId: null, form: emptyForm });
      await loadData();
      await refreshCompanies();
    } catch (e) {
      setSnackbar({ open: true, message: e.message || 'Erreur', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    try {
      await deleteCompany(confirmDelete.id);
      setSnackbar({ open: true, message: 'Société désactivée', severity: 'success' });
      setConfirmDelete(null);
      await loadData();
      await refreshCompanies();
    } catch (e) {
      setSnackbar({ open: true, message: e.message || 'Erreur suppression', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, color: 'var(--app-text-primary)', fontFamily: "'Syne', sans-serif", fontSize: '1.75rem', mb: 0.5 }}>
            Sociétés
          </Typography>
          <Typography sx={{ color: 'var(--app-text-secondary)' }}>
            Gérez les entités émettrices de factures (multi-société)
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<Refresh />} onClick={loadData} sx={{ color: 'var(--app-text-secondary)' }}>Actualiser</Button>
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}
            sx={{ bgcolor: '#2563EB', color: '#F8FAFC', fontWeight: 700 }}>
            Nouvelle société
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard icon={<Business />} label="Sociétés actives" value={loading ? '—' : companies.length}
            color="#2563EB" bg="rgba(37,99,235,0.12)" />
        </Grid>
      </Grid>

      <Paper sx={{ bgcolor: 'var(--app-bg-card)', border: '1px solid rgba(37,99,235,0.08)', borderRadius: 3, overflow: 'hidden' }}>
        {loading ? (
          <LinearProgress sx={{ bgcolor: '#1E2536', '& .MuiLinearProgress-bar': { bgcolor: '#2563EB' } }} />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}>
                  {['Nom', 'ICE', 'Email', 'Téléphone', 'Ville / Adresse', 'Actions'].map((h) => (
                    <TableCell key={h} sx={{ color: 'var(--app-text-secondary)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {companies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ py: 6, textAlign: 'center', color: 'var(--app-text-secondary)' }}>
                      Aucune société — cliquez sur « Nouvelle société »
                    </TableCell>
                  </TableRow>
                ) : companies.map((c) => (
                  <TableRow key={c.id} sx={{ '&:hover': { bgcolor: 'rgba(37,99,235,0.04)' } }}>
                    <TableCell sx={{ color: 'var(--app-text-primary)', fontWeight: 600 }}>
                      {c.nom}
                      {c.isDefault && (
                        <Chip label="Défaut" size="small" sx={{ ml: 1, height: 20, fontSize: '0.65rem', bgcolor: 'rgba(37,99,235,0.12)', color: '#2563EB' }} />
                      )}
                    </TableCell>
                    <TableCell sx={{ color: '#94A3B8', fontFamily: 'monospace', fontSize: '0.85rem' }}>{c.ice || '—'}</TableCell>
                    <TableCell sx={{ color: '#94A3B8' }}>{c.email || '—'}</TableCell>
                    <TableCell sx={{ color: '#94A3B8' }}>{c.tel || '—'}</TableCell>
                    <TableCell sx={{ color: 'var(--app-text-secondary)', maxWidth: 200 }}>{c.adresse || '—'}</TableCell>
                    <TableCell>
                      <Tooltip title="Modifier">
                        <IconButton size="small" onClick={() => openEdit(c)} sx={{ color: '#2563EB' }}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {!c.isDefault && (
                        <Tooltip title="Désactiver">
                          <IconButton size="small" onClick={() => setConfirmDelete(c)} sx={{ color: '#EF4444' }}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={dialog.open} onClose={() => !saving && setDialog({ open: false, editId: null, form: emptyForm })}
        maxWidth="sm" fullWidth
        PaperProps={{ sx: { bgcolor: 'var(--app-bg-card)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 3 } }}>
        <DialogTitle sx={{ color: 'var(--app-text-primary)', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
          {dialog.editId ? 'Modifier la société' : 'Nouvelle société'}
          <IconButton onClick={() => setDialog({ open: false, editId: null, form: emptyForm })} sx={{ color: 'var(--app-text-secondary)' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Raison sociale *" value={dialog.form.nom}
                onChange={(e) => setDialog((d) => ({ ...d, form: { ...d.form, nom: e.target.value } }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="ICE" value={dialog.form.ice}
                onChange={(e) => setDialog((d) => ({ ...d, form: { ...d.form, ice: e.target.value } }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Adresse" value={dialog.form.adresse}
                onChange={(e) => setDialog((d) => ({ ...d, form: { ...d.form, adresse: e.target.value } }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Téléphone" value={dialog.form.tel}
                onChange={(e) => setDialog((d) => ({ ...d, form: { ...d.form, tel: e.target.value } }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Email" type="email" value={dialog.form.email}
                onChange={(e) => setDialog((d) => ({ ...d, form: { ...d.form, email: e.target.value } }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialog({ open: false, editId: null, form: emptyForm })} sx={{ color: 'var(--app-text-secondary)' }}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving} variant="contained" sx={{ bgcolor: '#2563EB', color: '#F8FAFC' }}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(confirmDelete)} onClose={() => !saving && setConfirmDelete(null)}
        PaperProps={{ sx: { bgcolor: 'var(--app-bg-card)', borderRadius: 3, minWidth: 360 } }}>
        <DialogTitle sx={{ color: 'var(--app-text-primary)' }}>Désactiver {confirmDelete?.nom} ?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#94A3B8' }}>
            La société ne sera plus proposée pour les nouvelles factures. Les factures existantes conservent leurs données.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)} sx={{ color: 'var(--app-text-secondary)' }}>Annuler</Button>
          <Button onClick={handleDelete} disabled={saving} color="error" variant="contained">Désactiver</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
}
