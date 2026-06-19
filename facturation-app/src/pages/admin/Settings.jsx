import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  FormGroup,
  FormControl,
  Select,
  MenuItem,
  Slider,
  Alert,
  Snackbar,
  Avatar,
  Tab,
  Tabs,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Save,
  Person,
  Security,
  Notifications,
  Palette,
  Backup,
  AdminPanelSettings,
  VpnKey,
  Phone,
  LocationOn,
  Edit,
  Refresh,
  DarkMode,
  LightMode,
} from '@mui/icons-material';
import AdminLayout from '../../components/common/AdminLayout';
import QrPublicUrlCard from '../../components/common/QrPublicUrlCard';
import EmailConfigStatusCard from '../../components/common/EmailConfigStatusCard';
import { useThemeMode } from '../../contexts/ThemeModeContext';
import { auth, db, ref, get, update } from '../../services/firebaseService';

// Composant d'onglets
function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index} style={{ paddingTop: 24 }}>
      {value === index && children}
    </div>
  );
}

export default function Settings() {
  const { mode, setThemeMode } = useThemeMode();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [tabValue, setTabValue] = useState(0);

  // État du profil
  const [profile, setProfile] = useState({
    displayName: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // État des notifications
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    invoiceAlerts: true,
    paymentAlerts: true,
    systemUpdates: false,
  });

  // État de l'apparence
  const [appearance, setAppearance] = useState({
    theme: mode,
    fontSize: 14,
    compactMode: false,
  });

  // État de la sécurité
  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
  });

  const user = auth.currentUser;

  // Charger les données utilisateur
  useEffect(() => {
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setAppearance((a) => (a.theme === mode ? a : { ...a, theme: mode }));
  }, [mode]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const snapshot = await get(ref(db, `users/${user?.uid}`));
      if (snapshot.exists()) {
        const userData = snapshot.val();
        setProfile({
          displayName: userData.displayName || user?.displayName || '',
          email: userData.email || user?.email || '',
          phone: userData.phone || '',
          address: userData.address || '',
          bio: userData.bio || '',
        });
        const prefs = userData.preferences;
        if (prefs?.appearance?.theme) {
          setThemeMode(prefs.appearance.theme);
          setAppearance((a) => ({ ...a, ...prefs.appearance }));
        }
        if (prefs?.notifications) setNotifications(prefs.notifications);
        if (prefs?.security) setSecurity(prefs.security);
      } else {
        setProfile({
          displayName: user?.displayName || '',
          email: user?.email || '',
          phone: '',
          address: '',
          bio: '',
        });
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder le profil
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await update(ref(db, `users/${user?.uid}`), {
        displayName: profile.displayName,
        phone: profile.phone,
        address: profile.address,
        bio: profile.bio,
        updatedAt: new Date().toISOString(),
      });
      setSnackbar({ open: true, message: 'Profil mis à jour avec succès', severity: 'success' });
      setIsEditingProfile(false);
    } catch (error) {
      setSnackbar({ open: true, message: 'Erreur lors de la mise à jour', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Sauvegarder les préférences
  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      await update(ref(db, `users/${user?.uid}`), {
        preferences: {
          notifications,
          appearance,
          security,
          updatedAt: new Date().toISOString(),
        },
      });
      setSnackbar({ open: true, message: 'Préférences sauvegardées', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Erreur lors de la sauvegarde', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <AdminLayout>
        <Box sx={{ p: 3 }}>
          <LinearProgress sx={{ bgcolor: '#1E2536', '& .MuiLinearProgress-bar': { bgcolor: '#2563EB' } }} />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* En-tête */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            background: 'linear-gradient(135deg, #2563EB 0%, #475569 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            mb: 1,
            fontFamily: "'Syne', sans-serif",
            letterSpacing: '-0.03em',
          }}
        >
          Paramètres
        </Typography>
        <Typography variant="body2" sx={{ color: 'var(--app-text-secondary)' }}>
          Gérez vos préférences et paramètres du compte
        </Typography>
      </Box>

      <EmailConfigStatusCard />

      <QrPublicUrlCard
        onNotify={(message, severity) => setSnackbar({ open: true, message, severity })}
      />

      {/* Onglets */}
      <Paper sx={{ bgcolor: 'var(--app-bg-card)', border: '1px solid rgba(37,99,235,0.08)', borderRadius: 3, overflow: 'hidden' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            borderBottom: '1px solid rgba(37,99,235,0.08)',
            '& .MuiTab-root': {
              color: 'var(--app-text-secondary)',
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.9rem',
              py: 2,
              '&.Mui-selected': {
                color: '#2563EB',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#2563EB',
              height: 3,
            },
          }}
        >
          <Tab icon={<Person />} label="Profil" />
          <Tab icon={<Notifications />} label="Notifications" />
          <Tab icon={<Palette />} label="Apparence" />
          <Tab icon={<Security />} label="Sécurité" />
          <Tab icon={<Backup />} label="Sauvegarde" />
        </Tabs>

        {/* Onglet Profil */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar
                    sx={{
                      width: 120,
                      height: 120,
                      mx: 'auto',
                      mb: 2,
                      background: 'linear-gradient(135deg, #2563EB, #475569)',
                      fontSize: 48,
                      fontWeight: 700,
                    }}
                  >
                    {profile.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                  </Avatar>
                  <Chip
                    label={user?.email === 'admin@admin.com' ? 'Administrateur' : 'Utilisateur'}
                    size="small"
                    icon={<AdminPanelSettings sx={{ fontSize: 16 }} />}
                    sx={{ bgcolor: 'rgba(37,99,235,0.1)', color: '#2563EB' }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: 'var(--app-text-primary)', fontWeight: 600 }}>
                    Informations personnelles
                  </Typography>
                  {!isEditingProfile ? (
                    <Button startIcon={<Edit />} onClick={() => setIsEditingProfile(true)} sx={{ color: '#2563EB' }}>
                      Modifier
                    </Button>
                  ) : (
                    <Box>
                      <Button onClick={() => setIsEditingProfile(false)} sx={{ color: 'var(--app-text-secondary)', mr: 1 }}>
                        Annuler
                      </Button>
                      <Button startIcon={<Save />} onClick={handleSaveProfile} disabled={saving} variant="contained" sx={{ bgcolor: '#2563EB', color: '#F8FAFC' }}>
                        {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                      </Button>
                    </Box>
                  )}
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Nom complet"
                      value={profile.displayName}
                      onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                      disabled={!isEditingProfile}
                      sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'var(--app-bg-deep)' } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={profile.email}
                      disabled
                      sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'var(--app-bg-deep)' } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Téléphone"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      disabled={!isEditingProfile}
                      InputProps={{ startAdornment: <Phone sx={{ color: 'var(--app-text-secondary)', mr: 1, fontSize: 20 }} /> }}
                      sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'var(--app-bg-deep)' } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Adresse"
                      value={profile.address}
                      onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                      disabled={!isEditingProfile}
                      InputProps={{ startAdornment: <LocationOn sx={{ color: 'var(--app-text-secondary)', mr: 1, fontSize: 20 }} /> }}
                      sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'var(--app-bg-deep)' } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Bio"
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      disabled={!isEditingProfile}
                      multiline
                      rows={3}
                      sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'var(--app-bg-deep)' } }}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Onglet Notifications */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ color: 'var(--app-text-primary)', fontWeight: 600, mb: 3 }}>
              Préférences de notifications
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card sx={{ bgcolor: 'var(--app-bg-deep)', border: '1px solid rgba(37,99,235,0.08)', borderRadius: 2 }}>
                  <CardContent>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notifications.emailNotifications}
                            onChange={(e) => setNotifications({ ...notifications, emailNotifications: e.target.checked })}
                            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#2563EB' } }}
                          />
                        }
                        label="Notifications par email"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notifications.pushNotifications}
                            onChange={(e) => setNotifications({ ...notifications, pushNotifications: e.target.checked })}
                            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#2563EB' } }}
                          />
                        }
                        label="Notifications push"
                      />
                      <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.05)' }} />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notifications.invoiceAlerts}
                            onChange={(e) => setNotifications({ ...notifications, invoiceAlerts: e.target.checked })}
                            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#2563EB' } }}
                          />
                        }
                        label="Alertes factures"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notifications.paymentAlerts}
                            onChange={(e) => setNotifications({ ...notifications, paymentAlerts: e.target.checked })}
                            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#2563EB' } }}
                          />
                        }
                        label="Alertes paiements"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notifications.systemUpdates}
                            onChange={(e) => setNotifications({ ...notifications, systemUpdates: e.target.checked })}
                            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#2563EB' } }}
                          />
                        }
                        label="Mises à jour système"
                      />
                    </FormGroup>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={handleSavePreferences} disabled={saving} variant="contained" startIcon={<Save />} sx={{ bgcolor: '#2563EB', color: '#F8FAFC' }}>
                {saving ? 'Sauvegarde...' : 'Sauvegarder les préférences'}
              </Button>
            </Box>
          </Box>
        </TabPanel>

        {/* Onglet Apparence */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ color: 'var(--app-text-primary)', fontWeight: 600, mb: 3 }}>
              Personnalisation
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: 'var(--app-bg-deep)', border: '1px solid rgba(37,99,235,0.08)', borderRadius: 2 }}>
                  <CardContent>
                    <Typography sx={{ color: 'var(--app-text-primary)', fontWeight: 500, mb: 2 }}>Thème</Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant={appearance.theme === 'dark' ? 'contained' : 'outlined'}
                        onClick={() => {
                          setThemeMode('dark');
                          setAppearance({ ...appearance, theme: 'dark' });
                        }}
                        startIcon={<DarkMode />}
                        sx={{
                          flex: 1,
                          bgcolor: appearance.theme === 'dark' ? '#2563EB' : 'transparent',
                          color: appearance.theme === 'dark' ? '#F8FAFC' : '#64748B',
                          borderColor: 'rgba(37,99,235,0.3)',
                        }}
                      >
                        Sombre
                      </Button>
                      <Button
                        variant={appearance.theme === 'light' ? 'contained' : 'outlined'}
                        onClick={() => {
                          setThemeMode('light');
                          setAppearance({ ...appearance, theme: 'light' });
                        }}
                        startIcon={<LightMode />}
                        sx={{
                          flex: 1,
                          bgcolor: appearance.theme === 'light' ? '#2563EB' : 'transparent',
                          color: appearance.theme === 'light' ? '#F8FAFC' : '#64748B',
                          borderColor: 'rgba(37,99,235,0.3)',
                        }}
                      >
                        Clair
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: 'var(--app-bg-deep)', border: '1px solid rgba(37,99,235,0.08)', borderRadius: 2 }}>
                  <CardContent>
                    <Typography sx={{ color: 'var(--app-text-primary)', fontWeight: 500, mb: 2 }}>Taille de police</Typography>
                    <Box sx={{ px: 2 }}>
                      <Slider
                        value={appearance.fontSize}
                        onChange={(e, val) => setAppearance({ ...appearance, fontSize: val })}
                        min={12}
                        max={18}
                        step={1}
                        marks={[
                          { value: 12, label: 'Petite' },
                          { value: 14, label: 'Normale' },
                          { value: 16, label: 'Grande' },
                          { value: 18, label: 'Très grande' },
                        ]}
                        sx={{ color: '#2563EB' }}
                      />
                    </Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={appearance.compactMode}
                          onChange={(e) => setAppearance({ ...appearance, compactMode: e.target.checked })}
                          sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#2563EB' } }}
                        />
                      }
                      label="Mode compact"
                      sx={{ mt: 2 }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={handleSavePreferences} disabled={saving} variant="contained" startIcon={<Save />} sx={{ bgcolor: '#2563EB', color: '#F8FAFC' }}>
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </Box>
          </Box>
        </TabPanel>

        {/* Onglet Sécurité */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ color: 'var(--app-text-primary)', fontWeight: 600, mb: 3 }}>
              Sécurité du compte
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card sx={{ bgcolor: 'var(--app-bg-deep)', border: '1px solid rgba(37,99,235,0.08)', borderRadius: 2 }}>
                  <CardContent>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={security.twoFactorAuth}
                          onChange={(e) => setSecurity({ ...security, twoFactorAuth: e.target.checked })}
                          sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#2563EB' } }}
                        />
                      }
                      label="Authentification à deux facteurs (2FA)"
                    />
                    <Typography variant="caption" sx={{ color: 'var(--app-text-secondary)', display: 'block', ml: 4, mt: 1 }}>
                      Ajoute une couche de sécurité supplémentaire à votre compte
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card sx={{ bgcolor: 'var(--app-bg-deep)', border: '1px solid rgba(37,99,235,0.08)', borderRadius: 2 }}>
                  <CardContent>
                    <Typography sx={{ color: 'var(--app-text-primary)', fontWeight: 500, mb: 2 }}>Délai d'expiration de session</Typography>
                    <FormControl fullWidth sx={{ maxWidth: 200 }}>
                      <Select
                        value={security.sessionTimeout}
                        onChange={(e) => setSecurity({ ...security, sessionTimeout: e.target.value })}
                        sx={{ bgcolor: 'var(--app-bg-card)' }}
                      >
                        <MenuItem value={15}>15 minutes</MenuItem>
                        <MenuItem value={30}>30 minutes</MenuItem>
                        <MenuItem value={60}>1 heure</MenuItem>
                        <MenuItem value={120}>2 heures</MenuItem>
                        <MenuItem value={480}>8 heures</MenuItem>
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card sx={{ bgcolor: 'var(--app-bg-deep)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 2 }}>
                  <CardContent>
                    <Typography sx={{ color: '#EF4444', fontWeight: 500, mb: 1 }}>Zone dangereuse</Typography>
                    <Button variant="outlined" color="error" startIcon={<VpnKey />}>
                      Changer le mot de passe
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={handleSavePreferences} disabled={saving} variant="contained" startIcon={<Save />} sx={{ bgcolor: '#2563EB', color: '#F8FAFC' }}>
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </Box>
          </Box>
        </TabPanel>

        {/* Onglet Sauvegarde */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ color: 'var(--app-text-primary)', fontWeight: 600, mb: 3 }}>
              Sauvegarde des données
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card sx={{ bgcolor: 'var(--app-bg-deep)', border: '1px solid rgba(37,99,235,0.08)', borderRadius: 2 }}>
                  <CardContent>
                    <Typography sx={{ color: 'var(--app-text-primary)', fontWeight: 500, mb: 2 }}>Exporter les données</Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Button variant="outlined" startIcon={<Refresh />} sx={{ borderColor: 'rgba(37,99,235,0.3)', color: '#2563EB' }}>
                        Exporter les factures (JSON)
                      </Button>
                      <Button variant="outlined" startIcon={<Refresh />} sx={{ borderColor: 'rgba(37,99,235,0.3)', color: '#2563EB' }}>
                        Exporter les clients (JSON)
                      </Button>
                      <Button variant="outlined" startIcon={<Refresh />} sx={{ borderColor: 'rgba(37,99,235,0.3)', color: '#2563EB' }}>
                        Exporter les utilisateurs (JSON)
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card sx={{ bgcolor: 'var(--app-bg-deep)', border: '1px solid rgba(37,99,235,0.08)', borderRadius: 2 }}>
                  <CardContent>
                    <Typography sx={{ color: 'var(--app-text-primary)', fontWeight: 500, mb: 2 }}>Sauvegarde automatique</Typography>
                    <FormControl fullWidth sx={{ maxWidth: 250 }}>
                      <Select defaultValue="daily" sx={{ bgcolor: 'var(--app-bg-card)' }}>
                        <MenuItem value="daily">Quotidienne</MenuItem>
                        <MenuItem value="weekly">Hebdomadaire</MenuItem>
                        <MenuItem value="monthly">Mensuelle</MenuItem>
                        <MenuItem value="disabled">Désactivée</MenuItem>
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" startIcon={<Save />} sx={{ bgcolor: '#2563EB', color: '#F8FAFC' }}>
                Sauvegarder les préférences
              </Button>
            </Box>
          </Box>
        </TabPanel>
      </Paper>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          sx={{
            bgcolor: snackbar.severity === 'success' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
            color: snackbar.severity === 'success' ? '#22C55E' : '#EF4444',
            border: `1px solid ${snackbar.severity === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
}