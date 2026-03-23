import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { statusBadge } from '../components/common/Badge';
import { PageLoader } from '../components/common/LoadingSpinner';
import { useTenant } from '../contexts/TenantContext';
import api from '../services/api';

export default function Subscription() {
  const [sub, setSub]       = useState(null);
  const [plans, setPlans]   = useState({});
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const { loadTenant } = useTenant();

  useEffect(() => {
    Promise.all([api.get('/subscriptions'), api.get('/subscriptions/plans')])
      .then(([s, p]) => { setSub(s.data.data); setPlans(p.data.data); })
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (plan) => {
    if (plan === sub?.plan) return;
    if (!confirm(`Upgrade to ${plan}?`)) return;
    setUpgrading(true);
    try {
      const { data } = await api.post('/subscriptions/upgrade', { plan });
      setSub(data.data);
      await loadTenant();
      toast.success(`Upgraded to ${plan} successfully!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upgrade failed');
    } finally { setUpgrading(false); }
  };

  if (loading) return <PageLoader />;

  const PLAN_ICONS = { FREE: '🆓', PRO: '⚡', ENTERPRISE: '🏢' };
  const PLAN_ORDER = ['FREE', 'PRO', 'ENTERPRISE'];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Current plan */}
      {sub && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Current Plan</p>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">{sub.plan}</h2>
                {statusBadge(sub.status)}
              </div>
              <p className="text-sm text-gray-400 mt-1">Tenant: {sub.tenant_name}</p>
            </div>
            <div className="text-3xl">{PLAN_ICONS[sub.plan]}</div>
          </div>
          {sub.current_period_end && (
            <p className="text-xs text-gray-400 mt-3">
              Renews: {new Date(sub.current_period_end).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLAN_ORDER.map((plan) => {
          const config = plans[plan];
          const isCurrent = sub?.plan === plan;
          const features = config?.features || [];

          return (
            <div key={plan} className={`bg-white rounded-xl border-2 p-6 shadow-sm transition-all ${isCurrent ? 'border-indigo-500' : 'border-gray-100 hover:border-gray-200'}`}>
              {isCurrent && (
                <div className="mb-3">
                  <span className="text-xs font-semibold bg-indigo-600 text-white px-2 py-1 rounded-full">Current</span>
                </div>
              )}
              <div className="text-2xl mb-2">{PLAN_ICONS[plan]}</div>
              <h3 className="text-lg font-bold text-gray-900">{plan}</h3>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {config?.price === 0 ? 'Free' : `$${config?.price}/mo`}
              </p>
              <ul className="mt-4 space-y-2">
                <li className="text-sm text-gray-500">👥 Up to {config?.maxUsers === 999999 ? 'Unlimited' : config?.maxUsers} users</li>
                <li className="text-sm text-gray-500">⚡ {config?.maxApiCalls === 999999 ? 'Unlimited' : config?.maxApiCalls?.toLocaleString()} API calls/mo</li>
                {features.map((f) => (
                  <li key={f} className="text-sm text-gray-500">✅ {f.replace(/_/g, ' ')}</li>
                ))}
              </ul>
              {!isCurrent && (
                <button
                  onClick={() => handleUpgrade(plan)}
                  disabled={upgrading}
                  className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
                >
                  {upgrading ? 'Upgrading...' : `Switch to ${plan}`}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
