'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db, rtdb } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { ref, get } from 'firebase/database';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

// ─── Types matching Unity's exact Firebase schema ────────────────────────────

/** Mirrors Unity PlayerData class written to RTDB at playerData/{uid} */
interface UnityPlayerData {
  email: string;
  totalCoins: number;           // Unity name — displayed as "Score" on website
  level1Unlocked: boolean;
  level2Unlocked: boolean;
  level3Unlocked: boolean;
  level4Unlocked: boolean;
  level5Unlocked: boolean;
  totalSoloScore: number;       // Best solo score ever (set by UpdateSoloScore in Unity)
  totalMultiplayerWins: number;
  totalMultiplayerGames: number;
}

/** Mirrors Unity LeaderboardEntry written to RTDB at leaderboard/{uid} */
interface UnityLeaderboardEntry {
  userId: string;
  playerName: string;
  coins: number;                // Unity field — displayed as "Score" on website
  timestamp: number;
}

/** Mirrors Unity MultiplayerLeaderboardEntry written to RTDB at leaderboard_multiplayer/{uid} */
interface UnityMultiplayerEntry {
  userId: string;
  playerName: string;
  wins: number;
  gamesPlayed: number;
  winRate: number;              // Pre-calculated by Unity as 0-100
  timestamp: number;
}

interface DisplayLeaderboardEntry {
  playerName: string;
  score: number;
  extra: string;
  isCurrentUser?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function countLevelsUnlocked(pd: UnityPlayerData): number {
  // Level 1 is always unlocked, count it plus any unlocked levels beyond that
  return [true, pd.level2Unlocked, pd.level3Unlocked, pd.level4Unlocked, pd.level5Unlocked]
    .filter(Boolean).length;
}

const TOTAL_LEVELS = 5; // All 5 levels

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [unityData, setUnityData]         = useState<UnityPlayerData | null>(null);
  const [displayName, setDisplayName]     = useState('Cyberian');
  const [userEmail, setUserEmail]         = useState('');
  const [memberSince, setMemberSince]     = useState('');
  const [currentUserId, setCurrentUserId] = useState('');

  const [soloBoard, setSoloBoard]   = useState<DisplayLeaderboardEntry[]>([]);
  const [multiBoard, setMultiBoard] = useState<DisplayLeaderboardEntry[]>([]);

  const [showLogoutModal, setShowLogoutModal]     = useState(false);
  const [showPaymentModal, setShowPaymentModal]   = useState(false);
  const [paid, setPaid]                           = useState(false);
  const [activeTab, setActiveTab]                 = useState('overview');
  const [leaderboardTab, setLeaderboardTab]       = useState<'solo' | 'multiplayer'>('solo');
  const [showAchievement, setShowAchievement]     = useState(false);
  const [achievementMessage, setAchievementMessage] = useState('');

  const triggerAchievement = (msg: string) => {
    setAchievementMessage(msg);
    setShowAchievement(true);
    setTimeout(() => setShowAchievement(false), 3500);
  };

  const defaultUnityData = (email: string): UnityPlayerData => ({
    email,
    totalCoins: 0,
    level1Unlocked: true,
    level2Unlocked: false,
    level3Unlocked: false,
    level4Unlocked: false,
    level5Unlocked: false,
    totalSoloScore: 0,
    totalMultiplayerWins: 0,
    totalMultiplayerGames: 0,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      // Set basic info immediately from Auth
      setCurrentUserId(user.uid);
      setUserEmail(user.email ?? '');
      setDisplayName(user.displayName || user.email?.split('@')[0] || 'Cyberian');
      setMemberSince(new Date().toLocaleDateString());

      // ── 1. Firestore: optional profile (name, createdAt, hasPurchased) ──────
      try {
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        if (userSnap.exists()) {
          const fd = userSnap.data();
          if (fd.name)         setDisplayName(fd.name);
          if (fd.createdAt)    setMemberSince(new Date(fd.createdAt).toLocaleDateString());
          if (fd.hasPurchased) setPaid(true); // Restore purchase state across sessions
        }
      } catch (e) {
        console.warn('[Profile] Firestore fetch failed (non-critical):', e);
      }

      // ── 2. RTDB: playerData/{uid} — Unity PlayerData ──────────────────────
      try {
        const playerSnap = await get(ref(rtdb, `playerData/${user.uid}`));
        if (playerSnap.exists()) {
          setUnityData(playerSnap.val() as UnityPlayerData);
        } else {
          setUnityData(defaultUnityData(user.email ?? ''));
        }
      } catch (e) {
        console.warn('[Profile] RTDB playerData failed:', e);
        setUnityData(defaultUnityData(user.email ?? ''));
      }

      // ── 3. RTDB: leaderboard — Solo scores ────────────────────────────────
      try {
        const soloSnap = await get(ref(rtdb, 'leaderboard'));
        const entries: DisplayLeaderboardEntry[] = [];
        if (soloSnap.exists()) {
          soloSnap.forEach((child) => {
            const e = child.val() as UnityLeaderboardEntry;
            entries.push({
              playerName: e.playerName,
              score: e.coins,        // "coins" in Unity = "score" on website
              extra: '',
              isCurrentUser: e.userId === user.uid,
            });
          });
          entries.sort((a, b) => b.score - a.score);
        }
        setSoloBoard(entries.slice(0, 10));
      } catch (e) {
        console.warn('[Profile] RTDB solo leaderboard failed:', e);
      }

      // ── 4. RTDB: leaderboard_multiplayer ──────────────────────────────────
      try {
        const mpSnap = await get(ref(rtdb, 'leaderboard_multiplayer'));
        const entries: DisplayLeaderboardEntry[] = [];
        if (mpSnap.exists()) {
          mpSnap.forEach((child) => {
            const e = child.val() as UnityMultiplayerEntry;
            entries.push({
              playerName: e.playerName,
              score: e.wins,
              extra: `${e.winRate.toFixed(0)}% WR · ${e.gamesPlayed} games`,
              isCurrentUser: e.userId === user.uid,
            });
          });
          entries.sort((a, b) => b.score - a.score);
        }
        setMultiBoard(entries.slice(0, 10));
      } catch (e) {
        console.warn('[Profile] RTDB multiplayer leaderboard failed:', e);
      }

      // Always fires — loading can never get stuck
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  // ── Derived values from Unity data ───────────────────────────────────────
  const currentScore   = unityData?.totalCoins ?? 0;
  const bestSoloScore  = unityData?.totalSoloScore ?? 0;
  const levelsUnlocked = unityData ? countLevelsUnlocked(unityData) : 0;
  const completionPct  = Math.round((levelsUnlocked / TOTAL_LEVELS) * 100);
  const multiWins      = unityData?.totalMultiplayerWins ?? 0;
  const multiGames     = unityData?.totalMultiplayerGames ?? 0;
  const multiWinRate   = multiGames > 0 ? ((multiWins / multiGames) * 100).toFixed(0) : '0';

  const achievements = [
    { name: 'New Recruit',   desc: 'Joined Cyberia',                     icon: '🎖️', unlocked: true },
    { name: 'First Steps',   desc: 'Unlocked Level 2',                   icon: '🎯', unlocked: unityData?.level2Unlocked ?? false },
    { name: 'Going Deeper',  desc: 'Unlocked Level 3',                   icon: '🔓', unlocked: unityData?.level3Unlocked ?? false },
    { name: 'Halfway There', desc: 'Unlocked Level 4',                   icon: '⚡', unlocked: unityData?.level4Unlocked ?? false },
    { name: 'Elite Cyber',   desc: 'Unlocked Level 5',                   icon: '👑', unlocked: unityData?.level5Unlocked ?? false },
    { name: 'Score Hunter',  desc: 'Reached 500 score',                  icon: '💰', unlocked: bestSoloScore >= 500 },
    { name: 'Score Master',  desc: 'Reached 1,000 score',                icon: '🏆', unlocked: bestSoloScore >= 1000 },
    { name: 'PvP Rookie',    desc: 'Played a multiplayer match',         icon: '⚔️', unlocked: multiGames >= 1 },
    { name: 'PvP Veteran',   desc: 'Won 5 multiplayer matches',          icon: '🛡️', unlocked: multiWins >= 5 },
    { name: 'Undefeated',    desc: '100% win rate (min 3 games)',         icon: '🦁', unlocked: multiGames >= 3 && multiWins === multiGames },
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-cyan-400 text-lg font-semibold animate-pulse">Loading Cyberia Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">

      {/* Achievement Toast */}
      <AnimatePresence>
        {showAchievement && (
          <motion.div
            initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -100, opacity: 0 }}
            className="fixed top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-6 py-4 rounded-xl shadow-2xl z-50 border-2 border-yellow-300"
          >
            <p className="font-bold">{achievementMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav */}
      <motion.nav initial={{ y: -100 }} animate={{ y: 0 }} className="bg-black/30 backdrop-blur-lg border-b border-cyan-500/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">CYBERIA</span>
              <span className="text-gray-400 text-sm">v1.0</span>
            </div>
            <div className="flex space-x-1">
              {['overview', 'levels', 'leaderboard', 'achievements'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50' : 'text-gray-300 hover:bg-white/10'}`}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-2xl overflow-hidden mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-75 animate-pulse" />
            <div className="relative px-8 py-12">
              <div className="flex items-center space-x-8">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-2xl">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full blur opacity-30" />
                </div>
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-white mb-2">{displayName}</h1>
                  <p className="text-cyan-100 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    {userEmail}
                  </p>
                  <p className="text-cyan-100 mt-1">Member since {memberSince}</p>
                </div>
                <div className="flex space-x-4">
                  <div className="bg-white/20 backdrop-blur-lg rounded-xl px-6 py-3 text-center border border-white/30">
                    <div className="text-2xl font-bold text-white">{bestSoloScore.toLocaleString()}</div>
                    <div className="text-xs text-cyan-100">Best Score</div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-lg rounded-xl px-6 py-3 text-center border border-white/30">
                    <div className="text-2xl font-bold text-white">{levelsUnlocked}/{TOTAL_LEVELS}</div>
                    <div className="text-xs text-cyan-100">Levels</div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-lg rounded-xl px-6 py-3 text-center border border-white/30">
                    <div className="text-2xl font-bold text-white">{multiWins}</div>
                    <div className="text-xs text-cyan-100">PvP Wins</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Panel */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-1">
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-cyan-500/30">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                </svg>
                Game Access
              </h2>
              <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl p-6 mb-4">
                <h3 className="text-lg font-semibold text-white mb-2">Cyberia Game Client</h3>
                <p className="text-cyan-100 text-sm mb-4">{paid ? 'Game purchased! Download now.' : 'Purchase to unlock full game access'}</p>
                {!paid ? (
                  <button onClick={() => setShowPaymentModal(true)}
                    className="w-full bg-white text-cyan-600 px-4 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 flex items-center justify-center space-x-2">
                    <span>₱150.00</span><span>•</span><span>Buy Now</span>
                  </button>
                ) : (
                  <a href="/Cyberia_App.7z" download="Cyberia_App.7z"
                    className="w-full bg-green-500 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-600 transition-all transform hover:scale-105 flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <span>Download Cyberia</span>
                  </a>
                )}
              </div>

              {/* Stats from Unity RTDB */}
              <div className="bg-gray-700/40 rounded-xl p-4 border border-gray-600/40 mb-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Your Stats</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">Score</span>
                    <span className="text-cyan-400 font-bold">{currentScore.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">Best Score</span>
                    <span className="text-yellow-400 font-bold">{bestSoloScore.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-px bg-gray-600/50 my-1" />
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">PvP Record</span>
                    <span className="text-purple-400 font-bold">{multiWins}W / {multiGames}G</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">Win Rate</span>
                    <span className="text-green-400 font-bold">{multiWinRate}%</span>
                  </div>
                </div>
              </div>

              <button onClick={() => setShowLogoutModal(true)}
                className="w-full bg-red-600/30 hover:bg-red-600/50 text-red-300 px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 border border-red-500/30">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </motion.div>

          {/* Right — Tabs */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-cyan-500/30">
              <AnimatePresence mode="wait">

                {/* OVERVIEW */}
                {activeTab === 'overview' && (
                  <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                    <h3 className="text-xl font-bold text-white">Performance Overview</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl p-4 border border-cyan-500/30">
                        <div className="text-3xl font-bold text-cyan-400">{currentScore.toLocaleString()}</div>
                        <div className="text-sm text-gray-400">Current Score</div>
                        <div className="text-xs text-gray-500 mt-1">totalCoins in Unity</div>
                      </div>
                      <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-500/30">
                        <div className="text-3xl font-bold text-yellow-400">{bestSoloScore.toLocaleString()}</div>
                        <div className="text-sm text-gray-400">Best Score</div>
                        <div className="text-xs text-gray-500 mt-1">totalSoloScore in Unity</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-500/30">
                        <div className="text-3xl font-bold text-purple-400">{multiWins} / {multiGames}</div>
                        <div className="text-sm text-gray-400">PvP Wins / Games</div>
                        <div className="text-xs text-gray-500 mt-1">totalMultiplayerWins/Games</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-500/30">
                        <div className="text-3xl font-bold text-green-400">{completionPct}%</div>
                        <div className="text-sm text-gray-400">Level Completion</div>
                        <div className="text-xs text-gray-500 mt-1">{levelsUnlocked} of {TOTAL_LEVELS} unlocked</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3">Unlocked Achievements ({unlockedCount}/{achievements.length})</h4>
                      <div className="flex flex-wrap gap-2">
                        {achievements.filter(a => a.unlocked).map((a, i) => (
                          <span key={i} className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 rounded-full text-sm font-medium">
                            {a.icon} {a.name}
                          </span>
                        ))}
                        {unlockedCount === 0 && <p className="text-gray-400 text-sm">Play Cyberia to earn achievements!</p>}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* LEVELS */}
                {activeTab === 'levels' && (
                  <motion.div key="levels" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                    <h3 className="text-xl font-bold text-white mb-4">Level Progress</h3>
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((lvl) => {
                        const unlocked =
                          lvl === 1 ? true :
                          lvl === 2 ? (unityData?.level2Unlocked ?? false) :
                          lvl === 3 ? (unityData?.level3Unlocked ?? false) :
                          lvl === 4 ? (unityData?.level4Unlocked ?? false) :
                                      (unityData?.level5Unlocked ?? false);
                        return (
                          <motion.div key={lvl} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: lvl * 0.08 }}
                            className={`flex items-center justify-between p-4 rounded-xl border ${unlocked ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/40' : 'bg-gray-700/30 border-gray-600/40 opacity-60'}`}>
                            <div className="flex items-center space-x-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${unlocked ? 'bg-cyan-500 text-white' : 'bg-gray-600 text-gray-400'}`}>
                                {lvl}
                              </div>
                              <div>
                                <p className="font-semibold text-white">Level {lvl}</p>
                                <p className="text-xs text-gray-400">{lvl === 1 ? 'Always unlocked' : unlocked ? 'Unlocked' : 'Complete previous level to unlock'}</p>
                              </div>
                            </div>
                            <span className={`text-sm font-medium px-3 py-1 rounded-full ${unlocked ? 'bg-green-500/20 text-green-400' : 'bg-gray-600/40 text-gray-500'}`}>
                              {unlocked ? '✓ Unlocked' : '🔒 Locked'}
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>
                    <div className="mt-6">
                      <div className="flex justify-between text-sm text-gray-400 mb-2">
                        <span>Overall Progress</span><span>{completionPct}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${completionPct}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                          className="h-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* LEADERBOARD */}
                {activeTab === 'leaderboard' && (
                  <motion.div key="leaderboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white">Leaderboard</h3>
                      <div className="flex space-x-2">
                        {(['solo', 'multiplayer'] as const).map(t => (
                          <button key={t} onClick={() => setLeaderboardTab(t)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${leaderboardTab === t ? 'bg-cyan-500 text-white' : 'text-gray-400 hover:bg-white/10'}`}>
                            {t === 'solo' ? '🏅 Solo' : '⚔️ Multiplayer'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 uppercase tracking-wider px-3 mb-2">
                      <span>Rank · Player</span>
                      <span>{leaderboardTab === 'solo' ? 'Score' : 'Wins'}</span>
                    </div>
                    <div className="space-y-2">
                      {(leaderboardTab === 'solo' ? soloBoard : multiBoard).length > 0
                        ? (leaderboardTab === 'solo' ? soloBoard : multiBoard).map((entry, i) => (
                          <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              entry.isCurrentUser ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border-cyan-500/50'
                              : i === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30'
                              : i === 1 ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-500/30'
                              : i === 2 ? 'bg-gradient-to-r from-amber-700/20 to-amber-800/20 border-amber-700/30'
                              : 'bg-gray-700/30 border-gray-600'
                            }`}>
                            <div className="flex items-center space-x-3">
                              <span className={`w-7 h-7 flex items-center justify-center rounded-full font-bold text-sm ${
                                i === 0 ? 'bg-yellow-500 text-gray-900' : i === 1 ? 'bg-gray-400 text-gray-900' : i === 2 ? 'bg-amber-700 text-white' : 'bg-gray-600 text-white'
                              }`}>{i + 1}</span>
                              <div>
                                <span className="font-medium text-white">{entry.playerName}</span>
                                {entry.isCurrentUser && <span className="ml-2 text-xs text-cyan-400">(you)</span>}
                                {entry.extra && <p className="text-xs text-gray-500">{entry.extra}</p>}
                              </div>
                            </div>
                            <span className="font-bold text-cyan-400 text-lg">{entry.score.toLocaleString()}</span>
                          </motion.div>
                        ))
                        : <p className="text-gray-400 text-center py-8">No data yet. Be the first to play!</p>
                      }
                    </div>
                  </motion.div>
                )}

                {/* ACHIEVEMENTS */}
                {activeTab === 'achievements' && (
                  <motion.div key="achievements" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white">Achievements</h3>
                      <span className="text-sm text-gray-400">{unlockedCount} / {achievements.length} unlocked</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {achievements.map((a, i) => (
                        <motion.div key={i} whileHover={{ scale: 1.03 }}
                          className={`p-4 rounded-xl border ${a.unlocked ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30' : 'bg-gray-700/30 border-gray-600 opacity-50'}`}>
                          <div className="text-3xl mb-2">{a.icon}</div>
                          <h4 className="font-semibold text-white">{a.name}</h4>
                          <p className="text-xs text-gray-400">{a.desc}</p>
                          {a.unlocked && <span className="text-xs text-green-400 mt-1 block">✓ Unlocked</span>}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm"
            onClick={() => setShowPaymentModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 w-[450px] max-w-[90vw] border border-cyan-500/30 shadow-2xl"
              onClick={(e) => e.stopPropagation()}>
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Purchase Cyberia</h3>
                <p className="text-gray-400">Get full access to all levels and features</p>
              </div>
              <div className="bg-gray-700/50 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Game License</span>
                  <span className="text-2xl font-bold text-white">₱150.00</span>
                </div>
                <ul className="space-y-2 text-sm text-gray-400">
                  {['Full game access', 'All levels unlocked', 'Leaderboard access'].map(f => (
                    <li key={f} className="flex items-center">
                      <svg className="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <PayPalScriptProvider options={{ clientId: "AT0uRmZ6jYSJosbpNXGl0m5Qt-62GPUGGqcVfbskUdfq4trw3nFLRsQx2kRjcU966mlEb0t9Oj1OaRAx", currency: "PHP", intent: "capture" }}>
                <PayPalButtons
                  style={{ layout: "vertical" }}
                  createOrder={(data, actions) => {
                    if (!actions.order) return Promise.reject(new Error("Order creation failed"));
                    return actions.order.create({ intent: "CAPTURE", purchase_units: [{ amount: { currency_code: "PHP", value: "150.00" }, description: "Cyberia Game License" }] });
                  }}
                  onApprove={(data, actions) => {
                    if (!actions.order) return Promise.reject(new Error("Order approval failed"));
                    return actions.order.capture().then(async (details) => {
                      if (paid) return;
                      try {
                        const { addDoc, collection, doc, updateDoc, query, where, getDocs } = await import('firebase/firestore');
                        const existing = await getDocs(query(collection(db, 'payments'), where('orderId', '==', details.id)));
                        if (existing.empty) {
                          await addDoc(collection(db, 'payments'), {
                            userId:     auth.currentUser?.uid ?? '',
                            playerName: displayName,
                            email:      userEmail,
                            amount:     150,
                            currency:   'PHP',
                            orderId:    details.id,
                            paidAt:     new Date().toISOString(),
                          });
                        }
                        await updateDoc(doc(db, 'users', auth.currentUser!.uid), { hasPurchased: true });
                      } catch (e) {
                        console.warn('Payment record save failed:', e);
                      }
                      setPaid(true);
                      setShowPaymentModal(false);
                      triggerAchievement('🎮 Payment Successful! Welcome to Cyberia!');
                    });
                  }}
                  onError={(err) => { console.error("PayPal Error:", err); alert("Payment failed. Please try again."); }}
                  onCancel={() => alert("Payment cancelled.")}
                />
              </PayPalScriptProvider>
              <button onClick={() => setShowPaymentModal(false)} className="mt-4 text-gray-500 hover:text-gray-400 w-full text-center transition-colors">Cancel</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 backdrop-blur-sm"
            onClick={() => setShowLogoutModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl w-96 border border-red-500/30 shadow-2xl"
              onClick={(e) => e.stopPropagation()}>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Confirm Logout</h3>
                <p className="text-gray-400">Are you sure? Your progress is saved to Firebase.</p>
              </div>
              <div className="flex gap-4">
                <button onClick={handleLogout} className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium transition-all">Logout</button>
                <button onClick={() => setShowLogoutModal(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-medium transition-all">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}