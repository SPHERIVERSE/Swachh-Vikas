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

export default function WorkerLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [currentUser, setCurrentUser] = useState<LeaderboardUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [particles, setParticles] = useState<Particle[]>([]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null;

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/training/leaderboard', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const users: LeaderboardUser[] = res.data || [];
      const workerUsers = users.filter(u => u.role === 'WORKER');
      setLeaderboard(workerUsers);

      if (currentUserId) {
        const me = workerUsers.find(u => u.id === currentUserId) || (await fetchMyRank(currentUserId));
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
      return me.role === 'WORKER' ? me : null;
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
      <RoleGuard role="WORKER">
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
          <div className="game-card p-8 text-center">
            <div className="animate-spin w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white text-xl">Loading leaderboard...</p>
          </div>
        </div>
      </RoleGuard>
    );
  }

  if (error) {
    return (
      <RoleGuard role="WORKER">
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
          <div className="game-card p-8 text-center border-red-500/50 bg-red-900/20">
            <p className="text-red-400 text-xl mb-4">{error}</p>
            <button onClick={fetchLeaderboard} className="game-button px-6 py-3">
              Retry
            </button>
          </div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard role="WORKER">
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
        {/* Particles */}
        <div className="particles">
          {particles.map(p => (
            <div
              key={p.id}
              className="particle"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 p-6 space-y-8">
          {/* Header */}
          <div className="slide-in-up">
            <div className="game-card p-8 text-center bg-green-900/10 border border-green-500/30">
              <h1 className="text-4xl font-bold text-white mb-2">🌟 Worker Leaderboard</h1>
              <p className="text-gray-300 text-lg">
                See how you rank among fellow Green Workers!
              </p>
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="game-card p-8 slide-in-left bg-green-900/10 border border-green-500/30">
            <div className="overflow-x-auto">
              <table className="min-w-full text-white">
                <thead>
                  <tr className="text-green-300 border-b border-slate-700">
                    <th className="py-3 px-4 text-left">Rank</th>
                    <th className="py-3 px-4 text-left">Worker</th>
                    <th className="py-3 px-4 text-right">XP</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((user, idx) => (
                    <tr
                      key={`${user.id}-${idx}`}
                      className={`border-b border-slate-800 hover:bg-slate-800/30 transition ${
                        idx < 3 ? 'text-yellow-300 font-bold' : ''
                      } ${user.id === currentUserId ? 'bg-green-800/30' : ''}`}
                    >
                      <td className="py-3 px-4">{idx + 1}</td>
                      <td className="py-3 px-4 flex items-center space-x-3">
                        {idx === 0 && <span className="text-2xl">👑</span>}
                        {idx === 1 && <span className="text-2xl">🥈</span>}
                        {idx === 2 && <span className="text-2xl">🥉</span>}
                        <span>{user.name}{user.id === currentUserId && ' (You)'}</span>
                      </td>
                      <td className="py-3 px-4 text-right">{user.xp} XP</td>
                    </tr>
                  ))}

                  {/* Current user if not in top list */}
                  {currentUser && !leaderboard.some(u => u.id === currentUser.id) && (
                    <tr className="bg-green-800/30 border-t-2 border-green-500/50">
                      <td className="py-3 px-4">{currentUser.rank}</td>
                      <td className="py-3 px-4 flex items-center space-x-3">
                        <span>{currentUser.name} (You)</span>
                      </td>
                      <td className="py-3 px-4 text-right">{currentUser.xp} XP</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* CTA */}
          <div className="slide-in-right">
            <div className="game-card p-8 text-center bg-green-900/10 border border-green-500/30">
              <h2 className="text-2xl font-bold text-white mb-4">🚀 Want to climb higher?</h2>
              <button
                className="game-button px-8 py-4 text-lg font-bold"
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

