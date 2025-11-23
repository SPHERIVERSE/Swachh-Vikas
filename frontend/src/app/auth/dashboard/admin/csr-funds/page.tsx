'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/axiosInstance';
import RoleGuard from '@/components/RoleGuard';

interface CSRFund {
  id: string;
  title: string;
  description?: string;
  amount: number;
  allocatedAmount: number;
  createdAt: string;
  updatedAt: string;
  business: {
    id: string;
    name: string;
    email: string;
    businessType?: string;
  };
  allocations: Array<{
    id: string;
    amount: number;
    purpose: string;
    createdAt: string;
  }>;
}

export default function AdminCSRFundsPage() {
  const router = useRouter();
  const [funds, setFunds] = useState<CSRFund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCSRFunds();
  }, []);

  const fetchCSRFunds = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/business/csr-funds/all');
      setFunds(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load CSR funds');
      console.error('Error fetching CSR funds:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getUtilizationPercentage = (allocated: number, total: number) => {
    if (total === 0) return 0;
    return (allocated / total) * 100;
  };

  if (loading) {
    return (
      <RoleGuard role="ADMIN">
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
          <div className="text-white text-xl">Loading CSR funds...</div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard role="ADMIN">
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">💰 CSR Funds Overview</h1>
                <p className="text-purple-200 text-lg">View all CSR funds from businesses</p>
              </div>
              <button
                onClick={() => router.back()}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-400/30 text-red-200 rounded-xl">
              {error}
            </div>
          )}

          {/* Summary Stats */}
          {funds.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <div className="text-purple-200 text-sm mb-2">Total Funds</div>
                <div className="text-3xl font-bold text-white">
                  {formatCurrency(funds.reduce((sum, fund) => sum + fund.amount, 0))}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <div className="text-purple-200 text-sm mb-2">Total Allocated</div>
                <div className="text-3xl font-bold text-white">
                  {formatCurrency(funds.reduce((sum, fund) => sum + fund.allocatedAmount, 0))}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <div className="text-purple-200 text-sm mb-2">Total Available</div>
                <div className="text-3xl font-bold text-green-400">
                  {formatCurrency(
                    funds.reduce((sum, fund) => sum + (fund.amount - fund.allocatedAmount), 0)
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CSR Funds List */}
          {funds.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/20">
              <div className="text-6xl mb-4">💰</div>
              <p className="text-purple-200 text-xl">No CSR funds found</p>
              <p className="text-gray-400 mt-2">Businesses haven't created any CSR funds yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {funds.map((fund) => {
                const utilization = getUtilizationPercentage(fund.allocatedAmount, fund.amount);
                const available = fund.amount - fund.allocatedAmount;

                return (
                  <div
                    key={fund.id}
                    className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/30 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white mb-2">{fund.title}</h3>
                        {fund.description && (
                          <p className="text-purple-200 mb-4">{fund.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="bg-blue-500/20 rounded-lg px-3 py-1">
                            <span className="text-blue-200 text-sm">Business:</span>
                            <span className="text-white font-semibold ml-2">{fund.business.name}</span>
                          </div>
                          {fund.business.businessType && (
                            <div className="bg-gray-500/20 rounded-lg px-3 py-1">
                              <span className="text-gray-300 text-sm">{fund.business.businessType}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white mb-1">
                          {formatCurrency(fund.amount)}
                        </div>
                        <div className="text-sm text-purple-200">Total Fund</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-semibold">Utilization</span>
                        <span className="text-purple-200">
                          {utilization.toFixed(1)}% ({formatCurrency(fund.allocatedAmount)} / {formatCurrency(fund.amount)})
                        </span>
                      </div>
                      <div className="relative w-full h-4 bg-slate-700/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-1000"
                          style={{ width: `${utilization}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>Allocated: {formatCurrency(fund.allocatedAmount)}</span>
                        <span>Available: {formatCurrency(available)}</span>
                      </div>
                    </div>

                    {/* Allocations */}
                    {fund.allocations.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-white font-semibold mb-3">Allocations</h4>
                        <div className="space-y-2">
                          {fund.allocations.map((allocation) => (
                            <div
                              key={allocation.id}
                              className="bg-white/5 rounded-lg p-4 border border-white/10"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="text-white font-medium">{allocation.purpose}</p>
                                  <p className="text-gray-400 text-sm">
                                    {new Date(allocation.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="text-green-400 font-semibold">
                                  {formatCurrency(allocation.amount)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-400">
                      Created: {new Date(fund.createdAt).toLocaleDateString()} | 
                      Last Updated: {new Date(fund.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}

