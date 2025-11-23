'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import api from '@/utils/axiosInstance'; // Assuming api is an Axios instance

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  username?: string;
  avatarUrl?: string;
}

// Helper functions (use with caution if these were not provided, but they are necessary)
const getRoleColor = (role: string) => {
  switch (role) {
    case 'ADMIN': return 'bg-red-500';
    case 'WORKER': return 'bg-yellow-500';
    case 'BUSINESS': return 'bg-green-500';
    case 'CITIZEN':
    default: return 'bg-blue-500';
  }
};
const getRoleDisplay = (role: string) => {
  if (typeof role !== 'string') return ''; 
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
};
const getAvatarBg = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-600';
      case 'WORKER': return 'bg-yellow-600';
      case 'BUSINESS': return 'bg-green-600';
      case 'CITIZEN':
      default: return 'bg-blue-600';
    }
};


export default function ProfileIcon() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await api.get('/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);

      // ✅ FIX for Flickering: Only force logout/redirect on a definitive 401 error.
      // This prevents transient network issues from clearing the user state.
      if ((error as any).response?.status === 401) {
          localStorage.removeItem('access_token');
          router.push('/auth/login');
      } 
      
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    setIsOpen(false);
    router.push('/auth/login');
  };

  // Conditional render check for loading
  if (loading) {
    return (
      <div className="w-10 h-10 rounded-full bg-gray-700 animate-pulse"></div>
    );
  }
  
  // Conditional render check for not logged in
  if (!user) {
    return (
      <div 
        className="relative w-10 h-10 flex items-center justify-center bg-gray-700 rounded-full cursor-pointer hover:bg-gray-600 transition-colors"
        onClick={() => router.push('/auth/login')} // Correct login route
        title="Log in"
      >
        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3v-3" />
        </svg>
      </div>
    );
  }

  // Safe initial calculation (prevents crashes if name is missing)
  const nameInitial = user.name ? user.name.charAt(0).toUpperCase() : 
                      (user.username ? user.username.charAt(0).toUpperCase() : 'U');

  return (
    <div className="relative" ref={dialogRef}>
      {/* Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900 transition-shadow"
        aria-expanded={isOpen}
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt="User Avatar"
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <div className={`w-full h-full rounded-full ${getAvatarBg(user.role)} flex items-center justify-center text-white font-semibold`}>
            {nameInitial}
          </div>
        )}
      </button>

      {/* Profile Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-gray-800 rounded-xl shadow-2xl z-50 transform transition-all duration-200 origin-top-right">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="User Avatar"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className={`w-10 h-10 rounded-full ${getAvatarBg(user.role)} flex items-center justify-center text-white font-semibold`}>
                  {nameInitial}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{user.username || user.name}</p>
                <p className="text-gray-400 text-sm truncate">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div>
              <p className="text-gray-400 text-xs mb-1">Role</p>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${getRoleColor(user.role)} text-white`}>
                  {getRoleDisplay(user.role)}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3v-10a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
