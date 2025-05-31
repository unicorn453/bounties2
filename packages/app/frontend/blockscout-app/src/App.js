import React, { useState } from 'react';
import { NotificationProvider } from "@blockscout/app-sdk";
import MetaMaskLogin from './components/MetaMaskLogin';
import BountyExplorer from './components/BlockchainExplorer';

function App() {
  const [connectedAddress, setConnectedAddress] = useState('');
  const [provider, setProvider] = useState(null);

  const handleConnect = (address, ethProvider) => {
    setConnectedAddress(address);
    setProvider(ethProvider);
  };

  return (
    <NotificationProvider>
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
              {/* Content */}
              <div className="bg-white shadow rounded-lg p-6">
                <BountyExplorer address={connectedAddress} />
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-xl font-medium text-gray-900 mb-4">
                Welcome to Blockchain Explorer
              </h2>
              <p className="text-gray-500">
                Connect your MetaMask wallet to view the blockchain explorer
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
    </NotificationProvider>
  );
}

export default App;
