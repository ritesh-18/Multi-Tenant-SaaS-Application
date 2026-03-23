import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StatsCard from '../components/common/StatsCard';
import { PageLoader } from '../components/common/LoadingSpinner';
import api from '../services/api';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export default function Analytics() {
  const [metrics, setMetrics]     = useState(null);
  const [usage, setUsage]         = useState([]);
  const [endpoints, setEndpoints] = useState([]);
  const [activity, setActivity]   = useState([]);
  const [days, setDays]           = useState(30);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/analytics/dashboard'),
      api.get(`/analytics/api-usage?days=${days}`),
      api.get('/analytics/top-endpoints'),
      api.get('/analytics/user-activity'),
    ]).then(([m, u, e, a]) => {
      setMetrics(m.data.data);
      setUsage(u.data.data);
      setEndpoints(e.data.data);
      setActivity(a.data.data);
    }).finally(() => setLoading(false));
  }, [days]);

  if (loading) return <PageLoader text="Loading analytics..." />;

  return (
    <div className="space-y-6">
      {/* Day filter */}
      <div className="flex justify-end gap-2">
        {[7, 14, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              days === d ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard title="Total Users"    value={metrics?.users?.total}           icon="👥" color="indigo" />
        <StatsCard title="Active Users"   value={metrics?.users?.active}          icon="✅" color="green" />
        <StatsCard title="API Calls"      value={metrics?.apiCalls?.total}        icon="⚡" color="blue" />
        <StatsCard title="Audit Events"   value={metrics?.activity?.auditEventsThisMonth} icon="📋" color="purple" />
      </div>

      {/* API usage over time */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-4">API Calls Over Time</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={usage}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top endpoints */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Top Endpoints</h2>
          {endpoints.length > 0 ? (
            <div className="space-y-3">
              {endpoints.slice(0, 8).map((ep, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${ep.method === 'GET' ? 'bg-green-100 text-green-700' : ep.method === 'POST' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                    {ep.method}
                  </span>
                  <span className="text-sm text-gray-600 font-mono flex-1 truncate">{ep.endpoint}</span>
                  <span className="text-sm font-semibold text-gray-800">{ep.count}</span>
                  <span className="text-xs text-gray-400">{ep.avg_response_ms}ms</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400">No data yet</p>}
        </div>

        {/* User activity */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Activity Breakdown</h2>
          {activity.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={activity} dataKey="count" nameKey="action" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {activity.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-gray-400">No data yet</p>}
        </div>
      </div>
    </div>
  );
}
