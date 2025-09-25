'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/utils/axiosInstance';
import RoleGuard from '@/components/RoleGuard';

// Types
type Flashcard = { id: string; question: string; answer: string };
type Video = { id: string; title: string; url: string };
type QuizOption = { id: string; text: string; isCorrect: boolean };
type QuizQuestion = { id: string; question: string; type: 'MCQ' | 'SUBJECTIVE'; options?: QuizOption[]; answer?: string };
type Quiz = { id: string; title: string; questions: QuizQuestion[] };

export default function WorkerModulePage() {
  const router = useRouter();
  const { moduleId } = useParams();

  // --- State Hooks ---
  const [moduleTitle, setModuleTitle] = useState('');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Game state
  const [currentSection, setCurrentSection] = useState<'overview' | 'flashcards' | 'videos' | 'quiz'>('overview');
  const [userStats, setUserStats] = useState({
    xp: 0,
    streak: 0,
    accuracy: 0,
    completedItems: 0,
    totalItems: 0
  });

  // Flashcards state
  const [currentFlashcard, setCurrentFlashcard] = useState(0);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [masteredCards, setMasteredCards] = useState<Set<number>>(new Set());

  // Quiz state
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [showCelebration, setShowCelebration] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  // --- API Functions ---
  const recordProgress = async (type: 'FLASHCARD' | 'VIDEO' | 'QUIZ', itemId: string, status: 'COMPLETED' | 'MASTERED', xp: number) => {
    try {
      await api.post(
        `/training/progress`,
        { moduleId, type, itemId, status, xp },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUserStats(prev => ({
        ...prev,
        xp: prev.xp + xp,
        completedItems: prev.completedItems + 1
      }));
    } catch (err) {
      console.error('Failed to record progress', err);
    }
  };

  const fetchModule = async () => {
    try {
      const res = await api.get(`/training/modules/${moduleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const mod = res.data;
      setModuleTitle(mod.title);
      setFlashcards(mod.flashcards || []);
      setVideos(mod.videos || []);
      setQuizzes(mod.quizzes || []);

      const totalItems = (mod.flashcards?.length || 0) + (mod.videos?.length || 0) + (mod.quizzes?.length || 0);
      const progress = mod.userProgress?.[0];
      const completedItems = progress?.completed ? totalItems : 0;

      setUserStats(prev => ({
        ...prev,
        totalItems,
        completedItems,
        xp: progress?.xpEarned || 0
      }));

      setLoading(false);
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to fetch module');
      setLoading(false);
    }
  };

  // --- Effects ---
  useEffect(() => {
    if (moduleId) fetchModule();
  }, [moduleId]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (quizStarted && !submitted && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && !submitted) {
      handleSubmitAnswer();
    }
    return () => clearTimeout(timer);
  }, [quizStarted, submitted, timeLeft]);

  // --- Handlers ---
  const handleFlashcardFlip = (index: number) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      newSet.has(index) ? newSet.delete(index) : newSet.add(index);
      return newSet;
    });
  };

  const handleMasterCard = (index: number) => {
    if (masteredCards.has(index)) return;
    setMasteredCards(prev => new Set([...prev, index]));
    recordProgress('FLASHCARD', flashcards[index].id, 'MASTERED', 10);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 1000);
  };

  const handleVideoWatched = (videoId: string) => {
    recordProgress('VIDEO', videoId, 'COMPLETED', 15);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 1000);
  };

  const handleOptionSelect = (optionId: string) => {
    if (!submitted) setSelectedOption(optionId);
  };

  const handleSubmitAnswer = () => {
    const currentQ = quizzes[currentQuizIndex]?.questions[currentQuestionIndex];
    if (!currentQ) return;
    if (!selectedOption && currentQ.type === 'MCQ') return;

    const isCorrect = currentQ.options?.find(o => o.id === selectedOption)?.isCorrect;
    if (isCorrect) setScore(prev => prev + 1);

    setSubmitted(true);
    setTimeLeft(30);
  };

  const handleNextQuestion = () => {
    const quiz = quizzes[currentQuizIndex];
    if (currentQuestionIndex + 1 < quiz.questions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setSubmitted(false);
      setTimeLeft(30);
    } else {
      setShowScore(true);
      setQuizStarted(false);
      const accuracy = (score / quiz.questions.length) * 100;
      const bonusXP = accuracy >= 80 ? 50 : accuracy >= 60 ? 25 : 10;
      setUserStats(prev => ({ ...prev, accuracy }));
      recordProgress('QUIZ', quiz.id, 'COMPLETED', score * 25 + bonusXP);
    }
  };

  const startQuiz = () => {
    setQuizStarted(true);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setSubmitted(false);
    setShowScore(false);
    setTimeLeft(30);
  };

  // --- Rendering ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
        <div className="game-card p-8 text-center">
          <div className="animate-spin w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading module...</p>
        </div>
      </div>
    );
  }

  const currentQuiz = quizzes[currentQuizIndex];
  const currentQ = currentQuiz?.questions[currentQuestionIndex];
  const progressPercentage = userStats.totalItems > 0 ? (userStats.completedItems / userStats.totalItems) * 100 : 0;

  return (
    <RoleGuard role="WORKER">
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 relative overflow-hidden">
        {showCelebration && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="text-6xl celebration">🎉</div>
          </div>
        )}

        <div className="relative z-10 p-6 space-y-6">
          {/* Header & Overview */}
          <div className="slide-in-up">
            <div className="game-card p-6">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => router.back()} className="game-button-secondary px-4 py-2">← Back</button>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{userStats.xp}</div>
                    <div className="text-xs text-gray-400">XP</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{progressPercentage.toFixed(0)}%</div>
                    <div className="text-xs text-gray-400">Completed</div>
                  </div>
                </div>
              </div>

              <h1 className="text-4xl font-bold text-white mb-4 text-center">
                🎯 <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-400">{moduleTitle}</span>
              </h1>

              <div className="w-full bg-slate-700 rounded-full h-3 mb-4">
                <div
                  className="bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              <div className="flex justify-center space-x-2">
                {['overview', 'flashcards', 'videos', 'quiz'].map(section => (
                  <button
                    key={section}
                    onClick={() => setCurrentSection(section as any)}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                      currentSection === section
                        ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white'
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    }`}
                  >
                    {section.charAt(0).toUpperCase() + section.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sections */}
          {currentSection === 'overview' && (
            <div className="slide-in-left">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Flashcards Card */}
                <div className="game-card p-6 text-center cursor-pointer hover:scale-105 transition-all" onClick={() => setCurrentSection('flashcards')}>
                  <div className="text-5xl mb-4">🃏</div>
                  <h3 className="text-xl font-bold text-white mb-2">Flashcards</h3>
                  <p className="text-gray-300 mb-4">Master key concepts</p>
                  <div className="text-2xl font-bold text-blue-400">{flashcards.length}</div>
                  <div className="text-sm text-gray-400">Cards</div>
                </div>

                {/* Videos Card */}
                <div className="game-card p-6 text-center cursor-pointer hover:scale-105 transition-all" onClick={() => setCurrentSection('videos')}>
                  <div className="text-5xl mb-4">🎬</div>
                  <h3 className="text-xl font-bold text-white mb-2">Videos</h3>
                  <p className="text-gray-300 mb-4">Watch and learn</p>
                  <div className="text-2xl font-bold text-green-400">{videos.length}</div>
                  <div className="text-sm text-gray-400">Videos</div>
                </div>

                {/* Quiz Card */}
                <div className="game-card p-6 text-center cursor-pointer hover:scale-105 transition-all" onClick={() => setCurrentSection('quiz')}>
                  <div className="text-5xl mb-4">🧠</div>
                  <h3 className="text-xl font-bold text-white mb-2">Quizzes</h3>
                  <p className="text-gray-300 mb-4">Test your knowledge</p>
                  <div className="text-2xl font-bold text-teal-400">{quizzes.length}</div>
                  <div className="text-sm text-gray-400">Quizzes</div>
                </div>
              </div>
            </div>
          )}

          {/* Flashcards Section */}
          {currentSection === 'flashcards' && flashcards.length > 0 && (
            <div className="slide-in-right">
              <div className="game-card p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl font-bold text-white">🃏 Flashcard Arena</h2>
                  <div className="text-green-300">{currentFlashcard + 1} / {flashcards.length}</div>
                </div>

                <div className="max-w-2xl mx-auto">
                  <div className={`flashcard ${flippedCards.has(currentFlashcard) ? 'flipped' : ''} mb-6`}>
                    <div className="flashcard-inner" onClick={() => handleFlashcardFlip(currentFlashcard)}>
                      <div className="flashcard-front">
                        <div className="text-center">
                          <div className="text-2xl mb-4">🤔</div>
                          <h3 className="text-xl font-bold mb-4">Question</h3>
                          <p className="text-lg">{flashcards[currentFlashcard]?.question}</p>
                        </div>
                      </div>
                      <div className="flashcard-back">
                        <div className="text-center">
                          <div className="text-2xl mb-4">💡</div>
                          <h3 className="text-xl font-bold mb-4">Answer</h3>
                          <p className="text-lg">{flashcards[currentFlashcard]?.answer}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <button onClick={() => setCurrentFlashcard(Math.max(0, currentFlashcard - 1))} disabled={currentFlashcard === 0} className="game-button-secondary px-6 py-3">← Previous</button>
                    {!masteredCards.has(currentFlashcard) && flippedCards.has(currentFlashcard) && (
                      <button onClick={() => handleMasterCard(currentFlashcard)} className="game-button-success px-6 py-3">✅ Mastered (+10 XP)</button>
                    )}
                    {masteredCards.has(currentFlashcard) && <div className="px-6 py-3 bg-green-900/30 border border-green-500/50 rounded-xl text-green-400 font-bold">✅ Mastered!</div>}
                    <button onClick={() => setCurrentFlashcard(Math.min(flashcards.length - 1, currentFlashcard + 1))} disabled={currentFlashcard === flashcards.length - 1} className="game-button-secondary px-6 py-3">Next →</button>
                  </div>

                  <div className="mt-6">
                    <div className="w-full bg-slate-700 rounded-full h-3">
                      <div className="bg-gradient-to-r from-green-400 to-teal-400 h-3 rounded-full transition-all duration-700" style={{ width: `${((currentFlashcard + 1) / flashcards.length) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Videos Section */}
          {currentSection === 'videos' && videos.length > 0 && (
            <div className="slide-in-left grid grid-cols-1 md:grid-cols-2 gap-6">
              {videos.map((v) => {
                const ytMatch = v.url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([\w-]+)/);
                const embedUrl = ytMatch ? `https://www.youtube.com/embed/${ytMatch[1]}` : null;
                return (
                  <div key={v.id} className="game-card p-4 space-y-2">
                    <p className="text-white font-bold text-lg">{v.title}</p>
                    {embedUrl ? <iframe src={embedUrl} className="w-full aspect-video rounded" /> : <video src={v.url} controls className="w-full rounded" />}
                    <button onClick={() => handleVideoWatched(v.id)} className="game-button-success w-full py-2">Mark Watched (+15 XP)</button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quiz Section */}
          {currentSection === 'quiz' && currentQuiz && (
            <div className="slide-in-right game-card p-6">
              {!quizStarted && !showScore ? (
                <div className="text-center text-white space-y-4">
                  <p className="text-2xl font-bold">{currentQuiz.title}</p>
                  <p>{currentQuiz.questions.length} Questions</p>
                  <button onClick={startQuiz} className="game-button-primary px-6 py-3 mt-2">🚀 Start Quiz</button>
                </div>
              ) : showScore ? (
                <div className="text-center text-white space-y-4">
                  <p className="text-3xl font-bold">🎉 Quiz Completed!</p>
                  <p>Score: {score} / {currentQuiz.questions.length}</p>
                  <p>Accuracy: {((score / currentQuiz.questions.length) * 100).toFixed(0)}%</p>
                  <button onClick={startQuiz} className="game-button-primary px-6 py-3 mt-2">Retry</button>
                </div>
              ) : (
                <div className="space-y-4 text-white">
                  <div className="flex justify-between">
                    <div>Q{currentQuestionIndex + 1} / {currentQuiz.questions.length}</div>
                    <div className={`px-2 py-1 rounded ${timeLeft <= 10 ? 'bg-red-500 animate-pulse' : 'bg-slate-700'}`}>⏰ {timeLeft}s</div>
                  </div>

                  <p className="text-lg font-bold">{currentQ?.question}</p>
                  {currentQ?.type === 'MCQ' && currentQ.options?.map(o => (
                    <div key={o.id} className={`p-2 mb-2 rounded cursor-pointer ${submitted ? (o.isCorrect ? 'bg-green-500' : selectedOption === o.id ? 'bg-red-500' : 'bg-slate-700') : selectedOption === o.id ? 'bg-green-500' : 'bg-slate-700'}`} onClick={() => handleOptionSelect(o.id)}>
                      {o.text}
                    </div>
                  ))}

                  <div>
                    {!submitted ? (
                      <button onClick={handleSubmitAnswer} disabled={!selectedOption} className="game-button-primary px-4 py-2 mt-2">Submit</button>
                    ) : (
                      <button onClick={handleNextQuestion} className="game-button-primary px-4 py-2 mt-2">{currentQuestionIndex + 1 < currentQuiz.questions.length ? 'Next →' : 'Finish'}</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {message && (
          <div className="fixed bottom-6 right-6 p-4 bg-red-900/30 text-red-400 rounded text-center">
            {message}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
