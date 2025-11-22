'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/axiosInstance';
import RoleGuard from '@/components/RoleGuard';
import NotificationBell from '@/components/NotificationBell';

type Module = {
  id: string;
  title: string;
  role: string;
  flashcards?: any[];
  videos?: any[];
  quizzes?: any[];
  userProgress?: any[];
};

export default function CitizenTrainingPage() {
  const router = useRouter();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  // Fetch modules
  const fetchModules = async () => {
    try {
      const res = await api.get('/training/modules', {
        headers: { Authorization: `Bearer ${token}` },
        params: { role: 'CITIZEN' },
      });
      const sorted = [...res.data].sort((a: any, b: any) => {
        const na = parseInt(String(a.title).match(/\d+/)?.[0] || '0', 10);
        const nb = parseInt(String(b.title).match(/\d+/)?.[0] || '0', 10);
        if (isNaN(na) && isNaN(nb)) return String(a.title).localeCompare(String(b.title));
        if (isNaN(na)) return 1;
        if (isNaN(nb)) return -1;
        if (na !== nb) return na - nb;
        return String(a.title).localeCompare(String(b.title));
      });
      setModules(sorted);
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to fetch modules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
    
    const fetchUserInfo = async () => {
      try {
        const userRes = await api.get('/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUserId(userRes.data.id);
      } catch (error) {
        console.error('Failed to fetch user info:', error);
      }
    };
    
    if (token) {
      fetchUserInfo();
    }
  }, []);

  // Calculate progress for a module
  const getModuleProgress = (module: Module) => {
    const totalItems = (module.flashcards?.length || 0) + (module.videos?.length || 0) + (module.quizzes?.length || 0);
    const progress = module.userProgress?.[0];
    const completed = !!progress?.completed;
    const completedItems = completed ? totalItems : 0;
    const xp = progress?.xpEarned || 0;
    return { completed: completedItems, total: totalItems, xp, isCompleted: completed };
  };

  const getModuleReward = (index: number) => {
    const rewards = [
      { xp: 100, badge: '🌱 Beginner' },
      { xp: 150, badge: '♻️ Recycler' },
      { xp: 200, badge: '🌍 Earth Guardian' },
      { xp: 250, badge: '⚡ Eco Warrior' },
      { xp: 300, badge: '🏆 Green Master' },
    ];
    return rewards[index % rewards.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 text-center border border-white/20 shadow-2xl animate-fade-in">
          <div className="relative">
            <div className="animate-spin w-20 h-20 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-6"></div>
            <div className="absolute inset-0 animate-ping w-20 h-20 border-4 border-blue-400/30 rounded-full mx-auto"></div>
          </div>
          <p className="text-white text-xl font-semibold">Loading Training...</p>
          <p className="text-blue-200 text-sm mt-2">Preparing your learning journey</p>
        </div>
      </div>
    );
  }

  const completedModules = modules.filter((m) => m.userProgress?.[0]?.completed);

  return (
    <RoleGuard role="CITIZEN">
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-6 relative overflow-hidden">
        {/* Animated Background Orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="max-w-7xl mx-auto space-y-8 relative z-10">

          {/* Header */}
          <div className="animate-fade-in-up">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex-1 text-center">
                  <h1 className="text-5xl font-bold text-white mb-4">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Your Training Quest</span>
                  </h1>
                  <p className="text-xl text-blue-200 mb-6">Master the art of waste management and become an Eco Champion!</p>
                </div>
                {currentUserId && (
                  <div className="ml-4">
                    <NotificationBell userId={currentUserId} />
                  </div>
                )}
              </div>

              <div className="flex justify-center items-center space-x-8">
                <div className="text-center bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="text-3xl font-bold text-green-400">{completedModules.length}</div>
                  <div className="text-green-200 text-sm">Completed</div>
                </div>
                <div className="text-center bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="text-3xl font-bold text-purple-400">{modules.length - completedModules.length}</div>
                  <div className="text-purple-200 text-sm">Remaining</div>
                </div>
                <div className="text-center bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="text-3xl font-bold text-yellow-400">
                    {modules.reduce((sum, m) => sum + (m.userProgress?.[0]?.xpEarned || 0), 0)}
                  </div>
                  <div className="text-yellow-200 text-sm">Total XP</div>
                </div>
              </div>
            </div>
          </div>

          {message && (
            <div className="bg-red-900/20 backdrop-blur-xl p-4 rounded-xl border border-red-400/30 shadow-2xl animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <p className="text-red-400 text-center">{message}</p>
            </div>
          )}

          {/* Training Roadmap */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <h2 className="text-3xl font-bold text-white mb-6 text-center">🗺️ Your Learning Journey</h2>
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-green-500 via-purple-500 to-gray-600 rounded-full shadow-lg z-0 animate-gradient-pulse"></div>
              <div className="space-y-16">
                {modules.map((module, index) => {
                  const progress = getModuleProgress(module);
                  const reward = getModuleReward(index);
                  const isCompleted = progress.isCompleted;
                  const isLocked = index > 0 && !getModuleProgress(modules[index - 1]).isCompleted;
                  const progressPercentage = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

                  return (
                    <div key={module.id} className={`relative flex items-center ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                      {/* Node on the line */}
                      <div className={`absolute left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full border-4 ${
                        isCompleted ? 'bg-green-500 border-green-400' : isLocked ? 'bg-gray-600 border-gray-500' : 'bg-purple-500 border-purple-400'
                      } z-10 flex items-center justify-center`}>
                        {isCompleted && <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></div>}
                        {!isCompleted && !isLocked && (
                            <svg className="w-4 h-4 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        )}
                        {isLocked && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        )}
                      </div>

                      {/* Module Card */}
                      <div
                        className={`bg-white/10 backdrop-blur-xl rounded-3xl p-6 w-full max-w-lg border border-white/20 shadow-2xl cursor-pointer transition-all duration-500 relative z-20 ${
                          isLocked ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'hover:scale-105 hover:shadow-3xl'
                        }`}
                        onClick={() => !isLocked && router.push(`/auth/dashboard/citizen/training/${module.id}`)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-lg ${
                              isCompleted ? 'bg-gradient-to-br from-green-500 to-emerald-600' : isLocked ? 'bg-gray-700' : 'bg-gradient-to-br from-blue-500 to-purple-600'
                            }`}>
                              {isCompleted ? '✅' : '🎯'}
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold text-white">{module.title}</h3>
                              <p className="text-blue-200 text-sm">Module {index + 1}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-yellow-400 text-xl font-bold">+{reward.xp} XP</div>
                            <div className="text-xs text-yellow-200">{reward.badge}</div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-white text-sm">Progress</span>
                            <span className="text-blue-300 text-sm">{progress.completed}/{progress.total}</span>
                          </div>
                          <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden shadow-inner">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 relative ${
                                isCompleted ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-blue-400 to-purple-500'
                              }`}
                              style={{ width: `${progressPercentage}%` }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center text-sm">
                          <div><div className="text-blue-400 font-bold">{module.flashcards?.length || 0}</div><div className="text-blue-200">Cards</div></div>
                          <div><div className="text-green-400 font-bold">{module.videos?.length || 0}</div><div className="text-green-200">Videos</div></div>
                          <div><div className="text-purple-400 font-bold">{module.quizzes?.length || 0}</div><div className="text-purple-200">Quizzes</div></div>
                        </div>

                        <div className="mt-6">
                          {isLocked ? (
                            <button className="w-full py-4 bg-gray-700 text-gray-400 rounded-xl cursor-not-allowed font-semibold text-lg">🔒 Complete Previous Module</button>
                          ) : isCompleted ? (
                            <button className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">✅ Review Module</button>
                          ) : (
                            <button className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">🚀 Start Module</button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
              <h2 className="text-3xl font-bold text-white mb-6 text-center">🏆 Your Achievements</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { emoji: '🥇', title: 'First Steps', desc: 'Complete your first module', unlocked: completedModules.length > 0, color: 'yellow' },
                  { emoji: '🧠', title: 'Quiz Master', desc: 'Complete 3 modules', unlocked: completedModules.length >= 3, color: 'purple' },
                  { emoji: '🌱', title: 'Eco Warrior', desc: 'Complete 5 training modules', unlocked: completedModules.length >= 5, color: 'green' },
                ].map((ach, idx) => (
                  <div key={idx} className={`text-center p-6 rounded-2xl border transition-all duration-300 transform hover:scale-105 ${ach.unlocked ? `bg-gradient-to-br from-${ach.color}-500/20 to-${ach.color}-500/20 border-${ach.color}-400/30 shadow-lg` : `bg-white/5 border-gray-700/50`}`}>
                    <div className="text-5xl mb-3">{ach.emoji}</div>
                    <div className={`text-xl font-bold ${ach.unlocked ? `text-${ach.color}-400` : 'text-gray-400'} mb-2`}>{ach.title}</div>
                    <div className="text-blue-200 text-sm mb-2">{ach.desc}</div>
                    {ach.unlocked ? <div className={`mt-2 text-xs font-bold text-${ach.color}-300 animate-pulse`}>✅ UNLOCKED</div> : <div className="mt-2 text-xs text-gray-500 font-bold">LOCKED</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        <style jsx>{`
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
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes gradient-pulse {
            0%, 100% { filter: brightness(1.2); }
            50% { filter: brightness(1.5); }
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.6s ease-out forwards;
          }
          .animate-fade-in {
            animation: fade-in 0.6s ease-out forwards;
          }
          .animate-shimmer {
            animation: shimmer 2s infinite linear;
          }
          .animate-gradient-pulse {
            animation: gradient-pulse 3s infinite ease-in-out;
          }
        `}</style>
      </div>
    </RoleGuard>
  );
}
