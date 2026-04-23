import React, { useState, useEffect } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import {
  Dashboard, Inventory, Category, Settings,
  AdminPanelSettings, CheckCircle, ManageAccounts, Receipt,
} from '@mui/icons-material';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { db, ref, get } from '../../services/firebaseService';

const DRAWER_WIDTH = 280;
const COLLAPSED_WIDTH = 80;

const adminBrand = {
  title: 'FacturePro',
  subtitle: 'Administration',
  icon: <AdminPanelSettings />,
  homePath: '/admin/dashboard',
};

export default function AdminLayout({ children }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  // Factures en attente pour le badge + les notifications
  useEffect(() => {
    const load = async () => {
      try {
        const snap = await get(ref(db, 'factures'));
        if (!snap.exists()) return;
        const pending = Object.values(snap.val()).filter(f => f.statut === 'En attente').length;
        setPendingCount(pending);
        if (pending > 0) {
          setNotifications([{
            id: 1,
            message: `${pending} facture(s) en attente de validation`,
            type: 'warning',
            time: 'maintenant',
          }]);
        }
      } catch (e) {
        console.error('Erreur chargement factures:', e);
      }
    };
    load();
  }, []);

  const menuItems = [
    { text: 'Tableau de bord', icon: <Dashboard />, path: '/admin/dashboard', exact: true },
    { text: 'Factures', icon: <Receipt />, path: '/admin/invoices' },
    { text: 'À valider', icon: <CheckCircle />, path: '/admin/validate', badge: true, badgeCount: pendingCount },
    { divider: true },
    { text: 'Utilisateurs', icon: <ManageAccounts />, path: '/admin/users' },
    { text: 'Articles', icon: <Inventory />, path: '/admin/articles' },
    { text: 'Catégories', icon: <Category />, path: '/admin/categories' },
    { divider: true },
    { text: 'Paramètres', icon: <Settings />, path: '/admin/settings' },
  ];

  const effectiveWidth = collapsed && !isMobile ? COLLAPSED_WIDTH : DRAWER_WIDTH;

  return (
    <Box sx={{ display: 'flex', bgcolor: '#080C14', minHeight: '100vh' }}>
      <Navbar
        onMobileMenuOpen={() => setMobileOpen(true)}
        brand={adminBrand}
        profilePath="/admin/settings"
        notifications={notifications}
        notifTargetPath="/admin/validate"
      />

      <Sidebar
        menuItems={menuItems}
        brand={adminBrand}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        drawerWidth={DRAWER_WIDTH}
        collapsedWidth={COLLAPSED_WIDTH}
        isMobile={isMobile}
      />

      <Box component="main" sx={{
        flexGrow: 1, p: { xs: 2, sm: 3, md: 3 },
        width: { md: `calc(100% - ${effectiveWidth}px)` },
        ml: { md: `${effectiveWidth}px` },
        mt: { xs: '60px', md: 0 }, minHeight: '100vh',
        bgcolor: '#080C14', overflowX: 'hidden',
        transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1), width 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {children}
      </Box>
    </Box>
  );
}
