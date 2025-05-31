import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Search, Activity, ArrowUpRight } from 'lucide-react';

const ExternalExplorer = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <motion.div 
      className="backdrop-blur-md bg-white/10 p-6 rounded-2xl border border-purple-500"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-lg mb-4 flex items-center gap-2 text-purple-300">
        <ExternalLink className="text-purple-400" />
        External Blockchain Explorer
      </h2>
      <div className="space-y-4">
        <div className="flex gap-2">
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter address or transaction hash..." 
            className="flex-1 bg-black/50 text-white border border-purple-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Search className="w-4 h-4" /> Search
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-gradient-to-r from-purple-900/50 to-black border border-purple-400 rounded-lg p-4">
            <h3 className="text-purple-300 font-semibold mb-2">Network Status</h3>
            <div className="flex items-center gap-2 text-green-400">
              <Activity className="w-4 h-4" />
              <span>Connected to Sepolia Testnet</span>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-900/50 to-black border border-purple-400 rounded-lg p-4">
            <h3 className="text-purple-300 font-semibold mb-2">Recent Blocks</h3>
            <div className="text-sm text-gray-400">
              Latest Block: #4,123,456
            </div>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-purple-300 font-semibold mb-2">Recent Transactions</h3>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="bg-black/30 p-3 rounded-lg border border-purple-500/30 hover:border-purple-500 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-mono">0x8392...989</span>
                  <span className="text-xs text-purple-400">2 mins ago</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  From: 0x1234...5678 → To: 0x8765...4321
                </div>
                <div className="mt-2 flex justify-end">
                  <button className="text-purple-400 hover:text-purple-300 text-xs flex items-center gap-1">
                    View Details <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ExternalExplorer; 