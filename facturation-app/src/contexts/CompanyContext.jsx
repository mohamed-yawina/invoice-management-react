import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import { useAuth } from './AuthContext';
import {
  getCompaniesForUser,
  ensureDefaultCompany,
  ACTIVE_SOCIETE_STORAGE_KEY,
  filterByCompany,
  matchesCompanyFilter,
} from '../services/companyService';

const CompanyContext = createContext(null);

export function CompanyProvider({ children }) {
  const { user, role, isAuthenticated, loading: authLoading } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [activeCompanyId, setActiveCompanyIdState] = useState('');
  const [showAllCompanies, setShowAllCompanies] = useState(false);
  const [loading, setLoading] = useState(true);
  const [defaultCompanyId, setDefaultCompanyId] = useState('');

  const refreshCompanies = useCallback(async () => {
    if (!user?.uid) {
      setCompanies([]);
      setActiveCompanyIdState('');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      await ensureDefaultCompany();
      const list = await getCompaniesForUser(user.uid, role);
      setCompanies(list);
      const def = list.find((c) => c.isDefault)?.id || list[0]?.id || '';
      setDefaultCompanyId(def);

      const stored = localStorage.getItem(ACTIVE_SOCIETE_STORAGE_KEY);
      const validStored = stored && list.some((c) => c.id === stored);
      const nextId = validStored ? stored : def;
      setActiveCompanyIdState(nextId || '');
      if (nextId) localStorage.setItem(ACTIVE_SOCIETE_STORAGE_KEY, nextId);
    } catch (e) {
      console.error('CompanyContext refresh:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, role]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setCompanies([]);
      setActiveCompanyIdState('');
      setLoading(false);
      return;
    }
    refreshCompanies();
  }, [authLoading, isAuthenticated, refreshCompanies]);

  const setActiveCompanyId = useCallback((id) => {
    setActiveCompanyIdState(id);
    if (id) localStorage.setItem(ACTIVE_SOCIETE_STORAGE_KEY, id);
    setShowAllCompanies(false);
  }, []);

  const activeCompany = useMemo(
    () => companies.find((c) => c.id === activeCompanyId) || companies[0] || null,
    [companies, activeCompanyId]
  );

  const filterItems = useCallback(
    (items) => filterByCompany(items, activeCompanyId, showAllCompanies, defaultCompanyId),
    [activeCompanyId, showAllCompanies, defaultCompanyId]
  );

  const matchesFilter = useCallback(
    (item) => matchesCompanyFilter(item, activeCompanyId, showAllCompanies, defaultCompanyId),
    [activeCompanyId, showAllCompanies, defaultCompanyId]
  );

  const value = {
    companies,
    activeCompany,
    activeCompanyId,
    defaultCompanyId,
    setActiveCompanyId,
    showAllCompanies,
    setShowAllCompanies,
    loading,
    refreshCompanies,
    filterItems,
    matchesFilter,
    isAdmin: role === 'admin',
  };

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error('useCompany doit être utilisé dans un <CompanyProvider>');
  return ctx;
}

export default CompanyContext;
