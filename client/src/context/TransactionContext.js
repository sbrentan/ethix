import React, { useState, useEffect } from 'react';
import Web3 from 'web3';

import { 
    useCreateCampaignMutation,
    useAssociateCampaignsMutation,
    useRedeemTokenMutation 
} from './contextApiSlice';

import { CHARITY_CONTRACT_ABI, CHARITY_CONTRACT_ADDRESS } from '../utils/constants';

export const TransactionContext = React.createContext();

const { ethereum } = window;

export const TransactionsProvider = ({ children }) => {

    /* ------------------------ VARIABLES ------------------------ */

    const web3 = new Web3(ethereum);
    const charityContract = new web3.eth.Contract(CHARITY_CONTRACT_ABI, CHARITY_CONTRACT_ADDRESS);

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentAccount, setCurrentAccount] = useState(null);
    const [campaignIdDb, setCampaignIdDb] = useState(null);
    const [campaignIdBc, setCampaignIdBc] = useState(null);
    const [formData, setformData] = useState({
        title: '',
        description: '',
        deadline: Math.floor(Date.now() / 1000) + 60,
        amount: 0,
        tokens: 0,
        beneficiary: ''
    });

    /* ------------------------ MUTATIONS ------------------------ */
    
    // Move to specific components
    const [createCampaign] = useCreateCampaignMutation();
    const [associateCampaigns] = useAssociateCampaignsMutation();
    const [redeemToken] = useRedeemTokenMutation();

    /* ------------------------ FUNCTIONS ------------------------ */

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
            let errorMessage = error.data ? error.data.message : (error.message || error);
            console.error(errorMessage);
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
            let errorMessage = error.data ? error.data.message : (error.message || error);
            console.error(errorMessage);
        }
    };

    const verifyOrganization = async (organizationId) => {
        try {

            if(!ethereum) return alert("Please install MetaMask.");

            await charityContract.methods.verifyOrganization(organizationId).send({ from: currentAccount });

        } catch (error) {
            let errorMessage = error.data ? error.data.message : (error.message || error);
            console.error(errorMessage);
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
            let errorMessage = error.data ? error.data.message : (error.message || error);
            console.error(errorMessage);
        }
    }

    const revokeOrganization = async (organizationId) => {
        try {

            if(!ethereum) return alert("Please install MetaMask.");

            await charityContract.methods.revokeOrganization(organizationId).send({ from: currentAccount });

        } catch (error) {
            let errorMessage = error.data ? error.data.message : (error.message || error);
            console.error(errorMessage);
        }
    };

    const handleCreateCampaign = async () => {
        const { title, deadline, amount } = formData;

        await createCampaign({ target: amount, title: title, deadline: deadline, donor: '66a7a899d8d441aa09810736', receiver: '66841d794229eb671102d6b3' })
        .then((response) => {
            console.log(response?.data);
            setCampaignIdDb(response?.data?.campaignId);
        });
    };

    const startCampaign = async () => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");

            const { title, deadline, amount, tokens, beneficiary } = formData;

            const txConfig = {
                from: currentAccount,
                value: web3.utils.toWei(amount, 'ether')
            }

            await charityContract.methods.startCampaign(
                title,
                deadline,
                tokens,
                beneficiary, 
                web3.utils.randomHex(32)
            ).send(txConfig);

            const campaignTokens = await getCampaignTokens(campaignIdBc);

            await associateCampaigns({ 
                campaignIdDb: campaignIdDb, 
                campaignIdBc: campaignIdBc, 
                tokenPrice: amount / tokens, 
                tokenAmount: campaignTokens
            })
            .then((response) => {
                console.log(response?.data);
            });

        } catch (error) {
            let errorMessage = error.data ? error.data.message : (error.message || error);
            console.error(errorMessage);
        }
    };

    const getCampaignsIds = async () => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");

            await charityContract.methods.getCampaignsIds().call({ from: currentAccount })
            .then((campaignsIds) => {
                console.log(campaignsIds);
            });

        } catch (error) {
            let errorMessage = error.data ? error.data.message : (error.message || error);
            console.error(errorMessage);
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
            let errorMessage = error.data ? error.data.message : (error.message || error);
            console.error(errorMessage);
        }
    };

    const getCampaignTokens = async (campaignId) => {

        var campaignTokens = [];

        try {
            if (!ethereum) return alert("Please install MetaMask.");

            await charityContract.methods.getCampaignTokens(campaignId).call({ from: currentAccount })
            .then((tokens) => {
                console.log(tokens);
                campaignTokens = tokens;
            });

        } catch (error) {
            let errorMessage = error.data ? error.data.message : (error.message || error);
            console.error(errorMessage);
        }

        return campaignTokens;
    }

    const claimRefund = async (campaignId) => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");

            await charityContract.methods.claimRefund(campaignId).send({ from: currentAccount });

        } catch (error) {
            let errorMessage = error.data ? error.data.message : (error.message || error);
            console.error(errorMessage);
        }
    };

    const claimDonation = async (campaignId) => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");

            await charityContract.methods.claimDonation(campaignId).send({ from: currentAccount });

        } catch (error) {
            let errorMessage = error.data ? error.data.message : (error.message || error);
            console.error(errorMessage);
        }
    };

    const getBalance = async () => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");

            await charityContract.methods.getBalance().call({ from: currentAccount })
            .then((balance) => {
                console.log("Charity contract balance: ", web3.utils.fromWei(balance, 'ether') + " ETH");
            });

        } catch (error) {
            let errorMessage = error.data ? error.data.message : (error.message || error);
            console.error(errorMessage);
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
            let errorMessage = error.data ? error.data.message : (error.message || error);
            console.error(errorMessage);
        }
    }

    const handleTokenRedeem = async (campaignId, tokenId) => {
        await redeemToken({ campaignId, tokenId })
        .then((response) => { 
            console.log(response?.data);
        })
    }

    useEffect(() => {

        if (!currentAccount) checkIfWalletIsConnect();

        ethereum.on('accountsChanged', () => {
            checkIfWalletIsConnect();
        })
    }, [currentAccount]);

    useEffect(() => {

        // Subscriptions to contract events

        const organizationVerifiedSubscription = charityContract.events.OrganizationVerified();
        const organizationRevokedSubscription = charityContract.events.OrganizationRevoked();
        const campaignStartedSubscription = charityContract.events.CampaignStarted();
        const refundClaimedSubscription = charityContract.events.RefundClaimed();
        const donationClaimedSubscription = charityContract.events.DonationClaimed();
        const tokenRedeemedSubscription = charityContract.events.TokenRedeemed();

        organizationVerifiedSubscription.on("data", (event) => {
            console.log(`Organization [${event.returnValues.organization}] - verification status: [${event.returnValues.status}]`);
        });

        organizationRevokedSubscription.on("data", (event) => {
            console.log(`Organization [${event.returnValues.organization}] - verification status: [${event.returnValues.status}]`);
        });

        campaignStartedSubscription.on("data", (event) => {
            console.log(`Campaign [${event.returnValues.campaignId}] started by [${event.returnValues.donor}]`);
            setCampaignIdBc(event.returnValues.campaignId);
        });

        refundClaimedSubscription.on("data", (event) => {
            console.log(`Campaign [${event.returnValues.campaignId}]: refund of [${web3.utils.fromWei(event.returnValues.amount, 'ether')} ETH] claimed by [${event.returnValues.donor}]`);
        });
        
        donationClaimedSubscription.on("data", (event) => {
            console.log(`Campaign [${event.returnValues.campaignId}]: donation of [${web3.utils.fromWei(event.returnValues.amount, 'ether')} ETH] claimed by [${event.returnValues.beneficiary}]`);
        });

        tokenRedeemedSubscription.on("data", (event) => {
            console.log(`Campaign [${event.returnValues.campaignId}]: token [${event.returnValues.tokenId}] redeemed`);
        });

        return() => {
            organizationVerifiedSubscription.unsubscribe();
            organizationRevokedSubscription.unsubscribe();
            campaignStartedSubscription.unsubscribe();
            refundClaimedSubscription.unsubscribe();
            donationClaimedSubscription.unsubscribe();
            tokenRedeemedSubscription.unsubscribe();
        }

    }, []);
    
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
            handleCreateCampaign,
            startCampaign,
            campaign,
            getCampaign,
            getCampaignsIds,
            getCampaignTokens,
            claimRefund,
            claimDonation,
            handleTokenRedeem,
            getBalance,
            getCampaignBalance
        }}>
            {children}  
        </TransactionContext.Provider>
    );
};