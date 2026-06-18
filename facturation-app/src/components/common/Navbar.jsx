import React, { useState } from 'react';
import {
  AppBar, Toolbar, IconButton, Typography, Box, Avatar,
  Menu, MenuItem, Divider, Fade,
} from '@mui/material';
import {
  Menu as MenuIcon, Person, Logout,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import NotificationBell from './NotificationBell';

/**
 * Topbar mobile (affichée uniquement en < md). Gère :
 *  - bouton ouverture drawer mobile
 *  - cloche de notifications (NotificationBell)
 *  - menu utilisateur (profil / déconnexion)
 *
 * Props :
 *  - onMobileMenuOpen()
 *  - brand: { title, icon }
 *  - profilePath (ex: /admin/settings ou /app/settings)
 */
export default function Navbar({ onMobileMenuOpen, brand, profilePath }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleLogout = async () => {
    setAnchorEl(null);
    await logout();
    navigate('/');
  };

  return (
    <>
      <AppBar position="fixed" sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: 'rgba(8,12,20,0.95)', backdropFilter: 'blur(20px)',
        boxShadow: 'none', borderBottom: '1px solid rgba(110,231,183,0.1)',
        display: { xs: 'flex', md: 'none' },
      }}>
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: '60px !important' }}>
          <IconButton onClick={onMobileMenuOpen} edge="start" sx={{ color: '#94A3B8' }}>
            <MenuIcon />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{
              width: 32, height: 32, borderRadius: '10px',
              background: 'linear-gradient(135deg, #6EE7B7, #3B82F6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {React.cloneElement(brand.icon, { sx: { color: '#0A0F1A', fontSize: 18 } })}
            </Box>
            <Typography sx={{
              fontFamily: "'Syne', sans-serif", fontWeight: 800,
              background: 'linear-gradient(135deg, #F1F5F9, #94A3B8)',
              backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent',
              fontSize: '1rem',
            }}>
              {brand.title}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <NotificationBell compact iconSize={20} />
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }}>
              <Avatar sx={{
                width: 32, height: 32,
                background: 'linear-gradient(135deg, #6EE7B7, #3B82F6)',
                color: '#0A0F1A', fontSize: '0.8rem', fontWeight: 700,
              }}>
                {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Menu utilisateur */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        TransitionComponent={Fade}
        PaperProps={{ sx: {
          bgcolor: '#0D1117', border: '1px solid rgba(110,231,183,0.15)',
          borderRadius: '16px', mt: 1, minWidth: 200,
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        }}}>
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Typography sx={{ color: '#FFFFFF', fontSize: '0.85rem', fontWeight: 600 }}>
            {user?.displayName || 'Utilisateur'}
          </Typography>
          <Typography sx={{ color: '#64748B', fontSize: '0.7rem' }}>{user?.email}</Typography>
        </Box>
        {profilePath && (
          <MenuItem onClick={() => { setAnchorEl(null); navigate(profilePath); }}
            sx={{ color: '#FFFFFF', fontSize: '0.875rem', gap: 1.5, py: 1.2,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}>
            <Person fontSize="small" sx={{ color: '#6EE7B7' }} />
            Mon profil
          </MenuItem>
        )}
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
        <MenuItem onClick={handleLogout}
          sx={{ fontSize: '0.875rem', gap: 1.5, py: 1.2, color: '#FFFFFF',
            '&:hover': { bgcolor: 'rgba(239,68,68,0.1)' } }}>
          <Logout fontSize="small" sx={{ color: '#EF4444' }} />
          Déconnexion
        </MenuItem>
      </Menu>
    </>
  );
}
