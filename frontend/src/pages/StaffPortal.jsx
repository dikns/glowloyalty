import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '../App';
import { apiFetch } from '../api';
import {
  HiCamera,
  HiUserGroup,
  HiChartBar,
  HiMagnifyingGlass,
  HiCalendarDays,
  HiStar,
  HiHome,
} from 'react-icons/hi2';
import { FaUserCircle } from 'react-icons/fa';

const TIER_BADGE = {
  Bronasta: 'bg-amber-100 text-amber-700',
  Srebrna:  'bg-slate-100 text-slate-600',
  Zlata:    'bg-yellow-100 text-yellow-700',
};

const SERVICES = [
  'Striženje las', 'Barvanje las', 'Trajni kodranje', 'Highlights',
  'Manikura', 'Pedikura', 'Gel nohti', 'Masaža', 'Čiščenje obraza',
  'Ličenje', 'Depilacija', 'Barvanje trepalnic', 'Laminacija obrvi', 'Drugo',
];

// ── QR Scanner ────────────────────────────────────────────────────────────────
function QRScanner({ onScan }) {
  const [status, setStatus] = useState('starting');
  const [errorMsg, setErrorMsg] = useState('');
  const onScanRef = useRef(onScan);
  useEffect(() => { onScanRef.current = onScan; });

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader');
    let shouldStop = false;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (text) => {
          if (!shouldStop) {
            shouldStop = true;
            scanner.stop().catch(() => {});
            onScanRef.current(text);
          }
        },
        () => {}
      )
      .then(() => {
        if (!shouldStop) setStatus('active');
        else try { scanner.stop().catch(() => {}); } catch {}
      })
      .catch(() => {
        if (!shouldStop) {
          setStatus('error');
          setErrorMsg('Kamera ni dostopna. Preverite dovoljenja brskalnika.');
        }
      });

    return () => {
      shouldStop = true;
      try { scanner.stop().catch(() => {}); } catch {}
    };
  }, []);

  if (status === 'error') {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-6 text-center text-sm">
        <div className="flex justify-center mb-2">
          <HiCamera size={36} className="text-red-400" />
        </div>
        {errorMsg}
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden bg-black" style={{ minHeight: 300 }}>
      <div id="qr-reader" className="w-full" />
      {status === 'starting' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
          <div className="text-white text-sm">Zaganjanje kamere...</div>
        </div>
      )}
    </div>
  );
}

// ── Log Visit Form ─────────────────────────────────────────────────────────────
function LogVisitForm({ customer, token, onSuccess, onCancel }) {
  const [service, setService] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!service) return setError('Izberite storitev');
    setLoading(true);
    setError('');
    try {
      const result = await apiFetch('/staff/visit', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: customer.id,
          service,
          amount: parseFloat(amount) || 0,
          notes,
        }),
      }, token);
      onSuccess(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const pointsPreview = Math.round(parseFloat(amount) || 0);

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm">
      {/* Customer header */}
      <div className="flex items-center gap-3 mb-5 pb-5 border-b border-rose-50">
        <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-sm">
          {customer.name[0].toUpperCase()}
        </div>
        <div>
          <p className="font-bold text-gray-800">{customer.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIER_BADGE[customer.tier] || 'bg-gray-100 text-gray-600'}`}>
              {customer.tier}
            </span>
            <span className="text-xs text-gray-500">{customer.points} točk</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Storitev</label>
          <select
            value={service}
            onChange={(e) => setService(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white"
          >
            <option value="">Izberite storitev...</option>
            {SERVICES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Znesek (€)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            placeholder="0.00"
          />
          {amount && (
            <p className="text-xs text-rose-500 mt-1.5 font-medium">
              Stranki bo dodanih +{pointsPreview} točk
              {pointsPreview + customer.points >= 1000 && customer.tier !== 'Zlata' && (
                <span className="ml-1 text-yellow-600">— napreduje v višjo stopnjo!</span>
              )}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Opombe (neobvezno)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
            rows={2}
            placeholder="Preference stranke, barva, dolžina..."
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-3 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Prekliči
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            {loading ? 'Shranjevanje...' : 'Dodaj točke'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Customer Visits Modal ──────────────────────────────────────────────────────
function CustomerVisitsModal({ customer, token, onClose, onLogVisit }) {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/staff/customer/${customer.id}/visits`, {}, token)
      .then(setVisits)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [customer.id, token]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center font-bold text-white">
              {customer.name[0]}
            </div>
            <div>
              <p className="font-bold text-gray-800 text-sm">{customer.name}</p>
              <p className="text-xs text-gray-500">{customer.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        {/* Stats row */}
        <div className="flex border-b border-gray-100">
          {[
            { label: 'Točke', value: customer.points },
            { label: 'Stopnja', value: customer.tier },
            { label: 'Obiski', value: visits.length },
          ].map(({ label, value }) => (
            <div key={label} className="flex-1 py-3 text-center border-r last:border-0 border-gray-100">
              <p className="font-bold text-rose-600 text-sm">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Visits */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading && <p className="text-center text-gray-400 py-4">Nalaganje...</p>}
          {!loading && visits.length === 0 && (
            <p className="text-center text-gray-400 py-6 text-sm">Ni zabeleženih obiskov</p>
          )}
          {visits.map((v) => (
            <div key={v.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{v.service}</p>
                <p className="text-xs text-gray-400">{new Date(v.created_at).toLocaleDateString('sl-SI')}</p>
                {v.notes && <p className="text-xs text-gray-400 italic mt-0.5">"{v.notes}"</p>}
              </div>
              <div className="text-right shrink-0">
                <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-1 rounded-full">
                  +{v.points_awarded} pt
                </span>
                {v.amount > 0 && <p className="text-xs text-gray-400 mt-1">{v.amount.toFixed(2)} €</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Action */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => onLogVisit(customer)}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
          >
            + Zabeleži nov obisk
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Staff Portal ─────────────────────────────────────────────────────────
export default function StaffPortal() {
  const { token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('scanner');

  // Scanner state
  const [scannerKey, setScannerKey] = useState(0);
  const [scannedCustomer, setScannedCustomer] = useState(null);
  const [scanSuccess, setScanSuccess] = useState('');
  const [scanError, setScanError] = useState('');

  // Customers state
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [logForCustomer, setLogForCustomer] = useState(null);

  // Analytics state
  const [analytics, setAnalytics] = useState(null);

  // ── Handlers ──
  const handleScan = useCallback(async (qrToken) => {
    setScanError('');
    try {
      const customer = await apiFetch(`/staff/scan/${qrToken}`, {}, token);
      setScannedCustomer(customer);
    } catch (e) {
      setScanError(e.message || 'QR koda ni veljavna');
      setTimeout(() => {
        setScanError('');
        setScannerKey((k) => k + 1);
      }, 2500);
    }
  }, [token]);

  const handleVisitSuccess = (result) => {
    const msg = `Dodano ${result.points_awarded} točk za ${result.customer.name}!`;
    setScanSuccess(msg);
    setScannedCustomer(null);
    setLogForCustomer(null);
    setSelectedCustomer(null);
    setTimeout(() => {
      setScanSuccess('');
      setScannerKey((k) => k + 1);
    }, 3000);
  };

  const cancelScan = () => {
    setScannedCustomer(null);
    setScannerKey((k) => k + 1);
  };

  const loadCustomers = useCallback(async () => {
    setLoadingCustomers(true);
    try {
      const q = search ? `?search=${encodeURIComponent(search)}` : '';
      const data = await apiFetch(`/staff/customers${q}`, {}, token);
      setCustomers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCustomers(false);
    }
  }, [token, search]);

  useEffect(() => {
    if (activeTab === 'customers') loadCustomers();
    if (activeTab === 'analytics') {
      apiFetch('/staff/analytics', {}, token).then(setAnalytics).catch(console.error);
    }
  }, [activeTab, loadCustomers, token]);

  // Debounced search
  useEffect(() => {
    if (activeTab !== 'customers') return;
    const t = setTimeout(loadCustomers, 300);
    return () => clearTimeout(t);
  }, [search, activeTab, loadCustomers]);

  const tabs = [
    { id: 'scanner',   label: 'Skeniraj',  Icon: HiCamera },
    { id: 'customers', label: 'Stranke',   Icon: HiUserGroup },
    { id: 'analytics', label: 'Analitika', Icon: HiChartBar },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modals */}
      {selectedCustomer && !logForCustomer && (
        <CustomerVisitsModal
          customer={selectedCustomer}
          token={token}
          onClose={() => setSelectedCustomer(null)}
          onLogVisit={(c) => { setLogForCustomer(c); setSelectedCustomer(null); }}
        />
      )}

      {/* Header */}
      <div className="bg-white shadow-sm px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/icons/logo.svg" alt="" className="w-8 h-8" />
          <span className="font-bold text-rose-700 text-lg">GlowLoyalty</span>
          <span className="text-xs bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-medium">Osebje</span>
        </div>
        <button onClick={logout} className="text-sm text-rose-400 hover:text-rose-600 font-medium transition-colors">
          Odjava
        </button>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-100 px-4">
        <div className="flex max-w-2xl mx-auto">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === id ? 'border-rose-500 text-rose-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 pb-10 space-y-4">

        {/* ── SCANNER TAB ── */}
        {activeTab === 'scanner' && (
          <>
            {scanSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-2xl p-4 text-center font-semibold">
                {scanSuccess}
              </div>
            )}

            {!scannedCustomer && !logForCustomer && !scanSuccess && (
              <div className="bg-white rounded-3xl p-5 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-1">Skeniraj stranko</h3>
                <p className="text-sm text-gray-500 mb-4">Usmerite kamero na QR kodo na strankinemu telefonu</p>

                {scanError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm text-center">
                    {scanError}
                  </div>
                )}

                {!scanError && <QRScanner key={scannerKey} onScan={handleScan} />}

                <p className="text-xs text-gray-400 text-center mt-3">
                  Kamera samodejno prepozna QR kodo
                </p>
              </div>
            )}

            {(scannedCustomer || logForCustomer) && !scanSuccess && (
              <LogVisitForm
                customer={scannedCustomer || logForCustomer}
                token={token}
                onSuccess={handleVisitSuccess}
                onCancel={cancelScan}
              />
            )}
          </>
        )}

        {/* ── CUSTOMERS TAB ── */}
        {activeTab === 'customers' && (
          <>
            {logForCustomer ? (
              <div className="space-y-3">
                <button
                  onClick={() => setLogForCustomer(null)}
                  className="flex items-center gap-1 text-rose-500 text-sm font-medium"
                >
                  ← Nazaj na stranke
                </button>
                <LogVisitForm
                  customer={logForCustomer}
                  token={token}
                  onSuccess={(result) => {
                    handleVisitSuccess(result);
                    setActiveTab('customers');
                    setTimeout(loadCustomers, 500);
                  }}
                  onCancel={() => setLogForCustomer(null)}
                />
              </div>
            ) : (
              <>
                {/* Search */}
                <div className="relative">
                  <HiMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 shadow-sm"
                    placeholder="Iskanje po imenu, e-pošti ali telefonu..."
                  />
                </div>

                {/* Customer list */}
                <div className="space-y-2">
                  {loadingCustomers && (
                    <p className="text-center text-gray-400 py-6 text-sm">Nalaganje...</p>
                  )}
                  {!loadingCustomers && customers.length === 0 && (
                    <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
                      <div className="flex justify-center mb-3">
                        <HiUserGroup className="text-gray-300" size={48} />
                      </div>
                      <p className="text-gray-500 text-sm">
                        {search ? 'Ni rezultatov za iskanje' : 'Še ni registriranih strank'}
                      </p>
                    </div>
                  )}
                  {customers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCustomer(c)}
                      className="w-full bg-white rounded-2xl px-4 py-3.5 shadow-sm flex items-center gap-3 hover:bg-rose-50 transition-colors text-left"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center font-bold text-white shrink-0">
                        {c.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm">{c.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{c.email}</p>
                        {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIER_BADGE[c.tier] || 'bg-gray-100 text-gray-600'}`}>
                          {c.tier}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">{c.points} pt</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ── ANALYTICS TAB ── */}
        {activeTab === 'analytics' && (
          analytics ? (
            <div className="space-y-4">
              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Skupaj strank',  value: analytics.totalCustomers,                Icon: HiUserGroup,    color: 'text-rose-600' },
                  { label: 'Obiski danes',   value: analytics.todayVisits,                  Icon: HiCalendarDays, color: 'text-pink-600' },
                  { label: 'Skupaj točk',    value: analytics.totalPoints?.toLocaleString(), Icon: HiStar,         color: 'text-amber-600' },
                  { label: 'Skupaj obiskov', value: analytics.totalVisits,                  Icon: HiHome,         color: 'text-fuchsia-600' },
                ].map(({ label, value, Icon, color }) => (
                  <div key={label} className="bg-white rounded-3xl p-5 shadow-sm text-center">
                    <div className="flex justify-center mb-2">
                      <Icon size={28} className={color} />
                    </div>
                    <div className={`text-3xl font-bold ${color}`}>{value}</div>
                    <div className="text-xs text-gray-500 mt-1">{label}</div>
                  </div>
                ))}
              </div>

              {/* Recent visits */}
              <div className="bg-white rounded-3xl p-5 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">Zadnji obiski</h3>
                {analytics.recentVisits.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">Ni zabeleženih obiskov</p>
                ) : (
                  <div className="space-y-3">
                    {analytics.recentVisits.map((v) => (
                      <div key={v.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                        <div className="w-9 h-9 bg-rose-100 rounded-full flex items-center justify-center shrink-0">
                          {v.customer_name?.[0]
                            ? <span className="text-sm font-bold text-rose-600">{v.customer_name[0].toUpperCase()}</span>
                            : <FaUserCircle className="text-rose-300" size={20} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800">{v.customer_name}</p>
                          <p className="text-xs text-gray-400">{v.service}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm font-bold text-rose-600">+{v.points_awarded}</span>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(v.created_at).toLocaleDateString('sl-SI')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400">Nalaganje analitike...</div>
          )
        )}
      </div>
    </div>
  );
}
