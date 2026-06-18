import React from 'react';
import { TextField, MenuItem, Box, Typography } from '@mui/material';
import { Business } from '@mui/icons-material';

/** Sélecteur de société pour formulaire (création facture). */
export default function CompanySelect({ companies = [], value, onChange, size = 'small', ...props }) {
  return (
    <TextField
      select
      fullWidth
      size={size}
      label="Société émettrice *"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      helperText="La facture sera émise au nom de cette société (PDF, email)"
      {...props}
    >
      {companies.length === 0 ? (
        <MenuItem value="" disabled>Aucune société disponible</MenuItem>
      ) : companies.map((c) => (
        <MenuItem key={c.id} value={c.id}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Business sx={{ fontSize: 16, color: '#6EE7B7' }} />
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{c.nom}</Typography>
              {c.ice && (
                <Typography sx={{ fontSize: 11, color: '#64748B' }}>ICE {c.ice}</Typography>
              )}
            </Box>
          </Box>
        </MenuItem>
      ))}
    </TextField>
  );
}
