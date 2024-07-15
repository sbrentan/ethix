import React, { useState, useEffect } from 'react';
import Web3 from 'web3';

import { CHARITY_CONTRACT_ABI, CHARITY_CONTRACT_ADDRESS } from '../utils/constants';

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

    const charityContract = new web3.eth.Contract(CHARITY_CONTRACT_ABI, CHARITY_CONTRACT_ADDRESS);

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
            console.error(error.message || error.data.message || error);
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
            console.error(error.message || error.data.message || error);
        }
    };

    const verifyOrganization = async (organizationId) => {
        try {

            if(!ethereum) return alert("Please install MetaMask.");

            charityContract.events.OrganizationVerified()
            .on("data", (event) => {
                console.log(`Organization [${event.returnValues.organization}] - verification status: [${event.returnValues.status}]`);
            })

            await charityContract.methods.verifyOrganization(organizationId).send({ from: currentAccount });

        } catch (error) {
            console.error(error.message || error.data.message || error);
        }
    };

    const isOrganizationVerified = async (organizationId) => {
        try {
            if(!ethereum) return alert("Please install MetaMask.");

            await charityContract.methods.isOrganizationVerified(organizationId).call({ from: currentAccount })
            .then((status) => {
                console.log(`Is organization verified: ${status}`);
            });
            
        } catch (error) {
            console.error(error.message || error.data.message || error);
        }
    }

    const revokeOrganization = async (organizationId) => {
        try {

            if(!ethereum) return alert("Please install MetaMask.");

            charityContract.events.OrganizationRevoked()
            .on("data", (event) => {
                console.log(`Organization [${event.returnValues.organization}] - verification status: [${event.returnValues.status}]`);
            })

            await charityContract.methods.revokeOrganization(organizationId).send({ from: currentAccount });

        } catch (error) {
            console.error(error.message || error.data.message || error);
        }
    };

    const startCampaign = async () => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");

            const { title, deadline, amount, tokens, beneficiary } = formData;

            const txConfig = {
                from: currentAccount,
                value: web3.utils.toWei(amount, 'ether')
            }

            charityContract.events.CampaignStarted()
            .on("data", (event) => {
                console.log(`Campaign [${event.returnValues.campaignId}] started by [${event.returnValues.donor}]`);
                setCampaigns((prevState) => new Set([...prevState, event.returnValues.campaignId]));
            })

            await charityContract.methods.startCampaign(
                title,
                deadline,
                tokens,
                beneficiary
            ).send(txConfig);

        } catch (error) {
            console.error(error.message || error.data.message || error);
        }
    };

    const getCampaignsIds = async () => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");

            await charityContract.methods.getCampaignsIds().call({ from: currentAccount })
            .then((campaignsIds) => {
                console.log(campaignsIds);
                setCampaigns(new Set(campaignsIds));
            });

        } catch (error) {
            console.error(error.message || error.data.message || error);
        }
    };

    const getCampaign = async (campaignId) => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");

            await charityContract.methods.getCampaign(campaignId).call({ from: currentAccount })
            .then((campaign) => {
                console.log(campaign);
            });

        } catch (error) {
            console.error(error.message || error.data.message || error);
        }
    };

    const getCampaignTokens = async (campaignId) => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");

            await charityContract.methods.getCampaignTokens(campaignId).call({ from: currentAccount })
            .then((tokens) => {
                console.log(tokens);
            });

        } catch (error) {
            console.error(error.message || error.data.message || error);
        }
    }

    const claimRefund = async (campaignId) => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");

            charityContract.events.RefundClaimed()
            .on("data", (event) => {
                console.log(`Campaign [${event.returnValues.campaignId}]: refund of [${web3.utils.fromWei(event.returnValues.amount, 'ether')} ETH] claimed by [${event.returnValues.donor}]`);
            })

            await charityContract.methods.claimRefund(campaignId).send({ from: currentAccount });

        } catch (error) {
            console.error(error.message || error.data.message || error);
        }
    };

    const claimDonation = async (campaignId) => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");

            charityContract.events.DonationClaimed()
            .on("data", (event) => {
                console.log(`Campaign [${event.returnValues.campaignId}]: donation of [${web3.utils.fromWei(event.returnValues.amount, 'ether')} ETH] claimed by [${event.returnValues.beneficiary}]`);
            })

            await charityContract.methods.claimDonation(campaignId).send({ from: currentAccount });

        } catch (error) {
            console.error(error.data.message || error.message || error);
        }
    };

    // POST - /reedemToken
    // body { campaignId, tokenId }
    
    const reedemToken = async (campaignId, tokenId) => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");

            charityContract.events.TokenRedeemed()
            .on("data", (event) => {
                console.log(`Campaign [${event.returnValues.campaignId}]: token [${event.returnValues.tokenId}] redeemed`);
            })

            await charityContract.methods.redeemToken(campaignId, tokenId).send({ from: currentAccount });

        } catch (error) {
            console.error(error.message || error.data.message || error);
        }
    }

    const getBalance = async () => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");

            await charityContract.methods.getBalance().call({ from: currentAccount })
            .then((balance) => {
                console.log("Charity contract balance: ", web3.utils.fromWei(balance, 'ether') + " ETH");
            });

        } catch (error) {
            console.error(error.message || error.data.message || error);
        }
    }

    const getCampaignBalance = async (campaignId) => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");

            await charityContract.methods.getCampaignBalance(campaignId).call({ from: currentAccount })
            .then((values) => {
                console.log("Campaign balance: ", web3.utils.fromWei(values[0], 'ether') + " ETH");
                console.log("Donor amount: ", web3.utils.fromWei(values[1], 'ether') + " ETH");
                console.log("Beneficiary amount: ", web3.utils.fromWei(values[2], 'ether') + " ETH");
            });

        } catch (error) {
            console.error(error.message || error.data.message || error);
        }
    }

    useEffect(() => {

        if (!currentAccount) checkIfWalletIsConnect();

        ethereum.on('accountsChanged', () => {
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
            reedemToken,
            getBalance,
            getCampaignBalance
        }}>
            {children}  
        </TransactionContext.Provider>
    );
};