import React from 'react';
import { TextField, MenuItem, Typography, Box } from '@mui/material';
import { CURRENCIES, getExchangeRateToMad, normalizeCurrency } from '../../utils/currency';

/** Sélecteur de devise pour création / édition de facture. */
export default function CurrencySelect({ value, onChange, size = 'small', fullWidth = true, ...props }) {
  const code = normalizeCurrency(value);

  return (
    <TextField
      select
      fullWidth={fullWidth}
      size={size}
      label="Devise"
      value={code}
      onChange={(e) => onChange(e.target.value)}
      helperText={
        code !== 'MAD'
          ? `Taux indicatif : 1 ${code} ≈ ${getExchangeRateToMad(code)} DH · Catalogue en MAD`
          : 'Devise par défaut (Maroc) · Prix catalogue en DH'
      }
      {...props}
    >
      {CURRENCIES.map((c) => (
        <MenuItem key={c.code} value={c.code}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 2 }}>
            <Typography>{c.label}</Typography>
            <Typography sx={{ color: '#64748B', fontFamily: 'monospace' }}>{c.code}</Typography>
          </Box>
        </MenuItem>
      ))}
    </TextField>
  );
}
