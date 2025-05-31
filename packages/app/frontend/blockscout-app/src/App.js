import React, { useState } from 'react';
import MetaMaskLogin from './components/MetaMaskLogin';
import TransactionHistory from './components/TransactionHistory';
import BugBountyDashboard from './components/BugBountyDashboard';
import TransactionComponent from './components/TransactionComponent';
import LandingPage from './components/LandingPage';

function App() {
  const [connectedAddress, setConnectedAddress] = useState('');
  const [provider, setProvider] = useState(null);
  const [activeTab, setActiveTab] = useState('transactions');
  const [showLandingPage, setShowLandingPage] = useState(true);

  const handleConnect = (address, ethProvider) => {
    setConnectedAddress(address);
    setProvider(ethProvider);
    setShowLandingPage(false);
  };

  if (showLandingPage) {
    return <LandingPage onConnect={handleConnect} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Blockchain Explorer
            </h1>
            <MetaMaskLogin onConnect={handleConnect} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {connectedAddress ? (
          <div className="space-y-8">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('transactions')}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === 'transactions'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  Transactions
                </button>
                <button
                  onClick={() => setActiveTab('bounties')}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === 'bounties'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  Bug Bounties
                </button>
              </nav>
            </div>

            {/* Content */}
            <div className="bg-white shadow rounded-lg p-6">
              {activeTab === 'transactions' ? (
                <>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Your Transactions
                  </h2>
                  {/* Transaction History Tab */}
                  <TransactionComponent />
                  <TransactionHistory 
                    address={connectedAddress}
                  />
                </>
              ) : (
                // Bug Bounties Tab
                <BugBountyDashboard address={connectedAddress} />
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-medium text-gray-900 mb-4">
              Welcome to Blockchain Explorer
            </h2>
            <p className="text-gray-500">
              Connect your MetaMask wallet to view your transaction history and bug bounties
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-gray-500 text-sm">
            Powered by Ethers.js and VLayer SDK
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
