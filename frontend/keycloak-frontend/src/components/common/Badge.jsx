const VARIANTS = {
  green:  'bg-green-100 text-green-700',
  red:    'bg-red-100 text-red-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  blue:   'bg-blue-100 text-blue-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  gray:   'bg-gray-100 text-gray-600',
  purple: 'bg-purple-100 text-purple-700',
};

export default function Badge({ children, variant = 'gray' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${VARIANTS[variant] || VARIANTS.gray}`}>
      {children}
    </span>
  );
}

export function statusBadge(status) {
  const map = {
    ACTIVE: 'green', INACTIVE: 'gray', SUSPENDED: 'red',
    FREE: 'gray', PRO: 'blue', ENTERPRISE: 'purple',
    ADMIN: 'indigo', MANAGER: 'blue', USER: 'gray', SUPER_ADMIN: 'purple',
  };
  return <Badge variant={map[status] || 'gray'}>{status}</Badge>;
}
