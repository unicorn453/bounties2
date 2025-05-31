import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Shield, TrendingUp, Users, Target, Star } from 'lucide-react';
import {
    createContext,
} from "@vlayer/sdk/config";
import verifierSpec from "./BugBountyRegistry.json";

// Hardcoded addresses
const VERIFIER_ADDRESS = "0x72d2151418646427b6ae2988725768c2728bec1d";

const BugBountyLeaderboard = () => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalUsers, setTotalUsers] = useState(0);
    const [totalSubmissions, setTotalSubmissions] = useState(0);

    const getRankIcon = (rank) => {
        switch (rank) {
            case 1:
                return <Trophy className="w-6 h-6 text-yellow-500" />;
            case 2:
                return <Medal className="w-6 h-6 text-gray-400" />;
            case 3:
                return <Award className="w-6 h-6 text-amber-600" />;
            default:
                return <Shield className="w-5 h-5 text-blue-500" />;
        }
    };

    const getRankBg = (rank) => {
        switch (rank) {
            case 1:
                return "bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200";
            case 2:
                return "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200";
            case 3:
                return "bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200";
            default:
                return "bg-white border-gray-200";
        }
    };

    const loadLeaderboardData = async () => {
        try {
            setLoading(true);
            console.log('Starting to load leaderboard data...');

            // Create config object
            const config = {
                vlayerEnv: 'testnet',
                chainName: 'sepolia',
                proverUrl: 'https://stable-fake-prover.vlayer.xyz',
                jsonRpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
                testPrivateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
            };
            const { ethClient } = createContext(config);
            console.log('Created ethClient');

            // Get total submissions from contract
            console.log('Fetching total submissions...');
            const totalSubs = await ethClient.readContract({
                address: VERIFIER_ADDRESS,
                abi: verifierSpec.abi,
                functionName: "totalSubmissions",
            });
            console.log('Total submissions:', Number(totalSubs));
            setTotalSubmissions(Number(totalSubs));

            // Get all users who have received badges
            console.log('Fetching all users...');
            const allUsers = await ethClient.readContract({
                address: VERIFIER_ADDRESS,
                abi: verifierSpec.abi,
                functionName: "getAllUsers",
            });
            console.log(`Found ${allUsers.length} users`);

            // Fetch stats for each user
            console.log('Fetching user stats...');
            const userStatsPromises = allUsers.map(async (userAddress) => {
                try {
                    const stats = await ethClient.readContract({
                        address: VERIFIER_ADDRESS,
                        abi: verifierSpec.abi,
                        functionName: "getUserStats",
                        args: [userAddress],
                    });

                    return {
                        address: userAddress,
                        totalMerits: Number(stats[0]),
                        badgeCount: Number(stats[1]),
                        criticalCount: Number(stats[2]),
                        highCount: Number(stats[3]),
                        mediumCount: Number(stats[4]),
                        lowCount: Number(stats[5])
                    };
                } catch (err) {
                    console.error(`Error fetching stats for ${userAddress}:`, err);
                    return null;
                }
            });

            const userStats = await Promise.all(userStatsPromises);
            const validStats = userStats.filter(stat => stat !== null);
            console.log(`Successfully fetched stats for ${validStats.length} users`);

            // Sort by total merits (descending)
            const sortedLeaderboard = validStats.sort((a, b) => b.totalMerits - a.totalMerits);
            console.log('Leaderboard sorted and ready');

            setTotalUsers(validStats.length);
            setLeaderboard(sortedLeaderboard);
            setLoading(false);
        } catch (err) {
            console.error('Error loading leaderboard:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLeaderboardData();
    }, []);

    const formatAddress = (address) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto p-6">
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="text-lg font-medium text-gray-600">Loading leaderboard...</span>
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
                        <Target className="w-5 h-5" />
                        <span className="font-medium">Error loading leaderboard</span>
                    </div>
                    <p className="text-red-600 mt-2">{error}</p>
                    <button
                        onClick={loadLeaderboardData}
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
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">Total Hunters</p>
                            <p className="text-3xl font-bold">{totalUsers}</p>
                        </div>
                        <Users className="w-10 h-10 text-blue-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm font-medium">Total Submissions</p>
                            <p className="text-3xl font-bold">{totalSubmissions}</p>
                        </div>
                        <Target className="w-10 h-10 text-green-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm font-medium">Total Merits</p>
                            <p className="text-3xl font-bold">
                                {leaderboard.reduce((sum, user) => sum + user.totalMerits, 0)}
                            </p>
                        </div>
                        <Star className="w-10 h-10 text-purple-200" />
                    </div>
                </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
                    <div className="flex items-center space-x-2">
                        <TrendingUp className="w-6 h-6 text-gray-600" />
                        <h2 className="text-2xl font-bold text-gray-800">Bug Bounty Leaderboard</h2>
                    </div>
                    <p className="text-gray-600 mt-1">Top security researchers ranked by merit points</p>
                </div>

                {leaderboard.length === 0 ? (
                    <div className="p-12 text-center">
                        <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-500 mb-2">No submissions yet</h3>
                        <p className="text-gray-400">Be the first to submit a verified bug bounty!</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {leaderboard.map((user, index) => {
                            const rank = index + 1;
                            return (
                                <div
                                    key={user.address}
                                    className={`p-6 transition-colors hover:bg-gray-50 ${getRankBg(rank)} border-l-4`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="flex items-center space-x-2">
                                                {getRankIcon(rank)}
                                                <span className="text-2xl font-bold text-gray-700">#{rank}</span>
                                            </div>

                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <code className="text-lg font-semibold text-gray-800 bg-gray-100 px-3 py-1 rounded-lg">
                                                        {formatAddress(user.address)}
                                                    </code>
                                                    {rank <= 3 && (
                                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                            TOP {rank}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                                                    <span className="flex items-center space-x-1">
                                                        <Award className="w-4 h-4" />
                                                        <span>{user.badgeCount} badges</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-3xl font-bold text-gray-800">
                                                {user.totalMerits}
                                            </div>
                                            <div className="text-sm text-gray-500">merit points</div>
                                        </div>
                                    </div>

                                    {/* Severity breakdown */}
                                    <div className="mt-4 grid grid-cols-4 gap-3">
                                        {user.criticalCount > 0 && (
                                            <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center">
                                                <div className="text-red-700 font-semibold">{user.criticalCount}</div>
                                                <div className="text-xs text-red-600">Critical</div>
                                            </div>
                                        )}
                                        {user.highCount > 0 && (
                                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 text-center">
                                                <div className="text-orange-700 font-semibold">{user.highCount}</div>
                                                <div className="text-xs text-orange-600">High</div>
                                            </div>
                                        )}
                                        {user.mediumCount > 0 && (
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-center">
                                                <div className="text-yellow-700 font-semibold">{user.mediumCount}</div>
                                                <div className="text-xs text-yellow-600">Medium</div>
                                            </div>
                                        )}
                                        {user.lowCount > 0 && (
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
                                                <div className="text-blue-700 font-semibold">{user.lowCount}</div>
                                                <div className="text-xs text-blue-600">Low</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Refresh Button */}
            <div className="text-center">
                <button
                    onClick={loadLeaderboardData}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center space-x-2 mx-auto"
                >
                    <TrendingUp className="w-5 h-5" />
                    <span>{loading ? 'Refreshing...' : 'Refresh Leaderboard'}</span>
                </button>
            </div>
        </div>
    );
};

export default BugBountyLeaderboard;
