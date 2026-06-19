import React, { useState } from 'react';
import {
  IconButton, Badge, Menu, MenuItem, Box, Typography, Divider, Fade, Button,
  Tooltip, Chip,
} from '@mui/material';
import {
  NotificationsNone, NotificationsActive, CheckCircle, Cancel, Receipt,
  Email, Notifications, Done, DeleteOutlined, MarkEmailRead,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';

const typeIcon = (type) => {
  switch (type) {
    case 'success': return <CheckCircle sx={{ fontSize: 18, color: '#22C55E' }} />;
    case 'error': return <Cancel sx={{ fontSize: 18, color: '#EF4444' }} />;
    case 'warning': return <Receipt sx={{ fontSize: 18, color: '#EAB308' }} />;
    case 'email': return <Email sx={{ fontSize: 18, color: '#3B82F6' }} />;
    default: return <Notifications sx={{ fontSize: 18, color: '#2563EB' }} />;
  }
};

const typeColor = (type) => {
  switch (type) {
    case 'success': return '#22C55E';
    case 'error': return '#EF4444';
    case 'warning': return '#EAB308';
    case 'email': return '#3B82F6';
    default: return '#2563EB';
  }
};

const formatRelative = (iso) => {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'à l\'instant';
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 7) return `il y a ${Math.floor(diff / 86400)} j`;
  return new Date(iso).toLocaleDateString('fr-FR');
};

/**
 * Cloche de notifications connectée au NotificationContext.
 *
 * Props :
 *  - iconSize (par défaut 22)
 *  - iconColor (par défaut #94A3B8)
 *  - compact (cloche en mode compact pour mobile)
 */
export default function NotificationBell({ iconSize = 22, iconColor = '#94A3B8', compact = false }) {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeOne, clearAll } = useNotifications();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = async (notif) => {
    setAnchorEl(null);
    if (!notif.read) await markAsRead(notif.id);
    if (notif.link) navigate(notif.link);
  };

  const visible = notifications.slice(0, 10);

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          size={compact ? 'small' : 'medium'}
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{ color: iconColor, '&:hover': { color: '#2563EB', bgcolor: 'rgba(37,99,235,0.08)' } }}
        >
          <Badge
            badgeContent={unreadCount}
            color="error"
            max={99}
            sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 18, minWidth: 18, fontWeight: 700 } }}
          >
            {unreadCount > 0
              ? <NotificationsActive sx={{ fontSize: iconSize }} />
              : <NotificationsNone sx={{ fontSize: iconSize }} />}
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        TransitionComponent={Fade}
        PaperProps={{ sx: {
          bgcolor: 'var(--app-bg-card)', border: '1px solid rgba(37,99,235,0.15)',
          borderRadius: '14px', mt: 1.5, minWidth: 340, maxWidth: 380,
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          maxHeight: 520, overflow: 'hidden',
        }}}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Box>
            <Typography sx={{ color: 'var(--app-text-primary)', fontSize: '0.95rem', fontWeight: 700 }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Chip
                size="small"
                label={`${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`}
                sx={{ mt: 0.3, height: 18, fontSize: '0.65rem', bgcolor: 'rgba(239,68,68,0.15)', color: '#EF4444', fontWeight: 600 }}
              />
            )}
          </Box>
          {unreadCount > 0 && (
            <Tooltip title="Tout marquer comme lu">
              <IconButton size="small" onClick={markAllAsRead} sx={{ color: '#2563EB' }}>
                <MarkEmailRead fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {visible.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <NotificationsNone sx={{ fontSize: 40, color: '#334155', mb: 1 }} />
            <Typography sx={{ color: 'var(--app-text-secondary)', fontSize: '0.85rem' }}>
              Aucune notification
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 380, overflowY: 'auto' }}>
            {visible.map((n) => (
              <MenuItem
                key={n.id}
                onClick={() => handleClick(n)}
                sx={{
                  px: 2, py: 1.3, display: 'flex', alignItems: 'flex-start', gap: 1.2,
                  borderLeft: '3px solid', borderLeftColor: typeColor(n.type),
                  bgcolor: n.read ? 'transparent' : 'rgba(37,99,235,0.06)',
                  whiteSpace: 'normal',
                  '&:hover': { bgcolor: 'rgba(37,99,235,0.08)' },
                }}
              >
                <Box sx={{ flexShrink: 0, mt: 0.3 }}>{typeIcon(n.type)}</Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {n.title && (
                    <Typography sx={{
                      color: 'var(--app-text-primary)', fontSize: '0.8rem',
                      fontWeight: n.read ? 500 : 700, mb: 0.2,
                    }}>
                      {n.title}
                    </Typography>
                  )}
                  {n.message && (
                    <Typography sx={{
                      color: '#94A3B8', fontSize: '0.75rem', lineHeight: 1.35,
                    }}>
                      {n.message}
                    </Typography>
                  )}
                  <Typography sx={{ color: '#475569', fontSize: '0.65rem', mt: 0.4 }}>
                    {formatRelative(n.createdAt)}
                  </Typography>
                </Box>
                <Tooltip title="Supprimer">
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); removeOne(n.id); }}
                    sx={{ color: '#475569', opacity: 0.7,
                      '&:hover': { color: '#EF4444', opacity: 1, bgcolor: 'rgba(239,68,68,0.08)' } }}
                  >
                    <DeleteOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
              </MenuItem>
            ))}
          </Box>
        )}

        {notifications.length > 0 && (
          <>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
            <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                size="small"
                startIcon={<Done fontSize="small" />}
                onClick={() => { clearAll(); setAnchorEl(null); }}
                sx={{ color: '#94A3B8', fontSize: '0.72rem', textTransform: 'none',
                  '&:hover': { color: '#EF4444', bgcolor: 'rgba(239,68,68,0.05)' } }}
              >
                Tout effacer
              </Button>
            </Box>
          </>
        )}
      </Menu>
    </>
  );
}
