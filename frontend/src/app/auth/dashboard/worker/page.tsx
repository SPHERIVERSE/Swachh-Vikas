'use client';

import RoleGuard from '@/components/RoleGuard';
import NotificationBell from '@/components/NotificationBell';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/utils/axiosInstance';
import axios from '@/utils/axiosInstance';

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

export default function WorkerDashboard() {
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

  // Live location indicator + background updates
  useEffect(() => {
    let watchId: number | null = null;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          try {
            await axios.post('/maps/worker-location', {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
          } catch {
            // ignore
          }
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    }
    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const xpPercentage = (userStats.xp / userStats.xpToNext) * 100;
  const moduleProgress =
    userStats.totalModules > 0
      ? (userStats.completedModules / userStats.totalModules) * 100
      : 0;

  if (loading) {
    return (
      <RoleGuard role="WORKER">
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-green-900 to-emerald-900">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 text-center border border-white/20 shadow-2xl">
            <div className="relative">
              <div className="animate-spin w-20 h-20 border-4 border-green-400 border-t-transparent rounded-full mx-auto mb-6"></div>
              <div className="absolute inset-0 animate-ping w-20 h-20 border-4 border-green-400/30 rounded-full mx-auto"></div>
            </div>
            <p className="text-white text-xl font-semibold">Loading Dashboard...</p>
            <p className="text-green-200 text-sm mt-2">Preparing your work environment</p>
          </div>
        </div>
      </RoleGuard>
    );
  }

  if (error) {
    return (
      <RoleGuard role="WORKER">
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
    <RoleGuard role="WORKER">
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-emerald-900 relative overflow-hidden">
        {/* Animated Background Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute w-2 h-2 bg-green-400/30 rounded-full animate-pulse"
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
        <div className="absolute top-20 left-20 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="relative z-10 p-6 space-y-8">
          {/* Header Section */}
          <div className="animate-fade-in-up">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
              <div className="flex flex-col lg:flex-row items-center justify-between space-y-6 lg:space-y-0">
                <div className="text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start space-x-3 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <span>
                          Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">Waste Warrior!</span>
                        </span>
                        <span className="inline-flex items-center gap-2 text-xs font-semibold bg-green-600/20 text-green-300 px-3 py-1 rounded-full">
                          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                          Live location ON
                        </span>
                      </h1>
                      <p className="text-green-200 text-lg">Your professional development center</p>
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
                    <p className="text-xs text-green-200 mt-2 font-semibold">Professional Level</p>
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
                    <p className="text-xs text-green-200 mt-2 font-semibold">Training Streak</p>
                  </div>
                </div>
              </div>

              {/* XP Progress Bar */}
              <div className="mt-8">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-white font-semibold text-lg">Professional Experience</span>
                  <span className="text-green-300 font-bold">
                    {userStats.xp.toLocaleString()} / {userStats.xpToNext.toLocaleString()} XP
                  </span>
                </div>
                <div className="relative w-full h-4 bg-slate-700/50 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 rounded-full transition-all duration-2000 ease-out relative"
                    style={{ width: `${xpPercentage}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                  </div>
                  <div className="absolute inset-0 rounded-full shadow-inner border border-white/10"></div>
                </div>
                <div className="flex justify-between text-xs text-green-200 mt-2">
                  <span>Current Level</span>
                  <span>{xpPercentage.toFixed(1)}% to next level</span>
                </div>
              </div>

              {/* Rank Display */}
              {userRank && (
                <div className="mt-6 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl border border-green-400/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold">#{userRank.rank}</span>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">Worker Ranking</h3>
                        <p className="text-green-200 text-sm">{userRank.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-300">{userRank.xp.toLocaleString()}</div>
                      <div className="text-xs text-green-200">Total XP</div>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
              <h3 className="text-white font-semibold mb-2">Professional XP</h3>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-slate-700/50 rounded-full h-2">
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full w-full animate-pulse"></div>
                </div>
                <span className="text-yellow-200 text-sm font-semibold">Active</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{userStats.achievements.length}</div>
                  <div className="text-sm text-emerald-200">Earned</div>
                </div>
              </div>
              <h3 className="text-white font-semibold mb-2">Certifications</h3>
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      i < userStats.achievements.length
                        ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                        : 'bg-slate-600'
                    } transition-all duration-300`}
                  ></div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            {/* Training Modules */}
            <div
              className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl cursor-pointer group hover:scale-105 transition-all duration-500 hover:shadow-3xl"
              onClick={() => router.push('/auth/dashboard/worker/training')}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2 group-hover:text-green-300 transition-colors">
                    📚 Professional Training
                  </h2>
                  <p className="text-green-200">Enhance your waste management skills</p>
                </div>
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-xl">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white font-semibold">Training Progress</span>
                  <span className="text-green-300 font-bold">{moduleProgress.toFixed(0)}%</span>
                </div>
                <div className="relative w-full h-3 bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-2000 ease-out"
                    style={{ width: `${moduleProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                  </div>
                </div>
                <p className="text-green-200 text-sm">
                  {userStats.totalModules - userStats.completedModules} modules remaining
                </p>
              </div>

              <div className="mt-6">
                <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                  Continue Professional Development →
                </button>
              </div>
            </div>

            {/* Performance Dashboard */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    📊 Performance Metrics
                  </h2>
                  <p className="text-blue-200">Track your daily achievements</p>
                </div>
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
                  </svg>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-500/20 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-300">✅</div>
                    <div className="text-sm text-green-200 mt-1">Tasks Complete</div>
                    <div className="text-lg font-bold text-white mt-1">12</div>
                  </div>
                  <div className="bg-blue-500/20 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-300">⚡</div>
                    <div className="text-sm text-blue-200 mt-1">Efficiency</div>
                    <div className="text-lg font-bold text-white mt-1">94%</div>
                  </div>
                </div>
                
                <div className="bg-yellow-500/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-yellow-200 text-sm font-semibold">Daily Goal</span>
                    <span className="text-yellow-300 font-bold">8/10</span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-2">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-1000" style={{ width: '80%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            {/* Leaderboard */}
            <div
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl cursor-pointer group hover:scale-105 transition-all duration-500"
              onClick={() => router.push('/auth/dashboard/worker/leaderboard')}
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-yellow-300 transition-colors">Worker Leaderboard</h3>
                  <p className="text-yellow-200 text-sm">Compare with fellow workers</p>
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

            {/* Quick Actions */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Quick Actions</h3>
                  <p className="text-purple-200 text-sm">Access frequently used tools</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button className="bg-purple-500/20 hover:bg-purple-500/30 rounded-lg p-3 text-center transition-colors" onClick={() => router.push('/auth/dashboard/worker/tasks')}>
                  <div className="text-lg">📋</div>
                  <div className="text-xs text-purple-200">Tasks</div>
                </button>
                <button className="bg-indigo-500/20 hover:bg-indigo-500/30 rounded-lg p-3 text-center transition-colors">
                  <div className="text-lg">📊</div>
                  <div className="text-xs text-indigo-200">Reports</div>
                </button>
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
      </div>
    </RoleGuard>
  );
}
