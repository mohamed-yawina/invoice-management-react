import { auth, updateFactureByPath } from './firebaseService';
import { createNotification } from './notificationService';
import { sendInvoiceEmail, resolveClientContact } from './emailService';

/**
 * Après validation admin : notification créateur + email client (EmailJS ou mailto).
 * @returns {{ message: string, severity: 'success'|'info'|'warning' }}
 */
export async function postValidateInvoiceActions(facture) {
  let message = `Facture ${facture.numero || ''} validée`;
  let severity = 'success';

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
    return {
      message: `${message} — ⚠️ Aucun email client : envoi ignoré (ajoutez un email au client)`,
      severity: 'warning',
    };
  }

  const updated = { ...facture, statut: 'Payée', validated_by_admin: true };
  const res = await sendInvoiceEmail(updated, { ...contact }, {
    fromName: auth.currentUser?.displayName || 'FacturePro',
  });

  if (res.ok) {
    if (res.method === 'emailjs') {
      message += ` — Email envoyé à ${contact.email}`;
      if (res.hasPdfLink) message += ' (avec lien PDF)';
      severity = 'success';
    } else {
      message += ` — Outlook/Gmail ouvert pour ${contact.email} (attache le PDF)`;
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
      email_sent_at: new Date().toISOString(),
      email_sent_method: res.method,
      email_sent_to: contact.email,
      ...(res.pdfUrl ? { email_pdf_url: res.pdfUrl } : {}),
    });
  } else {
    message += ` — Échec envoi email : ${res.error?.message || 'erreur inconnue'}`;
    severity = 'warning';
  }

  return { message, severity };
}
