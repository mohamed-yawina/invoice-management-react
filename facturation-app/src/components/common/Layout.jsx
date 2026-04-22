import React, { useState } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton, Avatar,
  Menu, MenuItem, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Divider, useTheme, useMediaQuery, Tooltip,
} from '@mui/material';
import { Dashboard, Receipt, People, Settings, Logout, Menu as MenuIcon, ChevronLeft, Person } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { logOut, auth } from '../../services/firebaseService';

const drawerWidth = 260;
const collapsedWidth = 72;

export default function Layout({ children }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const user = auth.currentUser;

  const menuItems = [
    { text: 'Tableau de bord', icon: <Dashboard />, path: '/app/dashboard' },
    { text: 'Factures', icon: <Receipt />, path: '/app/invoices' },
    { text: 'Clients', icon: <People />, path: '/app/clients' },
    { divider: true },
    { text: 'Paramètres', icon: <Settings />, path: '/app/settings' },
  ];

  const handleLogout = async () => { await logOut(); navigate('/'); };
  const isActive = (path) => location.pathname === path;
  const effectiveWidth = collapsed && !isMobile ? collapsedWidth : drawerWidth;

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #0D1117 0%, #0D1520 100%)' }}>
      <Box sx={{ p: collapsed ? 1.5 : 2.5, display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', borderBottom: '1px solid rgba(110,231,183,0.1)', minHeight: 64 }}>
        {!collapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', flex: 1 }} onClick={() => navigate('/app/dashboard')}>
            <Box sx={{ width: 34, height: 34, borderRadius: '9px', background: 'linear-gradient(135deg, #6EE7B7, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(110,231,183,0.25)' }}>
              <Receipt sx={{ color: '#0D1117', fontSize: 18 }} />
            </Box>
            <Typography sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: '#F1F5F9', fontSize: '1rem' }}>FacturePro</Typography>
          </Box>
        )}
        {collapsed && (
          <Box sx={{ width: 34, height: 34, borderRadius: '9px', background: 'linear-gradient(135deg, #6EE7B7, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => navigate('/app/dashboard')}>
            <Receipt sx={{ color: '#0D1117', fontSize: 18 }} />
          </Box>
        )}
        {!isMobile && !collapsed && (
          <Tooltip title="Réduire"><IconButton onClick={() => setCollapsed(true)} size="small" sx={{ color: '#64748B' }}><ChevronLeft sx={{ fontSize: 18 }} /></IconButton></Tooltip>
        )}
      </Box>

      <List sx={{ flex: 1, px: collapsed ? 1 : 1.5, py: 2 }}>
        {menuItems.map((item, idx) => item.divider ? <Divider key={`div-${idx}`} sx={{ my: 1, borderColor: 'rgba(110,231,183,0.07)' }} /> : (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <Tooltip title={collapsed ? item.text : ''} placement="right">
              <ListItemButton onClick={() => { navigate(item.path); if (isMobile) setMobileOpen(false); }} selected={isActive(item.path)} sx={{ borderRadius: '10px', minHeight: 44, justifyContent: collapsed ? 'center' : 'flex-start', px: collapsed ? 1.5 : 2, '&.Mui-selected': { bgcolor: 'rgba(110,231,183,0.11)', '&::before': { content: '""', position: 'absolute', left: 0, top: '20%', height: '60%', width: 3, borderRadius: '0 3px 3px 0', bgcolor: '#6EE7B7' } } }}>
                <ListItemIcon sx={{ color: isActive(item.path) ? '#6EE7B7' : '#64748B', minWidth: collapsed ? 0 : 40 }}>{item.icon}</ListItemIcon>
                {!collapsed && <ListItemText primary={item.text} sx={{ '& .MuiTypography-root': { fontSize: '0.875rem', fontWeight: isActive(item.path) ? 600 : 400, color: isActive(item.path) ? '#F1F5F9' : '#94A3B8' } }} />}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>

      <Box sx={{ p: collapsed ? 1 : 1.5, borderTop: '1px solid rgba(110,231,183,0.07)' }}>
        {!collapsed && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: '10px', bgcolor: 'rgba(255,255,255,0.03)', mb: 1 }}>
          <Avatar sx={{ width: 32, height: 32, background: 'linear-gradient(135deg, #6EE7B7, #3B82F6)', color: '#0D1117', fontSize: '0.8rem', fontWeight: 700 }}>{user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}</Avatar>
          <Box sx={{ flex: 1, overflow: 'hidden' }}><Typography sx={{ color: '#F1F5F9', fontSize: '0.8rem', fontWeight: 600, noWrap: true }}>{user?.displayName || 'Utilisateur'}</Typography><Typography sx={{ color: '#64748B', fontSize: '0.7rem', noWrap: true }}>{user?.email || ''}</Typography></Box>
        </Box>}
        <Tooltip title={collapsed ? 'Déconnexion' : ''} placement="right">
          <ListItemButton onClick={handleLogout} sx={{ borderRadius: '10px', justifyContent: collapsed ? 'center' : 'flex-start', px: collapsed ? 1.5 : 2, py: 1, '&:hover': { bgcolor: 'rgba(239,68,68,0.1)' } }}>
            <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36, color: '#EF4444' }}><Logout sx={{ fontSize: 18 }} /></ListItemIcon>
            {!collapsed && <ListItemText primary="Déconnexion" sx={{ '& .MuiTypography-root': { color: '#EF4444', fontSize: '0.875rem', fontWeight: 500 } }} />}
          </ListItemButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', bgcolor: '#080C14', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: 1201, background: 'rgba(13,17,23,0.95)', backdropFilter: 'blur(20px)', boxShadow: 'none', borderBottom: '1px solid rgba(110,231,183,0.1)', display: { xs: 'flex', md: 'none' } }}>
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: '60px' }}>
          <IconButton onClick={() => setMobileOpen(true)} edge="start"><MenuIcon sx={{ color: '#94A3B8' }} /></IconButton>
          <Typography sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: '#F1F5F9' }}>FacturePro</Typography>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}><Avatar sx={{ width: 32, height: 32, background: 'linear-gradient(135deg, #6EE7B7, #3B82F6)', color: '#0D1117', fontSize: '0.8rem', fontWeight: 700 }}>{user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}</Avatar></IconButton>
        </Toolbar>
      </AppBar>

      <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth, bgcolor: 'transparent', borderRight: '1px solid rgba(110,231,183,0.1)' } }}>{drawerContent}</Drawer>
      <Drawer variant="permanent" sx={{ display: { xs: 'none', md: 'block' }, width: effectiveWidth, flexShrink: 0, '& .MuiDrawer-paper': { width: effectiveWidth, bgcolor: 'transparent', borderRight: '1px solid rgba(110,231,183,0.1)', position: 'fixed', height: '100vh', overflowX: 'hidden', transition: 'width 0.25s ease' } }}>{drawerContent}</Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, width: { md: `calc(100% - ${effectiveWidth}px)` }, ml: { md: `${effectiveWidth}px` }, mt: { xs: '60px', md: 0 }, minHeight: '100vh', bgcolor: '#080C14', overflowX: 'hidden', transition: 'margin-left 0.25s ease, width 0.25s ease' }}>{children}</Box>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} PaperProps={{ sx: { bgcolor: '#0D1117', border: '1px solid rgba(110,231,183,0.15)', borderRadius: '12px', mt: 1, minWidth: 180 } }}>
        <MenuItem onClick={() => { setAnchorEl(null); navigate('/app/settings'); }} sx={{ color: '#94A3B8', gap: 1.5 }}><Person fontSize="small" />Mon profil</MenuItem>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
        <MenuItem onClick={handleLogout} sx={{ color: '#EF4444', gap: 1.5 }}><Logout fontSize="small" />Déconnexion</MenuItem>
      </Menu>
    </Box>
  );
}