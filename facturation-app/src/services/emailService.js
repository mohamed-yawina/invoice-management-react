import emailjs from '@emailjs/browser';
import { generateInvoicePDF } from './pdfService';
import { uploadInvoicePDF } from './fileService';
import { formatMoney, normalizeCurrency } from '../utils/currency';

/**
 * Stratégie d'envoi de facture par email
 * ────────────────────────────────────────
 * EmailJS envoie un email texte (pas de pièce jointe sur plan gratuit).
 *
 * Par défaut (plan Spark) : envoi immédiat sans attendre Firebase Storage.
 * Si REACT_APP_ENABLE_PDF_STORAGE=true (plan Blaze) : tente un upload PDF (max 8s).
 *
 * Configuration .env :
 *   REACT_APP_EMAILJS_SERVICE_ID=service_xxx
 *   REACT_APP_EMAILJS_TEMPLATE_ID=template_xxx
 *   REACT_APP_EMAILJS_PUBLIC_KEY=xxx
 *   REACT_APP_ENABLE_PDF_STORAGE=true   (optionnel, Blaze uniquement)
 */

const SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;

/** Storage PDF : désactivé par défaut (Spark). Activer avec REACT_APP_ENABLE_PDF_STORAGE=true */
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
  'Le PDF de votre facture vous sera transmis séparément ou est disponible sur demande.';

const buildEmailContent = (facture, client, options = {}) => {
  const currency = normalizeCurrency(facture?.currency);
  const subject = options.subject ||
    `Facture ${facture.numero || ''} - ${options.companyName || 'FacturePro'}`;
  const body = options.body || (
`Bonjour ${client?.nom || ''},

Veuillez trouver ci-joint votre facture ${facture.numero || ''}.

Récapitulatif :
- Numéro : ${facture.numero || '—'}
- Date : ${facture.date_creation ? new Date(facture.date_creation).toLocaleDateString('fr-FR') : '—'}
- Devise : ${currency}
- Montant TTC : ${fmtAmount(facture.total_ttc, facture)}
- Statut : ${facture.statut || 'En attente'}

Vous pouvez télécharger votre facture en cliquant sur le lien ci-dessous :
{{PDF_URL_PLACEHOLDER}}

N'hésitez pas à nous contacter pour toute question.

Cordialement,
${options.fromName || 'FacturePro'}`
  );
  return { subject, body };
};

/** Tente l'upload Storage en parallèle (max 8s) — ne bloque pas l'envoi email. */
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

function buildTemplateParams(facture, client, options, pdfUrl) {
  const { subject, body } = buildEmailContent(facture, client, options);
  const finalBody = pdfUrl
    ? body.replace('{{PDF_URL_PLACEHOLDER}}', pdfUrl)
    : body.replace('{{PDF_URL_PLACEHOLDER}}', PDF_LINK_FALLBACK);

  return {
    to_email: client.email,
    to_name: client.nom || 'Client',
    subject,
    from_name: options.fromName || 'FacturePro',
    facture_numero: facture.numero || '',
    facture_date: facture.date_creation
      ? new Date(facture.date_creation).toLocaleDateString('fr-FR') : '',
        total_ttc: fmtAmount(facture.total_ttc, facture),
        statut: facture.statut || '',
        devise: normalizeCurrency(facture.currency),
    message: finalBody,
    pdf_url: pdfUrl || '',
  };
}

/**
 * Envoie la facture au client par email avec un lien de téléchargement.
 *
 * @returns {Promise<{ ok, method: 'emailjs' | 'mailto' | 'none', error?, pdfUrl? }>}
 */
export const sendInvoiceEmail = async (facture, client, options = {}) => {
  if (!client?.email) {
    return { ok: false, method: 'none', error: new Error('Email client manquant') };
  }

  const { subject, body } = buildEmailContent(facture, client, options);

  if (isEmailJSConfigured() && !options._skipEmailJS) {
    try {
      // Envoi immédiat (sans attendre Storage — cause principale du délai 5–10 min sur Spark)
      const templateParams = buildTemplateParams(facture, client, options, null);
      const result = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, { publicKey: PUBLIC_KEY });

      // Upload PDF en arrière-plan si Blaze (ne retarde pas la validation)
      if (isPdfStorageEnabled()) {
        tryUploadPdfLink(facture, client).catch(() => {});
      }

      return {
        ok: true,
        method: 'emailjs',
        pdfUrl: null,
        hasPdfLink: false,
        status: result?.status,
      };
    } catch (err) {
      console.error('EmailJS error, fallback mailto:', err);
    }
  }

  try {
    await generateInvoicePDF(facture, client, { autoSave: true });

    const fallbackBody = body.replace(
      '{{PDF_URL_PLACEHOLDER}}',
      '[Le PDF vient d\'être téléchargé sur votre ordinateur, merci de l\'attacher avant envoi.]'
    );

    const mailto = `mailto:${encodeURIComponent(client.email)}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(fallbackBody)}`;
    window.open(mailto, '_self');
    return { ok: true, method: 'mailto' };
  } catch (err) {
    return { ok: false, method: 'mailto', error: err };
  }
};

/** Initialise EmailJS au chargement de l'app. */
export const initEmailJS = () => {
  if (PUBLIC_KEY) {
    try { emailjs.init({ publicKey: PUBLIC_KEY }); }
    catch (e) { /* ignore */ }
  }
};
