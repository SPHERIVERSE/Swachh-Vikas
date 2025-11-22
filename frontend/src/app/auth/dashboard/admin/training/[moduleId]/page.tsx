'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/utils/axiosInstance';

type Flashcard = { id: string; question: string; answer: string };
type Video = { id: string; title: string; url: string };
type Quiz = { id: string; title: string; questions: QuizQuestion[] };

type QuizQuestion = {
  id: string;
  question: string;
  type: 'MCQ' | 'SUBJECTIVE';
  options?: { id: string; text: string; isCorrect: boolean }[];
  answer?: string;
};

export default function AdminModuleDetailPage() {
  const router = useRouter();
  const { moduleId } = useParams();

  const [moduleTitle, setModuleTitle] = useState('');
  const [role, setRole] = useState('');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'flashcards' | 'videos' | 'quizzes'>('overview');

  // Form states
  const [flashQuestion, setFlashQuestion] = useState('');
  const [flashAnswer, setFlashAnswer] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<'MCQ' | 'SUBJECTIVE'>('MCQ');
  const [options, setOptions] = useState<{ text: string; isCorrect: boolean }[]>([
    { text: '', isCorrect: false },
  ]);
  const [subjectiveAnswer, setSubjectiveAnswer] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const fetchModule = async () => {
    try {
      const res = await api.get(`/training/modules/${moduleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const mod = res.data;
      setModuleTitle(mod.title);
      setRole(mod.role);
      setFlashcards(mod.flashcards || []);
      setVideos(mod.videos || []);
      setQuizzes(mod.quizzes || []);
      setLoading(false);
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to fetch module');
      setLoading(false);
    }
  };

  useEffect(() => {
    const userRole = localStorage.getItem('role');
    if (userRole !== 'ADMIN') router.push('/auth/dashboard');
    else fetchModule();
  }, [moduleId]);

  // CRUD Actions
  const addFlashcard = async () => {
    if (!flashQuestion || !flashAnswer) return setMessage('Both fields required');
    try {
      await api.post(
        '/training/flashcards',
        { moduleId, question: flashQuestion, answer: flashAnswer },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFlashQuestion('');
      setFlashAnswer('');
      setMessage('✅ Flashcard added successfully');
      fetchModule();
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to add flashcard');
    }
  };

  const deleteFlashcard = async (id: string) => {
    if (!confirm('Are you sure you want to delete this flashcard?')) return;
    try {
      await api.delete(`/training/flashcards/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('✅ Flashcard deleted successfully');
      fetchModule();
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('❌ Failed to delete flashcard');
    }
  };

  const addVideo = async () => {
    if (!videoTitle || !videoUrl) return setMessage('Both fields required');
    try {
      await api.post(
        '/training/videos',
        { moduleId, title: videoTitle, url: videoUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVideoTitle('');
      setVideoUrl('');
      setMessage('✅ Video added successfully');
      fetchModule();
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('❌ Failed to add video');
    }
  };

  const deleteVideo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    try {
      await api.delete(`/training/videos/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('✅ Video deleted successfully');
      fetchModule();
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('❌ Failed to delete video');
    }
  };

  const addQuiz = async () => {
    if (!quizTitle) return setMessage('Quiz title required');
    try {
      await api.post(
        '/training/quizzes',
        { moduleId, title: quizTitle },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQuizTitle('');
      setMessage('✅ Quiz added successfully');
      fetchModule();
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('❌ Failed to add quiz');
    }
  };

  const deleteQuiz = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quiz and all its questions?')) return;
    try {
      await api.delete(`/training/quizzes/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('✅ Quiz deleted successfully');
      fetchModule();
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('❌ Failed to delete quiz');
    }
  };

  const addQuizQuestion = async (quizId: string) => {
    if (!questionText) return setMessage('Question required');
    try {
      const body: any = { quizId, type: questionType, question: questionText };
      if (questionType === 'MCQ') body.options = options.filter(o => o.text.trim());
      if (questionType === 'SUBJECTIVE') body.answer = subjectiveAnswer;

      await api.post('/training/questions', body, { headers: { Authorization: `Bearer ${token}` } });
      setQuestionText('');
      setOptions([{ text: '', isCorrect: false }]);
      setSubjectiveAnswer('');
      setMessage('✅ Question added successfully');
      fetchModule();
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('❌ Failed to add question');
    }
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await api.delete(`/training/questions/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('✅ Question deleted successfully');
      fetchModule();
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('❌ Failed to delete question');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 text-center border border-white/20 shadow-2xl">
          <div className="relative">
            <div className="animate-spin w-20 h-20 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-6"></div>
            <div className="absolute inset-0 animate-ping w-20 h-20 border-4 border-blue-400/30 rounded-full mx-auto"></div>
          </div>
          <p className="text-white text-xl font-semibold">Loading Module...</p>
          <p className="text-blue-200 text-sm mt-2">Preparing admin interface</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => router.back()} 
              className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Modules</span>
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="px-3 py-1 bg-blue-500/20 rounded-full text-blue-300 text-sm font-medium">
                {role} Module
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{moduleTitle}</h1>
              <p className="text-gray-400">Module Management Dashboard</p>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-500/20 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-300">{flashcards.length}</div>
              <div className="text-sm text-blue-200">Flashcards</div>
            </div>
            <div className="bg-green-500/20 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-300">{videos.length}</div>
              <div className="text-sm text-green-200">Videos</div>
            </div>
            <div className="bg-purple-500/20 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-purple-300">{quizzes.length}</div>
              <div className="text-sm text-purple-200">Quizzes</div>
            </div>
            <div className="bg-orange-500/20 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-orange-300">
                {quizzes.reduce((sum, q) => sum + (q.questions?.length || 0), 0)}
              </div>
              <div className="text-sm text-orange-200">Questions</div>
            </div>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-xl border ${
            message.includes('✅') 
              ? 'bg-green-500/20 border-green-500/30 text-green-300' 
              : 'bg-red-500/20 border-red-500/30 text-red-300'
          } backdrop-blur-xl`}>
            {message}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-2 border border-white/20 shadow-xl">
          <div className="flex space-x-2">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'flashcards', label: 'Flashcards', icon: '🃏' },
              { id: 'videos', label: 'Videos', icon: '🎬' },
              { id: 'quizzes', label: 'Quizzes', icon: '🧠' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Sections */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <span className="text-2xl mr-2">🃏</span>
                Flashcards Overview
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total Cards</span>
                  <span className="text-blue-300 font-bold">{flashcards.length}</span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full" style={{ width: `${Math.min(100, (flashcards.length / 10) * 100)}%` }}></div>
                </div>
                <p className="text-sm text-gray-400">Recommended: 10+ cards per module</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <span className="text-2xl mr-2">🎬</span>
                Videos Overview
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total Videos</span>
                  <span className="text-green-300 font-bold">{videos.length}</span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-2">
                  <div className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full" style={{ width: `${Math.min(100, (videos.length / 5) * 100)}%` }}></div>
                </div>
                <p className="text-sm text-gray-400">Recommended: 3-5 videos per module</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <span className="text-2xl mr-2">🧠</span>
                Quizzes Overview
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total Quizzes</span>
                  <span className="text-purple-300 font-bold">{quizzes.length}</span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-2">
                  <div className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full" style={{ width: `${Math.min(100, (quizzes.length / 3) * 100)}%` }}></div>
                </div>
                <p className="text-sm text-gray-400">Recommended: 2-3 quizzes per module</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'flashcards' && (
          <div className="space-y-6">
            {/* Add Flashcard Form */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <span className="text-2xl mr-2">➕</span>
                Add New Flashcard
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Question</label>
                  <textarea
                    placeholder="Enter the question..."
                    value={flashQuestion}
                    onChange={(e) => setFlashQuestion(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-800/50 border border-slate-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Answer</label>
                  <textarea
                    placeholder="Enter the answer..."
                    value={flashAnswer}
                    onChange={(e) => setFlashAnswer(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-800/50 border border-slate-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    rows={3}
                  />
                </div>
              </div>
              <button
                onClick={addFlashcard}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Add Flashcard
              </button>
            </div>

            {/* Flashcards List */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <span className="text-2xl mr-2">📚</span>
                Existing Flashcards ({flashcards.length})
              </h3>
              {flashcards.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🃏</div>
                  <p className="text-gray-400 text-lg">No flashcards yet</p>
                  <p className="text-gray-500 text-sm">Add your first flashcard above</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {flashcards.map((f) => (
                    <div key={f.id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-600 hover:border-slate-500 transition-colors">
                      <div className="mb-3">
                        <div className="text-sm text-blue-300 font-semibold mb-1">Question:</div>
                        <div className="text-white">{f.question}</div>
                      </div>
                      <div className="mb-4">
                        <div className="text-sm text-green-300 font-semibold mb-1">Answer:</div>
                        <div className="text-gray-300">{f.answer}</div>
                      </div>
                      <button
                        onClick={() => deleteFlashcard(f.id)}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'videos' && (
          <div className="space-y-6">
            {/* Add Video Form */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <span className="text-2xl mr-2">➕</span>
                Add New Video
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Video Title</label>
                  <input
                    type="text"
                    placeholder="Enter video title..."
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-800/50 border border-slate-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Video URL</label>
                  <input
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-800/50 border border-slate-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                  />
                </div>
              </div>
              <button
                onClick={addVideo}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Add Video
              </button>
            </div>

            {/* Videos List */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <span className="text-2xl mr-2">🎬</span>
                Existing Videos ({videos.length})
              </h3>
              {videos.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎬</div>
                  <p className="text-gray-400 text-lg">No videos yet</p>
                  <p className="text-gray-500 text-sm">Add your first video above</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {videos.map((v) => (
                    <div key={v.id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-600 hover:border-slate-500 transition-colors">
                      <div className="mb-3">
                        <div className="text-lg font-semibold text-white mb-2">{v.title}</div>
                        <a 
                          href={v.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-sm break-all transition-colors"
                        >
                          {v.url}
                        </a>
                      </div>
                      <button
                        onClick={() => deleteVideo(v.id)}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'quizzes' && (
          <div className="space-y-6">
            {/* Add Quiz Form */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <span className="text-2xl mr-2">➕</span>
                Add New Quiz
              </h3>
              <div className="flex gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Enter quiz title..."
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  className="flex-1 p-3 rounded-xl bg-slate-800/50 border border-slate-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
                <button
                  onClick={addQuiz}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Add Quiz
                </button>
              </div>
            </div>

            {/* Quizzes List */}
            <div className="space-y-4">
              {quizzes.length === 0 ? (
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 border border-white/20 shadow-xl text-center">
                  <div className="text-6xl mb-4">🧠</div>
                  <p className="text-gray-400 text-lg">No quizzes yet</p>
                  <p className="text-gray-500 text-sm">Add your first quiz above</p>
                </div>
              ) : (
                quizzes.map((q) => (
                  <div key={q.id} className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xl font-bold text-white flex items-center">
                        <span className="text-2xl mr-2">🧠</span>
                        {q.title}
                      </h4>
                      <div className="flex items-center space-x-3">
                        <span className="px-3 py-1 bg-purple-500/20 rounded-full text-purple-300 text-sm">
                          {q.questions?.length || 0} questions
                        </span>
                        <button
                          onClick={() => setSelectedQuiz(selectedQuiz?.id === q.id ? null : q)}
                          className="bg-green-500/20 hover:bg-green-500/30 text-green-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          {selectedQuiz?.id === q.id ? 'Cancel' : 'Add Question'}
                        </button>
                        <button
                          onClick={() => deleteQuiz(q.id)}
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Delete Quiz
                        </button>
                      </div>
                    </div>

                    {/* Questions List */}
                    {q.questions && q.questions.length > 0 && (
                      <div className="mb-4 space-y-3">
                        {q.questions.map((qq, index) => (
                          <div key={qq.id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-600">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="px-2 py-1 bg-blue-500/20 rounded text-blue-300 text-xs font-medium">
                                    Q{index + 1}
                                  </span>
                                  <span className="px-2 py-1 bg-gray-500/20 rounded text-gray-300 text-xs">
                                    {qq.type}
                                  </span>
                                </div>
                                <div className="text-white font-medium mb-2">{qq.question}</div>
                                {qq.type === 'MCQ' && qq.options ? (
                                  <div className="space-y-1">
                                    {qq.options.map((o, optIndex) => (
                                      <div key={o.id} className={`text-sm p-2 rounded ${o.isCorrect ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>
                                        {String.fromCharCode(65 + optIndex)}. {o.text} {o.isCorrect && '✓'}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-sm text-green-300 bg-green-500/20 p-2 rounded">
                                    Answer: {qq.answer}
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => deleteQuestion(qq.id)}
                                className="ml-4 bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-1 rounded text-sm transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Question Form */}
                    {selectedQuiz?.id === q.id && (
                      <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-600">
                        <h5 className="text-lg font-semibold text-white mb-4">Add Question to: {q.title}</h5>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Question Text</label>
                            <textarea
                              placeholder="Enter your question..."
                              value={questionText}
                              onChange={(e) => setQuestionText(e.target.value)}
                              className="w-full p-3 rounded-xl bg-slate-700/50 border border-slate-500 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                              rows={2}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Question Type</label>
                            <select
                              value={questionType}
                              onChange={(e) => setQuestionType(e.target.value as 'MCQ' | 'SUBJECTIVE')}
                              className="w-full p-3 rounded-xl bg-slate-700/50 border border-slate-500 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                            >
                              <option value="MCQ">Multiple Choice (MCQ)</option>
                              <option value="SUBJECTIVE">Subjective</option>
                            </select>
                          </div>

                          {questionType === 'MCQ' ? (
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">Answer Options</label>
                              <div className="space-y-2">
                                {options.map((opt, idx) => (
                                  <div key={idx} className="flex gap-2 items-center">
                                    <input
                                      type="text"
                                      placeholder={`Option ${idx + 1}`}
                                      value={opt.text}
                                      onChange={(e) => {
                                        const newOptions = [...options];
                                        newOptions[idx].text = e.target.value;
                                        setOptions(newOptions);
                                      }}
                                      className="flex-1 p-2 rounded-lg bg-slate-700/50 border border-slate-500 text-white placeholder-gray-400 focus:border-purple-500 transition-all"
                                    />
                                    <label className="flex items-center space-x-2 text-sm text-gray-300">
                                      <input
                                        type="checkbox"
                                        checked={opt.isCorrect}
                                        onChange={(e) => {
                                          const newOptions = [...options];
                                          newOptions[idx].isCorrect = e.target.checked;
                                          setOptions(newOptions);
                                        }}
                                        className="rounded border-slate-500 text-green-500 focus:ring-green-500/20"
                                      />
                                      <span>Correct</span>
                                    </label>
                                    {options.length > 1 && (
                                      <button
                                        onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                                        className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-2 rounded-lg text-sm transition-colors"
                                      >
                                        Remove
                                      </button>
                                    )}
                                  </div>
                                ))}
                                <button
                                  onClick={() => setOptions([...options, { text: '', isCorrect: false }])}
                                  className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                  Add Option
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">Correct Answer</label>
                              <textarea
                                placeholder="Enter the correct answer..."
                                value={subjectiveAnswer}
                                onChange={(e) => setSubjectiveAnswer(e.target.value)}
                                className="w-full p-3 rounded-xl bg-slate-700/50 border border-slate-500 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                rows={2}
                              />
                            </div>
                          )}

                          <button
                            onClick={() => addQuizQuestion(q.id)}
                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                          >
                            Add Question
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
