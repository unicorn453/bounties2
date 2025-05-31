import { useState, useEffect } from 'react';
import { initializeConfig, VERIFIER_ADDRESS, CONTRACT_ABI } from '../utils/config';

export const useBugBounty = (address) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [badges, setBadges] = useState([]);
  const [contractStats, setContractStats] = useState(null);

  const { ethClient } = initializeConfig();

  useEffect(() => {
    if (!ethClient) {
      setError('Failed to initialize Ethereum client. Please check your environment variables.');
      return;
    }

    const fetchData = async () => {
      if (!address) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const [stats, badgeData] = await Promise.all([
          fetchUserStats(address),
          fetchUserBadges(address)
        ]);
        
        setUserStats(stats);
        setBadges(badgeData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [address, ethClient]);

  const fetchUserStats = async (userAddress) => {
    if (!ethClient) throw new Error('Ethereum client not initialized');
    
    try {
      const stats = await ethClient.readContract({
        address: VERIFIER_ADDRESS,
        abi: CONTRACT_ABI.abi,
        functionName: "getUserStats",
        args: [userAddress],
      });

      return {
        totalMerits: stats[0].toString(),
        badgeCount: stats[1].toString(),
        criticalBadges: stats[2].toString(),
        highBadges: stats[3].toString(),
        mediumBadges: stats[4].toString(),
        lowBadges: stats[5].toString(),
      };
    } catch (err) {
      console.error("Error fetching user stats:", err);
      throw err;
    }
  };

  const fetchUserBadges = async (userAddress) => {
    if (!ethClient) throw new Error('Ethereum client not initialized');
    
    try {
      const badgeData = await ethClient.readContract({
        address: VERIFIER_ADDRESS,
        abi: CONTRACT_ABI.abi,
        functionName: "getUserBadges",
        args: [userAddress],
      });

      return badgeData.map(badge => ({
        platform: badge.platform,
        severity: badge.severity,
        merits: badge.merits.toString(),
        submissionId: badge.submissionId,
        timestamp: new Date(Number(badge.timestamp) * 1000),
        verified: badge.verified,
      }));
    } catch (err) {
      console.error("Error fetching user badges:", err);
      throw err;
    }
  };

  const fetchContractStats = async () => {
    try {
      const totalSubmissions = await ethClient.readContract({
        address: VERIFIER_ADDRESS,
        abi: CONTRACT_ABI.abi,
        functionName: "totalSubmissions",
        args: [],
      });

      return {
        totalSubmissions: totalSubmissions.toString(),
        contractAddress: VERIFIER_ADDRESS,
      };
    } catch (err) {
      console.error("Error fetching contract stats:", err);
      throw err;
    }
  };

  const verifySubmissionId = async (submissionId) => {
    try {
      const isUsed = await ethClient.readContract({
        address: VERIFIER_ADDRESS,
        abi: CONTRACT_ABI.abi,
        functionName: "usedSubmissionIds",
        args: [submissionId],
      });

      return isUsed;
    } catch (err) {
      console.error("Error verifying submission ID:", err);
      throw err;
    }
  };

  const calculateMerits = async (severity) => {
    try {
      const merits = await ethClient.readContract({
        address: VERIFIER_ADDRESS,
        abi: CONTRACT_ABI.abi,
        functionName: "calculateMerits",
        args: [severity],
      });

      return merits.toString();
    } catch (err) {
      console.error("Error calculating merits:", err);
      throw err;
    }
  };

  return {
    loading,
    error,
    userStats,
    badges,
    contractStats,
    verifySubmissionId,
    calculateMerits,
  };
};

export default useBugBounty; 