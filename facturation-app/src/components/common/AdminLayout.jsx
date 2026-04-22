import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
  Tooltip,
  Badge,
  Chip,
  Fade,
  Zoom,
} from '@mui/material';
import {
  Dashboard,
  People,
  Inventory,
  Category,
  Settings,
  Logout,
  AdminPanelSettings,
  CheckCircle,
  Menu as MenuIcon,
  ManageAccounts,
  Receipt,
  ChevronLeft,
  ChevronRight,
  Person,
  NotificationsNone,
  DarkMode,
  LightMode,
  ExpandMore,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { logOut, auth, db, ref, get } from '../../services/firebaseService';

const drawerWidth = 280;
const collapsedWidth = 80;

export default function AdminLayout({ children }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [anchorEl, setAnchorEl] = useState(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const user = auth.currentUser;

  // Charger le nombre de factures en attente
  useEffect(() => {
    const loadPendingCount = async () => {
      try {
        const snapshot = await get(ref(db, 'factures'));
        if (snapshot.exists()) {
          const factures = Object.values(snapshot.val());
          const pending = factures.filter(f => f.statut === 'En attente').length;
          setPendingCount(pending);
          
          // Simuler des notifications
          if (pending > 0) {
            setNotifications([
              { id: 1, message: `${pending} facture(s) en attente de validation`, type: 'warning', time: 'maintenant' }
            ]);
          }
        }
      } catch (error) {
        console.error('Erreur chargement factures:', error);
      }
    };
    loadPendingCount();
  }, []);

  const menuItems = [
    { text: 'Tableau de bord', icon: <Dashboard />, path: '/admin/dashboard', exact: true },
    { text: 'Factures', icon: <Receipt />, path: '/admin/invoices' },
    { text: 'À valider', icon: <CheckCircle />, path: '/admin/validate', badge: true, badgeCount: pendingCount },
    { divider: true },
    { text: 'Utilisateurs', icon: <ManageAccounts />, path: '/admin/users' },
    { text: 'Articles', icon: <Inventory />, path: '/admin/articles' },
    { text: 'Catégories', icon: <Category />, path: '/admin/categories' },
    { divider: true },
    { text: 'Paramètres', icon: <Settings />, path: '/admin/settings' },
  ];

  const handleLogout = async () => {
    try {
      await logOut();
      navigate('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const effectiveWidth = collapsed && !isMobile ? collapsedWidth : drawerWidth;

  const drawer = (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #0A0F1A 0%, #0D1520 100%)',
      position: 'relative',
    }}>
      {/* Effet de bordure lumineuse */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '100%',
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(110,231,183,0.3), transparent)',
      }} />
      
      {/* Header */}
      <Box sx={{
        p: collapsed ? 1.5 : 2.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        borderBottom: '1px solid rgba(110,231,183,0.08)',
        minHeight: 80,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      }}
        onClick={() => !collapsed && navigate('/admin/dashboard')}
      >
        {!collapsed && (
          <Zoom in={!collapsed} timeout={300}>
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}
              onClick={() => navigate('/admin/dashboard')}
            >
              <Box sx={{
                width: 42,
                height: 42,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6EE7B7, #3B82F6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 25px rgba(110,231,183,0.4)',
                flexShrink: 0,
                transition: 'transform 0.3s ease',
                '&:hover': { transform: 'scale(1.05)' },
              }}>
                <AdminPanelSettings sx={{ color: '#0A0F1A', fontSize: 22 }} />
              </Box>
              <Box>
                <Typography sx={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #F1F5F9 0%, #94A3B8 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  fontSize: '1.1rem',
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                }}>
                  FacturePro
                </Typography>
                <Typography sx={{ color: '#6EE7B7', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Administration
                </Typography>
              </Box>
            </Box>
          </Zoom>
        )}
        {collapsed && (
          <Zoom in={collapsed} timeout={300}>
            <Box sx={{
              width: 42, height: 42, borderRadius: '12px',
              background: 'linear-gradient(135deg, #6EE7B7, #3B82F6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 25px rgba(110,231,183,0.4)',
              transition: 'transform 0.3s ease',
              '&:hover': { transform: 'scale(1.05)' },
            }}>
              <AdminPanelSettings sx={{ color: '#0A0F1A', fontSize: 22 }} />
            </Box>
          </Zoom>
        )}
        {!isMobile && !collapsed && (
          <Tooltip title="Réduire le menu" placement="right">
            <IconButton
              onClick={(e) => { e.stopPropagation(); setCollapsed(true); }}
              size="small"
              sx={{ 
                color: '#64748B', 
                transition: 'all 0.3s ease',
                '&:hover': { color: '#6EE7B7', bgcolor: 'rgba(110,231,183,0.1)', transform: 'translateX(-2px)' } 
              }}
            >
              <ChevronLeft sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Bouton expand quand collapsed */}
      {collapsed && !isMobile && (
        <Fade in={collapsed}>
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1, pb: 1 }}>
            <Tooltip title="Agrandir le menu" placement="right">
              <IconButton
                onClick={() => setCollapsed(false)}
                size="small"
                sx={{ 
                  color: '#64748B', 
                  bgcolor: 'rgba(110,231,183,0.05)',
                  transition: 'all 0.3s ease',
                  '&:hover': { color: '#6EE7B7', bgcolor: 'rgba(110,231,183,0.15)', transform: 'scale(1.1)' } 
                }}
              >
                <ChevronRight sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Fade>
      )}

      {/* Navigation */}
      <List sx={{ flex: 1, px: collapsed ? 1 : 1.5, py: 2, overflowY: 'auto', overflowX: 'hidden' }}>
        {menuItems.map((item, index) => (
          item.divider
            ? <Divider key={`divider-${index}`} sx={{ my: 1.5, borderColor: 'rgba(110,231,183,0.06)' }} />
            : (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <Tooltip title={collapsed ? item.text : ''} placement="right" TransitionComponent={Fade}>
                  <ListItemButton
                    onClick={() => {
                      navigate(item.path);
                      if (isMobile) setMobileOpen(false);
                    }}
                    selected={isActive(item.path, item.exact)}
                    sx={{
                      borderRadius: '12px',
                      minHeight: 46,
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      px: collapsed ? 1.5 : 2,
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      '&:hover': {
                        bgcolor: 'rgba(110,231,183,0.08)',
                        transform: collapsed ? 'scale(1.05)' : 'translateX(4px)',
                      },
                      '&.Mui-selected': {
                        bgcolor: 'rgba(110,231,183,0.12)',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          top: '20%',
                          height: '60%',
                          width: 3,
                          borderRadius: '0 4px 4px 0',
                          bgcolor: '#6EE7B7',
                          boxShadow: '0 0 8px rgba(110,231,183,0.5)',
                        },
                        '&:hover': { 
                          bgcolor: 'rgba(110,231,183,0.16)' 
                        },
                      },
                    }}
                  >
                    <ListItemIcon sx={{
                      color: isActive(item.path, item.exact) ? '#6EE7B7' : '#64748B',
                      minWidth: collapsed ? 0 : 40,
                      transition: 'color 0.2s ease',
                    }}>
                      {item.badge && item.badgeCount > 0 ? (
                        <Badge badgeContent={item.badgeCount} color="error" sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 16, minWidth: 16 } }}>
                          {item.icon}
                        </Badge>
                      ) : item.icon}
                    </ListItemIcon>
                    {!collapsed && (
                      <ListItemText
                        primary={item.text}
                        sx={{
                          '& .MuiTypography-root': {
                            fontSize: '0.875rem',
                            fontWeight: isActive(item.path, item.exact) ? 600 : 500,
                            color: '#FFFFFF',
                            opacity: isActive(item.path, item.exact) ? 1 : 0.75,
                            transition: 'opacity 0.2s ease',
                          }
                        }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            )
        ))}
      </List>

      {/* Profil utilisateur */}
      <Box sx={{
        p: collapsed ? 1.5 : 2,
        borderTop: '1px solid rgba(110,231,183,0.08)',
        background: 'linear-gradient(0deg, rgba(110,231,183,0.02) 0%, transparent 100%)',
      }}>
        {!collapsed && (
          <Fade in={!collapsed}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1.5,
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(110,231,183,0.05), rgba(59,130,246,0.05))',
              border: '1px solid rgba(110,231,183,0.1)',
              mb: 1,
              transition: 'all 0.3s ease',
              '&:hover': { borderColor: 'rgba(110,231,183,0.3)', background: 'linear-gradient(135deg, rgba(110,231,183,0.08), rgba(59,130,246,0.08))' },
            }}>
              <Avatar sx={{
                width: 40, height: 40,
                background: 'linear-gradient(135deg, #6EE7B7, #3B82F6)',
                color: '#0A0F1A',
                fontSize: '1rem',
                fontWeight: 700,
                boxShadow: '0 0 15px rgba(110,231,183,0.3)',
              }}>
                {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
              </Avatar>
              <Box sx={{ flex: 1, overflow: 'hidden' }}>
                <Typography sx={{ color: '#F1F5F9', fontSize: '0.85rem', fontWeight: 600, noWrap: true }}>
                  {user?.displayName || 'Administrateur'}
                </Typography>
                <Typography sx={{ color: '#64748B', fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.email || ''}
                </Typography>
              </Box>
              <IconButton size="small" sx={{ color: '#64748B', '&:hover': { color: '#6EE7B7' } }}>
                <ExpandMore sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          </Fade>
        )}
        <Tooltip title={collapsed ? 'Déconnexion' : ''} placement="right">
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: '12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              px: collapsed ? 1.5 : 2,
              py: 1,
              transition: 'all 0.2s ease',
              '&:hover': { bgcolor: 'rgba(239,68,68,0.12)', transform: collapsed ? 'scale(1.05)' : 'none' },
            }}
          >
            <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, color: '#EF4444' }}>
              <Logout sx={{ fontSize: 20 }} />
            </ListItemIcon>
            {!collapsed && (
              <ListItemText
                primary="Déconnexion"
                sx={{
                  '& .MuiTypography-root': {
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#FFFFFF'
                  }
                }}
              />
            )}
          </ListItemButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', bgcolor: '#080C14', minHeight: '100vh' }}>
      {/* AppBar mobile */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          background: 'rgba(8,12,20,0.95)',
          backdropFilter: 'blur(20px)',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(110,231,183,0.1)',
          display: { xs: 'flex', md: 'none' },
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: '60px !important' }}>
          <IconButton onClick={() => setMobileOpen(true)} edge="start" sx={{ color: '#94A3B8' }}>
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{
              width: 32, height: 32, borderRadius: '10px',
              background: 'linear-gradient(135deg, #6EE7B7, #3B82F6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AdminPanelSettings sx={{ color: '#0A0F1A', fontSize: 18 }} />
            </Box>
            <Typography sx={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              background: 'linear-gradient(135deg, #F1F5F9, #94A3B8)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              fontSize: '1rem',
            }}>
              FacturePro
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton size="small" sx={{ color: '#94A3B8' }}>
              <NotificationsNone sx={{ fontSize: 20 }} />
            </IconButton>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }}>
              <Avatar sx={{
                width: 32, height: 32,
                background: 'linear-gradient(135deg, #6EE7B7, #3B82F6)',
                color: '#0A0F1A',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}>
                {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            bgcolor: 'transparent',
            borderRight: '1px solid rgba(110,231,183,0.1)',
            boxSizing: 'border-box',
          }
        }}
      >
        {drawer}
      </Drawer>

      {/* Drawer desktop */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: effectiveWidth,
          flexShrink: 0,
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '& .MuiDrawer-paper': {
            width: effectiveWidth,
            bgcolor: 'transparent',
            borderRight: '1px solid rgba(110,231,183,0.1)',
            position: 'fixed',
            height: '100vh',
            overflowX: 'hidden',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Contenu principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 3 },
          width: { md: `calc(100% - ${effectiveWidth}px)` },
          ml: { md: `${effectiveWidth}px` },
          mt: { xs: '60px', md: 0 },
          minHeight: '100vh',
          bgcolor: '#080C14',
          overflowX: 'hidden',
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {children}
      </Box>

      {/* Menu utilisateur */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            bgcolor: '#0D1117',
            border: '1px solid rgba(110,231,183,0.15)',
            borderRadius: '16px',
            mt: 1,
            minWidth: 200,
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(10px)',
          }
        }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Typography sx={{ color: '#FFFFFF', fontSize: '0.85rem', fontWeight: 600 }}>
            {user?.displayName || 'Administrateur'}
          </Typography>
          <Typography sx={{ color: '#64748B', fontSize: '0.7rem' }}>
            {user?.email}
          </Typography>
        </Box>
        
        <MenuItem
          onClick={() => { setAnchorEl(null); navigate('/admin/settings'); }}
          sx={{ 
            color: '#FFFFFF',
            fontSize: '0.875rem', 
            gap: 1.5, 
            py: 1.2, 
            transition: 'all 0.2s ease',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } 
          }}
        >
          <Person fontSize="small" sx={{ color: '#6EE7B7' }} />
          Mon profil
        </MenuItem>
        
        <MenuItem
          onClick={() => { setDarkMode(!darkMode); setAnchorEl(null); }}
          sx={{ 
            color: '#FFFFFF',
            fontSize: '0.875rem', 
            gap: 1.5, 
            py: 1.2,
            '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } 
          }}
        >
          {darkMode ? <LightMode fontSize="small" sx={{ color: '#EAB308' }} /> : <DarkMode fontSize="small" sx={{ color: '#6EE7B7' }} />}
          {darkMode ? 'Mode clair' : 'Mode sombre'}
        </MenuItem>
        
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
        
        <MenuItem
          onClick={handleLogout}
          sx={{ 
            fontSize: '0.875rem', 
            gap: 1.5, 
            py: 1.2,
            color: '#FFFFFF',
            '&:hover': { bgcolor: 'rgba(239,68,68,0.1)' } 
          }}
        >
          <Logout fontSize="small" sx={{ color: '#EF4444' }} />
          Déconnexion
        </MenuItem>
      </Menu>

      {/* Menu notifications */}
      <Menu
        anchorEl={notifAnchorEl}
        open={Boolean(notifAnchorEl)}
        onClose={() => setNotifAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            bgcolor: '#0D1117',
            border: '1px solid rgba(110,231,183,0.15)',
            borderRadius: '16px',
            mt: 1,
            minWidth: 280,
            maxWidth: 320,
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          }
        }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Typography sx={{ color: '#F1F5F9', fontSize: '0.85rem', fontWeight: 600 }}>Notifications</Typography>
        </Box>
        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography sx={{ color: '#64748B', fontSize: '0.8rem' }}>Aucune notification</Typography>
          </Box>
        ) : (
          notifications.map(notif => (
            <MenuItem key={notif.id} sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 1.5 }}>
              <Typography sx={{ color: '#F1F5F9', fontSize: '0.8rem' }}>{notif.message}</Typography>
              <Typography sx={{ color: '#64748B', fontSize: '0.65rem', mt: 0.5 }}>{notif.time}</Typography>
            </MenuItem>
          ))
        )}
      </Menu>
    </Box>
  );
}