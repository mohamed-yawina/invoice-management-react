import * as XLSX from 'xlsx';
import { normalizeCurrency, getInvoiceAmountMad } from '../utils/currency';

const fmtDate = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  return isNaN(dt) ? String(d) : dt.toLocaleDateString('fr-FR');
};

const invoiceToRow = (f) => ({
  'N° Facture': f.numero || '',
  'Date création': fmtDate(f.date_creation),
  'Client': f.client_nom || f.client_snapshot?.nom || f.client_id || '',
  'Société': f.societe_snapshot?.nom || '',
  'Email': f.client_email || f.client_snapshot?.email || '',
  'Devise': normalizeCurrency(f.currency),
  'Total HT': Number(f.total_ht) || 0,
  'TVA': Number(f.tva) || 0,
  'Total TTC': Number(f.total_ttc) || 0,
  'Total TTC (MAD)': getInvoiceAmountMad(f),
  'Taux → MAD': f.exchange_rate_to_mad ?? '',
  'Statut': f.statut || 'En attente',
  'Date dépôt': fmtDate(f.date_depot),
  'Date encaissement': fmtDate(f.date_encaissement),
  'Type virement': f.type_virement || '',
  'Archivée': f.archived ? 'Oui' : 'Non',
  'Année archive': f.archive_year || '',
});

/** Exporte une liste de factures en fichier .xlsx */
export function exportInvoicesToExcel(factures = [], filename = 'factures.xlsx', sheetName = 'Factures') {
  if (!factures.length) return false;
  const rows = factures.map(invoiceToRow);
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 14 }, { wch: 12 }, { wch: 22 }, { wch: 24 }, { wch: 8 },
    { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 10 },
    { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 8 }, { wch: 10 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
  return true;
}

/** Exporte les clients en .xlsx */
export function exportClientsToExcel(clients = [], filename = 'clients.xlsx') {
  if (!clients.length) return false;
  const rows = clients.map((c) => ({
    'Nom': c.nom || '',
    'Email': c.email || '',
    'Téléphone': c.tel || '',
    'Adresse': c.adresse || '',
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Clients');
  XLSX.writeFile(wb, filename);
  return true;
}
