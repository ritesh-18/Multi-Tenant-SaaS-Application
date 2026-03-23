import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { statusBadge } from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { PageLoader } from '../components/common/LoadingSpinner';
import api from '../services/api';

const SLUGIFY = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function Tenants() {
  const [tenants, setTenants]   = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]         = useState({ name: '', slug: '', plan: 'FREE' });
  const [saving, setSaving]     = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/tenants').then(({ data }) => {
      setTenants(data.data || []);
      setTotal(data.meta?.total || 0);
    }).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/tenants', form);
      toast.success('Tenant created successfully');
      setShowCreate(false);
      setForm({ name: '', slug: '', plan: 'FREE' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create tenant');
    } finally { setSaving(false); }
  };

  const handleSuspend = async (id, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (!confirm(`${newStatus === 'SUSPENDED' ? 'Suspend' : 'Activate'} this tenant?`)) return;
    try {
      await api.put(`/tenants/${id}`, { status: newStatus });
      toast.success(`Tenant ${newStatus.toLowerCase()}`);
      load();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{total} tenants</p>
        <button onClick={() => setShowCreate(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + New Tenant
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? <PageLoader /> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Tenant', 'Plan', 'Status', 'Users', 'Created', 'Actions'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{t.slug}</p>
                  </td>
                  <td className="px-6 py-4">{statusBadge(t.plan)}</td>
                  <td className="px-6 py-4">{statusBadge(t.status)}</td>
                  <td className="px-6 py-4 text-gray-500">{t.user_count ?? '—'}</td>
                  <td className="px-6 py-4 text-gray-400 text-xs">{new Date(t.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleSuspend(t.id, t.status)}
                      className={`text-xs font-medium ${t.status === 'ACTIVE' ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'}`}
                    >
                      {t.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">No tenants found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Tenant">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tenant Name</label>
            <input
              required value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value, slug: SLUGIFY(e.target.value) })}
              placeholder="Acme Corp"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              required value={form.slug}
              onChange={(e) => setForm({ ...form, slug: SLUGIFY(e.target.value) })}
              placeholder="acme-corp"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
            <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
              <option>FREE</option><option>PRO</option><option>ENTERPRISE</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60">
              {saving ? 'Creating...' : 'Create Tenant'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
