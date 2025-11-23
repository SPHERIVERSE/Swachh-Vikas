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

export default function MarketplacePage() {
  const router = useRouter();
  const [listings, setListings] = useState<WasteListing[]>([]);
  const [pastDeals, setPastDeals] = useState<WasteListing[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    wasteType: 'PLASTIC',
    title: '',
    description: '',
    weight: '',
    price: '',
    image: null as File | null,
  });
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedListing, setSelectedListing] = useState<WasteListing | null>(null);
  const [showBidsModal, setShowBidsModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    // Get current user
    api.get('/users/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setCurrentUserId(res.data.id))
      .catch(() => router.push('/auth/login'));

    // Get user location
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
    fetchPastDeals();
  }, [router]);

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

  const fetchBids = async (listingId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await api.get(`/marketplace/listings/${listingId}/bids`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch bids:', error);
      return [];
    }
  };

  const handleAcceptBid = async (bidId: string) => {
    if (!confirm('Are you sure you want to accept this bid? This will close the listing.')) return;

    try {
      const token = localStorage.getItem('access_token');
      await api.post(`/marketplace/bids/${bidId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Bid accepted! The deal is now closed.');
      setShowBidsModal(false);
      setSelectedListing(null);
      fetchListings();
    } catch (error: any) {
      console.error('Failed to accept bid:', error);
      alert(error.response?.data?.message || 'Failed to accept bid');
    }
  };

  const fetchListings = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await api.get('/marketplace/my-listings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setListings(response.data);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) {
      alert('Please enable location access to create a listing');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const formDataToSend = new FormData();
      formDataToSend.append('wasteType', formData.wasteType);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('weight', formData.weight);
      if (formData.price) formDataToSend.append('price', formData.price);
      formDataToSend.append('latitude', location.lat.toString());
      formDataToSend.append('longitude', location.lng.toString());
      if (formData.image) formDataToSend.append('image', formData.image);

      await api.post('/marketplace/listings', formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      alert('Listing created successfully!');
      setShowCreateModal(false);
      setFormData({
        wasteType: 'PLASTIC',
        title: '',
        description: '',
        weight: '',
        price: '',
        image: null,
      });
      fetchListings();
    } catch (error: any) {
      console.error('Failed to create listing:', error);
      alert(error.response?.data?.message || 'Failed to create listing');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500';
      case 'SOLD':
        return 'bg-blue-500';
      case 'EXPIRED':
        return 'bg-gray-500';
      case 'CANCELLED':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
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
              <h1 className="text-4xl font-bold text-white mb-2">Waste to Wealth Marketplace</h1>
              <p className="text-blue-200">List your waste and turn it into value</p>
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
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Active Listings ({listings.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'past'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Past Deals ({pastDeals.length})
          </button>
        </div>

        {/* Create Listing Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all transform hover:scale-105"
          >
            + Create New Listing
          </button>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'past' ? (
          <div>
            {pastDeals.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-xl rounded-xl p-12 text-center border border-white/20">
                <h3 className="text-2xl font-bold text-white mb-2">No Past Deals</h3>
                <p className="text-blue-200">You haven't completed any deals yet</p>
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
                      <span className="px-3 py-1 bg-blue-500 rounded-full text-xs font-semibold text-white">
                        SOLD
                      </span>
                      <span className="text-white/80 text-sm font-medium">{deal.wasteType}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{deal.title}</h3>
                    {deal.description && (
                      <p className="text-blue-200 text-sm mb-3 line-clamp-2">{deal.description}</p>
                    )}
                    <div className="flex items-center justify-between text-sm mb-3">
                      <span className="text-white/80">Weight: <strong className="text-white">{deal.weight} kg</strong></span>
                    </div>
                    {deal.buyer && (
                      <div className="mt-3 pt-3 border-t border-white/20">
                        <p className="text-sm text-blue-200">
                          Sold to: <span className="text-white font-semibold">{deal.buyer.name}</span>
                        </p>
                        {deal.buyer.businessType && (
                          <p className="text-xs text-white/60 mt-1">{deal.buyer.businessType}</p>
                        )}
                        {deal.bids && deal.bids.length > 0 && deal.bids[0] && (
                          <p className="text-sm text-green-400 font-semibold mt-2">
                            Final Price: ₹{deal.bids[0].amount}
                          </p>
                        )}
                        {deal.soldAt && (
                          <p className="text-xs text-white/60 mt-2">
                            Sold on {new Date(deal.soldAt).toLocaleDateString()}
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
          <>
        {/* Listings Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white">Loading your listings...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-12 text-center border border-white/20">
            <svg className="w-24 h-24 mx-auto mb-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="text-2xl font-bold text-white mb-2">No Listings Yet</h3>
            <p className="text-blue-200 mb-6">Start by creating your first waste listing!</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Create Listing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
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
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getStatusColor(listing.status)}`}>
                    {listing.status}
                  </span>
                  <span className="text-white/80 text-sm font-medium">{listing.wasteType}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{listing.title}</h3>
                {listing.description && (
                  <p className="text-blue-200 text-sm mb-3 line-clamp-2">{listing.description}</p>
                )}
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-white/80">Weight: <strong className="text-white">{listing.weight} kg</strong></span>
                  {listing.price && (
                    <span className="text-green-400 font-semibold">₹{listing.price}/kg</span>
                  )}
                </div>
                {listing.buyer && (
                  <div className="mt-3 pt-3 border-t border-white/20">
                    <p className="text-sm text-blue-200">
                      Sold to: <span className="text-white font-semibold">{listing.buyer.name}</span>
                    </p>
                  </div>
                )}
                {listing.status === 'ACTIVE' && (
                  <div className="mt-3 pt-3 border-t border-white/20">
                    <button
                      onClick={async () => {
                        const bids = await fetchBids(listing.id);
                        setSelectedListing({ ...listing, bids });
                        setShowBidsModal(true);
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition-colors"
                    >
                      View Bids ({listing.bids?.length || 0})
                    </button>
                  </div>
                )}
                <p className="text-xs text-white/60 mt-3">
                  Listed on {new Date(listing.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
          </>
        )}
      </div>

      {/* Create Listing Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Create Waste Listing</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Waste Type *</label>
                <select
                  value={formData.wasteType}
                  onChange={(e) => setFormData({ ...formData, wasteType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {WASTE_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Clean Plastic Bottles"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe your waste..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price per kg (₹)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {!location && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Please enable location access to create a listing
                  </p>
                </div>
              )}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!location}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bids Modal */}
      {showBidsModal && selectedListing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Bids for "{selectedListing.title}"</h2>
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
                    {bid.status === 'PENDING' && (
                      <button
                        onClick={() => handleAcceptBid(bid.id)}
                        className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition-colors"
                      >
                        Accept Bid
                      </button>
                    )}
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

