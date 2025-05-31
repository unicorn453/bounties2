import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';

const Navbar = ({ connectedAddress, onConnect }) => {
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [error, setError] = React.useState('');

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      setError('');

      if (!window.ethereum) {
        throw new Error('Please install MetaMask to use this feature');
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length > 0) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        onConnect(address, provider);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error connecting to MetaMask:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <nav className="w-full bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer"
            onClick={() => navigate('/')}
          >
            <img src="/logoo.png" alt="Bounties Logo" className="h-10 w-auto mr-2" />
            <span className="text-2xl font-bold text-gray-900 uppercase">BOUNTIES</span>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center">
            {connectedAddress ? (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/explorer')}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Explorer
                </button>
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">
                    {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
                  </span>
                </div>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="bg-[rgba(255,159.93,87.23,0.94)] px-4 py-2 rounded-2xl text-black text-sm font-medium hover:bg-[rgba(255,159.93,87.23,0.8)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm">
            {error}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 