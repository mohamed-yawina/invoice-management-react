import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, TextField, Button, Alert, Stack,
} from '@mui/material';
import { QrCode2, Save } from '@mui/icons-material';
import {
  getPublicAppOrigin,
  isLocalhostOrigin,
  setPublicAppOrigin,
} from '../../utils/appOrigin';

/**
 * Champ partagé : URL publique encodée dans le QR des PDF.
 * Admin : /admin/settings  |  User : /app/settings
 */
export default function QrPublicUrlCard({ onNotify }) {
  const [publicUrl, setPublicUrl] = useState('');

  useEffect(() => {
    setPublicUrl(getPublicAppOrigin());
  }, []);

  const notify = (msg, severity) => {
    if (onNotify) onNotify(msg, severity);
  };

  const handleSave = () => {
    const saved = setPublicAppOrigin(publicUrl);
    if (!saved) {
      notify('Indiquez une URL (ex. https://xxx.trycloudflare.com)', 'warning');
      return;
    }
    try {
      // eslint-disable-next-line no-new
      new URL(saved);
    } catch {
      notify('URL invalide', 'error');
      return;
    }
    setPublicUrl(saved);
    notify(
      isLocalhostOrigin(saved)
        ? 'URL enregistrée — localhost ne fonctionne pas sur mobile'
        : 'URL QR enregistrée — regénérez le PDF puis scannez',
      isLocalhostOrigin(saved) ? 'warning' : 'success'
    );
  };

  return (
    <Paper sx={{
      p: 3, mb: 3, bgcolor: 'var(--app-bg-card)',
      border: '1px solid rgba(37,99,235,0.08)', borderRadius: 3,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: 2,
          background: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(59,130,246,0.15))',
          border: '1px solid rgba(37,99,235,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <QrCode2 sx={{ color: '#2563EB', fontSize: 20 }} />
        </Box>
        <Box>
          <Typography sx={{ color: 'var(--app-text-primary)', fontWeight: 700, fontSize: '1.05rem' }}>
            URL publique pour le QR code
          </Typography>
          <Typography sx={{ color: 'var(--app-text-secondary)', fontSize: '0.75rem' }}>
            Collez ici l&apos;URL du tunnel ou l&apos;IP locale, puis regénérez le PDF
          </Typography>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 2,
        bgcolor: 'rgba(59,130,246,0.08)', color: '#94A3B8',
        border: '1px solid rgba(59,130,246,0.2)',
        '& .MuiAlert-icon': { color: '#3B82F6' } }}>
        <Typography sx={{ fontSize: '0.85rem' }}>
          <strong>Où coller l&apos;URL ?</strong> Ici, dans le champ ci-dessous → <strong>Enregistrer</strong>.
        </Typography>
        <Typography sx={{ fontSize: '0.82rem', mt: 1 }}>
          Terminal : <strong>npm run tunnel</strong> → copiez <strong>https://….trycloudflare.com</strong>
          (ne fermez pas le terminal). Évitez loca.lt (instable, erreur 408).
        </Typography>
      </Alert>

      {isLocalhostOrigin(publicUrl || getPublicAppOrigin()) && (
        <Alert severity="warning" sx={{ mb: 2,
          bgcolor: 'rgba(234,179,8,0.08)', color: '#EAB308',
          border: '1px solid rgba(234,179,8,0.25)',
          '& .MuiAlert-icon': { color: '#EAB308' } }}>
          Le QR utilise <strong>localhost</strong> — remplacez par l&apos;URL du tunnel ou{' '}
          <strong>http://192.168.1.11:3000</strong>
        </Alert>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'flex-start' }}>
        <TextField
          fullWidth
          label="URL de l'application"
          placeholder="https://xxxx.trycloudflare.com"
          value={publicUrl}
          onChange={(e) => setPublicUrl(e.target.value)}
          size="small"
          helperText="Après Enregistrer : téléchargez un NOUVEAU PDF (l'ancien QR reste invalide)."
        />
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
          sx={{ bgcolor: '#2563EB', color: '#FFFFFF', whiteSpace: 'nowrap', '&:hover': { bgcolor: '#1D4ED8' } }}
        >
          Enregistrer
        </Button>
      </Stack>
    </Paper>
  );
}
