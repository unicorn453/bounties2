import React, { useState } from 'react';
import { format } from 'date-fns';
import useBugBounty from '../hooks/useBugBounty';

const BugBountyDashboard = ({ address }) => {
  const [submissionIdToVerify, setSubmissionIdToVerify] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  
  const {
    loading,
    error,
    userStats,
    badges,
    contractStats,
    verifySubmissionId,
  } = useBugBounty(address);

  const handleVerifySubmission = async () => {
    if (!submissionIdToVerify) return;
    
    try {
      const isValid = await verifySubmissionId(submissionIdToVerify);
      setVerificationResult({
        isValid,
        message: isValid ? 'Submission ID is valid and has been used' : 'Submission ID not found',
      });
    } catch (err) {
      setVerificationResult({
        isValid: false,
        message: 'Error verifying submission ID',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Contract Stats */}
      {contractStats && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Contract Statistics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Total Submissions</p>
              <p className="text-lg font-medium text-gray-900">{contractStats.totalSubmissions}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Contract Address</p>
              <p className="text-sm font-medium text-gray-900 break-all">{contractStats.contractAddress}</p>
            </div>
          </div>
        </div>
      )}

      {/* User Stats */}
      {userStats && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Total Merits</p>
              <p className="text-lg font-medium text-gray-900">{userStats.totalMerits}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Total Badges</p>
              <p className="text-lg font-medium text-gray-900">{userStats.badgeCount}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Critical Badges</p>
              <p className="text-lg font-medium text-primary-600">{userStats.criticalBadges}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">High Badges</p>
              <p className="text-lg font-medium text-orange-600">{userStats.highBadges}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Medium Badges</p>
              <p className="text-lg font-medium text-yellow-600">{userStats.mediumBadges}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Low Badges</p>
              <p className="text-lg font-medium text-green-600">{userStats.lowBadges}</p>
            </div>
          </div>
        </div>
      )}

      {/* Submission Verification */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Verify Submission</h2>
        <div className="flex space-x-4">
          <input
            type="text"
            value={submissionIdToVerify}
            onChange={(e) => setSubmissionIdToVerify(e.target.value)}
            placeholder="Enter submission ID"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={handleVerifySubmission}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Verify
          </button>
        </div>
        {verificationResult && (
          <div className={`mt-4 p-4 rounded-lg ${verificationResult.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {verificationResult.message}
          </div>
        )}
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <h2 className="text-xl font-semibold text-gray-900 p-6 pb-4">Your Badges</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Merits</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submission ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {badges.map((badge, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{badge.platform}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${badge.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                          badge.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                          badge.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'}`}>
                        {badge.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{badge.merits}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{badge.submissionId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(badge.timestamp, 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${badge.verified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {badge.verified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BugBountyDashboard; 