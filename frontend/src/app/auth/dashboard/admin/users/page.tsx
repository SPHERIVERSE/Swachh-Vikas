'use client';

import { useState, useEffect } from 'react';
import api from '@/utils/axiosInstance';
import NotificationBell from '@/components/NotificationBell';
import { Role } from '@prisma/client';

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  totalXp: number;
  createdAt: string;
  avatarUrl?: string;
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
  notifications: Array<{
    id: string;
    message: string;
    isRead: boolean;
    createdAt: string;
  }>;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | 'ALL'>('ALL');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const params = selectedRole !== 'ALL' ? { role: selectedRole } : {};
      const response = await api.get('/users', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      
      // Compute stats for each user from the returned data
      const usersWithStats = response.data.map((user: any) => {
        const completedModules = user.moduleProgress?.filter((p: any) => p.completed).length || 0;
        const totalModules = user.moduleProgress?.length || 0;
        const completedCourses = user.courseCompletions?.length || 0;
        const reportsCreated = user.civicReports?.length || 0;
        const postsCreated = user.posts?.length || 0;
        const followersCount = user.followers?.length || 0;
        const followingCount = user.following?.length || 0;
        const completionRate = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

        return {
          ...user,
          stats: {
            completedModules,
            totalModules,
            completedCourses,
            reportsCreated,
            postsCreated,
            followersCount,
            followingCount,
            completionRate,
          },
        };
      });
      
      setUsers(usersWithStats);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendNotification = async (userId: string, message: string) => {
    try {
      const token = localStorage.getItem('access_token');
      await api.post(`/users/${userId}/notify`, 
        { message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Notification sent successfully!');
      setShowNotificationModal(false);
      setNotificationMessage('');
    } catch (error) {
      console.error('Failed to send notification:', error);
      alert('Failed to send notification');
    }
  };

  const updateUserRole = async (userId: string, newRole: Role) => {
    try {
      const token = localStorage.getItem('access_token');
      await api.put(`/users/${userId}/role`, 
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('User role updated successfully!');
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user role:', error);
      alert('Failed to update user role');
    }
  };

  useEffect(() => {
    fetchUsers();

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
  }, [selectedRole]);

  const getRoleColor = (role: Role) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'WORKER': return 'bg-blue-100 text-blue-800';
      case 'CITIZEN': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelFromXp = (xp: number) => {
    return Math.floor(Math.sqrt(xp / 50)) + 1;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">User Management</h1>
            <p className="text-gray-300">Manage and monitor all platform users</p>
          </div>
          {currentUserId && <NotificationBell userId={currentUserId} />}
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 mb-6 border border-white/20">
          <div className="flex items-center space-x-4">
            <label className="text-white font-medium">Filter by Role:</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as Role | 'ALL')}
              className="bg-white/20 text-white rounded-lg px-4 py-2 border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="ALL">All Users</option>
              <option value="ADMIN">Admins</option>
              <option value="WORKER">Workers</option>
              <option value="CITIZEN">Citizens</option>
            </select>
            <div className="text-white">
              Total Users: <span className="font-bold text-purple-400">{users.length}</span>
            </div>
          </div>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer"
              onClick={() => {
                setSelectedUser(user);
                setShowUserModal(true);
              }}
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">{user.name}</h3>
                  <p className="text-gray-300 text-sm">{user.email}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Role:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Level:</span>
                  <span className="text-purple-400 font-bold">
                    L{getLevelFromXp(user.totalXp)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">XP:</span>
                  <span className="text-yellow-400 font-bold">{user.totalXp}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Completion Rate:</span>
                  <span className="text-green-400 font-bold">
                    {user.stats?.completionRate?.toFixed(1) ?? '0.0'}%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Reports:</span>
                  <span className="text-blue-400 font-bold">{user.stats?.reportsCreated ?? 0}</span>
                </div>

                {user.notifications && user.notifications.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Unread Notifications:</span>
                    <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      {user.notifications.length}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* User Detail Modal */}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">User Details</h2>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* User Info */}
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-xl">{selectedUser.name}</h3>
                    <p className="text-gray-300">{selectedUser.email}</p>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(selectedUser.role)}`}>
                      {selectedUser.role}
                    </span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-gray-300 text-sm">Level</div>
                    <div className="text-purple-400 font-bold text-xl">L{getLevelFromXp(selectedUser.totalXp)}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-gray-300 text-sm">Total XP</div>
                    <div className="text-yellow-400 font-bold text-xl">{selectedUser.totalXp}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-gray-300 text-sm">Completed Modules</div>
                    <div className="text-green-400 font-bold text-xl">{selectedUser.stats?.completedModules ?? 0}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-gray-300 text-sm">Completed Courses</div>
                    <div className="text-blue-400 font-bold text-xl">{selectedUser.stats?.completedCourses ?? 0}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-gray-300 text-sm">Reports Created</div>
                    <div className="text-orange-400 font-bold text-xl">{selectedUser.stats?.reportsCreated ?? 0}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-gray-300 text-sm">Posts Created</div>
                    <div className="text-pink-400 font-bold text-xl">{selectedUser.stats?.postsCreated ?? 0}</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-4">
                  <h4 className="text-white font-semibold">Actions</h4>
                  
                  {/* Role Update */}
                  <div className="flex items-center space-x-4">
                    <label className="text-gray-300">Update Role:</label>
                    <select
                      value={selectedUser.role}
                      onChange={(e) => updateUserRole(selectedUser.id, e.target.value as Role)}
                      className="bg-white/20 text-white rounded-lg px-4 py-2 border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="CITIZEN">Citizen</option>
                      <option value="WORKER">Worker</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>

                  {/* Send Notification */}
                  <button
                    onClick={() => setShowNotificationModal(true)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Send Notification
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notification Modal */}
        {showNotificationModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 max-w-md w-full border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">Send Notification</h3>
              <p className="text-gray-300 mb-4">To: {selectedUser.name}</p>
              <textarea
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                placeholder="Enter notification message..."
                className="w-full bg-white/20 text-white rounded-lg px-4 py-3 border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
                rows={4}
              />
              <div className="flex space-x-4">
                <button
                  onClick={() => sendNotification(selectedUser.id, notificationMessage)}
                  disabled={!notificationMessage.trim()}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Send
                </button>
                <button
                  onClick={() => {
                    setShowNotificationModal(false);
                    setNotificationMessage('');
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}





