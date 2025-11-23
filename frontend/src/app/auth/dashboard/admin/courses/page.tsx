'use client';

import { useState, useEffect } from 'react';
import api from '@/utils/axiosInstance';
import { useRouter } from 'next/navigation';
import { IoAddCircleOutline, IoCreateOutline, IoTrashOutline, IoSchoolOutline, IoBookOutline } from 'react-icons/io5';
import { format } from 'date-fns';

enum Role {
  ADMIN = 'ADMIN',
  WORKER = 'WORKER',
  CITIZEN = 'CITIZEN',
  BUSINESS = 'BUSINESS',
}

// --- INTERFACES ---
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
  courseId?: string; // Null if not attached to any course
}

// --- MAIN COMPONENT ---
export default function AdminCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  // Renamed for clarity: this holds ALL modules fetched from the backend
  const [availableModules, setAvailableModules] = useState<Module[]>([]); 
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddModulesModal, setShowAddModulesModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  // Array of module IDs selected to be added/removed from the course
  const [selectedModules, setSelectedModules] = useState<string[]>([]); 
  
  // Form states
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    isMandatory: false,
    role: 'CITIZEN' as Role,
  });
  
  // --- UTILITY ---
  const getToken = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        console.error('Authentication token not found. Redirecting to login.');
        router.push('/login'); 
        return null;
    }
    return token;
  }

  // --- DATA FETCHING ---

  const fetchCourses = async () => {
    setLoading(true);
    const token = getToken();
    if (!token) {
        setLoading(false);
        return;
    }

    try {
      // API call to fetch ALL courses (Admin access)
      const response = await api.get('/courses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
      // In a real app, display a toast/alert
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Function to fetch all available modules
  const fetchModules = async () => {
    const token = getToken();
    if (!token) return;

    try {
      // Assuming /training/modules endpoint is used to get all modules for Admin
      const response = await api.get('/training/modules', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAvailableModules(response.data);
    } catch (error) {
      console.error('Error fetching modules:', error);
    }
  };
  
  useEffect(() => {
    fetchCourses();
    fetchModules(); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- CRUD HANDLERS ---

  const handleCreateCourse = async () => {
    if (!newCourse.title || !newCourse.description) {
        alert('Title and description are required.');
        return;
    }
    
    const token = getToken();
    if (!token) return;

    try {
        await api.post('/courses', newCourse, {
            headers: { Authorization: `Bearer ${token}` },
        });
        
        setShowCreateModal(false);
        setNewCourse({ title: '', description: '', isMandatory: false, role: 'CITIZEN' as Role });
        await fetchCourses(); 
        alert('Course created successfully.');
    } catch (error) {
        console.error('Error creating course:', error);
        alert('Failed to create course. Check console for details.');
    }
  };
  
  const handleEditCourse = (course: Course) => {
      // Placeholder: In a real app, this would redirect to an edit page or open a different modal
      alert(`Editing course: ${course.title} (ID: ${course.id}). Implementation TBD.`);
  };
  
  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This action will unlink all modules and delete all completions.')) {
        return;
    }
    
    const token = getToken();
    if (!token) return;

    try {
        await api.delete(`/courses/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        
        await fetchCourses();
        alert('Course deleted successfully.');
    } catch (error) {
        console.error('Error deleting course:', error);
        alert('Failed to delete course.');
    }
  };
  
  // ✅ COMPLETED: Handler for adding modules to the selected course
  const addModulesToCourse = async () => {
    if (!selectedCourse || selectedModules.length === 0) return;
    
    const token = getToken();
    if (!token) return;

    try {
        await api.post(`/courses/${selectedCourse.id}/modules`, {
            moduleIds: selectedModules
        }, {
            headers: { Authorization: `Bearer ${token}` },
        });
        
        // Close modal and refresh data
        setShowAddModulesModal(false);
        setSelectedModules([]);
        setSelectedCourse(null);
        // Refresh both to update the module count and the list of available modules
        await Promise.all([fetchCourses(), fetchModules()]); 
        alert(`Successfully added ${selectedModules.length} module(s) to ${selectedCourse.title}.`);
    } catch (error) {
        console.error('Error adding modules:', error);
        alert('Failed to add modules to course.');
    }
  };
  
  // ✅ COMPLETED: Handler to open the module management modal
  const handleOpenModuleModal = (course: Course) => {
    setSelectedCourse(course);
    // Filter the full list of available modules to only show those not currently attached
    const courseModuleIds = new Set(course.modules.map(m => m.id));
    const modulesNotYetInCourse = availableModules.filter(m => !courseModuleIds.has(m.id));
    
    // NOTE: The `availableModules` state now holds all modules. The filtering is done here.
    setAvailableModules(modulesNotYetInCourse); 
    setSelectedModules([]); 
    setShowAddModulesModal(true);
  };
  
  // --- RENDER FUNCTIONS ---

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
        <div className="w-8 h-8 border-4 border-t-4 border-t-blue-500 border-gray-700 rounded-full animate-spin"></div>
        <p className="ml-4">Loading course management data...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-900 min-h-screen text-white">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center">
            <IoBookOutline className="w-8 h-8 mr-3 text-blue-400" />
            Course Management
        </h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-lg"
        >
          <IoAddCircleOutline className="w-5 h-5 mr-2" />
          Create New Course
        </button>
      </header>

      {/* Course Table */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl overflow-x-auto">
        {courses.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <IoSchoolOutline className="w-10 h-10 mx-auto mb-3" />
            <p>No courses have been created yet. Click "Create New Course" to begin.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Target Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Modules</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-750 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{course.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${course.role === Role.ADMIN ? 'bg-red-800 text-red-100' : 'bg-green-800 text-green-100'}`}>
                        {course.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {course.isMandatory ? (
                        <span className="text-yellow-400 font-medium">Mandatory</span>
                    ) : (
                        <span className="text-blue-400">Miscellaneous</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {course.modules.length} modules
                    <button 
                        onClick={() => handleOpenModuleModal(course)}
                        className="ml-3 text-xs text-purple-400 hover:text-purple-300"
                    >
                        (Edit)
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{format(new Date(course.createdAt), 'dd MMM yyyy')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditCourse(course)}
                      className="text-indigo-400 hover:text-indigo-300 mr-4 transition-colors"
                      title="Edit Course"
                    >
                      <IoCreateOutline className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="Delete Course"
                    >
                      <IoTrashOutline className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* --- MODALS --- */}
      
      {/* Create Course Modal */}
      {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center">
            <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-lg">
                <h2 className="text-2xl font-bold text-white mb-6">Create New Course</h2>
                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Course Title"
                        value={newCourse.title}
                        onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 p-3 rounded text-white focus:ring-blue-500 focus:border-blue-500"
                    />
                    <textarea
                        placeholder="Description"
                        value={newCourse.description}
                        onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                        rows={3}
                        className="w-full bg-gray-700 border border-gray-600 p-3 rounded text-white focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="flex items-center space-x-4">
                        <label htmlFor="role-select" className="text-gray-300">Target Role:</label>
                        <select
                            id="role-select"
                            value={newCourse.role}
                            onChange={(e) => setNewCourse({ ...newCourse, role: e.target.value as Role })}
                            className="bg-gray-700 border border-gray-600 p-2 rounded text-white"
                        >
                            <option value={Role.CITIZEN}>CITIZEN</option>
                            <option value={Role.WORKER}>WORKER</option>
                            <option value={Role.ADMIN}>ADMIN</option>
                        </select>
                    </div>
                    <label className="flex items-center text-gray-300">
                        <input
                            type="checkbox"
                            checked={newCourse.isMandatory}
                            onChange={(e) => setNewCourse({ ...newCourse, isMandatory: e.target.checked })}
                            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2">Mandatory Course</span>
                    </label>
                </div>
                <div className="flex space-x-4 pt-6">
                    <button
                        onClick={handleCreateCourse}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                        Create Course
                    </button>
                    <button
                        onClick={() => setShowCreateModal(false)}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
      )}
      
      {/* Add Modules Modal */}
      {showAddModulesModal && selectedCourse && (
          <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center">
              <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-lg">
                  <h2 className="text-2xl font-bold text-white mb-6">Manage Modules for: {selectedCourse.title}</h2>
                  
                  <div className="bg-gray-700 p-4 rounded-lg max-h-60 overflow-y-auto mb-4">
                    <p className="text-sm font-semibold text-gray-300 mb-2">Available Modules to Add:</p>
                    {availableModules.length === 0 ? (
                        <p className="text-gray-400 italic text-sm">No free modules available to add to this course.</p>
                    ) : (
                        <div className="space-y-2">
                            {availableModules.map((module) => (
                                <label 
                                    key={module.id} 
                                    className="flex items-center space-x-2 p-2 rounded hover:bg-gray-600 transition-colors cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedModules.includes(module.id)}
                                        onChange={() => {
                                            setSelectedModules(prev => 
                                                prev.includes(module.id)
                                                    ? prev.filter(id => id !== module.id)
                                                    : [...prev, module.id]
                                            );
                                        }}
                                        className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500"
                                    />
                                    <span className="text-white text-sm">{module.title}</span>
                                    <span className="text-xs text-gray-400 ml-auto">({module.role} Module)</span>
                                </label>
                            ))}
                        </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-4 pt-6">
                    <button
                      onClick={addModulesToCourse}
                      disabled={selectedModules.length === 0}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                      Add {selectedModules.length} Module(s)
                    </button>
                    <button
                      onClick={() => {
                        setShowAddModulesModal(false);
                        setSelectedCourse(null);
                        setSelectedModules([]);
                        // Re-fetch modules to restore the 'availableModules' state to ALL modules
                        fetchModules(); 
                      }}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                      Close
                    </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
