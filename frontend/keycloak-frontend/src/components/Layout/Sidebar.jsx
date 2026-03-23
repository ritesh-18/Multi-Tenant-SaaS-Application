import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';

const navItems = [
  { to: '/dashboard',      label: 'Dashboard',     icon: '📊', roles: ['USER','MANAGER','ADMIN','SUPER_ADMIN'] },
  { to: '/users',          label: 'Users',         icon: '👥', roles: ['MANAGER','ADMIN','SUPER_ADMIN'] },
  { to: '/analytics',      label: 'Analytics',     icon: '📈', roles: ['USER','MANAGER','ADMIN','SUPER_ADMIN'] },
  { to: '/feature-flags',  label: 'Feature Flags', icon: '🚩', roles: ['ADMIN','SUPER_ADMIN'] },
  { to: '/audit-logs',     label: 'Audit Logs',    icon: '📋', roles: ['MANAGER','ADMIN','SUPER_ADMIN'] },
  { to: '/subscription',   label: 'Subscription',  icon: '💳', roles: ['ADMIN','SUPER_ADMIN'] },
  { to: '/tenants',        label: 'All Tenants',   icon: '🏢', roles: ['SUPER_ADMIN'] },
  { to: '/settings',       label: 'Settings',      icon: '⚙️', roles: ['USER','MANAGER','ADMIN','SUPER_ADMIN'] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { tenant } = useTenant();

  const role = user?.role || 'USER';
  const visible = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-lg">
            {tenant?.name?.[0] || 'S'}
          </div>
          <div>
            <p className="font-semibold text-sm leading-none">{tenant?.name || 'SaaS App'}</p>
            <span className="text-xs text-indigo-400 uppercase tracking-wider">{tenant?.plan || 'FREE'}</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 overflow-y-auto space-y-1">
        {visible.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-sm font-bold">
            {user?.first_name?.[0] || user?.email?.[0] || '?'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.email}
            </p>
            <p className="text-xs text-gray-400">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
