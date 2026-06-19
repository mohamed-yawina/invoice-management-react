import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';

import Login from '../pages/Login';
import Register from '../pages/Register';
import LandingPage from '../pages/LandingPage';

import UserDashboard from '../pages/user/UserDashboard';
import Clients from '../pages/user/Clients';
import CreateInvoice from '../pages/user/CreateInvoice';
import InvoiceHistory from '../pages/user/InvoiceHistory';
import UserSettings from '../pages/user/UserSettings';

import AdminDashboard from '../pages/admin/AdminDashboard';
import ValidateInvoices from '../pages/admin/ValidateInvoices';
import ManageUsers from '../pages/admin/ManageUsers';
import ManageArticles from '../pages/admin/ManageArticles';
import ManageCategories from '../pages/admin/ManageCategories';
import ManageCompanies from '../pages/admin/ManageCompanies';
import AdminInvoices from '../pages/admin/Invoices';
import AnnualArchive from '../pages/admin/AnnualArchive';
import Settings from '../pages/admin/Settings';
import VerifyInvoicePage from '../pages/VerifyInvoicePage';

import { useThemeMode } from '../contexts/ThemeModeContext';
import ProtectedRoute from '../components/common/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';

/**
 * Définition centralisée de toutes les routes de l'application.
 * Trois groupes :
 *   - Public : /, /login, /register (login/register inaccessibles si déjà connecté)
 *   - User   : /app/*       (ProtectedRoute requireRole="user")
 *   - Admin  : /admin/*     (ProtectedRoute requireRole="admin")
 */

// Écran de chargement plein page
const AppLoadingScreen = () => {
  const { palette } = useThemeMode();
  return (
    <Box sx={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: '100vh', bgcolor: palette.bg.page,
    }}>
      <CircularProgress sx={{ color: palette.accent.blue }} />
    </Box>
  );
};

// Redirige un visiteur déjà connecté vers son dashboard
const PublicOnly = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <AppLoadingScreen />;
  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/admin/dashboard' : '/app/dashboard'} replace />;
  }
  return children;
};

// Landing page publique ; redirige vers le dashboard si déjà connecté
const LandingRoute = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <AppLoadingScreen />;
  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/admin/dashboard' : '/app/dashboard'} replace />;
  }
  return <LandingPage />;
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
      <Route path="/" element={<LandingRoute />} />
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />

      {/* Vérification QR (public, lecture seule) */}
      <Route path="/verify-invoice/:invoiceId" element={<VerifyInvoicePage />} />

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
      <Route path="/app/settings" element={
        <ProtectedRoute requireRole="user"><UserSettings /></ProtectedRoute>
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
      <Route path="/admin/companies" element={
        <ProtectedRoute requireRole="admin"><ManageCompanies /></ProtectedRoute>
      } />
      <Route path="/admin/invoices" element={
        <ProtectedRoute requireRole="admin"><AdminInvoices /></ProtectedRoute>
      } />
      <Route path="/admin/archives" element={
        <ProtectedRoute requireRole="admin"><AnnualArchive /></ProtectedRoute>
      } />
      <Route path="/admin/settings" element={
        <ProtectedRoute requireRole="admin"><Settings /></ProtectedRoute>
      } />

      {/* 404 */}
      <Route path="*" element={<NotFoundRedirect />} />
    </Routes>
  );
}
