import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, getUserRole } from './services/firebaseService';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/user/UserDashboard';
import Clients from './pages/user/Clients';
import CreateInvoice from './pages/user/CreateInvoice';
import InvoiceHistory from './pages/user/InvoiceHistory';
import AdminDashboard from './pages/admin/AdminDashboard';
import ValidateInvoices from './pages/admin/ValidateInvoices';
import ManageUsers from './pages/admin/ManageUsers';
import ManageArticles from './pages/admin/ManageArticles';
import ManageCategories from './pages/admin/ManageCategories';
import AdminInvoices from './pages/admin/Invoices';
import Settings from './pages/admin/Settings';
import { CircularProgress, Box, CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import darkTheme from './theme/darkTheme';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const role = await getUserRole(user.uid);
        setIsAdmin(role === 'admin');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#0D0F14' }}>
        <CircularProgress sx={{ color: '#6EE7B7' }} />
      </Box>
    </ThemeProvider>
  );
  if (!user) return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </ThemeProvider>
  );

  const homePath = isAdmin ? "/admin/dashboard" : "/app/dashboard";

  // Route user : un admin est automatiquement renvoyé vers son dashboard
  const UserRoute = ({ children }) =>
    isAdmin ? <Navigate to="/admin/dashboard" replace /> : children;

  // Route admin : un user non-admin est renvoyé vers son dashboard
  const AdminRoute = ({ children }) =>
    isAdmin ? children : <Navigate to="/app/dashboard" replace />;

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Routes>
        {/* Racine et /app -> redirigent vers le bon dashboard selon le rôle */}
        <Route path="/" element={<Navigate to={homePath} replace />} />
        <Route path="/app" element={<Navigate to={homePath} replace />} />

        {/* Routes USER (bloquées pour admin) */}
        <Route path="/app/dashboard" element={<UserRoute><UserDashboard /></UserRoute>} />
        <Route path="/app/clients" element={<UserRoute><Clients /></UserRoute>} />
        <Route path="/app/invoices" element={<UserRoute><InvoiceHistory /></UserRoute>} />
        <Route path="/app/invoices/new" element={<UserRoute><CreateInvoice /></UserRoute>} />

        {/* Routes ADMIN (bloquées pour non-admin) */}
        <Route path="/admin" element={<Navigate to={homePath} replace />} />
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/validate" element={<AdminRoute><ValidateInvoices /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><ManageUsers /></AdminRoute>} />
        <Route path="/admin/articles" element={<AdminRoute><ManageArticles /></AdminRoute>} />
        <Route path="/admin/categories" element={<AdminRoute><ManageCategories /></AdminRoute>} />
        <Route path="/admin/invoices" element={<AdminRoute><AdminInvoices /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><Settings /></AdminRoute>} />

        {/* Catch-all -> home selon le rôle */}
        <Route path="*" element={<Navigate to={homePath} replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;