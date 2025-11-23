'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NotificationBell from '@/components/NotificationBell';
import api from '@/utils/axiosInstance';

interface CommunityDrive {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  status: string;
  targetParticipants?: number;
  currentParticipants: number;
  rewardAmount?: number;
  participants: any[];
}

export default function DrivesPage() {
  const router = useRouter();
  const [drives, setDrives] = useState<CommunityDrive[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    targetParticipants: '',
    rewardAmount: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    api.get('/users/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setCurrentUserId(res.data.id))
      .catch(() => router.push('/auth/login'));

    fetchDrives();
  }, [router]);

  const fetchDrives = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await api.get('/business/drives', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDrives(response.data);
    } catch (error) {
      console.error('Failed to fetch drives:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      await api.post('/business/drives', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Community Drive created successfully!');
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        location: '',
        startDate: '',
        endDate: '',
        targetParticipants: '',
        rewardAmount: '',
      });
      fetchDrives();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create drive');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return 'bg-blue-500';
      case 'ONGOING':
        return 'bg-green-500';
      case 'COMPLETED':
        return 'bg-gray-500';
      case 'CANCELLED':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Community Drives</h1>
              <p className="text-emerald-200">Organize and manage community cleanup drives</p>
            </div>
          </div>
          <div className="flex gap-4">
            {currentUserId && <NotificationBell userId={currentUserId} />}
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              + Create Drive
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white">Loading drives...</p>
          </div>
        ) : drives.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-12 text-center border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-2">No Drives Yet</h3>
            <p className="text-emerald-200 mb-6">Create your first community drive</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Create Drive
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drives.map((drive) => (
              <div key={drive.id} className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getStatusColor(drive.status)}`}>
                    {drive.status}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{drive.title}</h3>
                <p className="text-emerald-200 text-sm mb-4 line-clamp-2">{drive.description}</p>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center gap-2 text-white/80">
                    <span>📍</span>
                    <span>{drive.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <span>📅</span>
                    <span>{new Date(drive.startDate).toLocaleDateString()} - {new Date(drive.endDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <span>👥</span>
                    <span>{drive.currentParticipants} {drive.targetParticipants ? `/ ${drive.targetParticipants}` : ''} participants</span>
                  </div>
                  {drive.rewardAmount && (
                    <div className="flex items-center gap-2 text-green-400 font-semibold">
                      <span>💰</span>
                      <span>₹{drive.rewardAmount} reward per participant</span>
                    </div>
                  )}
                </div>
                {drive.participants.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <p className="text-xs text-white/60 mb-2">Participants:</p>
                    <div className="flex flex-wrap gap-2">
                      {drive.participants.slice(0, 5).map((p: any) => (
                        <span key={p.user.id} className="text-xs bg-white/20 px-2 py-1 rounded text-white">
                          {p.user.name}
                        </span>
                      ))}
                      {drive.participants.length > 5 && (
                        <span className="text-xs text-white/60">+{drive.participants.length - 5} more</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-4">Create Community Drive</h2>
            <form onSubmit={handleCreateDrive} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Location *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date *</label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date *</label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Target Participants</label>
                  <input
                    type="number"
                    value={formData.targetParticipants}
                    onChange={(e) => setFormData({ ...formData, targetParticipants: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Reward Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.rewardAmount}
                    onChange={(e) => setFormData({ ...formData, rewardAmount: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg"
                >
                  Create Drive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

