import { useState, useEffect } from 'react';
import { Eye, Shield, Clock, ExternalLink, Award, AlertTriangle, Target, Zap, Info, RefreshCw, Activity, Globe } from 'lucide-react';
import {
    createContext,
} from "@vlayer/sdk/config";
import verifierSpec from "./BugBountyRegistry.json";

// Hardcoded addresses
const VERIFIER_ADDRESS = "0x72d2151418646427b6ae2988725768c2728bec1d";

const BugBountyGlobalExplorer = () => {
    const [recentBadges, setRecentBadges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [globalStats, setGlobalStats] = useState({
        totalSubmissions: 0,
        totalHunters: 0,
        totalMerits: 0
    });

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
                return 'bg-purple-100 text-purple-800';
            case 'bugcrowd':
                return 'bg-green-100 text-green-800';
            case 'immunefi':
                return 'bg-blue-100 text-blue-800';
            case 'intigriti':
                return 'bg-indigo-100 text-indigo-800';
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

            setRecentBadges(recentBadges);
            setGlobalStats({
                totalSubmissions: Number(totalSubs),
                totalHunters: allUsers.length,
                totalMerits: totalMerits
            });

            setLoading(false);
        } catch (err) {
            console.error('Error loading global data:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        loadGlobalData();
    }, []);

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto p-6">
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="text-lg font-medium text-gray-600">Loading global activity...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-6xl mx-auto p-6">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <div className="flex items-center space-x-2 text-red-700">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-medium">Error loading global data</span>
                    </div>
                    <p className="text-red-600 mt-2">{error}</p>
                    <button
                        onClick={loadGlobalData}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <div className="flex items-center justify-center space-x-2">
                    <Globe className="w-8 h-8 text-blue-600" />
                    <h1 className="text-3xl font-bold text-gray-800">Global Bug Bounty Explorer</h1>
                </div>
                <p className="text-gray-600">Real-time view of the latest verified bug bounty submissions</p>
            </div>

            {/* Global Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">Total Hunters</p>
                            <p className="text-3xl font-bold">{globalStats.totalHunters}</p>
                        </div>
                        <Shield className="w-10 h-10 text-blue-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm font-medium">Total Submissions</p>
                            <p className="text-3xl font-bold">{globalStats.totalSubmissions}</p>
                        </div>
                        <Award className="w-10 h-10 text-green-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm font-medium">Total Merits</p>
                            <p className="text-3xl font-bold">{globalStats.totalMerits}</p>
                        </div>
                        <Target className="w-10 h-10 text-purple-200" />
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Activity className="w-6 h-6 text-gray-600" />
                        <h2 className="text-2xl font-bold text-gray-800">Latest Bug Bounty Badges</h2>
                    </div>
                    <button
                        onClick={loadGlobalData}
                        disabled={loading}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </button>
                </div>

                {recentBadges.length === 0 ? (
                    <div className="p-12 text-center">
                        <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-500 mb-2">No badges found</h3>
                        <p className="text-gray-400">No bug bounty submissions have been verified yet.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {recentBadges.map((badge, index) => (
                            <div key={badge.tokenId} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-4">
                                        <div className="flex-shrink-0">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                                                #{badge.tokenId}
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPlatformColor(badge.platform)}`}>
                                                    {badge.platform}
                                                </span>
                                                <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(badge.severity)}`}>
                                                    {getSeverityIcon(badge.severity)}
                                                    <span>{badge.severity}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                                                <div className="flex items-center space-x-1">
                                                    <Shield className="w-4 h-4" />
                                                    <span>Hunter: </span>
                                                    <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                                                        {formatAddress(badge.user)}
                                                    </code>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <Clock className="w-4 h-4" />
                                                    <span>{formatTimestamp(badge.timestamp)}</span>
                                                </div>
                                            </div>

                                            <div className="text-xs text-gray-500 font-mono">
                                                Submission ID: {badge.submissionId.length > 50
                                                    ? `${badge.submissionId.slice(0, 50)}...`
                                                    : badge.submissionId
                                                }
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-4">
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-gray-800">
                                                {badge.merits}
                                            </div>
                                            <div className="text-sm text-gray-500">merits</div>
                                        </div>

                                        <a
                                            href={`https://sepolia.etherscan.io/address/${badge.user}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                            title="View Hunter Profile on Etherscan"
                                        >
                                            <ExternalLink className="w-5 h-5" />
                                        </a>
                                    </div>
                                </div>

                                {/* Progress bar showing relative merit value */}
                                <div className="mt-4">
                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                        <span>Merit Score</span>
                                        <span>{badge.merits}/100</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${Math.min(badge.merits, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Live indicator */}
            <div className="text-center">
                <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-green-700">Live data from Sepolia testnet</span>
                </div>
            </div>
        </div>
    );
};

export default BugBountyGlobalExplorer;
