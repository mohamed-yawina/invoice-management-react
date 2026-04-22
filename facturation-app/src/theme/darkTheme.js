import { createTheme } from '@mui/material/styles';

// ─── Palette ──────────────────────────────────────────────────────────────────
export const palette = {
  bg: {
    deepest: '#060913',
    deep: '#080C14',
    page: '#0D0F14',
    card: '#0F1623',
    cardElev: '#161B26',
    input: '#1E2536',
  },
  line: {
    subtle: '#1E2D3D',
    glass: 'rgba(110,231,183,0.08)',
    hover: 'rgba(110,231,183,0.25)',
  },
  text: {
    primary: '#F1F5F9',
    secondary: '#94A3B8',
    muted: '#64748B',
    faint: '#475569',
  },
  accent: {
    mint: '#6EE7B7',
    mintDim: '#4ADE80',
    blue: '#3B82F6',
    purple: '#A855F7',
    orange: '#F97316',
    teal: '#14B8A6',
  },
  status: {
    success: '#22C55E',
    warning: '#EAB308',
    danger: '#EF4444',
    info: '#3B82F6',
  },
};

// Gradients réutilisables
export const gradients = {
  brand: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
  brandSoft: 'linear-gradient(135deg, rgba(110,231,183,0.18), rgba(59,130,246,0.18))',
  hero: 'linear-gradient(135deg, rgba(110,231,183,0.12) 0%, rgba(59,130,246,0.12) 50%, rgba(168,85,247,0.08) 100%)',
  pageBg: 'radial-gradient(ellipse at top left, rgba(110,231,183,0.07), transparent 60%), radial-gradient(ellipse at bottom right, rgba(59,130,246,0.06), transparent 60%), #080C14',
  card: 'linear-gradient(180deg, #151B28 0%, #101522 100%)',
  success: 'linear-gradient(135deg, #22C55E 0%, #14B8A6 100%)',
  warning: 'linear-gradient(135deg, #EAB308 0%, #F97316 100%)',
  danger: 'linear-gradient(135deg, #EF4444 0%, #EC4899 100%)',
  purple: 'linear-gradient(135deg, #A855F7 0%, #3B82F6 100%)',
};

// ─── MUI Theme ────────────────────────────────────────────────────────────────
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: palette.accent.mint, contrastText: '#0D0F14' },
    secondary: { main: palette.accent.blue, contrastText: '#F1F5F9' },
    success: { main: palette.status.success },
    warning: { main: palette.status.warning },
    error: { main: palette.status.danger },
    info: { main: palette.status.info },
    background: {
      default: palette.bg.deep,
      paper: palette.bg.cardElev,
    },
    text: {
      primary: palette.text.primary,
      secondary: palette.text.secondary,
    },
    divider: palette.line.subtle,
  },
  typography: {
    fontFamily: "'DM Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    h1: { fontFamily: "'Syne', sans-serif", fontWeight: 800 },
    h2: { fontFamily: "'Syne', sans-serif", fontWeight: 800 },
    h3: { fontFamily: "'Syne', sans-serif", fontWeight: 700 },
    h4: { fontFamily: "'Syne', sans-serif", fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: palette.bg.deep,
          color: palette.text.primary,
          '&::-webkit-scrollbar': { width: 10, height: 10 },
          '&::-webkit-scrollbar-track': { background: palette.bg.deepest },
          '&::-webkit-scrollbar-thumb': {
            background: 'linear-gradient(180deg, #1E2D3D, #0F1623)',
            borderRadius: 10,
          },
          '&::-webkit-scrollbar-thumb:hover': { background: palette.accent.mint },
        },
        '*::-webkit-scrollbar': { width: 8, height: 8 },
        '*::-webkit-scrollbar-thumb': {
          background: '#1E2D3D', borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: palette.bg.cardElev,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: palette.bg.cardElev,
          backgroundImage: 'none',
          border: `1px solid ${palette.line.subtle}`,
          transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: palette.bg.input,
          '& fieldset': { borderColor: '#2D3748' },
          '&:hover fieldset': { borderColor: palette.accent.mint },
          '&.Mui-focused fieldset': { borderColor: palette.accent.mint, borderWidth: 1.5 },
        },
        input: { color: palette.text.primary },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { color: palette.text.secondary, '&.Mui-focused': { color: palette.accent.mint } },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: 'rgba(110,231,183,0.08)' },
          '&.Mui-selected': {
            backgroundColor: 'rgba(110,231,183,0.12)',
            '&:hover': { backgroundColor: 'rgba(110,231,183,0.18)' },
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
          color: '#0D0F14',
          boxShadow: '0 4px 14px rgba(110,231,183,0.25)',
          '&:hover': {
            background: gradients.brand,
            boxShadow: '0 6px 20px rgba(110,231,183,0.4)',
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
        root: { borderColor: palette.line.subtle },
        head: { color: palette.text.muted, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: palette.bg.cardElev,
          border: `1px solid ${palette.line.subtle}`,
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          backgroundColor: palette.bg.cardElev,
          border: `1px solid ${palette.line.subtle}`,
          backgroundImage: 'none',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: palette.bg.deepest,
          border: `1px solid ${palette.line.subtle}`,
          color: palette.text.primary,
          fontSize: '0.75rem',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 10 },
        standardInfo: {
          backgroundColor: 'rgba(59,130,246,0.1)',
          color: '#93C5FD',
          border: '1px solid rgba(59,130,246,0.25)',
        },
        standardSuccess: {
          backgroundColor: 'rgba(34,197,94,0.1)',
          color: '#86EFAC',
          border: '1px solid rgba(34,197,94,0.25)',
        },
        standardWarning: {
          backgroundColor: 'rgba(234,179,8,0.1)',
          color: '#FDE68A',
          border: '1px solid rgba(234,179,8,0.25)',
        },
        standardError: {
          backgroundColor: 'rgba(239,68,68,0.1)',
          color: '#FCA5A5',
          border: '1px solid rgba(239,68,68,0.25)',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: palette.line.subtle },
      },
    },
  },
});

export default darkTheme;
