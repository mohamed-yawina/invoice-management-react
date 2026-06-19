import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Button, Card, CardContent, Typography, Grid, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Alert, LinearProgress,
  InputAdornment, Snackbar, Avatar, Tooltip, Paper, Chip,
} from '@mui/material';
import {
  Edit, Delete, Search, Person, Email, Phone, Home, People as PeopleIcon,
  ContactMail, Description, PersonAdd,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { db, ref, get, push, set, remove, getAllFacturesFlat } from '../../services/firebaseService';
import Layout from '../../components/common/Layout';
import { useThemeMode } from '../../contexts/ThemeModeContext';

const EMPTY = { nom: '', email: '', tel: '', adresse: '' };
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Palette pour avatars — couleurs variables selon la 1ère lettre
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #2563EB, #475569)',
  'linear-gradient(135deg, #A855F7, #EC4899)',
  'linear-gradient(135deg, #F97316, #EF4444)',
  'linear-gradient(135deg, #14B8A6, #3B82F6)',
  'linear-gradient(135deg, #EAB308, #F97316)',
  'linear-gradient(135deg, #8B5CF6, #6366F1)',
];

const getAvatarGradient = (str = '') => {
  const hash = str.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
};

export default function Clients() {
  const { palette, gradients } = useThemeMode();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [factureCount, setFactureCount] = useState({}); // clientId -> nb factures
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState({ open: false, msg: '', severity: 'success' });

  useEffect(() => { loadClients(); }, []);

  const loadClients = async () => {
    setLoading(true);
    try {
      const [snapshot, factures] = await Promise.all([
        get(ref(db, 'clients')),
        getAllFacturesFlat(),
      ]);
      setClients(
        snapshot.exists()
          ? Object.keys(snapshot.val()).map((key) => ({ id: key, ...snapshot.val()[key] }))
          : []
      );
      const counts = {};
      factures.forEach((f) => {
        if (f.client_id) counts[f.client_id] = (counts[f.client_id] || 0) + 1;
      });
      setFactureCount(counts);
    } catch (error) {
      console.error(error);
      setToast({ open: true, msg: 'Erreur de chargement', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      (c.nom || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.tel || '').toLowerCase().includes(q) ||
      (c.adresse || '').toLowerCase().includes(q)
    );
  }, [clients, search]);

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY);
    setError('');
    setOpen(true);
  };
  const openEdit = (client) => {
    setEditId(client.id);
    setForm({
      nom: client.nom || '',
      email: client.email || '',
      tel: client.tel || '',
      adresse: client.adresse || '',
    });
    setError('');
    setOpen(true);
  };

  const validate = () => {
    if (!form.nom.trim()) return 'Le nom est requis';
    if (!form.email.trim()) return "L'email est requis";
    if (!EMAIL_REGEX.test(form.email.trim())) return 'Format email invalide';
    if (form.tel && !/^[\d\s+()-]{6,}$/.test(form.tel.trim())) return 'Téléphone invalide';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setSaving(true);
    try {
      const payload = {
        nom: form.nom.trim(),
        email: form.email.trim(),
        tel: form.tel.trim(),
        adresse: form.adresse.trim(),
        updated_at: new Date().toISOString(),
      };
      if (editId) {
        await set(ref(db, `clients/${editId}`), payload);
        setToast({ open: true, msg: 'Client mis à jour', severity: 'success' });
      } else {
        const newRef = push(ref(db, 'clients'));
        await set(newRef, { ...payload, created_at: new Date().toISOString() });
        setToast({ open: true, msg: 'Client ajouté', severity: 'success' });
      }
      setOpen(false);
      setForm(EMPTY);
      setEditId(null);
      await loadClients();
    } catch (e) {
      console.error(e);
      setError("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await remove(ref(db, `clients/${confirmDelete.id}`));
      setConfirmDelete(null);
      setToast({ open: true, msg: 'Client supprimé', severity: 'success' });
      await loadClients();
    } catch (e) {
      console.error(e);
      setToast({ open: true, msg: 'Erreur suppression', severity: 'error' });
    }
  };

  const initials = (nom = '') =>
    nom.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('') || 'C';

  const totalFactures = Object.values(factureCount).reduce((s, n) => s + n, 0);
  const avecFactures = Object.keys(factureCount).length;

  if (loading) {
    return (
      <Layout>
        <Box sx={{ p: 5 }}><LinearProgress /></Box>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* ─── HEADER ──────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          position: 'relative', overflow: 'hidden', borderRadius: 4,
          p: { xs: 3, md: 4 }, mb: 3,
          background: gradients.hero,
          border: '1px solid rgba(37,99,235,0.15)',
          '&::before': {
            content: '""', position: 'absolute', top: -60, right: -40,
            width: 240, height: 240, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(168,85,247,0.12), transparent 60%)',
          },
          '&::after': {
            content: '""', position: 'absolute', bottom: -40, left: 200,
            width: 160, height: 160, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37,99,235,0.1), transparent 60%)',
          },
        }}
      >
        <Grid container spacing={2} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Box sx={{
                width: 48, height: 48, borderRadius: 2,
                background: 'linear-gradient(135deg, #A855F7, #6366F1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(168,85,247,0.3)',
              }}>
                <ContactMail sx={{ color: '#FFF', fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ color: palette.text.primary, fontWeight: 800, lineHeight: 1.1 }}>
                  Clients
                </Typography>
                <Typography sx={{ color: palette.text.secondary, fontSize: 14 }}>
                  {clients.length} client{clients.length > 1 ? 's' : ''} · {totalFactures} facture{totalFactures > 1 ? 's' : ''} créée{totalFactures > 1 ? 's' : ''}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Button variant="contained" size="large" startIcon={<PersonAdd />} onClick={openCreate}>
              Nouveau client
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* ─── STATS STRIP ────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={4}>
          <Card sx={{ borderRadius: 3, background: gradients.card }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
              <Box sx={{ bgcolor: 'rgba(168,85,247,0.12)', borderRadius: 2, p: 1.25, color: '#A855F7', display: 'flex' }}>
                <PeopleIcon />
              </Box>
              <Box>
                <Typography sx={{ color: palette.text.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Total clients
                </Typography>
                <Typography variant="h5" sx={{ color: palette.text.primary, fontWeight: 800 }}>
                  {clients.length}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card sx={{ borderRadius: 3, background: gradients.card }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
              <Box sx={{ bgcolor: 'rgba(37,99,235,0.12)', borderRadius: 2, p: 1.25, color: palette.accent.mint, display: 'flex' }}>
                <Description />
              </Box>
              <Box>
                <Typography sx={{ color: palette.text.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Factures créées
                </Typography>
                <Typography variant="h5" sx={{ color: palette.text.primary, fontWeight: 800 }}>
                  {totalFactures}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card sx={{ borderRadius: 3, background: gradients.card }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
              <Box sx={{ bgcolor: 'rgba(59,130,246,0.12)', borderRadius: 2, p: 1.25, color: '#3B82F6', display: 'flex' }}>
                <PersonAdd />
              </Box>
              <Box>
                <Typography sx={{ color: palette.text.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Clients actifs
                </Typography>
                <Typography variant="h5" sx={{ color: palette.text.primary, fontWeight: 800 }}>
                  {avecFactures}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ─── SEARCH BAR ──────────────────────── */}
      <Box sx={{ mb: 3 }}>
        <TextField
          size="medium" fullWidth placeholder="Rechercher un client (nom, email, téléphone)..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: palette.text.muted }} /></InputAdornment> }}
          sx={{ maxWidth: 600 }}
        />
      </Box>

      {/* ─── GRID DES CLIENTS ────────────────── */}
      {filtered.length === 0 ? (
        <Paper sx={{ borderRadius: 3, p: 6, textAlign: 'center', background: gradients.card }}>
          <Box sx={{
            width: 96, height: 96, mx: 'auto', mb: 2,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(168,85,247,0.12), transparent 60%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <PeopleIcon sx={{ fontSize: 48, color: '#A855F7' }} />
          </Box>
          <Typography sx={{ color: palette.text.primary, fontWeight: 700, fontSize: 18, mb: 0.5 }}>
            {search ? 'Aucun client trouvé' : 'Aucun client enregistré'}
          </Typography>
          <Typography sx={{ color: palette.text.secondary, mb: 3 }}>
            {search
              ? 'Essayez de modifier vos critères de recherche'
              : 'Commencez par enregistrer votre premier client pour créer des factures'}
          </Typography>
          {!search && (
            <Button variant="contained" startIcon={<PersonAdd />} onClick={openCreate}>
              Créer mon premier client
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={2.5}>
          {filtered.map((client) => {
            const nbFactures = factureCount[client.id] || 0;
            return (
              <Grid item xs={12} sm={6} lg={4} key={client.id}>
                <Card sx={{
                  position: 'relative', overflow: 'visible', borderRadius: 3,
                  background: gradients.card,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: 'rgba(37,99,235,0.3)',
                    boxShadow: '0 16px 40px rgba(0,0,0,0.3)',
                  },
                }}>
                  {nbFactures > 0 && (
                    <Chip
                      size="small"
                      label={`${nbFactures} facture${nbFactures > 1 ? 's' : ''}`}
                      sx={{
                        position: 'absolute', top: 12, right: 12, zIndex: 2,
                        bgcolor: 'rgba(37,99,235,0.15)',
                        color: palette.accent.mint,
                        fontWeight: 700, fontSize: 11,
                        border: '1px solid rgba(37,99,235,0.25)',
                      }}
                    />
                  )}
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Avatar sx={{
                        width: 52, height: 52, fontWeight: 800, fontSize: 18,
                        background: getAvatarGradient(client.nom || client.id),
                        color: '#FFF',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      }}>
                        {initials(client.nom)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0, pt: 0.5 }}>
                        <Typography sx={{
                          color: palette.text.primary, fontWeight: 700, fontSize: 16,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {client.nom}
                        </Typography>
                        <Typography sx={{ color: palette.text.muted, fontSize: 11, fontFamily: 'monospace' }}>
                          #{client.id.slice(0, 8)}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{
                      display: 'flex', flexDirection: 'column', gap: 1,
                      p: 1.5, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, mb: 2,
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                          width: 28, height: 28, borderRadius: '50%',
                          bgcolor: 'rgba(59,130,246,0.12)', color: '#3B82F6',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <Email sx={{ fontSize: 14 }} />
                        </Box>
                        <Typography sx={{
                          color: palette.text.secondary, fontSize: 13,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1,
                        }}>
                          {client.email || <em style={{ color: palette.text.faint }}>Non renseigné</em>}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                          width: 28, height: 28, borderRadius: '50%',
                          bgcolor: 'rgba(234,179,8,0.12)', color: '#EAB308',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <Phone sx={{ fontSize: 14 }} />
                        </Box>
                        <Typography sx={{ color: palette.text.secondary, fontSize: 13 }}>
                          {client.tel || <em style={{ color: palette.text.faint }}>Non renseigné</em>}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                        <Box sx={{
                          width: 28, height: 28, borderRadius: '50%',
                          bgcolor: 'rgba(37,99,235,0.12)', color: palette.accent.mint,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <Home sx={{ fontSize: 14 }} />
                        </Box>
                        <Typography sx={{ color: palette.text.secondary, fontSize: 13, flex: 1 }}>
                          {client.adresse || <em style={{ color: palette.text.faint }}>Non renseignée</em>}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        fullWidth size="small" startIcon={<Description sx={{ fontSize: 16 }} />}
                        onClick={() => navigate('/app/invoices/new')}
                        sx={{
                          color: palette.accent.mint,
                          bgcolor: 'rgba(37,99,235,0.06)',
                          '&:hover': { bgcolor: 'rgba(37,99,235,0.12)' },
                        }}>
                        Facturer
                      </Button>
                      <Tooltip title="Modifier">
                        <IconButton size="small" onClick={() => openEdit(client)}
                          sx={{
                            color: '#3B82F6', bgcolor: 'rgba(59,130,246,0.08)',
                            '&:hover': { bgcolor: 'rgba(59,130,246,0.18)' },
                          }}>
                          <Edit sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Supprimer">
                        <IconButton size="small" onClick={() => setConfirmDelete(client)}
                          sx={{
                            color: '#EF4444', bgcolor: 'rgba(239,68,68,0.08)',
                            '&:hover': { bgcolor: 'rgba(239,68,68,0.18)' },
                          }}>
                          <Delete sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* ─── DIALOG AJOUT/ÉDITION ────────────── */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(37,99,235,0.06))',
          borderBottom: `1px solid ${palette.line.subtle}`,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: 2,
              background: 'linear-gradient(135deg, #A855F7, #6366F1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {editId ? <Edit sx={{ color: '#FFF', fontSize: 20 }} /> : <PersonAdd sx={{ color: '#FFF', fontSize: 20 }} />}
            </Box>
            <Box>
              <Typography sx={{ color: palette.text.primary, fontWeight: 700 }}>
                {editId ? 'Modifier le client' : 'Nouveau client'}
              </Typography>
              <Typography sx={{ color: palette.text.secondary, fontSize: 12 }}>
                {editId ? 'Mettez à jour les informations' : 'Enregistrer un nouveau contact'}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Nom *" value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ color: palette.text.muted, fontSize: 18 }} /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth type="email" label="Email *" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ color: palette.text.muted, fontSize: 18 }} /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Téléphone" value={form.tel}
                onChange={(e) => setForm({ ...form, tel: e.target.value })}
                InputProps={{ startAdornment: <InputAdornment position="start"><Phone sx={{ color: palette.text.muted, fontSize: 18 }} /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label="Adresse" value={form.adresse}
                onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                InputProps={{ startAdornment: <InputAdornment position="start"><Home sx={{ color: palette.text.muted, fontSize: 18 }} /></InputAdornment> }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: palette.text.secondary }}>Annuler</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement...' : editId ? 'Mettre à jour' : 'Enregistrer'}
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
          Supprimer le client ?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: palette.text.secondary }}>
            Le client <strong style={{ color: palette.text.primary }}>{confirmDelete?.nom}</strong> sera supprimé définitivement.
          </Typography>
          {factureCount[confirmDelete?.id] > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Ce client a <strong>{factureCount[confirmDelete?.id]}</strong> facture(s) associée(s). Elles ne seront pas supprimées.
            </Alert>
          )}
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
