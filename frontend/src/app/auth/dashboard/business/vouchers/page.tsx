'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/axiosInstance';
import RoleGuard from '../../../../../components/RoleGuard';

interface Voucher {
  id: string;
  title: string;
  description?: string;
  cleanCoinCost: number;
  discountAmount?: number;
  discountPercent?: number;
  terms?: string;
  expiryDate?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REDEEMED' | 'CANCELLED';
  totalQuantity?: number;
  claimedCount: number;
  createdAt: string;
  _count?: {
    claims: number;
  };
}

interface FormData {
    title: string;
    description: string;
    cleanCoinCost: number;
    discountAmount: string;
    discountPercent: string;
    terms: string;
    expiryDate: string;
    totalQuantity: string;
    status: 'ACTIVE' | 'CANCELLED';
}

const initialFormData: FormData = {
    title: '',
    description: '',
    cleanCoinCost: 0,
    discountAmount: '',
    discountPercent: '',
    terms: '',
    expiryDate: '',
    totalQuantity: '',
    status: 'ACTIVE',
};

export default function BusinessVouchersPage() {
  const router = useRouter();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  useEffect(() => {
    fetchVouchers();
  }, []);

  const resetForm = () => {
      setFormData(initialFormData);
  };

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      // Correct endpoint for a business to view THEIR vouchers
      const res = await api.get('/cleancoin/vouchers/business', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVouchers(res.data);
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to load business vouchers');
    } finally {
      setLoading(false);
    }
  };

  const parseFormData = (data: FormData) => {
    return {
        ...data,
        cleanCoinCost: Number(data.cleanCoinCost),
        // Convert empty strings to null for optional number fields
        discountAmount: data.discountAmount ? Number(data.discountAmount) : null,
        discountPercent: data.discountPercent ? Number(data.discountPercent) : null,
        totalQuantity: data.totalQuantity ? Number(data.totalQuantity) : null,
        // Convert empty string to null for optional date field
        expiryDate: data.expiryDate || null,
    };
  };

  const handleCreate = async () => {
    setMessage(null);
    try {
      await api.post('/cleancoin/vouchers', parseFormData(formData), {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage('Voucher created successfully!');
      setShowCreateModal(false);
      resetForm();
      await fetchVouchers();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to create voucher');
    }
  };

  const handleUpdate = async () => {
    if (!editingVoucher) return;
    setMessage(null);
    try {
      await api.put(`/cleancoin/vouchers/${editingVoucher.id}`, parseFormData(formData), {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage('Voucher updated successfully!');
      setShowCreateModal(false);
      setEditingVoucher(null);
      resetForm();
      await fetchVouchers();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to update voucher');
    }
  };

  const handleDelete = async (voucherId: string) => {
    if (!confirm('Are you sure you want to cancel this voucher? This will change its status to CANCELLED.')) return;
    setMessage(null);
    try {
      // NOTE: This uses the DELETE endpoint on the backend which changes status to CANCELLED
      await api.delete(`/cleancoin/vouchers/${voucherId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage('Voucher successfully cancelled.');
      await fetchVouchers();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to cancel voucher');
    }
  };
  
  const handleEditClick = (voucher: Voucher) => {
    setEditingVoucher(voucher);
    setFormData({
        title: voucher.title,
        description: voucher.description || '',
        cleanCoinCost: voucher.cleanCoinCost,
        discountAmount: voucher.discountAmount?.toString() || '',
        discountPercent: voucher.discountPercent?.toString() || '',
        terms: voucher.terms || '',
        // Format date to YYYY-MM-DD for input[type="date"]
        expiryDate: voucher.expiryDate ? new Date(voucher.expiryDate).toISOString().split('T')[0] : '',
        totalQuantity: voucher.totalQuantity?.toString() || '',
        status: voucher.status,
    });
    setShowCreateModal(true);
  };


  if (loading) {
    return (
      <RoleGuard role="BUSINESS">
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-white text-xl">Loading Business Vouchers...</div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard role="BUSINESS">
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-white">🏢 Voucher Management</h1>
            <button
              onClick={() => {
                resetForm();
                setEditingVoucher(null);
                setShowCreateModal(true);
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              + Create New Voucher
            </button>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-xl ${
              message.includes('successfully') ? 'bg-green-500/20 border border-green-400/30 text-green-200' : 'bg-red-500/20 border border-red-400/30 text-red-200'
            }`}>
              {message}
            </div>
          )}

          {/* Vouchers List */}
          <div className="bg-gray-800 rounded-xl shadow-2xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-6">My Created Vouchers ({vouchers.length})</h2>
            
            {vouchers.length === 0 ? (
                <div className="text-center text-gray-500 py-10">
                    No vouchers created yet. Click "Create New Voucher" to start!
                </div>
            ) : (
                <div className="space-y-4">
                {vouchers.map((voucher) => (
                    <div 
                        key={voucher.id} 
                        className={`p-4 rounded-xl flex justify-between items-center ${
                            voucher.status === 'ACTIVE' ? 'bg-slate-700/50 border border-green-500/30' : 'bg-slate-700/20 border border-gray-500/30 opacity-70'
                        }`}
                    >
                        {/* Left Side: Details */}
                        <div className="flex-1 min-w-0">
                            <div className="text-lg font-bold text-white truncate">{voucher.title}</div>
                            <div className="text-sm text-gray-400">
                                Cost: <span className="text-green-400 font-semibold">{voucher.cleanCoinCost} CC</span> | 
                                Claims: {voucher.claimedCount} 
                                {voucher.totalQuantity ? `/${voucher.totalQuantity}` : ' (Unlimited)'}
                            </div>
                            <div className="text-xs text-gray-500">
                                Created: {new Date(voucher.createdAt).toLocaleDateString()}
                                {voucher.expiryDate && ` | Expires: ${new Date(voucher.expiryDate).toLocaleDateString()}`}
                            </div>
                        </div>

                        {/* Middle: Status Tag */}
                        <div className="mx-4">
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                                voucher.status === 'ACTIVE' ? 'bg-green-500/30 text-green-300' : 
                                voucher.status === 'CANCELLED' ? 'bg-red-500/30 text-red-300' : 
                                'bg-gray-500/30 text-gray-300'
                            }`}>
                                {voucher.status}
                            </span>
                        </div>

                        {/* Right Side: Actions */}
                        <div className="flex space-x-2 ml-4">
                            <button
                                onClick={() => handleEditClick(voucher)}
                                className="text-sm bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                                disabled={voucher.status !== 'ACTIVE'}
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleDelete(voucher.id)}
                                className="text-sm bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                                disabled={voucher.status !== 'ACTIVE'}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ))}
                </div>
            )}
          </div>

          {/* Create/Edit Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-800 rounded-xl p-8 w-full max-w-lg shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-6">
                  {editingVoucher ? 'Edit Voucher' : 'Create New Voucher'}
                </h2>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-white/20"
                      placeholder="e.g., 20% Off Your Next Meal"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-white/20"
                      placeholder="Detailed offer description"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Cost (CleanCoins)</label>
                      <input
                        type="number"
                        value={formData.cleanCoinCost}
                        onChange={(e) => setFormData({ ...formData, cleanCoinCost: Number(e.target.value) })}
                        className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-white/20"
                        min="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Total Quantity</label>
                      <input
                        type="number"
                        value={formData.totalQuantity}
                        onChange={(e) => setFormData({ ...formData, totalQuantity: e.target.value })}
                        className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-white/20"
                        min="1"
                        placeholder="Leave empty for unlimited"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Discount Amount (₹)</label>
                      <input
                        type="number"
                        value={formData.discountAmount}
                        onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                        className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-white/20"
                        min="0"
                        placeholder="Optional fixed amount"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Discount Percent (%)</label>
                      <input
                        type="number"
                        value={formData.discountPercent}
                        onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
                        className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-white/20"
                        min="0"
                        max="100"
                        placeholder="Optional percentage"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Expiry Date</label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-white/20"
                    />
                  </div>
                  
                  {editingVoucher && (
                      <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                          <select
                              value={formData.status}
                              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'CANCELLED' })}
                              className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-white/20"
                          >
                              <option value="ACTIVE">ACTIVE</option>
                              <option value="CANCELLED">CANCELLED</option>
                          </select>
                      </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Terms and Conditions</label>
                    <textarea
                      value={formData.terms}
                      onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                      className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-white/20"
                      placeholder="e.g., 'One per customer. Not valid with other offers.'"
                    />
                  </div>
                </div>

                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingVoucher(null);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 py-3 px-4 rounded-lg font-semibold transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingVoucher ? handleUpdate : handleCreate}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300"
                  >
                    {editingVoucher ? 'Update Voucher' : 'Create Voucher'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
