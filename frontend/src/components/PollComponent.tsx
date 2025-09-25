'use client';

import React, { useState, useEffect } from 'react';
import axios from '@/utils/axiosInstance';

interface PollOption {
  option: string;
  votes: number;
}

interface PollResults {
  question: string;
  options: PollOption[];
  totalVotes: number;
  isActive: boolean;
  expiresAt?: string;
}

interface PollComponentProps {
  pollId: string;
  onVote?: () => void;
}

export default function PollComponent({ pollId, onVote }: PollComponentProps) {
  const [results, setResults] = useState<PollResults | null>(null);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchPollData();
  }, [pollId]);

  const fetchPollData = async () => {
    try {
      const [resultsRes, voteRes] = await Promise.all([
        axios.get(`/community/poll/${pollId}/results`),
        axios.get(`/community/poll/${pollId}/my-vote`)
      ]);
      
      setResults(resultsRes.data);
      setMyVote(voteRes.data.vote);
    } catch (e: any) {
      setMessage(e.response?.data?.message || 'Failed to load poll');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (option: string) => {
    if (!results?.isActive) return;
    
    setVoting(true);
    try {
      await axios.post(`/community/poll/${pollId}/vote`, { option });
      setMyVote(option);
      await fetchPollData(); // Refresh results
      onVote?.();
      setMessage('Vote recorded successfully!');
    } catch (e: any) {
      setMessage(e.response?.data?.message || 'Failed to vote');
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return <div className="text-gray-400">Loading poll...</div>;
  }

  if (!results) {
    return <div className="text-red-400">Failed to load poll</div>;
  }

  const isExpired = results.expiresAt && new Date(results.expiresAt) < new Date();

  return (
    <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
      <h4 className="text-lg font-semibold text-white mb-3">{results.question}</h4>
      
      {!results.isActive || isExpired ? (
        <div className="text-gray-400 text-sm mb-3">
          {isExpired ? 'Poll has expired' : 'Poll is no longer active'}
        </div>
      ) : null}

      <div className="space-y-2">
        {results.options.map((option, index) => {
          const percentage = results.totalVotes > 0 ? (option.votes / results.totalVotes) * 100 : 0;
          const isSelected = myVote === option.option;
          
          return (
            <div key={index} className="relative">
              <button
                onClick={() => handleVote(option.option)}
                disabled={!results.isActive || isExpired || voting}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  isSelected
                    ? 'bg-teal-600 text-white'
                    : results.isActive && !isExpired
                    ? 'bg-gray-600 text-white hover:bg-gray-500'
                    : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{option.option}</span>
                  <span className="text-sm">
                    {option.votes} vote{option.votes !== 1 ? 's' : ''}
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="mt-2 w-full bg-gray-500 rounded-full h-2">
                  <div
                    className="bg-teal-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                
                <div className="mt-1 text-xs text-gray-300">
                  {percentage.toFixed(1)}%
                </div>
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-sm text-gray-400">
        Total votes: {results.totalVotes}
        {results.expiresAt && (
          <span className="ml-2">
            • Expires: {new Date(results.expiresAt).toLocaleString()}
          </span>
        )}
      </div>

      {message && (
        <div className={`mt-3 text-sm ${
          message.includes('success') ? 'text-green-400' : 'text-red-400'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}

