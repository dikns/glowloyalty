import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../App';
import { apiFetch } from '../api';
import {
  HiSparkles,
  HiQrCode,
  HiClipboardDocumentList,
  HiCog6Tooth,
  HiCheck,
  HiStar,
  HiTrophy,
  HiUser,
  HiLockClosed,
  HiCalendarDays,
  HiTrash,
  HiChevronRight,
} from 'react-icons/hi2';
import { FaMedal, FaSpa } from 'react-icons/fa';
import { Calendar } from '../components/ui/calendar-rac';
import { today as getToday, getLocalTimeZone } from '@internationalized/date';

const SERVICES = [
  { name: 'Manikura', price: 18, duration: '45 min' },
  { name: 'Pedikura', price: 25, duration: '60 min' },
  { name: 'Gelski nohti', price: 38, duration: '90 min' },
  { name: 'Barvanje las', price: 55, duration: '120 min' },
  { name: 'Ženski haircut', price: 22, duration: '45 min' },
  { name: 'Čiščenje obraza', price: 42, duration: '60 min' },
  { name: 'Relaksacijska masaža', price: 48, duration: '60 min' },
  { name: 'Oblikovanje obrvi', price: 12, duration: '20 min' },
  { name: 'Laminacija trepalnic', price: 35, duration: '50 min' },
  { name: 'Brazilska keratinska', price: 85, duration: '180 min' },
];

const TIME_SLOTS = [
  '08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00',
];

// ── Booking Tab ────────────────────────────────────────────────────────────────
function BookingTab({ token }) {
  const [step, setStep] = useState(1); // 1=service, 2=datetime, 3=confirm
  const [selectedService, setSelectedService] = useState(null);
  const [date, setDate] = useState(null);
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [aptsLoading, setAptsLoading] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];
  const minDate = getToday(getLocalTimeZone());

  useEffect(() => {
    apiFetch('/customer/appointments', {}, token)
      .then(setAppointments)
      .catch(console.error)
      .finally(() => setAptsLoading(false));
  }, [token]);

  const handleBook = async () => {
    setLoading(true);
    setError('');
    try {
      const apt = await apiFetch('/customer/appointment', {
        method: 'POST',
        body: JSON.stringify({ service: selectedService.name, date: date.toString(), time, notes }),
      }, token);
      setAppointments((prev) => [...prev, apt].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)));
      setSuccess(`Termin za "${selectedService.name}" je uspešno rezerviran!`);
      setStep(1);
      setSelectedService(null);
      setDate(null);
      setTime('');
      setNotes('');
      setTimeout(() => setSuccess(''), 4000);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Res želite preklicati termin?')) return;
    try {
      await apiFetch(`/customer/appointment/${id}`, { method: 'DELETE' }, token);
      setAppointments((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      alert(e.message);
    }
  };

  const upcoming = appointments.filter((a) => a.date >= todayStr);
  const past = appointments.filter((a) => a.date < todayStr);

  return (
    <div className="space-y-4">
      {success && (
        <div className="bg-green-50 border border-green-100 text-green-700 text-sm rounded-2xl p-4 flex items-center gap-2">
          <HiCheck size={18} /> {success}
        </div>
      )}

      {/* Step 1: Select service */}
      {step === 1 && (
        <div className="space-y-3">
          <div className="px-1">
            <h2 className="font-bold text-gray-800 text-lg">Rezervirajte termin</h2>
            <p className="text-xs text-gray-400 mt-0.5">Izberite storitev</p>
          </div>
          {SERVICES.map((svc) => (
            <button key={svc.name} onClick={() => { setSelectedService(svc); setStep(2); }}
              className="w-full bg-white rounded-2xl p-4 shadow-sm text-left flex items-center justify-between hover:border-rose-200 hover:shadow-md transition-all border border-transparent">
              <div>
                <p className="font-semibold text-gray-800">{svc.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{svc.duration}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-rose-600 font-bold">{svc.price} €</span>
                <HiChevronRight className="text-gray-300" size={18} />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Pick date & time */}
      {step === 2 && selectedService && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <HiCalendarDays className="text-rose-500" size={20} />
              <h3 className="font-bold text-gray-800">Izberite datum in uro</h3>
            </div>
            <p className="text-sm text-rose-500 font-medium mb-5">{selectedService.name} · {selectedService.price} €</p>

            {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 mb-4">{error}</div>}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Datum</label>
                <Calendar
                  value={date}
                  onChange={setDate}
                  minValue={minDate}
                  className="rounded-xl border border-gray-200 p-2 mx-auto"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ura</label>
                <div className="grid grid-cols-4 gap-2">
                  {TIME_SLOTS.map((t) => (
                    <button key={t} type="button" onClick={() => setTime(t)}
                      className={`py-2 rounded-xl text-sm font-medium border transition-colors ${
                        time === t
                          ? 'bg-rose-500 text-white border-rose-500'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-rose-300'
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Opombe (neobvezno)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                  placeholder="Posebne želje ali napotki..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none" />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setStep(1); setDate(null); setTime(''); setError(''); }}
              className="flex-1 bg-white border border-gray-200 text-gray-600 font-semibold rounded-xl py-3 text-sm">
              Nazaj
            </button>
            <button
              onClick={handleBook}
              disabled={!date || !time || loading}
              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl py-3 text-sm transition-colors disabled:opacity-50">
              {loading ? 'Rezervacija...' : 'Rezerviraj termin'}
            </button>
          </div>
        </div>
      )}

      {/* Upcoming appointments */}
      {step === 1 && (
        <div className="space-y-3 pt-2">
          <h3 className="font-bold text-gray-700 px-1 text-sm uppercase tracking-wider">Moji termini ({upcoming.length})</h3>
          {aptsLoading ? (
            <div className="text-center text-gray-400 py-6 text-sm">Nalaganje...</div>
          ) : upcoming.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center text-sm text-gray-400 shadow-sm">
              Nimate rezerviranih terminov.
            </div>
          ) : (
            upcoming.map((apt) => (
              <div key={apt.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-800">{apt.service}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(apt.date + 'T00:00:00').toLocaleDateString('sl-SI', { weekday: 'short', day: 'numeric', month: 'long' })} · {apt.time}
                  </p>
                  {apt.notes && <p className="text-xs text-gray-400 mt-1 italic">"{apt.notes}"</p>}
                </div>
                <button onClick={() => handleCancel(apt.id)}
                  className="shrink-0 p-2 text-gray-300 hover:text-red-400 transition-colors rounded-xl">
                  <HiTrash size={18} />
                </button>
              </div>
            ))
          )}

          {past.length > 0 && (
            <>
              <h3 className="font-bold text-gray-400 px-1 text-sm uppercase tracking-wider pt-2">Pretekli termini</h3>
              {past.map((apt) => (
                <div key={apt.id} className="bg-white rounded-2xl p-4 shadow-sm opacity-50">
                  <p className="font-semibold text-gray-800">{apt.service}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(apt.date + 'T00:00:00').toLocaleDateString('sl-SI', { weekday: 'short', day: 'numeric', month: 'long' })} · {apt.time}
                  </p>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

const TIERS = {
  Bronasta: {
    Icon: () => <FaMedal className="text-amber-500" size={20} />,
    next: 'Srebrna', nextAt: 500, prevAt: 0,
    badge: 'bg-amber-100 text-amber-700',
    perk: '5% popust na vse storitve',
  },
  Srebrna: {
    Icon: () => <FaMedal className="text-slate-400" size={20} />,
    next: 'Zlata', nextAt: 1000, prevAt: 500,
    badge: 'bg-slate-100 text-slate-600',
    perk: '10% popust + brezplačna nega las',
  },
  Zlata: {
    Icon: () => <HiTrophy className="text-yellow-500" size={20} />,
    next: null, nextAt: null, prevAt: 1000,
    badge: 'bg-yellow-100 text-yellow-700',
    perk: '20% popust + VIP obravnava',
  },
};

function getProgress(points, tier) {
  const { prevAt, nextAt } = TIERS[tier] || TIERS.Bronasta;
  if (!nextAt) return 100;
  return Math.min(100, ((points - prevAt) / (nextAt - prevAt)) * 100);
}

// ── Profile Settings ──────────────────────────────────────────────────────────
function ProfileSettings({ profile, token, onUpdate }) {
  const [form, setForm] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const updated = await apiFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(form),
      }, token);
      onUpdate(updated);
      setSuccess('Profil je bil uspešno posodobljen!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <HiUser className="text-rose-500" size={20} />
        <h3 className="font-bold text-gray-800">Osebni podatki</h3>
      </div>
      {success && <div className="bg-green-50 text-green-700 text-sm rounded-xl p-3 mb-4">{success}</div>}
      {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Ime in priimek</label>
          <input type="text" value={form.name} onChange={set('name')} required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">E-pošta</label>
          <input type="email" value={form.email} onChange={set('email')} required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefon</label>
          <input type="tel" value={form.phone} onChange={set('phone')}
            placeholder="+386 41 123 456"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl py-3 text-sm transition-colors disabled:opacity-50">
          {loading ? 'Shranjevanje...' : 'Shrani spremembe'}
        </button>
      </form>
    </div>
  );
}

// ── Password Settings ─────────────────────────────────────────────────────────
function PasswordSettings({ token }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) return setError('Novi gesli se ne ujemata');
    if (form.newPassword.length < 6) return setError('Novo geslo mora imeti vsaj 6 znakov');
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await apiFetch('/auth/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      }, token);
      setSuccess('Geslo je bilo uspešno spremenjeno!');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <HiLockClosed className="text-rose-500" size={20} />
        <h3 className="font-bold text-gray-800">Sprememba gesla</h3>
      </div>
      {success && <div className="bg-green-50 text-green-700 text-sm rounded-xl p-3 mb-4">{success}</div>}
      {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Trenutno geslo</label>
          <input type="password" value={form.currentPassword} onChange={set('currentPassword')} required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Novo geslo</label>
          <input type="password" value={form.newPassword} onChange={set('newPassword')} required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Potrdite novo geslo</label>
          <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl py-3 text-sm transition-colors disabled:opacity-50">
          {loading ? 'Shranjevanje...' : 'Spremeni geslo'}
        </button>
      </form>
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────
function Header({ name, onLogout }) {
  return (
    <div className="bg-white shadow-sm px-5 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <img src="/icons/logo.svg" alt="" className="w-8 h-8" />
        <span className="font-bold text-rose-700 text-lg">GlowLoyalty</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 hidden sm:block">{name}</span>
        <button onClick={onLogout} className="text-sm text-rose-400 hover:text-rose-600 font-medium transition-colors">
          Odjava
        </button>
      </div>
    </div>
  );
}

// ── Tab Bar ───────────────────────────────────────────────────────────────────
function TabBar({ active, onChange }) {
  const tabs = [
    { id: 'dashboard', label: 'Domov',       Icon: HiSparkles },
    { id: 'booking',   label: 'Rezervacija', Icon: HiCalendarDays },
    { id: 'qr',        label: 'Moja QR',     Icon: HiQrCode },
    { id: 'history',   label: 'Obiski',      Icon: HiClipboardDocumentList },
    { id: 'settings',  label: 'Nastavitve',  Icon: HiCog6Tooth },
  ];
  return (
    <div className="bg-white border-b border-rose-100 overflow-x-auto">
      <div className="flex min-w-max max-w-md mx-auto px-2">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`px-3 py-3 text-xs font-medium border-b-2 transition-colors flex flex-col items-center gap-0.5 whitespace-nowrap ${
              active === id ? 'border-rose-500 text-rose-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CustomerPortal() {
  const { token, logout, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    Promise.all([
      apiFetch('/customer/profile', {}, token),
      apiFetch('/customer/visits', {}, token),
    ])
      .then(([prof, vis]) => { setProfile(prof); setVisits(vis); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 flex items-center justify-center">
        <div className="text-rose-400 font-medium">Nalaganje...</div>
      </div>
    );
  }

  const tier = profile?.tier || 'Bronasta';
  const tierInfo = TIERS[tier] || TIERS.Bronasta;
  const points = profile?.points || 0;
  const progress = getProgress(points, tier);

  const handleProfileUpdate = (updated) => {
    setProfile((p) => ({ ...p, ...updated }));
    updateUser(updated);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100">
      <Header name={profile?.name} onLogout={logout} />
      <TabBar active={activeTab} onChange={setActiveTab} />

      <div className="max-w-md mx-auto p-4 pb-10 space-y-4">

        {/* ── DASHBOARD TAB ── */}
        {activeTab === 'dashboard' && (
          <>
            <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl p-6 text-white shadow-lg">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-rose-200 text-xs font-medium uppercase tracking-wider mb-1">Vaše točke</p>
                  <p className="text-6xl font-bold leading-none">{points.toLocaleString()}</p>
                </div>
                <span className={`${tierInfo.badge} px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1`}>
                  <tierInfo.Icon /> {tier}
                </span>
              </div>
              {tierInfo.next ? (
                <div>
                  <div className="flex justify-between text-xs text-rose-200 mb-2">
                    <span>Napredek do {tierInfo.next}</span>
                    <span>{Math.max(0, tierInfo.nextAt - points)} točk do naslednje stopnje</span>
                  </div>
                  <div className="bg-white bg-opacity-25 rounded-full h-2.5">
                    <div className="bg-white rounded-full h-2.5 transition-all duration-700" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              ) : (
                <div className="bg-white bg-opacity-20 rounded-2xl px-4 py-2 text-center text-sm">
                  Čestitamo! Dosegli ste najvišjo stopnjo!
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">Stopnje zvestobe</h3>
              <div className="space-y-3">
                {Object.entries(TIERS).map(([name, info]) => {
                  const isActive = Object.keys(TIERS).indexOf(name) <= Object.keys(TIERS).indexOf(tier);
                  const isCurrent = name === tier;
                  return (
                    <div key={name} className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all ${
                      isCurrent ? 'bg-rose-50 border border-rose-100' : isActive ? 'bg-gray-50' : 'opacity-40 bg-gray-50'
                    }`}>
                      <info.Icon />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">{name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{info.perk}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{info.prevAt}–{info.nextAt ?? '∞'} točk</p>
                      </div>
                      {isActive && (
                        <span className="shrink-0">
                          {isCurrent
                            ? <HiStar className="text-rose-400" size={18} />
                            : <HiCheck className="text-green-500" size={18} />}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
                <p className="text-2xl font-bold text-rose-600">{visits.length}</p>
                <p className="text-xs text-gray-500 mt-1">Skupaj obiskov</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
                <p className="text-2xl font-bold text-rose-600">
                  {visits.reduce((s, v) => s + (v.amount || 0), 0).toFixed(0)} €
                </p>
                <p className="text-xs text-gray-500 mt-1">Skupaj porabljeno</p>
              </div>
            </div>
          </>
        )}

        {/* ── QR TAB ── */}
        {activeTab === 'qr' && (
          <div className="bg-white rounded-3xl p-6 shadow-sm text-center">
            <h3 className="font-bold text-gray-800 mb-1">Vaša digitalna kartica</h3>
            <p className="text-sm text-gray-500 mb-6">Pokažite to kodo osebju pri blagajni za zbiranje točk</p>
            <div className="inline-flex p-5 bg-white border-2 border-rose-100 rounded-3xl shadow-md mb-6">
              <QRCodeSVG value={profile?.qr_token || 'none'} size={220} fgColor="#be123c" bgColor="#ffffff" level="H" includeMargin={false} />
            </div>
            <div className="bg-rose-50 rounded-2xl p-4 mb-4">
              <p className="text-xs text-rose-300 mb-1 font-medium">ID stranke</p>
              <p className="text-xs text-rose-400 font-mono break-all">{profile?.qr_token}</p>
            </div>
            <div className={`inline-flex items-center gap-2 ${tierInfo.badge} px-4 py-2 rounded-full text-sm font-semibold`}>
              <tierInfo.Icon /> {tier} &nbsp;·&nbsp; {points} točk
            </div>
            <p className="text-xs text-gray-400 mt-4">Koda je edinstvena in varna. Nikoli je ne delite z drugimi.</p>
          </div>
        )}

        {/* ── BOOKING TAB ── */}
        {activeTab === 'booking' && <BookingTab token={token} />}

        {/* ── HISTORY TAB ── */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <h3 className="font-bold text-gray-700 px-1 text-sm uppercase tracking-wider">
              Zgodovina obiskov ({visits.length})
            </h3>
            {visits.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
                <div className="flex justify-center mb-4"><FaSpa className="text-rose-300" size={48} /></div>
                <p className="font-semibold text-gray-700">Še ni zabeleženih obiskov</p>
                <p className="text-sm text-gray-400 mt-2">Ob naslednjem obisku bo osebje zabeležilo vašo storitev in dodalo točke</p>
              </div>
            ) : (
              visits.map((visit) => (
                <div key={visit.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800">{visit.service}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(visit.created_at).toLocaleDateString('sl-SI', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      {visit.notes && <p className="text-xs text-gray-400 mt-1.5 italic">"{visit.notes}"</p>}
                      {visit.staff_name && <p className="text-xs text-gray-300 mt-1">Osebje: {visit.staff_name}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="bg-rose-100 text-rose-700 text-sm font-bold px-3 py-1 rounded-full">+{visit.points_awarded} pt</span>
                      {visit.amount > 0 && <p className="text-xs text-gray-400 mt-1.5">{visit.amount.toFixed(2)} €</p>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="px-1">
              <h2 className="font-bold text-gray-800 text-lg">Nastavitve profila</h2>
              <p className="text-xs text-gray-400 mt-0.5">Upravljajte svoje podatke in varnost računa</p>
            </div>
            {profile && (
              <ProfileSettings profile={profile} token={token} onUpdate={handleProfileUpdate} />
            )}
            <PasswordSettings token={token} />
          </div>
        )}
      </div>
    </div>
  );
}
