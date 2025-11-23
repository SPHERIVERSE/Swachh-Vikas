'use client';

import RoleGuard from '@/components/RoleGuard';
import NotificationBell from '@/components/NotificationBell';
import NotificationPanel from '@/components/NotificationPanel';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/utils/axiosInstance';

interface UserStats {
  level: number;
  xp: number;
  xpToNext: number;
  streak: number;
  completedModules: number;
  totalModules: number;
  achievements: string[];
}

interface UserRank {
  rank: number;
  xp: number;
  name: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  delay: number;
}

export default function CitizenDashboard() {
  const router = useRouter();
  const [userStats, setUserStats] = useState<UserStats>({
    level: 1,
    xp: 0,
    xpToNext: 100,
    streak: 0,
    completedModules: 0,
    totalModules: 0,
    achievements: [],
  });
  const [userRank, setUserRank] = useState<UserRank | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [particles, setParticles] = useState<Particle[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [cleanCoinBalance, setCleanCoinBalance] = useState<number>(0);

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('access_token')
      : null;

  const fetchUserProgress = async () => {
    setLoading(true);
    try {
      // Get user info first to get userId
      const userRes = await api.get('/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUserId(userRes.data.id);

      const res = await api.get('/training/user/progress', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const progress = res.data;
      setUserStats({
        level: progress.level || 1,
        xp: progress.xp || 0,
        xpToNext: progress.xpToNext || 100,
        streak: progress.streak || 0,
        completedModules: progress.completedModules || 0,
        totalModules: progress.totalModules || 0,
        achievements: progress.achievements || [],
      });

      const rankRes = await api.get('/training/leaderboard/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserRank(rankRes.data);

      // Fetch CleanCoin balance
      try {
        const coinRes = await api.get('/cleancoin/balance', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCleanCoinBalance(coinRes.data.balance || 0);
      } catch (err) {
        console.error('Failed to fetch CleanCoin balance:', err);
      }

      setError('');
    } catch (err: any) {
      setError('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProgress();

    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 6,
    }));
    setParticles(newParticles);
  }, []);

  const xpPercentage = (userStats.xp / userStats.xpToNext) * 100;
  const moduleProgress =
    userStats.totalModules > 0
      ? (userStats.completedModules / userStats.totalModules) * 100
      : 0;

  if (loading) {
    return (
      <RoleGuard role="CITIZEN">
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 text-center border border-white/20 shadow-2xl">
            <div className="relative">
              <div className="animate-spin w-20 h-20 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-6"></div>
              <div className="absolute inset-0 animate-ping w-20 h-20 border-4 border-blue-400/30 rounded-full mx-auto"></div>
            </div>
            <p className="text-white text-xl font-semibold">Loading Dashboard...</p>
            <p className="text-blue-200 text-sm mt-2">Preparing your progress data</p>
          </div>
        </div>
      </RoleGuard>
    );
  }

  if (error) {
    return (
      <RoleGuard role="CITIZEN">
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-red-900 to-rose-900">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 text-center border border-red-400/30 shadow-2xl">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-red-400 text-xl font-semibold mb-4">{error}</p>
            <button
              onClick={fetchUserProgress}
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
            >
              Retry Loading
            </button>
          </div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard role="CITIZEN">
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        {/* Animated Background Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute w-2 h-2 bg-blue-400/30 rounded-full animate-pulse"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                animationDelay: `${p.delay}s`,
                animation: `float 8s ease-in-out infinite ${p.delay}s`,
              }}
            />
          ))}
        </div>

        {/* Gradient Orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="relative z-10 p-6 space-y-8">
          {/* Header Section */}
          <div className="animate-fade-in-up">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
              <div className="flex flex-col lg:flex-row items-center justify-between space-y-6 lg:space-y-0">
                <div className="text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start space-x-3 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-white">
                        Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Eco Champion!</span>
                      </h1>
                      <p className="text-blue-200 text-lg">Continue your environmental journey</p>
                    </div>
                  </div>
                </div>
                
                {/* Notification Bell */}
                <div className="flex items-center space-x-4">
                  {currentUserId && <NotificationBell userId={currentUserId} />}
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-xl animate-bounce">
                        <span className="text-2xl font-bold text-white">L{userStats.level}</span>
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-xs text-blue-200 mt-2 font-semibold">Level {userStats.level}</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-xl">
                        <div className="text-center">
                          <div className="text-lg font-bold text-white">{userStats.streak}</div>
                          <div className="text-xs text-orange-100">🔥</div>
                        </div>
                      </div>
                      {userStats.streak > 0 && (
                        <div className="absolute inset-0 rounded-2xl bg-orange-400/20 animate-ping"></div>
                      )}
                    </div>
                    <p className="text-xs text-blue-200 mt-2 font-semibold">Day Streak</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl">
                        <div className="text-center">
                          <div className="text-lg font-bold text-white">{cleanCoinBalance}</div>
                          <div className="text-xs text-green-100">🪙</div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-blue-200 mt-2 font-semibold">CleanCoins</p>
                  </div>
                </div>
              </div>

              {/* XP Progress Bar */}
              <div className="mt-8">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-white font-semibold text-lg">Experience Points</span>
                  <span className="text-blue-300 font-bold">
                    {userStats.xp.toLocaleString()} / {userStats.xpToNext.toLocaleString()} XP
                  </span>
                </div>
                <div className="relative w-full h-4 bg-slate-700/50 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-full transition-all duration-2000 ease-out relative"
                    style={{ width: `${xpPercentage}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                  </div>
                  <div className="absolute inset-0 rounded-full shadow-inner border border-white/10"></div>
                </div>
                <div className="flex justify-between text-xs text-blue-200 mt-2">
                  <span>Current Level</span>
                  <span>{xpPercentage.toFixed(1)}% to next level</span>
                </div>
              </div>

              {/* Rank Display */}
              {userRank && (
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl border border-purple-400/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold">#{userRank.rank}</span>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">Global Ranking</h3>
                        <p className="text-purple-200 text-sm">{userRank.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-300">{userRank.xp.toLocaleString()}</div>
                      <div className="text-xs text-purple-200">Total XP</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{userStats.completedModules}</div>
                  <div className="text-sm text-green-200">of {userStats.totalModules}</div>
                </div>
              </div>
              <h3 className="text-white font-semibold mb-2">Training Modules</h3>
              <div className="w-full bg-slate-700/50 rounded-full h-2 mb-2">
                <div
                  className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${moduleProgress}%` }}
                ></div>
              </div>
              <p className="text-green-200 text-sm">{moduleProgress.toFixed(0)}% Complete</p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{userStats.xp.toLocaleString()}</div>
                  <div className="text-sm text-yellow-200">Experience</div>
                </div>
              </div>
              <h3 className="text-white font-semibold mb-2">Total XP Earned</h3>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-slate-700/50 rounded-full h-2">
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full w-full animate-pulse"></div>
                </div>
                <span className="text-yellow-200 text-sm font-semibold">Active</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{userStats.achievements.length}</div>
                  <div className="text-sm text-purple-200">Unlocked</div>
                </div>
              </div>
              <h3 className="text-white font-semibold mb-2">Achievements</h3>
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      i < userStats.achievements.length
                        ? 'bg-gradient-to-r from-purple-400 to-pink-500'
                        : 'bg-slate-600'
                    } transition-all duration-300`}
                  ></div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            {/* Training Quest */}
            <div
              className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl cursor-pointer group hover:scale-105 transition-all duration-500 hover:shadow-3xl"
              onClick={() => router.push('/auth/dashboard/citizen/training')}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                    🎮 Training Quest
                  </h2>
                  <p className="text-blue-200">Master environmental skills</p>
                </div>
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-xl">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white font-semibold">Module Progress</span>
                  <span className="text-blue-300 font-bold">{moduleProgress.toFixed(0)}%</span>
                </div>
                <div className="relative w-full h-3 bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transition-all duration-2000 ease-out"
                    style={{ width: `${moduleProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                  </div>
                </div>
                <p className="text-blue-200 text-sm">
                  {userStats.totalModules - userStats.completedModules} modules remaining
                </p>
              </div>

              <div className="mt-6">
                <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                  Continue Learning Journey →
                </button>
              </div>
            </div>

            {/* My Courses */}
            <div
              className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl cursor-pointer group hover:scale-105 transition-all duration-500 hover:shadow-3xl"
              onClick={() => router.push('/auth/dashboard/citizen/courses')}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                    🎓 My Courses
                  </h2>
                  <p className="text-purple-200">Mandatory courses and certificates</p>
                </div>
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-xl">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-500/20 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-red-300">📋</div>
                    <div className="text-sm text-red-200">Mandatory</div>
                  </div>
                  <div className="bg-blue-500/20 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-blue-300">🏆</div>
                    <div className="text-sm text-blue-200">Certificates</div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                  View My Courses →
                </button>
              </div>
            </div>

            {/* Civic Reporting */}
            <div
              className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl cursor-pointer group hover:scale-105 transition-all duration-500 hover:shadow-3xl"
              onClick={() => router.push('/auth/dashboard/citizen/civic-report')}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2 group-hover:text-green-300 transition-colors">
                    🏛️ Civic Reporting
                  </h2>
                  <p className="text-green-200">Report and support community issues</p>
                </div>
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-xl">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-500/20 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-green-300">📍</div>
                    <div className="text-sm text-green-200">Report Issues</div>
                  </div>
                  <div className="bg-blue-500/20 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-blue-300">🗺️</div>
                    <div className="text-sm text-blue-200">View Map</div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                  Access Civic Platform →
                </button>
              </div>
            </div>

            {/* Community */}
            <div
              className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl cursor-pointer group hover:scale-105 transition-all duration-500 hover:shadow-3xl"
              onClick={() => router.push('/auth/dashboard/citizen/community')}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2 group-hover:text-pink-300 transition-colors">
                    💬 SWACHH VIKAS Community
                  </h2>
                  <p className="text-pink-200">Share posts, follow citizens, and explore</p>
                </div>
                <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-red-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-xl">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h8m-8 4h6" />
                  </svg>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-pink-500/20 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-pink-300">❤️</div>
                    <div className="text-sm text-pink-200">Like & Follow</div>
                  </div>
                  <div className="bg-blue-500/20 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-blue-300">📺</div>
                    <div className="text-sm text-blue-200">Image & Video Posts</div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button className="w-full bg-gradient-to-r from-pink-500 to-red-600 hover:from-pink-600 hover:to-red-700 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                  Open Community →
                </button>
              </div>
            </div>
          </div>

          {/* Additional Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            {/* Live Asset Tracker */}
            <div
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl cursor-pointer group hover:scale-105 transition-all duration-500"
              onClick={() => router.push('/auth/dashboard/citizen/track-assets')}
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">Live Asset Tracker</h3>
                  <p className="text-cyan-200 text-sm">Real-time waste vehicle locations</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-cyan-200 text-sm">Track collection vehicles</span>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>

            {/* Leaderboard */}
            <div
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl cursor-pointer group hover:scale-105 transition-all duration-500"
              onClick={() => router.push('/auth/dashboard/citizen/marketplace')}
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg mb-1">Waste Marketplace</h3>
                  <p className="text-blue-200 text-sm">List your waste and turn it into value</p>
                </div>
                <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Awareness Quizzes */}
            <div
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl cursor-pointer group hover:scale-105 transition-all duration-500"
              onClick={() => router.push('/auth/dashboard/citizen/quizzes')}
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <span className="text-3xl">📝</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg mb-1">Awareness Quizzes</h3>
                  <p className="text-blue-200 text-sm">Test knowledge and earn rewards</p>
                </div>
                <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Voucher Marketplace */}
            <div
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl cursor-pointer group hover:scale-105 transition-all duration-500"
              onClick={() => router.push('/auth/dashboard/citizen/vouchers')}
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <span className="text-3xl">🪙</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg mb-1">Voucher Marketplace</h3>
                  <p className="text-blue-200 text-sm">Redeem CleanCoins for vouchers</p>
                </div>
                <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            <div
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 cursor-pointer group"
              onClick={() => router.push('/auth/dashboard/citizen/leaderboard')}
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-yellow-300 transition-colors">Leaderboard</h3>
                  <p className="text-yellow-200 text-sm">Compare with other champions</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-yellow-200 text-sm">Your rank: #{userRank?.rank || 'N/A'}</span>
                <div className="flex space-x-1">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.7; }
            50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.6s ease-out forwards;
          }
          .animate-shimmer {
            animation: shimmer 2s infinite;
          }
        `}</style>
        {currentUserId && <NotificationPanel userId={currentUserId} />}
      </div>
    </RoleGuard>
  );
}
