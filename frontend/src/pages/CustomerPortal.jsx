import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../App';
import { apiFetch } from '../api';
import {
  HiSparkles,
  HiQrCode,
  HiClipboardDocumentList,
  HiCheck,
  HiStar,
  HiTrophy,
} from 'react-icons/hi2';
import { FaMedal, FaSpa } from 'react-icons/fa';

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

function TabBar({ active, onChange }) {
  const tabs = [
    { id: 'dashboard', label: 'Domov',   Icon: HiSparkles },
    { id: 'qr',        label: 'Moja QR', Icon: HiQrCode },
    { id: 'history',   label: 'Obiski',  Icon: HiClipboardDocumentList },
  ];
  return (
    <div className="bg-white border-b border-rose-100 px-4">
      <div className="flex max-w-md mx-auto">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              active === id ? 'border-rose-500 text-rose-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CustomerPortal() {
  const { user, token, logout } = useAuth();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100">
      <Header name={profile?.name} onLogout={logout} />
      <TabBar active={activeTab} onChange={setActiveTab} />

      <div className="max-w-md mx-auto p-4 pb-10 space-y-4">

        {/* ── DASHBOARD TAB ── */}
        {activeTab === 'dashboard' && (
          <>
            {/* Points card */}
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
                    <div
                      className="bg-white rounded-full h-2.5 transition-all duration-700"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-white bg-opacity-20 rounded-2xl px-4 py-2 text-center text-sm">
                  Čestitamo! Dosegli ste najvišjo stopnjo!
                </div>
              )}
            </div>

            {/* Tier perks */}
            <div className="bg-white rounded-3xl p-5 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">Stopnje zvestobe</h3>
              <div className="space-y-3">
                {Object.entries(TIERS).map(([name, info]) => {
                  const isActive = ['Bronasta', 'Srebrna', 'Zlata'].slice(0, Object.keys(TIERS).indexOf(name) + 1)
                    .some((t) => t === tier) || Object.keys(TIERS).indexOf(name) <= Object.keys(TIERS).indexOf(tier);
                  const isCurrent = name === tier;
                  return (
                    <div
                      key={name}
                      className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all ${
                        isCurrent ? 'bg-rose-50 border border-rose-100' : isActive ? 'bg-gray-50' : 'opacity-40 bg-gray-50'
                      }`}
                    >
                      <info.Icon />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">{name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{info.perk}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {info.prevAt}–{info.nextAt ?? '∞'} točk
                        </p>
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

            {/* Quick stats */}
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
            <p className="text-sm text-gray-500 mb-6">
              Pokažite to kodo osebju pri blagajni za zbiranje točk
            </p>

            <div className="inline-flex p-5 bg-white border-2 border-rose-100 rounded-3xl shadow-md mb-6">
              <QRCodeSVG
                value={profile?.qr_token || 'none'}
                size={220}
                fgColor="#be123c"
                bgColor="#ffffff"
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="bg-rose-50 rounded-2xl p-4 mb-4">
              <p className="text-xs text-rose-300 mb-1 font-medium">ID stranke</p>
              <p className="text-xs text-rose-400 font-mono break-all">{profile?.qr_token}</p>
            </div>

            <div className={`inline-flex items-center gap-2 ${tierInfo.badge} px-4 py-2 rounded-full text-sm font-semibold`}>
              <tierInfo.Icon /> {tier} &nbsp;·&nbsp; {points} točk
            </div>

            <p className="text-xs text-gray-400 mt-4">
              Koda je edinstvena in varna. Nikoli je ne delite z drugimi.
            </p>
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <h3 className="font-bold text-gray-700 px-1 text-sm uppercase tracking-wider">
              Zgodovina obiskov ({visits.length})
            </h3>

            {visits.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
                <div className="flex justify-center mb-4">
                  <FaSpa className="text-rose-300" size={48} />
                </div>
                <p className="font-semibold text-gray-700">Še ni zabeleženih obiskov</p>
                <p className="text-sm text-gray-400 mt-2">
                  Ob naslednjem obisku bo osebje zabeležilo vašo storitev in dodalo točke
                </p>
              </div>
            ) : (
              visits.map((visit) => (
                <div key={visit.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800">{visit.service}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(visit.created_at).toLocaleDateString('sl-SI', {
                          day: 'numeric', month: 'long', year: 'numeric',
                        })}
                      </p>
                      {visit.notes && (
                        <p className="text-xs text-gray-400 mt-1.5 italic">"{visit.notes}"</p>
                      )}
                      {visit.staff_name && (
                        <p className="text-xs text-gray-300 mt-1">Osebje: {visit.staff_name}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="bg-rose-100 text-rose-700 text-sm font-bold px-3 py-1 rounded-full">
                        +{visit.points_awarded} pt
                      </span>
                      {visit.amount > 0 && (
                        <p className="text-xs text-gray-400 mt-1.5">
                          {visit.amount.toFixed(2)} €
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
