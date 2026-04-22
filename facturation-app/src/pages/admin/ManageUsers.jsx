import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Snackbar, Skeleton, Chip, Avatar, TextField,
  FormControl, InputLabel, Select, MenuItem, Tooltip,
  Card, CardContent, Grid, InputAdornment,
} from '@mui/material';
import {
  AdminPanelSettings, Person, Delete, Edit, Refresh,
  Search, Add, Close, CheckCircle, Warning,
} from '@mui/icons-material';
import {
  getAllUsers, updateUserRole, deleteUser, addUserToDB,
} from '../../services/firebaseService';
import AdminLayout from '../../components/common/AdminLayout';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (name, email) => {
  if (name?.trim()) return name.trim()[0].toUpperCase();
  if (email?.trim()) return email.trim()[0].toUpperCase();
  return 'U';
};

const getAvatarGradient = (role) =>
  role === 'admin'
    ? 'linear-gradient(135deg, #6EE7B7, #3B82F6)'
    : 'linear-gradient(135deg, #3B82F6, #8B5CF6)';

// ─── Sous-composants ──────────────────────────────────────────────────────────
function RoleChip({ role }) {
  const isAdmin = role === 'admin';
  return (
    <Chip
      label={isAdmin ? 'Administrateur' : 'Utilisateur'}
      size="small"
      icon={isAdmin
        ? <AdminPanelSettings sx={{ fontSize: '14px !important' }} />
        : <Person sx={{ fontSize: '14px !important' }} />}
      sx={{
        bgcolor: isAdmin ? 'rgba(110,231,183,0.12)' : 'rgba(59,130,246,0.12)',
        color: isAdmin ? '#6EE7B7' : '#3B82F6',
        fontWeight: 600,
        fontSize: '0.72rem',
        border: `1px solid ${isAdmin ? 'rgba(110,231,183,0.2)' : 'rgba(59,130,246,0.2)'}`,
        '& .MuiChip-icon': { color: isAdmin ? '#6EE7B7' : '#3B82F6' },
      }}
    />
  );
}

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

function TableRowSkeleton() {
  return (
    <TableRow>
      {Array(6).fill(null).map((_, i) => (
        <TableCell key={i}>
          <Skeleton
            variant={i === 0 ? 'circular' : 'text'}
            width={i === 0 ? 36 : '80%'}
            height={i === 0 ? 36 : 20}
            sx={{ bgcolor: 'rgba(255,255,255,0.06)' }}
          />
        </TableCell>
      ))}
    </TableRow>
  );
}

// ─── Styles formulaire ────────────────────────────────────────────────────────
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

const menuPaperSx = {
  PaperProps: {
    sx: { bgcolor: '#0F1623', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', backgroundImage: 'none' },
  },
};

// ─── Snackbar helper ──────────────────────────────────────────────────────────
const snackStyle = (severity) => ({
  bgcolor:
    severity === 'success' ? 'rgba(34,197,94,0.12)'
    : severity === 'error' ? 'rgba(239,68,68,0.12)'
    : 'rgba(234,179,8,0.12)',
  color:
    severity === 'success' ? '#22C55E'
    : severity === 'error' ? '#EF4444'
    : '#EAB308',
  border: `1px solid ${
    severity === 'success' ? 'rgba(34,197,94,0.3)'
    : severity === 'error' ? 'rgba(239,68,68,0.3)'
    : 'rgba(234,179,8,0.3)'
  }`,
  borderRadius: '10px',
  '& .MuiAlert-icon': {
    color:
      severity === 'success' ? '#22C55E'
      : severity === 'error' ? '#EF4444'
      : '#EAB308',
  },
});

// ─── Composant principal ──────────────────────────────────────────────────────
export default function ManageUsers() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [stats, setStats] = useState({ total: 0, admins: 0, users: 0 });

  const [roleDialog, setRoleDialog]   = useState({ open: false, user: null, newRole: 'user' });
  const [addDialog, setAddDialog]     = useState({ open: false, loading: false });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null, loading: false });
  const [newUser, setNewUser]         = useState({ email: '', displayName: '', role: 'user' });

  const showSnack = useCallback((message, severity = 'success') =>
    setSnackbar({ open: true, message, severity }), []);

  // ── Chargement ───────────────────────────────────────────────────────────────
  const loadUsers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const usersList = await getAllUsers();
      setUsers(usersList);
      const adminCount = usersList.filter(u => u.role === 'admin').length;
      setStats({ total: usersList.length, admins: adminCount, users: usersList.length - adminCount });
      if (!silent) showSnack(`${usersList.length} utilisateur(s) chargé(s)`);
    } catch (err) {
      console.error('Erreur chargement utilisateurs:', err);
      showSnack('Erreur lors du chargement des utilisateurs', 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnack]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // ── Filtrage ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!searchTerm.trim()) { setFilteredUsers(users); return; }
    const term = searchTerm.toLowerCase();
    setFilteredUsers(users.filter(u =>
      u.email?.toLowerCase().includes(term) ||
      u.displayName?.toLowerCase().includes(term) ||
      u.id?.toLowerCase().includes(term)
    ));
  }, [searchTerm, users]);

  // ── Modifier rôle ────────────────────────────────────────────────────────────
  const handleRoleChange = async () => {
    const { user, newRole } = roleDialog;
    if (!user || !newRole) return;
    try {
      const success = await updateUserRole(user.id, newRole);
      if (success) {
        showSnack(`${user.email} est maintenant ${newRole === 'admin' ? 'Administrateur' : 'Utilisateur'}`);
        setRoleDialog({ open: false, user: null, newRole: 'user' });
        loadUsers(true);
      } else {
        showSnack('Erreur lors de la mise à jour du rôle', 'error');
      }
    } catch (err) {
      showSnack(`Erreur : ${err.message}`, 'error');
    }
  };

  // ── Ajouter utilisateur ──────────────────────────────────────────────────────
  const handleAddUser = async () => {
    if (!newUser.email.trim() || !newUser.displayName.trim()) {
      showSnack('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
      showSnack('Adresse email invalide', 'error');
      return;
    }
    setAddDialog(d => ({ ...d, loading: true }));
    try {
      const id = await addUserToDB(newUser.email, newUser.displayName, newUser.role);
      if (id) {
        showSnack(`Utilisateur "${newUser.displayName}" ajouté avec succès`);
        setAddDialog({ open: false, loading: false });
        setNewUser({ email: '', displayName: '', role: 'user' });
        loadUsers(true);
      } else {
        showSnack("Erreur lors de l'ajout de l'utilisateur", 'error');
        setAddDialog(d => ({ ...d, loading: false }));
      }
    } catch (err) {
      showSnack(`Erreur : ${err.message}`, 'error');
      setAddDialog(d => ({ ...d, loading: false }));
    }
  };

  // ── Supprimer utilisateur ────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    const { user } = deleteDialog;
    if (!user) return;
    setDeleteDialog(d => ({ ...d, loading: true }));
    try {
      const success = await deleteUser(user.id);
      if (success) {
        showSnack(`Utilisateur "${user.email}" supprimé`);
        setDeleteDialog({ open: false, user: null, loading: false });
        loadUsers(true);
      } else {
        showSnack('Erreur lors de la suppression', 'error');
        setDeleteDialog(d => ({ ...d, loading: false }));
      }
    } catch (err) {
      showSnack(`Erreur : ${err.message}`, 'error');
      setDeleteDialog(d => ({ ...d, loading: false }));
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>

      {/* En-tête */}
      <Box sx={{ mb: { xs: 3, md: 4 }, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{
            fontWeight: 800, color: '#F1F5F9', mb: 0.5,
            fontFamily: "'Syne', sans-serif", letterSpacing: '-0.03em',
            fontSize: { xs: '1.4rem', md: '1.9rem' },
          }}>
            Gestion des utilisateurs
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            Gérez les rôles et les permissions de votre équipe
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Tooltip title="Actualiser la liste">
            <span>
              <IconButton
                onClick={() => loadUsers()}
                disabled={loading}
                sx={{
                  color: '#6EE7B7', bgcolor: 'rgba(110,231,183,0.08)',
                  border: '1px solid rgba(110,231,183,0.2)', borderRadius: '10px',
                  '&:hover': { bgcolor: 'rgba(110,231,183,0.16)' },
                  '&:disabled': { color: '#475569', border: '1px solid rgba(255,255,255,0.06)' },
                }}
              >
                <Refresh sx={{ fontSize: 20 }} />
              </IconButton>
            </span>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setAddDialog({ open: true, loading: false })}
            sx={{
              bgcolor: '#6EE7B7', color: '#080C14', fontWeight: 700,
              borderRadius: '10px', textTransform: 'none', fontSize: '0.875rem',
              px: 2.5, boxShadow: '0 0 20px rgba(110,231,183,0.25)',
              '&:hover': { bgcolor: '#4ADE80', boxShadow: '0 0 28px rgba(110,231,183,0.4)' },
            }}
          >
            Ajouter
          </Button>
        </Box>
      </Box>

      {/* Cartes stats */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 2, md: 3 } }}>
        <Grid item xs={12} sm={4}>
          <StatCard icon={<Person sx={{ fontSize: 26 }} />} label="Total utilisateurs" value={loading ? '—' : stats.total} color="#6EE7B7" bg="rgba(110,231,183,0.1)" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard icon={<AdminPanelSettings sx={{ fontSize: 26 }} />} label="Administrateurs" value={loading ? '—' : stats.admins} color="#6EE7B7" bg="rgba(110,231,183,0.1)" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard icon={<Person sx={{ fontSize: 26 }} />} label="Utilisateurs standards" value={loading ? '—' : stats.users} color="#3B82F6" bg="rgba(59,130,246,0.1)" />
        </Grid>
      </Grid>

      {/* Barre de recherche */}
      <Paper sx={{ bgcolor: '#0F1623', border: '1px solid rgba(110,231,183,0.08)', borderRadius: 3, p: 2, mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Rechercher par email, nom ou ID…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: '#64748B', fontSize: 20 }} />
              </InputAdornment>
            ),
            endAdornment: searchTerm ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm('')} sx={{ color: '#64748B', '&:hover': { color: '#6EE7B7' } }}>
                  <Close sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ) : null,
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
            {filteredUsers.length} résultat{filteredUsers.length !== 1 ? 's' : ''} pour « {searchTerm} »
          </Typography>
        )}
      </Paper>

      {/* Tableau */}
      <Paper sx={{ bgcolor: '#0F1623', border: '1px solid rgba(110,231,183,0.08)', borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 680 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}>
                {['Utilisateur', 'Email', 'Rôle', 'ID', "Date d'inscription", 'Actions'].map(h => (
                  <TableCell key={h} sx={{
                    color: '#64748B', fontWeight: 600, fontSize: '0.72rem',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    borderBottom: '1px solid rgba(255,255,255,0.05)', py: 1.5,
                    whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array(5).fill(null).map((_, i) => <TableRowSkeleton key={i} />)
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 7, borderBottom: 'none' }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Box sx={{
                        width: 52, height: 52, borderRadius: '14px',
                        bgcolor: 'rgba(255,255,255,0.04)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        mx: 'auto', mb: 2,
                      }}>
                        <Person sx={{ color: '#1E293B', fontSize: 26 }} />
                      </Box>
                      <Typography sx={{ color: '#64748B', fontWeight: 500 }}>
                        {searchTerm
                          ? 'Aucun utilisateur ne correspond à votre recherche'
                          : 'Aucun utilisateur dans la base de données'}
                      </Typography>
                      {!searchTerm && (
                        <Typography sx={{ color: '#475569', fontSize: '0.78rem', mt: 0.8 }}>
                          Vérifiez que des utilisateurs sont enregistrés sous{' '}
                          <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 3 }}>/users</code>{' '}
                          dans Firebase
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow
                    key={user.id}
                    sx={{
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      transition: 'background 0.15s',
                      '&:hover': { bgcolor: 'rgba(110,231,183,0.03)' },
                      '&:last-child td': { borderBottom: 'none' },
                    }}
                  >
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{
                          width: 36, height: 36,
                          background: getAvatarGradient(user.role),
                          color: '#fff', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0,
                        }}>
                          {getInitials(user.displayName, user.email)}
                        </Avatar>
                        <Box>
                          <Typography sx={{ color: '#F1F5F9', fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.3 }}>
                            {user.displayName || <span style={{ color: '#475569', fontStyle: 'italic' }}>Non renseigné</span>}
                          </Typography>
                          <Typography sx={{ color: '#475569', fontSize: '0.7rem', fontFamily: 'monospace' }}>
                            {user.id?.slice(0, 8)}…
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell sx={{ py: 1.5 }}>
                      <Typography sx={{ color: '#94A3B8', fontSize: '0.85rem' }}>{user.email || '—'}</Typography>
                    </TableCell>

                    <TableCell sx={{ py: 1.5 }}>
                      <RoleChip role={user.role} />
                    </TableCell>

                    <TableCell sx={{ py: 1.5 }}>
                      <Typography sx={{ color: '#475569', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                        {user.id?.slice(0, 14)}…
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ py: 1.5 }}>
                      <Typography sx={{ color: '#64748B', fontSize: '0.8rem' }}>
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—'}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Modifier le rôle">
                          <IconButton
                            size="small"
                            onClick={() => setRoleDialog({ open: true, user, newRole: user.role || 'user' })}
                            sx={{ color: '#6EE7B7', borderRadius: '8px', '&:hover': { bgcolor: 'rgba(110,231,183,0.12)' } }}
                          >
                            <Edit sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer l'utilisateur">
                          <IconButton
                            size="small"
                            onClick={() => setDeleteDialog({ open: true, user, loading: false })}
                            sx={{ color: '#EF4444', borderRadius: '8px', '&:hover': { bgcolor: 'rgba(239,68,68,0.12)' } }}
                          >
                            <Delete sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {!loading && filteredUsers.length > 0 && (
          <Box sx={{ px: 2.5, py: 1.5, borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ color: '#475569', fontSize: '0.78rem' }}>
              {filteredUsers.length} utilisateur{filteredUsers.length !== 1 ? 's' : ''} affiché{filteredUsers.length !== 1 ? 's' : ''}
            </Typography>
            {searchTerm && (
              <Button size="small" onClick={() => setSearchTerm('')}
                sx={{ color: '#6EE7B7', fontSize: '0.75rem', textTransform: 'none', p: 0 }}>
                Effacer le filtre
              </Button>
            )}
          </Box>
        )}
      </Paper>

      {/* ── Dialog : Modifier le rôle ─────────────────────────────────────────── */}
      <Dialog
        open={roleDialog.open}
        onClose={() => setRoleDialog({ open: false, user: null, newRole: 'user' })}
        maxWidth="xs" fullWidth
        PaperProps={{ sx: { bgcolor: '#0F1623', borderRadius: '16px', border: '1px solid rgba(110,231,183,0.15)', backgroundImage: 'none' } }}
      >
        <DialogTitle sx={{ color: '#F1F5F9', fontWeight: 700, fontSize: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', pb: 2, fontFamily: "'Syne', sans-serif" }}>
          Modifier le rôle
        </DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>
          {roleDialog.user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: '#080C14', borderRadius: '12px', mb: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
              <Avatar sx={{ width: 44, height: 44, background: getAvatarGradient(roleDialog.user.role), color: '#fff', fontWeight: 700 }}>
                {getInitials(roleDialog.user.displayName, roleDialog.user.email)}
              </Avatar>
              <Box>
                <Typography sx={{ color: '#F1F5F9', fontWeight: 600, fontSize: '0.9rem' }}>
                  {roleDialog.user.displayName || 'Utilisateur'}
                </Typography>
                <Typography sx={{ color: '#64748B', fontSize: '0.78rem' }}>{roleDialog.user.email}</Typography>
              </Box>
            </Box>
          )}

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel sx={{ color: '#64748B', '&.Mui-focused': { color: '#6EE7B7' } }}>Rôle</InputLabel>
            <Select
              value={roleDialog.newRole}
              onChange={(e) => setRoleDialog(d => ({ ...d, newRole: e.target.value }))}
              label="Rôle"
              sx={selectSx}
              MenuProps={menuPaperSx}
            >
              <MenuItem value="user" sx={{ color: '#F1F5F9', '&:hover': { bgcolor: 'rgba(59,130,246,0.1)' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 28, height: 28, borderRadius: '7px', bgcolor: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Person sx={{ fontSize: 16, color: '#3B82F6' }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>Utilisateur standard</Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: '#64748B' }}>Accès aux fonctionnalités de base</Typography>
                  </Box>
                </Box>
              </MenuItem>
              <MenuItem value="admin" sx={{ color: '#F1F5F9', '&:hover': { bgcolor: 'rgba(110,231,183,0.1)' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 28, height: 28, borderRadius: '7px', bgcolor: 'rgba(110,231,183,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AdminPanelSettings sx={{ fontSize: 16, color: '#6EE7B7' }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>Administrateur</Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: '#64748B' }}>Accès complet à l'administration</Typography>
                  </Box>
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          <Alert
            severity={roleDialog.newRole === 'admin' ? 'warning' : 'info'}
            icon={roleDialog.newRole === 'admin' ? <Warning sx={{ fontSize: 18 }} /> : <CheckCircle sx={{ fontSize: 18 }} />}
            sx={{
              bgcolor: roleDialog.newRole === 'admin' ? 'rgba(234,179,8,0.08)' : 'rgba(59,130,246,0.08)',
              color: roleDialog.newRole === 'admin' ? '#EAB308' : '#3B82F6',
              border: `1px solid ${roleDialog.newRole === 'admin' ? 'rgba(234,179,8,0.2)' : 'rgba(59,130,246,0.2)'}`,
              borderRadius: '10px', fontSize: '0.8rem',
              '& .MuiAlert-icon': { color: roleDialog.newRole === 'admin' ? '#EAB308' : '#3B82F6' },
            }}
          >
            {roleDialog.newRole === 'admin'
              ? "Cet utilisateur aura accès à toutes les fonctionnalités d'administration."
              : 'Cet utilisateur aura accès uniquement aux fonctionnalités standard.'}
          </Alert>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.05)', p: 2, gap: 1 }}>
          <Button onClick={() => setRoleDialog({ open: false, user: null, newRole: 'user' })}
            sx={{ color: '#64748B', textTransform: 'none', borderRadius: '8px', '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}>
            Annuler
          </Button>
          <Button
            onClick={handleRoleChange}
            variant="contained"
            disabled={roleDialog.user?.role === roleDialog.newRole}
            sx={{ bgcolor: '#6EE7B7', color: '#080C14', fontWeight: 700, textTransform: 'none', borderRadius: '8px', px: 3, '&:hover': { bgcolor: '#4ADE80' }, '&:disabled': { bgcolor: 'rgba(110,231,183,0.2)', color: '#475569' } }}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog : Ajouter un utilisateur ──────────────────────────────────── */}
      <Dialog
        open={addDialog.open}
        onClose={() => !addDialog.loading && setAddDialog({ open: false, loading: false })}
        maxWidth="xs" fullWidth
        PaperProps={{ sx: { bgcolor: '#0F1623', borderRadius: '16px', border: '1px solid rgba(110,231,183,0.15)', backgroundImage: 'none' } }}
      >
        <DialogTitle sx={{ color: '#F1F5F9', fontWeight: 700, fontSize: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', pb: 2, fontFamily: "'Syne', sans-serif" }}>
          Ajouter un utilisateur
        </DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>
          <TextField
            label="Adresse email *" type="email" fullWidth
            value={newUser.email}
            onChange={(e) => setNewUser(u => ({ ...u, email: e.target.value }))}
            sx={fieldSx} placeholder="exemple@domaine.com"
          />
          <TextField
            label="Nom d'affichage *" fullWidth
            value={newUser.displayName}
            onChange={(e) => setNewUser(u => ({ ...u, displayName: e.target.value }))}
            sx={fieldSx} placeholder="Prénom Nom"
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel sx={{ color: '#64748B', '&.Mui-focused': { color: '#6EE7B7' } }}>Rôle</InputLabel>
            <Select
              value={newUser.role}
              onChange={(e) => setNewUser(u => ({ ...u, role: e.target.value }))}
              label="Rôle"
              sx={selectSx}
              MenuProps={menuPaperSx}
            >
              <MenuItem value="user" sx={{ color: '#F1F5F9', '&:hover': { bgcolor: 'rgba(59,130,246,0.1)' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Person sx={{ fontSize: 18, color: '#3B82F6' }} /> Utilisateur standard
                </Box>
              </MenuItem>
              <MenuItem value="admin" sx={{ color: '#F1F5F9', '&:hover': { bgcolor: 'rgba(110,231,183,0.1)' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <AdminPanelSettings sx={{ fontSize: 18, color: '#6EE7B7' }} /> Administrateur
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
          <Alert severity="info" sx={{ bgcolor: 'rgba(59,130,246,0.08)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '10px', fontSize: '0.78rem', '& .MuiAlert-icon': { color: '#3B82F6' } }}>
            L'utilisateur devra s'inscrire avec cet email pour accéder à l'application.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.05)', p: 2, gap: 1 }}>
          <Button onClick={() => setAddDialog({ open: false, loading: false })} disabled={addDialog.loading}
            sx={{ color: '#64748B', textTransform: 'none', borderRadius: '8px', '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}>
            Annuler
          </Button>
          <Button
            onClick={handleAddUser}
            variant="contained"
            disabled={addDialog.loading || !newUser.email || !newUser.displayName}
            sx={{ bgcolor: '#6EE7B7', color: '#080C14', fontWeight: 700, textTransform: 'none', borderRadius: '8px', px: 3, '&:hover': { bgcolor: '#4ADE80' }, '&:disabled': { bgcolor: 'rgba(110,231,183,0.2)', color: '#475569' } }}
          >
            {addDialog.loading ? 'Ajout en cours…' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog : Confirmer la suppression ────────────────────────────────── */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => !deleteDialog.loading && setDeleteDialog({ open: false, user: null, loading: false })}
        maxWidth="xs" fullWidth
        PaperProps={{ sx: { bgcolor: '#0F1623', borderRadius: '16px', border: '1px solid rgba(239,68,68,0.2)', backgroundImage: 'none' } }}
      >
        <DialogTitle sx={{ color: '#F1F5F9', fontWeight: 700, fontSize: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', pb: 2, fontFamily: "'Syne', sans-serif" }}>
          Confirmer la suppression
        </DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'rgba(239,68,68,0.06)', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.15)', mb: 2 }}>
            <Avatar sx={{ width: 42, height: 42, background: getAvatarGradient(deleteDialog.user?.role), color: '#fff', fontWeight: 700 }}>
              {getInitials(deleteDialog.user?.displayName, deleteDialog.user?.email)}
            </Avatar>
            <Box>
              <Typography sx={{ color: '#F1F5F9', fontWeight: 600, fontSize: '0.875rem' }}>
                {deleteDialog.user?.displayName || 'Utilisateur'}
              </Typography>
              <Typography sx={{ color: '#94A3B8', fontSize: '0.78rem' }}>{deleteDialog.user?.email}</Typography>
            </Box>
          </Box>
          <Alert severity="error" sx={{ bgcolor: 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', fontSize: '0.8rem', '& .MuiAlert-icon': { color: '#EF4444' } }}>
            Cette action est <strong>irréversible</strong>. Toutes les données associées à cet utilisateur seront supprimées définitivement.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255,255,255,0.05)', p: 2, gap: 1 }}>
          <Button onClick={() => setDeleteDialog({ open: false, user: null, loading: false })} disabled={deleteDialog.loading}
            sx={{ color: '#64748B', textTransform: 'none', borderRadius: '8px', '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}>
            Annuler
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            disabled={deleteDialog.loading}
            sx={{ bgcolor: '#EF4444', color: '#fff', fontWeight: 700, textTransform: 'none', borderRadius: '8px', px: 3, '&:hover': { bgcolor: '#DC2626' } }}
          >
            {deleteDialog.loading ? 'Suppression…' : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          sx={snackStyle(snackbar.severity)}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

    </AdminLayout>
  );
}