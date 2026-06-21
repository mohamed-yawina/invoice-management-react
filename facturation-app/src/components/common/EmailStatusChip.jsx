import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import {
  Email, MarkEmailRead, OutgoingMail, Warning,
} from '@mui/icons-material';

export function getInvoiceEmailStatus(facture) {
  if (!facture) {
    return {
      label: 'Email non envoyé',
      title: 'Aucune information email disponible',
      color: '#94A3B8',
      bg: 'rgba(148,163,184,0.12)',
      icon: <Email sx={{ fontSize: '14px !important' }} />,
    };
  }

  if ((facture.email_status === 'sent') || (facture.email_sent_at && facture.email_sent_method === 'emailjs')) {
    return {
      label: 'Email envoyé',
      title: `Envoyé à ${facture.email_sent_to || 'client'}${facture.email_sent_at ? ` le ${new Date(facture.email_sent_at).toLocaleDateString('fr-FR')}` : ''}`,
      color: '#22C55E',
      bg: 'rgba(34,197,94,0.15)',
      icon: <MarkEmailRead sx={{ fontSize: '14px !important' }} />,
    };
  }

  if ((facture.email_status === 'prepared') || (facture.email_sent_at && facture.email_sent_method === 'mailto')) {
    return {
      label: 'Email préparé',
      title: `Email ouvert dans la messagerie pour ${facture.email_sent_to || 'client'}`,
      color: '#3B82F6',
      bg: 'rgba(59,130,246,0.15)',
      icon: <OutgoingMail sx={{ fontSize: '14px !important' }} />,
    };
  }

  if (facture.email_status === 'failed') {
    return {
      label: 'Échec email',
      title: facture.email_error || 'Dernière tentative échouée',
      color: '#EF4444',
      bg: 'rgba(239,68,68,0.15)',
      icon: <Warning sx={{ fontSize: '14px !important' }} />,
    };
  }

  if (facture.email_status === 'missing') {
    return {
      label: 'Email manquant',
      title: 'Aucun email client enregistré',
      color: '#EAB308',
      bg: 'rgba(234,179,8,0.15)',
      icon: <Warning sx={{ fontSize: '14px !important' }} />,
    };
  }

  return {
    label: facture.statut === 'Payée' ? 'Email non envoyé' : 'En attente email',
    title: facture.statut === 'Payée'
      ? 'La facture est validée mais aucun email envoyé n’est enregistré'
      : 'L’email sera envoyé après validation de la facture',
    color: '#94A3B8',
    bg: 'rgba(148,163,184,0.12)',
    icon: <Email sx={{ fontSize: '14px !important' }} />,
  };
}

export default function EmailStatusChip({ facture, size = 'small' }) {
  const meta = getInvoiceEmailStatus(facture);
  return (
    <Tooltip title={meta.title}>
      <Chip
        icon={meta.icon}
        label={meta.label}
        size={size}
        sx={{
          bgcolor: meta.bg,
          color: meta.color,
          border: `1px solid ${meta.color}30`,
          fontWeight: 600,
          fontSize: '0.7rem',
          '& .MuiChip-icon': { color: meta.color },
        }}
      />
    </Tooltip>
  );
}
