'use client';

import React from 'react';
import Image from 'next/image';
import { CivicReport } from '@/app/auth/dashboard/citizen/civic-report/page';
import { LuThumbsUp, LuThumbsDown } from 'react-icons/lu';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface ReportCardProps {
  report: CivicReport;
  handleVote: (reportId: string, type: 'support' | 'oppose') => Promise<void>;
  votingStates: Record<string, boolean>;
}

const ReportCard: React.FC<ReportCardProps> = ({
  report,
  handleVote,
  votingStates,
}) => {
  const isVotingDisabled =
    report.hasVoted || votingStates[report.id] || !report.canVote;

  const getStatusColor = (status: CivicReport['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'escalated':
      case 'resolved':
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: CivicReport['status']) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'escalated':
        return 'Escalated';
      case 'resolved':
        return 'Resolved';
      default:
        return 'Unknown';
    }
  };

  const statusColor = getStatusColor(report.status);
  const statusText = getStatusText(report.status);
  const timeAgo = formatDistanceToNow(parseISO(report.createdAt), { addSuffix: true });

  return (
    <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden border border-gray-700">
      {report.imageUrl && (
        <div className="relative w-full h-48">
          <Image
            src={report.imageUrl}
            alt={report.title}
            fill // Replaced layout="fill"
            style={{ objectFit: 'cover' }} // Replaced objectFit="cover"
            // ✅ FIX: Added responsive sizes to match container width
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="rounded-t-xl"
          />
        </div>
      )}
      <div className="p-5 space-y-4">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-bold text-white leading-tight">
            {report.title}
          </h3>
          <span className={`px-3 py-1 text-xs font-semibold rounded-full text-white ${statusColor}`}>
            {statusText}
          </span>
        </div>
        <p className="text-gray-400 text-sm">{report.description}</p>
        <div className="flex justify-between items-center text-gray-500 text-xs font-mono">
          {report.createdBy && (
            <span className="text-gray-400 text-xs font-semibold">
              by {report.createdBy.name}
            </span>
          )}
          <span>{timeAgo}</span>
        </div>
        <div className="flex items-center space-x-4 text-sm font-semibold">
          <span className="flex items-center text-green-400">
            <LuThumbsUp className="mr-1" /> {report.supportCount} Supports
          </span>
          <span className="flex items-center text-red-400">
            <LuThumbsDown className="mr-1" /> {report.oppositionCount} Oppositions
          </span>
        </div>

        {report.resolvedImageUrl && (
          <div>
            <p className="text-xs text-gray-400 mb-1">Resolution photo:</p>
            <div className="relative w-full h-44 rounded-lg overflow-hidden border border-green-700">
              <Image
                src={report.resolvedImageUrl}
                alt={report.title + ' resolved'}
                fill // Replaced layout="fill"
                style={{ objectFit: 'cover' }} // Replaced objectFit="cover"
                // ✅ FIX: Added responsive sizes to match container width
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
            {report.resolvedNotes && (
              <p className="text-xs text-green-300 italic mt-2">Notes: {report.resolvedNotes}</p>
            )}
          </div>
        )}
        
        {report.isOwnReport ? (
          <div className="text-center py-2 bg-gray-800 rounded">
            <p className="text-gray-600 italic text-sm">📝 This is your report</p>
          </div>
        ) : report.hasVoted ? (
          <div className="text-center py-2 bg-gray-800 rounded">
            <p className="text-gray-600 italic text-sm">
              ✅ You {report.userVote === 'support' ? 'supported' : 'opposed'} this report
            </p>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => handleVote(report.id, 'support')}
              disabled={isVotingDisabled}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white py-2 px-3 rounded text-sm font-medium transition-colors"
            >
              👍 Support
            </button>
            <button
              onClick={() => handleVote(report.id, 'oppose')}
              disabled={isVotingDisabled}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-500 text-white py-2 px-3 rounded text-sm font-medium transition-colors"
            >
              👎 Oppose
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportCard;
