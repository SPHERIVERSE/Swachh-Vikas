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
  status: string;
  totalQuantity?: number;
  claimedCount: number;
  createdAt: string;
  business: {
    id: string;
    name: string;
    businessType?: string;
    avatarUrl?: string;
  };
  _count?: {
    claims: number;
  };
}

export default function CitizenVoucherMarketplacePage() {
  const router = useRouter();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [myClaims, setMyClaims] = useState<any[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vouchersRes, claimsRes, balanceRes] = await Promise.all([
        // 1. Get all available vouchers
        api.get('/cleancoin/vouchers', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        // 2. 🛠️ FIX: Corrected API path for user's claims
        api.get('/cleancoin/claims', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        // 3. Get user's balance
        api.get('/cleancoin/balance', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setVouchers(vouchersRes.data);
      setMyClaims(claimsRes.data);
      setBalance(balanceRes.data.balance || 0);
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to load vouchers');
    } finally {
      setLoading(false);
    }
  };

  const claimVoucher = async (voucherId: string) => {
    setClaimingId(voucherId);
    setMessage(null);
    try {
      await api.post(`/cleancoin/vouchers/${voucherId}/claim`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage('Voucher claimed successfully!');
      await fetchData(); // Refresh data
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to claim voucher');
    } finally {
      setClaimingId(null);
    }
  };

  const isClaimed = (voucherId: string) => {
    return myClaims.some(claim => claim.voucherId === voucherId);
  };

  const isAvailable = (voucher: Voucher) => {
    if (voucher.status !== 'ACTIVE') return false;
    if (voucher.expiryDate && new Date(voucher.expiryDate) < new Date()) return false;
    if (voucher.totalQuantity && voucher.claimedCount >= voucher.totalQuantity) return false;
    return true;
  };

  if (loading) {
    return (
      <RoleGuard role="CITIZEN">
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
          <div className="text-white text-xl">Loading vouchers...</div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard role="CITIZEN">
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header and UI for Citizen role remains the same */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-4xl font-bold text-white">🪙 Voucher Marketplace</h1>
              <div className="bg-green-500/20 backdrop-blur-xl rounded-2xl px-6 py-3 border border-green-400/30">
                <div className="text-sm text-green-200">Your Balance</div>
                <div className="text-2xl font-bold text-green-300">{balance} CC</div>
              </div>
            </div>
            <p className="text-blue-200 text-lg">
              Redeem your CleanCoins for exclusive vouchers from local businesses
            </p>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-xl ${
              message.includes('successfully') 
                ? 'bg-green-500/20 border border-green-400/30 text-green-200' 
                : 'bg-red-500/20 border border-red-400/30 text-red-200'
            }`}>
              {message}
            </div>
          )}

          {/* My Claims Section */}
          {myClaims.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">My Claimed Vouchers</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myClaims.map((claim) => (
                  <div
                    key={claim.id}
                    className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20"
                  >
                    <h3 className="text-xl font-bold text-white mb-2">{claim.voucher.title}</h3>
                    <p className="text-blue-200 text-sm mb-4">{claim.voucher.description}</p>
                    <div className="text-sm text-gray-300">
                      <div>Business: {claim.voucher.business.name}</div>
                      <div>Claimed: {new Date(claim.claimedAt).toLocaleDateString()}</div>
                      {/* You would typically show a QR code or claim ID here for redemption */}
                      <div className="mt-2 text-sm font-semibold text-purple-300">
                        Claim ID: {claim.id.substring(0, 8)}...
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Vouchers */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Available Vouchers</h2>
            {vouchers.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/20">
                <div className="text-6xl mb-4">🛍️</div>
                <p className="text-blue-200 text-xl">No vouchers available at the moment</p>
                <p className="text-gray-400 mt-2">Check back later for new offers!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vouchers.map((voucher) => {
                  const claimed = isClaimed(voucher.id);
                  const available = isAvailable(voucher);
                  const canAfford = balance >= voucher.cleanCoinCost;

                  return (
                    <div
                      key={voucher.id}
                      className={`bg-white/10 backdrop-blur-xl rounded-2xl p-6 border ${
                        claimed
                          ? 'border-purple-400/30'
                          : available && canAfford
                          ? 'border-green-400/30 hover:border-green-400/50'
                          : 'border-gray-400/20 opacity-60'
                      } transition-all duration-300 hover:scale-105`}
                    >
                      {/* Voucher details UI remains the same */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-2">{voucher.title}</h3>
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-xs bg-blue-500/20 text-blue-200 px-2 py-1 rounded">
                              {voucher.business.name}
                            </span>
                            {voucher.business.businessType && (
                              <span className="text-xs bg-gray-500/20 text-gray-300 px-2 py-1 rounded">
                                {voucher.business.businessType}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-400">{voucher.cleanCoinCost}</div>
                          <div className="text-xs text-green-300">CleanCoins</div>
                        </div>
                      </div>

                      {voucher.description && (
                        <p className="text-blue-200 text-sm mb-4">{voucher.description}</p>
                      )}

                      {(voucher.discountAmount || voucher.discountPercent) && (
                        <div className="bg-yellow-500/20 rounded-lg p-3 mb-4">
                          <div className="text-yellow-200 font-semibold">
                            {voucher.discountPercent
                              ? `${voucher.discountPercent}% OFF`
                              : `₹${voucher.discountAmount} OFF`}
                          </div>
                        </div>
                      )}

                      {voucher.terms && (
                        <div className="text-xs text-gray-400 mb-4">
                          <strong>Terms:</strong> {voucher.terms}
                        </div>
                      )}

                      {voucher.expiryDate && (
                        <div className="text-xs text-gray-400 mb-4">
                          Expires: {new Date(voucher.expiryDate).toLocaleDateString()}
                        </div>
                      )}

                      {voucher.totalQuantity && (
                        <div className="text-xs text-gray-400 mb-4">
                          {voucher.totalQuantity - voucher.claimedCount} remaining
                        </div>
                      )}

                      <button
                        onClick={() => claimVoucher(voucher.id)}
                        disabled={claimed || !available || !canAfford || claimingId === voucher.id}
                        className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                          claimed
                            ? 'bg-purple-500/20 text-purple-300 cursor-not-allowed'
                            : !available
                            ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                            : !canAfford
                            ? 'bg-red-500/20 text-red-300 cursor-not-allowed'
                            : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white hover:scale-105'
                        }`}
                      >
                        {claimed
                          ? '✓ Already Claimed'
                          : !available
                          ? 'Not Available'
                          : !canAfford
                          ? `Need ${voucher.cleanCoinCost - balance} more CC`
                          : claimingId === voucher.id
                          ? 'Claiming...'
                          : 'Claim Voucher'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
