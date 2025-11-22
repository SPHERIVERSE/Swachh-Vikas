'use client';

import React, { useEffect, useState, useCallback } from 'react';
import RoleGuard from '@/components/RoleGuard';
import axios from '@/utils/axiosInstance';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface FeedPost {
  id: string;
  author: { id: string; name: string; username?: string | null; avatarUrl?: string | null };
  content: string;
  mediaUrl?: string | null;
  mediaType?: 'TEXT' | 'IMAGE' | 'VIDEO';
  createdAt: string;
  likes: number;
  dislikes: number;
  myReaction: 'like' | 'dislike' | null;
}

interface MediaFile {
    file: File;
    url: string;
    type: 'IMAGE' | 'VIDEO';
}

export default function CommunityFeedPage() {
  const router = useRouter();
  const [feed, setFeed] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  // Composer modal state
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [localMedia, setLocalMedia] = useState<MediaFile | null>(null);
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [mediaType, setMediaType] = useState<'TEXT' | 'IMAGE' | 'VIDEO'>('TEXT');
  const [inputMode, setInputMode] = useState<'FILE' | 'URL'>('FILE');

  // Poll creation state
  const [showPollForm, setShowPollForm] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollExpiresAt, setPollExpiresAt] = useState('');

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/community/feed'); 
      setFeed(data);
    } catch (e: any) {
      setMessage(e.response?.data?.message || 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  const resetComposer = () => {
    setContent('');
    setLocalMedia(null);
    setMediaUrlInput('');
    setMediaType('TEXT');
    setInputMode('FILE');
    setShowPollForm(false);
    setPollQuestion('');
    setPollOptions(['', '']);
    setPollExpiresAt('');
  };

// --- File: CommunityFeedPage.tsx (part of the component) ---

const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedContent = content.trim();

    if (!trimmedContent && !localMedia && !mediaUrlInput.trim()) {
      setMessage('Post cannot be empty.');
      return;
    }

    setIsPosting(true);
    setMessage(null);

    try {
      if (localMedia) {
        // 1. FILE UPLOAD LOGIC: Use FormData for the dedicated /community/post/file endpoint
        const formData = new FormData();
        formData.append('media', localMedia.file);
        // Only append content if it's not empty, as the controller handles the check
        if (trimmedContent) {
            formData.append('content', trimmedContent);
        }

        // Use the dedicated file endpoint which handles both file and content
        await axios.post('/community/post/file', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

      } else {
        // 2. TEXT/URL LOGIC: Use JSON payload for the /community/post endpoint
        const finalMediaUrl = mediaUrlInput.trim() || null;
        if (!trimmedContent && !finalMediaUrl) {
             throw new Error('Post must contain content or media'); // Should be caught by the initial check, but good for safety
        }
        
        const postData = { 
            content: trimmedContent, 
            mediaUrl: finalMediaUrl, 
            mediaType: finalMediaUrl ? mediaType : 'TEXT' 
        };
        
        await axios.post('/community/post', postData);
      }

      setMessage('Post created successfully!');
      resetComposer();
      setIsComposerOpen(false);
      await fetchFeed();
    } catch (e: any) {
      setMessage(e.response?.data?.message || 'Failed to create post');
    } finally {
      setIsPosting(false);
    }
};

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        setMessage('Only images and videos are supported.');
        setLocalMedia(null);
        return;
      }

      setLocalMedia({ file, url: URL.createObjectURL(file), type: file.type.startsWith('image/') ? 'IMAGE' : 'VIDEO' });
      setMediaType(file.type.startsWith('image/') ? 'IMAGE' : 'VIDEO');
      setMediaUrlInput(''); 
    }
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pollQuestion.trim() || pollOptions.filter(opt => opt.trim()).length < 2) {
      setMessage('Poll must have a question and at least 2 options.');
      return;
    }

    setIsPosting(true);

    try {
      const { data: post } = await axios.post('/community/post', { content: pollQuestion.trim(), mediaUrl: null, mediaType: 'TEXT' });
      const validOptions = pollOptions.filter(opt => opt.trim());
      const expiresAt = pollExpiresAt ? new Date(pollExpiresAt).toISOString() : undefined;
      await axios.post(`/community/post/${post.id}/poll`, { question: pollQuestion.trim(), options: validOptions, expiresAt });

      setMessage('Poll created successfully!');
      resetComposer();
      setIsComposerOpen(false);
      await fetchFeed();
    } catch (e: any) {
      setMessage(e.response?.data?.message || 'Failed to create poll');
    } finally {
      setIsPosting(false);
    }
  };

  const addPollOption = () => setPollOptions(prev => [...prev, '']);
  const updatePollOption = (index: number, value: string) => setPollOptions(prev => prev.map((opt, i) => i === index ? value : opt));
  const removePollOption = (index: number) => { if (pollOptions.length > 2) setPollOptions(prev => prev.filter((_, i) => i !== index)); };

  const react = async (postId: string, reactionType: 'like' | 'dislike') => {
    try {
      const { data: updatedPost } = await axios.post(`/community/react/${postId}`, { type: reactionType });
      setFeed(prev => prev.map(p => p.id === postId ? { ...p, likes: updatedPost.likes, dislikes: updatedPost.dislikes, myReaction: updatedPost.myReaction } : p));
    } catch (e: any) {
      setMessage(e.response?.data?.message || 'Failed to react');
    }
  };

  return (
    <RoleGuard roles={['CITIZEN', 'WORKER', 'ADMIN']}>
      <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
        <div className="max-w-xl mx-auto">
          
          {/* Header */}
          <header className="mb-6 border-b border-gray-700 pb-4 flex justify-between items-center sticky top-0 bg-gray-900 z-10">
            <h1 className="text-3xl font-extrabold text-teal-400">Community Feed</h1>
            <div className="flex space-x-3">
              <button onClick={() => router.push('/auth/dashboard/citizen/community/')} className="px-4 py-2 bg-gray-700 text-gray-200 rounded-full text-sm font-semibold hover:bg-gray-600 transition-colors">Explore 🔍</button>
              <button onClick={() => router.push('/auth/dashboard/citizen/community/profile/me')} className="px-4 py-2 bg-gray-700 text-gray-200 rounded-full text-sm font-semibold hover:bg-gray-600 transition-colors">Profile 👤</button>
            </div>
          </header>

          {/* Feed */}
          <h2 className="text-2xl font-bold mb-4">Latest Activity</h2>
          {loading ? (
            <div className="text-center text-gray-400">Loading posts...</div>
          ) : (
            <ul className="space-y-6">
              {feed.map(p => (
                <li key={p.id} className="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-lg transition-shadow hover:shadow-teal-500/30">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
                      {p.author.avatarUrl ? (
                        <Image src={p.author.avatarUrl} alt="Profile" width={40} height={40} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-xl">👤</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <button onClick={() => router.push(`/auth/dashboard/citizen/community/profile/${p.author.id}`)} className="text-md font-semibold text-white hover:text-teal-400 transition-colors">
                        {p.author.username || p.author.name}
                      </button>
                      <p className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleString()}</p>
                    </div>
                  </div>

                  <p className="mb-4 text-gray-200 whitespace-pre-wrap">{p.content}</p>

                  {p.mediaUrl && (
                    <div className="my-3 max-h-96 w-full overflow-hidden rounded-lg">
                      {p.mediaType === 'IMAGE' ? (
                        <img src={p.mediaUrl} alt="Post Media" className="w-full object-cover" />
                      ) : p.mediaType === 'VIDEO' ? (
                        <video src={p.mediaUrl} controls className="w-full object-cover" />
                      ) : null}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm mt-3 border-t border-gray-700 pt-3">
                    <button onClick={() => react(p.id, 'like')} className={`flex items-center px-3 py-1 rounded-full font-medium transition-colors ${p.myReaction === 'like' ? 'bg-green-700 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>👍 {p.likes}</button>
                    <button onClick={() => react(p.id, 'dislike')} className={`flex items-center px-3 py-1 rounded-full font-medium transition-colors ${p.myReaction === 'dislike' ? 'bg-red-700 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>👎 {p.dislikes}</button>
                    <a href={`/auth/dashboard/citizen/community/post/${p.id}`} className="flex items-center px-3 py-1 rounded-full font-medium text-teal-400 hover:text-teal-300">🔗 View Post</a>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!loading && feed.length === 0 && (
            <div className="text-center text-gray-400 p-8 bg-gray-800 rounded-xl mt-6">No posts found. Be the first to start the conversation!</div>
          )}
        </div>

        {/* Floating Compose Button */}
        <button onClick={() => setIsComposerOpen(true)} className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-teal-500 hover:bg-teal-600 text-white text-3xl shadow-lg">+</button>

        {/* Composer Modal */}
        {isComposerOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-gray-800 w-full max-w-xl mx-4 p-6 rounded-xl border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Create</h2>
                <button onClick={() => { setIsComposerOpen(false); resetComposer(); }} className="text-gray-300 hover:text-white">✕</button>
              </div>

              <div className="flex gap-2 mb-4">
                <button onClick={() => setShowPollForm(false)} className={`px-4 py-2 text-sm rounded-full ${!showPollForm ? 'bg-teal-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>Post</button>
                <button onClick={() => setShowPollForm(true)} className={`px-4 py-2 text-sm rounded-full ${showPollForm ? 'bg-teal-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>Poll 📊</button>
              </div>

              {!showPollForm ? (
                <form onSubmit={handleCreatePost}>
                  <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="What's on your mind?" className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-teal-500 focus:border-teal-500 border-none resize-none" rows={3} />

                  <div className="mt-3 flex gap-4">
                    <button type="button" onClick={() => { setInputMode('FILE'); setMediaUrlInput(''); setMediaType('TEXT'); }} className={`px-4 py-2 text-sm rounded-full ${inputMode === 'FILE' ? 'bg-teal-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>Upload File 📁</button>
                    <button type="button" onClick={() => { setInputMode('URL'); setLocalMedia(null); }} className={`px-4 py-2 text-sm rounded-full ${inputMode === 'URL' ? 'bg-teal-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>Link URL 🔗</button>
                  </div>

                  <div className="mt-3 p-3 border border-gray-700 rounded-lg">
                    {inputMode === 'FILE' ? (
                      <>
                        <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-500 file:text-white hover:file:bg-teal-600" />
                        {localMedia && (
                          <div className="mt-3 relative h-48 w-full overflow-hidden rounded-lg">
                            {localMedia.type === 'IMAGE' ? (
                              <img src={localMedia.url} alt="Preview" className='w-full h-full object-cover rounded-lg' />
                            ) : (
                              <video src={localMedia.url} controls className='w-full h-full object-cover rounded-lg' />
                            )}
                            <button type="button" onClick={() => setLocalMedia(null)} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full text-xs">X</button>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <input type="url" value={mediaUrlInput} onChange={(e) => setMediaUrlInput(e.target.value)} placeholder="Enter Image or Video URL" className="w-full p-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-teal-500 focus:border-teal-500 border-none" />
                        <select value={mediaType} onChange={(e) => setMediaType(e.target.value as any)} className="mt-2 w-full p-2 bg-gray-700 rounded-lg text-white">
                          <option value="IMAGE">Image</option>
                          <option value="VIDEO">Video</option>
                        </select>
                      </>
                    )}
                  </div>

                  <div className="flex justify-end mt-4">
                    <button type="submit" disabled={isPosting} className="px-6 py-2 bg-teal-500 text-white font-semibold rounded-full hover:bg-teal-600 transition-colors disabled:opacity-50">{isPosting ? 'Posting...' : 'Post'}</button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleCreatePoll}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Poll Question</label>
                    <input type="text" value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} placeholder="What would you like to ask?" className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-teal-500 focus:border-teal-500 border-none" />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Poll Options</label>
                    {pollOptions.map((option, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input type="text" value={option} onChange={(e) => updatePollOption(index, e.target.value)} placeholder={`Option ${index + 1}`} className="flex-1 p-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-teal-500 focus:border-teal-500 border-none" />
                        {pollOptions.length > 2 && (
                          <button type="button" onClick={() => removePollOption(index)} className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Remove</button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={addPollOption} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors text-sm">+ Add Option</button>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Expiration (Optional)</label>
                    <input type="datetime-local" value={pollExpiresAt} onChange={(e) => setPollExpiresAt(e.target.value)} className="w-full p-3 bg-gray-700 rounded-lg text-white focus:ring-teal-500 focus:border-teal-500 border-none" />
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" disabled={isPosting} className="px-6 py-2 bg-teal-500 text-white font-semibold rounded-full hover:bg-teal-600 transition-colors disabled:opacity-50">{isPosting ? 'Creating Poll...' : 'Create Poll'}</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
