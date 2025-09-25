'use client';

import RoleGuard from '@/components/RoleGuard';
import { useEffect, useState } from 'react';
import api from '@/utils/axiosInstance';

interface LeaderboardUser {
  id: string;
  name: string;
  xp: number;
  role: string;
  rank?: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  delay: number;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [currentUser, setCurrentUser] = useState<LeaderboardUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [particles, setParticles] = useState<Particle[]>([]);

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const currentUserId =
    typeof window !== 'undefined' ? localStorage.getItem('user_id') : null;

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/training/leaderboard', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const users: LeaderboardUser[] = res.data || [];

      // Only keep CITIZEN users
      const citizenUsers = users.filter((u) => u.role === 'CITIZEN');
      setLeaderboard(citizenUsers);

      if (currentUserId) {
        const me =
          citizenUsers.find((u) => u.id === currentUserId) ||
          (await fetchMyRank(currentUserId));
        setCurrentUser(me || null);
      }

      setError('');
    } catch (err) {
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRank = async (userId: string) => {
    try {
      const res = await api.get(`/training/my-rank`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const me: LeaderboardUser = res.data;
      return me.role === 'CITIZEN' ? me : null; // only return if citizen
    } catch {
      return null;
    }
  };

  useEffect(() => {
    fetchLeaderboard();

    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 6,
    }));
    setParticles(newParticles);
  }, []);

  if (loading) {
    return (
      <RoleGuard role="CITIZEN">
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 text-center border border-white/20 shadow-2xl animate-fade-in">
            <div className="relative">
              <div className="animate-spin w-20 h-20 border-4 border-purple-400 border-t-transparent rounded-full mx-auto mb-6"></div>
              <div className="absolute inset-0 animate-ping w-20 h-20 border-4 border-purple-400/30 rounded-full mx-auto"></div>
            </div>
            <p className="text-white text-xl font-semibold">Loading Leaderboard...</p>
            <p className="text-purple-200 text-sm mt-2">Summoning the champions</p>
          </div>
        </div>
      </RoleGuard>
    );
  }

  if (error) {
    return (
      <RoleGuard role="CITIZEN">
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 text-center border border-white/20 shadow-2xl animate-fade-in">
            <p className="text-red-400 text-xl mb-4">{error}</p>
            <button onClick={fetchLeaderboard} className="bg-white/10 text-white font-semibold py-3 px-6 rounded-xl transition-transform duration-300 hover:scale-105 hover:bg-white/20">
              Retry
            </button>
          </div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard role="CITIZEN">
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
        {/* Animated Background Orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="relative z-10 p-6 space-y-8">
          {/* Header */}
          <div className="animate-fade-in-down">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl text-center">
              <h1 className="text-4xl font-bold text-white mb-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">🌟 Citizen Leaderboard 🌟</span>
              </h1>
              <p className="text-gray-300 text-lg">
                See how you rank among fellow Eco Champions!
              </p>
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="animate-fade-in-up">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
              <div className="overflow-x-auto">
                <table className="min-w-full text-white">
                  <thead>
                    <tr className="text-purple-300 border-b border-slate-700">
                      <th className="py-3 px-4 text-left">Rank</th>
                      <th className="py-3 px-4 text-left">Player</th>
                      <th className="py-3 px-4 text-right">XP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((user, idx) => (
                      <tr
                        key={`${user.id}-${idx}`}
                        className={`border-b border-slate-800 transition-all duration-300 hover:bg-slate-800/30 ${
                          idx < 3 ? 'text-yellow-300 font-bold' : ''
                        } ${user.id === currentUserId ? 'bg-purple-800/30' : ''}`}
                      >
                        <td className="py-3 px-4 text-lg">{idx + 1}</td>
                        <td className="py-3 px-4 flex items-center space-x-3 text-lg">
                          {idx === 0 && <span className="text-2xl">👑</span>}
                          {idx === 1 && <span className="text-2xl">🥈</span>}
                          {idx === 2 && <span className="text-2xl">🥉</span>}
                          <span>
                            {user.name}
                            {user.id === currentUserId && ' (You)'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-lg">{user.xp} XP</td>
                      </tr>
                    ))}

                    {/* Current user row if not in top list */}
                    {currentUser &&
                      !leaderboard.some((u) => u.id === currentUser.id) && (
                        <tr className="bg-purple-800/30 border-t-2 border-purple-500/50 animate-fade-in">
                          <td className="py-3 px-4 text-lg">{currentUser.rank}</td>
                          <td className="py-3 px-4 flex items-center space-x-3 text-lg">
                            <span>{currentUser.name} (You)</span>
                          </td>
                          <td className="py-3 px-4 text-right text-lg">
                            {currentUser.xp} XP
                          </td>
                        </tr>
                      )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="animate-fade-in-up">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl text-center">
              <h2 className="text-2xl font-bold text-white mb-4">
                🚀 Want to climb higher?
              </h2>
              <button
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                onClick={fetchLeaderboard}
              >
                Refresh Leaderboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
