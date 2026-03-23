import { useEffect, useState } from 'react';
import { PageLoader } from '../components/common/LoadingSpinner';
import api from '../services/api';

export default function AuditLogs() {
  const [logs, setLogs]     = useState([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ page: 1, limit: 50, action: '', resource: '' });

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams(
      Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
    );
    api.get(`/audit-logs?${params}`)
      .then(({ data }) => { setLogs(data.data || []); setTotal(data.meta?.total || 0); })
      .finally(() => setLoading(false));
  };

  useEffect(load, [filters.page]);

  const RESOURCE_COLORS = {
    tenant: 'bg-blue-100 text-blue-700',
    user: 'bg-green-100 text-green-700',
    feature_flag: 'bg-purple-100 text-purple-700',
    subscription: 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex gap-3 flex-wrap">
        <input
          placeholder="Filter by action..."
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={filters.resource}
          onChange={(e) => setFilters({ ...filters, resource: e.target.value })}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All resources</option>
          {['tenant', 'user', 'feature_flag', 'subscription'].map(r => <option key={r}>{r}</option>)}
        </select>
        <button onClick={load} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">Apply</button>
        <button onClick={() => setFilters({ page: 1, limit: 50, action: '', resource: '' })} className="border border-gray-200 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">Reset</button>
        <span className="ml-auto self-center text-sm text-gray-400">{total} events</span>
      </div>

      {/* Log table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? <PageLoader /> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Time', 'Action', 'Resource', 'User', 'IP'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-3">
                    <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{log.action}</span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${RESOURCE_COLORS[log.resource] || 'bg-gray-100 text-gray-600'}`}>
                      {log.resource}{log.resource_id ? `#${log.resource_id.slice(0, 6)}` : ''}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-xs text-gray-500">
                    {log.email || log.first_name ? `${log.first_name || ''} ${log.last_name || ''}`.trim() || log.email : '—'}
                  </td>
                  <td className="px-6 py-3 text-xs text-gray-400">{log.ip_address || '—'}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No audit events found</td></tr>
              )}
            </tbody>
          </table>
        )}

        {total > filters.limit && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <button disabled={filters.page === 1} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))} className="px-3 py-1 text-sm border rounded-lg disabled:opacity-40">Prev</button>
            <span className="text-sm text-gray-500">Page {filters.page}</span>
            <button disabled={filters.page * filters.limit >= total} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))} className="px-3 py-1 text-sm border rounded-lg disabled:opacity-40">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
