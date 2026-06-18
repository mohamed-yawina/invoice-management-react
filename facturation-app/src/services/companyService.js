import { db, ref, get, push, set, update, auth } from './firebaseService';

export const ACTIVE_SOCIETE_STORAGE_KEY = 'facturepro_active_societe_id';

export const DEFAULT_COMPANY = {
  nom: 'FacturePro',
  adresse: 'Casablanca, Maroc',
  tel: '+212 6 00 00 00 00',
  email: 'contact@facturepro.ma',
  ice: '000000000000000',
};

export const buildCompanySnapshot = (company) => ({
  nom: company?.nom || DEFAULT_COMPANY.nom,
  adresse: company?.adresse || '',
  tel: company?.tel || '',
  email: company?.email || '',
  ice: company?.ice || '',
});

export const getCompanyDisplayName = (facture, fallback = '—') =>
  facture?.societe_snapshot?.nom || facture?.societe_nom || fallback;

/** Filtre factures par société active (legacy sans societe_id → société par défaut). */
export const matchesCompanyFilter = (item, activeCompanyId, showAll, defaultCompanyId) => {
  if (showAll || !activeCompanyId) return true;
  const sid = item?.societe_id;
  if (!sid) return activeCompanyId === defaultCompanyId;
  return sid === activeCompanyId;
};

export const filterByCompany = (items, activeCompanyId, showAll, defaultCompanyId) =>
  items.filter((item) => matchesCompanyFilter(item, activeCompanyId, showAll, defaultCompanyId));

// ─── CRUD sociétés ───────────────────────────────────────────────────────────

export const getAllCompanies = async () => {
  try {
    const snap = await get(ref(db, 'societes'));
    if (!snap.exists()) return [];
    return Object.entries(snap.val())
      .map(([id, data]) => ({ id, ...data }))
      .filter((c) => c.active !== false)
      .sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr'));
  } catch (e) {
    console.error('getAllCompanies:', e);
    return [];
  }
};

export const getCompanyById = async (id) => {
  if (!id) return null;
  try {
    const snap = await get(ref(db, `societes/${id}`));
    return snap.exists() ? { id, ...snap.val() } : null;
  } catch (e) {
    console.error('getCompanyById:', e);
    return null;
  }
};

/** Crée la société par défaut si la liste est vide. */
export const ensureDefaultCompany = async () => {
  const list = await getAllCompanies();
  if (list.length > 0) return list[0];
  const newRef = push(ref(db, 'societes'));
  const payload = {
    ...DEFAULT_COMPANY,
    active: true,
    isDefault: true,
    createdAt: new Date().toISOString(),
    createdBy: auth.currentUser?.email || 'system',
  };
  await set(newRef, payload);
  return { id: newRef.key, ...payload };
};

export const createCompany = async (data) => {
  const newRef = push(ref(db, 'societes'));
  const payload = {
    nom: data.nom?.trim() || 'Nouvelle société',
    adresse: data.adresse?.trim() || '',
    tel: data.tel?.trim() || '',
    email: data.email?.trim() || '',
    ice: data.ice?.trim() || '',
    active: true,
    isDefault: false,
    createdAt: new Date().toISOString(),
    createdBy: auth.currentUser?.email || 'admin',
  };
  await set(newRef, payload);
  return { id: newRef.key, ...payload };
};

export const updateCompany = async (id, data) => {
  await update(ref(db, `societes/${id}`), {
    nom: data.nom?.trim(),
    adresse: data.adresse?.trim() || '',
    tel: data.tel?.trim() || '',
    email: data.email?.trim() || '',
    ice: data.ice?.trim() || '',
    updatedAt: new Date().toISOString(),
    updatedBy: auth.currentUser?.email || 'admin',
  });
  return true;
};

export const deleteCompany = async (id) => {
  const company = await getCompanyById(id);
  if (company?.isDefault) throw new Error('Impossible de supprimer la société par défaut');
  await update(ref(db, `societes/${id}`), { active: false, deletedAt: new Date().toISOString() });
  return true;
};

// ─── Utilisateurs ↔ sociétés ─────────────────────────────────────────────────

export const getCompaniesForUser = async (userId, role) => {
  await ensureDefaultCompany();
  const all = await getAllCompanies();
  if (role === 'admin') return all;

  try {
    const snap = await get(ref(db, `users/${userId}/societe_ids`));
    const ids = snap.exists() ? snap.val() : null;
    if (Array.isArray(ids) && ids.length > 0) {
      return all.filter((c) => ids.includes(c.id));
    }
    const defaultCo = all.find((c) => c.isDefault) || all[0];
    return defaultCo ? [defaultCo] : all;
  } catch (e) {
    console.error('getCompaniesForUser:', e);
    return all.slice(0, 1);
  }
};

export const updateUserCompanies = async (userId, societeIds = [], defaultSocieteId = null) => {
  const ids = [...new Set((societeIds || []).filter(Boolean))];
  await update(ref(db, `users/${userId}`), {
    societe_ids: ids,
    default_societe_id: defaultSocieteId || ids[0] || null,
    updatedAt: new Date().toISOString(),
    updatedBy: auth.currentUser?.email || 'admin',
  });
  return true;
};

/** Résout les infos société pour PDF / email (async si besoin). */
export const resolveCompanyForInvoice = async (facture, optionsCompany = null) => {
  if (optionsCompany?.nom) return optionsCompany;
  if (facture?.societe_snapshot?.nom) return facture.societe_snapshot;
  if (facture?.societe_id) {
    const c = await getCompanyById(facture.societe_id);
    if (c) return buildCompanySnapshot(c);
  }
  const all = await getAllCompanies();
  const def = all.find((c) => c.isDefault) || all[0];
  return def ? buildCompanySnapshot(def) : { ...DEFAULT_COMPANY };
};
