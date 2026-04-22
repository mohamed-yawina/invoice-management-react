import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

const formatMoney = (n) =>
  (Number(n) || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Génère un PDF de facture.
 * @param {object} facture - La facture (doit contenir numero, date_creation, articles, totaux, statut...)
 * @param {object} client  - Optionnel : { nom, email, tel, adresse }
 * @param {object} options - Optionnel : { company, logoDataUrl, autoSave, filename }
 * @returns {jsPDF} l'instance jsPDF (déjà sauvegardée si autoSave !== false)
 */
export function generateInvoicePDF(facture, client = null, options = {}) {
  const {
    company = {
      nom: 'FacturePro',
      adresse: 'Casablanca, Maroc',
      tel: '+212 6 00 00 00 00',
      email: 'contact@facturepro.ma',
      ice: '000000000000000',
    },
    autoSave = true,
    filename,
  } = options;

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
  doc.text(`N° ${facture.numero || '—'}`, pageWidth - 14, 25, { align: 'right' });
  doc.text(`Date : ${formatDate(facture.date_creation)}`, pageWidth - 14, 30, { align: 'right' });
  if (facture.date_depot) {
    doc.text(`Dépôt : ${formatDate(facture.date_depot)}`, pageWidth - 14, 35, { align: 'right' });
  }

  // Statut (badge)
  const statut = facture.statut || 'En attente';
  const sc = statusColor(statut);
  const badgeW = 34;
  const badgeH = 7;
  doc.setFillColor(sc[0], sc[1], sc[2]);
  doc.roundedRect(pageWidth - 14 - badgeW, 38, badgeW, badgeH, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(statut.toUpperCase(), pageWidth - 14 - badgeW / 2, 42.7, { align: 'center' });

  // ── Séparateur ──────────────────────────────────────────
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(14, 50, pageWidth - 14, 50);

  // ── Bloc client ─────────────────────────────────────────
  doc.setTextColor(...COLORS.slate);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('FACTURÉ À', 14, 58);

  doc.setTextColor(...COLORS.dark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  const clientName = client?.nom || facture.client_nom || 'Client';
  doc.text(clientName, 14, 64);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.slate);
  let y = 69;
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
    doc.text('PAIEMENT', pageWidth - 14, 58, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.dark);
    let yr = 64;
    if (facture.type_virement) {
      doc.text(`Type : ${facture.type_virement}`, pageWidth - 14, yr, { align: 'right' }); yr += 4.5;
    }
    if (facture.date_encaissement) {
      doc.text(`Encaissé le ${formatDate(facture.date_encaissement)}`, pageWidth - 14, yr, { align: 'right' });
    }
  }

  // ── Tableau des articles ────────────────────────────────
  const articles = Array.isArray(facture.articles) ? facture.articles : [];
  const tableStartY = Math.max(y + 6, 88);

  const rows = articles.map((a) => {
    const qte = Number(a.quantite ?? a.qte ?? 1);
    const pu = Number(a.prix_unitaire ?? a.prix ?? 0);
    const remise = Number(a.remise ?? 0);
    const sous = qte * pu;
    const total = remise ? sous * (1 - remise / 100) : sous;
    return [
      a.designation || a.nom || '—',
      qte.toString(),
      `${formatMoney(pu)} DH`,
      remise ? `${remise}%` : '—',
      `${formatMoney(total)} DH`,
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
  doc.text(`${formatMoney(totalHT)} DH`, totalsX + totalsW, ty, { align: 'right' });
  ty += 6;

  if (remiseGlobale > 0) {
    doc.setTextColor(...COLORS.slate);
    doc.text(`Remise globale`, totalsX, ty);
    doc.setTextColor(...COLORS.danger);
    doc.text(`- ${formatMoney(remiseGlobale)} DH`, totalsX + totalsW, ty, { align: 'right' });
    ty += 6;
  }

  doc.setTextColor(...COLORS.slate);
  doc.text('TVA', totalsX, ty);
  doc.setTextColor(...COLORS.dark);
  doc.text(`${formatMoney(tva)} DH`, totalsX + totalsW, ty, { align: 'right' });
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
  doc.text(`${formatMoney(totalTTC)} DH`, totalsX + totalsW, ty + 1.5, { align: 'right' });

  // ── Signature & pied de page ────────────────────────────
  const sigY = Math.max(ty + 25, pageHeight - 45);
  doc.setTextColor(...COLORS.slate);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Signature & Cachet', 14, sigY);
  doc.setDrawColor(...COLORS.border);
  doc.rect(14, sigY + 2, 60, 20);

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

  const total = factures.reduce((s, f) => s + (Number(f.total_ttc) || 0), 0);
  const encaisse = factures
    .filter((f) => f.statut === 'Payée')
    .reduce((s, f) => s + (Number(f.total_ttc) || 0), 0);

  autoTable(doc, {
    startY: 34,
    head: [['N°', 'Date', 'Client', 'Statut', 'TTC (DH)']],
    body: factures.map((f) => [
      f.numero || '—',
      formatDate(f.date_creation),
      f.client_nom || f.client_id || '—',
      f.statut || 'En attente',
      formatMoney(f.total_ttc),
    ]),
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2.5, lineColor: COLORS.border },
    headStyles: { fillColor: COLORS.dark, textColor: [255, 255, 255] },
    columnStyles: { 4: { halign: 'right', fontStyle: 'bold' } },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  const fy = doc.lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.dark);
  doc.text(`Total global : ${formatMoney(total)} DH`, 14, fy);
  doc.setTextColor(...COLORS.success);
  doc.text(`Encaissé : ${formatMoney(encaisse)} DH`, 14, fy + 6);

  if (autoSave) doc.save(filename || `rapport_factures_${Date.now()}.pdf`);
  return doc;
}

const pdfService = { generateInvoicePDF, generateInvoicesReportPDF };
export default pdfService;
