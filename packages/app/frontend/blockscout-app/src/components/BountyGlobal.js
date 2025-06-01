import { useState, useEffect } from 'react';
import { Eye, Shield, Clock, ExternalLink, Award, AlertTriangle, Target, Zap, Info, RefreshCw, Activity, Globe, Search } from 'lucide-react';
import {
    createContext,
} from "@vlayer/sdk/config";
import verifierSpec from "./BugBountyRegistry.json";

// Hardcoded addresses
const VERIFIER_ADDRESS = "0x72d2151418646427b6ae2988725768c2728bec1d";

const BountyGlobal = () => {
    const [globalStats, setGlobalStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submissionId, setSubmissionId] = useState('');
    const [verificationResult, setVerificationResult] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [recentBadges, setRecentBadges] = useState([]);

    const getSeverityIcon = (severity) => {
        switch (severity.toLowerCase()) {
            case 'critical':
                return <AlertTriangle className="w-5 h-5 text-red-500" />;
            case 'high':
                return <Zap className="w-5 h-5 text-orange-500" />;
            case 'medium':
                return <Target className="w-5 h-5 text-yellow-500" />;
            case 'low':
                return <Info className="w-5 h-5 text-blue-500" />;
            default:
                return <Shield className="w-5 h-5 text-gray-500" />;
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity.toLowerCase()) {
            case 'critical':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'high':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getPlatformColor = (platform) => {
        switch (platform.toLowerCase()) {
            case 'hackerone':
                return 'bg-[#eeaa2a] text-[#5e2f15]';
            case 'bugcrowd':
                return 'bg-[#964f23] text-white';
            case 'immunefi':
                return 'bg-[#5e2f15] text-white';
            case 'intigriti':
                return 'bg-[#d49b25] text-[#5e2f15]';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatAddress = (address) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(Number(timestamp) * 1000);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) {
            return `${diffInSeconds}s ago`;
        } else if (diffInSeconds < 3600) {
            return `${Math.floor(diffInSeconds / 60)}m ago`;
        } else if (diffInSeconds < 86400) {
            return `${Math.floor(diffInSeconds / 3600)}h ago`;
        } else {
            return `${Math.floor(diffInSeconds / 86400)}d ago`;
        }
    };

    const loadGlobalData = async () => {
        try {
            setLoading(true);

            // Create config object
            const config = {
                vlayerEnv: 'testnet',
                chainName: 'sepolia',
                proverUrl: 'https://stable-fake-prover.vlayer.xyz',
                jsonRpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
                testPrivateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
            };
            const { ethClient } = createContext(config);

            // Get all users from contract
            const allUsers = await ethClient.readContract({
                address: VERIFIER_ADDRESS,
                abi: verifierSpec.abi,
                functionName: "getAllUsers",
            });

            // Get total submissions from contract
            const totalSubs = await ethClient.readContract({
                address: VERIFIER_ADDRESS,
                abi: verifierSpec.abi,
                functionName: "totalSubmissions",
            });

            // Get all badges from all users
            const allBadgesPromises = allUsers.map(async (userAddress) => {
                try {
                    const userBadges = await ethClient.readContract({
                        address: VERIFIER_ADDRESS,
                        abi: verifierSpec.abi,
                        functionName: "getUserBadges",
                        args: [userAddress],
                    });

                    // Convert badges to our format
                    return userBadges.map(badge => ({
                        user: userAddress,
                        platform: badge.platform,
                        severity: badge.severity,
                        merits: Number(badge.merits),
                        submissionId: badge.submissionId,
                        tokenId: Number(badge.tokenId),
                        timestamp: badge.timestamp,
                        verified: badge.verified
                    }));
                } catch (err) {
                    console.error(`Error fetching badges for user ${userAddress}:`, err);
                    return [];
                }
            });

            const allUserBadges = await Promise.all(allBadgesPromises);

            // Flatten all badges and sort by tokenId (descending for most recent)
            const allBadges = allUserBadges
                .flat()
                .sort((a, b) => b.tokenId - a.tokenId);

            // Get last 10 badges
            const recentBadges = allBadges.slice(0, 10);

            // Calculate global stats
            const totalMerits = allBadges.reduce((sum, badge) => sum + badge.merits, 0);

            setGlobalStats({
                totalSubmissions: Number(totalSubs),
                totalHunters: allUsers.length,
                totalMerits: totalMerits
            });

            setRecentBadges(recentBadges);
            setLoading(false);
        } catch (err) {
            console.error('Error loading global data:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    const verifySubmission = async () => {
        if (!submissionId) return;

        setIsVerifying(true);
        setVerificationResult(null);
        try {
            const config = {
                vlayerEnv: 'testnet',
                chainName: 'sepolia',
                proverUrl: 'https://stable-fake-prover.vlayer.xyz',
                jsonRpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
                testPrivateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
            };
            const { ethClient } = createContext(config);

            console.log('Checking submission ID:', submissionId);

            // Check if the submission ID exists using the same mechanism
            const isUsed = await ethClient.readContract({
                address: VERIFIER_ADDRESS,
                abi: verifierSpec.abi,
                functionName: "usedSubmissionIds",
                args: [submissionId],
            });

            if (isUsed) {
                console.log("✅ Submission ID is VALID and has been used");
                console.log("   This bounty has been successfully claimed on-chain");

                // Get submission details since it's valid
                try {
                    const submissionDetails = await ethClient.readContract({
                        address: VERIFIER_ADDRESS,
                        abi: verifierSpec.abi,
                        functionName: "getSubmissionDetails",
                        args: [submissionId],
                    });

                    setVerificationResult({
                        isValid: true,
                        platform: submissionDetails[0],
                        severity: submissionDetails[1],
                        merits: submissionDetails[2].toString(),
                        timestamp: new Date(Number(submissionDetails[3]) * 1000).toLocaleString(),
                        verified: submissionDetails[4]
                    });
                } catch (detailsError) {
                    console.error('Error getting submission details:', detailsError);
                    setVerificationResult({
                        isValid: true,
                        message: "Submission ID is valid and has been claimed on-chain, but details could not be retrieved."
                    });
                }
            } else {
                console.log("❌ Submission ID is NOT FOUND");
                console.log("   This bounty has not been claimed or doesn't exist");

                setVerificationResult({
                    isValid: false,
                    error: "Submission ID not found - This bounty has not been claimed or doesn't exist"
                });
            }
        } catch (error) {
            console.error('Verification error:', error);
            setVerificationResult({
                isValid: false,
                error: `Error checking submission: ${error.message}`
            });
        } finally {
            setIsVerifying(false);
        }
    };

    useEffect(() => {
        loadGlobalData();
    }, []);

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#5e2f15] to-[#964f23] text-white p-4 sm:p-6 rounded-t-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                                <Shield className="w-6 h-6" />
                                Global Bounty Stats
                            </h1>
                            <p className="text-blue-100 mt-2 text-sm sm:text-base">
                                Track global bug bounty statistics and verify submissions
                            </p>
                        </div>
                        <button
                            onClick={loadGlobalData}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#eeaa2a] text-black rounded-lg transition-colors hover:bg-[#d49b25] w-full sm:w-auto"
                            disabled={loading}
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>

                {/* Submission Verification */}
                <div className="p-4 sm:p-6 border-b">
                    <h2 className="text-lg sm:text-xl font-semibold mb-4">Verify Submission</h2>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                value={submissionId}
                                onChange={(e) => setSubmissionId(e.target.value)}
                                placeholder="Enter submission ID"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5e2f15] focus:border-transparent"
                            />
                        </div>
                        <button
                            onClick={verifySubmission}
                            disabled={isVerifying || !submissionId}
                            className="flex items-center justify-center gap-2 px-6 py-2 bg-[#5e2f15] text-white rounded-lg transition-colors hover:bg-[#964f23] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Search className={`w-5 h-5 ${isVerifying ? 'animate-spin' : ''}`} />
                            <span>Verify</span>
                        </button>
                    </div>

                    {verificationResult && (
                        <div className={`mt-4 p-4 rounded-lg ${!verificationResult.isValid ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                            {!verificationResult.isValid ? (
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-red-500" />
                                    <p className="text-red-600">{verificationResult.error}</p>
                                </div>
                            ) : verificationResult.message ? (
                                <div className="flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-green-500" />
                                    <p className="text-green-600">{verificationResult.message}</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Shield className="w-5 h-5 text-green-500" />
                                        <span className="font-semibold text-green-700">✅ Submission ID is VALID and has been claimed on-chain</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">Platform:</span>
                                        <span className={`px-2 py-1 rounded-full text-sm ${getPlatformColor(verificationResult.platform)}`}>
                                            {verificationResult.platform}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">Severity:</span>
                                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-sm ${getSeverityColor(verificationResult.severity)}`}>
                                            {getSeverityIcon(verificationResult.severity)}
                                            <span>{verificationResult.severity}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">Merits:</span>
                                        <span className="font-bold text-lg">{verificationResult.merits}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">Date:</span>
                                        <span>{verificationResult.timestamp}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">Verified:</span>
                                        <span className={`px-2 py-1 rounded-full text-sm ${verificationResult.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {verificationResult.verified ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Recent Activity */}
                <div className="p-4 sm:p-6 border-t">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            Recent Activity
                        </h2>
                    </div>
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5e2f15] mx-auto"></div>
                            <p className="mt-2 text-gray-600">Loading recent activity...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8">
                            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
                            <p className="mt-2 text-red-600">{error}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {recentBadges.map((badge, index) => (
                                <div key={badge.tokenId} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                        <div className="flex items-start space-x-3 sm:space-x-4">
                                            <div className="flex-shrink-0">
                                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#5e2f15] rounded-lg flex items-center justify-center text-white font-bold text-base sm:text-lg">
                                                    #{badge.tokenId}
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getPlatformColor(badge.platform)}`}>
                                                        {badge.platform}
                                                    </span>
                                                    <div className={`flex items-center space-x-1 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${getSeverityColor(badge.severity)}`}>
                                                        {getSeverityIcon(badge.severity)}
                                                        <span>{badge.severity}</span>
                                                    </div>
                                                    {badge.verified && (
                                                        <span className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                                                            Verified
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-2">
                                                    <div className="flex items-center space-x-1">
                                                        <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                                                        <span>Hunter: </span>
                                                        <code className="bg-gray-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs font-mono">
                                                            {formatAddress(badge.user)}
                                                        </code>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                                                        <span>{formatTimestamp(badge.timestamp)}</span>
                                                    </div>
                                                </div>

                                                <div className="text-xs text-gray-500 font-mono break-all">
                                                    Submission ID: {badge.submissionId.length > 50
                                                        ? `${badge.submissionId.slice(0, 50)}...`
                                                        : badge.submissionId
                                                    }
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end gap-4">
                                            <div className="text-right">
                                                <div className="text-xl sm:text-2xl font-bold text-gray-800">
                                                    {badge.merits}
                                                </div>
                                                <div className="text-xs sm:text-sm text-gray-500">merits</div>
                                            </div>

                                            <a
                                                href={`https://sepolia.etherscan.io/address/${badge.user}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                                title="View Hunter Profile on Etherscan"
                                            >
                                                <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                                            </a>
                                        </div>
                                    </div>

                                    {/* Progress bar showing relative merit value */}
                                    <div className="mt-3 sm:mt-4">
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>Merit Score</span>
                                            <span>{badge.merits}/100</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                                            <div
                                                className="bg-gradient-to-r from-[#5e2f15] to-[#eeaa2a] h-1.5 sm:h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${Math.min(badge.merits, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BountyGlobal;
