import { useState, useEffect, useRef } from 'react';
import { Shield, Award, Target, AlertTriangle, Zap, Info, Upload, Share2, Twitter, Linkedin, Link, Download } from 'lucide-react';
import {
    createContext,
} from "@vlayer/sdk/config";
import verifierSpec from "./BugBountyRegistry.json";
import EmailUpload from './EmailUpload';
import { toPng } from 'html-to-image';

// Hardcoded addresses
const VERIFIER_ADDRESS = "0x72d2151418646427b6ae2988725768c2728bec1d";

const BountyExplorer = ({ address }) => {
    const [userStats, setUserStats] = useState(null);
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEmailUploadOpen, setIsEmailUploadOpen] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
    const [currentBadge, setCurrentBadge] = useState(null);
    const [isGeneratingShareCard, setIsGeneratingShareCard] = useState(false);
    const [logoLoaded, setLogoLoaded] = useState(false);
    const shareCardRef = useRef(null);

    // Preload logo image
    useEffect(() => {
        const img = new Image();
        img.src = "/logoo.png";
        img.onload = () => setLogoLoaded(true);
        img.onerror = () => console.error("Failed to load logo");
    }, []);

    const loadBountyData = async (ethClient) => {
        if (!address) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // Get user stats
            const userStats = await ethClient.readContract({
                address: VERIFIER_ADDRESS,
                abi: verifierSpec.abi,
                functionName: "getUserStats",
                args: [address],
            });

            // Get badge details
            const badges = await ethClient.readContract({
                address: VERIFIER_ADDRESS,
                abi: verifierSpec.abi,
                functionName: "getUserBadges",
                args: [address],
            });

            setUserStats(userStats);
            setBadges(badges);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        // Create config object directly with your values
        const config = {
            vlayerEnv: 'testnet',
            chainName: 'sepolia',
            proverUrl: 'https://stable-fake-prover.vlayer.xyz',
            jsonRpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
            testPrivateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
        };
        const { ethClient } = createContext(config);

        // Initial load
        loadBountyData(ethClient);

        // Subscribe to BadgeAwarded events
        const unsubscribe = ethClient.watchContractEvent({
            address: VERIFIER_ADDRESS,
            abi: verifierSpec.abi,
            eventName: 'BadgeAwarded',
            onLogs: (logs) => {
                // Check if the event is for the current user
                const relevantLogs = logs.filter(log =>
                    log.args.user.toLowerCase() === address.toLowerCase()
                );

                if (relevantLogs.length > 0) {
                    // Reload data when a new badge is awarded to the current user
                    loadBountyData(ethClient);
                }
            },
        });

        // Cleanup subscription on component unmount
        return () => {
            unsubscribe();
        };
    }, [address]);

    useEffect(() => {
        // Set the base URL for sharing
        setShareUrl(window.location.origin);
    }, []);

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
                return 'bg-red-100 border-red-300 text-red-800';
            case 'high':
                return 'bg-orange-100 border-orange-300 text-orange-800';
            case 'medium':
                return 'bg-yellow-100 border-yellow-300 text-yellow-800';
            case 'low':
                return 'bg-blue-100 border-blue-300 text-blue-800';
            default:
                return 'bg-gray-100 border-gray-300 text-gray-800';
        }
    };

    const getShareText = (badge) => {
        return `I earned a ${badge.severity} severity bug bounty badge on ${badge.platform}! Check out my achievement on Bounties.`;
    };

    const generateShareCard = async (badge) => {
        if (!logoLoaded) {
            alert("Please wait for resources to load");
            return null;
        }

        setCurrentBadge(badge);
        setIsGeneratingShareCard(true);
        try {
            // Find the badge card element
            const badgeCard = document.querySelector(`[data-badge-id="${badge.tokenId}"]`);
            if (!badgeCard) {
                throw new Error('Badge card not found');
            }

            // Temporarily show full submission ID
            const submissionIdElement = badgeCard.querySelector('[data-submission-id]');
            const originalText = submissionIdElement.textContent;
            submissionIdElement.textContent = `Submission ID: #${badge.submissionId.toString()}`;

            // Generate PNG using html-to-image
            const dataUrl = await toPng(badgeCard, {
                backgroundColor: null,
                pixelRatio: 2,
                style: {
                    transform: 'scale(1)',
                    transformOrigin: 'top left'
                }
            });

            // Restore original text
            submissionIdElement.textContent = originalText;

            return dataUrl;
        } catch (error) {
            console.error('Error generating share card:', error);
            return null;
        } finally {
            setIsGeneratingShareCard(false);
        }
    };

    const downloadShareCard = async (badge) => {
        if (isGeneratingShareCard) return;

        setIsGeneratingShareCard(true);
        const imageUrl = await generateShareCard(badge);

        if (imageUrl) {
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = `bounty-badge-${badge.tokenId}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        setIsGeneratingShareCard(false);
    };

    const shareToTwitter = async (badge) => {
        if (isGeneratingShareCard) return;

        setIsGeneratingShareCard(true);
        const imageUrl = await generateShareCard(badge);
        if (imageUrl) {
            const text = getShareText(badge);
            const shareUrl = `${window.location.origin}/explorer?address=${address}`;
            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
            window.open(twitterUrl, '_blank');
        }
        setIsGeneratingShareCard(false);
    };

    const shareToLinkedIn = (badge) => {
        const text = getShareText(badge);
        const url = `${shareUrl}/explorer?address=${address}`;
        const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}`;
        window.open(linkedInUrl, '_blank');
    };

    const copyShareLink = (badge) => {
        const url = `${shareUrl}/explorer?address=${address}`;
        navigator.clipboard.writeText(url);
        // You could add a toast notification here
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-24 bg-gray-200 rounded"></div>
                            ))}
                        </div>
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-20 bg-gray-200 rounded"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-red-50 border border-red-300 rounded-lg p-6">
                    <h2 className="text-red-800 font-semibold mb-2">Error Loading Bounty Data</h2>
                    <p className="text-red-600">{error}</p>
                </div>
            </div>
        );
    }

    if (!userStats || !badges) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-6">
                    <h2 className="text-yellow-800 font-semibold mb-2">No Data Found</h2>
                    <p className="text-yellow-600">No bounty data found for this address.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
            {/* Loading overlay for PNG generation */}
            {isGeneratingShareCard && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl">
                        <div className="flex items-center gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5e2f15]"></div>
                            <p className="text-lg font-medium">Generating your badge...</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#5e2f15] to-[#964f23] text-white p-4 sm:p-6 rounded-t-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                                <Shield className="w-6 h-6" />
                                Bug Bounty Explorer
                            </h1>
                            <p className="text-blue-100 mt-2 text-sm sm:text-base">
                                User: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not Connected'}
                            </p>
                        </div>
                        <button
                            onClick={() => setIsEmailUploadOpen(true)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#eeaa2a] text-black rounded-lg transition-colors hover:bg-[#d49b25] w-full sm:w-auto"
                        >
                            <Upload className="w-5 h-5" />
                            <span>Upload Email</span>
                        </button>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="p-4 sm:p-6 border-b">
                    <h2 className="text-lg sm:text-xl font-semibold mb-4">Stats Overview</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white border border-[#964f23] rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm font-medium">Total Merits</p>
                                    <p className="text-xl sm:text-2xl font-bold text-[#5e2f15]">
                                        {userStats[0].toString()}
                                    </p>
                                </div>
                                <Award className="w-8 h-8 text-[#eeaa2a]" />
                            </div>
                        </div>

                        <div className="bg-white border border-[#964f23] rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm font-medium">Total Badges</p>
                                    <p className="text-xl sm:text-2xl font-bold text-[#5e2f15]">
                                        {userStats[1].toString()}
                                    </p>
                                </div>
                                <Shield className="w-8 h-8 text-[#eeaa2a]" />
                            </div>
                        </div>

                        <div className="bg-white border border-[#964f23] rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm font-medium">Critical Finds</p>
                                    <p className="text-xl sm:text-2xl font-bold text-[#5e2f15]">
                                        {userStats[2].toString()}
                                    </p>
                                </div>
                                <AlertTriangle className="w-8 h-8 text-[#eeaa2a]" />
                            </div>
                        </div>
                    </div>

                    {/* Severity Breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                        <div className="flex items-center gap-2 p-2 bg-red-50 rounded">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span>Critical: {userStats[2].toString()}</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-orange-50 rounded">
                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                            <span>High: {userStats[3].toString()}</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            <span>Medium: {userStats[4].toString()}</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span>Low: {userStats[5].toString()}</span>
                        </div>
                    </div>
                </div>

                {/* Badges */}
                <div className="p-4 sm:p-6">
                    <h2 className="text-lg sm:text-xl font-semibold mb-4">Bug Bounty Badges</h2>
                    {badges.length === 0 ? (
                        <div className="text-center py-8 space-y-4">
                            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400 opacity-50" />
                            <p className="text-gray-600 text-base sm:text-lg">No badges found for this user yet. Keep hunting for bugs!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {badges.map((badge, index) => (
                                <div
                                    key={badge.tokenId.toString()}
                                    data-badge-id={badge.tokenId.toString()}
                                    className={`border-2 rounded-lg p-4 transition-all hover:shadow-md ${getSeverityColor(badge.severity)}`}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div className="flex items-start sm:items-center gap-3">
                                            {getSeverityIcon(badge.severity)}
                                            <div>
                                                <h3 className="font-semibold text-base sm:text-lg">
                                                    {badge.platform}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm opacity-80 mt-1">
                                                    <span>Token ID: #{badge.tokenId.toString()}</span>
                                                    <span className="group relative inline-block">
                                                        <span className="cursor-help" data-submission-id>Submission ID: #{badge.submissionId.toString().slice(0, 4)}...</span>
                                                        <div className="absolute left-0 -top-2 -translate-y-full px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                                                            Submission ID: #{badge.submissionId.toString()}
                                                            <div className="absolute left-4 -bottom-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                                                        </div>
                                                    </span>
                                                    <span>Merits: {badge.merits.toString()}</span>
                                                    <span className="group relative inline-block">
                                                        <span className="cursor-help">Date: {new Date(Number(badge.timestamp) * 1000).toLocaleDateString()}</span>
                                                        <div className="absolute left-0 -top-2 -translate-y-full px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                                                            {new Date(Number(badge.timestamp) * 1000).toLocaleString()}
                                                            <div className="absolute left-4 -bottom-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                                                        </div>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Full information for image generation (hidden in UI) */}
                                        <div className="hidden" data-full-info>
                                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm opacity-80 mt-1">
                                                <span>Token ID: #{badge.tokenId.toString()}</span>
                                                <span>Submission ID: #{badge.submissionId.toString()}</span>
                                                <span>Merits: {badge.merits.toString()}</span>
                                                <span>Date: {new Date(Number(badge.timestamp) * 1000).toLocaleString()}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getSeverityColor(badge.severity)}`}>
                                                {badge.severity}
                                            </span>
                                            {badge.verified && (
                                                <div className="flex items-center gap-1 text-green-600">
                                                    <Shield className="w-4 h-4" />
                                                    <span className="text-xs sm:text-sm font-medium">Verified</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Share Buttons */}
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Share this badge:</span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => downloadShareCard(badge)}
                                                    className="p-2 text-[#eeaa2a] hover:bg-[#eeaa2a]/10 rounded-full transition-colors"
                                                    title="Download Badge Card"
                                                    disabled={isGeneratingShareCard}
                                                >
                                                    <Download className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => shareToTwitter(badge)}
                                                    className="p-2 text-[#1DA1F2] hover:bg-[#1DA1F2]/10 rounded-full transition-colors"
                                                    title="Share on Twitter"
                                                    disabled={isGeneratingShareCard}
                                                >
                                                    <Twitter className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => shareToLinkedIn(badge)}
                                                    className="p-2 text-[#0077B5] hover:bg-[#0077B5]/10 rounded-full transition-colors"
                                                    title="Share on LinkedIn"
                                                    disabled={isGeneratingShareCard}
                                                >
                                                    <Linkedin className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Contract Info */}
                <div className="bg-gray-50 p-4 text-xs sm:text-sm text-gray-600">
                    <p>Contract: {VERIFIER_ADDRESS}</p>
                </div>
            </div>

            {/* Email Upload Popup */}
            <EmailUpload
                address={address}
                isOpen={isEmailUploadOpen}
                onClose={() => setIsEmailUploadOpen(false)}
            />

            {/* Share card template - positioned offscreen */}
            <div
                ref={shareCardRef}
                className="fixed top-0 left-0 -z-50 opacity-0 w-[600px] h-[400px] pointer-events-none"
            >
                <div className="w-full h-full bg-[#5e2f15] p-8 rounded-xl text-white">
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <img
                                    src="/logoo.png"
                                    alt="Bounties Logo"
                                    className="h-12 w-auto"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.parentNode.innerHTML = "BOUNTIES";
                                    }}
                                />
                                <span className="text-2xl font-bold">BOUNTIES</span>
                            </div>
                            <div className="text-sm opacity-80">
                                #{currentBadge?.tokenId.toString()}
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col justify-center items-center text-center">
                            <div className="mb-6">
                                {currentBadge && getSeverityIcon(currentBadge.severity)}
                            </div>
                            <h2 className="text-3xl font-bold mb-2">{currentBadge?.platform}</h2>
                            <p className="text-xl mb-4">{currentBadge?.severity} Severity Badge</p>
                            <div className="flex items-center gap-2 text-[#eeaa2a]">
                                <Award className="w-6 h-6" />
                                <span className="text-2xl font-bold">{currentBadge?.merits.toString()} Merits</span>
                            </div>
                        </div>

                        <div className="mt-6 text-sm opacity-80">
                            <div className="flex items-center justify-between">
                                <span>Verified by Bounties</span>
                                <span>{currentBadge && new Date(Number(currentBadge.timestamp) * 1000).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BountyExplorer;
