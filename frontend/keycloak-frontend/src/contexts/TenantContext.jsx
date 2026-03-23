import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const TenantContext = createContext(null);

export function TenantProvider({ children }) {
  const [tenant, setTenant]   = useState(null);
  const [loading, setLoading] = useState(true);

  const loadTenant = useCallback(async () => {
    const slug = localStorage.getItem('tenant_slug');
    if (!slug) { setLoading(false); return; }
    try {
      const { data } = await api.get('/tenants/current');
      setTenant(data.data);
    } catch {
      // ignore — might not be logged in yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTenant(); }, [loadTenant]);

  const setTenantSlug = (slug) => {
    localStorage.setItem('tenant_slug', slug);
    loadTenant();
  };

  const isFeatureEnabled = (key) =>
    tenant?.featureFlags?.find((f) => f.key === key)?.enabled || false;

  return (
    <TenantContext.Provider value={{ tenant, loading, setTenantSlug, loadTenant, isFeatureEnabled }}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used within TenantProvider');
  return ctx;
};
