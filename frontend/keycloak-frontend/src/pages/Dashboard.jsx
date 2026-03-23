import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import StatsCard from '../components/common/StatsCard';
import { PageLoader } from '../components/common/LoadingSpinner';
import { statusBadge } from '../components/common/Badge';
import api from '../services/api';

export default function Dashboard() {
  const [metrics, setMetrics]   = useState(null);
  const [usage, setUsage]       = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/dashboard'),
      api.get('/analytics/api-usage?days=14'),
      api.get('/analytics/user-activity'),
    ]).then(([m, u, a]) => {
      setMetrics(m.data.data);
      setUsage(u.data.data);
      setActivity(a.data.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader text="Loading dashboard..." />;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard title="Total Users"     value={metrics?.users?.total}          icon="👥" color="indigo" sub={`${metrics?.users?.active} active`} />
        <StatsCard title="New This Month"  value={metrics?.users?.new_this_month} icon="✨" color="green" />
        <StatsCard title="API Calls (7d)"  value={metrics?.apiCalls?.this_week}   icon="⚡" color="blue"  sub={`${metrics?.apiCalls?.total} total`} />
        <StatsCard title="Audit Events"    value={metrics?.activity?.auditEventsThisMonth} icon="📋" color="purple" sub="last 30 days" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* API usage chart */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">API Usage (14 days)</h2>
          {usage.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={usage}>
                <defs>
                  <linearGradient id="colorApi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#colorApi)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
          )}
        </div>

        {/* Activity breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Top Actions</h2>
          {activity.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={activity} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="action" tick={{ fontSize: 10 }} width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
