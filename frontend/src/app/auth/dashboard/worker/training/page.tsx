'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/axiosInstance';
import RoleGuard from '@/components/RoleGuard';

type Module = {
  id: string;
  title: string;
  role: string;
  flashcards?: any[];
  videos?: any[];
  quizzes?: any[];
  userProgress?: any[];
};

export default function WorkerTrainingPage() {
  const router = useRouter();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const fetchModules = async () => {
    try {
      const res = await api.get('/training/modules', {
        headers: { Authorization: `Bearer ${token}` },
        params: { role: 'WORKER' },
      });
      setModules(res.data);
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to fetch modules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 flex items-center justify-center">
        <div className="game-card p-8 text-center">
          <div className="animate-spin w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading your training modules...</p>
        </div>
      </div>
    );
  }

  const completedModules = modules.filter((m) => m.userProgress?.[0]?.completed);

  return (
    <RoleGuard role="WORKER">
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Header */}
          <div className="slide-in-up">
            <div className="game-card p-8 text-center">
              <h1 className="text-5xl font-bold text-white mb-4">
                🎮 <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-400">Training Quest</span>
              </h1>
              <p className="text-xl text-gray-300 mb-6">Master your skills and become a Waste Management Expert!</p>

              <div className="flex justify-center items-center space-x-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">{completedModules.length}</div>
                  <div className="text-gray-400">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-300">{modules.length - completedModules.length}</div>
                  <div className="text-gray-400">Remaining</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400">
                    {modules.reduce((sum, m) => sum + (m.userProgress?.[0]?.xpEarned || 0), 0)}
                  </div>
                  <div className="text-gray-400">Total XP</div>
                </div>
              </div>
            </div>
          </div>

          {message && (
            <div className="game-card p-4 border-red-500/50 bg-red-900/20">
              <p className="text-red-400 text-center">{message}</p>
            </div>
          )}

          {/* Training Roadmap */}
          <div className="slide-in-left">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">🗺️ Your Learning Journey</h2>
            <div className="relative">
              <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-green-500 via-teal-500 to-gray-600 rounded-full"></div>
              <div className="space-y-8">
                {modules.map((module, index) => {
                  const progress = getModuleProgress(module);
                  const reward = getModuleReward(index);
                  const isCompleted = progress.isCompleted;
                  const isLocked = index > 0 && !getModuleProgress(modules[index - 1]).isCompleted;
                  const progressPercentage = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

                  return (
                    <div key={module.id} className={`relative flex items-center ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                      <div
                        className={`game-card p-6 w-full max-w-md cursor-pointer transition-all duration-500 ${
                          isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                        } ${isCompleted ? 'border-green-500/50 bg-green-900/10' : ''}`}
                        onClick={() => !isLocked && router.push(`/auth/dashboard/worker/training/${module.id}`)}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                              isCompleted ? 'bg-green-500' : isLocked ? 'bg-gray-600' : 'bg-teal-500'
                            }`}>{isCompleted ? '✅' : isLocked ? '🔒' : '🎯'}</div>
                            <div>
                              <h3 className="text-xl font-bold text-white">{module.title}</h3>
                              <p className="text-gray-400 text-sm">Module {index + 1}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-yellow-400 font-bold">+{reward.xp} XP</div>
                            <div className="text-xs text-gray-400">{reward.badge}</div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-white text-sm">Progress</span>
                            <span className="text-green-300 text-sm">{progress.completed}/{progress.total}</span>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-1000 ${
                                isCompleted ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gradient-to-r from-teal-400 to-green-400'
                              }`}
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center text-sm">
                          <div><div className="text-blue-400 font-bold">{module.flashcards?.length || 0}</div><div className="text-gray-400">Cards</div></div>
                          <div><div className="text-green-400 font-bold">{module.videos?.length || 0}</div><div className="text-gray-400">Videos</div></div>
                          <div><div className="text-teal-400 font-bold">{module.quizzes?.length || 0}</div><div className="text-gray-400">Quizzes</div></div>
                        </div>

                        <div className="mt-4">
                          {isLocked ? (
                            <button className="w-full py-3 bg-gray-600 text-gray-400 rounded-xl cursor-not-allowed">🔒 Complete Previous Module</button>
                          ) : isCompleted ? (
                            <button className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold">✅ Review Module</button>
                          ) : (
                            <button className="game-button w-full py-3 font-bold">🚀 Start Module</button>
                          )}
                        </div>
                      </div>

                      <div className={`absolute left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full border-4 ${
                        isCompleted ? 'bg-green-500 border-green-400' : isLocked ? 'bg-gray-600 border-gray-500' : 'bg-teal-500 border-teal-400'
                      } z-10`}>
                        {isCompleted && <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="slide-in-right">
            <div className="game-card p-8">
              <h2 className="text-3xl font-bold text-white mb-6 text-center">🏆 Your Achievements</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { emoji: '🥇', title: 'First Steps', desc: 'Complete your first module', unlocked: completedModules.length > 0, color: 'green' },
                  { emoji: '🧠', title: 'Quiz Master', desc: 'Complete 3 modules', unlocked: completedModules.length >= 3, color: 'teal' },
                  { emoji: '🌱', title: 'Eco Warrior', desc: 'Complete 5 training modules', unlocked: completedModules.length >= 5, color: 'green' },
                ].map((ach, idx) => (
                  <div key={idx} className={`text-center p-6 bg-gradient-to-br from-${ach.color}-500/20 to-${ach.color}-500/20 rounded-xl border transition-all duration-300 ${ach.unlocked ? `border-${ach.color}-500/50 shadow-lg shadow-${ach.color}-500/20` : `border-${ach.color}-500/20`}`}>
                    <div className="text-4xl mb-3">{ach.emoji}</div>
                    <div className={`text-xl font-bold text-${ach.color}-400 mb-2`}>{ach.title}</div>
                    <div className="text-gray-300 text-sm">{ach.desc}</div>
                    {ach.unlocked && <div className={`mt-2 text-xs text-${ach.color}-300 font-bold`}>✅ UNLOCKED</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </RoleGuard>
  );
}

