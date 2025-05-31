import React, { useState } from 'react';
import { ethers } from 'ethers';
import { Shield, Award, Target, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingPage = ({ onConnect }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleExplore = async () => {
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
        navigate('/explorer');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error connecting to MetaMask:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Proof of Hack
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Show off your bug bounty wins—just with your emails. Sounds intriguing, right?
          </p>
          <button
            onClick={handleExplore}
            disabled={isConnecting}
            className="bg-[#eeaa2a] hover:bg-[#d49b25] text-black font-bold py-4 px-8 rounded-full text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto shadow-md"
          >
            {isConnecting ? 'Connecting...' : 'Explore'}
            {!isConnecting && <ArrowRight className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-8 text-gray-900 border border-blue-100 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]">
            <Shield className="w-12 h-12 text-blue-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Showcase your skills</h3>
            <p className="text-gray-600">Flex your skills with your minted badges.</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl p-8 text-gray-900 border border-amber-100 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]">
            <Award className="w-12 h-12 text-amber-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Earn Rewards</h3>
            <p className="text-gray-600">Get rewarded for your contributions with our tokenized bounty system.</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-8 text-gray-900 border border-purple-100 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]">
            <Target className="w-12 h-12 text-purple-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Verify your bounties</h3>
            <p className="text-gray-600">Verify your findings thro our email zkp partner vlayer.</p>
          </div>
        </div>
      </div>

      {/* Showcase Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="relative group">
            <img 
              src="/hacker.png" 
              alt="Hacker" 
              className="w-full h-[300px] object-cover rounded-2xl shadow-md transform transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
              <p className="text-white text-lg font-medium">Join our community of security researchers</p>
            </div>
          </div>
          <div className="relative group">
            <img 
              src="/ThreeCoolMen.png" 
              alt="Team" 
              className="w-full h-[300px] object-cover rounded-2xl shadow-md transform transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
              <p className="text-white text-lg font-medium">Collaborate with top security experts</p>
            </div>
          </div>
          <div className="relative group">
            <img 
              src="/coinpick.png" 
              alt="Rewards" 
              className="w-full h-[300px] object-cover rounded-2xl shadow-md transform transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
              <p className="text-white text-lg font-medium">Earn rewards for your findings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 mt-16 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-[#eeaa2a] transition-colors">About Us</a></li>
                <li><a href="#" className="text-gray-600 hover:text-[#eeaa2a] transition-colors">How It Works</a></li>
                <li><a href="#" className="text-gray-600 hover:text-[#eeaa2a] transition-colors">Leaderboard</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Contact</h3>
              <ul className="space-y-2">
                <li className="text-gray-600">Email: contact@bounties.com</li>
                <li className="text-gray-600">Discord: bounties.gg</li>
                <li className="text-gray-600">Twitter: @bounties</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Newsletter</h3>
              <p className="text-gray-600 mb-4">Stay updated with our latest bounties and rewards.</p>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="bg-white text-gray-900 placeholder-gray-400 px-4 py-2 rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-[#eeaa2a] border border-gray-200"
                />
                <button className="bg-[#eeaa2a] text-black px-4 py-2 rounded-lg hover:bg-[#d49b25] transition-colors shadow-sm">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-700 px-6 py-3 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
};

export default LandingPage; 