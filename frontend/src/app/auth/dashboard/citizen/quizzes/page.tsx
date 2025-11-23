'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/axiosInstance';
import RoleGuard from '@/components/RoleGuard';

interface Quiz {
  id: string;
  title: string;
  description?: string;
  questions: any[];
  rewardAmount: number;
  cleanCoinReward: number;
  targetRole?: string;
  maxAttempts: number;
  startDate: string;
  endDate: string;
  status: string;
  organizer: {
    id: string;
    name: string;
    businessType?: string;
  };
  _count?: {
    participations: number;
  };
}

export default function CitizenQuizzesPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [userAttempts, setUserAttempts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const response = await api.get('/business/quizzes/active?role=CITIZEN');
      setQuizzes(response.data);
      
      // Check user attempts for each quiz
      const attempts: Record<string, number> = {};
      for (const quiz of response.data) {
        try {
          const participationRes = await api.get(`/business/quizzes/${quiz.id}/my-participation`);
          attempts[quiz.id] = participationRes.data?.attempts || 0;
        } catch (err: any) {
          // If endpoint doesn't exist or user hasn't attempted, set to 0
          attempts[quiz.id] = 0;
        }
      }
      setUserAttempts(attempts);
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setAnswers(new Array(quiz.questions.length).fill(-1));
    setResult(null);
  };

  const submitQuiz = async () => {
    if (!selectedQuiz) return;

    setSubmitting(true);
    try {
      // Calculate score
      let correct = 0;
      selectedQuiz.questions.forEach((q: any, index: number) => {
        if (answers[index] === q.correctAnswer) {
          correct++;
        }
      });
      const score = (correct / selectedQuiz.questions.length) * 100;

      const response = await api.post(`/business/quizzes/${selectedQuiz.id}/participate`, {
        answers: answers.map((ans, idx) => ({
          questionIndex: idx,
          selectedAnswer: ans,
        })),
        score,
      });

      setResult({
        score,
        correct,
        total: selectedQuiz.questions.length,
        rewardEarned: response.data.rewardEarned,
        cleanCoinReward: score >= 70 ? selectedQuiz.cleanCoinReward : 0,
      });

      // Refresh quizzes to update attempt count
      await fetchQuizzes();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const isExpired = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  const canAttempt = (quiz: Quiz) => {
    if (isExpired(quiz.endDate)) return false;
    if (quiz.status !== 'ACTIVE') return false;
    const attempts = userAttempts[quiz.id] || 0;
    return attempts < quiz.maxAttempts;
  };

  if (loading) {
    return (
      <RoleGuard role="CITIZEN">
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
          <div className="text-white text-xl">Loading quizzes...</div>
        </div>
      </RoleGuard>
    );
  }

  if (selectedQuiz && !result) {
    return (
      <RoleGuard role="CITIZEN">
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-white">{selectedQuiz.title}</h2>
                <button
                  onClick={() => {
                    setSelectedQuiz(null);
                    setAnswers([]);
                  }}
                  className="text-white hover:text-red-400"
                >
                  ✕
                </button>
              </div>

              {selectedQuiz.description && (
                <p className="text-blue-200 mb-6">{selectedQuiz.description}</p>
              )}

              <div className="space-y-6">
                {selectedQuiz.questions.map((q: any, qIndex: number) => (
                  <div key={qIndex} className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h3 className="text-white font-semibold mb-4">
                      Question {qIndex + 1}: {q.question}
                    </h3>
                    <div className="space-y-2">
                      {q.options.map((option: string, optIndex: number) => (
                        <label
                          key={optIndex}
                          className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                            answers[qIndex] === optIndex
                              ? 'bg-blue-500/30 border-2 border-blue-400'
                              : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${qIndex}`}
                            checked={answers[qIndex] === optIndex}
                            onChange={() => {
                              const newAnswers = [...answers];
                              newAnswers[qIndex] = optIndex;
                              setAnswers(newAnswers);
                            }}
                            className="mr-3"
                          />
                          <span className="text-white">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={submitQuiz}
                disabled={submitting || answers.some(a => a === -1)}
                className="mt-8 w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </button>
            </div>
          </div>
        </div>
      </RoleGuard>
    );
  }

  if (result && selectedQuiz) {
    return (
      <RoleGuard role="CITIZEN">
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Quiz Results</h2>
              <div className="text-6xl mb-4">
                {result.score >= 70 ? '🎉' : '📝'}
              </div>
              <div className="text-4xl font-bold text-white mb-2">
                {result.score.toFixed(1)}%
              </div>
              <p className="text-blue-200 mb-6">
                You got {result.correct} out of {result.total} questions correct
              </p>

              {result.score >= 70 ? (
                <div className="bg-green-500/20 rounded-xl p-6 mb-6 border border-green-400/30">
                  <p className="text-green-200 font-semibold mb-2">Congratulations!</p>
                  {result.rewardEarned > 0 && (
                    <p className="text-white">You earned {result.rewardEarned} XP</p>
                  )}
                  {result.cleanCoinReward > 0 && (
                    <p className="text-white">You earned {result.cleanCoinReward} CleanCoins 🪙</p>
                  )}
                </div>
              ) : (
                <div className="bg-yellow-500/20 rounded-xl p-6 mb-6 border border-yellow-400/30">
                  <p className="text-yellow-200">You need 70% to earn rewards. Try again next time!</p>
                </div>
              )}

              <button
                onClick={() => {
                  setSelectedQuiz(null);
                  setResult(null);
                  setAnswers([]);
                  fetchQuizzes();
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300"
              >
                Back to Quizzes
              </button>
            </div>
          </div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard role="CITIZEN">
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2">📝 Awareness Quizzes</h1>
          <p className="text-blue-200 text-lg mb-8">
            Test your knowledge and earn rewards!
          </p>

          {quizzes.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/20">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-blue-200 text-xl">No quizzes available at the moment</p>
              <p className="text-gray-400 mt-2">Check back later for new quizzes!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => {
                const expired = isExpired(quiz.endDate);
                const attempted = (userAttempts[quiz.id] || 0) >= quiz.maxAttempts;
                const canTake = canAttempt(quiz);

                return (
                  <div
                    key={quiz.id}
                    className={`bg-white/10 backdrop-blur-xl rounded-2xl p-6 border ${
                      expired || attempted
                        ? 'border-gray-400/20 opacity-60'
                        : 'border-green-400/30 hover:border-green-400/50'
                    } transition-all duration-300`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">{quiz.title}</h3>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-xs bg-blue-500/20 text-blue-200 px-2 py-1 rounded">
                            {quiz.organizer.name}
                          </span>
                          {quiz.organizer.businessType && (
                            <span className="text-xs bg-gray-500/20 text-gray-300 px-2 py-1 rounded">
                              {quiz.organizer.businessType}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {quiz.description && (
                      <p className="text-blue-200 text-sm mb-4 line-clamp-2">{quiz.description}</p>
                    )}

                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center justify-between text-white/80">
                        <span>Questions:</span>
                        <span className="font-semibold text-white">{quiz.questions.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-white/80">
                        <span>Rewards:</span>
                        <span className="font-semibold text-green-400">
                          {quiz.rewardAmount} XP
                          {quiz.cleanCoinReward > 0 && ` + ${quiz.cleanCoinReward} CC`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-white/80">
                        <span>📅</span>
                        <span className="text-xs">
                          Expires: {new Date(quiz.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      {attempted && (
                        <div className="text-yellow-300 text-xs">
                          ✓ Already attempted
                        </div>
                      )}
                      {expired && (
                        <div className="text-red-300 text-xs">
                          ⏰ Expired
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => startQuiz(quiz)}
                      disabled={!canTake}
                      className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                        canTake
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                          : 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {expired
                        ? 'Expired'
                        : attempted
                        ? 'Already Attempted'
                        : 'Start Quiz'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}

