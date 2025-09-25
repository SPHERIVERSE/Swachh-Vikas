"use client";

import React, { useEffect, useState } from 'react';
import RoleGuard from '@/components/RoleGuard';
import axios from '@/utils/axiosInstance';
import dynamic from 'next/dynamic';
const Map = dynamic(() => import('@/components/CivicMap'), { ssr: false });

interface AssignedReport {
  id: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  resolvedImageUrl?: string | null;
  status: 'pending' | 'escalated' | 'assigned' | 'resolved';
  latitude?: number;
  longitude?: number;
}

export default function WorkerTasksPage() {
  const [reports, setReports] = useState<AssignedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);

  const fetchAssigned = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/civic-report/assigned/me');
      setReports(res.data);
    } catch (e: any) {
      setMessage(e.response?.data?.message || 'Failed to load assigned reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssigned();

    // Continuously update worker location while logged in
    let watchId: number | null = null;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          try {
            await axios.post('/maps/worker-location', {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
            setUserPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          } catch (e) {
            // ignore periodic failures
          }
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const onUpload = async (reportId: string, file: File, notes?: string) => {
    setUploadingId(reportId);
    try {
      const form = new FormData();
      form.append('photo', file);
      if (notes) form.append('notes', notes);
      await axios.post(`/civic-report/${reportId}/worker/upload`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage('Uploaded resolution photo');
      await fetchAssigned();
    } catch (e: any) {
      setMessage(e.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingId(null);
    }
  };

  const markResolved = async (reportId: string) => {
    try {
      // Optimistic: move report out of Assigned section immediately
      setReports((prev) => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
      await axios.post(`/civic-report/${reportId}/worker/mark-resolved`);
      setMessage('Marked as resolved for admin review');
      // Refresh to ensure server truth (might still be assigned until admin confirms)
      await fetchAssigned();
    } catch (e: any) {
      setMessage(e.response?.data?.message || 'Failed to mark resolved');
      // Revert optimistic change on failure
      await fetchAssigned();
    }
  };

  const assigned = reports.filter(r => r.status !== 'resolved');
  const completed = reports.filter(r => r.status === 'resolved' || !!r.resolvedImageUrl);

  return (
    <RoleGuard role="WORKER">
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">My Assigned Reports</h1>
        {message && (
          <div className="mb-4 p-2 bg-blue-100 text-blue-800 rounded">{message}</div>
        )}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <h2 className="text-lg font-semibold mb-2">Assigned</h2>
            {assigned.length === 0 ? (
              <p className="mb-6">No assigned reports.</p>
            ) : (
              <ul className="space-y-4 mb-8">
                {assigned.map((r) => (
                  <li key={r.id} className="border p-4 rounded">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="font-semibold">{r.title}</h2>
                        <p className="text-sm text-gray-600">{r.description}</p>
                        <p className="text-xs mt-1">Status: {r.status}</p>
                      </div>
                      <div>
                        <div className="space-y-2">
                          <textarea
                            placeholder="Notes (optional)"
                            className="w-56 border rounded p-2 text-sm"
                            id={`notes-${r.id}`}
                            disabled={uploadingId === r.id}
                          />
                          <label className="inline-flex items-center gap-2 cursor-pointer">
                            <span className="text-sm">Upload after cleanup</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                const notes = (document.getElementById(`notes-${r.id}`) as HTMLTextAreaElement)?.value;
                                if (f) onUpload(r.id, f, notes);
                              }}
                              disabled={uploadingId === r.id}
                            />
                            <span className="px-3 py-1 bg-indigo-600 text-white rounded text-sm">
                              {uploadingId === r.id ? 'Uploading...' : 'Choose Photo'}
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                    {r.resolvedImageUrl && (
                      <p className="text-xs mt-2">Resolution photo uploaded ✓</p>
                    )}
                    <div className="mt-3">
                      <button
                        onClick={() => markResolved(r.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                      >
                        Mark Resolved
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <h2 className="text-lg font-semibold mb-2">Completed (awaiting admin confirmation)</h2>
            {completed.length === 0 ? (
              <p>No completed items yet.</p>
            ) : (
              <ul className="space-y-4">
                {completed.map((r) => (
                  <li key={r.id} className="border p-4 rounded bg-green-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="font-semibold">{r.title}</h2>
                        <p className="text-sm text-gray-600">{r.description}</p>
                        <p className="text-xs mt-1">Status: {r.status}</p>
                      </div>
                    </div>
                    {r.resolvedImageUrl && (
                      <p className="text-xs mt-2">Resolution photo uploaded ✓</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Assigned Locations</h2>
          <div className="w-full h-72 rounded overflow-hidden border">
            <Map
              reports={reports as any}
              refreshReports={fetchAssigned}
              userPosition={userPosition}
              votingStates={{}}
              loggedInUserId=''
              onVote={async () => { return; }}
            />
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
