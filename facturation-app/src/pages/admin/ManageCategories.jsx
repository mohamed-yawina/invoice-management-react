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
  Category,
  Inventory,
  Computer,
  Build,
  School,
  Info,
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

// Icône par catégorie
function CategoryIcon({ nom }) {
  if (nom === 'Informatique') return <Computer sx={{ fontSize: 20 }} />;
  if (nom === 'Services') return <Build sx={{ fontSize: 20 }} />;
  if (nom === 'Formation') return <School sx={{ fontSize: 20 }} />;
  return <Category sx={{ fontSize: 20 }} />;
}

export default function ManageCategories() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [articles, setArticles] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Dialog pour ajouter/modifier
  const [openDialog, setOpenDialog] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    nom: '',
    description: '',
    icon: 'category',
  });
  const [articleCountForEdit, setArticleCountForEdit] = useState(0);

  // Dialog pour supprimer
  const [deleteDialog, setDeleteDialog] = useState({ open: false, category: null, loading: false });

  // Charger les données
  const loadData = async () => {
    setLoading(true);
    try {
      const [categoriesData, articlesData] = await Promise.all([
        jsonService.getCategories(),
        jsonService.getArticles(),
      ]);
      setCategories(categoriesData);
      setArticles(articlesData);
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

  // Filtrer les catégories
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCategories(categories);
      return;
    }
    const term = searchTerm.toLowerCase();
    setFilteredCategories(categories.filter(c =>
      c.nom?.toLowerCase().includes(term) ||
      c.description?.toLowerCase().includes(term) ||
      c.id?.toString().includes(term)
    ));
  }, [searchTerm, categories]);

  // Compter les articles par catégorie
  const getArticleCountByCategory = (categoryId) => {
    return articles.filter(a => String(a.categorie_id) === String(categoryId)).length;
  };

  // Sauvegarder (ajout ou modification)
  const handleSave = async () => {
    if (!form.nom) {
      setSnackbar({ open: true, message: 'Veuillez remplir le nom de la catégorie', severity: 'error' });
      return;
    }

    try {
      const categoryData = {
        nom: form.nom,
        description: form.description || '',
        icon: form.icon || 'category',
      };

      if (editId) {
        await jsonService.updateCategory(editId, categoryData);
        setSnackbar({ open: true, message: 'Catégorie modifiée avec succès', severity: 'success' });
      } else {
        const newId = Date.now();
        await jsonService.addCategory({
          id: newId,
          ...categoryData,
        });
        setSnackbar({ open: true, message: 'Catégorie ajoutée avec succès', severity: 'success' });
      }
      setOpenDialog(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Erreur:', error);
      setSnackbar({ open: true, message: "Erreur lors de l'enregistrement", severity: 'error' });
    }
  };

  // Supprimer une catégorie
  const handleDelete = async () => {
    const { category } = deleteDialog;
    if (!category) return;
    
    // Vérifier si la catégorie contient des articles
    const articleCount = getArticleCountByCategory(category.id);
    if (articleCount > 0) {
      setSnackbar({ 
        open: true, 
        message: `Impossible de supprimer la catégorie "${category.nom}" car elle contient ${articleCount} article(s)`, 
        severity: 'error' 
      });
      setDeleteDialog({ open: false, category: null, loading: false });
      return;
    }

    setDeleteDialog(d => ({ ...d, loading: true }));
    try {
      await jsonService.deleteCategory(category.id);
      setSnackbar({ open: true, message: `Catégorie "${category.nom}" supprimée`, severity: 'success' });
      setDeleteDialog({ open: false, category: null, loading: false });
      loadData();
    } catch (error) {
      console.error('Erreur:', error);
      setSnackbar({ open: true, message: 'Erreur lors de la suppression', severity: 'error' });
      setDeleteDialog(d => ({ ...d, loading: false }));
    }
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setForm({ nom: '', description: '', icon: 'category' });
    setEditId(null);
    setArticleCountForEdit(0);
  };

  // Ouvrir le dialog pour modifier
  const openEditDialog = (category) => {
    const articleCount = getArticleCountByCategory(category.id);
    setEditId(category.id);
    setForm({
      nom: category.nom,
      description: category.description || '',
      icon: category.icon || 'category',
    });
    setArticleCountForEdit(articleCount);
    setOpenDialog(true);
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

  // Calculer les statistiques
  const totalArticles = articles.length;
  const categoriesWithArticles = categories.filter(c => getArticleCountByCategory(c.id) > 0).length;

  // Distribution des articles par catégorie
  const categoryDistribution = categories.map(cat => ({
    nom: cat.nom,
    count: getArticleCountByCategory(cat.id),
    percentage: totalArticles > 0 ? ((getArticleCountByCategory(cat.id) / totalArticles) * 100).toFixed(1) : 0
  }));

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
            Gestion des catégories
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            Ajoutez, modifiez ou supprimez des catégories d'articles
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
            Nouvelle catégorie
          </Button>
        </Box>
      </Box>

      {/* Cartes statistiques */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 2, md: 3 } }}>
        <Grid item xs={12} sm={4}>
          <StatCard 
            icon={<Category sx={{ fontSize: 26 }} />} 
            label="Total catégories" 
            value={loading ? '—' : categories.length} 
            color="#6EE7B7" 
            bg="rgba(110,231,183,0.1)" 
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard 
            icon={<Inventory sx={{ fontSize: 26 }} />} 
            label="Total articles" 
            value={loading ? '—' : totalArticles} 
            color="#3B82F6" 
            bg="rgba(59,130,246,0.1)" 
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard 
            icon={<Category sx={{ fontSize: 26 }} />} 
            label="Catégories avec articles" 
            value={loading ? '—' : categoriesWithArticles} 
            color="#EAB308" 
            bg="rgba(234,179,8,0.1)" 
          />
        </Grid>
      </Grid>

      {/* Distribution des articles par catégorie */}
      {!loading && totalArticles > 0 && (
        <Paper sx={{ bgcolor: '#0F1623', border: '1px solid rgba(110,231,183,0.08)', borderRadius: 3, p: 2, mb: 3 }}>
          <Typography sx={{ color: '#F1F5F9', fontWeight: 600, mb: 2 }}>
            📊 Distribution des articles par catégorie
          </Typography>
          <Grid container spacing={2}>
            {categoryDistribution.map((cat, idx) => (
              <Grid item xs={12} sm={4} key={idx}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, bgcolor: '#080C14', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CategoryIcon nom={cat.nom} />
                    <Typography sx={{ color: '#F1F5F9' }}>{cat.nom}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ color: '#6EE7B7', fontWeight: 600 }}>{cat.count} articles</Typography>
                    <Typography sx={{ color: '#64748B', fontSize: '0.7rem' }}>{cat.percentage}%</Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Barre de recherche */}
      <Paper sx={{ bgcolor: '#0F1623', border: '1px solid rgba(110,231,183,0.08)', borderRadius: 3, p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Rechercher par nom, description ou ID..."
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
            {filteredCategories.length} résultat{filteredCategories.length !== 1 ? 's' : ''} pour « {searchTerm} »
          </Typography>
        )}
      </Paper>

      {/* Tableau des catégories */}
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
                  <TableCell sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>Nom</TableCell>
                  <TableCell sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>Description</TableCell>
                  <TableCell sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>Articles</TableCell>
                  <TableCell sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ py: 7, textAlign: 'center', borderBottom: 'none' }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Category sx={{ color: '#1E293B', fontSize: 48, mb: 1 }} />
                        <Typography sx={{ color: '#64748B' }}>
                          {searchTerm ? 'Aucune catégorie ne correspond à votre recherche' : 'Aucune catégorie trouvée'}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((category) => {
                    const articleCount = getArticleCountByCategory(category.id);
                    return (
                      <TableRow
                        key={category.id}
                        sx={{
                          borderBottom: '1px solid rgba(255,255,255,0.03)',
                          transition: 'background 0.15s',
                          '&:hover': { bgcolor: 'rgba(110,231,183,0.03)' },
                        }}
                      >
                        <TableCell sx={{ color: '#6EE7B7', fontFamily: 'monospace', fontWeight: 600 }}>{category.id}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CategoryIcon nom={category.nom} />
                            <Typography sx={{ color: '#F1F5F9', fontWeight: 500 }}>{category.nom}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ color: '#94A3B8', fontSize: '0.85rem' }}>
                            {category.description || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`${articleCount} article${articleCount !== 1 ? 's' : ''}`} 
                            size="small" 
                            sx={{ 
                              bgcolor: articleCount > 0 ? 'rgba(110,231,183,0.1)' : 'rgba(100,100,100,0.1)',
                              color: articleCount > 0 ? '#6EE7B7' : '#64748B',
                            }} 
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            size="small" 
                            onClick={() => openEditDialog(category)} 
                            sx={{ color: '#3B82F6' }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => setDeleteDialog({ open: true, category, loading: false })} 
                            sx={{ color: '#EF4444' }}
                            disabled={articleCount > 0}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Dialog Ajouter/Modifier avec affichage du nombre d'articles */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="sm" 
        fullWidth 
        PaperProps={{ sx: { bgcolor: '#0F1623', borderRadius: '16px', border: '1px solid rgba(110,231,183,0.15)' } }}
      >
        <DialogTitle sx={{ color: '#F1F5F9', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)', pb: 2, fontFamily: "'Syne', sans-serif" }}>
          {editId ? 'Modifier' : 'Ajouter'} une catégorie
        </DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>
          {/* Affichage du nombre d'articles si modification */}
          {editId && articleCountForEdit > 0 && (
            <Alert 
              severity="info" 
              icon={<Info />}
              sx={{ 
                mb: 3, 
                bgcolor: 'rgba(110,231,183,0.1)', 
                color: '#6EE7B7',
                border: '1px solid rgba(110,231,183,0.2)',
                borderRadius: '10px'
              }}
            >
              Cette catégorie contient actuellement <strong>{articleCountForEdit} article(s)</strong>. 
              La suppression de la catégorie ne supprimera pas les articles.
            </Alert>
          )}

          <TextField
            fullWidth
            label="Nom de la catégorie *"
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            sx={fieldSx}
            placeholder="Ex: Informatique, Services, Formation..."
          />
          <TextField
            fullWidth
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            sx={fieldSx}
            placeholder="Description de la catégorie"
            multiline
            rows={3}
          />

          {/* Affichage du nombre d'articles en modification */}
          {editId && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#080C14', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Inventory sx={{ color: '#6EE7B7', fontSize: 20 }} />
                <Typography sx={{ color: '#94A3B8', fontSize: '0.85rem' }}>
                  Nombre d'articles dans cette catégorie : 
                  <strong style={{ color: '#6EE7B7', marginLeft: 8 }}>{articleCountForEdit}</strong>
                </Typography>
              </Box>
            </Box>
          )}
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
        onClose={() => !deleteDialog.loading && setDeleteDialog({ open: false, category: null, loading: false })} 
        maxWidth="xs" 
        fullWidth 
        PaperProps={{ sx: { bgcolor: '#0F1623', borderRadius: '16px', border: '1px solid rgba(239,68,68,0.2)' } }}
      >
        <DialogTitle sx={{ color: '#F1F5F9', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)', pb: 2 }}>
          Confirmer la suppression
        </DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            Êtes-vous sûr de vouloir supprimer la catégorie <strong>"{deleteDialog.category?.nom}"</strong> ?
          </Alert>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            Cette action est irréversible. Les articles de cette catégorie ne seront pas supprimés.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.05)', p: 2, gap: 1 }}>
          <Button 
            onClick={() => setDeleteDialog({ open: false, category: null, loading: false })} 
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