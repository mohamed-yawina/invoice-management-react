import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Visibility,
  Construction,
} from '@mui/icons-material';
import AdminLayout from '../../components/common/AdminLayout';

export default function ValidateInvoices() {
  const [loading, setLoading] = React.useState(false);

  // Simulation de chargement
  React.useEffect(() => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <Box sx={{ p: 3 }}>
          <LinearProgress sx={{ bgcolor: '#1E2536', '& .MuiLinearProgress-bar': { bgcolor: '#6EE7B7' } }} />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* En-tête */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            mb: 1,
            fontFamily: "'Syne', sans-serif",
            letterSpacing: '-0.03em',
          }}
        >
          Validation des factures
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Validez ou rejetez les factures en attente
        </Typography>
      </Box>

      {/* Message de développement */}
      <Paper
        sx={{
          bgcolor: '#0F1623',
          border: '1px solid rgba(110,231,183,0.08)',
          borderRadius: 3,
          p: 6,
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: 'rgba(110,231,183,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
          }}
        >
          <Construction sx={{ fontSize: 40, color: '#6EE7B7' }} />
        </Box>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: '#F1F5F9',
            mb: 1,
          }}
        >
          Fonctionnalité en cours de développement
        </Typography>
        <Typography sx={{ color: '#64748B', maxWidth: 500, mx: 'auto' }}>
          La validation des factures sera disponible prochainement.
          Merci de votre compréhension.
        </Typography>
      </Paper>

      {/* Aperçu des cartes (optionnel - à décommenter quand la fonctionnalité sera prête) */}
      {/*
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {[1, 2, 3].map((item) => (
          <Grid item xs={12} md={6} lg={4} key={item}>
            <Card sx={{ bgcolor: '#0F1623', border: '1px solid rgba(110,231,183,0.08)', borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#F1F5F9', fontWeight: 600 }}>
                    Facture #F00{item}
                  </Typography>
                  <Chip label="En attente" size="small" sx={{ bgcolor: 'rgba(234,179,8,0.15)', color: '#EAB308' }} />
                </Box>
                <Typography variant="body2" sx={{ color: '#94A3B8', mb: 1 }}>Date: 01/01/2024</Typography>
                <Typography variant="h5" sx={{ color: '#6EE7B7', fontWeight: 700, mb: 2 }}>12 500 DH</Typography>
                <CardActions sx={{ px: 0, pb: 0 }}>
                  <Button size="small" startIcon={<Visibility />} sx={{ color: '#3B82F6' }}>Détails</Button>
                  <Button size="small" startIcon={<CheckCircle />} sx={{ color: '#22C55E' }}>Valider</Button>
                  <Button size="small" startIcon={<Cancel />} sx={{ color: '#EF4444' }}>Rejeter</Button>
                </CardActions>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      */}
    </AdminLayout>
  );
}