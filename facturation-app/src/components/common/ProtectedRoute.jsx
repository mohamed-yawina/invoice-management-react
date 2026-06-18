import React from 'react';
import { Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Garde de route générique.
 *  - <ProtectedRoute>...</ProtectedRoute> -> nécessite d'être authentifié
 *  - <ProtectedRoute requireRole="admin">...</ProtectedRoute> -> nécessite admin
 *  - <ProtectedRoute requireRole="user">...</ProtectedRoute>  -> nécessite user (pas admin)
 *
 * Redirections :
 *  - pas auth -> /login
 *  - mauvais rôle -> son dashboard naturel
 */
export default function ProtectedRoute({ children, requireRole }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: '100vh', bgcolor: '#0D0F14',
      }}>
        <CircularProgress sx={{ color: '#6EE7B7' }} />
      </Box>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (requireRole === 'admin' && !isAdmin) {
    return <Navigate to="/app/dashboard" replace />;
  }
  if (requireRole === 'user' && isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}
