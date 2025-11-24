'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NotificationBell from '@/components/NotificationBell';
import api from '@/utils/axiosInstance';

interface Quiz {
  id: string;
  title: string;
  description?: string;
  questions: any[];
  rewardAmount: number;
  cleanCoinReward?: number;
  targetRole?: string;
  maxAttempts: number;
  startDate: string;
  endDate: string;
  status: string;
  participations: any[];
}

export default function QuizzesPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    rewardAmount: '',
    cleanCoinReward: '',
    targetRole: '',
    maxAttempts: '1',
    startDate: '',
    endDate: '',
    questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0 }],
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

    fetchQuizzes();
  }, [router]);

  const fetchQuizzes = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await api.get('/business/quizzes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuizzes(response.data);
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      alert('Please enter a quiz title');
      return;
    }
    
    if (!formData.rewardAmount || parseFloat(formData.rewardAmount) < 0) {
      alert('Please enter a valid XP reward amount');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      alert('Please select both start and end dates');
      return;
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      alert('End date must be after start date');
      return;
    }

    // Validate questions
    const validQuestions = formData.questions.filter(q => 
      q.question.trim() && 
      q.options.every(opt => opt.trim()) &&
      q.correctAnswer >= 0 && q.correctAnswer < q.options.length
    );

    if (validQuestions.length === 0) {
      alert('Please add at least one valid question with all options filled');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      
      // Format questions properly
      const formattedQuestions = validQuestions.map(q => ({
        question: q.question.trim(),
        options: q.options.map(opt => opt.trim()),
        correctAnswer: q.correctAnswer,
      }));

      await api.post('/business/quizzes', {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        rewardAmount: parseFloat(formData.rewardAmount),
        cleanCoinReward: formData.cleanCoinReward ? parseInt(formData.cleanCoinReward) : 0,
        targetRole: formData.targetRole || null,
        maxAttempts: parseInt(formData.maxAttempts) || 1,
        startDate: formData.startDate,
        endDate: formData.endDate,
        questions: formattedQuestions,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      alert('Quiz created successfully! Activate it to make it available to users.');
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        rewardAmount: '',
        cleanCoinReward: '',
        targetRole: '',
        maxAttempts: '1',
        startDate: '',
        endDate: '',
        questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0 }],
      });
      fetchQuizzes();
    } catch (error: any) {
      console.error('Quiz creation error:', error);
      alert(error.response?.data?.message || 'Failed to create quiz. Please check all fields and try again.');
    }
  };

  const handleActivate = async (quizId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      await api.post(`/business/quizzes/${quizId}/activate`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Quiz activated!');
      fetchQuizzes();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to activate quiz');
    }
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [...formData.questions, { question: '', options: ['', '', '', ''], correctAnswer: 0 }],
    });
  };

  const removeQuestion = (index: number) => {
    setFormData({
      ...formData,
      questions: formData.questions.filter((_, i) => i !== index),
    });
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...formData.questions];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, questions: updated });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-500';
      case 'ACTIVE':
        return 'bg-green-500';
      case 'COMPLETED':
        return 'bg-blue-500';
      case 'EXPIRED':
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
              <h1 className="text-4xl font-bold text-white mb-2">Awareness Quizzes</h1>
              <p className="text-emerald-200">Create and manage public awareness quizzes with rewards</p>
            </div>
          </div>
          <div className="flex gap-4">
            {currentUserId && <NotificationBell userId={currentUserId} />}
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              + Create Quiz
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white">Loading quizzes...</p>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-12 text-center border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-2">No Quizzes Yet</h3>
            <p className="text-emerald-200 mb-6">Create your first awareness quiz</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Create Quiz
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getStatusColor(quiz.status)}`}>
                    {quiz.status}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{quiz.title}</h3>
                {quiz.description && (
                  <p className="text-emerald-200 text-sm mb-4 line-clamp-2">{quiz.description}</p>
                )}
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center justify-between text-white/80">
                    <span>Questions:</span>
                    <span className="font-semibold text-white">{quiz.questions.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-white/80">
                    <span>Reward:</span>
                    <span className="font-semibold text-green-400">
                      {quiz.rewardAmount} XP
                      {quiz.cleanCoinReward && quiz.cleanCoinReward > 0 && ` + ${quiz.cleanCoinReward} CC`}
                    </span>
                  </div>
                  {quiz.targetRole && (
                    <div className="flex items-center justify-between text-white/80">
                      <span>Target:</span>
                      <span className="font-semibold text-blue-400">{quiz.targetRole}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-white/80">
                    <span>Participants:</span>
                    <span className="font-semibold text-white">{quiz.participations.length}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <span>📅</span>
                    <span className="text-xs">{new Date(quiz.startDate).toLocaleDateString()} - {new Date(quiz.endDate).toLocaleDateString()}</span>
                  </div>
                </div>
                {quiz.status === 'DRAFT' && (
                  <button
                    onClick={() => handleActivate(quiz.id)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition-colors"
                  >
                    Activate Quiz
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-4">Create Awareness Quiz</h2>
            <form onSubmit={handleCreateQuiz} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium mb-2">Target Role</label>
                  <select
                    value={formData.targetRole}
                    onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="">All Roles</option>
                    <option value="CITIZEN">Citizen</option>
                    <option value="WORKER">Worker</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">XP Reward *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.rewardAmount}
                    onChange={(e) => setFormData({ ...formData, rewardAmount: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">CleanCoin Reward</label>
                  <input
                    type="number"
                    value={formData.cleanCoinReward}
                    onChange={(e) => setFormData({ ...formData, cleanCoinReward: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    min="0"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
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
                <div>
                  <label className="block text-sm font-medium mb-2">Max Attempts *</label>
                  <input
                    type="number"
                    value={formData.maxAttempts}
                    onChange={(e) => setFormData({ ...formData, maxAttempts: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Questions *</label>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="text-sm bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    + Add Question
                  </button>
                </div>
                {formData.questions.map((q, index) => (
                  <div key={index} className="mb-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Question {index + 1}</span>
                      {formData.questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(index)}
                          className="text-red-600 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                      placeholder="Question text"
                      className="w-full px-4 py-2 border rounded-lg mb-2"
                      required
                    />
                    <div className="space-y-2">
                      {q.options.map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${index}`}
                            checked={q.correctAnswer === optIndex}
                            onChange={() => updateQuestion(index, 'correctAnswer', optIndex)}
                            className="w-4 h-4"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const updated = [...q.options];
                              updated[optIndex] = e.target.value;
                              updateQuestion(index, 'options', updated);
                            }}
                            placeholder={`Option ${optIndex + 1}`}
                            className="flex-1 px-4 py-2 border rounded-lg"
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
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
                  className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg"
                >
                  Create Quiz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

