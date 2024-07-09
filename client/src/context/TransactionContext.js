import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../utils/constants';

export const TransactionContext = React.createContext();

const { ethereum } = window;

const createEthereumContract = () => {
    const provider = new ethers.getDefaultProvider(ethereum);
    const signer = provider.getSigner();
    const transactionsContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  
    return transactionsContract;
};

export const TransactionsProvider = ({ children }) => {
    const [currentAccount, setCurrentAccount] = useState(null);

    const connectWallet = async () => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");

            const accounts = await ethereum.request({ method: "eth_requestAccounts", });

            setCurrentAccount(accounts[0]);
            window.location.reload();

        } catch (error) {
            console.error(error);
            throw new Error("No ethereum object");
        }
    };

    const checkIfWalletIsConnect = async () => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");

            const accounts = await ethereum.request({ method: "eth_accounts" });

            accounts.length ? setCurrentAccount(accounts[0]) : console.log("No accounts found");

        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        checkIfWalletIsConnect();
      }, []);
    
    return (
        <TransactionContext.Provider value={{connectWallet, currentAccount}}>
            {children}  
        </TransactionContext.Provider>
    );
};