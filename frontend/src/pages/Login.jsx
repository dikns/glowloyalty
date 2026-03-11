import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { apiFetch } from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      login(data.user, data.token);
      navigate(data.user.role === 'staff' ? '/staff' : '/customer');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <img src="/icons/logo.svg" alt="GlowLoyalty" className="w-16 h-16" />
          </div>
          <h1 className="text-3xl font-bold text-rose-700 tracking-tight">GlowLoyalty</h1>
          <p className="text-rose-400 mt-1 text-sm">Vaš digitalni program zvestobe</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Prijavite se</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">E-pošta</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent transition-all"
                placeholder="jana@email.si"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Geslo</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white font-semibold rounded-xl py-3 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Prijavljanje...' : 'Prijava'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Nimate računa?{' '}
            <Link to="/register" className="text-rose-500 hover:text-rose-600 font-semibold">
              Registrirajte se
            </Link>
          </p>
        </div>

        <div className="mt-4 bg-rose-50 border border-rose-100 rounded-2xl p-4 text-center">
          <p className="text-xs text-rose-400 font-medium mb-1">Demo osebje</p>
          <p className="text-xs text-rose-500 font-mono">osebje@salon.si &nbsp;/&nbsp; osebje123</p>
        </div>
      </div>
    </div>
  );
}
