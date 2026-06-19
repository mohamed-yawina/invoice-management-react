import { createTheme } from '@mui/material/styles';
import { getPalette, getGradients } from './palettes';

export function createAppTheme(mode = 'light') {
  const palette = getPalette(mode);
  const gradients = getGradients(mode);
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: { main: palette.accent.blue, contrastText: '#FFFFFF' },
      secondary: { main: isDark ? '#94A3B8' : '#64748B', contrastText: '#FFFFFF' },
      success: { main: palette.status.success },
      warning: { main: palette.status.warning },
      error: { main: palette.status.danger },
      info: { main: palette.status.info },
      background: {
        default: palette.bg.page,
        paper: palette.bg.card,
      },
      text: {
        primary: palette.text.primary,
        secondary: palette.text.secondary,
      },
      divider: palette.line.subtle,
    },
    typography: {
      fontFamily: "'DM Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      h1: { fontFamily: "'Syne', sans-serif", fontWeight: 800, color: palette.text.primary },
      h2: { fontFamily: "'Syne', sans-serif", fontWeight: 800, color: palette.text.primary },
      h3: { fontFamily: "'Syne', sans-serif", fontWeight: 700, color: palette.text.primary },
      h4: { fontFamily: "'Syne', sans-serif", fontWeight: 700, letterSpacing: '-0.02em', color: palette.text.primary },
      h5: { fontWeight: 700, color: palette.text.primary },
      h6: { fontWeight: 600, color: palette.text.primary },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background: palette.bg.page,
            color: palette.text.primary,
            transition: 'background-color 0.25s ease, color 0.25s ease',
            '&::-webkit-scrollbar': { width: 10, height: 10 },
            '&::-webkit-scrollbar-track': { background: palette.bg.deep },
            '&::-webkit-scrollbar-thumb': {
              background: isDark ? '#334155' : '#CBD5E1',
              borderRadius: 10,
            },
            '&::-webkit-scrollbar-thumb:hover': { background: palette.accent.blue },
          },
          '*::-webkit-scrollbar': { width: 8, height: 8 },
          '*::-webkit-scrollbar-thumb': {
            background: isDark ? '#334155' : '#CBD5E1',
            borderRadius: 8,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: palette.bg.card,
            boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: palette.bg.card,
            backgroundImage: 'none',
            border: `1px solid ${palette.line.subtle}`,
            boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: palette.bg.input,
            '& fieldset': { borderColor: palette.line.subtle },
            '&:hover fieldset': { borderColor: palette.accent.blue },
            '&.Mui-focused fieldset': { borderColor: palette.accent.blue, borderWidth: 1.5 },
          },
          input: { color: palette.text.primary },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: { color: palette.text.secondary, '&.Mui-focused': { color: palette.accent.blue } },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            color: palette.text.primary,
            '&:hover': { backgroundColor: isDark ? 'rgba(37,99,235,0.12)' : 'rgba(37,99,235,0.06)' },
            '&.Mui-selected': {
              backgroundColor: isDark ? 'rgba(37,99,235,0.18)' : 'rgba(37,99,235,0.1)',
              '&:hover': { backgroundColor: isDark ? 'rgba(37,99,235,0.22)' : 'rgba(37,99,235,0.14)' },
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          icon: { color: palette.text.secondary },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 10, fontWeight: 600 },
          containedPrimary: {
            background: gradients.brand,
            color: '#FFFFFF',
            boxShadow: isDark ? '0 2px 8px rgba(37,99,235,0.35)' : '0 2px 8px rgba(37,99,235,0.25)',
            '&:hover': {
              background: gradients.brand,
              boxShadow: isDark ? '0 4px 14px rgba(37,99,235,0.45)' : '0 4px 14px rgba(37,99,235,0.35)',
              transform: 'translateY(-1px)',
            },
            transition: 'all 0.2s ease',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600 },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderColor: palette.line.subtle, color: palette.text.primary },
          head: {
            color: palette.text.muted,
            fontWeight: 700,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            bgcolor: isDark ? palette.bg.deep : '#F9FAFB',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
            backgroundColor: palette.bg.card,
            border: `1px solid ${palette.line.subtle}`,
            boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.5)' : '0 20px 40px rgba(0,0,0,0.12)',
          },
        },
      },
      MuiAutocomplete: {
        styleOverrides: {
          paper: {
            backgroundColor: palette.bg.card,
            border: `1px solid ${palette.line.subtle}`,
            backgroundImage: 'none',
            boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.08)',
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? '#1E293B' : '#1E293B',
            color: '#F8FAFC',
            fontSize: '0.75rem',
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 10 },
          standardInfo: {
            backgroundColor: isDark ? 'rgba(37,99,235,0.15)' : 'rgba(37,99,235,0.08)',
            color: isDark ? '#93C5FD' : '#1D4ED8',
            border: '1px solid rgba(37,99,235,0.2)',
          },
          standardSuccess: {
            backgroundColor: isDark ? 'rgba(34,197,94,0.15)' : 'rgba(22,163,74,0.08)',
            color: isDark ? '#86EFAC' : '#15803D',
            border: '1px solid rgba(22,163,74,0.2)',
          },
          standardWarning: {
            backgroundColor: isDark ? 'rgba(234,179,8,0.15)' : 'rgba(202,138,4,0.08)',
            color: isDark ? '#FDE047' : '#A16207',
            border: '1px solid rgba(202,138,4,0.2)',
          },
          standardError: {
            backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(220,38,38,0.08)',
            color: isDark ? '#FCA5A5' : '#B91C1C',
            border: '1px solid rgba(220,38,38,0.2)',
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: { borderColor: palette.line.subtle },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  });
}

export default createAppTheme;
