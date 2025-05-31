import React, { useState } from 'react';
import MetaMaskLogin from './components/MetaMaskLogin';
import TransactionHistory from './components/TransactionHistory';
import BugBountyDashboard from './components/BugBountyDashboard';
import TransactionComponent from './components/TransactionComponent';
import LandingPage from './components/LandingPage';
import ExternalExplorer from './components/ExternalExplorer';
import BountyExplorer from './components/BlockchainExplorer';
import EmailParser from './components/EmailUpload';

function App() {
  const [connectedAddress, setConnectedAddress] = useState('');
  const [provider, setProvider] = useState(null);
  const [activeTab, setActiveTab] = useState('self-explorer');
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-cyan-400">
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
            <div className="border-b border-gray-800">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('self-explorer')}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === 'self-explorer'
                      ? 'border-cyan-500 text-cyan-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                    }
                  `}
                >
                  Self Explorer
                </button>
                <button
                  onClick={() => setActiveTab('external-explorer')}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === 'external-explorer'
                      ? 'border-purple-500 text-purple-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                    }
                  `}
                >
                  External Explorer
                </button>
              </nav>
            </div>
            {/* Content */}
            <div className="bg-black/30 backdrop-blur-md shadow-lg rounded-lg p-6 border border-gray-800">
              {activeTab === 'transactions' ? (
                <>
                  <h2 className="text-lg font-medium text-cyan-400 mb-4">
                    Your Transactions
                  </h2>
                  <TransactionComponent />
                  <TransactionHistory 
                    address={connectedAddress}
                  />
                </>
              ) : activeTab === 'bounties' ? (
                <BugBountyDashboard address={connectedAddress} />
              ) : activeTab === 'self-explorer' ? (
                <BountyExplorer address={connectedAddress} />
              ) : activeTab === 'external-explorer' ? (
                <ExternalExplorer />
              ) : (
                <EmailParser address={connectedAddress} />
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-medium text-cyan-400 mb-4">
              Welcome to Blockchain Explorer
            </h2>
            <p className="text-gray-400">
              Connect your MetaMask wallet to view your transaction history and bug bounties
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-black/50 backdrop-blur-md border-t border-gray-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-gray-400 text-sm">
            Powered by Ethers.js and VLayer SDK
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
