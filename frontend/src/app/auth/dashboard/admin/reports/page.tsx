'use client';

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import axios from '@/utils/axiosInstance';
import RoleGuard from '@/components/RoleGuard';
import NotificationBell from '@/components/NotificationBell';
import api from '@/utils/axiosInstance';
import 'leaflet/dist/leaflet.css';
import { CivicReport } from '@/app/auth/dashboard/citizen/civic-report/page';
import { jwtDecode } from 'jwt-decode';
import Image from 'next/image';

const Map = dynamic(() => import('@/components/CivicMap'), { ssr: false });

interface WasteWorker {
  id: string;
  name: string;
}

export interface WorkerLocation {
  id: string;
  workerId: string;
  workerName: string;
  latitude: number;
  longitude: number;
}

const AdminReportPage = () => {
  const [reports, setReports] = useState<CivicReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'LIST' | 'MAP'>('LIST');
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<CivicReport | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [nearestList, setNearestList] = useState<{ workerId: string; workerName: string; distanceKm: number }[]>([]);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  // removed manual worker selection; assignment is automatic to nearest worker
  const [workerLocations, setWorkerLocations] = useState<WorkerLocation[]>([]);
  const [userPosition, setUserPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const fetchReportsAndWorkers = async () => {
    try {
      const reportsRes = await axios.get('/civic-report/admin-reports');
      setReports(reportsRes.data);

      const workerLocationsRes = await axios.get('/maps/worker-locations');
      setWorkerLocations(workerLocationsRes.data);

      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setMessage(
        error.response?.data?.message || 'Failed to fetch data. Please try again.',
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsAndWorkers();

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

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (err) => {
        console.error('Geolocation error:', err);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const handleAssignClick = async (report: CivicReport) => {
    setSelectedReport(report);
    try {
      const workerLocationsRes = await axios.get('/maps/worker-locations');
      setWorkerLocations(workerLocationsRes.data);
      const list = workerLocationsRes.data.map((w: any) => ({
        workerId: w.workerId,
        workerName: w.workerName || 'Worker',
        distanceKm: Math.round(
          (Math.hypot((w.latitude - report.latitude), (w.longitude - report.longitude)) * 111) * 100
        ) / 100,
      }))
      .sort((a: any, b: any) => a.distanceKm - b.distanceKm)
      .slice(0, 10);
      setNearestList(list);
    } catch (e) {
      setNearestList([]);
    }
    setIsAssignModalOpen(true);
  };

  const assignTask = async () => {
    if (!selectedReport) return;

    setMessage('Assigning to nearest worker...');
    try {
      const { data } = await axios.post(`/civic-report/${selectedReport.id}/assign-nearest`);
      setMessage('Task assigned to nearest worker!');
      setIsAssignModalOpen(false);
      // Optimistically update the report in local state so the button disappears
      setReports((prev) => prev.map((r) => (
        r.id === selectedReport.id ? { ...r, status: 'assigned' as any, assignedToWorker: data?.assignedToWorker || r.assignedToWorker } : r
      )));
      setSelectedReport(null);
    } catch (error: any) {
      setMessage(
        error.response?.data?.message || 'Failed to assign task. Please try again.',
      );
    }
  };

  const handleResolveClick = (report: CivicReport) => {
    setSelectedReport(report);
    setIsResolveModalOpen(true);
  };

  const resolveReport = async () => {
    if (!selectedReport) return;

    setMessage('Resolving report...');
    try {
      // Optimistic: mark as resolved locally so the button disappears and item moves
      setReports(prev => prev.map(r => r.id === selectedReport.id ? { ...r, status: 'resolved' } : r));
      await axios.post(`/civic-report/${selectedReport.id}/admin/confirm`);
      setMessage('Report resolved successfully!');
      setIsResolveModalOpen(false);
      setSelectedReport(null);
      // Refresh for server truth
      await fetchReportsAndWorkers();
    } catch (error: any) {
      setMessage(
        error.response?.data?.message || 'Failed to resolve report. Please try again.',
      );
      // Re-sync state
      await fetchReportsAndWorkers();
    }
  };

  const toggleViewMode = () => {
    setViewMode((prevMode) => (prevMode === 'LIST' ? 'MAP' : 'LIST'));
  };

  const handleCompleted = async (report: CivicReport) => {
    setMessage('Marking as completed...');
    try {
      await axios.post(`/civic-report/${report.id}/admin/confirm`);
      setMessage('Report marked as completed/added successfully!');
      await fetchReportsAndWorkers();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to mark as completed. Please try again.');
    }
  };

  const getStatusColor = (status: CivicReport['status'] | 'assigned' | 'working') => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'escalated':
        return 'bg-red-500';
      case 'resolved':
        return 'bg-green-500';
      case 'assigned':
        return 'bg-blue-500';
      case 'working':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
    }
  };

  const activeReports = reports.filter(r => r.status !== 'resolved');
  const resolvedReports = reports.filter(r => r.status === 'resolved');

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-gray-900 text-white'>
        <p>Loading reports...</p>
      </div>
    );
  }

  return (
    <RoleGuard role='ADMIN'>
      <div className='container mx-auto p-4 md:p-8 bg-gray-900 text-white min-h-screen'>
        <div className='flex items-center justify-between mb-6'>
          <h1 className='text-3xl md:text-4xl font-bold'>Admin Report Dashboard</h1>
          {currentUserId && <NotificationBell userId={currentUserId} />}
        </div>
        {message && (
          <div className='bg-blue-500/20 text-blue-300 p-3 rounded-lg text-center mb-6'>
            {message}
          </div>
        )}

        <div className='flex justify-center mb-6'>
          <button
            onClick={toggleViewMode}
            className='px-6 py-2 rounded-full font-semibold transition-colors
                       bg-blue-600 hover:bg-blue-700 text-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            Switch to {viewMode === 'LIST' ? 'Map' : 'List'} View
          </button>
        </div>

        {viewMode === 'MAP' ? (
          <div className='relative w-full h-[600px] rounded-lg shadow-xl overflow-hidden'>
            <Map
              reports={reports}
              refreshReports={fetchReportsAndWorkers}
              userPosition={userPosition}
              workerLocations={workerLocations}
              onVote={async () => { return; }}
              votingStates={{}}
              loggedInUserId=''
            />
          </div>
        ) : (
          <>
            <h2 className='text-2xl font-bold mt-2 mb-4'>Active</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {activeReports.length > 0 ? (
                activeReports.map((report) => (
                  <div key={report.id} className='bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col'>
                    <div className='flex items-center justify-between mb-2'>
                      <h2 className='text-xl font-semibold text-blue-400'>{report.title}</h2>
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${getStatusColor(report.status)}`}
                      >
                        {report.status.toUpperCase()}
                      </span>
                    </div>
                    <p className='text-gray-400 mb-4 flex-grow'>{report.description}</p>
                    {report.imageUrl && (
                      <div className='relative w-full h-40 mb-4 rounded-lg overflow-hidden'>
                        <Image
                          src={report.imageUrl}
                          alt={report.title}
                          layout='fill'
                          objectFit='cover'
                        />
                      </div>
                    )}
                    {report.resolvedImageUrl && (
                      <div className='mt-2'>
                        <p className='text-xs text-gray-400 mb-1'>Resolution photo:</p>
                        <div className='relative w-full h-40 mb-4 rounded-lg overflow-hidden border border-green-700'>
                          <Image
                            src={report.resolvedImageUrl}
                            alt={report.title + ' resolved'}
                            layout='fill'
                            objectFit='cover'
                          />
                        </div>
                        {report.resolvedNotes && (
                          <p className='text-xs text-green-300 italic'>Notes: {report.resolvedNotes}</p>
                        )}
                      </div>
                    )}
                    <div className='mt-auto flex justify-between items-center text-sm text-gray-500'>
                      <span>Supports: {report.supportCount || 0}</span>
                      {report.assignedToWorker && (
                        <span className='text-blue-300'>Assigned to: {report.assignedToWorker.name}</span>
                      )}
                    </div>
                    <div className='mt-4'>
                      {(report.supportCount >= 5) && ((report.status as any) !== 'assigned' && report.status !== 'resolved') && (
                        report.type === 'public_bin_request' || report.type === 'public_toilet_request' ? (
                          <button
                            onClick={() => { setSelectedReport(report); setIsResolveModalOpen(true); }}
                            className='w-full bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-lg transition-colors'
                          >
                            Working on it
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAssignClick(report)}
                            className='w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors'
                          >
                            Address it
                          </button>
                        )
                      )}
                      {(report.status as any) === 'assigned' && (
                        <button
                          onClick={() => handleResolveClick(report)}
                          className='w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors'
                        >
                          Confirm Resolution
                        </button>
                      )}
                      {(report.status as any) === 'working' && (
                        <button
                          onClick={() => handleCompleted(report)}
                          className='w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors'
                        >
                          Completed/Added
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className='text-center text-gray-400 col-span-full'>No active reports.</p>
              )}
            </div>

            <h2 className='text-2xl font-bold mt-10 mb-4'>Resolved</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {resolvedReports.length > 0 ? (
                resolvedReports.map((report) => (
                  <div key={report.id} className='bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col'>
                    <div className='flex items-center justify-between mb-2'>
                      <h2 className='text-xl font-semibold text-blue-400'>{report.title}</h2>
                      <span className='text-xs font-bold px-3 py-1 rounded-full bg-green-600'>RESOLVED</span>
                    </div>
                    <p className='text-gray-400 mb-4 flex-grow'>{report.description}</p>
                    {report.resolvedImageUrl && (
                      <div className='relative w-full h-40 mb-4 rounded-lg overflow-hidden border border-green-700'>
                        <Image
                          src={report.resolvedImageUrl}
                          alt={report.title + ' resolved'}
                          layout='fill'
                          objectFit='cover'
                        />
                      </div>
                    )}
                    {report.resolvedNotes && (
                      <p className='text-xs text-green-300 italic'>Notes: {report.resolvedNotes}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className='text-center text-gray-400 col-span-full'>No resolved reports yet.</p>
              )}
            </div>
          </>
        )}

        {/* Assign Task Modal */}
        {isAssignModalOpen && selectedReport && (
          <div className='fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-[1000]'>
            <div className='bg-white p-8 rounded-lg shadow-xl w-full max-w-sm'>
              <h2 className='text-2xl font-bold mb-4 text-gray-800'>Assign Task</h2>
              <p className='text-gray-600 mb-6'>
                Assign report <strong>{selectedReport.title}</strong> to the nearest available waste worker.
              </p>
              <div className='mb-4 max-h-48 overflow-auto border rounded-lg'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='bg-gray-100 text-gray-700'>
                      <th className='text-left px-3 py-2'>Worker</th>
                      <th className='text-left px-3 py-2'>Distance (km)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nearestList.map((w) => (
                      <tr key={w.workerId} className='border-t text-black'>
                        <td className='px-3 py-2'>{w.workerName}</td>
                        <td className='px-3 py-2'>{w.distanceKm}</td>
                      </tr>
                    ))}
                    {nearestList.length === 0 && (
                      <tr>
                        <td className='px-3 py-2 text-gray-500' colSpan={2}>No worker locations yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className='flex justify-end gap-4'>
                <button
                  onClick={() => setIsAssignModalOpen(false)}
                  className='px-4 py-2 text-gray-600 bg-gray-200 rounded-lg'
                >
                  Cancel
                </button>
                <button
                  onClick={assignTask}
                  className='px-4 py-2 bg-blue-600 text-white rounded-lg'
                >
                  Assign to nearest
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Resolve/Confirm Modal */}
        {isResolveModalOpen && selectedReport && (
          <div className='fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-[1000]'>
            <div className='bg-white p-8 rounded-lg shadow-xl w-full max-w-sm'>
              <h2 className='text-2xl font-bold mb-4 text-gray-800'>
                {selectedReport.type === 'public_bin_request' || selectedReport.type === 'public_toilet_request' ? 'Infrastructure Action' : 'Resolve Report'}
              </h2>
              {selectedReport.type === 'public_bin_request' || selectedReport.type === 'public_toilet_request' ? (
                <p className='mb-6 text-gray-600'>
                  Mark <strong>{selectedReport.title}</strong> as "Working on it" now, and you can mark it completed when done.
                </p>
              ) : (
                <p className='mb-6 text-gray-600'>
                  Are you sure you want to confirm resolution for: <strong>{selectedReport.title}</strong>?
                </p>
              )}
              <div className='flex justify-end gap-4'>
                <button
                  onClick={() => setIsResolveModalOpen(false)}
                  className='px-4 py-2 text-gray-600 bg-gray-200 rounded-lg'
                >
                  Cancel
                </button>
                {selectedReport.type === 'public_bin_request' || selectedReport.type === 'public_toilet_request' ? (
                  <button
                    onClick={async () => {
                      if (!selectedReport) return;
                      setMessage('Marking as working...');
                      try {
                        await axios.post(`/civic-report/${selectedReport.id}/admin/working`);
                        setMessage('Marked as working');
                        setIsResolveModalOpen(false);
                        setSelectedReport(null);
                        await fetchReportsAndWorkers();
                      } catch (error: any) {
                        setMessage(error.response?.data?.message || 'Failed to update');
                      }
                    }}
                    className='px-4 py-2 bg-amber-600 text-white rounded-lg'
                  >
                    Working on it
                  </button>
                ) : (
                  <button
                    onClick={resolveReport}
                    className='px-4 py-2 bg-green-600 text-white rounded-lg'
                  >
                    Confirm Resolution
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
};

export default AdminReportPage;
