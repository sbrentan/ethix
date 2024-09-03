const { 
    log,
    increaseTime 
} = require('../../common/utils.js');
const {
    DEFAULT_STARTDATE_SHIFT,
    DEFAULT_DEADLINE_SHIFT
} = require('../../common/constants.js');

const claimRefund = async (signers, campaignId) => {

    const owner_contract = signers.owner.contract;
    const contract = signers?.donor?.contract || signers?.beneficiary?.contract || signers?.other?.contract;
    
    const refundClaim = () => contract.claimRefund(campaignId);     
    try {

        await increaseTime(DEFAULT_STARTDATE_SHIFT + DEFAULT_DEADLINE_SHIFT + 1);

        log();
        log(`Campaign has ended...`, tabs = 3, sep = '');
        log();

        const refund_tx = await refundClaim();
		const refund_receipt = await refund_tx.wait();
		const refund_amount = refund_receipt?.logs[0]?.data;
        const refund_eth = Number(web3.utils.fromWei(refund_amount, 'ether'));

        const campaign_address = await owner_contract.getCampaignAddress(campaignId);
        const campaign = await ethers.getContractAt("Campaign", campaign_address);

        log(`Refund process:`, tabs = 3, sep = '');
        log(`Refund amount of ${refund_eth.toFixed(2)} ETH claimed`, tabs = 4);
        log();

        return { tx: refund_tx, campaign_contract: campaign, refund_amount: refund_eth }

    } catch (e) {
        return { 
            tx: null, 
            get method() { return (refundClaim)() }
        }
    }
}

const claimDonation = async (signers, campaignId) => { 
    
    const owner_contract = signers.owner.contract;
    const contract = signers?.donor?.contract || signers?.beneficiary?.contract || signers?.other?.contract;

    const donationClaim = () => contract.claimDonation(campaignId);     
    try {

        await increaseTime(DEFAULT_STARTDATE_SHIFT + DEFAULT_DEADLINE_SHIFT + 1);

        log();
        log(`Campaign has ended...`, tabs = 3, sep = '');
        log();

        const donation_tx = await donationClaim();
		const donation_receipt = await donation_tx.wait();
		const donation_amount = donation_receipt?.logs[0]?.data;
        const donation_eth = Number(web3.utils.fromWei(donation_amount, 'ether'));

        const campaign_address = await owner_contract.getCampaignAddress(campaignId);
        const campaign = await ethers.getContractAt("Campaign", campaign_address);

        log(`Donation process:`, tabs = 3, sep = '');
        log(`Donation amount of ${donation_eth.toFixed(2)} ETH claimed`, tabs = 4);
        log();

        return { tx: donation_tx, campaign_contract: campaign, donation_amount: donation_eth }

    } catch (e) {
        return { 
            tx: null, 
            get method() { return (donationClaim)() }
        }
    }
}

module.exports = {
    claimRefund,
    claimDonation
}