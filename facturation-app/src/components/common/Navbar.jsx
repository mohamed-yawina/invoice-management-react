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
import { ThemeToggleIcon } from './ThemeToggle';
import { useThemeMode } from '../../contexts/ThemeModeContext';

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
  const { palette, gradients, isDark } = useThemeMode();
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
        background: isDark ? 'rgba(15,22,35,0.95)' : 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.08)', borderBottom: `1px solid ${palette.line.subtle}`,
        display: { xs: 'flex', md: 'none' },
      }}>
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: '60px !important' }}>
          <IconButton onClick={onMobileMenuOpen} edge="start" sx={{ color: palette.text.secondary }}>
            <MenuIcon />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{
              width: 32, height: 32, borderRadius: '10px',
              background: gradients.brand,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {React.cloneElement(brand.icon, { sx: { color: '#FFFFFF', fontSize: 18 } })}
            </Box>
            <Typography sx={{
              fontFamily: "'Syne', sans-serif", fontWeight: 800,
              color: palette.text.primary,
              fontSize: '1rem',
            }}>
              {brand.title}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ThemeToggleIcon />
            <NotificationBell compact iconSize={20} />
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }}>
              <Avatar sx={{
                width: 32, height: 32,
                background: gradients.brand,
                color: '#FFFFFF', fontSize: '0.8rem', fontWeight: 700,
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
          bgcolor: palette.bg.card, border: `1px solid ${palette.line.subtle}`,
          borderRadius: '16px', mt: 1, minWidth: 200,
          boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
        }}}>
        <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${palette.line.subtle}` }}>
          <Typography sx={{ color: palette.text.primary, fontSize: '0.85rem', fontWeight: 600 }}>
            {user?.displayName || 'Utilisateur'}
          </Typography>
          <Typography sx={{ color: palette.text.muted, fontSize: '0.7rem' }}>{user?.email}</Typography>
        </Box>
        {profilePath && (
          <MenuItem onClick={() => { setAnchorEl(null); navigate(profilePath); }}
            sx={{ color: palette.text.primary, fontSize: '0.875rem', gap: 1.5, py: 1.2,
              '&:hover': { bgcolor: palette.bg.deep } }}>
            <Person fontSize="small" sx={{ color: palette.accent.blue }} />
            Mon profil
          </MenuItem>
        )}
        <Divider sx={{ borderColor: palette.line.subtle }} />
        <MenuItem onClick={handleLogout}
          sx={{ fontSize: '0.875rem', gap: 1.5, py: 1.2, color: palette.text.primary,
            '&:hover': { bgcolor: 'rgba(220,38,38,0.08)' } }}>
          <Logout fontSize="small" sx={{ color: '#EF4444' }} />
          Déconnexion
        </MenuItem>
      </Menu>
    </>
  );
}
