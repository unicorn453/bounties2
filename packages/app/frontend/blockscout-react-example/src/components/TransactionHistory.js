import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ethers } from 'ethers';

const TransactionHistory = ({ address, provider }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!address || !provider) return;

      try {
        setLoading(true);
        setError('');
        
        // Get the current block number
        const currentBlock = await provider.getBlockNumber();
        const blockHistory = 100;
        const startBlock = Math.max(0, currentBlock - blockHistory);
        
        // Fetch blocks in parallel
        const blocks = await Promise.all(
          Array.from({ length: blockHistory }, (_, i) => {
            const blockNumber = startBlock + i;
            return provider.getBlock(blockNumber, true);
          })
        );

        // Filter transactions for our address
        const addressLower = address.toLowerCase();
        const relevantTxs = blocks
          .filter(Boolean) // Remove null blocks
          .flatMap(block => 
            (block.transactions || [])
              .filter(tx => 
                tx.from?.toLowerCase() === addressLower || 
                tx.to?.toLowerCase() === addressLower
              )
          );

        // Get transaction receipts and format transactions
        const formattedTransactions = await Promise.all(
          relevantTxs.map(async (tx) => {
            const receipt = await provider.getTransactionReceipt(tx.hash);
            const block = await provider.getBlock(tx.blockNumber);
            
            return {
              hash: tx.hash,
              from: tx.from,
              to: tx.to,
              value: ethers.formatEther(tx.value),
              timestamp: new Date(block.timestamp * 1000), // Convert Unix timestamp to JS Date
              status: receipt?.status === 1 ? 'success' : 'failed'
            };
          })
        );

        setTransactions(formattedTransactions);
      } catch (err) {
        setError('Failed to fetch transactions');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [address, provider]);

  const formatValue = (value) => {
    return parseFloat(value).toFixed(4);
  };

  const getTransactionType = (tx) => {
    if (tx.from.toLowerCase() === address.toLowerCase()) {
      return 'Sent';
    }
    return 'Received';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto shadow-lg rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Hash
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Value
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((tx) => (
            <tr key={tx.hash} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${getTransactionType(tx) === 'Sent' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {getTransactionType(tx)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {tx.hash.slice(0, 8)}...{tx.hash.slice(-6)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {formatValue(tx.value)} ETH
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">
                  {format(tx.timestamp, 'MMM d, yyyy HH:mm')}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${tx.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {tx.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {transactions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No transactions found
        </div>
      )}
    </div>
  );
};

export default TransactionHistory; 