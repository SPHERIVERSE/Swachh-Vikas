'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/axiosInstance';

interface RoleGuardProps {
  role?: 'ADMIN' | 'WORKER' | 'CITIZEN';
  roles?: Array<'ADMIN' | 'WORKER' | 'CITIZEN'>;
  children: React.ReactNode;
}

export default function RoleGuard({ role, roles, children }: RoleGuardProps) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      try {
        const res = await api.post(
          '/auth/check',
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const user = res.data.user;

        const allowedRoles = roles && roles.length > 0 ? roles : (role ? [role] : []);
        if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
          router.push(`/auth/dashboard/${user.role.toLowerCase()}`);
          return;
        }

        setAuthorized(true);
      } catch (err) {
        localStorage.removeItem('access_token');
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [role, roles, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
        <p className="text-xl animate-pulse">Loading...</p>
      </div>
    );
  }
  
  if (!authorized) return null;

  return <>{children}</>;
}
