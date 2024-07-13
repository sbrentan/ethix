import React, { useState, useEffect } from 'react';
import Web3 from 'web3';

import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../utils/constants';

export const TransactionContext = React.createContext();

const { ethereum } = window;

export const TransactionsProvider = ({ children }) => {

    const web3 = new Web3(ethereum);

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentAccount, setCurrentAccount] = useState(null);
    const [campaigns, setCampaigns] = useState(new Set());
    const [formData, setformData] = useState({
        title: '',
        description: '',
        deadline: Math.floor(Date.now() / 1000) + 60,
        amount: 0,
        tokens: 0,
        beneficiary: ''
    });

    const transactionsContract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

    const handleChange = (e, name) => {
        switch (name) {
            case 'deadline':
                setformData((prevState) => ({ ...prevState, [name]: Math.floor(new Date(e.target.value).getTime() / 1000) }));
                break;
            default:
                setformData((prevState) => ({ ...prevState, [name]: e.target.value }));
                break;
        }
    };

    const connectWallet = async () => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");

            await ethereum.request({ method: "eth_requestAccounts" })
            .then(async (accounts) => {
                console.log(accounts)
                setCurrentAccount(accounts[0]);
                setIsLoggedIn(true);
            });

            window.location.reload();
        } catch (error) {
            console.error(error);
        }
    };
    
    const checkIfWalletIsConnect = async () => {  
        try {

            if (!ethereum) return alert("Please install MetaMask.");

            await ethereum.request({ method: "eth_accounts" })
            .then(async (accounts) => {
                if (accounts.length > 0) {
                    setCurrentAccount(accounts[0]);
                    setIsLoggedIn(true);
                } else {
                    console.log("No accounts found");
                }
            });

        } catch (error) {
            console.error(error);
        }
    };

    const verifyOrganization = async (organizationId) => {
        try {

            if(!ethereum) return alert("Please install MetaMask.");

            transactionsContract.events.OrganizationVerified()
            .on("data", (event) => {
                console.log(`Organization [${event.returnValues.organization}] - verification status: [${event.returnValues.status}]`);
            })

            await transactionsContract.methods.verifyOrganization(organizationId).send({ from: currentAccount });

        } catch (error) {
            console.error(error);
        }
    };

    const isOrganizationVerified = async (organizationId) => {
        try {
            if(!ethereum) return alert("Please install MetaMask.");

            await transactionsContract.methods.isOrganizationVerified(organizationId).call({ from: currentAccount })
            .then((status) => {
                console.log(`Is organization verified: ${status}`);
            });
            
        } catch (error) {
            console.error(error);
        }
    }

    const revokeOrganization = async (organizationId) => {
        try {

            if(!ethereum) return alert("Please install MetaMask.");

            transactionsContract.events.OrganizationRevoked()
            .on("data", (event) => {
                console.log(`Organization [${event.returnValues.organization}] - verification status: [${event.returnValues.status}]`);
            })

            await transactionsContract.methods.revokeOrganization(organizationId).send({ from: currentAccount });

        } catch (error) {
            console.error(error);
        }
    };

    const startCampaign = async () => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");

            transactionsContract.events.CampaignStarted()
            .on("data", (event) => {
                console.log(`Campaign [${event.returnValues.campaignId}] started from [${event.returnValues.donor}]`);
                setCampaigns(new Set([...campaigns, event.returnValues.campaignId]));
            })

            const { title, description, deadline, amount, tokens, beneficiary } = formData;

            const txConfig = {
                from: currentAccount,
                value: web3.utils.toWei(amount, 'ether')
            }

            await transactionsContract.methods.startCampaign(
                title,
                description,
                deadline,
                tokens,
                beneficiary
            ).send(txConfig);

        } catch (error) {
            console.error("Beneficiary not verified or campaign already started");
        }
    };

    const getCampaignsIds = async () => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");

            await transactionsContract.methods.getCampaignsIds().call({ from: currentAccount })
            .then((campaignsIds) => {
                console.log(campaignsIds);
            });

        } catch (error) {
            console.error(error);
        }
    };

    const getCampaign = async (campaignId) => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");

            await transactionsContract.methods.getCampaign(campaignId).call({ from: currentAccount })
            .then((campaign) => {
                console.log(campaign);
            });

        } catch (error) {
            console.error(error);
        }
    };

    const getCampaignTokens = async (campaignId) => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");

            await transactionsContract.methods.getCampaignTokens(campaignId).call({ from: currentAccount })
            .then((tokens) => {
                console.log(tokens);
            });

        } catch (error) {
            console.error(error);
        }
    }

    const claimRefund = async (campaignId) => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");

            transactionsContract.events.RefundClaimed()
            .on("data", (event) => {
                console.log(`Campaign [${event.returnValues.campaignId}]: refund of [${web3.utils.fromWei(event.returnValues.amount)} ETH] claimed by [${event.returnValues.donor}]`);
            })

            await transactionsContract.methods.claimRefund(campaignId).send({ from: currentAccount });

        } catch (error) {
            console.error(error);
        }
    };

    const claimDonation = async (campaignId) => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");

            transactionsContract.events.DonationClaimed()
            .on("data", (event) => {
                console.log(`Campaign [${event.returnValues.campaignId}]: donation of [${web3.utils.fromWei(event.returnValues.amount)} ETH] claimed by [${event.returnValues.beneficiary}]`);
            })

            await transactionsContract.methods.claimDonation(campaignId).send({ from: currentAccount });

        } catch (error) {
            console.error(error);
        }
    };

    // POST - /reedemToken
    // body { campaignId, tokenId }
    
    const reedemToken = async (campaignId, tokenId) => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");

            transactionsContract.events.TokenRedeemed()
            .on("data", (event) => {
                console.log(`Campaign [${event.returnValues.campaignId}]: token [${event.returnValues.tokenId}] redeemed`);
            })

            await transactionsContract.methods.redeemToken(campaignId, tokenId).send({ from: currentAccount });

        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        if (!currentAccount) checkIfWalletIsConnect();

        ethereum.on('accountsChanged', function (accounts) {
            checkIfWalletIsConnect();
        })
    }, [currentAccount]);
    
    return (
        <TransactionContext.Provider value={{
            connectWallet,
            isLoggedIn, 
            currentAccount,
            verifyOrganization,
            isOrganizationVerified,
            revokeOrganization,
            formData,
            handleChange,
            startCampaign,
            campaigns,
            getCampaign,
            getCampaignsIds,
            getCampaignTokens,
            claimRefund,
            claimDonation,
            reedemToken
        }}>
            {children}  
        </TransactionContext.Provider>
    );
};