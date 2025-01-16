const { 
    log,
    increaseTime
} = require('../../../common/utils.js');
const { getCampaign } = require('./common-helper.js');
const {
    DEFAULT_STARTDATE_SHIFT,
    DEFAULT_DEADLINE_SHIFT
} = require('../../../common/constants.js');

const prepareEndParams = async (params = {}) => {

    const _from = params?.from?.address || web3.eth.accounts.create().address;
    const _increaseTime = params?.increaseTime === false ? false : true;

    log();
    log(`End params:`, tabs = 3, sep = '');
    log(`From: ${_from}`);
    log(`Increase time: ${_increaseTime}`);

    return {
        from: _from,
        increaseTime: _increaseTime
    }
}

const claimRefund = async (signers, params) => {

    const owner_contract = signers.owner.contract;
    
    const refundClaim = () => owner_contract.claimRefund(params.from);
         
    try {

        if (params.increaseTime){
            await increaseTime(DEFAULT_STARTDATE_SHIFT + DEFAULT_DEADLINE_SHIFT + 1);

            log();
            log(`Campaign has ended...`, tabs = 3, sep = '');
            log();
        }

        const refund_tx = await refundClaim();

        log(`Refund done.`, tabs = 3, sep = '');
        log();

        const details = await getCampaign(owner_contract);

        return {
            tx: refund_tx,
            details: details
        }

    } catch (e) {
        return { 
            tx: null, 
            get method() { return (refundClaim)() }
        }
    }
}

const claimDonation = async (signers, params) => { 
    
    const owner_contract = signers.owner.contract;
    
    const donationClaim = () => owner_contract.claimDonation(params.from);
  
    try {

        if (params.increaseTime){
            await increaseTime(DEFAULT_STARTDATE_SHIFT + DEFAULT_DEADLINE_SHIFT + 1);

            log();
            log(`Campaign has ended...`, tabs = 3, sep = '');
            log();
        }

        const donation_tx = await donationClaim();

        log(`Donation done.`, tabs = 3, sep = '');
        log();

        const details = await getCampaign(owner_contract);

        return {
            tx: donation_tx,
            details: details
        }

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