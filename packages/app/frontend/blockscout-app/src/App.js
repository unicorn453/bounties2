import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from "@blockscout/app-sdk";
import { ethers } from 'ethers';
import BountyExplorer from './components/BlockchainExplorer';
import LandingPage from './components/LandingPage';
import Navbar from './components/Navbar';

function App() {
  const [connectedAddress, setConnectedAddress] = useState('');
  const [provider, setProvider] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleConnect = (address, ethProvider) => {
    setConnectedAddress(address);
    setProvider(ethProvider);
    localStorage.setItem('connectedAddress', address);
  };

  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (window.ethereum) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.listAccounts();
          
          if (accounts.length > 0) {
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            setConnectedAddress(address);
            setProvider(provider);
          }
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, []);

  const ProtectedRoute = ({ children }) => {
    if (isLoading) {
      return <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>;
    }
    
    if (!connectedAddress) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  return (
    <NotificationProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar connectedAddress={connectedAddress} onConnect={handleConnect} />
          <Routes>
            <Route path="/" element={<LandingPage onConnect={handleConnect} />} />
            <Route
              path="/explorer"
              element={
                <ProtectedRoute>
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="bg-white shadow rounded-lg p-6">
                      <BountyExplorer address={connectedAddress} provider={provider} />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </NotificationProvider>
  );
}

export default App;