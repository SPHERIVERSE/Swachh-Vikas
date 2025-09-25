'use client';

import React, { useEffect, useState } from 'react';
import RoleGuard from '@/components/RoleGuard';
import axios from '@/utils/axiosInstance';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';

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

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams<{ userId: string }>();
  const userId = (params?.userId as string) || '';
  const isUserIdValid = userId && userId !== 'undefined';
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (!isUserIdValid) return;
    fetchProfile();
    fetchUserPosts();
  }, [isUserIdValid, userId]);

  const fetchProfile = async () => {
    if (!isUserIdValid) return;
    try {
      const { data } = await axios.get(`/community/profile/${userId}`);
      setProfile(data);
      setIsFollowing(data.isFollowing);
    } catch (e: any) {
      setMessage(e.response?.data?.message || 'Failed to load profile');
    }
  };

  const fetchUserPosts = async () => {
    if (!isUserIdValid) return;
    try {
      const { data } = await axios.get(`/community/posts/user/${userId}`);
      setPosts(data);
    } catch (e: any) {
      setMessage(e.response?.data?.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!profile || !isUserIdValid) return;
    
    try {
      if (isFollowing) {
        await axios.post(`/community/unfollow/${userId}`);
        setIsFollowing(false);
        setProfile(prev => prev ? { ...prev, followers: prev.followers - 1 } : null);
        setMessage('Unfollowed successfully!');
      } else {
        await axios.post(`/community/follow/${userId}`);
        setIsFollowing(true);
        setProfile(prev => prev ? { ...prev, followers: prev.followers + 1 } : null);
        setMessage('Following successfully!');
      }
    } catch (e: any) {
      setMessage(e.response?.data?.message || 'Failed to follow/unfollow');
    }
  };

  return (
    <RoleGuard roles={['CITIZEN', 'WORKER', 'ADMIN']}>
      <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Navigation Header */}
          <header className="mb-6 border-b border-gray-700 pb-4 flex justify-between items-center">
            <h1 className="text-3xl font-extrabold text-teal-400">User Profile</h1>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/auth/dashboard/citizen/community')}
                className="px-4 py-2 bg-gray-700 text-gray-200 rounded-full text-sm font-semibold hover:bg-gray-600 transition-colors"
              >
                ← Back to Feed
              </button>
            </div>
          </header>

          {!isUserIdValid ? (
            <div className="text-center text-gray-400">Invalid profile URL</div>
          ) : loading ? (
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
                    onClick={handleFollow}
                    className={`px-6 py-2 rounded-full font-semibold transition-colors ${
                      isFollowing 
                        ? 'bg-gray-600 text-white hover:bg-gray-700' 
                        : 'bg-teal-500 text-white hover:bg-teal-600'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>
              </div>

              {/* User Posts */}
              <div>
                <h3 className="text-2xl font-bold mb-4">Posts by {profile.username || profile.name}</h3>
                {posts.length === 0 ? (
                  <div className="text-center text-gray-400 p-8 bg-gray-800 rounded-xl">
                    This user hasn't posted anything yet.
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {posts.map(post => (
                      <div key={post.id} className="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
                            {profile.avatarUrl ? (
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
                            <p className="text-md font-semibold text-white">{profile.username || profile.name}</p>
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