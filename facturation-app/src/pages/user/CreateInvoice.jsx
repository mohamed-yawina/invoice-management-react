import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, TextField, Button, MenuItem, Grid, IconButton, Alert } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { db, ref, get, push, set } from '../../services/firebaseService';
import { jsonService } from '../../services/jsonService';
import { calculateSimple, calculateWithLineDiscount, calculateWithGlobalDiscount, calculateWithCategoryVAT } from '../../utils/calculations';

export default function CreateInvoice() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ clientId: '', numero: `F-${Date.now().toString().slice(-6)}`, method: 'simple', globalDiscount: 0 });
  const [items, setItems] = useState([{ designation: '', qte: 1, prix: 0, remise: 0, categorie_id: null }]);
  const [result, setResult] = useState({ totalHT: 0, tva: 0, totalTTC: 0 });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculateTotals();
  }, [items, form.method, form.globalDiscount]);

  const loadData = async () => {
    try {
      const [clientsData, articlesData, categoriesData] = await Promise.all([
        get(ref(db, 'clients')),
        jsonService.getArticles(),
        jsonService.getCategories()
      ]);
      setClients(clientsData.val() ? Object.values(clientsData.val()) : []);
      setArticles(articlesData);
      setCategories(categoriesData);
    } catch (error) { console.error(error); }
  };

  const calculateTotals = () => {
    const validItems = items.filter(i => i.qte > 0 && i.prix > 0);
    if (validItems.length === 0) { setResult({ totalHT: 0, tva: 0, totalTTC: 0 }); return; }
    let totals;
    switch (form.method) {
      case 'lineDiscount': totals = calculateWithLineDiscount(validItems); break;
      case 'globalDiscount': totals = calculateWithGlobalDiscount(validItems, form.globalDiscount); break;
      case 'categoryVAT': totals = calculateWithCategoryVAT(validItems, categories); break;
      default: totals = calculateSimple(validItems);
    }
    setResult(totals);
  };

  const addItem = () => setItems([...items, { designation: '', qte: 1, prix: 0, remise: 0, categorie_id: null }]);
  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx, field, value) => { const newItems = [...items]; newItems[idx][field] = value; setItems(newItems); };

  const handleSubmit = async () => {
    if (!form.clientId || items.length === 0) { alert('Veuillez remplir tous les champs'); return; }
    setLoading(true);
    try {
      const invoice = {
        numero: form.numero,
        date_creation: new Date().toISOString(),
        client_id: form.clientId,
        articles: items.filter(i => i.qte > 0 && i.prix > 0),
        total_ht: result.totalHT,
        tva: result.tva,
        total_ttc: result.totalTTC,
        statut: 'En attente',
        validated_by_admin: false,
        method: form.method,
        globalDiscount: form.globalDiscount || 0
      };
      await push(ref(db, 'factures'), invoice);
      navigate('/app/invoices');
    } catch (error) { console.error(error); alert('Erreur lors de la création'); }
    finally { setLoading(false); }
  };

  return (
    <Layout>
      <Typography variant="h4" sx={{ fontWeight: 700, color: '#F1F5F9', mb: 3 }}>Créer une facture</Typography>
      <Paper sx={{ bgcolor: '#161B26', border: '1px solid #1E2D3D', borderRadius: 3, p: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}><TextField select fullWidth label="Client" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}><MenuItem value="">Sélectionner un client</MenuItem>{clients.map(c => <MenuItem key={c.id} value={c.id}>{c.nom}</MenuItem>)}</TextField></Grid>
          <Grid item xs={12} md={6}><TextField fullWidth label="N° Facture" value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} /></Grid>
          <Grid item xs={12} md={4}><TextField select fullWidth label="Méthode de calcul" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}><MenuItem value="simple">Simple HT + TVA (20%)</MenuItem><MenuItem value="lineDiscount">Remise par ligne</MenuItem><MenuItem value="globalDiscount">Remise globale</MenuItem><MenuItem value="categoryVAT">TVA par catégorie</MenuItem></TextField></Grid>
          {form.method === 'globalDiscount' && <Grid item xs={12} md={4}><TextField fullWidth label="Remise globale (%)" type="number" value={form.globalDiscount} onChange={(e) => setForm({ ...form, globalDiscount: parseFloat(e.target.value) || 0 })} /></Grid>}
        </Grid>

        <Typography variant="h6" sx={{ color: '#F1F5F9', mt: 3, mb: 2 }}>Articles</Typography>
        {items.map((item, idx) => (
          <Box key={idx} sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            {form.method === 'categoryVAT' ? <TextField select sx={{ flex: 2 }} label="Article" value={item.designation} onChange={(e) => { const art = articles.find(a => a.designation === e.target.value); updateItem(idx, 'designation', e.target.value); updateItem(idx, 'prix', art?.prix_unitaire || 0); updateItem(idx, 'categorie_id', art?.categorie_id || null); }}><MenuItem value="">Sélectionner</MenuItem>{articles.map(a => <MenuItem key={a.id} value={a.designation}>{a.designation}</MenuItem>)}</TextField> : <TextField sx={{ flex: 2 }} label="Désignation" value={item.designation} onChange={(e) => updateItem(idx, 'designation', e.target.value)} />}
            <TextField sx={{ flex: 1 }} label="Qté" type="number" value={item.qte} onChange={(e) => updateItem(idx, 'qte', parseFloat(e.target.value) || 0)} />
            <TextField sx={{ flex: 1 }} label="Prix unitaire" type="number" value={item.prix} onChange={(e) => updateItem(idx, 'prix', parseFloat(e.target.value) || 0)} />
            {form.method === 'lineDiscount' && <TextField sx={{ flex: 1 }} label="Remise (%)" type="number" value={item.remise} onChange={(e) => updateItem(idx, 'remise', parseFloat(e.target.value) || 0)} />}
            <IconButton onClick={() => removeItem(idx)}><Delete sx={{ color: '#EF4444' }} /></IconButton>
          </Box>
        ))}
        <Button startIcon={<Add />} onClick={addItem} sx={{ color: '#6EE7B7', mb: 3 }}>Ajouter un article</Button>

        <Alert severity="info" sx={{ mb: 2, bgcolor: '#1E2536' }}><Typography variant="body2">Total HT: {result.totalHT.toLocaleString()} DH | TVA: {result.tva.toLocaleString()} DH | Total TTC: <strong>{result.totalTTC.toLocaleString()} DH</strong></Typography></Alert>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}><Button variant="outlined" onClick={() => navigate('/app/invoices')}>Annuler</Button><Button variant="contained" disabled={loading} onClick={handleSubmit} sx={{ bgcolor: '#6EE7B7', color: '#0D0F14' }}>{loading ? 'Création...' : 'Créer la facture'}</Button></Box>
      </Paper>
    </Layout>
  );
}