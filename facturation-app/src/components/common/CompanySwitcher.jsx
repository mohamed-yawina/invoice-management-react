import React from 'react';
import {
  Box, FormControl, Select, MenuItem, Typography, Chip, Tooltip,
} from '@mui/material';
import { Business } from '@mui/icons-material';
import { useCompany } from '../../contexts/CompanyContext';

/** Sélecteur de société active (sidebar). */
export default function CompanySwitcher({ collapsed = false }) {
  const {
    companies, activeCompanyId, setActiveCompanyId, activeCompany,
    showAllCompanies, setShowAllCompanies, loading, isAdmin,
  } = useCompany();

  if (loading || companies.length === 0) return null;

  if (collapsed) {
    return (
      <Tooltip title={activeCompany?.nom || 'Société'} placement="right">
        <Box sx={{ display: 'flex', justifyContent: 'center', px: 1, pb: 1 }}>
          <Business sx={{ color: '#2563EB', fontSize: 20 }} />
        </Box>
      </Tooltip>
    );
  }

  return (
    <Box sx={{ px: 1.5, pb: 1.5, borderBottom: '1px solid rgba(37,99,235,0.08)' }}>
      <Typography sx={{
        color: 'var(--app-text-secondary)', fontSize: '0.62rem', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.8, px: 0.5,
      }}>
        Société active
      </Typography>
      <FormControl fullWidth size="small">
        <Select
          value={showAllCompanies ? '__all__' : (activeCompanyId || '')}
          onChange={(e) => {
            if (e.target.value === '__all__') {
              setShowAllCompanies(true);
            } else {
              setActiveCompanyId(e.target.value);
            }
          }}
          sx={{
            color: 'var(--app-text-primary)', bgcolor: 'var(--app-bg-deep)', borderRadius: '10px', fontSize: '0.82rem',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(37,99,235,0.15)' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(37,99,235,0.3)' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2563EB' },
            '& .MuiSvgIcon-root': { color: 'var(--app-text-secondary)' },
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                bgcolor: 'var(--app-bg-card)', border: '1px solid rgba(37,99,235,0.12)',
                '& .MuiMenuItem-root': { color: 'var(--app-text-primary)', fontSize: '0.85rem' },
              },
            },
          }}
        >
          {isAdmin && (
            <MenuItem value="__all__">
              <Chip label="Toutes" size="small" sx={{ bgcolor: 'rgba(59,130,246,0.15)', color: '#3B82F6', fontWeight: 600 }} />
            </MenuItem>
          )}
          {companies.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Business sx={{ fontSize: 16, color: '#2563EB' }} />
                <Typography sx={{ fontWeight: 600 }}>{c.nom}</Typography>
                {c.isDefault && (
                  <Chip label="Défaut" size="small" sx={{ height: 18, fontSize: '0.62rem', ml: 0.5 }} />
                )}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {showAllCompanies && isAdmin && (
        <Typography sx={{ color: 'var(--app-text-secondary)', fontSize: '0.68rem', mt: 0.8, px: 0.5 }}>
          Affichage consolidé de toutes les sociétés
        </Typography>
      )}
    </Box>
  );
}
