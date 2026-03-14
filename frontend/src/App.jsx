import { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerPortal from './pages/CustomerPortal';
import StaffPortal from './pages/StaffPortal';

function UpdateBanner() {
  const [reg, setReg] = useState(null);

  useEffect(() => {
    const handler = (e) => setReg(e.detail);
    window.addEventListener('swUpdateAvailable', handler);
    return () => window.removeEventListener('swUpdateAvailable', handler);
  }, []);

  if (!reg) return null;

  const handleUpdate = () => {
    if (reg.waiting) reg.waiting.postMessage('SKIP_WAITING');
  };

  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-rose-600 text-white px-4 py-2.5 flex items-center justify-between gap-3 shadow-lg text-sm">
      <span>Na voljo je posodobitev aplikacije.</span>
      <button
        onClick={handleUpdate}
        className="shrink-0 bg-white text-rose-600 font-semibold rounded-lg px-3 py-1 text-xs hover:bg-rose-50 transition-colors"
      >
        Posodobi
      </button>
    </div>
  );
}

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('glow_token');
    const savedUser = localStorage.getItem('glow_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('glow_token', authToken);
    localStorage.setItem('glow_user', JSON.stringify(userData));
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('glow_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('glow_token');
    localStorage.removeItem('glow_user');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 flex items-center justify-center">
        <div className="text-rose-400 text-lg font-medium">Nalaganje...</div>
      </div>
    );
  }

  const home = user ? (user.role === 'staff' ? '/staff' : '/customer') : '/login';

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser }}>
      <UpdateBanner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={user ? <Navigate to={home} /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/customer" /> : <Register />} />
          <Route
            path="/customer"
            element={user?.role === 'customer' ? <CustomerPortal /> : <Navigate to="/login" />}
          />
          <Route
            path="/staff"
            element={user?.role === 'staff' ? <StaffPortal /> : <Navigate to="/login" />}
          />
          <Route path="*" element={<Navigate to={home} />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
