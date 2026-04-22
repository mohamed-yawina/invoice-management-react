import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Button, LinearProgress } from '@mui/material';
import { Visibility, PictureAsPdf, Add } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { db, ref, get } from '../../services/firebaseService';
import Layout from '../../components/common/Layout';

export default function InvoiceHistory() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => { loadInvoices(); }, []);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const snapshot = await get(ref(db, 'factures'));
      setInvoices(snapshot.val() ? Object.values(snapshot.val()).sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation)) : []);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const getStatusChip = (statut) => {
    const styles = { Payée: { bg: 'rgba(34,197,94,0.15)', color: '#22C55E' }, Rejetée: { bg: 'rgba(239,68,68,0.15)', color: '#EF4444' }, 'En attente': { bg: 'rgba(234,179,8,0.15)', color: '#EAB308' } };
    const style = styles[statut] || styles['En attente'];
    return <Chip label={statut} size="small" sx={{ bgcolor: style.bg, color: style.color }} />;
  };

  return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}><Typography variant="h4" sx={{ fontWeight: 700, color: '#F1F5F9' }}>Mes factures</Typography><Button variant="contained" startIcon={<Add />} onClick={() => navigate('/app/invoices/new')} sx={{ bgcolor: '#6EE7B7', color: '#0D0F14' }}>Nouvelle facture</Button></Box>
      <Paper sx={{ bgcolor: '#161B26', border: '1px solid #1E2D3D', borderRadius: 3, overflow: 'hidden' }}>
        {loading ? <Box sx={{ p: 3 }}><LinearProgress sx={{ bgcolor: '#1E2536' }} /></Box> : (
          <TableContainer><Table>
            <TableHead><TableRow><TableCell sx={{ color: '#64748B' }}>N° Facture</TableCell><TableCell sx={{ color: '#64748B' }}>Date</TableCell><TableCell sx={{ color: '#64748B' }}>Montant TTC</TableCell><TableCell sx={{ color: '#64748B' }}>Statut</TableCell><TableCell sx={{ color: '#64748B' }}>Actions</TableCell></TableRow></TableHead>
            <TableBody>{invoices.map((inv, idx) => (<TableRow key={idx}><TableCell sx={{ color: '#6EE7B7', fontWeight: 600 }}>{inv.numero || `#${idx + 1}`}</TableCell><TableCell sx={{ color: '#94A3B8' }}>{new Date(inv.date_creation).toLocaleDateString('fr-FR')}</TableCell><TableCell sx={{ color: '#F1F5F9', fontWeight: 600 }}>{inv.total_ttc?.toLocaleString()} DH</TableCell><TableCell>{getStatusChip(inv.statut)}</TableCell><TableCell><IconButton size="small" sx={{ color: '#3B82F6' }}><Visibility /></IconButton><IconButton size="small" sx={{ color: '#EF4444' }}><PictureAsPdf /></IconButton></TableCell></TableRow>))}</TableBody>
          </Table></TableContainer>
        )}
      </Paper>
    </Layout>
  );
}