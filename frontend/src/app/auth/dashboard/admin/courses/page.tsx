'use client';

import { useState, useEffect } from 'react';
import api from '@/utils/axiosInstance';
import NotificationBell from '@/components/NotificationBell';
import { Role } from '@prisma/client';

interface Course {
  id: string;
  title: string;
  description: string;
  isMandatory: boolean;
  role: Role;
  createdAt: string;
  modules: Array<{
    id: string;
    title: string;
    courseType: string;
  }>;
  completions: Array<{
    id: string;
    completedAt: string;
    certificateUrl: string;
  }>;
}

interface Module {
  id: string;
  title: string;
  role: Role;
  courseType: string;
  courseId?: string;
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddModulesModal, setShowAddModulesModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>('CITIZEN');
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Form states
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    isMandatory: false,
    role: 'CITIZEN' as Role,
  });
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await api.get('/courses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourses(response.data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await api.get('/training/modules', {
        headers: { Authorization: `Bearer ${token}` },
        params: { role: selectedRole },
      });
      setModules(response.data);
    } catch (error) {
      console.error('Failed to fetch modules:', error);
    }
  };

  const createCourse = async () => {
    try {
      const token = localStorage.getItem('access_token');
      await api.post('/courses', {
        ...newCourse,
        moduleIds: selectedModules,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Course created successfully!');
      setShowCreateModal(false);
      setNewCourse({ title: '', description: '', isMandatory: false, role: 'CITIZEN' });
      setSelectedModules([]);
      fetchCourses();
    } catch (error) {
      console.error('Failed to create course:', error);
      alert('Failed to create course');
    }
  };

  const addModulesToCourse = async () => {
    if (!selectedCourse || selectedModules.length === 0) return;

    try {
      const token = localStorage.getItem('access_token');
      await api.post(`/courses/${selectedCourse.id}/modules`, {
        moduleIds: selectedModules,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Modules added to course successfully!');
      setShowAddModulesModal(false);
      setSelectedModules([]);
      fetchCourses();
    } catch (error) {
      console.error('Failed to add modules to course:', error);
      alert('Failed to add modules to course');
    }
  };

  const deleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;

    try {
      const token = localStorage.getItem('access_token');
      await api.delete(`/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Course deleted successfully!');
      fetchCourses();
    } catch (error) {
      console.error('Failed to delete course:', error);
      alert('Failed to delete course');
    }
  };

  useEffect(() => {
    fetchCourses();
    
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const userRes = await api.get('/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUserId(userRes.data.id);
      } catch (error) {
        console.error('Failed to fetch user info:', error);
      }
    };
    
    fetchUserInfo();
  }, []);

  useEffect(() => {
    fetchModules();
  }, [selectedRole]);

  const getRoleColor = (role: Role) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'WORKER': return 'bg-blue-100 text-blue-800';
      case 'CITIZEN': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading courses...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Course Management</h1>
              <p className="text-gray-300">Create and manage mandatory and miscellaneous courses</p>
            </div>
            <div className="flex items-center space-x-4">
              {currentUserId && <NotificationBell userId={currentUserId} />}
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Create New Course
              </button>
            </div>
          </div>
        </div>

        {/* Current Courses List */}
        <div className="mb-8 bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">Current Courses ({courses.length})</h2>
          {courses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="pb-3 text-gray-300 font-semibold">Title</th>
                    <th className="pb-3 text-gray-300 font-semibold">Role</th>
                    <th className="pb-3 text-gray-300 font-semibold">Type</th>
                    <th className="pb-3 text-gray-300 font-semibold">Modules</th>
                    <th className="pb-3 text-gray-300 font-semibold">Completions</th>
                    <th className="pb-3 text-gray-300 font-semibold">Created</th>
                    <th className="pb-3 text-gray-300 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="py-3 text-white font-medium">{course.title}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs ${getRoleColor(course.role)}`}>
                          {course.role}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          course.isMandatory ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
                        }`}>
                          {course.isMandatory ? 'Mandatory' : 'Miscellaneous'}
                        </span>
                      </td>
                      <td className="py-3 text-blue-400 font-semibold">{course.modules.length}</td>
                      <td className="py-3 text-green-400 font-semibold">{course.completions.length}</td>
                      <td className="py-3 text-gray-400 text-sm">
                        {new Date(course.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedCourse(course);
                              setShowAddModulesModal(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => deleteCourse(course.id)}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No courses created yet</p>
          )}
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold text-lg">{course.title}</h3>
                <div className="flex items-center space-x-2">
                  {course.isMandatory && (
                    <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      MANDATORY
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(course.role)}`}>
                    {course.role}
                  </span>
                </div>
              </div>

              <p className="text-gray-300 text-sm mb-4">{course.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Modules:</span>
                  <span className="text-blue-400 font-bold">{course.modules.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Completions:</span>
                  <span className="text-green-400 font-bold">{course.completions.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Created:</span>
                  <span className="text-gray-400 text-sm">
                    {new Date(course.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedCourse(course);
                    setShowAddModulesModal(true);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  Add Modules
                </button>
                <button
                  onClick={() => deleteCourse(course.id)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Create Course Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">Create New Course</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Course Title</label>
                  <input
                    type="text"
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                    className="w-full bg-white/20 text-white rounded-lg px-4 py-3 border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter course title"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                    className="w-full bg-white/20 text-white rounded-lg px-4 py-3 border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                    placeholder="Enter course description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Role</label>
                    <select
                      value={newCourse.role}
                      onChange={(e) => setNewCourse({ ...newCourse, role: e.target.value as Role })}
                      className="w-full bg-white/20 text-white rounded-lg px-4 py-3 border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="CITIZEN">Citizen</option>
                      <option value="WORKER">Worker</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="isMandatory"
                      checked={newCourse.isMandatory}
                      onChange={(e) => setNewCourse({ ...newCourse, isMandatory: e.target.checked })}
                      className="w-5 h-5 text-purple-600 bg-white/20 border-white/30 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="isMandatory" className="text-gray-300 text-sm font-medium">
                      Mandatory Course
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Select Modules ({selectedModules.length} selected)
                  </label>
                  <div className="mb-2 flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setSelectedModules(modules.filter(m => m.role === newCourse.role).map(m => m.id))}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedModules([])}
                      className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="max-h-40 overflow-y-auto bg-white/10 rounded-lg p-4 space-y-2">
                    {modules
                      .filter(module => module.role === newCourse.role)
                      .map((module) => (
                        <label key={module.id} className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedModules.includes(module.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedModules([...selectedModules, module.id]);
                              } else {
                                setSelectedModules(selectedModules.filter(id => id !== module.id));
                              }
                            }}
                            className="w-4 h-4 text-purple-600 bg-white/20 border-white/30 rounded focus:ring-purple-500"
                          />
                          <span className="text-white text-sm">{module.title}</span>
                        </label>
                      ))}
                  </div>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={createCourse}
                    disabled={!newCourse.title.trim()}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Create Course
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewCourse({ title: '', description: '', isMandatory: false, role: 'CITIZEN' });
                      setSelectedModules([]);
                    }}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Modules Modal */}
        {showAddModulesModal && selectedCourse && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">Add Modules to Course</h2>
              <p className="text-gray-300 mb-4">Course: {selectedCourse.title}</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Select Modules</label>
                  <div className="max-h-60 overflow-y-auto bg-white/10 rounded-lg p-4 space-y-2">
                    {modules
                      .filter(module => 
                        module.role === selectedCourse.role && 
                        (module.courseType === 'MISCELLANEOUS' || !module.courseId)
                      )
                      .map((module) => (
                        <label key={module.id} className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedModules.includes(module.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedModules([...selectedModules, module.id]);
                              } else {
                                setSelectedModules(selectedModules.filter(id => id !== module.id));
                              }
                            }}
                            className="w-4 h-4 text-purple-600 bg-white/20 border-white/30 rounded focus:ring-purple-500"
                          />
                          <span className="text-white text-sm">{module.title}</span>
                        </label>
                      ))}
                  </div>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={addModulesToCourse}
                    disabled={selectedModules.length === 0}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Add Modules
                  </button>
                  <button
                    onClick={() => {
                      setShowAddModulesModal(false);
                      setSelectedModules([]);
                    }}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}





