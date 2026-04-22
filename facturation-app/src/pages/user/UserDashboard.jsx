import React, { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography, Box, LinearProgress } from '@mui/material';
import { Receipt, Paid, Pending, Cancel } from '@mui/icons-material';
import { db, ref, get } from '../../services/firebaseService';
import Layout from '../../components/common/Layout';

export default function UserDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, encaisse: 0, enAttente: 0, rejetees: 0 });

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const snapshot = await get(ref(db, 'factures'));
      const factures = snapshot.val() ? Object.values(snapshot.val()) : [];
      const encaisse = factures.filter(f => f.statut === 'Payée').reduce((sum, f) => sum + (f.total_ttc || 0), 0);
      setStats({ total: factures.length, encaisse, enAttente: factures.filter(f => f.statut === 'En attente').length, rejetees: factures.filter(f => f.statut === 'Rejetée').length });
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const cards = [
    { title: 'Total Factures', value: stats.total, icon: <Receipt />, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
    { title: 'Total Encaissé', value: `${stats.encaisse.toLocaleString()} DH`, icon: <Paid />, color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
    { title: 'En Attente', value: stats.enAttente, icon: <Pending />, color: '#EAB308', bg: 'rgba(234,179,8,0.1)' },
    { title: 'Rejetées', value: stats.rejetees, icon: <Cancel />, color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
  ];

  if (loading) return <Layout><Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><LinearProgress sx={{ width: 300, bgcolor: '#1E2536' }} /></Box></Layout>;
  return (
    <Layout>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: '#F1F5F9' }}>Tableau de bord</Typography>
      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <Card sx={{ bgcolor: '#161B26', border: '1px solid #1E2D3D', borderRadius: 3 }}>
              <CardContent><Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Box><Typography color="#94A3B8" variant="body2">{card.title}</Typography><Typography variant="h4" sx={{ fontWeight: 700, color: '#F1F5F9' }}>{card.value}</Typography></Box><Box sx={{ bgcolor: card.bg, borderRadius: 2, p: 1.5, color: card.color }}>{card.icon}</Box></Box></CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Layout>
  );
}