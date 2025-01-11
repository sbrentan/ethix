import React, { useState, useEffect } from 'react';
import Web3 from 'web3';

import {
    useCreateCampaignMutation,
    useGenerateRandomWalletMutation,
    useGenerateCampaignTokensMutation,
    useRedeemTokenMutation
} from './contextApiSlice';

import { CHARITY_CONTRACT_ABI, CHARITY_CONTRACT_ADDRESS } from '../utils/constants';

export const TransactionContext = React.createContext();

export const TransactionsProvider = ({ children, mocks = {} }) => {

    /* ------------------------ VARIABLES ------------------------ */

    let window = global.window;
    if (mocks?.window) window = mocks.window;

    let ethereum = window.ethereum;

    const web3 = new Web3(ethereum);
    let charityContract = new web3.eth.Contract(CHARITY_CONTRACT_ABI, CHARITY_CONTRACT_ADDRESS);
    if (mocks?.charityContract) charityContract = mocks.charityContract;

    /* ------------------------ STATES ------------------------ */

    let [wallet, setWallet] = useState({
        address: '', // walletAddress of MetaMask
        is_logged: false,
    });
    if (mocks?.setWallet) setWallet = mocks.setWallet;
    if (mocks?.wallet) wallet = mocks.wallet;

    let [organization, setOrganization] = useState({
        address: '', // organizationAddress on the blockchain
        is_verified: false
    });
    if (mocks?.setOrganization) setOrganization = mocks.setOrganization;

    const [formData, setformData] = useState({
        title: '',
        description: '',
        image: '',
        startdate: '',
        deadline: '',
        target: '',
        tokens: '',
        beneficiary: ''
    });

    let [campaign, setCampaign] = useState({
        id: '', // campaignId on the database
        address: '', // campaignAddress on the blockchain
        is_created: false,
        is_started: false,
        is_refunded: false,
        is_donated: false
    });
    if (mocks?.setCampaign) setCampaign = mocks.setCampaign;

    /* ------------------------ MUTATIONS ------------------------ */

    // Move to specific components
    let [initCampaign] = useCreateCampaignMutation();
    let [generateRandomWallet] = useGenerateRandomWalletMutation();
    let [generateCampaignTokens] = useGenerateCampaignTokensMutation();
    let [claimToken] = useRedeemTokenMutation();

    if (mocks?.initCampaign) initCampaign = mocks.initCampaign;
    if (mocks?.claimToken) claimToken = mocks.claimToken;
    if (mocks?.generateRandomWallet) generateRandomWallet = mocks.generateRandomWallet;
    if (mocks?.generateCampaignTokens) generateCampaignTokens = mocks.generateCampaignTokens;

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
                    console.log(accounts)
                    if (accounts.length > 0) {
                        setWallet({ address: accounts[0], is_logged: true });
                    } else throw new Error("No wallet accounts found");
                });

        } catch (error) {
            let errorMessage = error.data ? error.data.message : (error.message || error);
            console.error(errorMessage);
        }
    };

    let verifyOrganization = async (organizationAddress) => {
        try {

            if (!ethereum) return alert("Please install MetaMask.");
            if (!wallet.address) return alert("Please connect your wallet.");
            if (!organizationAddress) throw new Error("Organization address is required");

            await charityContract.methods.verifyOrganization(organizationAddress).send({ from: wallet.address });

            setOrganization({ address: organizationAddress, is_verified: true });
            return true;

        } catch (error) {
            let errorMessage = error.data ? error.data.message : (error.message || error);
            console.error(errorMessage);
        }
        return false;
    };

    let isOrganizationVerified = async (organizationAddress) => {
        var status;
        try {
            if (!ethereum) return alert("Please install MetaMask.");
            if (!wallet.address) return alert("Please connect your wallet.");

            await charityContract.methods.isOrganizationVerified(organizationAddress).call({ from: wallet.address })
                .then((response) => {
                    console.log(response);
                    status = response;
                });
            return status;

        } catch (error) {
            let errorMessage = error.data ? error.data.message : (error.message || error);
            console.error(errorMessage);
        }
    };
    if (mocks?.isOrganizationVerified) isOrganizationVerified = mocks.isOrganizationVerified;

    let revokeOrganization = async (organizationAddress) => {
        try {

            if (!ethereum) return alert("Please install MetaMask.");
            if (!wallet.address) return alert("Please connect your wallet.");
            if (!organizationAddress) throw new Error("Organization address is required");

            await charityContract.methods.revokeOrganization(organizationAddress).send({ from: wallet.address });

            setOrganization({ address: organizationAddress, is_verified: false });
            return true;

        } catch (error) {
            let errorMessage = error.data ? error.data.message : (error.message || error);
            console.error(errorMessage);
        }
        return false;
    };

    let createCampaign = async (targetEur, title, description, image, startingDate, deadline, targetEth, tokenAmount, totalTokens, donor, receiverId, receiver) => {
        try {
            
            if (!ethereum) return alert("Please install MetaMask.");
            if (!wallet.address) return alert("Please connect your wallet.");

            if (!title) throw new Error("Title is required");
            if (!startingDate) throw new Error("Start date is required");
            if (!deadline) throw new Error("Deadline is required");
            if (!tokenAmount) throw new Error("Tokens count is required");
            if (!totalTokens) throw new Error("Total tokens is required");
            if (!targetEth) throw new Error("Target is required");
            if (!receiver) throw new Error("Beneficiary is required");
            if(!targetEur) throw new Error("Target in EUR is required");
            if (!(await isOrganizationVerified(receiver))) throw new Error("Beneficiary is not validated");

            const draft_response = await initCampaign({
                targetEur: targetEur,
                target: targetEth,
                title: title,
                description: description, // optional
                image: image, // optional
                startingDate: startingDate,
                deadline: deadline,
                tokensCount: tokenAmount,
                maxTokensCount: totalTokens,
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
                totalTokens,
                receiver,
                _seedHash,
                {
                    r: _signature.r,
                    s: _signature.s,
                    v: _signature.v
                }
            ).send({ from: wallet.address });

            console.log("Campaign created");

            const campaignAddress = campaign.events.CampaignCreated.returnValues.campaignId;
            setCampaign((prevState) => ({ ...prevState, address: campaignAddress }));
            console.log(campaignAddress);

            const response = await initCampaign({
                targetEur: targetEur,
                target: targetEth,
                tokensCount: tokenAmount,
                maxTokensCount: totalTokens,
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
        return false
    };

    let startCampaign = async ({campaignId, campaignAddress}) => {
        try {
            if (!ethereum) return alert("Please install MetaMask.");
            if (!wallet.address) return alert("Please connect your wallet.");
            if (!campaignId) throw new Error("Campaign id is required");
            if (!campaignAddress) throw new Error("Campaign address is required");

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

            setCampaign((prevState) => ({ ...prevState, is_started: true }));

            const signed_tokens = token_response?.data?.signedTokens;

            console.log(signed_tokens);

            return signed_tokens

        } catch (error) {
            let errorMessage = error.data ? error.data.message : (error.message || error);
            console.error(errorMessage);
        }
        return [];
    };

    const getCampaignsIds = async () => {

        var campaignsIds = [];

        try {
            if (!ethereum) return alert("Please install MetaMask.");
            if (!wallet.address) return alert("Please connect your wallet.");

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
            if (!wallet.address) return alert("Please connect your wallet.");

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
            if (!wallet.address) return alert("Please connect your wallet.");

            tokens = await charityContract.methods.getCampaignTokens(campaignId).call({ from: wallet.address });
            console.log(tokens);

        } catch (error) {
            let errorMessage = error.data ? error.data.message : (error.message || error);
            console.error(errorMessage);
        }

        return tokens;
    }

    let claimRefund = async (campaignId) => {

        var refund = 0;

        try {
            if (!ethereum) return alert("Please install MetaMask.");
            if (!wallet.address) return alert("Please connect your wallet.");
            if (!campaignId) throw new Error("Campaign id is required");

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

    let claimDonation = async (campaignId) => {

        var donation = 0;

        try {
            if (!ethereum) return alert("Please install MetaMask.");
            if (!wallet.address) return alert("Please connect your wallet.");
            if (!campaignId) throw new Error("Campaign id is required");

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

    let redeemToken = async (campaignId, tokenId, tokenSignature) => {
        try {

            if (!campaignId) throw new Error("Campaign id is required");
            if (!tokenId) throw new Error("Token id is required");
            if (!tokenSignature) throw new Error("Token signature is required");

            const response = await claimToken({
                campaignId: campaignId,
                token: tokenId,
                signature: tokenSignature
            });

            if (response?.error?.data?.message) throw new Error(response?.error?.data?.message);

            console.log(response?.data);
            return true;
        } catch (error) {
            let errorMessage = error.data ? error.data.message : (error.message || error);
            console.error(errorMessage);
        }
        return false;
    }

    /* ------------------------ USE EFFECT ------------------------ */

    useEffect(() => {
        if (!wallet.address) checkIfWalletIsConnect();
        if (ethereum) {
            ethereum.on('accountsChanged', checkIfWalletIsConnect);
            return () => ethereum.removeListener('accountsChanged', checkIfWalletIsConnect);
        }
    }, [wallet]);

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
