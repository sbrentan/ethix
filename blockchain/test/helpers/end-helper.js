const { 
    log,
    increaseTime,
    getTestName 
} = require('../../common/utils.js');
const {
    DEFAULT_STARTDATE_SHIFT,
    DEFAULT_DEADLINE_SHIFT
} = require('../../common/constants.js');

const prepareEndParams = async (params = {}) => {

    const is_charity_test = getTestName() === "Charity";

    const _randomString = web3.utils.randomHex(32);
    const _campaignId = params.campaignId || web3.utils.keccak256(_randomString);
    const _from = !is_charity_test && (params.from.address || web3.eth.accounts.create().address);
    const _increaseTime = params.increaseTime === false ? false : true;

    log();
    log(`End params:`, tabs = 3, sep = '');
    log(`Campaign ID: ${_campaignId}`);
    log(`Increase time: ${_increaseTime}`);
    !is_charity_test && log(`From: ${_from}`);

    let return_params = {};

    return_params.campaignId = _campaignId;
    return_params.increaseTime = _increaseTime;
    
    !is_charity_test && (return_params.from = _from);

    return return_params;
}

const claimRefund = async (signers, params) => {

    const is_charity_test = getTestName() === "Charity";

    const owner_contract = signers.owner.contract;
    const donor_contract = signers.donor.contract;
    
    const refundClaim = () => 
        is_charity_test
            ? donor_contract.claimRefund(params.campaignId)
            : owner_contract.claimRefund(params.from);
         
    try {

        if (params.increaseTime){
            await increaseTime(DEFAULT_STARTDATE_SHIFT + DEFAULT_DEADLINE_SHIFT + 1);

            log();
            log(`Campaign has ended...`, tabs = 3, sep = '');
            log();
        }

        const refund_tx = await refundClaim();
		const refund_receipt = await refund_tx.wait();
		const refund_amount = refund_receipt?.logs[0]?.data;
        const refund_eth = Number(web3.utils.fromWei(refund_amount, 'ether'));

        const campaign_address = is_charity_test && await owner_contract.getCampaignAddress(params.campaignId);
        const campaign = is_charity_test && await ethers.getContractAt("Campaign", campaign_address);

        log(`Refund process:`, tabs = 3, sep = '');
        log(`Refund amount of ${refund_eth.toFixed(2)} ETH claimed`, tabs = 4);
        log();

        let return_params = {};

        return_params.tx = refund_tx;
        return_params.refund_amount = refund_eth;
        return_params.contract = is_charity_test ? campaign : owner_contract;

        return return_params;

    } catch (e) {
        return { 
            tx: null, 
            get method() { return (refundClaim)() }
        }
    }
}

const claimDonation = async (signers, params) => { 
    
    const is_charity_test = getTestName() === "Charity";

    const owner_contract = signers.owner.contract;
    const beneficiary_contract = signers.beneficiary.contract;
    
    const donationClaim = () => 
        is_charity_test
            ? beneficiary_contract.claimDonation(params.campaignId)
            : owner_contract.claimDonation(params.from);
  
    try {

        if (params.increaseTime){
            await increaseTime(DEFAULT_STARTDATE_SHIFT + DEFAULT_DEADLINE_SHIFT + 1);

            log();
            log(`Campaign has ended...`, tabs = 3, sep = '');
            log();
        }

        const donation_tx = await donationClaim();
		const donation_receipt = await donation_tx.wait();
		const donation_amount = donation_receipt?.logs[0]?.data;
        const donation_eth = Number(web3.utils.fromWei(donation_amount, 'ether'));

        const campaign_address = is_charity_test && await owner_contract.getCampaignAddress(params.campaignId);
        const campaign = is_charity_test && await ethers.getContractAt("Campaign", campaign_address);

        log(`Donation process:`, tabs = 3, sep = '');
        log(`Donation amount of ${donation_eth.toFixed(2)} ETH claimed`, tabs = 4);
        log();

        let return_params = {};

        return_params.tx = donation_tx;
        return_params.donation_amount = donation_eth;
        return_params.contract = is_charity_test ? campaign : owner_contract;

        return return_params;

    } catch (e) {
        return { 
            tx: null, 
            get method() { return (donationClaim)() }
        }
    }
}

module.exports = {
    prepareEndParams,
    claimRefund,
    claimDonation
}