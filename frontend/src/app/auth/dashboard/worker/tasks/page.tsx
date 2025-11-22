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
      setMessage('Uploaded resolution photo successfully');
      await fetchAssigned();
    } catch (e: any) {
      setMessage(e.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingId(null);
    }
  };

  const markResolved = async (reportId: string) => {
    try {
      setReports((prev) => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
      await axios.post(`/civic-report/${reportId}/worker/mark-resolved`);
      setMessage('Marked as resolved for admin review');
      await fetchAssigned();
    } catch (e: any) {
      setMessage(e.response?.data?.message || 'Failed to mark resolved');
      await fetchAssigned();
    }
  };

  const assigned = reports.filter(r => r.status !== 'resolved');
  const completed = reports.filter(r => r.status === 'resolved' || !!r.resolvedImageUrl);

  if (loading) {
    return (
      <RoleGuard role="WORKER">
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-green-900 to-emerald-900">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 text-center border border-white/20 shadow-2xl">
            <div className="relative">
              <div className="animate-spin w-20 h-20 border-4 border-green-400 border-t-transparent rounded-full mx-auto mb-6"></div>
              <div className="absolute inset-0 animate-ping w-20 h-20 border-4 border-green-400/30 rounded-full mx-auto"></div>
            </div>
            <p className="text-white text-xl font-semibold">Loading Tasks...</p>
            <p className="text-green-200 text-sm mt-2">Fetching your assigned reports</p>
          </div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard role="WORKER">
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-emerald-900 relative overflow-hidden">
        <div className="absolute top-20 left-20 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="relative z-10 p-6 space-y-6">
          <div className="animate-fade-in-down">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">My Assigned Tasks</span>
                  </h1>
                  <p className="text-green-200 text-lg mt-2">Manage your civic responsibility reports</p>
                </div>
                <div className="bg-green-500/20 border border-green-400/30 rounded-2xl px-6 py-3">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-300">{assigned.length}</div>
                    <div className="text-xs text-green-200 mt-1">Active Tasks</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {message && (
            <div className={`animate-fade-in-up ${message.includes('success') || message.includes('Marked') ? 'bg-green-900/20 border-green-400/30' : 'bg-blue-900/20 border-blue-400/30'} backdrop-blur-xl rounded-2xl p-4 border shadow-xl`}>
              <p className={`${message.includes('success') || message.includes('Marked') ? 'text-green-300' : 'text-blue-300'} text-center font-semibold`}>{message}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4 animate-fade-in-up">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">📋</span>
                </div>
                Assigned Tasks ({assigned.length})
              </h2>
              {assigned.length === 0 ? (
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
                  <div className="text-6xl mb-4">✨</div>
                  <p className="text-gray-300 text-lg">No assigned tasks at the moment</p>
                  <p className="text-gray-400 text-sm mt-2">Check back later for new assignments</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assigned.map((r) => (
                    <div key={r.id} className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-102">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-2">{r.title}</h3>
                          <p className="text-gray-300 text-sm mb-3">{r.description}</p>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              r.status === 'assigned' ? 'bg-orange-500/20 text-orange-300 border border-orange-400/30' : 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                            }`}>
                              {r.status === 'assigned' ? '🔥 Active' : '📌 ' + r.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 mb-4">
                        <textarea
                          placeholder="Add notes about the resolution (optional)..."
                          className="w-full border border-white/20 bg-white/5 rounded-xl p-3 text-sm text-white placeholder-gray-400 outline-none transition-all duration-300 focus:border-green-400 resize-none"
                          id={`notes-${r.id}`}
                          disabled={uploadingId === r.id}
                          rows={3}
                        />
                        <label className="flex items-center justify-center gap-3 cursor-pointer group">
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
                          <div className={`w-full py-3 rounded-xl font-bold text-center transition-all duration-300 transform group-hover:scale-105 ${
                            uploadingId === r.id ? 'bg-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 shadow-lg'
                          } text-white`}>
                            {uploadingId === r.id ? '⏳ Uploading...' : '📸 Upload Resolution Photo'}
                          </div>
                        </label>
                      </div>

                      {r.resolvedImageUrl && (
                        <div className="mb-3 p-3 rounded-xl bg-green-500/20 border border-green-400/30">
                          <p className="text-green-300 text-sm font-semibold flex items-center gap-2">
                            <span>✅</span> Resolution photo uploaded
                          </p>
                        </div>
                      )}

                      <button
                        onClick={() => markResolved(r.id)}
                        className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg"
                      >
                        ✓ Mark as Resolved
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">✓</span>
                </div>
                Completed Tasks ({completed.length})
              </h2>
              {completed.length === 0 ? (
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 text-center">
                  <div className="text-6xl mb-4">🎯</div>
                  <p className="text-gray-300 text-lg">No completed tasks yet</p>
                  <p className="text-gray-400 text-sm mt-2">Complete assigned tasks to see them here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {completed.map((r) => (
                    <div key={r.id} className="bg-green-900/20 backdrop-blur-xl rounded-2xl p-6 border border-green-500/30 shadow-xl">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-2">{r.title}</h3>
                          <p className="text-gray-300 text-sm mb-3">{r.description}</p>
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-400/30">
                              ✅ Awaiting Admin Confirmation
                            </span>
                          </div>
                        </div>
                      </div>
                      {r.resolvedImageUrl && (
                        <div className="mt-4 p-3 rounded-xl bg-green-500/20 border border-green-400/30">
                          <p className="text-green-300 text-sm font-semibold flex items-center gap-2">
                            <span>📷</span> Resolution photo submitted
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">🗺️</span>
                </div>
                Task Locations Map
              </h2>
              <div className="w-full h-96 rounded-2xl overflow-hidden border border-white/20 shadow-inner">
                <Map
                  reports={reports as any}
                  refreshReports={fetchAssigned}
                  userPosition={userPosition}
                  votingStates={{}}
                  loggedInUserId=''
                  onVote={async () => { return; }}
                />
              </div>
              {userPosition && (
                <div className="mt-4 p-4 bg-green-500/20 border border-green-400/30 rounded-xl">
                  <p className="text-green-300 text-sm font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Your live location is being tracked on the map
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes fade-in-down {
            from {
              opacity: 0;
              transform: translateY(-30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.6s ease-out forwards;
          }
          .animate-fade-in-down {
            animation: fade-in-down 0.6s ease-out forwards;
          }
          .hover\\:scale-102:hover {
            transform: scale(1.02);
          }
        `}</style>
      </div>
    </RoleGuard>
  );
}

