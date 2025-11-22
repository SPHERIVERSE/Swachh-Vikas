'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import RoleGuard from '@/components/RoleGuard';
import api from '@/utils/axiosInstance';

// Interfaces for the data to be fetched
interface PublicFacility {
  id: string;
  type: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface WasteWorkerLocation {
  id: string;
  workerId: string;
  latitude: number;
  longitude: number;
}

// Dynamically import the map component to prevent SSR issues with Leaflet
const CivicMap = dynamic(() => import('@/components/CivicMap'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center w-full h-full bg-slate-900/50">
      <p className="text-white text-xl animate-pulse">Loading map...</p>
    </div>
  ),
});

const LiveAssetTrackerPage = () => {
  const [facilities, setFacilities] = useState<PublicFacility[]>([]);
  const [workerLocations, setWorkerLocations] = useState<WasteWorkerLocation[]>([]);
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Get user's current location and fetch asset data
  useEffect(() => {
    const fetchAssetData = async () => {
      setError('');
      try {
        const [facilitiesRes, workersRes] = await Promise.all([
          api.get('/maps/facilities'),
          api.get('/maps/worker-locations'),
        ]);
        setFacilities(facilitiesRes.data);
        setWorkerLocations(workersRes.data);
      } catch (err) {
        setError('Failed to load map data. Please try again later.');
        console.error('Error fetching asset data:', err);
      } finally {
        setLoading(false);
      }
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserPosition({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          fetchAssetData();
        },
        (err) => {
          console.error('Error getting user location:', err);
          setLoading(false);
          setError('We need your location to display the map. Please enable geolocation in your browser settings.');
        }
      );
    } else {
      setLoading(false);
      setError('Geolocation is not supported by your browser. Please use a different browser.');
    }
  }, []);

  if (loading || !userPosition) {
    return (
      <RoleGuard role="CITIZEN">
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 text-center border border-white/20 shadow-2xl animate-fade-in">
            <div className="relative">
              <div className="animate-spin w-20 h-20 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-6"></div>
              <div className="absolute inset-0 animate-ping w-20 h-20 border-4 border-blue-400/30 rounded-full mx-auto"></div>
            </div>
            <p className="text-white text-xl font-semibold">Loading Live Asset Tracker...</p>
            <p className="text-blue-200 text-sm mt-2">Summoning the champions</p>
          </div>
        </div>
      </RoleGuard>
    );
  }

  if (error) {
    return (
      <RoleGuard role="CITIZEN">
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 text-center border border-white/20 shadow-2xl animate-fade-in">
            <p className="text-red-400 text-xl font-semibold mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Reload Page
            </button>
          </div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard role="CITIZEN">
      <div className="min-h-screen p-6 relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
        {/* Animated Background Orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        <div className="relative z-10 space-y-8">
          {/* Header Card */}
          <div className="animate-fade-in-down">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl text-center">
              <h1 className="text-4xl font-bold text-white mb-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
                  🚚 Live Asset Tracker
                </span>
              </h1>
              <p className="text-gray-300 text-lg">
                View the real-time locations of waste collection vehicles and public facilities.
              </p>
            </div>
          </div>

          {/* Map Container */}
          <div className="animate-fade-in-up">
            <div className="relative w-full h-[600px] overflow-hidden rounded-3xl shadow-2xl border border-white/20">
              <CivicMap
                reports={[]}
                refreshReports={() => {}}
                facilities={facilities}
                workerLocations={workerLocations}
                userPosition={userPosition}
                loggedInUserId={null}
                onVote={() => {}}
                votingStates={{}}
              />
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

export default LiveAssetTrackerPage;
