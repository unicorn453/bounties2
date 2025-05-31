import React, { useState } from 'react';
import BlockchainExplorer from './BlockchainExplorer';
import { Search, Globe, Shield, History } from 'lucide-react';
import { useTransactionPopup } from "@blockscout/app-sdk";

const GlobalExplorer = () => {
  // Dummy data for the Global Explorer
  const dummyBounties = [
    {
      id: 1,
      title: "Critical Security Vulnerability",
      reward: "5 ETH",
      status: "Open",
      difficulty: "High",
      category: "Smart Contract",
      submissions: 12
    },
    {
      id: 2,
      title: "Frontend UI Bug",
      reward: "1 ETH",
      status: "Open",
      difficulty: "Medium",
      category: "Frontend",
      submissions: 5
    },
    {
      id: 3,
      title: "Backend API Issue",
      reward: "2 ETH",
      status: "Open",
      difficulty: "Medium",
      category: "Backend",
      submissions: 8
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Global Bounties</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search bounties..."
            className="w-full px-4 py-2 pl-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#eeaa2a]"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      <div className="grid gap-6">
        {dummyBounties.map((bounty) => (
          <div key={bounty.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{bounty.title}</h3>
                <p className="text-gray-600 mt-1">Category: {bounty.category}</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-[#eeaa2a]/10 text-[#eeaa2a]">
                  {bounty.reward}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                {bounty.difficulty}
              </span>
              <span>•</span>
              <span>{bounty.submissions} submissions</span>
            </div>
          </div>
        ))}
      </div>
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
        ) : (
          <GlobalExplorer />
        )}
      </div>
    </div>
  );
};

export default Explorer; 