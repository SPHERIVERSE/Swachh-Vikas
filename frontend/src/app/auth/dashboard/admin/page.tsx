'use client';

import Link from 'next/link';
import RoleGuard from '@/components/RoleGuard';
import NotificationBell from '@/components/NotificationBell';
import NotificationPanel from '@/components/NotificationPanel';
import { useEffect, useState } from 'react';
import api from '@/utils/axiosInstance';

interface Particle {
  id: number;
  x: number;
  y: number;
  delay: number;
}

export default function AdminDashboard() {
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const userRes = await api.get('/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUserId(userRes.data.id);
      } catch (error) {
        console.error('Failed to fetch user info:', error);
      }
    };

    fetchUserInfo();

    // Generate particles for animation
    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 6,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <RoleGuard role="ADMIN">
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden">
        {/* Animated Background Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute w-2 h-2 bg-purple-400/30 rounded-full animate-pulse"
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
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="relative z-10 p-6 space-y-8">
          {/* Header Section */}
          <div className="animate-fade-in-up">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
              <div className="flex flex-col lg:flex-row items-center justify-between space-y-6 lg:space-y-0">
                <div className="text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start space-x-3 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-white">
                        Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Admin!</span>
                      </h1>
                      <p className="text-purple-200 text-lg">Manage and oversee the platform</p>
                    </div>
                  </div>
                </div>
                
                {/* Notification Bell */}
                <div className="flex items-center space-x-4">
                  {currentUserId && <NotificationBell userId={currentUserId} />}
                </div>
              </div>
            </div>
          </div>

          {/* Management Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Link href="/auth/dashboard/admin/training">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 cursor-pointer group">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">📚</span>
                  </div>
                  <h2 className="text-xl font-semibold text-white group-hover:text-blue-300 transition-colors">Training Modules</h2>
                </div>
                <p className="text-blue-200 text-sm">Manage modules, flashcards, videos, and quizzes</p>
              </div>
            </Link>

            <Link href="/auth/dashboard/admin/users">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 cursor-pointer group">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">👥</span>
                  </div>
                  <h2 className="text-xl font-semibold text-white group-hover:text-green-300 transition-colors">Users</h2>
                </div>
                <p className="text-green-200 text-sm">View and manage all registered users</p>
              </div>
            </Link>

            <Link href="/auth/dashboard/admin/courses">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 cursor-pointer group">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">🎓</span>
                  </div>
                  <h2 className="text-xl font-semibold text-white group-hover:text-indigo-300 transition-colors">Courses</h2>
                </div>
                <p className="text-indigo-200 text-sm">Create and manage mandatory and miscellaneous courses</p>
              </div>
            </Link>

            <Link href="/auth/dashboard/admin/reports">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 cursor-pointer group">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">📊</span>
                  </div>
                  <h2 className="text-xl font-semibold text-white group-hover:text-yellow-300 transition-colors">Reports</h2>
                </div>
                <p className="text-yellow-200 text-sm">View and manage civic reports submitted by citizens</p>
              </div>
            </Link>

            <Link href="/auth/dashboard/admin/assets">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 cursor-pointer group">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">📍</span>
                  </div>
                  <h2 className="text-xl font-semibold text-white group-hover:text-purple-300 transition-colors">Manage Assets</h2>
                </div>
                <p className="text-purple-200 text-sm">Add, edit, or delete public facilities and waste vehicles</p>
              </div>
            </Link>

            <Link href="/auth/dashboard/admin/csr-funds">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 cursor-pointer group">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">💰</span>
                  </div>
                  <h2 className="text-xl font-semibold text-white group-hover:text-emerald-300 transition-colors">CSR Funds</h2>
                </div>
                <p className="text-emerald-200 text-sm">View all CSR funds from businesses</p>
              </div>
            </Link>
          </div>
        </div>

        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.7; }
            50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
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
        `}</style>
        {currentUserId && <NotificationPanel userId={currentUserId} />}
      </div>
    </RoleGuard>
  );
}
