import React, { useState, useEffect } from 'react';
import BlockchainExplorer from './BlockchainExplorer';
import BugBountyLeaderboard from './BountyLeaderboard';
import { Search, Globe, Shield, History, Loader2, Trophy } from 'lucide-react';
import { useTransactionPopup } from "@blockscout/app-sdk";
import { ethers } from 'ethers';

// ABI for the NFT contract - you'll need to replace this with your actual contract ABI
const NFT_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)"
];

const GlobalExplorer = ({ provider }) => {
  const [badges, setBadges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchBadges = async () => {
      if (!provider) return;
      
      try {
        setIsLoading(true);
        setError(null);

        // Replace with your actual contract address
        const contractAddress = "0x123..."; // Your NFT contract address
        const contract = new ethers.Contract(contractAddress, NFT_ABI, provider);

        // Get all transfer events to find all minted badges
        const filter = contract.filters.Transfer(null, null);
        const events = await contract.queryFilter(filter);

        // Process events to get unique token IDs
        const uniqueTokenIds = [...new Set(events.map(event => event.args.tokenId.toString()))];

        // Fetch details for each badge
        const badgesData = await Promise.all(
          uniqueTokenIds.map(async (tokenId) => {
            try {
              const owner = await contract.ownerOf(tokenId);
              const tokenURI = await contract.tokenURI(tokenId);
              
              // If tokenURI is a URL, fetch the metadata
              let metadata = {};
              if (tokenURI.startsWith('http')) {
                const response = await fetch(tokenURI);
                metadata = await response.json();
              } else if (tokenURI.startsWith('ipfs://')) {
                // Handle IPFS URLs if needed
                const ipfsUrl = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
                const response = await fetch(ipfsUrl);
                metadata = await response.json();
              }

              return {
                id: tokenId,
                owner,
                metadata,
                tokenURI
              };
            } catch (err) {
              console.error(`Error fetching badge ${tokenId}:`, err);
              return null;
            }
          })
        );

        setBadges(badgesData.filter(badge => badge !== null));
      } catch (err) {
        console.error('Error fetching badges:', err);
        setError('Failed to fetch badges. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBadges();
  }, [provider]);

  const filteredBadges = badges.filter(badge => 
    badge.metadata.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    badge.metadata.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">All Minted Badges</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search badges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#eeaa2a]"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-[#eeaa2a] animate-spin" />
          <span className="ml-2 text-gray-600">Loading badges...</span>
        </div>
      ) : error ? (
        <div className="text-red-600 text-center py-12">{error}</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredBadges.map((badge) => (
            <div key={badge.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              {badge.metadata.image && (
                <img 
                  src={badge.metadata.image} 
                  alt={badge.metadata.name || `Badge #${badge.id}`}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {badge.metadata.name || `Badge #${badge.id}`}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    {badge.metadata.description || 'No description available'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  Owner: {badge.owner.slice(0, 6)}...{badge.owner.slice(-4)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Explorer = ({ address, provider }) => {
  const [activeTab, setActiveTab] = useState('blockchain');
  const { openPopup } = useTransactionPopup();

  const showAddressTransactions = () => {
    openPopup({
      chainId: "1", // Ethereum mainnet
      address: address,
    });
  };

  const showAllTransactions = () => {
    openPopup({
      chainId: "1", // Ethereum mainnet
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('blockchain')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'blockchain'
                    ? 'border-[#eeaa2a] text-[#eeaa2a]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Blockchain Explorer
              </button>
              <button
                onClick={() => setActiveTab('global')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'global'
                    ? 'border-[#eeaa2a] text-[#eeaa2a]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Global Explorer
              </button>
              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'leaderboard'
                    ? 'border-[#eeaa2a] text-[#eeaa2a]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Trophy className="h-4 w-4 inline-block mr-2" />
                Leaderboard
              </button>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={showAddressTransactions}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#eeaa2a]"
              >
                <History className="h-4 w-4 mr-2 text-gray-500" />
                My Transactions
              </button>
              <button
                onClick={showAllTransactions}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#eeaa2a] hover:bg-[#d49b25] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#eeaa2a]"
              >
                <Globe className="h-4 w-4 mr-2" />
                All Transactions
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'blockchain' ? (
          <BlockchainExplorer address={address} provider={provider} />
        ) : activeTab === 'global' ? (
          <GlobalExplorer provider={provider} />
        ) : (
          <BugBountyLeaderboard />
        )}
      </div>
    </div>
  );
};

export default Explorer; 