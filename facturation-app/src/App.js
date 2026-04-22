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

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Routes>
      <Route path="/app" element={<Navigate to={isAdmin ? "/admin/dashboard" : "/app/dashboard"} />} />
      <Route path="/app/dashboard" element={<UserDashboard />} />
      <Route path="/app/clients" element={<Clients />} />
      <Route path="/app/invoices" element={<InvoiceHistory />} />
      <Route path="/app/invoices/new" element={<CreateInvoice />} />
      <Route path="/admin/dashboard" element={isAdmin ? <AdminDashboard /> : <Navigate to="/app/dashboard" />} />
      <Route path="/admin/validate" element={isAdmin ? <ValidateInvoices /> : <Navigate to="/app/dashboard" />} />
      <Route path="/admin/users" element={isAdmin ? <ManageUsers /> : <Navigate to="/app/dashboard" />} />
      <Route path="*" element={<Navigate to={isAdmin ? "/admin/dashboard" : "/app/dashboard"} />} />
      <Route path="/admin/articles" element={isAdmin ? <ManageArticles /> : <Navigate to="/app/dashboard" />} />
      <Route path="/admin/categories" element={isAdmin ? <ManageCategories /> : <Navigate to="/app/dashboard" />} />
      <Route path="/admin/validate" element={isAdmin ? <ValidateInvoices /> : <Navigate to="/app/dashboard" />} />
      <Route path="/admin/invoices" element={isAdmin ? <AdminInvoices /> : <Navigate to="/app/dashboard" />} /> 
      <Route path="/admin/settings" element={isAdmin ? <Settings /> : <Navigate to="/app/dashboard" />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;