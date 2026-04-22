import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  InputAdornment,
  Tooltip,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Refresh,
  Search,
  Close,
  Inventory,
  Category,
  AttachMoney,
} from '@mui/icons-material';
import AdminLayout from '../../components/common/AdminLayout';
import { jsonService } from '../../services/jsonService';

// Composant StatCard
function StatCard({ icon, label, value, color, bg }) {
  return (
    <Card sx={{
      bgcolor: '#0F1623',
      border: '1px solid rgba(110,231,183,0.08)',
      borderRadius: 3,
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 8px 32px ${color}18` },
    }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '16px !important' }}>
        <Box sx={{ bgcolor: bg, borderRadius: '10px', p: 1.2, color, flexShrink: 0 }}>
          {icon}
        </Box>
        <Box>
          <Typography sx={{ color: '#64748B', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {label}
          </Typography>
          <Typography sx={{ fontWeight: 700, color: '#F1F5F9', fontSize: '1.75rem', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
            {value}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function ManageArticles() {
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Dialog pour ajouter/modifier
  const [openDialog, setOpenDialog] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    designation: '',
    prix_unitaire: '',
    categorie_id: '',
  });

  // Dialog pour supprimer
  const [deleteDialog, setDeleteDialog] = useState({ open: false, article: null, loading: false });

  // Charger les données
  const loadData = async () => {
    setLoading(true);
    try {
      const [articlesData, categoriesData] = await Promise.all([
        jsonService.getArticles(),
        jsonService.getCategories(),
      ]);
      setArticles(articlesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Erreur chargement:', error);
      setSnackbar({ open: true, message: 'Erreur de chargement des données', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrer les articles
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredArticles(articles);
      return;
    }
    const term = searchTerm.toLowerCase();
    setFilteredArticles(articles.filter(a =>
      a.designation?.toLowerCase().includes(term) ||
      a.id?.toString().includes(term)
    ));
  }, [searchTerm, articles]);

  // Sauvegarder (ajout ou modification)
  const handleSave = async () => {
    if (!form.designation || !form.prix_unitaire || !form.categorie_id) {
      setSnackbar({ open: true, message: 'Veuillez remplir tous les champs', severity: 'error' });
      return;
    }

    try {
      const articleData = {
        designation: form.designation,
        prix_unitaire: parseFloat(form.prix_unitaire),
        categorie_id: parseInt(form.categorie_id, 10),
      };

      if (editId) {
        await jsonService.updateArticle(editId, articleData);
        setSnackbar({ open: true, message: 'Article modifié avec succès', severity: 'success' });
      } else {
        const newId = Date.now();
        await jsonService.addArticle({
          id: newId,
          ...articleData,
        });
        setSnackbar({ open: true, message: 'Article ajouté avec succès', severity: 'success' });
      }
      setOpenDialog(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Erreur:', error);
      setSnackbar({ open: true, message: "Erreur lors de l'enregistrement", severity: 'error' });
    }
  };

  // Supprimer un article
  const handleDelete = async () => {
    const { article } = deleteDialog;
    if (!article) return;
    
    setDeleteDialog(d => ({ ...d, loading: true }));
    try {
      await jsonService.deleteArticle(article.id);
      setSnackbar({ open: true, message: `Article "${article.designation}" supprimé`, severity: 'success' });
      setDeleteDialog({ open: false, article: null, loading: false });
      loadData();
    } catch (error) {
      console.error('Erreur:', error);
      setSnackbar({ open: true, message: 'Erreur lors de la suppression', severity: 'error' });
      setDeleteDialog(d => ({ ...d, loading: false }));
    }
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setForm({ designation: '', prix_unitaire: '', categorie_id: '' });
    setEditId(null);
  };

  // Ouvrir le dialog pour modifier
  const openEditDialog = (article) => {
    setEditId(article.id);
    setForm({
      designation: article.designation,
      prix_unitaire: article.prix_unitaire,
      categorie_id: article.categorie_id,
    });
    setOpenDialog(true);
  };

  // Obtenir le nom de la catégorie - VERSION CORRIGÉE
  const getCategoryName = (categorieId) => {
    if (!categories || categories.length === 0) return 'Chargement...';
    if (categorieId === undefined || categorieId === null) return 'N/A';
    
    // Convertir en nombre pour la comparaison
    const id = typeof categorieId === 'string' ? parseInt(categorieId, 10) : categorieId;
    const category = categories.find(c => {
      const catId = typeof c.id === 'string' ? parseInt(c.id, 10) : c.id;
      return catId === id;
    });
    
    return category ? category.nom : 'N/A';
  };

  // Styles pour les champs
  const fieldSx = {
    mb: 2,
    '& .MuiInputLabel-root': { color: '#64748B' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#6EE7B7' },
    '& .MuiOutlinedInput-root': {
      color: '#F1F5F9',
      bgcolor: '#080C14',
      borderRadius: '10px',
      '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
      '&:hover fieldset': { borderColor: 'rgba(110,231,183,0.3)' },
      '&.Mui-focused fieldset': { borderColor: '#6EE7B7' },
    },
  };

  const selectSx = {
    color: '#F1F5F9',
    bgcolor: '#080C14',
    borderRadius: '10px',
    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(110,231,183,0.3)' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6EE7B7' },
    '& .MuiSvgIcon-root': { color: '#64748B' },
  };

  // Calculer la valeur totale du stock
  const totalValue = articles.reduce((sum, a) => sum + (a.prix_unitaire || 0), 0);

  return (
    <AdminLayout>
      {/* En-tête */}
      <Box sx={{ mb: { xs: 3, md: 4 }, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{
            fontWeight: 800,
            background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            mb: 0.5,
            fontFamily: "'Syne', sans-serif",
            letterSpacing: '-0.03em',
            fontSize: { xs: '1.4rem', md: '1.9rem' },
          }}>
            Gestion des articles
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            Ajoutez, modifiez ou supprimez des articles
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Tooltip title="Actualiser la liste">
            <IconButton
              onClick={loadData}
              disabled={loading}
              sx={{
                color: '#6EE7B7', bgcolor: 'rgba(110,231,183,0.08)',
                border: '1px solid rgba(110,231,183,0.2)', borderRadius: '10px',
                '&:hover': { bgcolor: 'rgba(110,231,183,0.16)' },
              }}
            >
              <Refresh sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => { resetForm(); setOpenDialog(true); }}
            sx={{
              bgcolor: '#6EE7B7', color: '#080C14', fontWeight: 700,
              borderRadius: '10px', textTransform: 'none', fontSize: '0.875rem',
              px: 2.5, boxShadow: '0 0 20px rgba(110,231,183,0.25)',
              '&:hover': { bgcolor: '#4ADE80', boxShadow: '0 0 28px rgba(110,231,183,0.4)' },
            }}
          >
            Nouvel article
          </Button>
        </Box>
      </Box>

      {/* Cartes statistiques */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 2, md: 3 } }}>
        <Grid item xs={12} sm={4}>
          <StatCard 
            icon={<Inventory sx={{ fontSize: 26 }} />} 
            label="Total articles" 
            value={loading ? '—' : articles.length} 
            color="#6EE7B7" 
            bg="rgba(110,231,183,0.1)" 
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard 
            icon={<Category sx={{ fontSize: 26 }} />} 
            label="Catégories" 
            value={loading ? '—' : categories.length} 
            color="#3B82F6" 
            bg="rgba(59,130,246,0.1)" 
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard 
            icon={<AttachMoney sx={{ fontSize: 26 }} />} 
            label="Valeur totale du stock" 
            value={loading ? '—' : `${totalValue.toLocaleString()} DH`} 
            color="#EAB308" 
            bg="rgba(234,179,8,0.1)" 
          />
        </Grid>
      </Grid>

      {/* Barre de recherche */}
      <Paper sx={{ bgcolor: '#0F1623', border: '1px solid rgba(110,231,183,0.08)', borderRadius: 3, p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Rechercher par nom ou ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: '#64748B', fontSize: 20 }} />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm('')} sx={{ color: '#64748B' }}>
                  <Close sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ),
            sx: {
              color: '#F1F5F9',
              bgcolor: '#080C14',
              borderRadius: '10px',
              '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
              '&:hover fieldset': { borderColor: 'rgba(110,231,183,0.3)' },
              '&.Mui-focused fieldset': { borderColor: '#6EE7B7' },
              '& input': { color: '#F1F5F9' },
              '& input::placeholder': { color: '#475569', opacity: 1 },
            },
          }}
        />
        {searchTerm && !loading && (
          <Typography sx={{ color: '#64748B', fontSize: '0.78rem', mt: 1 }}>
            {filteredArticles.length} résultat{filteredArticles.length !== 1 ? 's' : ''} pour « {searchTerm} »
          </Typography>
        )}
      </Paper>

      {/* Tableau des articles */}
      <Paper sx={{ bgcolor: '#0F1623', border: '1px solid rgba(110,231,183,0.08)', borderRadius: 3, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ p: 3 }}>
            <LinearProgress sx={{ bgcolor: '#1E2536', '& .MuiLinearProgress-bar': { bgcolor: '#6EE7B7' } }} />
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 600 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}>
                  <TableCell sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>ID</TableCell>
                  <TableCell sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>Désignation</TableCell>
                  <TableCell sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>Prix unitaire</TableCell>
                  <TableCell sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>Catégorie</TableCell>
                  <TableCell sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredArticles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ py: 7, textAlign: 'center', borderBottom: 'none' }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Inventory sx={{ color: '#1E293B', fontSize: 48, mb: 1 }} />
                        <Typography sx={{ color: '#64748B' }}>
                          {searchTerm ? 'Aucun article ne correspond à votre recherche' : 'Aucun article trouvé'}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredArticles.map((article) => (
                    <TableRow
                      key={article.id}
                      sx={{
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        transition: 'background 0.15s',
                        '&:hover': { bgcolor: 'rgba(110,231,183,0.03)' },
                      }}
                    >
                      <TableCell sx={{ color: '#6EE7B7', fontFamily: 'monospace', fontWeight: 600 }}>{article.id}</TableCell>
                      <TableCell sx={{ color: '#F1F5F9', fontWeight: 500 }}>{article.designation}</TableCell>
                      <TableCell sx={{ color: '#F1F5F9', fontWeight: 600 }}>{article.prix_unitaire.toLocaleString()} DH</TableCell>
                      <TableCell>
                        <Chip 
                          label={getCategoryName(article.categorie_id)} 
                          size="small" 
                          sx={{ bgcolor: 'rgba(110,231,183,0.1)', color: '#6EE7B7' }} 
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => openEditDialog(article)} sx={{ color: '#3B82F6' }}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => setDeleteDialog({ open: true, article, loading: false })} sx={{ color: '#EF4444' }}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Dialog Ajouter/Modifier */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="sm" 
        fullWidth 
        PaperProps={{ sx: { bgcolor: '#0F1623', borderRadius: '16px', border: '1px solid rgba(110,231,183,0.15)' } }}
      >
        <DialogTitle sx={{ color: '#F1F5F9', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)', pb: 2, fontFamily: "'Syne', sans-serif" }}>
          {editId ? 'Modifier' : 'Ajouter'} un article
        </DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>
          <TextField
            fullWidth
            label="Désignation *"
            value={form.designation}
            onChange={(e) => setForm({ ...form, designation: e.target.value })}
            sx={fieldSx}
            placeholder="Nom de l'article"
          />
          <TextField
            fullWidth
            label="Prix unitaire (DH) *"
            type="number"
            value={form.prix_unitaire}
            onChange={(e) => setForm({ ...form, prix_unitaire: e.target.value })}
            sx={fieldSx}
            placeholder="0"
            InputProps={{
              endAdornment: <InputAdornment position="end">DH</InputAdornment>,
            }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel sx={{ color: '#64748B', '&.Mui-focused': { color: '#6EE7B7' } }}>Catégorie *</InputLabel>
            <Select
              value={form.categorie_id}
              onChange={(e) => setForm({ ...form, categorie_id: e.target.value })}
              label="Catégorie *"
              sx={selectSx}
              MenuProps={{
                PaperProps: {
                  sx: { bgcolor: '#0F1623', backgroundImage: 'none' }
                }
              }}
            >
              <MenuItem value="">Sélectionner une catégorie</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id} sx={{ color: '#F1F5F9' }}>
                  {cat.nom}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.05)', p: 2, gap: 1 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ color: '#64748B' }}>Annuler</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            sx={{ bgcolor: '#6EE7B7', color: '#080C14', fontWeight: 700, '&:hover': { bgcolor: '#4ADE80' } }}
          >
            {editId ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Confirmation suppression */}
      <Dialog 
        open={deleteDialog.open} 
        onClose={() => !deleteDialog.loading && setDeleteDialog({ open: false, article: null, loading: false })} 
        maxWidth="xs" 
        fullWidth 
        PaperProps={{ sx: { bgcolor: '#0F1623', borderRadius: '16px', border: '1px solid rgba(239,68,68,0.2)' } }}
      >
        <DialogTitle sx={{ color: '#F1F5F9', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)', pb: 2 }}>
          Confirmer la suppression
        </DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            Êtes-vous sûr de vouloir supprimer l'article <strong>"{deleteDialog.article?.designation}"</strong> ?
          </Alert>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.05)', p: 2, gap: 1 }}>
          <Button 
            onClick={() => setDeleteDialog({ open: false, article: null, loading: false })} 
            disabled={deleteDialog.loading}
            sx={{ color: '#64748B' }}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleDelete} 
            variant="contained" 
            disabled={deleteDialog.loading}
            sx={{ bgcolor: '#EF4444', '&:hover': { bgcolor: '#DC2626' } }}
          >
            {deleteDialog.loading ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={3000} 
        onClose={() => setSnackbar(s => ({ ...s, open: false }))} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          sx={{
            bgcolor: snackbar.severity === 'success' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
            color: snackbar.severity === 'success' ? '#22C55E' : '#EF4444',
            border: `1px solid ${snackbar.severity === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
}