import emailjs from '@emailjs/browser';
import { generateInvoicePDF } from './pdfService';
import { uploadInvoicePDF } from './fileService';
import { formatMoney, normalizeCurrency } from '../utils/currency';

/**
 * EmailJS envoie un email texte (pas de pièce jointe sur plan gratuit).
 * Si REACT_APP_ENABLE_PDF_STORAGE=true, l'app tente aussi un upload PDF Storage.
 */

const SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;

export const isPdfStorageEnabled = () =>
  process.env.REACT_APP_ENABLE_PDF_STORAGE === 'true';

export const isEmailJSConfigured = () =>
  Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);

/** Résout email / nom client depuis la fiche client ou le snapshot facture. */
export const resolveClientContact = (facture) => {
  const snap = facture?.client_snapshot || {};
  return {
    nom: facture?.client_nom || snap.nom || '',
    email: (facture?.client_email || snap.email || '').trim(),
    tel: facture?.client_tel || snap.tel || '',
    adresse: facture?.client_adresse || snap.adresse || '',
  };
};

const fmtAmount = (n, facture) => formatMoney(n, normalizeCurrency(facture?.currency));

const PDF_LINK_FALLBACK =
  'Le PDF de votre facture vous sera transmis séparément ou reste disponible sur demande.';

const VERIFY_LINK_FALLBACK =
  'Le lien de vérification sécurisé est disponible dans le QR code du PDF.';

const buildEmailContent = (facture, client, options = {}) => {
  const currency = normalizeCurrency(facture?.currency);
  const companyName = options.companyName || facture?.societe_snapshot?.nom || 'FacturePro';
  const subject = options.subject ||
    `Votre facture ${facture.numero || ''} validée - ${companyName}`;

  const body = options.body || (
`Bonjour ${client?.nom || ''},

Nous vous informons que votre facture ${facture.numero || ''} a été validée.

Récapitulatif :
- Numéro : ${facture.numero || '-'}
- Date : ${facture.date_creation ? new Date(facture.date_creation).toLocaleDateString('fr-FR') : '-'}
- Devise : ${currency}
- Montant TTC : ${fmtAmount(facture.total_ttc, facture)}
- Statut : ${facture.statut || 'Payée'}

Lien de vérification sécurisé :
{{VERIFY_URL_PLACEHOLDER}}

Lien de téléchargement PDF :
{{PDF_URL_PLACEHOLDER}}

Ce message est envoyé automatiquement suite à la validation de votre facture.
N'hésitez pas à nous contacter pour toute question ou information complémentaire.

Cordialement,
${options.fromName || companyName}`
  );

  return { subject, body };
};

async function tryUploadPdfLink(facture, client) {
  if (!isPdfStorageEnabled()) return null;
  try {
    const doc = await generateInvoicePDF(facture, client, { autoSave: false });
    const pdfBlob = doc.output('blob');
    const safeNum = (facture.numero || 'facture').replace(/[^\w-]/g, '_');
    const uploaded = await uploadInvoicePDF(pdfBlob, facture.id, safeNum);
    return uploaded.url;
  } catch (err) {
    console.warn('[Email] Upload PDF Storage ignoré:', err?.message || err);
    return null;
  }
}

function fillEmailPlaceholders(body, { pdfUrl, verificationUrl }) {
  return body
    .replace('{{PDF_URL_PLACEHOLDER}}', pdfUrl || PDF_LINK_FALLBACK)
    .replace('{{VERIFY_URL_PLACEHOLDER}}', verificationUrl || VERIFY_LINK_FALLBACK);
}

function buildTemplateParams(facture, client, options, pdfUrl) {
  const { subject, body } = buildEmailContent(facture, client, options);
  const verificationUrl = options.verificationUrl || facture.verificationUrl || '';
  const message = fillEmailPlaceholders(body, { pdfUrl, verificationUrl });

  return {
    to_email: client.email,
    to_name: client.nom || 'Client',
    subject,
    from_name: options.fromName || facture?.societe_snapshot?.nom || 'FacturePro',
    facture_numero: facture.numero || '',
    facture_date: facture.date_creation
      ? new Date(facture.date_creation).toLocaleDateString('fr-FR') : '',
    total_ttc: fmtAmount(facture.total_ttc, facture),
    statut: facture.statut || '',
    devise: normalizeCurrency(facture.currency),
    message,
    pdf_url: pdfUrl || '',
    verification_url: verificationUrl,
  };
}

/**
 * Envoie la facture au client par email avec lien de vérification.
 *
 * @returns {Promise<{ ok, method: 'emailjs' | 'mailto' | 'none', error?, pdfUrl?, verificationUrl? }>}
 */
export const sendInvoiceEmail = async (facture, client, options = {}) => {
  if (!client?.email) {
    return { ok: false, method: 'none', error: new Error('Email client manquant') };
  }

  const verificationUrl = options.verificationUrl || facture.verificationUrl || '';
  const { subject, body } = buildEmailContent(facture, client, options);

  if (isEmailJSConfigured() && !options._skipEmailJS) {
    try {
      const templateParams = buildTemplateParams(facture, client, options, null);
      const result = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, { publicKey: PUBLIC_KEY });

      if (isPdfStorageEnabled()) {
        tryUploadPdfLink(facture, client).catch(() => {});
      }

      return {
        ok: true,
        method: 'emailjs',
        pdfUrl: null,
        verificationUrl,
        hasPdfLink: false,
        status: result?.status,
      };
    } catch (err) {
      console.error('EmailJS error, fallback mailto:', err);
    }
  }

  try {
    await generateInvoicePDF(facture, client, { autoSave: true });

    const fallbackBody = fillEmailPlaceholders(body, {
      verificationUrl,
      pdfUrl: '[Le PDF vient d\'être téléchargé sur votre ordinateur, merci de l\'attacher avant envoi.]',
    });

    const mailto = `mailto:${encodeURIComponent(client.email)}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(fallbackBody)}`;
    window.open(mailto, '_self');
    return { ok: true, method: 'mailto', verificationUrl };
  } catch (err) {
    return { ok: false, method: 'mailto', error: err, verificationUrl };
  }
};

export const initEmailJS = () => {
  if (PUBLIC_KEY) {
    try { emailjs.init({ publicKey: PUBLIC_KEY }); }
    catch (e) { /* ignore */ }
  }
};
