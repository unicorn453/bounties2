import React, { useState } from 'react';
import Web3 from 'web3';
import { useNotification, useTransactionPopup } from '@blockscout/app-sdk';

const web3 = new Web3("https://sepolia.infura.io/v3/bbe29cb8dce84004a84a58b6d20d2034");

function TransactionComponent() {
  const { openTxToast } = useNotification();  // Hook for toasts
  const { openPopup } = useTransactionPopup();  // Hook for transaction history popup
  const [address, setAddress] = useState('');

  // Function to send a sample transaction (replace with real tx logic)
  const sendTransaction = async () => {
    try {
      const accounts = await web3.eth.getAccounts();
      const txHash = await web3.eth.sendTransaction({
        from: accounts[0],
        to: '0xRecipientAddress', // Replace with actual recipient address
        value: web3.utils.toWei("0.1", "ether"), // Sending 0.1 ETH
      });

      // Display the transaction toast
      openTxToast("11155111", txHash.transactionHash);  // '11155111' is the Sepolia chain ID
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  };

  // Function to view transaction history for a specific address
  const viewHistory = () => {
    openPopup({
      chainId: "11155111",  // Sepolia Testnet chain ID
      address: address,     // Address entered by the user
    });
  };

  return (
    <div>
      <h1>Blockscout SDK - React Example</h1>
      
      {/* Input to get address */}
      <div>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter address to view transaction history"
        />
        <button onClick={viewHistory}>View Transaction History</button>
      </div>

      {/* Send Transaction */}
      <div>
        <button onClick={sendTransaction}>Send 0.1 ETH</button>
      </div>
    </div>
  );
}

export default TransactionComponent;
