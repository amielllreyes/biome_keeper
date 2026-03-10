'use client';
export const dynamic = "force-dynamic";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db, rtdb } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { ref, get } from 'firebase/database';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLogOut, FiUser, FiUsers, FiShield, FiDownload, FiDollarSign, FiActivity, FiAward, FiSearch, FiChevronUp, FiChevronDown } from 'react-icons/fi';

// ─── Types ───────────────────────────────────────────────────────────────────

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
  hasPurchased?: boolean;
  // From RTDB playerData
  totalCoins?: number;
  totalSoloScore?: number;
  totalMultiplayerWins?: number;
  totalMultiplayerGames?: number;
  levelsUnlocked?: number;
}

interface PaymentRecord {
  userId: string;
  playerName: string;
  email: string;
  amount: number;
  currency: string;
  paidAt: string;
  orderId: string;
}

interface LeaderboardEntry {
  userId: string;
  playerName: string;
  coins: number;
  levelsUnlocked?: number;
  totalMultiplayerWins?: number;
  totalMultiplayerGames?: number;
  totalSoloScore?: number;
}

interface UnityPlayerData {
  totalCoins: number;
  totalSoloScore: number;
  totalMultiplayerWins: number;
  totalMultiplayerGames: number;
  level1Unlocked: boolean;
  level2Unlocked: boolean;
  level3Unlocked: boolean;
  level4Unlocked: boolean;
  level5Unlocked: boolean;
}

type SortKey = 'name' | 'email' | 'totalSoloScore' | 'totalCoins' | 'levelsUnlocked' | 'totalMultiplayerWins';
type SortDir = 'asc' | 'desc';
type ActiveTab = 'overview' | 'players' | 'revenue' | 'leaderboard';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function countLevels(pd: UnityPlayerData): number {
  return [true, pd.level2Unlocked, pd.level3Unlocked, pd.level4Unlocked, pd.level5Unlocked]
    .filter(Boolean).length;
}

const PRICE_PHP = 150;

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const router = useRouter();

  const [activeTab, setActiveTab]               = useState<ActiveTab>('overview');
  const [loading, setLoading]                   = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Data
  const [users, setUsers]         = useState<UserData[]>([]);
  const [payments, setPayments]   = useState<PaymentRecord[]>([]);
  const [soloBoard, setSoloBoard] = useState<LeaderboardEntry[]>([]);

  // Table controls
  const [search, setSearch]       = useState('');
  const [sortKey, setSortKey]     = useState<SortKey>('totalSoloScore');
  const [sortDir, setSortDir]     = useState<SortDir>('desc');

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push('/login'); return; }
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (!snap.exists() || snap.data().role !== 'admin') {
          alert('Access denied. Admins only.');
          router.push('/');
          return;
        }
        await loadAllData();
      } catch (e) {
        console.error(e);
        router.push('/');
      }
    });
    return () => unsubscribe();
  }, []);

  // ── Data loading ──────────────────────────────────────────────────────────
  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadUsers(), loadPayments(), loadLeaderboard()]);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    const snap = await getDocs(collection(db, 'users'));
    const list: UserData[] = [];

    await Promise.all(snap.docs.map(async (docSnap) => {
      const d = docSnap.data();
      let rtdbData: Partial<UnityPlayerData> = {};

      // Pull each user's Unity data from RTDB
      try {
        const playerSnap = await get(ref(rtdb, `playerData/${docSnap.id}`));
        if (playerSnap.exists()) rtdbData = playerSnap.val() as UnityPlayerData;
      } catch { /* RTDB may not have data for web-only accounts */ }

      list.push({
        id:                    docSnap.id,
        name:                  d.name ?? d.email?.split('@')[0] ?? 'Unknown',
        email:                 d.email ?? '—',
        role:                  d.role ?? 'user',
        createdAt:             d.createdAt?.toDate?.()?.toLocaleDateString() ?? '—',
        hasPurchased:          d.hasPurchased ?? false,
        totalCoins:            rtdbData.totalCoins ?? 0,
        totalSoloScore:        rtdbData.totalSoloScore ?? 0,
        totalMultiplayerWins:  rtdbData.totalMultiplayerWins ?? 0,
        totalMultiplayerGames: rtdbData.totalMultiplayerGames ?? 0,
        levelsUnlocked:        rtdbData.level1Unlocked !== undefined
                                 ? countLevels(rtdbData as UnityPlayerData)
                                 : 0,
      });
    }));

    setUsers(list);
  };

  const loadPayments = async () => {
    try {
      const snap = await getDocs(collection(db, 'payments'));
      const list: PaymentRecord[] = [];
      snap.forEach((d) => {
        list.push(d.data() as PaymentRecord);
      });
      setPayments(list.sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()));
    } catch { /* payments collection may not exist yet */ }
  };

  const loadLeaderboard = async () => {
    try {
      const snap = await get(ref(rtdb, 'leaderboard'));
      const rawEntries: LeaderboardEntry[] = [];
      if (snap.exists()) {
        snap.forEach((child) => {
          const val = child.val();
          rawEntries.push({
            userId:     val.userId     ?? child.key ?? '',
            playerName: val.playerName ?? 'Unknown',
            coins:      val.coins      ?? 0,
          });
        });
        rawEntries.sort((a, b) => b.coins - a.coins);
      }

      // Enrich each entry with playerData from RTDB directly
      const enriched = await Promise.all(rawEntries.map(async (entry) => {
        try {
          const pdSnap = await get(ref(rtdb, `playerData/${entry.userId}`));
          if (pdSnap.exists()) {
            const pd = pdSnap.val() as UnityPlayerData;
            return {
              ...entry,
              levelsUnlocked:        countLevels(pd),
              totalSoloScore:        pd.totalSoloScore        ?? 0,
              totalMultiplayerWins:  pd.totalMultiplayerWins  ?? 0,
              totalMultiplayerGames: pd.totalMultiplayerGames ?? 0,
            };
          }
        } catch { /* no playerData for this user */ }
        return entry;
      }));

      setSoloBoard(enriched);
    } catch { /* RTDB may be empty */ }
  };

  const handleLogout = () => {
    signOut(auth)
      .then(() => router.push('/login'))
      .catch(console.error);
  };

  // ── Derived stats ─────────────────────────────────────────────────────────
  const totalUsers      = users.length;
  const totalAdmins     = users.filter(u => u.role === 'admin').length;
  const totalPlayers    = users.filter(u => u.role === 'user').length;
  // Use payments collection if populated, otherwise fall back to hasPurchased flag on users
  const purchasedCount  = payments.length > 0
    ? payments.length
    : users.filter(u => u.hasPurchased).length;
  const totalRevenuePHP = payments.reduce((s, p) => s + (p.amount ?? PRICE_PHP), 0);
  const activeGamers    = users.filter(u => (u.totalSoloScore ?? 0) > 0).length;
  const avgScore        = totalPlayers > 0
    ? Math.round(users.filter(u => u.role === 'user').reduce((s, u) => s + (u.totalSoloScore ?? 0), 0) / totalPlayers)
    : 0;

  // ── Table filtering & sorting ─────────────────────────────────────────────
  const playerRows = users
    .filter(u => u.role === 'user')
    .filter(u =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      if (typeof av === 'string' && typeof bv === 'string')
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? sortDir === 'asc' ? <FiChevronUp className="inline ml-1" /> : <FiChevronDown className="inline ml-1" />
      : <span className="inline ml-1 opacity-30">↕</span>;

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-blue-400 mx-auto mb-4" />
        <p className="text-blue-300 font-medium">Loading Admin Dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white">

      {/* ── Sidebar ── */}
      <aside className="fixed left-0 top-0 h-full w-56 bg-slate-800 border-r border-slate-700 z-30 flex flex-col">
        <div className="px-6 py-6 border-b border-slate-700">
          <h1 className="text-xl font-bold text-blue-400">CYBERIA</h1>
          <p className="text-xs text-slate-400 mt-1">Admin Panel</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {([
            { key: 'overview',    label: 'Overview',    icon: <FiActivity /> },
            { key: 'players',     label: 'Players',     icon: <FiUsers /> },
            { key: 'revenue',     label: 'Revenue',     icon: <FiDollarSign /> },
            { key: 'leaderboard', label: 'Leaderboard', icon: <FiAward /> },
          ] as { key: ActiveTab; label: string; icon: React.ReactNode }[]).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <button onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all">
            <FiLogOut /> Logout
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="ml-56 p-8">

        {/* ══ OVERVIEW ══ */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-2xl font-bold mb-6">Overview</h2>

            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <StatCard label="Total Accounts"  value={totalUsers}     sub="registered"                         color="blue"   icon={<FiUsers />} />
              <StatCard label="Game Purchased"  value={purchasedCount} sub={`₱${totalRevenuePHP.toLocaleString()} earned`}    color="green"  icon={<FiDownload />} />
             
            </div>

            {/* Two-col breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Account breakdown */}
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <h3 className="font-semibold text-slate-200 mb-4">Account Breakdown</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Total Accounts', value: totalUsers,     color: 'text-blue-400' },
                    { label: 'Players',         value: totalPlayers,  color: 'text-cyan-400' },
                    { label: 'Admins',          value: totalAdmins,   color: 'text-purple-400' },
                    { label: 'Purchased Game',  value: purchasedCount, color: 'text-green-400' },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-center py-2 border-b border-slate-700/50 last:border-0">
                      <span className="text-slate-400 text-sm">{row.label}</span>
                      <span className={`text-2xl font-bold ${row.color}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top 5 players */}
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <h3 className="font-semibold text-slate-200 mb-4">Top 5 Players by Score</h3>
                <div className="space-y-3">
                  {users
                    .filter(u => u.role === 'user')
                    .sort((a, b) => (b.totalSoloScore ?? 0) - (a.totalSoloScore ?? 0))
                    .slice(0, 5)
                    .map((u, i) => (
                      <div key={u.id} className="flex items-center gap-3">
                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                          i === 0 ? 'bg-yellow-500 text-gray-900'
                          : i === 1 ? 'bg-gray-400 text-gray-900'
                          : i === 2 ? 'bg-amber-700 text-white'
                          : 'bg-slate-600 text-white'
                        }`}>{i + 1}</span>
                        <span className="flex-1 text-sm text-slate-300 truncate">{u.name}</span>
                        <span className="text-sm font-bold text-cyan-400">{(u.totalSoloScore ?? 0).toLocaleString()}</span>
                      </div>
                    ))
                  }
                  {users.filter(u => u.role === 'user').length === 0 && (
                    <p className="text-slate-500 text-sm">No player data yet.</p>
                  )}
                </div>
              </div>
            </div>


          </motion.div>
        )}

        {/* ══ PLAYERS ══ */}
        {activeTab === 'players' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Players ({totalPlayers})</h2>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search name or email..."
                  className="pl-9 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 w-64"
                />
              </div>
            </div>

            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-700 text-sm">
                  <thead className="bg-slate-750">
                    <tr>
                      {[
                        { key: 'name',                label: 'Player' },
                        { key: 'email',               label: 'Email' },
        
                        { key: 'totalCoins',          label: 'Coins' },
                        { key: 'levelsUnlocked',      label: 'Levels' },
                        { key: 'totalMultiplayerWins',label: 'PvP Wins' },
                      ].map(col => (
                        <th key={col.key}
                          onClick={() => handleSort(col.key as SortKey)}
                          className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white select-none"
                        >
                          {col.label}<SortIcon k={col.key as SortKey} />
                        </th>
                      ))}
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Purchased
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {playerRows.length > 0 ? playerRows.map((u, i) => (
                      <motion.tr key={u.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="hover:bg-slate-700/50 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-white">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-400">{u.email}</td>
                       
                        <td className="px-5 py-4 text-cyan-400">{(u.totalCoins ?? 0).toLocaleString()}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                              {[1,2,3,4,5].map(lvl => (
                                <div key={lvl} className={`w-3 h-3 rounded-sm ${
                                  (u.levelsUnlocked ?? 0) >= lvl ? 'bg-green-500' : 'bg-slate-600'
                                }`} />
                              ))}
                            </div>
                            <span className="text-slate-400 text-xs">{u.levelsUnlocked ?? 0}/5</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-purple-400">{u.totalMultiplayerWins ?? 0}W / {u.totalMultiplayerGames ?? 0}G</td>
                        <td className="px-5 py-4 text-slate-500 text-xs">{u.createdAt ?? '—'}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            u.hasPurchased
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-slate-600/40 text-slate-400'
                          }`}>
                            {u.hasPurchased ? '✓ Paid' : 'Free'}
                          </span>
                        </td>
                      </motion.tr>
                    )) : (
                      <tr>
                        <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                          {search ? 'No players match your search.' : 'No players yet.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══ REVENUE ══ */}
        {activeTab === 'revenue' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-2xl font-bold mb-6">Revenue</h2>

            {/* Revenue summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <p className="text-slate-400 text-sm mb-1">Total Revenue</p>
                <p className="text-4xl font-bold text-green-400">₱{totalRevenuePHP.toLocaleString()}</p>
                <p className="text-slate-500 text-xs mt-2">from {purchasedCount} purchases</p>
              </div>
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <p className="text-slate-400 text-sm mb-1">Price Per Copy</p>
                <p className="text-4xl font-bold text-white">₱{PRICE_PHP}</p>
                <p className="text-slate-500 text-xs mt-2">Cyberia Game License</p>
              </div>
            </div>

            {/* Transactions table */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700">
                <h3 className="font-semibold text-slate-200">Transaction History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-700 text-sm">
                  <thead>
                    <tr>
                      {['Player', 'Email', 'Amount', 'Order ID', 'Date'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {payments.length > 0 ? payments.map((p, i) => (
                      <motion.tr key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className="hover:bg-slate-700/50 transition-colors"
                      >
                        <td className="px-5 py-4 font-medium text-white">{p.playerName}</td>
                        <td className="px-5 py-4 text-slate-400">{p.email}</td>
                        <td className="px-5 py-4 font-bold text-green-400">₱{p.amount ?? PRICE_PHP}</td>
                        <td className="px-5 py-4 text-slate-500 text-xs font-mono">{p.orderId ?? '—'}</td>
                        <td className="px-5 py-4 text-slate-400">{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '—'}</td>
                      </motion.tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                          No payment records yet.
                          <p className="text-xs mt-2 text-slate-600">
                            Payments are saved to Firestore when a player completes checkout.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══ LEADERBOARD ══ */}
        {activeTab === 'leaderboard' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-2xl font-bold mb-6">Global Leaderboard</h2>

            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-700 text-sm">
                  <thead>
                    <tr>
                      {['Rank', 'Player', 'Score','Levels', 'PvP Record'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {soloBoard.length > 0 ? soloBoard.slice(0, 20).map((entry, i) => (
                        <motion.tr key={entry.userId}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className={`hover:bg-slate-700/50 transition-colors ${
                            i === 0 ? 'bg-yellow-500/5' : i === 1 ? 'bg-slate-400/5' : i === 2 ? 'bg-amber-700/5' : ''
                          }`}
                        >
                          <td className="px-5 py-4">
                            <span className={`w-7 h-7 inline-flex items-center justify-center rounded-full font-bold text-xs ${
                              i === 0 ? 'bg-yellow-500 text-gray-900'
                              : i === 1 ? 'bg-gray-400 text-gray-900'
                              : i === 2 ? 'bg-amber-700 text-white'
                              : 'bg-slate-600 text-white'
                            }`}>{i + 1}</span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
                                {entry.playerName.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-white">{entry.playerName}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 font-bold text-cyan-400">{entry.coins.toLocaleString()}</td>
                         
                          <td className="px-5 py-4">
                            <div className="flex gap-0.5">
                              {[1,2,3,4,5].map(lvl => (
                                <div key={lvl} className={`w-3 h-3 rounded-sm ${
                                  (entry.levelsUnlocked ?? 0) >= lvl ? 'bg-green-500' : 'bg-slate-600'
                                }`} />
                              ))}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-purple-400">
                            {entry.totalMultiplayerWins ?? 0}W / {entry.totalMultiplayerGames ?? 0}G
                          </td>
                        </motion.tr>
                      )) : (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                          No leaderboard data yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* ── Logout Modal ── */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-slate-800 rounded-2xl p-8 w-96 border border-slate-700 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-2">Confirm Logout</h3>
              <p className="text-slate-400 mb-6">Are you sure you want to log out of the admin panel?</p>
              <div className="flex gap-3">
                <button onClick={handleLogout}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all">
                  Logout
                </button>
                <button onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2.5 rounded-lg font-medium transition-all">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color, icon }: {
  label: string; value: number; sub: string; color: string; icon: React.ReactNode;
}) {
  const colors: Record<string, string> = {
    blue:   'from-blue-600/20 to-blue-700/10 border-blue-500/30 text-blue-400',
    cyan:   'from-cyan-600/20 to-cyan-700/10 border-cyan-500/30 text-cyan-400',
    green:  'from-green-600/20 to-green-700/10 border-green-500/30 text-green-400',
    purple: 'from-purple-600/20 to-purple-700/10 border-purple-500/30 text-purple-400',
  };
  return (
    <motion.div whileHover={{ y: -3 }}
      className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-6 border`}>
      <div className={`text-2xl mb-3 ${colors[color].split(' ').pop()}`}>{icon}</div>
      <p className="text-3xl font-bold text-white">{value.toLocaleString()}</p>
      <p className="text-sm font-medium text-white mt-1">{label}</p>
      <p className="text-xs text-slate-500 mt-1">{sub}</p>
    </motion.div>
  );
}