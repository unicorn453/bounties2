import React, { useState, useEffect } from 'react';
import { useNotification, useTransactionPopup } from '@blockscout/app-sdk';
import Web3 from 'web3';

const web3 = new Web3("https://sepolia.infura.io/v3/bbe29cb8dce84004a84a58b6d20d2034");

const TransactionHistory = ({ address }) => {
  const { openTxToast } = useNotification();
  const { openPopup } = useTransactionPopup();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (address) {
      viewHistory();
    }
  }, [address]);

  const viewHistory = () => {
    try {
      openPopup({
        chainId: "11155111",  // Sepolia Testnet chain ID
        address: address,     // Address from props
      });
    } catch (error) {
      console.error("Failed to open transaction history:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <button
        onClick={viewHistory}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Refresh Transaction History
      </button>
    </div>
  );
};

export default TransactionHistory;
