import React, { useEffect } from 'react';
import { CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { ThemeModeProvider, getStoredThemeMode } from './contexts/ThemeModeContext';
import { applyThemeCssVariables } from './theme/palettes';
import { AuthProvider } from './contexts/AuthContext';
import { CompanyProvider } from './contexts/CompanyContext';
import { NotificationProvider } from './contexts/NotificationContext';
import AppRoutes from './routes/AppRoutes';
import { initEmailJS } from './services/emailService';

// Appliquer le thème avant le 1er rendu React (évite flash blanc)
applyThemeCssVariables(getStoredThemeMode());

export default function App() {
  useEffect(() => { initEmailJS(); }, []);

  return (
    <ThemeModeProvider>
      <CssBaseline />
      <SnackbarProvider
        maxSnack={4}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        autoHideDuration={3500}
      >
        <AuthProvider>
          <CompanyProvider>
            <NotificationProvider>
              <AppRoutes />
            </NotificationProvider>
          </CompanyProvider>
        </AuthProvider>
      </SnackbarProvider>
    </ThemeModeProvider>
  );
}
