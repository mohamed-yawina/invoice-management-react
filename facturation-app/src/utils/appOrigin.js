const STORAGE_KEY = 'facturepro_public_url';

/**
 * Origine publique de l'app pour les liens QR (vérification facture).
 *
 * localhost ne fonctionne PAS depuis un téléphone : le QR doit pointer
 * vers l'IP locale (Wi‑Fi) ou l'URL de production.
 *
 * Priorité :
 *   1. localStorage (Paramètres → URL publique QR)
 *   2. REACT_APP_PUBLIC_URL dans .env
 *   3. window.location.origin si ce n'est pas localhost
 *   4. localhost (avec avertissement console)
 */
export function getPublicAppOrigin() {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY)?.trim().replace(/\/$/, '');
    if (stored) return stored;
  }

  const fromEnv = process.env.REACT_APP_PUBLIC_URL?.trim().replace(/\/$/, '');
  if (fromEnv) return fromEnv;

  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      const p = port ? `:${port}` : '';
      return `${protocol}//${hostname}${p}`;
    }
  }

  if (typeof window !== 'undefined') {
    console.warn(
      '[FacturePro] Le QR utilise localhost — inaccessible depuis un mobile. ' +
      'Paramètres → URL publique QR, ou REACT_APP_PUBLIC_URL dans .env puis redémarrez npm start.'
    );
    return window.location.origin;
  }

  return '';
}

/** Enregistre l'URL publique (effet immédiat, sans redémarrer npm start). */
export function setPublicAppOrigin(url) {
  const clean = String(url || '').trim().replace(/\/$/, '');
  if (typeof localStorage !== 'undefined') {
    if (clean) localStorage.setItem(STORAGE_KEY, clean);
    else localStorage.removeItem(STORAGE_KEY);
  }
  return clean;
}

/** Copie REACT_APP_PUBLIC_URL du .env vers localStorage au démarrage. */
export function initPublicAppOrigin() {
  if (typeof localStorage === 'undefined') return;

  const env = process.env.REACT_APP_PUBLIC_URL?.trim().replace(/\/$/, '');
  if (env) {
    localStorage.setItem(STORAGE_KEY, env);
    return;
  }

  // Dev sans .env rechargé : prégarnir l'IP LAN si rien n'est encore enregistré
  if (
    !localStorage.getItem(STORAGE_KEY) &&
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    localStorage.setItem(STORAGE_KEY, 'http://192.168.1.11:3000');
  }
}

/** True si l'origine utilisée pour le QR est localhost (scan mobile échouera). */
export function isLocalhostOrigin(origin = getPublicAppOrigin()) {
  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return true;
  }
}
