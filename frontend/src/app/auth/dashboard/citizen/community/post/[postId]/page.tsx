'use client';

import React, { useEffect, useState } from 'react';
import RoleGuard from '@/components/RoleGuard';
import axios from '@/utils/axiosInstance';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';

interface Post {
  id: string;
  content: string;
  mediaUrl?: string | null;
  mediaType: 'TEXT' | 'IMAGE' | 'VIDEO';
  createdAt: string;
  likes: number;
  dislikes: number;
  myReaction: 'like' | 'dislike' | null;
  author: {
    id: string;
    name: string;
    username?: string | null;
    avatarUrl?: string | null;
  };
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    username?: string | null;
    avatarUrl?: string | null;
  };
}

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams<{ postId: string }>();
  const postId = (params?.postId as string) || '';
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);

  useEffect(() => {
    if (!postId) return;
    fetchPost();
    fetchComments();
  }, [postId]);

  const fetchPost = async () => {
    try {
      const { data } = await axios.get(`/community/post/${postId}`);
      setPost(data);
    } catch (e: any) {
      setMessage(e.response?.data?.message || 'Failed to load post');
    }
  };

  const fetchComments = async () => {
    try {
      const { data } = await axios.get(`/community/post/${postId}/comments`);
      setComments(data);
    } catch (e: any) {
      setMessage(e.response?.data?.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleReact = async (reaction: 'like' | 'dislike') => {
    if (!post) return;
    
    try {
      const { data } = await axios.post(`/community/post/${postId}/${reaction}`);
      
      setPost(prev => prev ? {
        ...prev,
        likes: data.likes || prev.likes,
        dislikes: data.dislikes || prev.dislikes,
        myReaction: data.myReaction || prev.myReaction
      } : null);
    } catch (e: any) {
      setMessage(e.response?.data?.message || 'Failed to react');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setIsCommenting(true);
    try {
      const { data } = await axios.post(`/community/post/${postId}/comment`, {
        content: newComment.trim()
      });
      
      setComments(prev => [data, ...prev]);
      setNewComment('');
      setMessage('Comment added successfully!');
    } catch (e: any) {
      setMessage(e.response?.data?.message || 'Failed to add comment');
    } finally {
      setIsCommenting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await axios.post(`/community/comment/${commentId}/delete`);
      setComments(prev => prev.filter(c => c.id !== commentId));
      setMessage('Comment deleted successfully!');
    } catch (e: any) {
      setMessage(e.response?.data?.message || 'Failed to delete comment');
    }
  };

  return (
    <RoleGuard roles={['CITIZEN', 'WORKER', 'ADMIN']}>
      <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Navigation Header */}
          <header className="mb-6 border-b border-gray-700 pb-4 flex justify-between items-center">
            <h1 className="text-3xl font-extrabold text-teal-400">Post Details</h1>
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
            <div className="text-center text-gray-400">Loading post...</div>
          ) : post ? (
            <div className="space-y-8">
              
              {/* Post Content */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden">
                    {post.author.avatarUrl ? (
                      <Image
                        src={post.author.avatarUrl}
                        alt="Profile"
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-xl">👤</div>
                    )}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">{post.author.username || post.author.name}</p>
                    <p className="text-sm text-gray-400">{new Date(post.createdAt).toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => router.push(`/auth/dashboard/citizen/community/profile/${post.author.id}`)}
                    className="ml-auto px-4 py-2 bg-teal-500 text-white rounded-full text-sm font-semibold hover:bg-teal-600 transition-colors"
                  >
                    View Profile
                  </button>
                </div>
                
                <p className="mb-4 text-gray-200 whitespace-pre-wrap text-lg">{post.content}</p>
                
                {post.mediaUrl && (
                  <div className="my-4 max-h-96 w-full overflow-hidden rounded-lg">
                    {post.mediaType === 'IMAGE' ? (
                      <Image
                        src={post.mediaUrl}
                        alt="Post Media"
                        width={800}
                        height={600}
                        className="w-full object-cover"
                      />
                    ) : post.mediaType === 'VIDEO' ? (
                      <video src={post.mediaUrl} controls className="w-full object-cover" />
                    ) : null}
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm mt-4 border-t border-gray-700 pt-4">
                  <button 
                    onClick={() => handleReact('like')} 
                    className={`flex items-center px-4 py-2 rounded-full font-medium transition-colors ${
                      post.myReaction === 'like' ? 'bg-green-700 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    👍 {post.likes}
                  </button>
                  <button 
                    onClick={() => handleReact('dislike')} 
                    className={`flex items-center px-4 py-2 rounded-full font-medium transition-colors ${
                      post.myReaction === 'dislike' ? 'bg-red-700 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    👎 {post.dislikes}
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-semibold mb-4">Comments ({comments.length})</h3>
                
                {/* Add Comment Form */}
                <form onSubmit={handleAddComment} className="mb-6">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 p-3 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-teal-500 focus:border-teal-500 border-none"
                    />
                    <button
                      type="submit"
                      disabled={isCommenting || !newComment.trim()}
                      className="px-6 py-3 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50"
                    >
                      {isCommenting ? 'Posting...' : 'Comment'}
                    </button>
                  </div>
                </form>

                {/* Comments List */}
                {comments.length === 0 ? (
                  <div className="text-center text-gray-400 p-4">
                    No comments yet. Be the first to comment!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map(comment => (
                      <div key={comment.id} className="bg-gray-700 p-4 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-600 overflow-hidden">
                            {comment.user.avatarUrl ? (
                              <Image
                                src={comment.user.avatarUrl}
                                alt="Profile"
                                width={32}
                                height={32}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full text-sm">👤</div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-white text-sm">
                                {comment.user.username || comment.user.name}
                              </span>
                              <span className="text-xs text-gray-400">
                                {new Date(comment.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-gray-200 text-sm">{comment.content}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-red-400 hover:text-red-300 text-xs"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400">Failed to load post</div>
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