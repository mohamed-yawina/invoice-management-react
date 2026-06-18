import React, { useState } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { Dashboard, Receipt, People, Settings } from '@mui/icons-material';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const DRAWER_WIDTH = 260;
const COLLAPSED_WIDTH = 72;

const userMenuItems = [
  { text: 'Tableau de bord', icon: <Dashboard />, path: '/app/dashboard', exact: true },
  { text: 'Factures', icon: <Receipt />, path: '/app/invoices' },
  { text: 'Clients', icon: <People />, path: '/app/clients' },
  { divider: true },
  { text: 'Paramètres', icon: <Settings />, path: '/app/settings' },
];

const userBrand = {
  title: 'FacturePro',
  icon: <Receipt />,
  homePath: '/app/dashboard',
};

export default function Layout({ children }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const effectiveWidth = collapsed && !isMobile ? COLLAPSED_WIDTH : DRAWER_WIDTH;

  return (
    <Box sx={{ display: 'flex', bgcolor: '#080C14', minHeight: '100vh' }}>
      <Navbar
        onMobileMenuOpen={() => setMobileOpen(true)}
        brand={userBrand}
        profilePath="/app/settings"
      />

      <Sidebar
        menuItems={userMenuItems}
        brand={userBrand}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        drawerWidth={DRAWER_WIDTH}
        collapsedWidth={COLLAPSED_WIDTH}
        isMobile={isMobile}
      />

      <Box component="main" sx={{
        flexGrow: 1, p: { xs: 2, sm: 3 },
        width: { md: `calc(100% - ${effectiveWidth}px)` },
        ml: { md: `${effectiveWidth}px` },
        mt: { xs: '60px', md: 0 }, minHeight: '100vh',
        bgcolor: '#080C14', overflowX: 'hidden',
        transition: 'margin-left 0.25s ease, width 0.25s ease',
      }}>
        {children}
      </Box>
    </Box>
  );
}
