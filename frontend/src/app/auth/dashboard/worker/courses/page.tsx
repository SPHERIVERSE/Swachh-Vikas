'use client';

import { useState, useEffect } from 'react';
import api from '@/utils/axiosInstance';
import { Role } from '@prisma/client';

interface Course {
  id: string;
  title: string;
  description: string;
  isMandatory: boolean;
  role: Role;
  modules: Array<{
    id: string;
    title: string;
    userProgress: Array<{
      completed: boolean;
      xpEarned: number;
    }>;
  }>;
  isCompleted: boolean;
  completionDate?: string;
  certificateUrl?: string;
}

export default function WorkerCoursesPage() {
  const [mandatoryCourses, setMandatoryCourses] = useState<Course[]>([]);
  const [miscellaneousCourses, setMiscellaneousCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'mandatory' | 'miscellaneous' | 'certificates'>('mandatory');

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const [mandatoryRes, miscellaneousRes] = await Promise.all([
        api.get('/courses/mandatory', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get('/courses/miscellaneous', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setMandatoryCourses(mandatoryRes.data);
      setMiscellaneousCourses(miscellaneousRes.data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeCourse = async (courseId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      await api.post(`/courses/${courseId}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Course completed successfully! Certificate generated.');
      fetchCourses();
    } catch (error) {
      console.error('Failed to complete course:', error);
      alert('Failed to complete course. Make sure all modules are completed.');
    }
  };

  const downloadCertificate = (certificateUrl: string, courseTitle: string) => {
    const link = document.createElement('a');
    link.href = certificateUrl;
    link.download = `${courseTitle}_Certificate.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const getCompletionProgress = (course: Course) => {
    const totalModules = course.modules.length;
    const completedModules = course.modules.filter(module => 
      module.userProgress.some(progress => progress.completed)
    ).length;
    return { completed: completedModules, total: totalModules };
  };

  const canCompleteCourse = (course: Course) => {
    const progress = getCompletionProgress(course);
    return progress.completed === progress.total && !course.isCompleted;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-emerald-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading courses...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-emerald-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">My Courses</h1>
          <p className="text-green-200">Complete courses to earn certificates and XP</p>
        </div>

        {/* Tabs */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 mb-6">
          <div className="flex border-b border-white/20">
            {[
              { id: 'mandatory', label: 'Mandatory Courses', count: mandatoryCourses.length },
              { id: 'miscellaneous', label: 'Miscellaneous Courses', count: miscellaneousCourses.length },
              { id: 'certificates', label: 'My Certificates', count: [...mandatoryCourses, ...miscellaneousCourses].filter(c => c.isCompleted).length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-4 font-medium transition-colors flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'text-emerald-400 border-b-2 border-emerald-400'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span className="bg-white/20 text-white px-2 py-1 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'mandatory' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Mandatory Courses</h2>
                  <p className="text-gray-300">These courses are required for your role and must be completed.</p>
                </div>

                {mandatoryCourses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mandatoryCourses.map((course) => {
                      const progress = getCompletionProgress(course);
                      const progressPercentage = (progress.completed / progress.total) * 100;
                      const canComplete = canCompleteCourse(course);

                      return (
                        <div
                          key={course.id}
                          className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-semibold text-lg">{course.title}</h3>
                            <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                              MANDATORY
                            </span>
                          </div>

                          <p className="text-gray-300 text-sm mb-4">{course.description}</p>

                          <div className="space-y-3 mb-4">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300 text-sm">Progress:</span>
                              <span className="text-white font-semibold">
                                {progress.completed}/{progress.total} modules
                              </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progressPercentage}%` }}
                              ></div>
                            </div>
                            <div className="text-gray-400 text-xs text-center">
                              {progressPercentage.toFixed(1)}% complete
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            {course.isCompleted ? (
                              <div className="flex-1 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg text-center">
                                ✅ Completed
                              </div>
                            ) : canComplete ? (
                              <button
                                onClick={() => completeCourse(course.id)}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                              >
                                Complete Course
                              </button>
                            ) : (
                              <div className="flex-1 bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg text-center">
                                In Progress
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    No mandatory courses assigned yet
                  </div>
                )}
              </div>
            )}

            {activeTab === 'miscellaneous' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Miscellaneous Courses</h2>
                  <p className="text-gray-300">Optional courses for extra XP and learning opportunities.</p>
                </div>

                {miscellaneousCourses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {miscellaneousCourses.map((course) => {
                      const progress = getCompletionProgress(course);
                      const progressPercentage = (progress.completed / progress.total) * 100;
                      const canComplete = canCompleteCourse(course);

                      return (
                        <div
                          key={course.id}
                          className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 hover:bg:white/15 transition-all duration-300"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-semibold text-lg">{course.title}</h3>
                            <span className="bg-blue-500 text:white px-2 py-1 rounded-full text-xs font-bold">
                              OPTIONAL
                            </span>
                          </div>

                          <p className="text-gray-300 text-sm mb-4">{course.description}</p>

                          <div className="space-y-3 mb-4">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300 text-sm">Progress:</span>
                              <span className="text-white font-semibold">
                                {progress.completed}/{progress.total} modules
                              </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progressPercentage}%` }}
                              ></div>
                            </div>
                            <div className="text-gray-400 text-xs text-center">
                              {progressPercentage.toFixed(1)}% complete
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            {course.isCompleted ? (
                              <div className="flex-1 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg text-center">
                                ✅ Completed
                              </div>
                            ) : canComplete ? (
                              <button
                                onClick={() => completeCourse(course.id)}
                                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                              >
                                Complete Course
                              </button>
                            ) : (
                              <div className="flex-1 bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg text-center">
                                In Progress
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    No miscellaneous courses available yet
                  </div>
                )}
              </div>
            )}

            {activeTab === 'certificates' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">My Certificates</h2>
                  <p className="text-gray-300">Download your earned certificates</p>
                </div>

                {[...mandatoryCourses, ...miscellaneousCourses].filter(c => c.isCompleted).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...mandatoryCourses, ...miscellaneousCourses]
                      .filter(course => course.isCompleted)
                      .map((course) => (
                        <div
                          key={course.id}
                          className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300"
                        >
                          <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                              </svg>
                            </div>
                            <h3 className="text-white font-semibold text-lg mb-2">{course.title}</h3>
                            <p className="text-gray-400 text-sm mb-4">
                              Completed: {course.completionDate ? new Date(course.completionDate).toLocaleDateString() : 'Recently'}
                            </p>
                            {course.certificateUrl && (
                              <button
                                onClick={() => downloadCertificate(course.certificateUrl!, course.title)}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                              >
                                Download Certificate
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <p className="text-xl">No certificates earned yet</p>
                    <p className="text-sm mt-2">Complete courses to earn your first certificate!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



