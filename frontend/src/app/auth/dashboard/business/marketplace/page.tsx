// src/app/auth/dashboard/business/marketplace/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NotificationBell from '@/components/NotificationBell';
import api from '@/utils/axiosInstance';

interface WasteBid {
  id: string;
  amount: number;
  message?: string;
  status: string;
  createdAt: string;
  bidder: { id: string; name: string; businessType?: string };
}

interface WasteListing {
  id: string;
  wasteType: string;
  title: string;
  description?: string;
  imageUrl?: string;
  weight: number;
  price?: number;
  latitude: number;
  longitude: number;
  status: string;
  createdAt: string;
  soldAt?: string;
  seller: { id: string; name: string; avatarUrl?: string };
  buyer?: { id: string; name: string; businessType?: string };
  bids?: WasteBid[];
}

const WASTE_TYPES = [
  'PLASTIC',
  'PAPER',
  'METAL',
  'GLASS',
  'ORGANIC',
  'ELECTRONIC',
  'TEXTILE',
  'OTHER',
];

export default function BusinessMarketplacePage() {
  const router = useRouter();
  const [listings, setListings] = useState<WasteListing[]>([]);
  const [pastDeals, setPastDeals] = useState<WasteListing[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    wasteType: '',
    minWeight: '',
    maxWeight: '',
    radiusKm: '50',
  });
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    api.get('/users/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setCurrentUserId(res.data.id))
      .catch(() => router.push('/auth/login'));

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => console.error('Location access denied')
      );
    }

    fetchListings();
  }, [router]);

  const fetchListings = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const params: any = {};
      
      if (filters.wasteType) params.wasteType = filters.wasteType;
      if (filters.minWeight) params.minWeight = filters.minWeight;
      if (filters.maxWeight) params.maxWeight = filters.maxWeight;
      if (location && filters.radiusKm) {
        params.latitude = location.lat;
        params.longitude = location.lng;
        params.radiusKm = filters.radiusKm;
      }

      const response = await api.get('/marketplace/listings', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setListings(response.data);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location) {
      fetchListings();
    }
  }, [filters, location]);

  useEffect(() => {
    fetchPastDeals();
  }, []);

  const fetchPastDeals = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await api.get('/marketplace/past-deals', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPastDeals(response.data);
    } catch (error) {
      console.error('Failed to fetch past deals:', error);
    }
  };

  const [showBidModal, setShowBidModal] = useState<string | null>(null);
  const [showBidsModal, setShowBidsModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<WasteListing | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');

  const handlePlaceBid = async (listingId: string) => {
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      alert('Please enter a valid bid amount');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      await api.post(`/marketplace/listings/${listingId}/bid`, {
        amount: parseFloat(bidAmount),
        message: bidMessage || undefined,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Bid placed successfully! The seller has been notified.');
      setShowBidModal(null);
      setBidAmount('');
      setBidMessage('');
      fetchListings();
    } catch (error: any) {
      console.error('Failed to place bid:', error);
      alert(error.response?.data?.message || 'Failed to place bid');
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Waste Marketplace</h1>
              <p className="text-emerald-200">Browse and bid on waste from citizens</p>
            </div>
          </div>
          {currentUserId && <NotificationBell userId={currentUserId} />}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'active'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Active Listings ({listings.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'past'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Past Deals ({pastDeals.length})
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Waste Type</label>
              <select
                value={filters.wasteType}
                onChange={(e) => setFilters({ ...filters, wasteType: e.target.value })}
                className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Types</option>
                {WASTE_TYPES.map((type) => (
                  <option key={type} value={type} className="text-gray-900">{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Min Weight (kg)</label>
              <input
                type="number"
                value={filters.minWeight}
                onChange={(e) => setFilters({ ...filters, minWeight: e.target.value })}
                className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-emerald-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Max Weight (kg)</label>
              <input
                type="number"
                value={filters.maxWeight}
                onChange={(e) => setFilters({ ...filters, maxWeight: e.target.value })}
                className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-emerald-500"
                placeholder="Any"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Radius (km)</label>
              <input
                type="number"
                value={filters.radiusKm}
                onChange={(e) => setFilters({ ...filters, radiusKm: e.target.value })}
                className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-emerald-500"
                placeholder="50"
              />
            </div>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'past' ? (
          // --- PAST DEALS CONTENT ---
          <div>
            {pastDeals.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-xl rounded-xl p-12 text-center border border-white/20">
                <h3 className="text-2xl font-bold text-white mb-2">No Past Deals</h3>
                <p className="text-emerald-200">You haven't completed any deals yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all"
                  >
                    {deal.imageUrl && (
                      <img
                        src={deal.imageUrl}
                        alt={deal.title}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-3 py-1 bg-emerald-500 rounded-full text-xs font-semibold text-white">
                        PURCHASED
                      </span>
                      <span className="text-white/80 text-sm font-medium">{deal.wasteType}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{deal.title}</h3>
                    {deal.description && (
                      <p className="text-emerald-200 text-sm mb-3 line-clamp-2">{deal.description}</p>
                    )}
                    <div className="flex items-center justify-between text-sm mb-3">
                      <span className="text-white/80">Weight: <strong className="text-white">{deal.weight} kg</strong></span>
                    </div>
                    {deal.seller && (
                      <div className="mt-3 pt-3 border-t border-white/20">
                        <p className="text-sm text-emerald-200">
                          Purchased from: <span className="text-white font-semibold">{deal.seller.name}</span>
                        </p>
                        {deal.bids && deal.bids.length > 0 && deal.bids[0] && (
                          <p className="text-sm text-green-400 font-semibold mt-2">
                            Final Price: ₹{deal.bids[0].amount}
                          </p>
                        )}
                        {deal.soldAt && (
                          <p className="text-xs text-white/60 mt-2">
                            Purchased on {new Date(deal.soldAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : ( 
          // --- ACTIVE LISTINGS CONTENT ---
          <>
            {/* Listings Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-white">Loading listings...</p>
              </div>
            ) : listings.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-xl rounded-xl p-12 text-center border border-white/20">
                <svg className="w-24 h-24 mx-auto mb-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="text-2xl font-bold text-white mb-2">No Listings Found</h3>
                <p className="text-emerald-200">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => {
                  const distance = location
                    ? calculateDistance(location.lat, location.lng, listing.latitude, listing.longitude).toFixed(1)
                    : null;

                  return (
                    <div
                      key={listing.id}
                      className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all"
                    >
                      {listing.imageUrl && (
                        <img
                          src={listing.imageUrl}
                          alt={listing.title}
                          className="w-full h-48 object-cover rounded-lg mb-4"
                        />
                      )}
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-3 py-1 bg-emerald-500 rounded-full text-xs font-semibold text-white">
                          {listing.wasteType}
                        </span>
                        {distance && (
                          <span className="text-white/80 text-sm">📍 {distance} km</span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">{listing.title}</h3>
                      {listing.description && (
                        <p className="text-emerald-200 text-sm mb-3 line-clamp-2">{listing.description}</p>
                      )}
                      <div className="flex items-center justify-between text-sm mb-3">
                        <span className="text-white/80">Weight: <strong className="text-white">{listing.weight} kg</strong></span>
                        {listing.price && (
                          <span className="text-green-400 font-semibold">₹{listing.price}/kg</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-3 text-sm text-white/80">
                        <span>Seller:</span>
                        <span className="font-semibold text-white">{listing.seller.name}</span>
                      </div>
                      {listing.bids && listing.bids.length > 0 && (
                        <div className="mb-3 p-2 bg-white/10 rounded-lg">
                          <p className="text-xs text-white/80 mb-1">Total Bids: {listing.bids.length}</p>
                          <button
                            onClick={() => {
                              setSelectedListing(listing);
                              setShowBidsModal(true);
                            }}
                            className="text-xs text-emerald-400 hover:text-emerald-300 underline"
                          >
                            View All Bids
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => setShowBidModal(listing.id)}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-2 rounded-lg font-semibold transition-all"
                      >
                        Place Bid
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Bid Modal */}
      {showBidModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Place Bid</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Bid Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Enter your bid amount"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Message (Optional)</label>
                <textarea
                  value={bidMessage}
                  onChange={(e) => setBidMessage(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Add a message to the seller..."
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowBidModal(null);
                    setBidAmount('');
                    setBidMessage('');
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handlePlaceBid(showBidModal)}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg"
                >
                  Place Bid
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View All Bids Modal */}
      {showBidsModal && selectedListing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">All Bids on "{selectedListing.title}"</h2>
              <button
                onClick={() => {
                  setShowBidsModal(false);
                  setSelectedListing(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {selectedListing.bids && selectedListing.bids.length > 0 ? (
              <div className="space-y-4">
                {selectedListing.bids.map((bid) => (
                  <div
                    key={bid.id}
                    className={`p-4 border rounded-lg ${
                      bid.status === 'ACCEPTED' ? 'bg-green-50 border-green-200' :
                      bid.status === 'REJECTED' ? 'bg-red-50 border-red-200' :
                      'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{bid.bidder.name}</h3>
                        {bid.bidder.businessType && (
                          <p className="text-sm text-gray-600">{bid.bidder.businessType}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">₹{bid.amount}</p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          bid.status === 'ACCEPTED' ? 'bg-green-200 text-green-800' :
                          bid.status === 'REJECTED' ? 'bg-red-200 text-red-800' :
                          'bg-blue-200 text-blue-800'
                        }`}>
                          {bid.status}
                        </span>
                      </div>
                    </div>
                    {bid.message && (
                      <p className="text-sm text-gray-700 mb-2">{bid.message}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Bid placed on {new Date(bid.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No bids yet for this listing</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
