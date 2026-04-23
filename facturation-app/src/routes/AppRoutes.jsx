import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';

import Login from '../pages/Login';
import Register from '../pages/Register';

import UserDashboard from '../pages/user/UserDashboard';
import Clients from '../pages/user/Clients';
import CreateInvoice from '../pages/user/CreateInvoice';
import InvoiceHistory from '../pages/user/InvoiceHistory';

import AdminDashboard from '../pages/admin/AdminDashboard';
import ValidateInvoices from '../pages/admin/ValidateInvoices';
import ManageUsers from '../pages/admin/ManageUsers';
import ManageArticles from '../pages/admin/ManageArticles';
import ManageCategories from '../pages/admin/ManageCategories';
import AdminInvoices from '../pages/admin/Invoices';
import Settings from '../pages/admin/Settings';

import ProtectedRoute from '../components/common/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';

/**
 * Définition centralisée de toutes les routes de l'application.
 * Trois groupes :
 *   - Public : /, /register (inaccessibles si déjà connecté)
 *   - User   : /app/*       (ProtectedRoute requireRole="user")
 *   - Admin  : /admin/*     (ProtectedRoute requireRole="admin")
 */

// Redirige un visiteur déjà connecté vers son dashboard
const PublicOnly = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: '100vh', bgcolor: '#0D0F14' }}>
        <CircularProgress sx={{ color: '#6EE7B7' }} />
      </Box>
    );
  }
  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/admin/dashboard' : '/app/dashboard'} replace />;
  }
  return children;
};

// Redirige la racine vers le bon dashboard si connecté, sinon /login
const HomeRedirect = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: '100vh', bgcolor: '#0D0F14' }}>
        <CircularProgress sx={{ color: '#6EE7B7' }} />
      </Box>
    );
  }
  if (!isAuthenticated) return <Login />;
  return <Navigate to={isAdmin ? '/admin/dashboard' : '/app/dashboard'} replace />;
};

// Catch-all : ramène à la bonne racine
const NotFoundRedirect = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <Navigate to={isAdmin ? '/admin/dashboard' : '/app/dashboard'} replace />;
};

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />

      {/* User (accessibles uniquement aux comptes USER authentifiés) */}
      <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/app/dashboard" element={
        <ProtectedRoute requireRole="user"><UserDashboard /></ProtectedRoute>
      } />
      <Route path="/app/clients" element={
        <ProtectedRoute requireRole="user"><Clients /></ProtectedRoute>
      } />
      <Route path="/app/invoices" element={
        <ProtectedRoute requireRole="user"><InvoiceHistory /></ProtectedRoute>
      } />
      <Route path="/app/invoices/new" element={
        <ProtectedRoute requireRole="user"><CreateInvoice /></ProtectedRoute>
      } />

      {/* Admin (accessibles uniquement aux comptes ADMIN authentifiés) */}
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin/dashboard" element={
        <ProtectedRoute requireRole="admin"><AdminDashboard /></ProtectedRoute>
      } />
      <Route path="/admin/validate" element={
        <ProtectedRoute requireRole="admin"><ValidateInvoices /></ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute requireRole="admin"><ManageUsers /></ProtectedRoute>
      } />
      <Route path="/admin/articles" element={
        <ProtectedRoute requireRole="admin"><ManageArticles /></ProtectedRoute>
      } />
      <Route path="/admin/categories" element={
        <ProtectedRoute requireRole="admin"><ManageCategories /></ProtectedRoute>
      } />
      <Route path="/admin/invoices" element={
        <ProtectedRoute requireRole="admin"><AdminInvoices /></ProtectedRoute>
      } />
      <Route path="/admin/settings" element={
        <ProtectedRoute requireRole="admin"><Settings /></ProtectedRoute>
      } />

      {/* 404 */}
      <Route path="*" element={<NotFoundRedirect />} />
    </Routes>
  );
}
