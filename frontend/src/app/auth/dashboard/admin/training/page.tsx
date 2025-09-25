'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/axiosInstance';
import { RiAddLine, RiDeleteBin6Line, RiPencilLine, RiSunLine, RiMoonLine } from 'react-icons/ri';

interface Module {
  id: string;
  title: string;
  role: 'CITIZEN' | 'WORKER';
}

export default function TrainingModulesPage() {
  const router = useRouter();
  const [modules, setModules] = useState<Module[]>([]);
  const [title, setTitle] = useState('');
  const [role, setRole] = useState<'CITIZEN' | 'WORKER'>('CITIZEN');
  const [message, setMessage] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  // Fetch modules
  const fetchModules = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await api.get('/training/modules', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setModules(res.data || []);
      setMessage('');
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to fetch modules');
    } finally {
      setLoading(false);
    }
  };

  // Create module (Admin only)
  const createModule = async () => {
    if (!title.trim()) return setMessage('Module title is required');
    try {
      const token = localStorage.getItem('access_token');
      await api.post(
        '/training/modules',
        { title: title.trim(), role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTitle('');
      setRole('CITIZEN');
      setMessage('✅ Module created successfully!');
      fetchModules();
    } catch (err: any) {
      setMessage(`❌ ${err.response?.data?.message || 'Failed to create module'}`);
    }
  };

  // Delete module (Admin only)
  const deleteModule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this module?')) return;
    try {
      const token = localStorage.getItem('access_token');
      await api.delete(`/training/modules/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage('✅ Module deleted successfully!');
      fetchModules();
    } catch (err: any) {
      setMessage(`❌ ${err.response?.data?.message || 'Failed to delete module'}`);
    }
  };

  useEffect(() => {
    const role = localStorage.getItem('role');
    setUserRole(role);
    if (role !== 'ADMIN') {
      router.push('/auth/dashboard'); // Redirect non-admins
    } else {
      fetchModules();
    }
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-lg">Loading modules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'} p-6 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold text-blue-600 dark:text-blue-400">
            <span className="flex items-center">
              <RiPencilLine className="mr-3" /> Training Modules
            </span>
          </h1>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors duration-300"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <RiSunLine size={24} /> : <RiMoonLine size={24} />}
          </button>
        </header>

        {message && (
          <div className={`p-4 mb-6 rounded-lg ${message.startsWith('✅') ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'} transition-colors duration-300`}>
            <p className="font-medium">{message}</p>
          </div>
        )}

        {/* Admin-only: Create new module */}
        {userRole === 'ADMIN' && (
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-6 mb-8 transition-colors duration-300">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              <span className="flex items-center"><RiAddLine className="mr-2" />Create New Module</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Module Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 transition-colors duration-300"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'CITIZEN' | 'WORKER')}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 transition-colors duration-300"
              >
                <option value="CITIZEN">Citizen</option>
                <option value="WORKER">Worker</option>
              </select>
              <button
                onClick={createModule}
                className="w-full p-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-300"
              >
                Add Module
              </button>
            </div>
          </div>
        )}

        {/* Module list */}
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-6 transition-colors duration-300">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            <span className="flex items-center">All Modules</span>
          </h2>
          {modules.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No training modules found.</p>
          ) : (
            <ul className="space-y-4">
              {modules.map((m) => (
                <li
                  key={m.id}
                  className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="mb-2 md:mb-0">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">{m.title}</h3>
                    <p className={`text-sm font-medium px-2 py-1 rounded-full inline-block mt-1 ${m.role === 'CITIZEN' ? 'bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-200' : 'bg-purple-200 text-purple-800 dark:bg-purple-700 dark:text-purple-200'}`}>
                      {m.role}
                    </p>
                  </div>
                  {userRole === 'ADMIN' && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() =>
                          router.push(`/auth/dashboard/admin/training/${m.id}`)
                        }
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-300 w-full sm:w-auto"
                      >
                        <span className="flex items-center justify-center">
                          <RiPencilLine className="mr-2" /> Manage
                        </span>
                      </button>
                      <button
                        onClick={() => deleteModule(m.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-300 w-full sm:w-auto"
                      >
                        <span className="flex items-center justify-center">
                          <RiDeleteBin6Line className="mr-2" /> Delete
                        </span>
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
