import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AuthSuccess() {
  const navigate = useNavigate();
  const { setTokens, loadUser } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken  = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    const tenantSlug   = params.get('tenant') || 'demo';

    if (accessToken) {
      setTokens(accessToken, refreshToken);
      localStorage.setItem('tenant_slug', tenantSlug);
      loadUser().then(() => navigate('/dashboard'));
    } else {
      navigate('/login');
    }
  }, [navigate, setTokens, loadUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" style={{ borderWidth: 3 }} />
        <p className="text-gray-600">Signing you in...</p>
      </div>
    </div>
  );
}
