import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const MetaMaskLogin = ({ onConnect }) => {
  const [account, setAccount] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('Please install MetaMask to use this feature');
      return;
    }

    try {
      setIsConnecting(true);
      setError('');
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        onConnect(accounts[0], provider);
      }
    } catch (err) {
      setError('Failed to connect to MetaMask');
      console.error(err);
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        try {
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            setAccount(accounts[0].address);
            onConnect(accounts[0].address, provider);
          }
        } catch (err) {
          console.error('Error checking connection:', err);
        }
      }
    };

    checkConnection();
  }, [onConnect]);

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-4">
      {!account ? (
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className={`
            flex items-center justify-center px-6 py-3 
            bg-primary-600 text-white rounded-lg
            hover:bg-primary-700 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
            font-medium text-lg
          `}
        >
          {isConnecting ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
            </span>
          ) : (
            'Connect MetaMask'
          )}
        </button>
      ) : (
        <div className="flex flex-col items-center space-y-2">
          <div className="px-4 py-2 bg-primary-100 rounded-lg text-primary-800">
            Connected: {account.slice(0, 6)}...{account.slice(-4)}
          </div>
        </div>
      )}
      
      {error && (
        <div className="text-red-600 bg-red-100 px-4 py-2 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
};

export default MetaMaskLogin; 