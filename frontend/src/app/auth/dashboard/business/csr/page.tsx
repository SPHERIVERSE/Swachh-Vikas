'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NotificationBell from '@/components/NotificationBell';
import api from '@/utils/axiosInstance';

interface CSRFund {
  id: string;
  title: string;
  description?: string;
  amount: number;
  allocatedAmount: number;
  createdAt: string;
  allocations: any[];
}

export default function CSRPage() {
  const router = useRouter();
  const [funds, setFunds] = useState<CSRFund[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
  });

  // UPDATED allocate state
  const [allocateData, setAllocateData] = useState({
    amount: '',
    purpose: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    api
      .get('/users/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setCurrentUserId(res.data.id))
      .catch(() => router.push('/auth/login'));

    fetchFunds();
  }, [router]);

  const fetchFunds = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await api.get('/business/csr-funds', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFunds(response.data);
    } catch (error) {
      console.error('Failed to fetch funds:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      await api.post('/business/csr-funds', {
        title: formData.title,
        description: formData.description || undefined,
        amount: parseFloat(formData.amount),
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('CSR Fund created successfully!');
      setShowCreateModal(false);
      setFormData({ title: '', description: '', amount: '' });
      fetchFunds();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create fund');
    }
  };

  const handleAllocate = async (fundId: string) => {
    if (!allocateData.amount || parseFloat(allocateData.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');

      await api.post(`/business/csr-funds/${fundId}/allocate`, {
        amount: parseFloat(allocateData.amount),
        purpose: allocateData.purpose || undefined,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert('Fund allocated successfully!');
      setShowAllocateModal(null);

      // reset form
      setAllocateData({
        amount: '',
        purpose: '',
      });

      fetchFunds();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to allocate fund');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                CSR Funds Management
              </h1>
              <p className="text-emerald-200">
                Manage your Corporate Social Responsibility funds
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            {currentUserId && <NotificationBell userId={currentUserId} />}
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              + Create Fund
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white">Loading funds...</p>
          </div>
        ) : funds.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-12 text-center border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-2">
              No CSR Funds Yet
            </h3>
            <p className="text-emerald-200 mb-6">
              Create your first CSR fund to get started
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Create Fund
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {funds.map((fund) => (
              <div
                key={fund.id}
                className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20"
              >
                <h3 className="text-xl font-bold text-white mb-2">
                  {fund.title}
                </h3>
                {fund.description && (
                  <p className="text-emerald-200 text-sm mb-4">
                    {fund.description}
                  </p>
                )}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/80">Total Amount:</span>
                    <span className="text-white font-semibold">
                      ₹{fund.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/80">Allocated:</span>
                    <span className="text-emerald-400 font-semibold">
                      ₹{fund.allocatedAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/80">Available:</span>
                    <span className="text-white font-semibold">
                      ₹
                      {(fund.amount - fund.allocatedAmount).toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-2 bg-white/20 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{
                        width: `${
                          (fund.allocatedAmount / fund.amount) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                <button
                  onClick={() => setShowAllocateModal(fund.id)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-semibold transition-colors"
                  disabled={fund.allocatedAmount >= fund.amount}
                >
                  Allocate Funds
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --------------------------- */}
      {/* CREATE MODAL */}
      {/* --------------------------- */}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Create CSR Fund</h2>
            <form onSubmit={handleCreateFund} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------- */}
      {/* ALLOCATION MODAL (FULLY UPDATED) */}
      {/* --------------------------- */}

      {showAllocateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Allocate Funds</h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAllocate(showAllocateModal);
              }}
              className="space-y-4"
            >
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={allocateData.amount}
                  onChange={(e) =>
                    setAllocateData({
                      ...allocateData,
                      amount: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                  placeholder="Enter allocation amount"
                />
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Purpose
                </label>
                <textarea
                  value={allocateData.purpose}
                  onChange={(e) =>
                    setAllocateData({
                      ...allocateData,
                      purpose: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={4}
                  placeholder="Describe the purpose of this allocation (e.g., Education program, Environmental initiative, etc.)"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(null)}
                  className="flex-1 px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg"
                >
                  Allocate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

