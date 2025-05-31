import React, { useState } from 'react';
import BlockchainExplorer from './BlockchainExplorer';
import BugBountyLeaderboard from './BountyLeaderboard';
import BountyGlobal from './BountyGlobal';
import { Globe, Shield, History, Trophy } from 'lucide-react';
import { useTransactionPopup } from "@blockscout/app-sdk";

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
          {/* Mobile Transaction Buttons */}
          <div className="md:hidden flex space-x-2 py-4">
            <button
              onClick={showAddressTransactions}
              className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#eeaa2a]"
            >
              <History className="h-4 w-4 mr-2 text-gray-500" />
              My Transactions
            </button>
            <button
              onClick={showAllTransactions}
              className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#eeaa2a] hover:bg-[#d49b25] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#eeaa2a]"
            >
              <Globe className="h-4 w-4 mr-2" />
              All Transactions
            </button>
          </div>

          {/* Navigation Container */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            {/* Tabs */}
            <div className="flex flex-col md:flex-row md:space-x-8 space-y-2 md:space-y-0">
              <button
                onClick={() => setActiveTab('blockchain')}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center justify-center md:justify-start ${
                  activeTab === 'blockchain'
                    ? 'border-[#eeaa2a] text-[#eeaa2a]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Shield className="h-4 w-4 mr-2" />
                Blockchain Explorer
              </button>
              <button
                onClick={() => setActiveTab('global')}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center justify-center md:justify-start ${
                  activeTab === 'global'
                    ? 'border-[#eeaa2a] text-[#eeaa2a]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Globe className="h-4 w-4 mr-2" />
                Global Explorer
              </button>
              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center justify-center md:justify-start ${
                  activeTab === 'leaderboard'
                    ? 'border-[#eeaa2a] text-[#eeaa2a]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Trophy className="h-4 w-4 mr-2" />
                Leaderboard
              </button>
            </div>

            {/* Desktop Transaction Buttons */}
            <div className="hidden md:flex space-x-4">
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
          <BountyGlobal />
        ) : (
          <BugBountyLeaderboard />
        )}
      </div>
    </div>
  );
};

export default Explorer; 