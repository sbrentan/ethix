import React, { useState, useEffect } from 'react';
import Web3 from 'web3';

import { 
    useGetCampaignMutation,
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
    const [campaignId, setCampaignId] = useState(null);
    const [campaignAddress, setCampaignAddress] = useState(null);
    const [formData, setformData] = useState({
        title: '1',
        startdate: '',
        deadline: '',
        amount: "0.001",
        tokens: "5",
        beneficiary: '0x665d33620B72b917932Ae8bdE0382494C25b45e1'
    });

    /* ------------------------ MUTATIONS ------------------------ */
    
    // Move to specific components
    const [getCampaignDetails] = useGetCampaignMutation();
    const [initCampaign] = useCreateCampaignMutation();
    const [associateCampaigns] = useAssociateCampaignsMutation();
    const [redeemToken] = useRedeemTokenMutation();

    /* ------------------------ FUNCTIONS ------------------------ */

    const handleChange = (e, name) => {
        switch (name) {
            case 'deadline':
            case 'startdate':
                setformData((prevState) => ({ ...prevState, [name]: Math.floor(new Date(e.target.value).getTime()) }));
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
                status ? console.log(`Organization is verified`) : console.log(`Organization is not verified`);
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

    const createCampaign = async () => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");

            const { title, startdate, deadline, tokens, amount, beneficiary } = formData;

            const seed = web3.utils.randomHex(32);
            console.log(seed);

            const response = await initCampaign({ 
                target: amount, 
                title: title, 
                deadline: deadline, 
                donor: '66a7a899d8d441aa09810736', // obtained from the select - paperino@donor.com user id
                receiver: '66841d794229eb671102d6b1', // obtained from the select - bennannana@ben.ben user id
                seed: seed
            })
            
            const campaignId = response?.data?.campaignId;
            setCampaignId(campaignId);
            console.log(campaignId);

            if(campaignId) {
                const campaign = await charityContract.methods.createCampaign(
                    title,
                    Math.floor(startdate / 1000),
                    Math.floor(deadline / 1000),
                    tokens,
                    beneficiary,
                    web3.utils.keccak256(seed)
                ).send({ from: currentAccount });

                const campaignAddress = campaign.events.CampaignCreated.returnValues.campaignId;
                setCampaignAddress(campaignAddress);
                console.log(campaignAddress);
            }

        } catch (error) {
            let errorMessage = error.data ? error.data.message : (error.message || error);
            console.error(errorMessage);
        }
    };

    useEffect(() => {

        async function checkFundable() {
            if (campaignId) {
                const _response = await getCampaignDetails({campaignId: campaignId});
                const is_fundable = _response?.data?.is_fundable;
                console.log("Fundable: " + is_fundable);
            }
        }

        checkFundable();
    }, []);

    const startCampaign = async () => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");

            const { amount, tokens } = formData;

            let campaignAddress = '0x8fadb7d4366675068884325d4db95c3ccf1589214250a0d0a2ecd1ff117a7028';
            let campaignId = '66abb70316d25225c04ccecd';

            // retrieve seed from db
            const _response = await getCampaignDetails({campaignId: campaignId});
            const seed = _response?.data?.seed;
            console.log(_response);
            console.log(seed || "No seed found");

            await charityContract.methods.startCampaign(campaignAddress, seed).send({
                from: currentAccount,
                value: web3.utils.toWei(amount, 'ether')
            });

            const campaignTokens = await getCampaignTokens(campaignAddress);
            console.log(campaignTokens);

            const response = await associateCampaigns({ 
                campaignId: campaignId, 
                campaignAddress: campaignAddress, 
                tokenPrice: amount / tokens,
                tokens: campaignTokens.map((token) => token.tokenId)
            })

            console.log(response);

        } catch (error) {
            let errorMessage = error.data ? error.data.message : (error.message || error);
            console.error(errorMessage);
        }
    };

    const getCampaignsIds = async () => {

        var campaignsIds = [];

        try {
            if (!ethereum) return alert("Please install MetaMask.");

            campaignsIds = await charityContract.methods.getCampaignsIds().call({ from: currentAccount })
            const block = await web3.eth.getBlock('latest');
            console.log(block.timestamp);

            console.log("Dates:", Math.floor(formData.startdate / 1000), Math.floor(formData.deadline / 1000));
            console.log(campaignsIds);

        } catch (error) {
            let errorMessage = error.data ? error.data.message : (error.message || error);
            console.error(errorMessage);
        }

        return campaignsIds;
    };

    const getCampaign = async (campaignId) => {

        var campaign = {};

        try {
            if (!ethereum) return alert("Please install MetaMask.");

            campaign = await charityContract.methods.getCampaign(campaignId).call({ from: currentAccount })
            console.log(new Date(Math.floor(Number(campaign.deadline))));
            console.log(new Date(Math.floor(Number(campaign.startingDate))));

        } catch (error) {
            let errorMessage = error.data ? error.data.message : (error.message || error);
            console.error(errorMessage);
        }

        return campaign;
    };

    const getCampaignTokens = async (campaignId) => {

        var tokens = [];

        try {
            if (!ethereum) return alert("Please install MetaMask.");

            tokens = await charityContract.methods.getCampaignTokens(campaignId).call({ from: currentAccount });
            
            const block = await web3.eth.getBlock('latest');
            console.log(block);

            const timestamp = await web3.eth.getBlockNumber("49").timestamp;
            console.log(timestamp);

            console.log(tokens);

        } catch (error) {
            let errorMessage = error.data ? error.data.message : (error.message || error);
            console.error(errorMessage);
        }

        return tokens;
    }

    const claimRefund = async (campaignId) => {

        var refund = 0;

        try {
            if (!ethereum) return alert("Please install MetaMask.");

            const result = await charityContract.methods.claimRefund(campaignId).send({ from: currentAccount });
            refund = result.events.RefundClaimed.returnValues.amount;

        } catch (error) {
            let errorMessage = error.data ? error.data.message : (error.message || error);
            console.error(errorMessage);
        }

        return refund;
    };

    const claimDonation = async (campaignId) => {

        var donation = 0;

        try {
            if (!ethereum) return alert("Please install MetaMask.");

            const result = await charityContract.methods.claimDonation(campaignId).send({ from: currentAccount });
            donation = result.events.DonationClaimed.returnValues.amount;

        } catch (error) {
            let errorMessage = error.data ? error.data.message : (error.message || error);
            console.error(errorMessage);
        }

        return donation;
    };

    // Move to specific component
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
        const campaignCreatedSubscription = charityContract.events.CampaignCreated();
        const campaignStartedSubscription = charityContract.events.CampaignStarted();
        const tokenRedeemedSubscription = charityContract.events.TokenRedeemed();
        const refundClaimedSubscription = charityContract.events.RefundClaimed();
        const donationClaimedSubscription = charityContract.events.DonationClaimed();

        // Logging events to console

        organizationVerifiedSubscription.on("data", (event) => {
            console.log(`Organization verified`);
        });

        organizationRevokedSubscription.on("data", (event) => {
            console.log(`Organization unverified`);
        });

        campaignCreatedSubscription.on("data", (event) => {
            console.log(`Campaign [${event.returnValues.campaignId}] created`);
        });

        campaignStartedSubscription.on("data", (event) => {
            console.log(`Campaign [${event.returnValues.campaignId}] started`);
        });

        tokenRedeemedSubscription.on("data", (event) => {
            console.log(`Token for Campaign [${event.returnValues.campaignId}] redeemed`);
        });

        refundClaimedSubscription.on("data", (event) => {
            console.log(`Refund of [${web3.utils.fromWei(event.returnValues.amount, 'ether')}] ETH claimed`);
        });
        
        donationClaimedSubscription.on("data", (event) => {
            console.log(`Donation of [${web3.utils.fromWei(event.returnValues.amount, 'ether')}] ETH claimed`);
        });

        return() => {
            organizationVerifiedSubscription.unsubscribe();
            organizationRevokedSubscription.unsubscribe();
            campaignCreatedSubscription.unsubscribe();
            campaignStartedSubscription.unsubscribe();
            tokenRedeemedSubscription.unsubscribe();
            refundClaimedSubscription.unsubscribe();
            donationClaimedSubscription.unsubscribe();
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
            createCampaign,
            startCampaign,
            getCampaign,
            getCampaignsIds,
            getCampaignTokens,
            claimRefund,
            claimDonation,
            handleTokenRedeem
        }}>
            {children}  
        </TransactionContext.Provider>
    );
};