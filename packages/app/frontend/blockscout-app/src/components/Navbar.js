import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { LogOut, Menu, X } from 'lucide-react';

const Navbar = ({ connectedAddress, onConnect }) => {
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [balance, setBalance] = React.useState('');

  const fetchBalance = async (address) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(address);
      setBalance(ethers.formatEther(balance));
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };

  React.useEffect(() => {
    if (connectedAddress) {
      fetchBalance(connectedAddress);
      // Set up balance update interval
      const interval = setInterval(() => fetchBalance(connectedAddress), 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [connectedAddress]);

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

  const handleLogout = () => {
    localStorage.removeItem('connectedAddress');
    onConnect('', null);
    setBalance('');
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="w-full bg-gradient-to-r from-[#5e2f15] to-[#964f23] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer"
            onClick={() => navigate('/')}
          >
            <img src="/logoo.png" alt="Bounties Logo" className="h-10 w-auto mr-2" />
            <span className="text-2xl font-bold text-white uppercase">BOUNTIES</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center">
            {connectedAddress ? (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/explorer')}
                  className="text-white hover:text-[#eeaa2a] px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Explorer
                </button>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-white">
                    {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
                  </span>
                  {balance && (
                    <span className="text-sm font-medium text-[#eeaa2a] ml-2">
                      {parseFloat(balance).toFixed(4)} ETH
                    </span>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                  title="Disconnect Wallet"
                >
                  <LogOut className="w-5 h-5 text-white" />
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="bg-[#eeaa2a] px-4 py-2 rounded-full text-black text-sm font-medium hover:bg-[#d49b25] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="p-2 text-white hover:text-[#eeaa2a] transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#5e2f15] border-t border-white/10">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {connectedAddress ? (
              <>
                <button
                  onClick={() => {
                    navigate('/explorer');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left text-white hover:text-[#eeaa2a] px-3 py-2 rounded-md text-base font-medium transition-colors"
                >
                  Explorer
                </button>
                <div className="px-3 py-2">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-white">
                      {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
                    </span>
                    {balance && (
                      <span className="text-sm font-medium text-[#eeaa2a] ml-2">
                        {parseFloat(balance).toFixed(4)} ETH
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left text-white hover:text-[#eeaa2a] px-3 py-2 rounded-md text-base font-medium transition-colors"
                >
                  Disconnect Wallet
                </button>
              </>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="w-full bg-[#eeaa2a] px-4 py-2 rounded-md text-black text-base font-medium hover:bg-[#d49b25] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </div>
        </div>
      )}

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