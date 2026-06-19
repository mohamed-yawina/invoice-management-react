import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, IconButton, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, Snackbar, LinearProgress,
  FormControl, InputLabel, Select, MenuItem, Chip, Grid, InputAdornment,
  Tooltip, Card, CardContent, TablePagination,
} from '@mui/material';
import {
  Add, Edit, Delete, Refresh, Search, Close, Inventory, Category,
  AttachMoney, QrCode2, Warning,
} from '@mui/icons-material';
import AdminLayout from '../../components/common/AdminLayout';
import { jsonService } from '../../services/jsonService';
import { formatMoney } from '../../utils/currency';

// ─── StatCard ────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, bg }) {
  return (
    <Card sx={{
      bgcolor: 'var(--app-bg-card)', border: '1px solid rgba(37,99,235,0.08)',
      borderRadius: 3, transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 8px 32px ${color}18` },
    }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '16px !important' }}>
        <Box sx={{ bgcolor: bg, borderRadius: '10px', p: 1.2, color, flexShrink: 0 }}>{icon}</Box>
        <Box>
          <Typography sx={{ color: 'var(--app-text-secondary)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {label}
          </Typography>
          <Typography sx={{ fontWeight: 700, color: 'var(--app-text-primary)', fontSize: '1.55rem', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
            {value}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────
// Les IDs de db.json sont stockés en string : on compare toujours en string.
const sameId = (a, b) => String(a) === String(b);

const DEFAULT_FORM = {
  designation: '',
  prix_unitaire: '',
  categorie_id: '',
  reference: '',
  stock: '',
  description: '',
};

export default function ManageArticles() {
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [openDialog, setOpenDialog] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const [deleteDialog, setDeleteDialog] = useState({ open: false, article: null, loading: false });

  // ── Chargement ────────────────────────────────────────────────────
  const loadData = async () => {
    setLoading(true);
    try {
      const [a, c] = await Promise.all([
        jsonService.getArticles(),
        jsonService.getCategories(),
      ]);
      setArticles(a);
      setCategories(c);
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: 'Erreur de chargement des données', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ── Filtrage ──────────────────────────────────────────────────────
  const filteredArticles = useMemo(() => {
    let list = articles;
    if (categoryFilter) list = list.filter((a) => sameId(a.categorie_id, categoryFilter));
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((a) =>
        a.designation?.toLowerCase().includes(q) ||
        a.reference?.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q) ||
        String(a.id ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [articles, searchTerm, categoryFilter]);

  const paginated = useMemo(
    () => filteredArticles.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredArticles, page, rowsPerPage]
  );

  // ── Stats ─────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalValue = articles.reduce((s, a) => s + (Number(a.prix_unitaire) || 0), 0);
    const lowStock = articles.filter((a) => a.stock !== null && a.stock !== undefined && Number(a.stock) < 10).length;
    return { totalValue, lowStock };
  }, [articles]);

  // ── Form ──────────────────────────────────────────────────────────
  const resetForm = () => {
    setForm(DEFAULT_FORM);
    setEditId(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const errs = {};
    if (!form.designation.trim()) errs.designation = 'Champ requis';
    if (form.prix_unitaire === '' || isNaN(Number(form.prix_unitaire)) || Number(form.prix_unitaire) < 0) {
      errs.prix_unitaire = 'Prix invalide';
    }
    if (!form.categorie_id) errs.categorie_id = 'Choisissez une catégorie';
    if (form.stock !== '' && (isNaN(Number(form.stock)) || Number(form.stock) < 0)) {
      errs.stock = 'Stock invalide';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload = {
        designation: form.designation.trim(),
        prix_unitaire: Number(form.prix_unitaire),
        // on garde l'ID catégorie en string (cohérent avec db.json)
        categorie_id: String(form.categorie_id),
        reference: form.reference.trim() || null,
        stock: form.stock === '' ? null : Number(form.stock),
        description: form.description.trim() || null,
      };

      if (editId) {
        await jsonService.updateArticle(editId, { id: String(editId), ...payload });
        setSnackbar({ open: true, message: 'Article modifié avec succès', severity: 'success' });
      } else {
        // Générer un ID string unique (cohérent avec db.json)
        const newId = String(Date.now());
        await jsonService.addArticle({ id: newId, ...payload });
        setSnackbar({ open: true, message: 'Article ajouté avec succès', severity: 'success' });
      }
      setOpenDialog(false);
      resetForm();
      loadData();
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Erreur lors de l'enregistrement", severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const { article } = deleteDialog;
    if (!article) return;
    setDeleteDialog((d) => ({ ...d, loading: true }));
    try {
      await jsonService.deleteArticle(article.id);
      setSnackbar({ open: true, message: `Article "${article.designation}" supprimé`, severity: 'success' });
      setDeleteDialog({ open: false, article: null, loading: false });
      loadData();
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: 'Erreur lors de la suppression', severity: 'error' });
      setDeleteDialog((d) => ({ ...d, loading: false }));
    }
  };

  const openEditDialog = (article) => {
    setEditId(article.id);
    setForm({
      designation: article.designation ?? '',
      prix_unitaire: article.prix_unitaire ?? '',
      categorie_id: String(article.categorie_id ?? ''),
      reference: article.reference ?? '',
      stock: article.stock ?? '',
      description: article.description ?? '',
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const getCategoryName = (categorieId) => {
    if (!categories.length) return 'Chargement...';
    if (categorieId === undefined || categorieId === null) return 'N/A';
    const cat = categories.find((c) => sameId(c.id, categorieId));
    return cat ? cat.nom : 'N/A';
  };

  // ── Styles ────────────────────────────────────────────────────────
  const fieldSx = {
    '& .MuiInputLabel-root': { color: 'var(--app-text-secondary)' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#2563EB' },
    '& .MuiOutlinedInput-root': {
      color: 'var(--app-text-primary)', bgcolor: 'var(--app-bg-deep)', borderRadius: '10px',
      '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
      '&:hover fieldset': { borderColor: 'rgba(37,99,235,0.3)' },
      '&.Mui-focused fieldset': { borderColor: '#2563EB' },
    },
    '& .MuiFormHelperText-root': { color: '#EF4444' },
  };

  return (
    <AdminLayout>
      {/* En-tête */}
      <Box sx={{ mb: { xs: 3, md: 4 }, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{
            fontWeight: 800,
            background: 'linear-gradient(135deg, #2563EB 0%, #475569 100%)',
            backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent',
            mb: 0.5, fontFamily: "'Syne', sans-serif", letterSpacing: '-0.03em',
            fontSize: { xs: '1.4rem', md: '1.9rem' },
          }}>
            Gestion des articles
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--app-text-secondary)' }}>
            Ajoutez, modifiez ou supprimez des articles (JSON Server)
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Tooltip title="Actualiser la liste">
            <span>
              <IconButton onClick={loadData} disabled={loading} sx={{
                color: '#2563EB', bgcolor: 'rgba(37,99,235,0.08)',
                border: '1px solid rgba(37,99,235,0.2)', borderRadius: '10px',
                '&:hover': { bgcolor: 'rgba(37,99,235,0.12)' },
              }}>
                <Refresh sx={{ fontSize: 20, animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              </IconButton>
            </span>
          </Tooltip>
          <Button
            variant="contained" startIcon={<Add />}
            onClick={() => { resetForm(); setOpenDialog(true); }}
            sx={{
              bgcolor: '#2563EB', color: '#F8FAFC', fontWeight: 700,
              borderRadius: '10px', textTransform: 'none', fontSize: '0.875rem',
              px: 2.5, boxShadow: '0 0 20px rgba(37,99,235,0.25)',
              '&:hover': { bgcolor: '#1D4ED8', boxShadow: '0 0 28px rgba(37,99,235,0.35)' },
            }}
          >
            Nouvel article
          </Button>
        </Box>
      </Box>

      {/* KPIs */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 2, md: 3 } }}>
        <Grid item xs={6} sm={3}>
          <StatCard icon={<Inventory sx={{ fontSize: 26 }} />} label="Total articles" value={loading ? '—' : articles.length} color="#2563EB" bg="rgba(37,99,235,0.1)" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard icon={<Category sx={{ fontSize: 26 }} />} label="Catégories" value={loading ? '—' : categories.length} color="#3B82F6" bg="rgba(59,130,246,0.1)" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard icon={<AttachMoney sx={{ fontSize: 26 }} />} label="Valeur catalogue" value={loading ? '—' : formatMoney(stats.totalValue, 'MAD')} color="#EAB308" bg="rgba(234,179,8,0.1)" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard icon={<Warning sx={{ fontSize: 26 }} />} label="Stock faible (<10)" value={loading ? '—' : stats.lowStock} color="#EF4444" bg="rgba(239,68,68,0.1)" />
        </Grid>
      </Grid>

      {/* Barre de recherche & filtre */}
      <Paper sx={{ bgcolor: 'var(--app-bg-card)', border: '1px solid rgba(37,99,235,0.08)', borderRadius: 3, p: 2, mb: 3 }}>
        <Grid container spacing={1.5} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth size="small" placeholder="Rechercher par nom, référence, description..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search sx={{ color: 'var(--app-text-secondary)', fontSize: 20 }} /></InputAdornment>,
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')} sx={{ color: 'var(--app-text-secondary)' }}>
                      <Close sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ),
                sx: {
                  color: 'var(--app-text-primary)', bgcolor: 'var(--app-bg-deep)', borderRadius: '10px',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
                  '&:hover fieldset': { borderColor: 'rgba(37,99,235,0.3)' },
                  '&.Mui-focused fieldset': { borderColor: '#2563EB' },
                  '& input::placeholder': { color: '#475569', opacity: 1 },
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small" sx={fieldSx}>
              <InputLabel>Catégorie</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }}
                label="Catégorie"
                MenuProps={{ PaperProps: { sx: { bgcolor: 'var(--app-bg-card)' } } }}
              >
                <MenuItem value="">Toutes</MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.nom}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        {(searchTerm || categoryFilter) && !loading && (
          <Typography sx={{ color: 'var(--app-text-secondary)', fontSize: '0.78rem', mt: 1.5 }}>
            {filteredArticles.length} résultat{filteredArticles.length !== 1 ? 's' : ''} sur {articles.length}
          </Typography>
        )}
      </Paper>

      {/* Tableau */}
      <Paper sx={{ bgcolor: 'var(--app-bg-card)', border: '1px solid rgba(37,99,235,0.08)', borderRadius: 3, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ p: 3 }}>
            <LinearProgress sx={{ bgcolor: '#1E2536', '& .MuiLinearProgress-bar': { bgcolor: '#2563EB' } }} />
          </Box>
        ) : (
          <>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 900 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}>
                    {['Référence', 'Désignation', 'Prix unitaire', 'Stock', 'Catégorie', 'Actions'].map(h => (
                      <TableCell key={h} sx={{ color: 'var(--app-text-secondary)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ py: 7, textAlign: 'center', borderBottom: 'none' }}>
                        <Inventory sx={{ color: 'var(--app-text-primary)', fontSize: 48, mb: 1 }} />
                        <Typography sx={{ color: 'var(--app-text-secondary)' }}>
                          {searchTerm || categoryFilter ? 'Aucun article ne correspond' : 'Aucun article trouvé'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : paginated.map((article) => {
                    const lowStock = article.stock !== null && article.stock !== undefined && Number(article.stock) < 10;
                    return (
                      <TableRow
                        key={article.id}
                        sx={{ borderBottom: '1px solid #E5E7EB', '&:hover': { bgcolor: 'rgba(37,99,235,0.04)' } }}
                      >
                        <TableCell>
                          {article.reference ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                              <QrCode2 sx={{ color: 'var(--app-text-secondary)', fontSize: 16 }} />
                              <Typography sx={{ color: '#2563EB', fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 600 }}>
                                {article.reference}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography sx={{ color: 'var(--app-text-secondary)', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                              #{String(article.id).slice(0, 8)}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ color: 'var(--app-text-primary)', fontWeight: 500 }}>
                          <Typography sx={{ fontWeight: 600 }}>{article.designation}</Typography>
                          {article.description && (
                            <Typography sx={{ color: 'var(--app-text-secondary)', fontSize: '0.75rem', mt: 0.3, maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {article.description}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ color: 'var(--app-text-primary)', fontWeight: 700 }}>
                          {formatMoney(article.prix_unitaire, 'MAD')}
                        </TableCell>
                        <TableCell>
                          {article.stock === null || article.stock === undefined ? (
                            <Chip label="N/A" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.04)', color: 'var(--app-text-secondary)', fontSize: '0.7rem' }} />
                          ) : (
                            <Chip
                              label={`${article.stock} unit.`}
                              size="small"
                              icon={lowStock ? <Warning sx={{ fontSize: '14px !important' }} /> : undefined}
                              sx={{
                                bgcolor: lowStock ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.12)',
                                color: lowStock ? '#EF4444' : '#22C55E',
                                fontWeight: 600, fontSize: '0.72rem',
                                '& .MuiChip-icon': { color: '#EF4444' },
                              }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getCategoryName(article.categorie_id)} size="small"
                            sx={{ bgcolor: 'rgba(37,99,235,0.1)', color: '#2563EB', fontWeight: 600, fontSize: '0.72rem' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Modifier">
                            <IconButton size="small" onClick={() => openEditDialog(article)} sx={{ color: '#3B82F6' }}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton size="small" onClick={() => setDeleteDialog({ open: true, article, loading: false })} sx={{ color: '#EF4444' }}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filteredArticles.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Par page :"
              sx={{
                color: '#94A3B8', borderTop: '1px solid rgba(255,255,255,0.05)',
                '& .MuiSelect-icon, & .MuiIconButton-root': { color: '#94A3B8' },
              }}
            />
          </>
        )}
      </Paper>

      {/* Dialog Ajout/Modification */}
      <Dialog
        open={openDialog} onClose={() => !saving && setOpenDialog(false)}
        maxWidth="sm" fullWidth
        PaperProps={{ sx: { bgcolor: 'var(--app-bg-card)', borderRadius: '16px', border: '1px solid rgba(37,99,235,0.15)' } }}
      >
        <DialogTitle sx={{ color: 'var(--app-text-primary)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)', pb: 2, fontFamily: "'Syne', sans-serif" }}>
          {editId ? 'Modifier' : 'Ajouter'} un article
        </DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth label="Désignation *"
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                error={!!formErrors.designation} helperText={formErrors.designation}
                placeholder="Nom de l'article" sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Référence"
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                placeholder="Ex: DELL-XPS-15" sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Prix unitaire (DH) *" type="number"
                value={form.prix_unitaire}
                onChange={(e) => setForm({ ...form, prix_unitaire: e.target.value })}
                error={!!formErrors.prix_unitaire} helperText={formErrors.prix_unitaire}
                placeholder="0" sx={fieldSx}
                InputProps={{ endAdornment: <InputAdornment position="end" sx={{ '& .MuiTypography-root': { color: 'var(--app-text-secondary)' } }}>DH</InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={fieldSx} error={!!formErrors.categorie_id}>
                <InputLabel>Catégorie *</InputLabel>
                <Select
                  value={form.categorie_id}
                  onChange={(e) => setForm({ ...form, categorie_id: e.target.value })}
                  label="Catégorie *"
                  MenuProps={{ PaperProps: { sx: { bgcolor: 'var(--app-bg-card)' } } }}
                >
                  <MenuItem value="">Sélectionner</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>{cat.nom}</MenuItem>
                  ))}
                </Select>
                {formErrors.categorie_id && (
                  <Typography sx={{ color: '#EF4444', fontSize: '0.75rem', mt: 0.5, ml: 1.5 }}>
                    {formErrors.categorie_id}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Stock" type="number"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                error={!!formErrors.stock} helperText={formErrors.stock || 'Laisser vide pour services/formations'}
                placeholder="0" sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth label="Description" multiline rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description courte de l'article" sx={fieldSx}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.05)', p: 2, gap: 1 }}>
          <Button onClick={() => setOpenDialog(false)} disabled={saving} sx={{ color: 'var(--app-text-secondary)' }}>Annuler</Button>
          <Button
            onClick={handleSave} disabled={saving} variant="contained"
            sx={{ bgcolor: '#2563EB', color: '#F8FAFC', fontWeight: 700, '&:hover': { bgcolor: '#1D4ED8' } }}
          >
            {saving ? 'Enregistrement...' : (editId ? 'Modifier' : 'Ajouter')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Suppression */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => !deleteDialog.loading && setDeleteDialog({ open: false, article: null, loading: false })}
        maxWidth="xs" fullWidth
        PaperProps={{ sx: { bgcolor: 'var(--app-bg-card)', borderRadius: '16px', border: '1px solid rgba(239,68,68,0.2)' } }}
      >
        <DialogTitle sx={{ color: 'var(--app-text-primary)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)', pb: 2 }}>
          Confirmer la suppression
        </DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            Êtes-vous sûr de vouloir supprimer l'article <strong>"{deleteDialog.article?.designation}"</strong> ?
          </Alert>
          <Typography variant="body2" sx={{ color: 'var(--app-text-secondary)' }}>Cette action est irréversible.</Typography>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.05)', p: 2, gap: 1 }}>
          <Button onClick={() => setDeleteDialog({ open: false, article: null, loading: false })} disabled={deleteDialog.loading} sx={{ color: 'var(--app-text-secondary)' }}>
            Annuler
          </Button>
          <Button onClick={handleDelete} variant="contained" disabled={deleteDialog.loading} sx={{ bgcolor: '#EF4444', '&:hover': { bgcolor: '#DC2626' } }}>
            {deleteDialog.loading ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </AdminLayout>
  );
}
