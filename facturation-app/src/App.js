import React, { useEffect } from 'react';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { SnackbarProvider } from 'notistack';
import darkTheme from './theme/darkTheme';
import { AuthProvider } from './contexts/AuthContext';
import { CompanyProvider } from './contexts/CompanyContext';
import { NotificationProvider } from './contexts/NotificationContext';
import AppRoutes from './routes/AppRoutes';
import { initEmailJS } from './services/emailService';

export default function App() {
  useEffect(() => { initEmailJS(); }, []);

  return (
    <ThemeProvider theme={darkTheme}>
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
    </ThemeProvider>
  );
}
