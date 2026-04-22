import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  InputAdornment,
  LinearProgress,
} from '@mui/material';
import {
  Search,
  FilterList,
  CheckCircle,
  Cancel,
  Visibility,
  Refresh,
  PictureAsPdf,
  Construction,
} from '@mui/icons-material';
import AdminLayout from '../../components/common/AdminLayout';

export default function Invoices() {
  const [loading, setLoading] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');

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
          Gestion des factures
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Consultez, filtrez et gérez toutes les factures
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
          mb: 4,
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
          La gestion complète des factures sera disponible prochainement.
          Merci de votre compréhension.
        </Typography>
      </Paper>

      {/* Filtres (désactivés pour l'instant) */}
      <Paper
        sx={{
          bgcolor: '#0F1623',
          border: '1px solid rgba(110,231,183,0.08)',
          borderRadius: 3,
          p: 2,
          mb: 3,
          opacity: 0.5,
          pointerEvents: 'none',
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              fullWidth
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: '#64748B', fontSize: 18 }} />
                  </InputAdornment>
                ),
                sx: {
                  bgcolor: '#0D1117',
                  borderRadius: 2,
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#64748B' }}>Statut</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Statut"
                sx={{ bgcolor: '#0D1117', borderRadius: 2, color: '#F1F5F9' }}
              >
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="En attente">En attente</MenuItem>
                <MenuItem value="Payée">Payée</MenuItem>
                <MenuItem value="Rejetée">Rejetée</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4} md={2}>
            <TextField
              fullWidth
              type="date"
              label="Date début"
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{ bgcolor: '#0D1117', borderRadius: 2 }}
            />
          </Grid>
          <Grid item xs={12} sm={4} md={2}>
            <TextField
              fullWidth
              type="date"
              label="Date fin"
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{ bgcolor: '#0D1117', borderRadius: 2 }}
            />
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                sx={{ borderColor: 'rgba(110,231,183,0.3)', color: '#6EE7B7' }}
              >
                Actualiser
              </Button>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                sx={{ borderColor: 'rgba(255,255,255,0.1)', color: '#94A3B8' }}
              >
                Réinitialiser
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tableau des factures (désactivé pour l'instant) */}
      <Paper
        sx={{
          bgcolor: '#0F1623',
          border: '1px solid rgba(110,231,183,0.08)',
          borderRadius: 3,
          overflow: 'hidden',
          opacity: 0.5,
          pointerEvents: 'none',
        }}
      >
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <TableCell sx={{ color: '#64748B', fontWeight: 600 }}>N° Facture</TableCell>
                <TableCell sx={{ color: '#64748B', fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ color: '#64748B', fontWeight: 600 }}>Client</TableCell>
                <TableCell sx={{ color: '#64748B', fontWeight: 600 }}>Montant TTC</TableCell>
                <TableCell sx={{ color: '#64748B', fontWeight: 600 }}>Statut</TableCell>
                <TableCell sx={{ color: '#64748B', fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[1, 2, 3].map((item) => (
                <TableRow key={item} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                  <TableCell sx={{ color: '#6EE7B7', fontWeight: 600, fontFamily: 'monospace' }}>F00{item}</TableCell>
                  <TableCell sx={{ color: '#94A3B8' }}>01/01/2024</TableCell>
                  <TableCell sx={{ color: '#F1F5F9' }}>Client {item}</TableCell>
                  <TableCell sx={{ color: '#F1F5F9', fontWeight: 600 }}>12 500 DH</TableCell>
                  <TableCell>
                    <Chip
                      label="En attente"
                      size="small"
                      sx={{ bgcolor: 'rgba(234,179,8,0.15)', color: '#EAB308' }}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" sx={{ color: '#3B82F6' }}>
                      <Visibility fontSize="small" />
                    </IconButton>
                    <IconButton size="small" sx={{ color: '#22C55E' }}>
                      <CheckCircle fontSize="small" />
                    </IconButton>
                    <IconButton size="small" sx={{ color: '#EF4444' }}>
                      <Cancel fontSize="small" />
                    </IconButton>
                    <IconButton size="small" sx={{ color: '#EF4444' }}>
                      <PictureAsPdf fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </AdminLayout>
  );
}