import {
  auth,
  ensureInvoiceSecureToken,
  updateFactureByPath,
} from './firebaseService';
import { createNotification } from './notificationService';
import { sendInvoiceEmail, resolveClientContact } from './emailService';
import { buildVerificationUrl } from '../utils/invoiceQr';
import { getPublicAppOrigin } from '../utils/appOrigin';

/**
 * Après validation admin : notification créateur + email client.
 * @returns {{ message: string, severity: 'success'|'info'|'warning' }}
 */
export async function postValidateInvoiceActions(facture) {
  let message = `Facture ${facture.numero || ''} validée`;
  let severity = 'success';
  const now = new Date().toISOString();

  if (facture.created_by) {
    await createNotification(facture.created_by, {
      type: 'success',
      title: 'Facture validée',
      message: `Votre facture ${facture.numero || ''} a été validée par l'admin.`,
      link: '/app/invoices',
      meta: { factureId: facture.id, factureNumero: facture.numero },
    });
  }

  const contact = resolveClientContact(facture);
  if (!contact.email) {
    await updateFactureByPath(facture, {
      email_status: 'missing',
      email_attempted_at: now,
      email_error: 'Email client manquant',
      email_sent_at: null,
      email_sent_method: null,
      email_sent_to: null,
    });
    return {
      message: `${message} - aucun email client : envoi ignoré`,
      severity: 'warning',
    };
  }

  let secured = { ...facture, statut: 'Payée', validated_by_admin: true };
  let verificationUrl = facture.verificationUrl || '';
  try {
    secured = await ensureInvoiceSecureToken(secured);
    verificationUrl = buildVerificationUrl(secured, null, getPublicAppOrigin());
  } catch (e) {
    console.warn('Lien de vérification indisponible pour email:', e);
  }

  const res = await sendInvoiceEmail(secured, { ...contact }, {
    fromName: auth.currentUser?.displayName || secured.societe_snapshot?.nom || 'FacturePro',
    companyName: secured.societe_snapshot?.nom || 'FacturePro',
    verificationUrl,
  });

  if (res.ok) {
    const emailStatus = res.method === 'emailjs' ? 'sent' : 'prepared';
    if (res.method === 'emailjs') {
      message += ` - Email envoyé à ${contact.email}`;
      severity = 'success';
    } else {
      message += ` - Email préparé pour ${contact.email} (à envoyer depuis Outlook/Gmail)`;
      severity = 'info';
    }

    if (facture.created_by) {
      await createNotification(facture.created_by, {
        type: 'email',
        title: res.method === 'emailjs' ? 'Email envoyé au client' : 'Email préparé',
        message: `${contact.nom || 'Le client'} (${contact.email}) a été contacté pour la facture ${facture.numero || ''}.`,
        link: '/app/invoices',
        meta: { factureId: facture.id, method: res.method },
      });
    }

    await updateFactureByPath(facture, {
      email_status: emailStatus,
      email_attempted_at: now,
      email_sent_at: now,
      email_sent_method: res.method,
      email_sent_to: contact.email,
      email_error: null,
      ...(verificationUrl ? { email_verification_url: verificationUrl } : {}),
      ...(res.pdfUrl ? { email_pdf_url: res.pdfUrl } : {}),
    });
  } else {
    const errorMessage = res.error?.message || 'erreur inconnue';
    message += ` - échec envoi email : ${errorMessage}`;
    severity = 'warning';
    await updateFactureByPath(facture, {
      email_status: 'failed',
      email_attempted_at: now,
      email_error: errorMessage,
      email_sent_at: null,
      email_sent_method: res.method || null,
      email_sent_to: contact.email,
      ...(verificationUrl ? { email_verification_url: verificationUrl } : {}),
    });
  }

  return { message, severity };
}
