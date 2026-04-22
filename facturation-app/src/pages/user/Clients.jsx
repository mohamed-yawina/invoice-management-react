import React, { useEffect, useState } from 'react';
import { Box, Button, Card, CardContent, Typography, Grid, IconButton, Dialog, TextField, Alert, LinearProgress } from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { db, ref, get, push, set, remove } from '../../services/firebaseService';
import Layout from '../../components/common/Layout';

export default function Clients() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nom: '', email: '', tel: '', adresse: '' });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { loadClients(); }, []);

  const loadClients = async () => {
    setLoading(true);
    try {
      const snapshot = await get(ref(db, 'clients'));
      setClients(snapshot.exists() ? Object.keys(snapshot.val()).map(key => ({ id: key, ...snapshot.val()[key] })) : []);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!form.nom || !form.email) { setError('Nom et email requis'); return; }
    setError('');
    try {
      if (editId) await set(ref(db, `clients/${editId}`), form);
      else { const newRef = push(ref(db, 'clients')); await set(newRef, form); }
      setOpen(false); setForm({ nom: '', email: '', tel: '', adresse: '' }); setEditId(null); loadClients();
    } catch (error) { setError("Erreur lors de l'enregistrement"); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer ce client ?')) { await remove(ref(db, `clients/${id}`)); loadClients(); }
  };

  if (loading) return <Layout><Box sx={{ p: 5 }}><LinearProgress sx={{ bgcolor: '#1E2536' }} /></Box></Layout>;
  return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}><Typography variant="h4" sx={{ fontWeight: 700, color: '#F1F5F9' }}>Clients</Typography><Button variant="contained" startIcon={<Add />} onClick={() => { setEditId(null); setForm({ nom: '', email: '', tel: '', adresse: '' }); setOpen(true); }} sx={{ bgcolor: '#6EE7B7', color: '#0D0F14' }}>Nouveau client</Button></Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Grid container spacing={3}>
        {clients.map(client => (
          <Grid item xs={12} md={6} lg={4} key={client.id}>
            <Card sx={{ bgcolor: '#161B26', border: '1px solid #1E2D3D', borderRadius: 3 }}>
              <CardContent><Typography variant="h6" sx={{ color: '#F1F5F9' }}>{client.nom}</Typography><Typography variant="body2" sx={{ color: '#94A3B8' }}>{client.email}</Typography><Typography variant="body2" sx={{ color: '#94A3B8' }}>{client.tel || 'Non renseigné'}</Typography><Typography variant="body2" sx={{ color: '#94A3B8' }}>{client.adresse || 'Non renseignée'}</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}><IconButton size="small" onClick={() => { setEditId(client.id); setForm(client); setOpen(true); }}><Edit sx={{ color: '#6EE7B7' }} /></IconButton><IconButton size="small" onClick={() => handleDelete(client.id)}><Delete sx={{ color: '#EF4444' }} /></IconButton></Box></CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Dialog open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { bgcolor: '#161B26', borderRadius: 3, p: 2, minWidth: 400 } }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#F1F5F9' }}>{editId ? 'Modifier' : 'Ajouter'} un client</Typography>
        <TextField fullWidth label="Nom *" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} sx={{ mb: 2 }} />
        <TextField fullWidth label="Email *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} sx={{ mb: 2 }} />
        <TextField fullWidth label="Téléphone" value={form.tel} onChange={(e) => setForm({ ...form, tel: e.target.value })} sx={{ mb: 2 }} />
        <TextField fullWidth label="Adresse" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', gap: 2 }}><Button variant="outlined" fullWidth onClick={() => setOpen(false)}>Annuler</Button><Button variant="contained" fullWidth onClick={handleSave} sx={{ bgcolor: '#6EE7B7', color: '#0D0F14' }}>Enregistrer</Button></Box>
      </Dialog>
    </Layout>
  );
}