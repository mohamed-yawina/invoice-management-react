/** Styles réutilisables pour cartes / tableaux admin — s'adaptent au thème via CSS vars. */
export const adminCard = {
  bgcolor: 'var(--app-bg-card)',
  border: '1px solid var(--app-line-subtle)',
  borderRadius: 3,
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
};

export const adminTableHead = {
  color: 'var(--app-text-muted)',
  fontWeight: 600,
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

export const adminText = {
  title: { color: 'var(--app-text-primary)', fontWeight: 800 },
  body: { color: 'var(--app-text-secondary)' },
  accent: { color: 'var(--app-accent)' },
};
