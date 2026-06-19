import React from 'react';
import { Box, Typography, Paper, Alert, Chip } from '@mui/material';
import { Email, CheckCircle } from '@mui/icons-material';
import { isEmailJSConfigured, isPdfStorageEnabled } from '../../services/emailService';

/** Statut EmailJS — affiché dans Paramètres admin / user. */
export default function EmailConfigStatusCard() {
  const ready = isEmailJSConfigured();
  const storageOn = isPdfStorageEnabled();

  return (
    <Paper sx={{
      p: 3, mb: 3, bgcolor: 'var(--app-bg-card)',
      border: '1px solid rgba(37,99,235,0.08)', borderRadius: 3,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: 2,
          background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(37,99,235,0.15))',
          border: '1px solid rgba(59,130,246,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Email sx={{ color: '#3B82F6', fontSize: 20 }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ color: 'var(--app-text-primary)', fontWeight: 700, fontSize: '1.05rem' }}>
            Envoi email à la validation
          </Typography>
          <Typography sx={{ color: 'var(--app-text-secondary)', fontSize: '0.75rem' }}>
            Déclenché quand l&apos;admin valide une facture (page À valider ou Factures)
          </Typography>
        </Box>
        <Chip
          size="small"
          icon={ready ? <CheckCircle sx={{ fontSize: '14px !important' }} /> : <Email sx={{ fontSize: '14px !important' }} />}
          label={ready ? 'EmailJS actif' : 'Fallback mailto'}
          sx={{
            bgcolor: ready ? 'rgba(34,197,94,0.12)' : 'rgba(234,179,8,0.12)',
            color: ready ? '#22C55E' : '#EAB308',
            border: ready ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(234,179,8,0.3)',
            '& .MuiChip-icon': { color: ready ? '#22C55E' : '#EAB308' },
          }}
        />
      </Box>

      <Alert severity={ready ? 'success' : 'warning'} sx={{
        bgcolor: ready ? 'rgba(34,197,94,0.08)' : 'rgba(234,179,8,0.08)',
        color: '#94A3B8',
        border: ready ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(234,179,8,0.25)',
        '& .MuiAlert-icon': { color: ready ? '#22C55E' : '#EAB308' },
      }}>
        {ready ? (
          <Typography sx={{ fontSize: '0.85rem' }}>
            EmailJS est configuré — l&apos;email part en <strong>quelques secondes</strong> après validation
            {storageOn
              ? ' (lien PDF Storage activé, max 8s).'
              : ' (sans lien PDF Storage, plan Spark — normal).'}
            {' '}Template : To = {'{{to_email}}'}, pas de pièce jointe.
          </Typography>
        ) : (
          <Typography sx={{ fontSize: '0.85rem' }}>
            Créez le fichier <strong>.env</strong> avec les clés EmailJS — voir <strong>EMAIL_SETUP.md</strong>.
            Sinon Outlook/Gmail s&apos;ouvre avec le PDF à attacher manuellement.
          </Typography>
        )}
      </Alert>
    </Paper>
  );
}
