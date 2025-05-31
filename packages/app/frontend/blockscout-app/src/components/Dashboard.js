import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';

const Dashboard = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [balance, setBalance] = useState('');

  useEffect(() => {
    const checkWalletConnection = async () => {
      const isConnected = localStorage.getItem('walletConnected');
      const address = localStorage.getItem('walletAddress');

      if (!isConnected || !address) {
        window.location.href = '/';
        return;
      }

      setWalletAddress(address);

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const balance = await provider.getBalance(address);
        setBalance(ethers.formatEther(balance));
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    };

    checkWalletConnection();
  }, []);

  const disconnectWallet = () => {
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletAddress');
    window.location.href = '/';
  };

  return (
    <div className="w-full min-h-screen bg-[#D1D1D1] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
          <div className="mb-4">
            <p className="text-gray-600">Connected Wallet:</p>
            <p className="font-mono text-sm break-all">{walletAddress}</p>
          </div>
          <div className="mb-4">
            <p className="text-gray-600">Balance:</p>
            <p className="font-mono text-sm">{balance} ETH</p>
          </div>
          <button
            onClick={disconnectWallet}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            Disconnect Wallet
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
          <p className="text-gray-600">No transactions found</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 