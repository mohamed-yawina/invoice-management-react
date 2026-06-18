import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Button, Avatar, TextField, Divider,
  Card, CardContent, Chip, Stack, Alert,
} from '@mui/material';
import {
  Edit, Delete, Email, Save, Draw, AccountCircle,
  Notifications, CheckCircle,
} from '@mui/icons-material';
import Layout from '../../components/common/Layout';
import SignaturePad from '../../components/common/SignaturePad';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { getUserSignature, setUserSignature } from '../../services/signatureService';
import { isEmailJSConfigured } from '../../services/emailService';
import QrPublicUrlCard from '../../components/common/QrPublicUrlCard';

export default function UserSettings() {
  const { user } = useAuth();
  const { toast } = useNotifications();
  const [signature, setSignature] = useState(null);
  const [padOpen, setPadOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const emailJsReady = isEmailJSConfigured();

  useEffect(() => {
    (async () => {
      if (user?.uid) {
        const s = await getUserSignature(user.uid);
        setSignature(s);
      }
    })();
  }, [user?.uid]);

  const handleSaveSignature = async (dataUrl) => {
    setLoading(true);
    const ok = await setUserSignature(user.uid, dataUrl);
    setLoading(false);
    if (ok) {
      setSignature(dataUrl);
      toast('Signature enregistrée', 'success');
    } else {
      toast('Erreur lors de l\'enregistrement', 'error');
    }
  };

  const handleDeleteSignature = async () => {
    setLoading(true);
    const ok = await setUserSignature(user.uid, null);
    setLoading(false);
    if (ok) {
      setSignature(null);
      toast('Signature supprimée', 'info');
    }
  };

  return (
    <Layout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{
          fontWeight: 800, color: '#F1F5F9',
          fontFamily: "'Syne', sans-serif", letterSpacing: '-0.02em', mb: 0.5,
        }}>
          Mon profil & paramètres
        </Typography>
        <Typography sx={{ color: '#94A3B8', fontSize: '0.9rem' }}>
          Gérez votre signature numérique et vos préférences personnelles
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* ── Profil ─────────────────────────────────── */}
        <Grid item xs={12} md={5}>
          <Paper sx={{
            p: 3, bgcolor: '#0F1623',
            border: '1px solid rgba(110,231,183,0.08)', borderRadius: 3, height: '100%',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar sx={{
                width: 64, height: 64,
                background: 'linear-gradient(135deg, #6EE7B7, #3B82F6)',
                color: '#0A0F1A', fontSize: '1.6rem', fontWeight: 800,
                boxShadow: '0 0 20px rgba(110,231,183,0.3)',
              }}>
                {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </Avatar>
              <Box sx={{ flex: 1, overflow: 'hidden' }}>
                <Typography sx={{ color: '#F1F5F9', fontSize: '1.05rem', fontWeight: 700 }}>
                  {user?.displayName || 'Utilisateur'}
                </Typography>
                <Typography sx={{ color: '#94A3B8', fontSize: '0.8rem',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.email}
                </Typography>
                <Chip
                  size="small"
                  icon={<CheckCircle sx={{ fontSize: '14px !important' }} />}
                  label="Comptable / Agent"
                  sx={{ mt: 0.8, height: 20, fontSize: '0.65rem',
                    bgcolor: 'rgba(110,231,183,0.12)', color: '#6EE7B7',
                    border: '1px solid rgba(110,231,183,0.3)',
                    '& .MuiChip-icon': { color: '#6EE7B7' },
                  }}
                />
              </Box>
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 2 }} />

            <Stack spacing={2}>
              <Box>
                <Typography sx={{ color: '#64748B', fontSize: '0.7rem',
                  textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, mb: 0.5 }}>
                  Email
                </Typography>
                <TextField
                  fullWidth
                  value={user?.email || ''}
                  disabled
                  size="small"
                  InputProps={{
                    startAdornment: <Email sx={{ color: '#64748B', fontSize: 18, mr: 1 }} />,
                  }}
                />
              </Box>
              <Box>
                <Typography sx={{ color: '#64748B', fontSize: '0.7rem',
                  textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, mb: 0.5 }}>
                  Nom affiché
                </Typography>
                <TextField
                  fullWidth
                  value={user?.displayName || ''}
                  disabled
                  size="small"
                  InputProps={{
                    startAdornment: <AccountCircle sx={{ color: '#64748B', fontSize: 18, mr: 1 }} />,
                  }}
                />
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* ── Signature ──────────────────────────────── */}
        <Grid item xs={12} md={7}>
          <Paper sx={{
            p: 3, bgcolor: '#0F1623',
            border: '1px solid rgba(110,231,183,0.08)', borderRadius: 3, height: '100%',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Box sx={{
                width: 36, height: 36, borderRadius: 2,
                background: 'linear-gradient(135deg, rgba(110,231,183,0.15), rgba(59,130,246,0.15))',
                border: '1px solid rgba(110,231,183,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Draw sx={{ color: '#6EE7B7', fontSize: 20 }} />
              </Box>
              <Box>
                <Typography sx={{ color: '#F1F5F9', fontWeight: 700, fontSize: '1.05rem' }}>
                  Signature numérique
                </Typography>
                <Typography sx={{ color: '#64748B', fontSize: '0.75rem' }}>
                  Apparaît sur chaque PDF avec le code QR de vérification
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 2 }} />

            {signature ? (
              <Box>
                <Box sx={{
                  bgcolor: '#FFFFFF', p: 2, borderRadius: 2,
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  minHeight: 140, mb: 2,
                }}>
                  <img src={signature} alt="Signature"
                    style={{ maxWidth: '100%', maxHeight: 120, objectFit: 'contain' }} />
                </Box>
                <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    startIcon={<Delete />}
                    onClick={handleDeleteSignature}
                    disabled={loading}
                    sx={{
                      borderColor: 'rgba(239,68,68,0.3)', color: '#EF4444',
                      '&:hover': { borderColor: '#EF4444', bgcolor: 'rgba(239,68,68,0.08)' },
                    }}
                  >
                    Supprimer
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Edit />}
                    onClick={() => setPadOpen(true)}
                    disabled={loading}
                    sx={{ bgcolor: '#6EE7B7', color: '#0D1117', '&:hover': { bgcolor: '#5DD9A6' } }}
                  >
                    Modifier
                  </Button>
                </Stack>
              </Box>
            ) : (
              <Box sx={{
                border: '2px dashed rgba(110,231,183,0.25)', borderRadius: 2,
                p: 4, textAlign: 'center', bgcolor: 'rgba(110,231,183,0.02)',
              }}>
                <Draw sx={{ color: '#6EE7B7', fontSize: 48, mb: 1, opacity: 0.6 }} />
                <Typography sx={{ color: '#94A3B8', mb: 2, fontSize: '0.88rem' }}>
                  Aucune signature enregistrée
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={() => setPadOpen(true)}
                  sx={{ bgcolor: '#6EE7B7', color: '#0D1117', '&:hover': { bgcolor: '#5DD9A6' } }}
                >
                  Créer ma signature
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* ── URL publique QR (scan mobile) ───────────── */}
        <Grid item xs={12}>
          <QrPublicUrlCard onNotify={(msg, severity) => toast(msg, severity)} />
        </Grid>

        {/* ── Préférences notifications & email ───────────── */}
        <Grid item xs={12}>
          <Paper sx={{
            p: 3, bgcolor: '#0F1623',
            border: '1px solid rgba(110,231,183,0.08)', borderRadius: 3,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box sx={{
                width: 36, height: 36, borderRadius: 2,
                background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(110,231,183,0.15))',
                border: '1px solid rgba(59,130,246,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Notifications sx={{ color: '#3B82F6', fontSize: 20 }} />
              </Box>
              <Typography sx={{ color: '#F1F5F9', fontWeight: 700, fontSize: '1.05rem' }}>
                Notifications & envoi par email
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: '#0A1018', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 2 }}>
                  <CardContent>
                    <Typography sx={{ color: '#F1F5F9', fontWeight: 600, fontSize: '0.9rem', mb: 1 }}>
                      Alertes par message
                    </Typography>
                    <Typography sx={{ color: '#94A3B8', fontSize: '0.8rem', mb: 1.5 }}>
                      Vous recevez en temps réel une alerte quand l'admin valide
                      ou rejette une de vos factures.
                    </Typography>
                    <Chip
                      size="small"
                      icon={<CheckCircle sx={{ fontSize: '14px !important' }} />}
                      label="Activé"
                      sx={{ bgcolor: 'rgba(34,197,94,0.12)', color: '#22C55E',
                        border: '1px solid rgba(34,197,94,0.3)',
                        '& .MuiChip-icon': { color: '#22C55E' } }}
                    />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: '#0A1018', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 2 }}>
                  <CardContent>
                    <Typography sx={{ color: '#F1F5F9', fontWeight: 600, fontSize: '0.9rem', mb: 1 }}>
                      Envoi automatique au client
                    </Typography>
                    <Typography sx={{ color: '#94A3B8', fontSize: '0.8rem', mb: 1.5 }}>
                      {emailJsReady
                        ? 'EmailJS est configuré : email automatique au client à la validation (lien PDF si Storage activé).'
                        : 'EmailJS non configuré : le client mail s\'ouvre avec le PDF téléchargé à attacher manuellement.'}
                    </Typography>
                    <Chip
                      size="small"
                      icon={emailJsReady
                        ? <CheckCircle sx={{ fontSize: '14px !important' }} />
                        : <Email sx={{ fontSize: '14px !important' }} />}
                      label={emailJsReady ? 'EmailJS actif' : 'Fallback mailto'}
                      sx={{
                        bgcolor: emailJsReady ? 'rgba(34,197,94,0.12)' : 'rgba(234,179,8,0.12)',
                        color: emailJsReady ? '#22C55E' : '#EAB308',
                        border: emailJsReady ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(234,179,8,0.3)',
                        '& .MuiChip-icon': { color: emailJsReady ? '#22C55E' : '#EAB308' },
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {!emailJsReady && (
              <Alert severity="info" sx={{ mt: 2,
                bgcolor: 'rgba(59,130,246,0.08)', color: '#94A3B8',
                border: '1px solid rgba(59,130,246,0.2)',
                '& .MuiAlert-icon': { color: '#3B82F6' } }}>
                <Typography sx={{ fontSize: '0.85rem' }}>
                  Pour activer l'envoi automatique par EmailJS, créez un fichier <strong>.env</strong> —
                  voir <strong>EMAIL_SETUP.md</strong> à la racine du projet.
                </Typography>
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>

      <SignaturePad
        open={padOpen}
        onClose={() => setPadOpen(false)}
        onSave={handleSaveSignature}
        initialValue={signature}
        title="Ma signature numérique"
      />
    </Layout>
  );
}
