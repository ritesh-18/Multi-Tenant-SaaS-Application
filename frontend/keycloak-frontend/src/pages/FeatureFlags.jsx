import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PageLoader } from '../components/common/LoadingSpinner';
import api from '../services/api';

export default function FeatureFlags() {
  const [flags, setFlags]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState({});

  useEffect(() => {
    api.get('/feature-flags')
      .then(({ data }) => setFlags(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (key, current) => {
    setSaving((s) => ({ ...s, [key]: true }));
    try {
      const { data } = await api.put(`/feature-flags/${key}`, { enabled: !current });
      setFlags((prev) => prev.map((f) => f.key === key ? { ...f, enabled: data.data.enabled } : f));
      toast.success(`${key} ${!current ? 'enabled' : 'disabled'}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update flag');
    } finally {
      setSaving((s) => ({ ...s, [key]: false }));
    }
  };

  if (loading) return <PageLoader />;

  const categories = {
    Core: flags.filter((f) => ['analytics', 'audit_logs', 'api_access', 'email_notifications'].includes(f.key)),
    Premium: flags.filter((f) => ['advanced_reports', 'ai_assistant'].includes(f.key)),
    Enterprise: flags.filter((f) => ['custom_roles', 'sso'].includes(f.key)),
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">Control which features are active for your workspace</p>

      {Object.entries(categories).map(([category, items]) => (
        <div key={category} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">{category} Features</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {items.map((flag) => (
              <div key={flag.key} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-800 capitalize">{flag.key.replace(/_/g, ' ')}</p>
                    {flag.enabled && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Active</span>}
                  </div>
                  <p className="text-sm text-gray-400 mt-0.5">{flag.description}</p>
                </div>
                <button
                  onClick={() => toggle(flag.key, flag.enabled)}
                  disabled={saving[flag.key]}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    flag.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                  } ${saving[flag.key] ? 'opacity-50' : ''}`}
                  aria-label={`Toggle ${flag.key}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      flag.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
            {items.length === 0 && (
              <p className="px-6 py-4 text-sm text-gray-400">No flags in this category</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
