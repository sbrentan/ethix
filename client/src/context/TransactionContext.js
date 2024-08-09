import React, { useState, useEffect } from 'react';
import Web3 from 'web3';

import {
    useGetCampaignMutation,
    useCreateCampaignMutation,
    useGenerateRandomWalletMutation,
    useGenerateCampaignTokensMutation,
    useRedeemTokenMutation
} from './contextApiSlice';

import { CHARITY_CONTRACT_ABI, CHARITY_CONTRACT_ADDRESS } from '../utils/constants';

export const TransactionContext = React.createContext();

const { ethereum } = window;

export const TransactionsProvider = ({ children }) => {

    /* ------------------------ VARIABLES ------------------------ */

    const web3 = new Web3(ethereum);
    const charityContract = new web3.eth.Contract(CHARITY_CONTRACT_ABI, CHARITY_CONTRACT_ADDRESS);

    /* ------------------------ STATES ------------------------ */

    const [block, setBlock] = useState(0);

    const [wallet, setWallet] = useState({
        address: '', // walletAddress of MetaMask
        is_logged: false,
    });

    const [organization, setOrganization] = useState({
        address: '', // organizationAddress on the blockchain
        is_verified: false
    });

    const [formData, setformData] = useState({
        title: '1',
        description: '',
        image: '',
        startdate: '',
        deadline: '',
        target: "0.001",
        tokens: "5",
        beneficiary: '0x665d33620B72b917932Ae8bdE0382494C25b45e1'
    });

    const [campaign, setCampaign] = useState({
        id: '', // campaignId on the database
        address: '', // campaignAddress on the blockchain
        is_created: false,
        is_started: false,
        is_association_failed: false,
        is_fundable: false,
        is_refunded: false,
        is_donated: false
    });

    /* ------------------------ MUTATIONS ------------------------ */

    // Move to specific components
    const [getCampaignDetails] = useGetCampaignMutation();
    const [initCampaign] = useCreateCampaignMutation();
    const [generateRandomWallet] = useGenerateRandomWalletMutation();
    const [generateCampaignTokens] = useGenerateCampaignTokensMutation();
    const [claimToken] = useRedeemTokenMutation();

    /* ------------------------ FUNCTIONS ------------------------ */

    const handleChange = (e, name) => {
        switch (name) {
            case 'startdate':
            case 'deadline':
                setformData((prevState) => ({ ...prevState, [name]: new Date(e.target.value).getTime() }));
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
                    setWallet({ address: accounts[0], is_logged: true });
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
                        setWallet({ address: accounts[0], is_logged: true });
                    } else throw new Error("No wallet accounts found");
                });

        } catch (error) {
            let errorMessage = error.data ? error.data.message : (error.message || error);
            console.error(errorMessage);
        }
    };

    const verifyOrganization = async (organizationAddress) => {
        try {

            if (!ethereum) return alert("Please install MetaMask.");

            await charityContract.methods.verifyOrganization(organizationAddress).send({ from: wallet.address });

            setOrganization({ address: organizationAddress, is_verified: true });

        } catch (error) {
            let errorMessage = error.data ? error.data.message : (error.message || error);
            console.error(errorMessage);
        }
    };

    const isOrganizationVerified = async (organizationAddress) => {
        var status;
        try {
            if (!ethereum) return alert("Please install MetaMask.");

            await charityContract.methods.isOrganizationVerified(organizationAddress).call({ from: wallet.address })
                .then((response) => {
                    response ? console.log(`Organization is verified`) : console.log(`Organization is not verified`);
                    status = response;
                });
            return status;

        } catch (error) {
            let errorMessage = error.data ? error.data.message : (error.message || error);
            console.error(errorMessage);
        }
    }

    const revokeOrganization = async (organizationAddress) => {
        try {

            if (!ethereum) return alert("Please install MetaMask.");

            await charityContract.methods.revokeOrganization(organizationAddress).send({ from: wallet.address });

            setOrganization({ address: organizationAddress, is_verified: false });

        } catch (error) {
            let errorMessage = error.data ? error.data.message : (error.message || error);
            console.error(errorMessage);
        }
    };

    const createCampaign = async (title, description, image, startingDate, deadline, targetEth, tokenAmount, donor, receiverId, receiver) => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");

            if (!title) throw new Error("Title is required");
            if (!startingDate) throw new Error("Start date is required");
            if (!deadline) throw new Error("Deadline is required");
            if (!tokenAmount) throw new Error("Tokens count is required");
            if (!targetEth) throw new Error("Target is required");
            if (!receiver) throw new Error("Beneficiary is required");
            if (!(await isOrganizationVerified(receiver))) throw new Error("Beneficiary is not validated");

            const draft_response = await initCampaign({
                target: targetEth,
                title: title,
                description: description, // optional
                image: image, // optional
                startingDate: startingDate,
                deadline: deadline,
                tokensCount: tokenAmount,
                donor: donor,
                receiver: receiverId,
                draft: true
            })

            if (draft_response?.error?.data?.message) throw new Error(draft_response?.error?.data?.message);

            const _seedHash = draft_response?.data?.seedHash;
            const _signature = draft_response?.data?.signature;

            console.log(_seedHash);
            console.log(_signature);

            if (!_seedHash) throw new Error("No seed hash found");
            if (!_signature) throw new Error("No signature found");

            const campaign = await charityContract.methods.createCampaign(
                title,
                Math.floor(startingDate / 1000),
                Math.floor(deadline / 1000),
                tokenAmount,
                receiver,
                _seedHash,
                {
                    r: _signature.r,
                    s: _signature.s,
                    v: _signature.v
                }
            ).send({ from: wallet.address });

            const campaignAddress = campaign.events.CampaignCreated.returnValues.campaignId;
            setCampaign((prevState) => ({ ...prevState, address: campaignAddress }));
            console.log(campaignAddress);

            const response = await initCampaign({
                target: targetEth,
                tokensCount: tokenAmount,
                title: title,
                description: description,
                image: image,
                startingDate: startingDate,
                deadline: deadline,
                donor: donor,
                receiver: receiverId,
                seedHash: _seedHash,
                campaignAddress: campaignAddress,
                draft: false
            })

            const campaignId = response?.data?.campaignId;

            if (!campaignId) throw new Error("No campaign id found");

            setCampaign((prevState) => ({ ...prevState, id: campaignId, is_created: true }));
            console.log(campaignId);
            if (campaignId) return true

        } catch (error) {
            let errorMessage = error.data ? error.data.message : (error.message || error);
            console.error(errorMessage);
        }
    };

    const startCampaign = async ({campaignId, campaignAddress}) => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");

            const wallet_response = await generateRandomWallet({ campaignId });

            if (wallet_response?.error?.data?.message) throw new Error(wallet_response?.error?.data?.message);

            const walletAddress = wallet_response?.data?.address;
            const walletSignature = wallet_response?.data?.signature;
            const seed = wallet_response?.data?.campaign?.seed;
            const target = wallet_response?.data?.campaign?.target;

            if (!walletAddress) throw new Error("No wallet address found");
            if (!walletSignature) throw new Error("No wallet signature found");
            if (!seed) throw new Error("No seed found");
            if (!target) throw new Error("No target found");

            await charityContract.methods.startCampaign(
                campaignAddress, 
                seed,
                walletAddress, // public key
                {
                    r: walletSignature.r,
                    s: walletSignature.s,
                    v: walletSignature.v
                }
            ).send({ 
                from: wallet.address, 
                value: web3.utils.toWei(String(target), 'ether')
            });
            
            const token_response = await generateCampaignTokens({ campaignId });

            if (token_response?.error?.data?.message) throw new Error(token_response?.error?.data?.message);

            const signed_tokens = token_response?.data?.signedTokens;

            console.log(signed_tokens);

            return signed_tokens

        } catch (error) {
            let errorMessage = error.data ? error.data.message : (error.message || error);
            console.error(errorMessage);
        }
    };

    const getCampaignsIds = async () => {

        var campaignsIds = [];

        try {
            if (!ethereum) return alert("Please install MetaMask.");

            campaignsIds = await charityContract.methods.getCampaignsIds().call({ from: wallet.address });
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

            campaign = await charityContract.methods.getCampaign(campaignId).call({ from: wallet.address });
            console.log(campaign);

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

            tokens = await charityContract.methods.getCampaignTokens(campaignId).call({ from: wallet.address });
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

            const result = await charityContract.methods.claimRefund(campaignId).send({ from: wallet.address });
            refund = result.events.RefundClaimed.returnValues.amount;
            console.log(refund)
            setCampaign((prevState) => ({ ...prevState, is_refunded: true }));

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

            const result = await charityContract.methods.claimDonation(campaignId).send({ from: wallet.address });
            donation = result.events.DonationClaimed.returnValues.amount;
            console.log(donation)
            setCampaign((prevState) => ({ ...prevState, is_donated: true }));

        } catch (error) {
            let errorMessage = error.data ? error.data.message : (error.message || error);
            console.error(errorMessage);
        }

        return donation;
    };

    const redeemToken = async (campaignId, tokenId, tokenSignature) => {
        try {
            const response = await claimToken({
                campaignId: campaignId,
                token: tokenId,
                signature: tokenSignature
            });

            if (response?.error?.data?.message) throw new Error(response?.error?.data?.message);

            console.log(response?.data);
        } catch (error) {
            let errorMessage = error.data ? error.data.message : (error.message || error);
            console.error(errorMessage);
        }
    }

    /* ------------------------ USE EFFECT ------------------------ */

    useEffect(() => {
        if (!wallet.address) checkIfWalletIsConnect();
        ethereum.on('accountsChanged', checkIfWalletIsConnect);
        return () => ethereum.removeListener('accountsChanged', checkIfWalletIsConnect);
    }, [wallet]);

    useEffect(() => {
        const checkMinedBlock = async () => {
            const response = await getCampaignDetails({ campaignId: campaign.id });
            const is_fundable = response?.data?.is_fundable;
            setCampaign((prevState) => ({ ...prevState, is_fundable: is_fundable }));
        }
        if (campaign.id && !campaign.is_fundable) checkMinedBlock();
    }, [block]);

    useEffect(() => {

        // Subscription to new blocks mined event

        const checkMinedBlock = async () => {
            const minedBlockSubscription = await web3.eth.subscribe('newBlockHeaders');

            minedBlockSubscription.on('data', async (blockHeader) => {
                setBlock(Number(blockHeader.number));
            });

            return () => minedBlockSubscription.unsubscribe();
        };

        // Call async functions

        checkMinedBlock();

        // Subscriptions to contract events
        
        const organizationVerifiedSubscription = charityContract.events.OrganizationVerified();
        const organizationRevokedSubscription = charityContract.events.OrganizationRevoked();
        const campaignCreatedSubscription = charityContract.events.CampaignCreated();
        const campaignStartedSubscription = charityContract.events.CampaignStarted();
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

        refundClaimedSubscription.on("data", (event) => {
            console.log(`Refund of [${web3.utils.fromWei(event.returnValues.amount, 'ether')}] ETH claimed`);
        });

        donationClaimedSubscription.on("data", (event) => {
            console.log(`Donation of [${web3.utils.fromWei(event.returnValues.amount, 'ether')}] ETH claimed`);
        });

        // Unsubscribing from events on unmount

        return () => {
            organizationVerifiedSubscription.unsubscribe();
            organizationRevokedSubscription.unsubscribe();
            campaignCreatedSubscription.unsubscribe();
            campaignStartedSubscription.unsubscribe();
            refundClaimedSubscription.unsubscribe();
            donationClaimedSubscription.unsubscribe();
        }

    }, []);

    /* ------------------------ PROVIDER ------------------------ */

    return (
        <TransactionContext.Provider value={{
            wallet,
            connectWallet,
            organization,
            setOrganization,
            verifyOrganization,
            isOrganizationVerified,
            revokeOrganization,
            formData,
            handleChange,
            campaign,
            setCampaign,
            createCampaign,
            startCampaign,
            getCampaign,
            getCampaignsIds,
            getCampaignTokens,
            claimRefund,
            claimDonation,
            redeemToken
        }}>
            {children}
        </TransactionContext.Provider>
    );
};
