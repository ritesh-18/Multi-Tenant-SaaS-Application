import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { statusBadge } from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { PageLoader } from '../components/common/LoadingSpinner';
import api from '../services/api';

export default function Users() {
  const [users, setUsers]         = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm]           = useState({ email: '', role: 'USER' });
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage]           = useState(1);
  const limit = 20;

  const load = () => {
    setLoading(true);
    api.get(`/users?page=${page}&limit=${limit}`)
      .then(({ data }) => { setUsers(data.data); setTotal(data.meta?.total || 0); })
      .finally(() => setLoading(false));
  };

  useEffect(load, [page]);

  const handleInvite = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/users/invite', form);
      toast.success(`Invitation sent to ${form.email}`);
      setShowInvite(false);
      setForm({ email: '', role: 'USER' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send invite');
    } finally { setSubmitting(false); }
  };

  const handleUpdateRole = async (userId, role) => {
    try {
      await api.put(`/users/${userId}`, { role });
      toast.success('Role updated');
      load();
    } catch { toast.error('Failed to update role'); }
  };

  const handleDeactivate = async (userId) => {
    if (!confirm('Deactivate this user?')) return;
    try {
      await api.delete(`/users/${userId}`);
      toast.success('User deactivated');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Manage members of your workspace</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Invite User
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? <PageLoader /> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['User', 'Role', 'Status', 'Last Login', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-sm font-bold">
                        {(u.first_name || u.email)?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{u.first_name ? `${u.first_name} ${u.last_name || ''}` : u.email}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500"
                    >
                      {['USER', 'MANAGER', 'ADMIN'].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-6 py-4">{statusBadge(u.status)}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDeactivate(u.id)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      Deactivate
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">No users found</td></tr>
              )}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">{total} total</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-sm border rounded-lg disabled:opacity-40">Prev</button>
              <button disabled={page * limit >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-sm border rounded-lg disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <Modal open={showInvite} onClose={() => setShowInvite(false)} title="Invite User">
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
            <input
              type="email" required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="colleague@company.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="USER">User</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowInvite(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60">
              {submitting ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
