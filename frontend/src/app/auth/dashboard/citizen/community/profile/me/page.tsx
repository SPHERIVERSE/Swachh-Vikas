'use client';

import React, { useEffect, useState } from 'react';
import RoleGuard from '@/components/RoleGuard';
import axios from '@/utils/axiosInstance';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode'; // This library is required

interface UserProfile {
  id: string;
  name: string;
  username?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  followers: number;
  followings: number;
  isFollowing: boolean;
}

interface UserPost {
  id: string;
  content: string;
  mediaUrl?: string | null;
  mediaType: 'TEXT' | 'IMAGE' | 'VIDEO';
  createdAt: string;
  likes: number;
  dislikes: number;
  myReaction: 'like' | 'dislike' | null;
}

export default function MyProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    username: '',
    bio: '',
    avatarUrl: ''
  });

  useEffect(() => {
    fetchSelf();
  }, []);

// --- Corrected fetchSelf function in page.tsx (MyProfilePage) ---

const fetchSelf = async () => {
    setLoading(true);
    try {
        // 1. Retrieve and decode the token directly to get the current user's ID
        const token = localStorage.getItem('access_token');
        
        if (!token) {
            setMessage('Authentication failed. Token not found.');
            setLoading(false);
            return;
        }

        // Use jwtDecode to reliably extract the User ID (sub is the standard field)
        const decodedToken = jwtDecode<{ sub: string }>(token);
        const userId = decodedToken.sub; 

        if (!userId) {
            setMessage('Authentication failed. User ID missing from token.');
            setLoading(false);
            return; 
        }
        
        // 2. Use the validated userId for the required profile API calls
        // The API calls are /community/profile/:userId and /community/posts/user/:userId
        const [{ data: profileData }, { data: postsData }] = await Promise.all([
            // viewerId (AuthUser('sub')) and userId are the same when viewing own profile
            axios.get(`/community/profile/${userId}`),
            // getPostsByAuthor(authorId, viewerId)
            axios.get(`/community/posts/user/${userId}`)
        ]);
        
        setProfile(profileData);
        setPosts(postsData);
        setEditData({
            username: profileData.username || '',
            bio: profileData.bio || '',
            avatarUrl: profileData.avatarUrl || ''
        });
        setMessage(null); // Clear any previous error messages

    } catch (e: any) {
        // Catches errors like expired token (401) or API failure (e.g., 404 if profile not found)
        console.error("Profile Fetch Error:", e);
        setMessage(e.response?.data?.message || 'Session Invalid or Expired. Please log in.');
    } finally {
        setLoading(false);
    }
};

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/community/profile/update', editData);
      setMessage('Profile updated successfully!');
      setIsEditing(false);
      await fetchSelf();
    } catch (e: any) {
      setMessage(e.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const { data } = await axios.post('/community/avatar/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setEditData(prev => ({ ...prev, avatarUrl: data.url }));
      setMessage('Avatar uploaded successfully!');
    } catch (e: any) {
      setMessage(e.response?.data?.message || 'Failed to upload avatar');
    }
  };

  return (
    <RoleGuard roles={['CITIZEN', 'WORKER', 'ADMIN']}>
      <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Navigation Header */}
          <header className="mb-6 border-b border-gray-700 pb-4 flex justify-between items-center">
            <h1 className="text-3xl font-extrabold text-teal-400">My Profile</h1>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/auth/dashboard/citizen/community')}
                className="px-4 py-2 bg-gray-700 text-gray-200 rounded-full text-sm font-semibold hover:bg-gray-600 transition-colors"
              >
                ← Back to Feed
              </button>
            </div>
          </header>

          {loading ? (
            <div className="text-center text-gray-400">Loading profile...</div>
          ) : profile ? (
            <div className="space-y-8">
              
              {/* Profile Header */}
              <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                <div className="flex items-start gap-6">
                  <div className="relative">
                    {profile.avatarUrl ? (
                      <Image
                        src={profile.avatarUrl}
                        alt="Profile"
                        width={120}
                        height={120}
                        className="w-30 h-30 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-30 h-30 rounded-full bg-gray-700 flex items-center justify-center text-4xl">
                        👤
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
                    {profile.username && (
                      <p className="text-teal-400 text-lg">@{profile.username}</p>
                    )}
                    {profile.bio && (
                      <p className="text-gray-300 mt-2">{profile.bio}</p>
                    )}
                    
                    <div className="flex gap-6 mt-4 text-sm">
                      <div>
                        <span className="font-semibold text-white">{profile.followers}</span>
                        <span className="text-gray-400 ml-1">followers</span>
                      </div>
                      <div>
                        <span className="font-semibold text-white">{profile.followings}</span>
                        <span className="text-gray-400 ml-1">following</span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-4 py-2 bg-teal-500 text-white rounded-full hover:bg-teal-600 transition-colors"
                  >
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                  </button>
                </div>
              </div>

              {/* Edit Profile Form */}
              {isEditing && (
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                  <h3 className="text-xl font-semibold mb-4">Edit Profile</h3>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                      <input
                        type="text"
                        value={editData.username}
                        onChange={(e) => setEditData(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="Enter username"
                        className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-teal-500 focus:border-teal-500 border-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                      <textarea
                        value={editData.bio}
                        onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Tell us about yourself"
                        rows={3}
                        className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-teal-500 focus:border-teal-500 border-none resize-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Avatar URL</label>
                      <input
                        type="url"
                        value={editData.avatarUrl}
                        onChange={(e) => setEditData(prev => ({ ...prev, avatarUrl: e.target.value }))}
                        placeholder="Enter avatar URL"
                        className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-teal-500 focus:border-teal-500 border-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Or Upload Avatar</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="w-full p-3 bg-gray-700 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-500 file:text-white hover:file:bg-teal-600"
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-6 py-2 bg-teal-500 text-white font-semibold rounded-full hover:bg-teal-600 transition-colors"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* My Posts */}
              <div>
                <h3 className="text-2xl font-bold mb-4">My Posts</h3>
                {posts.length === 0 ? (
                  <div className="text-center text-gray-400 p-8 bg-gray-800 rounded-xl">
                    You haven't posted anything yet. <br />
                    <button
                      onClick={() => router.push('/auth/dashboard/citizen/community')}
                      className="text-teal-400 hover:text-teal-300 underline"
                    >
                      Create your first post!
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {posts.map(post => (
                      <div key={post.id} className="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
                            {profile?.avatarUrl ? (
                              <Image
                                src={profile.avatarUrl}
                                alt="Profile"
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full text-xl">👤</div>
                            )}
                          </div>
                          <div>
                            <p className="text-md font-semibold text-white">{profile?.username || profile?.name}</p>
                            <p className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                        
                        <p className="mb-4 text-gray-200 whitespace-pre-wrap">{post.content}</p>
                        
                        {post.mediaUrl && (
                          <div className="my-3 max-h-96 w-full overflow-hidden rounded-lg">
                            {post.mediaType === 'IMAGE' ? (
                              <Image
                                src={post.mediaUrl}
                                alt="Post Media"
                                width={500}
                                height={300}
                                className="w-full object-cover"
                              />
                            ) : post.mediaType === 'VIDEO' ? (
                              <video src={post.mediaUrl} controls className="w-full object-cover" />
                            ) : null}
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-sm mt-3 border-t border-gray-700 pt-3">
                          <span className="flex items-center px-3 py-1 rounded-full bg-gray-700 text-gray-300">
                            👍 {post.likes}
                          </span>
                          <span className="flex items-center px-3 py-1 rounded-full bg-gray-700 text-gray-300">
                            👎 {post.dislikes}
                          </span>
                          <button
                            onClick={() => router.push(`/auth/dashboard/citizen/community/post/${post.id}`)}
                            className="flex items-center px-3 py-1 rounded-full font-medium text-teal-400 hover:text-teal-300"
                          >
                            🔗 View Post
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400">Failed to load profile</div>
          )}
          
          {message && (
            <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
              message.includes('success') ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}

