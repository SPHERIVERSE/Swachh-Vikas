'use client';

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import axios from '@/utils/axiosInstance';
import RoleGuard from '@/components/RoleGuard';
import NotificationBell from '@/components/NotificationBell';
import api from '@/utils/axiosInstance';
import 'leaflet/dist/leaflet.css';
import ReportCard from '@/components/ReportCard';
import { jwtDecode } from 'jwt-decode';
import Image from 'next/image';

const Map = dynamic(() => import('@/components/CivicMap'), { ssr: false });

export interface CivicReport {
  id: string;
  title: string;
  description: string;
  type: string;
  imageUrl?: string;
  latitude: number;
  longitude: number;
  supportCount: number;
  oppositionCount: number;
  status: 'pending' | 'escalated' | 'resolved';
  // include assigned to match admin/worker flows
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  status: 'pending' | 'escalated' | 'assigned' | 'resolved';
  createdAt: string;
  createdById: string;
  createdBy?: { id: string; name: string; role: string };
  assignedToWorker?: { id: string; name: string } | null;
  resolvedImageUrl?: string | null;
  resolvedNotes?: string | null;
  isOwnReport: boolean;
  userVote: 'support' | 'oppose' | null;
  hasVoted: boolean;
  canVote: boolean;
}

const CivicReportPage = () => {
  const [myReports, setMyReports] = useState<CivicReport[]>([]);
  const [otherReports, setOtherReports] = useState<CivicReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'MINE' | 'OTHERS'>('MINE');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED'>('ALL');
  const [viewMode, setViewMode] = useState<'LIST' | 'MAP'>('LIST');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [votingStates, setVotingStates] = useState<Record<string, boolean>>({});
  const [locationMessage, setLocationMessage] = useState<string>('Getting your location...');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const decodedToken: { sub: string } = jwtDecode(token);
        setCurrentUserId(decodedToken.sub);
      } catch (error) {
        console.error('Failed to decode JWT:', error);
        setCurrentUserId(null);
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationMessage('✅ Location acquired.');
        },
        (err) => {
          console.error('Geolocation error:', err);
          setLocationMessage('❌ Location access denied or unavailable. Using default location.');
          setPosition({ lat: 28.6139, lng: 77.2090 });
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setLocationMessage('❌ Geolocation is not supported by your browser.');
      setPosition({ lat: 28.6139, lng: 77.2090 });
    }

    fetchReports();
  }, []);

  const fetchMyReports = async () => {
    try {
      const { data } = await axios.get('/civic-report/my-reports');
      setMyReports(data);
    } catch (err) {
      console.error('Failed to fetch my reports:', err);
      setMessage('Failed to fetch your reports');
    }
  };

  const fetchOtherReports = async () => {
    try {
      const { data } = await axios.get('/civic-report/other-reports');
      setOtherReports(data);
    } catch (err) {
      console.error('Failed to fetch other reports:', err);
      setMessage('Failed to fetch other reports');
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchMyReports(), fetchOtherReports()]);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (reportId: string, type: 'support' | 'oppose') => {
    const updatedReports = otherReports.map(report => {
      if (report.id === reportId) {
        const updatedReport = {
          ...report,
          hasVoted: true,
          userVote: type,
          canVote: false,
          supportCount: type === 'support' ? report.supportCount + 1 : report.supportCount,
          oppositionCount: type === 'oppose' ? report.oppositionCount + 1 : report.oppositionCount,
        };
        return updatedReport;
      }
      return report;
    });
    setOtherReports(updatedReports);

    try {
      await axios.post(`/civic-report/${reportId}/${type}`);
      setMessage(`✅ Successfully ${type}ed the report!`);
      setTimeout(() => setMessage(null), 3000);
      fetchOtherReports();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || `Failed to ${type} the report`;
      setMessage(`❌ ${errorMessage}`);
      setTimeout(() => setMessage(null), 4000);
      fetchOtherReports();
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
    } else {
      setPhotoPreview(null);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (!position) {
      setMessage('❌ Location not available. Please allow location access to submit a report.');
      return;
    }

    formData.append('latitude', position.lat.toString());
    formData.append('longitude', position.lng.toString());

    try {
      await axios.post('/civic-report', formData);

      setMessage('✅ Report submitted successfully!');

      formRef.current?.reset();
      setPhotoPreview(null);
      await fetchMyReports();
      setTimeout(() => setMessage(null), 5000);

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to submit report';
      setMessage(`❌ ${errorMessage}`);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleWithdrawReport = async (reportId: string) => {
    try {
      await axios.delete(`/civic-report/${reportId}`);
      setMessage('✅ Report withdrawn successfully!');
      setTimeout(async () => {
        await fetchMyReports();
        setMessage(null);
      }, 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to withdraw report';
      setMessage(`❌ ${errorMessage}`);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const renderReports = (reports: CivicReport[]) => {
    if (loading) return <p className="text-white text-center">Loading reports...</p>;
    if (reports.length === 0) return <p className="text-gray-400 text-center">No reports found. Be the first to report an issue!</p>;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
        {reports.map(report => (
          <ReportCard
            key={report.id}
            report={report}
            handleVote={handleVote}
            votingStates={votingStates}
          />
        ))}
      </div>
    );
  };

  return (
    <RoleGuard role="CITIZEN">
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
        {/* Animated Background Orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="relative z-10 p-6 space-y-8">
          {/* Header Card */}
          <div className="animate-fade-in-down">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex-1 text-center">
                  <h1 className="text-4xl font-bold text-white mb-2">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
                      🏛️ Civic Reporting
                    </span>
                  </h1>
                  <p className="text-gray-300 text-lg">
                    Your voice matters. Report issues and support others in your community.
                  </p>
                </div>
                {currentUserId && (
                  <div className="ml-4">
                    <NotificationBell userId={currentUserId} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Message Alert */}
          {message && (
            <div className={`animate-fade-in-up p-4 rounded-xl border-l-4 ${
              message.includes('✅') ? 'bg-green-900/40 border-green-500 text-green-300' : 'bg-red-900/40 border-red-500 text-red-300'
            }`}>
              {message}
            </div>
          )}

          {/* Submit Report Form */}
          <div className="animate-fade-in-up">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
              <h2 className="text-2xl font-semibold text-white mb-4">📍 Submit a New Report</h2>
              <div className="mb-4">
                <p className={`text-sm font-medium ${
                  locationMessage.startsWith('✅') ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {locationMessage}
                </p>
              </div>
              <form ref={formRef} onSubmit={handleSubmitReport} className="space-y-4">
                <input
                  type="text"
                  name="title"
                  placeholder="Report Title"
                  required
                  className="w-full p-3 rounded-xl bg-white/5 text-white border border-gray-600 focus:border-purple-500 transition-colors placeholder-gray-400"
                />
                <textarea
                  name="description"
                  placeholder="Describe the issue in detail..."
                  required
                  rows={3}
                  className="w-full p-3 rounded-xl bg-white/5 text-white border border-gray-600 focus:border-purple-500 transition-colors placeholder-gray-400 resize-none"
                />
                <select
                  name="type"
                  required
                  className="w-full p-3 rounded-xl bg-white/5 text-white border border-gray-600 focus:border-purple-500 transition-colors appearance-none pr-8"
                >
                  <option className="text-black" value="">Select Issue Type</option>
                  <option className="text-black" value="illegal_dumping">Illegal Dumping</option>
                  <option className="text-black" value="open_toilet">Open Toilet</option>
                  <option className="text-black" value="dirty_toilet">Dirty Toilet</option>
                  <option className="text-black"value="overflow_dustbin">Overflowing Dustbin</option>
                  <option className="text-black" value="dead_animal">Dead Animal</option>
                  <option className="text-black" value="fowl">Foul Smell</option>
                  <option className="text-black" value="public_bin_request">Request for Public Bin</option>
                  <option className="text-black" value="public_toilet_request">Request for Public Toilet</option>
                </select>
                {photoPreview && (
                  <div className="relative w-full h-48 rounded-xl overflow-hidden shadow-md">
                    <Image
                      src={photoPreview}
                      alt="Selected photo preview"
                      layout="fill"
                      objectFit="cover"
                      className="transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                )}
                <div className="relative w-full">
                  <input
                    type="file"
                    name="photo"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="w-full text-white file:py-3 file:px-6 file:rounded-xl file:bg-gradient-to-r file:from-blue-500 file:to-purple-600 file:text-white file:font-bold file:border-none file:cursor-pointer file:transition-all file:duration-300 file:hover:from-blue-600 file:hover:to-purple-700"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!position}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:hover:scale-100"
                >
                  🚀 Submit Report
                </button>
              </form>
            </div>
          </div>

          {/* Reports Section */}
          <div className="animate-fade-in-up">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
              <div className="flex border-b border-gray-700">
                <button
                  className={`flex-1 py-4 px-6 text-center font-semibold transition-all duration-300 rounded-tl-3xl ${
                    activeTab === 'MINE'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                  onClick={() => setActiveTab('MINE')}
                >
                  📝 My Reports ({myReports.length})
                </button>
                <button
                  className={`flex-1 py-4 px-6 text-center font-semibold transition-all duration-300 rounded-tr-3xl ${
                    activeTab === 'OTHERS'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                  onClick={() => setActiveTab('OTHERS')}
                >
                  🌍 Other Reports ({otherReports.length})
                </button>
              </div>

              {activeTab === 'OTHERS' && (
                <div className="p-4 border-b border-gray-700 flex justify-center space-x-2">
                  <button
                    className={`px-6 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 ${
                      viewMode === 'LIST'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                    onClick={() => {
                      setViewMode('LIST');
                      setIsMapFullscreen(false);
                    }}
                  >
                    📋 List View
                  </button>
                  <button
                    className={`px-6 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 ${
                      viewMode === 'MAP'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                    onClick={() => setViewMode('MAP')}
                  >
                    🗺️ Map View
                  </button>
                  {viewMode === 'MAP' && (
                    <button
                      className={`px-4 py-2 rounded-xl font-medium transition-colors hover:scale-105 duration-300 ${
                        isMapFullscreen
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                      onClick={() => setIsMapFullscreen(!isMapFullscreen)}
                    >
                      {isMapFullscreen ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <path d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <path d="M16.5 6a1.5 1.5 0 011.5 1.5v3.75a.75.75 0 01-1.5 0V7.5h-3.75a.75.75 0 010-1.5h3.75zM7.5 16.5a1.5 1.5 0 01-1.5-1.5v-3.75a.75.75 0 011.5 0v2.25h2.25a.75.75 0 010 1.5H7.5z" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              )}

              <div className="p-6">
                {activeTab === 'MINE' ? (
                  <>
                    {/* Status Filter Tabs */}
                    <div className="mb-6 flex justify-center space-x-2 border-b border-gray-700 pb-4">
                      <button
                        onClick={() => setStatusFilter('ALL')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          statusFilter === 'ALL'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-white/5 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        All ({myReports.length})
                      </button>
                      <button
                        onClick={() => setStatusFilter('PENDING')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          statusFilter === 'PENDING'
                            ? 'bg-yellow-600 text-white shadow-lg'
                            : 'bg-white/5 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        Pending ({myReports.filter(r => r.status !== 'resolved').length})
                      </button>
                      <button
                        onClick={() => setStatusFilter('RESOLVED')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          statusFilter === 'RESOLVED'
                            ? 'bg-green-600 text-white shadow-lg'
                            : 'bg-white/5 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        Resolved ({myReports.filter(r => r.status === 'resolved').length})
                      </button>
                    </div>
                    {renderReports(
                      statusFilter === 'ALL'
                        ? myReports
                        : statusFilter === 'PENDING'
                        ? myReports.filter(r => r.status !== 'resolved')
                        : myReports.filter(r => r.status === 'resolved')
                    )}
                  </>
                ) : viewMode === 'LIST' ? (
                  renderReports(otherReports)
                ) : (
                  <div
                    className={`w-full rounded-3xl overflow-hidden transition-all duration-300 shadow-xl border border-white/20 ${
                      isMapFullscreen
                        ? 'fixed inset-0 z-50 rounded-none'
                        : 'h-[600px] relative'
                    }`}
                  >
                    <Map
                      reports={otherReports}
                      refreshReports={fetchOtherReports}
                      userPosition={position}
                      loggedInUserId={currentUserId}
                      onVote={handleVote}
                      votingStates={votingStates}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
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
          .animate-fade-in {
            animation: fade-in 0.5s ease-out forwards;
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.6s ease-out forwards;
          }
          .animate-fade-in-down {
            animation: fade-in-down 0.6s ease-out forwards;
          }
        `}</style>
      </div>
    </RoleGuard>
  );
};

export default CivicReportPage;
