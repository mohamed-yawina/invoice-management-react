import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generateInvoiceQRDataUrl, buildVerificationUrl } from '../utils/invoiceQr';
import { getPublicAppOrigin, isLocalhostOrigin } from '../utils/appOrigin';
import { ensureInvoiceSecureToken } from './firebaseService';
import { resolveCompanyForInvoice } from './companyService';
import { formatMoney as formatCurrency, normalizeCurrency, getInvoiceAmountMad } from '../utils/currency';

const COLORS = {
  primary: [110, 231, 183],
  dark: [13, 17, 23],
  slate: [100, 116, 139],
  light: [241, 245, 249],
  border: [226, 232, 240],
  success: [34, 197, 94],
  warning: [234, 179, 8],
  danger: [239, 68, 68],
};

const statusColor = (statut) => {
  if (statut === 'Payée') return COLORS.success;
  if (statut === 'Rejetée') return COLORS.danger;
  return COLORS.warning;
};

const formatDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt) ? d : dt.toLocaleDateString('fr-FR');
};

/**
 * Génère un PDF de facture.
 * @param {object} facture - La facture (doit contenir numero, date_creation, articles, totaux, statut...)
 * @param {object} client  - Optionnel : { nom, email, tel, adresse }
 * @param {object} options - Optionnel : { company, logoDataUrl, autoSave, filename }
 * @returns {Promise<jsPDF>} l'instance jsPDF (déjà sauvegardée si autoSave !== false)
 */
export async function generateInvoicePDF(facture, client = null, options = {}) {
  const {
    autoSave = true,
    filename,
  } = options;

  const company = await resolveCompanyForInvoice(facture, options.company);

  const currency = normalizeCurrency(facture.currency);
  const fmt = (n) => formatCurrency(n, currency);

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ── Bande supérieure colorée ─────────────────────────────
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 4, 'F');

  // ── En-tête entreprise ───────────────────────────────────
  doc.setTextColor(...COLORS.dark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(company.nom, 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.slate);
  doc.text(company.adresse, 14, 24);
  doc.text(`Tél : ${company.tel}`, 14, 29);
  doc.text(`Email : ${company.email}`, 14, 34);
  if (company.ice) doc.text(`ICE : ${company.ice}`, 14, 39);

  // ── Bloc FACTURE (droite) ────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(...COLORS.dark);
  doc.text('FACTURE', pageWidth - 14, 18, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.slate);
  const metaLines = [
    `N° ${facture.numero || '—'}`,
    `Date : ${formatDate(facture.date_creation)}`,
    `Devise : ${currency}`,
  ];
  if (facture.date_depot) {
    metaLines.push(`Dépôt : ${formatDate(facture.date_depot)}`);
  }

  let metaY = 25;
  metaLines.forEach((line) => {
    doc.text(line, pageWidth - 14, metaY, { align: 'right' });
    metaY += 5;
  });

  // Statut (badge) — placé sous les métadonnées pour éviter le chevauchement
  const statut = facture.statut || 'En attente';
  const sc = statusColor(statut);
  const badgeW = 36;
  const badgeH = 7;
  const badgeX = pageWidth - 14 - badgeW;
  const badgeY = metaY + 1.5;

  doc.setFillColor(sc[0], sc[1], sc[2]);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(statut.toUpperCase(), badgeX + badgeW / 2, badgeY + 4.8, { align: 'center' });

  const rightBlockBottom = badgeY + badgeH;
  const leftBlockBottom = company.ice ? 39 : 34;
  const separatorY = Math.max(rightBlockBottom, leftBlockBottom) + 6;

  // ── Séparateur ──────────────────────────────────────────
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(14, separatorY, pageWidth - 14, separatorY);

  // ── Bloc client ─────────────────────────────────────────
  const clientBlockY = separatorY + 8;
  doc.setTextColor(...COLORS.slate);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('FACTURÉ À', 14, clientBlockY);

  doc.setTextColor(...COLORS.dark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  const clientName = client?.nom || facture.client_nom || 'Client';
  doc.text(clientName, 14, clientBlockY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.slate);
  let y = clientBlockY + 11;
  if (client?.adresse || facture.client_adresse) {
    doc.text(client?.adresse || facture.client_adresse, 14, y); y += 4.5;
  }
  if (client?.email || facture.client_email) {
    doc.text(client?.email || facture.client_email, 14, y); y += 4.5;
  }
  if (client?.tel || facture.client_tel) {
    doc.text(`Tél : ${client?.tel || facture.client_tel}`, 14, y); y += 4.5;
  }

  // ── Infos paiement (droite) ─────────────────────────────
  if (facture.type_virement || facture.date_encaissement) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.slate);
    doc.text('PAIEMENT', pageWidth - 14, clientBlockY, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.dark);
    let yr = clientBlockY + 6;
    if (facture.type_virement) {
      doc.text(`Type : ${facture.type_virement}`, pageWidth - 14, yr, { align: 'right' }); yr += 4.5;
    }
    if (facture.date_encaissement) {
      doc.text(`Encaissé le ${formatDate(facture.date_encaissement)}`, pageWidth - 14, yr, { align: 'right' });
    }
  }

  // ── Tableau des articles ────────────────────────────────
  const articles = Array.isArray(facture.articles) ? facture.articles : [];
  const tableStartY = Math.max(y + 6, clientBlockY + 30);

  const rows = articles.map((a) => {
    const qte = Number(a.quantite ?? a.qte ?? 1);
    const pu = Number(a.prix_unitaire ?? a.prix ?? 0);
    const remise = Number(a.remise ?? 0);
    const sous = qte * pu;
    const total = remise ? sous * (1 - remise / 100) : sous;
    return [
      a.designation || a.nom || '—',
      qte.toString(),
      fmt(pu),
      remise ? `${remise}%` : '—',
      fmt(total),
    ];
  });

  autoTable(doc, {
    startY: tableStartY,
    head: [['Désignation', 'Qté', 'Prix unitaire', 'Remise', 'Total HT']],
    body: rows.length > 0 ? rows : [['—', '—', '—', '—', '—']],
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      lineColor: COLORS.border,
      lineWidth: 0.2,
      textColor: COLORS.dark,
    },
    headStyles: {
      fillColor: COLORS.dark,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
    },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'center' },
      4: { halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  // ── Totaux ──────────────────────────────────────────────
  const finalY = doc.lastAutoTable.finalY + 6;
  const totalHT = Number(facture.total_ht ?? 0);
  const tva = Number(facture.tva ?? facture.montant_tva ?? 0);
  const totalTTC = Number(facture.total_ttc ?? 0);
  const remiseGlobale = Number(facture.remise_globale ?? 0);

  const totalsX = pageWidth - 90;
  const totalsW = 76;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.slate);

  let ty = finalY;
  doc.text('Total HT', totalsX, ty);
  doc.setTextColor(...COLORS.dark);
  doc.text(fmt(totalHT), totalsX + totalsW, ty, { align: 'right' });
  ty += 6;

  if (remiseGlobale > 0) {
    doc.setTextColor(...COLORS.slate);
    doc.text(`Remise globale`, totalsX, ty);
    doc.setTextColor(...COLORS.danger);
    doc.text(`- ${fmt(remiseGlobale)}`, totalsX + totalsW, ty, { align: 'right' });
    ty += 6;
  }

  doc.setTextColor(...COLORS.slate);
  doc.text('TVA', totalsX, ty);
  doc.setTextColor(...COLORS.dark);
  doc.text(fmt(tva), totalsX + totalsW, ty, { align: 'right' });
  ty += 4;

  // Ligne
  doc.setDrawColor(...COLORS.border);
  doc.line(totalsX, ty, totalsX + totalsW, ty);
  ty += 6;

  // Total TTC - mis en valeur
  doc.setFillColor(...COLORS.dark);
  doc.roundedRect(totalsX - 2, ty - 5, totalsW + 4, 10, 1.5, 1.5, 'F');
  doc.setTextColor(...COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL TTC', totalsX, ty + 1.5);
  doc.setTextColor(255, 255, 255);
  doc.text(fmt(totalTTC), totalsX + totalsW, ty + 1.5, { align: 'right' });

  // ── Signature & pied de page ────────────────────────────
  const sigY = Math.max(ty + 25, pageHeight - 45);
  doc.setTextColor(...COLORS.slate);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Signature & Cachet', 14, sigY);
  doc.setDrawColor(...COLORS.border);
  doc.rect(14, sigY + 2, 60, 20);

  // Signature numérique si présente (data URL PNG/JPEG)
  const signature = facture.signature || options.signature;
  if (signature && typeof signature === 'string' && signature.startsWith('data:image')) {
    try {
      doc.addImage(signature, 'PNG', 15, sigY + 3, 58, 18);
    } catch (e) {
      console.warn('Impossible d\'insérer la signature dans le PDF:', e);
    }
  }

  // Code QR — lien sécurisé /verify-invoice/:id?token=... (fallback legacy si échec)
  const qrSize = 38;
  const qrX = pageWidth - 14 - qrSize;
  try {
    let verificationUrl = null;
    try {
      const secured = await ensureInvoiceSecureToken(facture);
      verificationUrl = buildVerificationUrl(secured, null, getPublicAppOrigin());
      if (isLocalhostOrigin(verificationUrl)) {
        console.warn(
          '[FacturePro] QR localhost — scan mobile impossible. ' +
          'Paramètres → URL publique QR : http://VOTRE_IP:3000 (Wi-Fi, pas 4G).'
        );
      } else {
        console.info('[FacturePro] URL QR :', verificationUrl);
      }
    } catch (tokenErr) {
      console.warn('QR sécurisé indisponible, fallback format legacy:', tokenErr);
    }
    const qrDataUrl = await generateInvoiceQRDataUrl(facture, client, { verificationUrl });
    doc.setTextColor(...COLORS.slate);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Code QR', qrX + qrSize / 2, sigY, { align: 'center' });
    doc.addImage(qrDataUrl, 'PNG', qrX, sigY + 3, qrSize, qrSize);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text(facture.numero || '—', qrX + qrSize / 2, sigY + qrSize + 5, { align: 'center' });
    doc.text('Scan = vérification', qrX + qrSize / 2, sigY + qrSize + 9, { align: 'center' });
  } catch (e) {
    console.warn('Impossible de générer le QR code:', e);
  }

  // Pied de page
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.slate);
  doc.text(
    `${company.nom} — ${company.adresse} — ${company.email}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );
  doc.text(
    `Page 1 / 1 — Document généré le ${new Date().toLocaleDateString('fr-FR')}`,
    pageWidth / 2,
    pageHeight - 6,
    { align: 'center' }
  );

  if (autoSave) {
    const safeNum = (facture.numero || 'facture').replace(/[^\w-]/g, '_');
    doc.save(filename || `${safeNum}.pdf`);
  }

  return doc;
}

/**
 * Génère un PDF récapitulatif (liste de factures).
 * Pratique pour un export admin.
 */
export function generateInvoicesReportPDF(factures = [], options = {}) {
  const { title = 'Rapport des factures', autoSave = true, filename } = options;
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.dark);
  doc.text(title, 14, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.slate);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 26);
  doc.text(`${factures.length} facture(s)`, pageWidth - 14, 26, { align: 'right' });

  const total = factures.reduce((s, f) => s + getInvoiceAmountMad(f), 0);
  const encaisse = factures
    .filter((f) => f.statut === 'Payée')
    .reduce((s, f) => s + getInvoiceAmountMad(f), 0);

  autoTable(doc, {
    startY: 34,
    head: [['N°', 'Date', 'Client', 'Devise', 'Statut', 'Total TTC']],
    body: factures.map((f) => [
      f.numero || '—',
      formatDate(f.date_creation),
      f.client_nom || f.client_id || '—',
      normalizeCurrency(f.currency),
      f.statut || 'En attente',
      formatCurrency(f.total_ttc, f.currency),
    ]),
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2.5, lineColor: COLORS.border },
    headStyles: { fillColor: COLORS.dark, textColor: [255, 255, 255] },
    columnStyles: { 5: { halign: 'right', fontStyle: 'bold' } },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  const fy = doc.lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.dark);
  doc.text(`Total global (équiv. MAD) : ${formatCurrency(total, 'MAD')}`, 14, fy);
  doc.setTextColor(...COLORS.success);
  doc.text(`Encaissé (équiv. MAD) : ${formatCurrency(encaisse, 'MAD')}`, 14, fy + 6);

  if (autoSave) doc.save(filename || `rapport_factures_${Date.now()}.pdf`);
  return doc;
}

const pdfService = { generateInvoicePDF, generateInvoicesReportPDF };
export default pdfService;
