import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const PAGE_TITLES = {
  '/dashboard':     'Dashboard',
  '/users':         'User Management',
  '/analytics':     'Analytics',
  '/feature-flags': 'Feature Flags',
  '/audit-logs':    'Audit Logs',
  '/subscription':  'Subscription',
  '/tenants':       'All Tenants',
  '/settings':      'Settings',
};

export default function DashboardLayout() {
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] || 'Dashboard';

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
