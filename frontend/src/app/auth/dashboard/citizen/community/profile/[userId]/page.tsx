'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/utils/axiosInstance';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  totalXp: number;
  role: string;
  createdAt: string;
  stats: {
    completedModules: number;
    totalModules: number;
    completedCourses: number;
    reportsCreated: number;
    postsCreated: number;
    followersCount: number;
    followingCount: number;
    completionRate: number;
  };
  rank: {
    rank: number;
    totalUsers: number;
    percentile: number;
  };
  courseCompletions: Array<{
    id: string;
    completedAt: string;
    certificateUrl: string;
    course: {
      id: string;
      title: string;
      isMandatory: boolean;
    };
  }>;
  moduleProgress: Array<{
    id: string;
    completed: boolean;
    xpEarned: number;
    completedAt?: string;
    module: {
      id: string;
      title: string;
    };
  }>;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'activity'>('overview');

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const meRes = await api.get('/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const isSelf = meRes.data?.id === userId;

      if (isSelf) {
        const [statsRes, rankRes] = await Promise.all([
          api.get(`/users/me/stats`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get(`/users/me/rank`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setProfile({
          ...statsRes.data,
          rank: rankRes.data,
        });
      } else {
        const communityRes = await api.get(`/community/profile/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile({
          id: communityRes.data.id,
          name: communityRes.data.name || communityRes.data.username || 'User',
          email: '',
          avatarUrl: communityRes.data.avatarUrl,
          bio: communityRes.data.bio,
          totalXp: 0,
          role: '',
          createdAt: '',
          stats: {
            completedModules: 0,
            totalModules: 0,
            completedCourses: 0,
            reportsCreated: 0,
            postsCreated: 0,
            followersCount: communityRes.data.followers || 0,
            followingCount: communityRes.data.followings || 0,
            completionRate: 0,
          },
          rank: { rank: 0, totalUsers: 0, percentile: 0 },
          courseCompletions: [],
          moduleProgress: [],
        });
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  const getLevelFromXp = (xp: number) => {
    return Math.floor(Math.sqrt(xp / 50)) + 1;
  };

  const getXpToNextLevel = (xp: number) => {
    const currentLevel = getLevelFromXp(xp);
    const nextLevelXp = Math.pow(currentLevel, 2) * 50;
    return Math.max(0, nextLevelXp - xp);
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { text: '🥇 #1', color: 'text-yellow-400' };
    if (rank === 2) return { text: '🥈 #2', color: 'text-gray-300' };
    if (rank === 3) return { text: '🥉 #3', color: 'text-orange-400' };
    if (rank <= 10) return { text: `🏆 #${rank}`, color: 'text-purple-400' };
    if (rank <= 50) return { text: `⭐ #${rank}`, color: 'text-blue-400' };
    return { text: `#${rank}`, color: 'text-gray-400' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Profile not found</div>
      </div>
    );
  }

  const rankBadge = profile.rank?.rank ? getRankBadge(profile.rank.rank) : { text: '', color: '' };
  const level = getLevelFromXp(profile.totalXp || 0);
  const xpToNext = getXpToNextLevel(profile.totalXp || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white mb-4 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>
        </div>

        {/* Profile Header */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-8 border border-white/20 mb-6">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-3xl">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{profile.name}</h1>
              <p className="text-gray-300 mb-4">{profile.bio || 'No bio available'}</p>
              <div className="flex items-center space-x-4">
                {rankBadge.text && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${rankBadge.color} bg-white/10`}>
                    {rankBadge.text}
                  </span>
                )}
                {profile.rank?.percentile !== undefined && (
                  <span className="text-gray-400 text-sm">
                    Top {profile.rank.percentile.toFixed(1)}% of {profile.rank.totalUsers} users
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">L{level}</div>
              <div className="text-gray-300 text-sm">Level</div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((profile.totalXp - (Math.pow(level - 1, 2) * 50)) / (Math.pow(level, 2) * 50 - Math.pow(level - 1, 2) * 50)) * 100}%` }}
                ></div>
              </div>
              <div className="text-gray-400 text-xs mt-1">{xpToNext} XP to next level</div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">{profile.totalXp}</div>
              <div className="text-gray-300 text-sm">Total XP</div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">{profile.stats.completedCourses}</div>
              <div className="text-gray-300 text-sm">Certificates</div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">{profile.stats.reportsCreated}</div>
              <div className="text-gray-300 text-sm">Reports</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 mb-6">
          <div className="flex border-b border-white/20">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'achievements', label: 'Achievements' },
              { id: 'activity', label: 'Activity' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-purple-400 border-b-2 border-purple-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Progress Stats</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Modules Completed</span>
                      <span className="text-white font-semibold">
                        {profile.stats.completedModules}/{profile.stats.totalModules}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Completion Rate</span>
                      <span className="text-green-400 font-semibold">
                        {profile.stats.completionRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Community Posts</span>
                      <span className="text-blue-400 font-semibold">{profile.stats.postsCreated}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Followers</span>
                      <span className="text-purple-400 font-semibold">{profile.stats.followersCount}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Leaderboard Position</h3>
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-center">
                      {rankBadge.text ? (
                        <>
                          <div className={`text-4xl font-bold ${rankBadge.color} mb-2`}>
                            {rankBadge.text}
                          </div>
                          <div className="text-gray-300 text-sm">
                            Out of {profile.rank.totalUsers} users
                          </div>
                          <div className="text-gray-400 text-xs mt-2">
                            Better than {profile.rank.percentile.toFixed(1)}% of users
                          </div>
                        </>
                      ) : (
                        <div className="text-gray-400">Rank data not available</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'achievements' && (
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Certificates & Achievements</h3>
                {profile.courseCompletions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.courseCompletions.map((completion) => (
                      <div
                        key={completion.id}
                        className="bg-white/5 rounded-lg p-4 border border-white/10"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-semibold">{completion.course.title}</h4>
                          {completion.course.isMandatory && (
                            <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                              MANDATORY
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm mb-2">
                          Completed: {new Date(completion.completedAt).toLocaleDateString()}
                        </p>
                        {completion.certificateUrl && (
                          <button className="text-purple-400 hover:text-purple-300 text-sm font-medium">
                            Download Certificate
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    No certificates earned yet
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {profile.moduleProgress
                    .filter(progress => progress.completed)
                    .slice(0, 10)
                    .map((progress) => (
                      <div key={progress.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-white font-semibold">{progress.module.title}</h4>
                            <p className="text-gray-400 text-sm">
                              Completed: {progress.completedAt ? new Date(progress.completedAt).toLocaleDateString() : 'Recently'}
                            </p>
                          </div>
                          <div className="text-yellow-400 font-semibold">+{progress.xpEarned} XP</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}