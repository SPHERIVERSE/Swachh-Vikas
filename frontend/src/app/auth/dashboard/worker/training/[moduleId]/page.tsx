'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/utils/axiosInstance';
import RoleGuard from '@/components/RoleGuard';

type Flashcard = { id: string; question: string; answer: string };
type Video = { id: string; title: string; url: string };
type QuizOption = { id: string; text: string; isCorrect: boolean };
type QuizQuestion = { id: string; question: string; type: 'MCQ' | 'SUBJECTIVE'; options?: QuizOption[]; answer?: string };
type Quiz = { id: string; title: string; questions: QuizQuestion[] };

export default function WorkerModulePage() {
  const router = useRouter();
  const { moduleId } = useParams();

  const [moduleTitle, setModuleTitle] = useState('');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const [currentSection, setCurrentSection] = useState<'overview' | 'flashcards' | 'videos' | 'quiz'>('overview');
  const [userStats, setUserStats] = useState({
    xp: 0,
    streak: 0,
    accuracy: 0,
    completedItems: 0,
    totalItems: 0
  });

  const [currentFlashcard, setCurrentFlashcard] = useState(0);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [masteredCards, setMasteredCards] = useState<Set<number>>(new Set());

  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [showCelebration, setShowCelebration] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const recordProgress = async (type: 'FLASHCARD' | 'VIDEO' | 'QUIZ', itemId: string, status: 'COMPLETED' | 'MASTERED', score?: number) => {
    try {
      await api.post(
        `/training/progress`,
        { moduleId, type, itemId, status, score },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUserStats(prev => ({
        ...prev,
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

  useEffect(() => {
    if (moduleId) {
      fetchModule();
    }
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

  const handleFlashcardFlip = (index: number) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) newSet.delete(index);
      else newSet.add(index);
      return newSet;
    });
  };

  const handleMasterCard = (index: number) => {
    if (masteredCards.has(index)) return;

    setMasteredCards(prev => new Set([...prev, index]));
    recordProgress('FLASHCARD', flashcards[index].id, 'MASTERED');

    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 2000);
  };

  const handleVideoWatched = (videoId: string) => {
    recordProgress('VIDEO', videoId, 'COMPLETED');

    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 2000);
  };

  const handleOptionSelect = (optionId: string) => {
    if (!submitted) setSelectedOption(optionId);
  };

  const handleSubmitAnswer = () => {
    const currentQ = currentQuiz?.questions[currentQuestionIndex];
    let isCorrect = false;

    if (currentQ?.type === 'MCQ') {
      if (!selectedOption) return;
      isCorrect = currentQ.options?.find((o) => o.id === selectedOption)?.isCorrect || false;
    } else if (currentQ?.type === 'SUBJECTIVE') {
      if (!userAnswer.trim()) return;
      isCorrect = userAnswer.trim().toLowerCase() === (currentQ.answer?.trim().toLowerCase() || '');
    }

    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    setSubmitted(true);
    setTimeLeft(30);
  };

  const handleNextQuestion = () => {
    const quiz = quizzes[currentQuizIndex];
    if (currentQuestionIndex + 1 < quiz.questions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setUserAnswer('');
      setSubmitted(false);
      setTimeLeft(30);
    } else {
      setShowScore(true);
      setQuizStarted(false);

      const accuracy = (score / quiz.questions.length) * 100;
      const bonusXP = accuracy >= 80 ? 50 : accuracy >= 60 ? 25 : 10;
      setUserStats(prev => ({ ...prev, accuracy }));

      recordProgress('QUIZ', quiz.id, 'COMPLETED', score);
    }
  };

  const startQuiz = () => {
    setQuizStarted(true);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setUserAnswer('');
    setSubmitted(false);
    setShowScore(false);
    setTimeLeft(30);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-green-900 to-emerald-900">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 text-center border border-white/20 shadow-2xl animate-fade-in">
          <div className="relative">
            <div className="animate-spin w-20 h-20 border-4 border-green-400 border-t-transparent rounded-full mx-auto mb-6"></div>
            <div className="absolute inset-0 animate-ping w-20 h-20 border-4 border-green-400/30 rounded-full mx-auto"></div>
          </div>
          <p className="text-white text-xl font-semibold">Loading Module...</p>
          <p className="text-green-200 text-sm mt-2">Preparing your training content</p>
        </div>
      </div>
    );
  }

  const currentQuiz = quizzes[currentQuizIndex];
  const currentQ = currentQuiz?.questions[currentQuestionIndex];
  const progressPercentage = userStats.totalItems > 0 ? (userStats.completedItems / userStats.totalItems) * 100 : 0;

  return (
    <RoleGuard role="WORKER">
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-emerald-900 relative overflow-hidden">
        <div className="absolute top-20 left-20 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

        {showCelebration && (
          <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
            <div className="text-6xl animate-pop-in">🎉</div>
            <div className="confetti-rain"></div>
          </div>
        )}

        <div className="relative z-10 p-6 space-y-6">
          <div className="animate-fade-in-down">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => router.back()}
                  className="bg-white/10 text-white font-semibold py-2 px-4 rounded-xl transition-transform duration-300 hover:scale-105 hover:bg-white/20"
                >
                  ← Back to Training
                </button>

                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{userStats.xp}</div>
                    <div className="text-xs text-yellow-200">XP</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{progressPercentage.toFixed(0)}%</div>
                    <div className="text-xs text-green-200">Complete</div>
                  </div>
                </div>
              </div>

              <h1 className="text-4xl font-bold text-white mb-4 text-center">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">{moduleTitle}</span>
              </h1>

              <div className="w-full h-3 bg-slate-700/50 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full rounded-full transition-all duration-1000 relative bg-gradient-to-r from-green-400 to-emerald-500"
                  style={{ width: `${progressPercentage}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                </div>
              </div>

              <div className="flex justify-center space-x-2 mt-4">
                {['overview', 'flashcards', 'videos', 'quiz'].map((section) => (
                  <button
                    key={section}
                    onClick={() => setCurrentSection(section as any)}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                      currentSection === section
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg transform scale-105'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {section.charAt(0).toUpperCase() + section.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {currentSection === 'overview' && (
            <div className="animate-fade-in-up">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 text-center border border-white/20 shadow-2xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-3xl"
                  onClick={() => setCurrentSection('flashcards')}>
                  <div className="text-5xl mb-4">🃏</div>
                  <h3 className="text-xl font-bold text-white mb-2">Flashcards</h3>
                  <p className="text-gray-300 mb-4">Master key concepts</p>
                  <div className="text-3xl font-bold text-green-400">{flashcards.length}</div>
                  <div className="text-sm text-green-200">Cards Available</div>
                </div>

                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 text-center border border-white/20 shadow-2xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-3xl"
                  onClick={() => setCurrentSection('videos')}>
                  <div className="text-5xl mb-4">🎬</div>
                  <h3 className="text-xl font-bold text-white mb-2">Videos</h3>
                  <p className="text-gray-300 mb-4">Watch and learn</p>
                  <div className="text-3xl font-bold text-emerald-400">{videos.length}</div>
                  <div className="text-sm text-emerald-200">Videos Available</div>
                </div>

                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 text-center border border-white/20 shadow-2xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-3xl"
                  onClick={() => setCurrentSection('quiz')}>
                  <div className="text-5xl mb-4">🧠</div>
                  <h3 className="text-xl font-bold text-white mb-2">Quizzes</h3>
                  <p className="text-gray-300 mb-4">Test your knowledge</p>
                  <div className="text-3xl font-bold text-teal-400">{quizzes.length}</div>
                  <div className="text-sm text-teal-200">Quizzes Available</div>
                </div>
              </div>
            </div>
          )}

          {currentSection === 'flashcards' && flashcards.length > 0 && (
            <div className="animate-fade-in-up">
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl font-bold text-white">🃏 Flashcard Arena</h2>
                  <div className="text-green-300 text-lg">
                    {currentFlashcard + 1} / {flashcards.length}
                  </div>
                </div>

                <div className="max-w-2xl mx-auto h-80 md:h-96 relative">
                  <div
                    className={`absolute inset-0 transition-transform duration-700 ${flippedCards.has(currentFlashcard) ? 'rotate-y-180' : ''}`}
                    onClick={() => handleFlashcardFlip(currentFlashcard)}
                  >
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-xl flex items-center justify-center cursor-pointer">
                      {flippedCards.has(currentFlashcard) ? (
                        <div className="text-center flashcard-text-back">
                          <div className="text-4xl mb-4">💡</div>
                          <h3 className="text-2xl font-bold text-white mb-4">Answer</h3>
                          <p className="text-xl text-gray-200">{flashcards[currentFlashcard]?.answer}</p>
                          <p className="text-sm mt-4 text-gray-400">Click to go back</p>
                        </div>
                      ) : (
                        <div className="text-center flashcard-text-front">
                          <div className="text-4xl mb-4">🤔</div>
                          <h3 className="text-2xl font-bold text-white mb-4">Question</h3>
                          <p className="text-xl text-gray-200">{flashcards[currentFlashcard]?.question}</p>
                          <p className="text-sm mt-4 text-gray-400">Click to reveal answer</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                  <div className="flex justify-between items-center mt-6">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFlashcardFlip(currentFlashcard);
                        setCurrentFlashcard(Math.max(0, currentFlashcard - 1));
                      }}
                      disabled={currentFlashcard === 0}
                      className="bg-white/10 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                    >
                      ← Previous
                    </button>

                    {flippedCards.has(currentFlashcard) && !masteredCards.has(currentFlashcard) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMasterCard(currentFlashcard);
                        }}
                        className="bg-green-500 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105"
                      >
                        ✅ Mastered (+10 XP)
                      </button>
                    )}

                    {masteredCards.has(currentFlashcard) && (
                      <div className="bg-green-500/20 border border-green-500/50 rounded-xl px-6 py-3 text-green-400 font-bold animate-fade-in">
                        ✅ Mastered!
                      </div>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFlashcardFlip(currentFlashcard);
                        setCurrentFlashcard(Math.min(flashcards.length - 1, currentFlashcard + 1));
                      }}
                      disabled={currentFlashcard === flashcards.length - 1}
                      className="bg-white/10 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                    >
                      Next →
                    </button>
                  </div>

                  <div className="mt-6">
                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                      <span>Mastered: {masteredCards.size}/{flashcards.length}</span>
                      <span>{((masteredCards.size / flashcards.length) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 relative bg-gradient-to-r from-green-400 to-emerald-500"
                        style={{ width: `${(masteredCards.size / flashcards.length) * 100}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {currentSection === 'videos' && videos.length > 0 && (
            <div className="animate-fade-in-up">
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                <h2 className="text-3xl font-bold text-white mb-6 text-center">🎬 Video Library</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {videos.map((video, index) => {
                    const getEmbedUrl = (url: string) => {
                      const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([\w-]+)/);
                      return ytMatch ? `https://www.youtube.com/embed/${ytMatch[1]}` : null;
                    };
                    const embedUrl = getEmbedUrl(video.url);

                    return (
                      <div key={video.id} className="bg-white/5 p-6 rounded-3xl border border-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-white">{video.title}</h3>
                          <div className="text-2xl">🎥</div>
                        </div>

                        <div className="aspect-video rounded-xl overflow-hidden mb-4 border border-gray-700">
                          {embedUrl ? (
                            <iframe
                              src={embedUrl}
                              title={video.title}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <video src={video.url} controls className="w-full h-full object-cover" />
                          )}
                        </div>

                        <button
                          className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg"
                          onClick={() => handleVideoWatched(video.id)}
                        >
                          Complete Video (+15 XP)
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {currentSection === 'quiz' && currentQuiz && (
            <div className="animate-fade-in-up">
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold text-white mb-2">🧠 Quiz Arena</h2>
                  <p className="text-gray-300">{currentQuiz.title}</p>
                </div>

                {!quizStarted && !showScore ? (
                  <div className="text-center max-w-md mx-auto">
                    <div className="text-6xl mb-6">🎯</div>
                    <h3 className="text-2xl font-bold text-white mb-4">Ready for the Challenge?</h3>
                    <p className="text-gray-300 mb-6">
                      Test your knowledge with {currentQuiz.questions.length} questions.
                      Each correct answer earns you 25 XP!
                    </p>
                    <button onClick={startQuiz} className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                      🚀 Start Quiz
                    </button>
                  </div>
                ) : showScore ? (
                  <div className="text-center max-w-md mx-auto">
                    <div className="text-6xl mb-6 animate-pop-in">🎉</div>
                    <h3 className="text-3xl font-bold text-white mb-4">Quiz Complete!</h3>
                    <div className="space-y-4 mb-6">
                      <div className="text-2xl text-white">
                        <span className="text-green-400 font-bold">{score}</span>
                        <span className="text-gray-400"> / {currentQuiz.questions.length}</span>
                      </div>
                      <div className="text-xl text-emerald-400">
                        Accuracy: {((score / currentQuiz.questions.length) * 100).toFixed(0)}%
                      </div>
                      <div className="text-lg text-yellow-400 animate-pulse">
                        +{score * 25 + (userStats.accuracy >= 80 ? 50 : userStats.accuracy >= 60 ? 25 : 10)} XP Earned!
                      </div>
                    </div>
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          setQuizStarted(false);
                          setShowScore(false);
                          setCurrentQuestionIndex(0);
                          setScore(0);
                        }}
                        className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg"
                      >
                        🔄 Retry Quiz
                      </button>
                      <button
                        onClick={() => setCurrentSection('overview')}
                        className="w-full py-3 bg-white/10 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:bg-white/20"
                      >
                        📚 Back to Overview
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-2xl mx-auto animate-fade-in-up">
                    <div className="flex justify-between items-center mb-6">
                      <div className="text-white">
                        Question {currentQuestionIndex + 1} / {currentQuiz.questions.length}
                      </div>
                      <div className={`px-4 py-2 rounded-xl font-bold transition-colors duration-300 ${
                        timeLeft <= 10 ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 text-gray-300'
                      }`}>
                        ⏰ {timeLeft}s
                      </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 mb-6 border border-white/20 shadow-xl">
                      <h3 className="text-xl font-bold text-white mb-4">{currentQ?.question}</h3>
                      {currentQ?.type === 'MCQ' ? (
                        <div className="space-y-3">
                          {currentQ.options?.map((option) => {
                            const isSelected = selectedOption === option.id;
                            let optionClass = 'quiz-option';

                            if (submitted) {
                              if (option.isCorrect) optionClass += ' correct';
                              else if (isSelected && !option.isCorrect) optionClass += ' incorrect';
                            } else if (isSelected) {
                              optionClass += ' selected';
                            }

                            return (
                              <div
                                key={option.id}
                                className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                                  submitted ? (option.isCorrect ? 'border-green-500/50 bg-green-900/20' : isSelected ? 'border-red-500/50 bg-red-900/20' : 'border-gray-500/20 bg-white/5') : isSelected ? 'border-green-500/50 bg-green-900/20' : 'border-gray-500/20 bg-white/5 hover:bg-white/10'
                                }`}
                                onClick={() => handleOptionSelect(option.id)}
                              >
                                <div className="flex items-center space-x-3">
                                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                    submitted ? (option.isCorrect ? 'border-green-500' : isSelected ? 'border-red-500' : 'border-gray-500') : isSelected ? 'border-green-400' : 'border-gray-500'
                                  }`}>
                                    {submitted && (option.isCorrect || isSelected) ? <div className={`w-3 h-3 rounded-full ${option.isCorrect ? 'bg-green-500' : 'bg-red-500'}`}></div> : isSelected && <div className="w-3 h-3 bg-green-400 rounded-full"></div>}
                                  </div>
                                  <span className="text-white">{option.text}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div>
                            <textarea
                                value={userAnswer}
                                onChange={(e) => setUserAnswer(e.target.value)}
                                readOnly={submitted}
                                placeholder="Type your answer here..."
                                rows={5}
                                className={`w-full p-4 rounded-xl border border-white/20 bg-white/5 text-white placeholder-gray-400 outline-none transition-all duration-300 focus:border-green-400 resize-none ${submitted ? 'cursor-not-allowed' : ''}`}
                            ></textarea>
                            {submitted && (
                                <div className="mt-4 p-3 rounded-lg border border-green-500 bg-green-500/20 text-green-300">
                                    <p className="font-semibold">Answer Submitted</p>
                                    <p className="mt-1 text-sm">Correct Answer: {currentQ?.answer}</p>
                                </div>
                            )}
                        </div>
                      )}
                    </div>

                    <div className="text-center">
                      {!submitted ? (
                        <button
                          onClick={handleSubmitAnswer}
                          disabled={currentQ?.type === 'MCQ' ? !selectedOption : !userAnswer.trim()}
                          className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:hover:scale-100"
                        >
                          Submit Answer
                        </button>
                      ) : (
                        <button
                          onClick={handleNextQuestion}
                          className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                          {currentQuestionIndex + 1 < currentQuiz.questions.length ? 'Next Question →' : 'Finish Quiz 🎉'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {message && (
            <div className="bg-red-900/20 backdrop-blur-xl p-4 rounded-xl border border-red-400/30 shadow-2xl animate-fade-in-up">
              <p className="text-red-400 text-center">{message}</p>
            </div>
          )}
        </div>

        <style jsx>{`
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fade-in-down {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes pop-in {
            0% { transform: scale(0); opacity: 0; }
            60% { transform: scale(1.2); opacity: 1; }
            100% { transform: scale(1); }
          }
          @keyframes confetti-fall {
            0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0.5; }
          }
          .animate-fade-in {
            animation: fade-in 0.5s ease-out forwards;
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.6s ease-out forwards;
          }
          .animate-fade-in-down {
            animation: fade-in-down 0.6s ease-out forwards;
          }
          .animate-shimmer {
            animation: shimmer 2s infinite linear;
          }
          .animate-pop-in {
            animation: pop-in 0.6s ease-out;
          }
          .confetti-rain {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            pointer-events: none;
            z-index: 40;
          }
          .confetti-rain::before {
            content: '';
            position: absolute;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #22c55e, #10b981, #22c55e, #10b981);
            mask-image: url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,0 65,35 100,35 70,60 80,95 50,75 20,95 30,60 0,35 35,35"/></svg>');
            -webkit-mask-image: url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,0 65,35 100,35 70,60 80,95 50,75 20,95 30,60 0,35 35,35"/></svg>');
            animation: confetti-fall 3s linear infinite;
          }
          .transform-style-3d {
            transform-style: preserve-3d;
          }
          .perspective-1000 {
            perspective: 1000px;
          }
          .backface-hidden {
            backface-visibility: hidden;
          }
          .rotate-y-180 {
            transform: rotateY(180deg);
          }
          .hover\\:scale-3xl:hover {
            transform: scale(1.05) translateZ(50px);
          }
          .flashcard-text-front,
          .flashcard-text-back {
            transition: opacity 0.3s ease-in-out;
          }
          .rotate-y-180 .flashcard-text-front {
            opacity: 0;
          }
          .flashcard-text-back {
            opacity: 0;
          }
          .rotate-y-180 .flashcard-text-back {
            opacity: 1;
            transform: rotateY(180deg);
          }
        `}</style>
      </div>
    </RoleGuard>
  );
}

