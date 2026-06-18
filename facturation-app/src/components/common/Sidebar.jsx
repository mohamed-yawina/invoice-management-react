import React from 'react';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Divider, Typography, Avatar, IconButton, Tooltip, Badge, Fade, Zoom,
} from '@mui/material';
import { ChevronLeft, ChevronRight, Logout } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import NotificationBell from './NotificationBell';
import CompanySwitcher from './CompanySwitcher';

/**
 * Sidebar générique pour User ET Admin.
 * Props:
 *  - menuItems: [{ text, icon, path, badge?, badgeCount?, exact?, divider? }]
 *  - brand: { title, subtitle?, icon, homePath }
 *  - mobileOpen, onMobileClose (contrôle du drawer temporaire mobile)
 *  - collapsed, onToggleCollapse (contrôle du collapse desktop)
 *  - drawerWidth, collapsedWidth
 */
export default function Sidebar({
  menuItems = [],
  brand,
  mobileOpen,
  onMobileClose,
  collapsed,
  onToggleCollapse,
  drawerWidth = 280,
  collapsedWidth = 80,
  isMobile = false,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const effectiveWidth = collapsed && !isMobile ? collapsedWidth : drawerWidth;

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleNav = (path) => {
    navigate(path);
    if (isMobile && onMobileClose) onMobileClose();
  };

  const content = (
    <Box sx={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(135deg, #0A0F1A 0%, #0D1520 100%)', position: 'relative',
    }}>
      <Box sx={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(110,231,183,0.3), transparent)' }} />

      {/* Header / brand */}
      <Box sx={{
        p: collapsed ? 1.5 : 2.5, display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        borderBottom: '1px solid rgba(110,231,183,0.08)', minHeight: 80, cursor: 'pointer',
      }}>
        {!collapsed ? (
          <Zoom in={!collapsed} timeout={300}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}
                 onClick={() => handleNav(brand.homePath)}>
              <Box sx={{
                width: 42, height: 42, borderRadius: '12px',
                background: 'linear-gradient(135deg, #6EE7B7, #3B82F6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 25px rgba(110,231,183,0.4)', flexShrink: 0,
                transition: 'transform 0.3s ease', '&:hover': { transform: 'scale(1.05)' },
              }}>
                {React.cloneElement(brand.icon, { sx: { color: '#0A0F1A', fontSize: 22 } })}
              </Box>
              <Box>
                <Typography sx={{
                  fontFamily: "'Syne', sans-serif", fontWeight: 800,
                  background: 'linear-gradient(135deg, #F1F5F9 0%, #94A3B8 100%)',
                  backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent',
                  fontSize: '1.1rem', lineHeight: 1.2, letterSpacing: '-0.02em',
                }}>{brand.title}</Typography>
                {brand.subtitle && (
                  <Typography sx={{ color: '#6EE7B7', fontSize: '0.6rem', fontWeight: 700,
                    letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {brand.subtitle}
                  </Typography>
                )}
              </Box>
            </Box>
          </Zoom>
        ) : (
          <Zoom in={collapsed} timeout={300}>
            <Box onClick={() => handleNav(brand.homePath)} sx={{
              width: 42, height: 42, borderRadius: '12px',
              background: 'linear-gradient(135deg, #6EE7B7, #3B82F6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 25px rgba(110,231,183,0.4)',
              '&:hover': { transform: 'scale(1.05)' },
            }}>
              {React.cloneElement(brand.icon, { sx: { color: '#0A0F1A', fontSize: 22 } })}
            </Box>
          </Zoom>
        )}
        {!isMobile && !collapsed && (
          <Tooltip title="Réduire le menu" placement="right">
            <IconButton onClick={(e) => { e.stopPropagation(); onToggleCollapse(); }}
              size="small" sx={{ color: '#64748B',
                '&:hover': { color: '#6EE7B7', bgcolor: 'rgba(110,231,183,0.1)' } }}>
              <ChevronLeft sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {collapsed && !isMobile && (
        <Fade in={collapsed}>
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1, pb: 1 }}>
            <Tooltip title="Agrandir le menu" placement="right">
              <IconButton onClick={onToggleCollapse} size="small" sx={{
                color: '#64748B', bgcolor: 'rgba(110,231,183,0.05)',
                '&:hover': { color: '#6EE7B7', bgcolor: 'rgba(110,231,183,0.15)' },
              }}>
                <ChevronRight sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Fade>
      )}

      <CompanySwitcher collapsed={collapsed && !isMobile} />

      {/* Navigation */}
      <List sx={{ flex: 1, px: collapsed ? 1 : 1.5, py: 2, overflowY: 'auto', overflowX: 'hidden' }}>
        {menuItems.map((item, idx) => item.divider ? (
          <Divider key={`d-${idx}`} sx={{ my: 1.5, borderColor: 'rgba(110,231,183,0.06)' }} />
        ) : (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <Tooltip title={collapsed ? item.text : ''} placement="right" TransitionComponent={Fade}>
              <ListItemButton
                onClick={() => handleNav(item.path)}
                selected={isActive(item.path, item.exact)}
                sx={{
                  borderRadius: '12px', minHeight: 46,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  px: collapsed ? 1.5 : 2,
                  transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)', position: 'relative',
                  '&:hover': { bgcolor: 'rgba(110,231,183,0.08)',
                    transform: collapsed ? 'scale(1.05)' : 'translateX(4px)' },
                  '&.Mui-selected': {
                    bgcolor: 'rgba(110,231,183,0.12)',
                    '&::before': {
                      content: '""', position: 'absolute', left: 0, top: '20%',
                      height: '60%', width: 3, borderRadius: '0 4px 4px 0',
                      bgcolor: '#6EE7B7', boxShadow: '0 0 8px rgba(110,231,183,0.5)',
                    },
                    '&:hover': { bgcolor: 'rgba(110,231,183,0.16)' },
                  },
                }}
              >
                <ListItemIcon sx={{
                  color: isActive(item.path, item.exact) ? '#6EE7B7' : '#64748B',
                  minWidth: collapsed ? 0 : 40,
                }}>
                  {item.badge && item.badgeCount > 0 ? (
                    <Badge badgeContent={item.badgeCount} color="error"
                      sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 16, minWidth: 16 } }}>
                      {item.icon}
                    </Badge>
                  ) : item.icon}
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText primary={item.text} sx={{
                    '& .MuiTypography-root': {
                      fontSize: '0.875rem',
                      fontWeight: isActive(item.path, item.exact) ? 600 : 500,
                      color: '#FFFFFF',
                      opacity: isActive(item.path, item.exact) ? 1 : 0.75,
                    }
                  }} />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>

      {/* Profil utilisateur */}
      <Box sx={{
        p: collapsed ? 1.5 : 2, borderTop: '1px solid rgba(110,231,183,0.08)',
        background: 'linear-gradient(0deg, rgba(110,231,183,0.02) 0%, transparent 100%)',
      }}>
        {!collapsed && (
          <Fade in={!collapsed}>
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(110,231,183,0.05), rgba(59,130,246,0.05))',
              border: '1px solid rgba(110,231,183,0.1)', mb: 1,
              '&:hover': { borderColor: 'rgba(110,231,183,0.3)' },
            }}>
              <Avatar sx={{
                width: 40, height: 40,
                background: 'linear-gradient(135deg, #6EE7B7, #3B82F6)',
                color: '#0A0F1A', fontSize: '1rem', fontWeight: 700,
                boxShadow: '0 0 15px rgba(110,231,183,0.3)',
              }}>
                {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </Avatar>
              <Box sx={{ flex: 1, overflow: 'hidden' }}>
                <Typography sx={{ color: '#F1F5F9', fontSize: '0.85rem', fontWeight: 600 }}>
                  {user?.displayName || 'Utilisateur'}
                </Typography>
                <Typography sx={{ color: '#64748B', fontSize: '0.7rem',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.email || ''}
                </Typography>
              </Box>
              <NotificationBell iconSize={18} compact />
            </Box>
          </Fade>
        )}
        {collapsed && !isMobile && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
            <NotificationBell iconSize={20} compact />
          </Box>
        )}
        <Tooltip title={collapsed ? 'Déconnexion' : ''} placement="right">
          <ListItemButton onClick={handleLogout} sx={{
            borderRadius: '12px', justifyContent: collapsed ? 'center' : 'flex-start',
            px: collapsed ? 1.5 : 2, py: 1,
            '&:hover': { bgcolor: 'rgba(239,68,68,0.12)' },
          }}>
            <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, color: '#EF4444' }}>
              <Logout sx={{ fontSize: 20 }} />
            </ListItemIcon>
            {!collapsed && <ListItemText primary="Déconnexion" sx={{
              '& .MuiTypography-root': { fontSize: '0.875rem', fontWeight: 500, color: '#FFFFFF' }
            }} />}
          </ListItemButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <>
      <Drawer variant="temporary" open={mobileOpen} onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: drawerWidth, bgcolor: 'transparent',
            borderRight: '1px solid rgba(110,231,183,0.1)', boxSizing: 'border-box',
          }
        }}>
        {content}
      </Drawer>
      <Drawer variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: effectiveWidth, flexShrink: 0,
          transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
          '& .MuiDrawer-paper': {
            width: effectiveWidth, bgcolor: 'transparent',
            borderRight: '1px solid rgba(110,231,183,0.1)',
            position: 'fixed', height: '100vh', overflowX: 'hidden',
            transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
          }
        }}>
        {content}
      </Drawer>
    </>
  );
}
