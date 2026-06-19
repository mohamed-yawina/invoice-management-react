/** Palettes clair / sombre partagées par MUI et les composants custom. */

export const lightPalette = {
  bg: {
    deepest: '#E5E7EB',
    deep: '#F3F4F6',
    page: '#F8FAFC',
    card: '#FFFFFF',
    cardElev: '#FFFFFF',
    input: '#FFFFFF',
  },
  line: {
    subtle: '#E5E7EB',
    glass: 'rgba(37,99,235,0.06)',
    hover: 'rgba(37,99,235,0.2)',
  },
  text: {
    primary: '#1E293B',
    secondary: '#64748B',
    muted: '#94A3B8',
    faint: '#CBD5E1',
  },
  accent: {
    mint: '#2563EB',
    mintDim: '#1D4ED8',
    blue: '#2563EB',
    purple: '#6366F1',
    orange: '#EA580C',
    teal: '#0D9488',
  },
  status: {
    success: '#16A34A',
    warning: '#CA8A04',
    danger: '#DC2626',
    info: '#2563EB',
  },
};

export const darkPalette = {
  bg: {
    deepest: '#030712',
    deep: '#0A0F1A',
    page: '#080C14',
    card: '#0F1623',
    cardElev: '#141C2B',
    input: '#131B2A',
  },
  line: {
    subtle: 'rgba(255,255,255,0.08)',
    glass: 'rgba(37,99,235,0.1)',
    hover: 'rgba(37,99,235,0.3)',
  },
  text: {
    primary: '#F1F5F9',
    secondary: '#94A3B8',
    muted: '#64748B',
    faint: '#475569',
  },
  accent: {
    mint: '#2563EB',
    mintDim: '#1D4ED8',
    blue: '#2563EB',
    purple: '#818CF8',
    orange: '#FB923C',
    teal: '#2DD4BF',
  },
  status: {
    success: '#22C55E',
    warning: '#EAB308',
    danger: '#EF4444',
    info: '#60A5FA',
  },
};

export function getPalette(mode) {
  return mode === 'dark' ? darkPalette : lightPalette;
}

export function getGradients(mode) {
  const p = getPalette(mode);
  if (mode === 'dark') {
    return {
      brand: 'linear-gradient(135deg, #2563EB 0%, #475569 100%)',
      brandSoft: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(71,85,105,0.12))',
      hero: 'linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(15,22,35,0.8) 100%)',
      pageBg: p.bg.page,
      card: `linear-gradient(180deg, ${p.bg.card} 0%, ${p.bg.cardElev} 100%)`,
      success: 'linear-gradient(135deg, #22C55E 0%, #0D9488 100%)',
      warning: 'linear-gradient(135deg, #EAB308 0%, #EA580C 100%)',
      danger: 'linear-gradient(135deg, #EF4444 0%, #DB2777 100%)',
      purple: 'linear-gradient(135deg, #818CF8 0%, #2563EB 100%)',
    };
  }
  return {
    brand: 'linear-gradient(135deg, #2563EB 0%, #475569 100%)',
    brandSoft: 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(71,85,105,0.08))',
    hero: 'linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(148,163,184,0.08) 100%)',
    pageBg: p.bg.page,
    card: 'linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%)',
    success: 'linear-gradient(135deg, #16A34A 0%, #0D9488 100%)',
    warning: 'linear-gradient(135deg, #CA8A04 0%, #EA580C 100%)',
    danger: 'linear-gradient(135deg, #DC2626 0%, #DB2777 100%)',
    purple: 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)',
  };
}

/** Applique les variables CSS utilisées par les pages avec couleurs en dur. */
export function applyThemeCssVariables(mode) {
  const p = getPalette(mode);
  const root = document.documentElement;
  root.setAttribute('data-theme', mode);
  root.style.setProperty('--app-bg-page', p.bg.page);
  root.style.setProperty('--app-bg-card', p.bg.card);
  root.style.setProperty('--app-bg-deep', p.bg.deep);
  root.style.setProperty('--app-bg-input', p.bg.input);
  root.style.setProperty('--app-line-subtle', p.line.subtle);
  root.style.setProperty('--app-text-primary', p.text.primary);
  root.style.setProperty('--app-text-secondary', p.text.secondary);
  root.style.setProperty('--app-text-muted', p.text.muted);
  root.style.setProperty('--app-accent', p.accent.blue);
  root.style.colorScheme = mode;
}
