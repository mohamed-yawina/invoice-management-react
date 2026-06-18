import { auth, getAllFacturesFlat, updateFactureByPath } from './firebaseService';
import { getInvoiceAmountMad } from '../utils/currency';

export const getInvoiceYear = (facture) => {
  if (!facture?.date_creation) return null;
  const y = new Date(facture.date_creation).getFullYear();
  return Number.isNaN(y) ? null : y;
};

/** Regroupe les factures par année avec statistiques. */
export function groupFacturesByYear(factures = []) {
  const map = {};
  factures.forEach((f) => {
    const year = getInvoiceYear(f);
    if (!year) return;
    if (!map[year]) {
      map[year] = { year, total: 0, archived: 0, active: 0, montantTTC: 0, montantPaye: 0 };
    }
    map[year].total += 1;
    map[year].montantTTC += getInvoiceAmountMad(f);
    if (f.statut === 'Payée') map[year].montantPaye += getInvoiceAmountMad(f);
    if (f.archived) map[year].archived += 1;
    else map[year].active += 1;
  });
  return Object.values(map).sort((a, b) => b.year - a.year);
}

export const getFacturesByYear = (factures, year, { archivedOnly = false, activeOnly = false } = {}) =>
  factures.filter((f) => {
    if (getInvoiceYear(f) !== Number(year)) return false;
    if (archivedOnly && !f.archived) return false;
    if (activeOnly && f.archived) return false;
    return true;
  });

/** Archive toutes les factures non archivées d'une année donnée. */
export async function archiveInvoicesByYear(year) {
  const all = await getAllFacturesFlat();
  const targets = all.filter((f) => getInvoiceYear(f) === Number(year) && !f.archived);
  const email = auth.currentUser?.email || 'admin';
  const now = new Date().toISOString();

  await Promise.all(
    targets.map((f) =>
      updateFactureByPath(f, {
        archived: true,
        archive_year: Number(year),
        archived_at: now,
        archived_by: email,
      })
    )
  );
  return targets.length;
}

/** Réactive les factures archivées d'une année (désarchivage). */
export async function unarchiveInvoicesByYear(year) {
  const all = await getAllFacturesFlat();
  const targets = all.filter((f) => getInvoiceYear(f) === Number(year) && f.archived);

  await Promise.all(
    targets.map((f) =>
      updateFactureByPath(f, {
        archived: false,
        archive_year: null,
        archived_at: null,
        archived_by: null,
        unarchived_at: new Date().toISOString(),
      })
    )
  );
  return targets.length;
}
