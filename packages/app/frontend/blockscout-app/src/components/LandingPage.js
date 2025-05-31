import React, { useState } from 'react';
import { ethers } from 'ethers';

const LandingPage = ({ onConnect }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      setError('');

      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to use this feature');
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length > 0) {
        // Create Web3Provider instance
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        // Get the signer
        const signer = await provider.getSigner();
        
        // Get the address
        const address = await signer.getAddress();
        
        // Call the onConnect callback with the address and provider
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
    <div className="w-full min-h-screen bg-[#D1D1D1] relative overflow-x-hidden">
      {/* Header */}
      <div className="w-full max-w-[90%] mx-auto mt-4 bg-white shadow-md rounded-full flex justify-center items-center">
        <div className="w-full px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Logo" className="w-12 h-10" />
            <div className="text-black text-xl font-bold">
              Bounty
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-black text-base font-medium hover:text-gray-600">
              Sign up
            </button>
            <button className="text-black text-base font-medium hover:text-gray-600">
              Login
            </button>
            <button 
              onClick={connectWallet}
              disabled={isConnecting}
              className="bg-[rgba(255,159.93,87.23,0.94)] px-4 py-2 rounded-2xl text-black text-base font-medium hover:bg-[rgba(255,159.93,87.23,0.8)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting ? 'Connecting...' : 'Connect wallet'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="w-full max-w-[90%] mx-auto mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Main Content */}
      <div className="w-full max-w-[90%] mx-auto mt-8 bg-[#F0F0F0] border border-[rgba(0,0,0,0.2)] rounded-lg p-8">
        <div className="flex flex-col items-center text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-black mb-4 max-w-2xl">
            Join The Bug Bounty Revolution!
          </h1>
          <p className="text-lg md:text-xl font-bold text-black max-w-2xl">
            Discover and report bugs, earn rewards, and climb the <strong>leader board</strong>!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-items-center">
          <img src="/hacker.png" alt="Feature 1" className="w-full max-w-[280px] h-auto rounded-lg shadow-md" />
          <img src="/ThreeCoolMen.png" alt="Feature 2" className="w-full max-w-[280px] h-auto rounded-lg shadow-md" />
          <img src="/coinpick.png" alt="Feature 3" className="w-full max-w-[280px] h-auto rounded-lg shadow-md" />
        </div>
      </div>

      {/* Footer */}
      <div className="w-full bg-[#010101] mt-8 py-8">
        <div className="max-w-[90%] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-white">
            <h3 className="text-2xl font-bold mb-4">Links</h3>
            <p className="text-base font-medium mb-2 cursor-pointer hover:text-gray-300">Login</p>
            <p className="text-base font-medium mb-2 cursor-pointer hover:text-gray-300">Sign Up</p>
          </div>

          <div className="text-white">
            <h3 className="text-2xl font-bold mb-4">Contact Us</h3>
            <p className="text-base font-medium mb-2">Email: example@gmail.com</p>
            <p className="text-base font-medium mb-2">Phone: +1 232 123 3452</p>
          </div>

          <div className="text-white">
            <h3 className="text-2xl font-bold mb-4">Follow Us</h3>
            <div className="w-8 h-8 mt-2">
              <div className="w-6 h-6 border-4 border-white rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 