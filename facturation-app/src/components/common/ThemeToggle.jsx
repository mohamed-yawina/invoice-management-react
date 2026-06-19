import React from 'react';
import { IconButton, Tooltip, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';
import { useThemeMode } from '../../contexts/ThemeModeContext';

/** Bouton compact (navbar / icône seule). */
export function ThemeToggleIcon({ size = 'medium' }) {
  const { isDark, toggleTheme, palette } = useThemeMode();
  return (
    <Tooltip title={isDark ? 'Mode clair' : 'Mode sombre'}>
      <IconButton
        onClick={toggleTheme}
        size={size}
        sx={{
          color: palette.text.muted,
          '&:hover': { color: palette.accent.blue, bgcolor: 'rgba(37,99,235,0.08)' },
        }}
      >
        {isDark ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
}

/** Entrée sidebar (texte + icône). */
export default function ThemeToggle({ collapsed = false }) {
  const { isDark, toggleTheme, palette } = useThemeMode();
  const label = isDark ? 'Mode clair' : 'Mode sombre';

  return (
    <Tooltip title={collapsed ? label : ''} placement="right">
      <ListItemButton
        onClick={toggleTheme}
        sx={{
          borderRadius: '12px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          px: collapsed ? 1.5 : 2,
          py: 1,
          mb: 0.5,
          '&:hover': { bgcolor: 'rgba(37,99,235,0.06)' },
        }}
      >
        <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, color: palette.text.muted }}>
          {isDark ? <LightMode sx={{ fontSize: 20 }} /> : <DarkMode sx={{ fontSize: 20 }} />}
        </ListItemIcon>
        {!collapsed && (
          <ListItemText primary={label} sx={{
            '& .MuiTypography-root': {
              fontSize: '0.875rem',
              fontWeight: 500,
              color: palette.text.primary,
            },
          }} />
        )}
      </ListItemButton>
    </Tooltip>
  );
}
