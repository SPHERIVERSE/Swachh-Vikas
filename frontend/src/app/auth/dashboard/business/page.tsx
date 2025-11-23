'use client';

import RoleGuard from '@/components/RoleGuard';
import NotificationBell from '@/components/NotificationBell';
import NotificationPanel from '@/components/NotificationPanel';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/utils/axiosInstance';

interface Particle {
  id: number;
  x: number;
  y: number;
  delay: number;
}

export default function BusinessDashboard() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      api.get('/users/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setCurrentUserId(res.data.id))
        .catch(() => router.push('/auth/login'));
    }

    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 6,
    }));
    setParticles(newParticles);
  }, [router]);

  return (
    <RoleGuard role="BUSINESS">
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 relative overflow-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                animationDelay: `${particle.delay}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Business Dashboard</h1>
              <p className="text-emerald-200">Manage CSR, Drives, Quizzes & Marketplace</p>
            </div>
            {currentUserId && <NotificationBell userId={currentUserId} />}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all">
              <div className="text-3xl mb-2">💰</div>
              <h3 className="text-white font-semibold mb-1">CSR Funds</h3>
              <p className="text-emerald-200 text-sm">Manage sponsorships</p>
              <button
                onClick={() => router.push('/auth/dashboard/business/csr')}
                className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg transition-colors"
              >
                Manage
              </button>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all">
              <div className="text-3xl mb-2">🚀</div>
              <h3 className="text-white font-semibold mb-1">Community Drives</h3>
              <p className="text-emerald-200 text-sm">Organize events</p>
              <button
                onClick={() => router.push('/auth/dashboard/business/drives')}
                className="mt-4 w-full bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg transition-colors"
              >
                Manage
              </button>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all">
              <div className="text-3xl mb-2">📝</div>
              <h3 className="text-white font-semibold mb-1">Awareness Quizzes</h3>
              <p className="text-emerald-200 text-sm">Create & manage</p>
              <button
                onClick={() => router.push('/auth/dashboard/business/quizzes')}
                className="mt-4 w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2 rounded-lg transition-colors"
              >
                Manage
              </button>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all">
              <div className="text-3xl mb-2">🛒</div>
              <h3 className="text-white font-semibold mb-1">Marketplace</h3>
              <p className="text-emerald-200 text-sm">Browse waste listings</p>
              <button
                onClick={() => router.push('/auth/dashboard/business/marketplace')}
                className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors"
              >
                Browse
              </button>
            </div>
          </div>

          {/* Additional Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all">
              <div className="text-3xl mb-2">🪙</div>
              <h3 className="text-white font-semibold mb-1">Voucher Management</h3>
              <p className="text-emerald-200 text-sm">Create vouchers for citizens</p>
              <button
                onClick={() => router.push('/auth/dashboard/business/vouchers')}
                className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors"
              >
                Manage Vouchers
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/auth/dashboard/business/csr')}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
                >
                  Create CSR Fund
                </button>
                <button
                  onClick={() => router.push('/auth/dashboard/business/drives')}
                  className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
                >
                  Organize Community Drive
                </button>
                <button
                  onClick={() => router.push('/auth/dashboard/business/quizzes')}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
                >
                  Create Awareness Quiz
                </button>
                <button
                  onClick={() => router.push('/auth/dashboard/business/vouchers')}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
                >
                  Create Voucher
                </button>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">Community Posts</h2>
              <p className="text-emerald-200 mb-4">Share updates and engage with the community</p>
              <button
                onClick={() => router.push('/auth/dashboard/citizen/community')}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
              >
                Go to Community Feed
              </button>
            </div>
          </div>
        </div>
        {currentUserId && <NotificationPanel userId={currentUserId} />}
      </div>
    </RoleGuard>
  );
}

