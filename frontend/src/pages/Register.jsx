import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { apiFetch } from '../api';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const capitalizeName = (s) => s.trim().toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ ...form, name: capitalizeName(form.name) }),
      });
      login(data.user, data.token);
      navigate('/customer');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'name', label: 'Ime in priimek', type: 'text', placeholder: 'Jana Novak', required: true },
    { key: 'email', label: 'E-pošta', type: 'email', placeholder: 'jana@email.si', required: true },
    { key: 'phone', label: 'Telefon (neobvezno)', type: 'tel', placeholder: '+386 41 123 456', required: false },
    { key: 'password', label: 'Geslo', type: 'password', placeholder: '••••••••', required: true },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <img src="/icons/logo.svg" alt="GlowLoyalty" className="w-16 h-16" />
          </div>
          <h1 className="text-3xl font-bold text-rose-700 tracking-tight">GlowLoyalty</h1>
          <p className="text-rose-400 mt-1 text-sm">Pridružite se programu zvestobe</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Ustvari račun</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ key, label, type, placeholder, required }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={set(key)}
                  onBlur={key === 'name' ? (e) => setForm(f => ({ ...f, name: capitalizeName(e.target.value) })) : undefined}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent transition-all"
                  placeholder={placeholder}
                  required={required}
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white font-semibold rounded-xl py-3 text-sm transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Ustvarjanje...' : 'Ustvari račun'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Že imate račun?{' '}
            <Link to="/login" className="text-rose-500 hover:text-rose-600 font-semibold">
              Prijavite se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
