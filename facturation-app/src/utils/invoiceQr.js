import QRCode from 'qrcode';
import { getPublicAppOrigin } from './appOrigin';

/**
 * Contenu legacy du QR : format court séparé par | (anciens PDF).
 * Exemple : FacturePro|F-123456|1250.00|16/06/2026|Payée|Client
 */
export function buildInvoiceQRPayload(facture, client = null) {
  const numero = String(facture.numero || '').trim();
  const ttc = (Number(facture.total_ttc) || 0).toFixed(2);
  const date = facture.date_creation
    ? new Date(facture.date_creation).toLocaleDateString('fr-FR')
    : '';
  const statut = facture.statut || 'En attente';
  const clientNom = String(
    client?.nom || facture.client_nom || facture.client_snapshot?.nom || ''
  ).trim().slice(0, 24);

  return ['FacturePro', numero, ttc, date, statut, clientNom].join('|');
}

/**
 * URL absolue de vérification pour le QR (nouveaux PDF).
 * @param {object} facture - doit contenir numero/id et secureToken
 * @param {string} [origin] - ex. window.location.origin
 */
export function buildVerificationUrl(facture, token = null, origin = null) {
  const base = origin || getPublicAppOrigin();
  const slug = encodeURIComponent(facture?.numero || facture?.id || '');
  const secureToken = token || facture?.secureToken || '';
  return `${base}/verify-invoice/${slug}?token=${encodeURIComponent(secureToken)}`;
}

/** Décode un texte scanné : URL de vérification, format | ou ancien JSON. */
export function parseInvoiceQRPayload(text) {
  if (!text || typeof text !== 'string') return null;
  const raw = text.trim();

  // Nouveau format : URL de vérification
  if (raw.includes('verify-invoice')) {
    try {
      const href = raw.startsWith('http') ? raw : `${typeof window !== 'undefined' ? window.location.origin : 'http://local'}${raw.startsWith('/') ? raw : `/${raw}`}`;
      const url = new URL(href);
      const parts = url.pathname.split('/').filter(Boolean);
      const idx = parts.indexOf('verify-invoice');
      const invoiceId = idx >= 0 ? decodeURIComponent(parts[idx + 1] || '') : '';
      const token = url.searchParams.get('token') || '';
      return { type: 'verificationUrl', url: url.href, invoiceId, token };
    } catch {
      return null;
    }
  }

  if (raw.startsWith('{')) {
    try { return { type: 'json', ...JSON.parse(raw) }; } catch { return null; }
  }

  const segments = raw.split('|');
  if (segments.length < 5) return null;
  return {
    type: 'legacy',
    app: segments[0],
    numero: segments[1],
    total_ttc: segments[2],
    date: segments[3],
    statut: segments[4],
    client: segments[5] || '',
  };
}

/**
 * Génère une image PNG (data URL) du QR code facture.
 * Priorité : options.verificationUrl (lien sécurisé) sinon payload legacy.
 */
export async function generateInvoiceQRDataUrl(facture, client = null, options = {}) {
  const text = options.verificationUrl || buildInvoiceQRPayload(facture, client);
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 480,
    color: { dark: '#000000', light: '#FFFFFF' },
  });
}
