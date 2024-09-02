const { 
    log,
    increaseTime 
} = require('../../../common/utils.js');
const {
    DEFAULT_STARTDATE_SHIFT,
    DEFAULT_DEADLINE_SHIFT
} = require('../../../common/constants.js');

const claimRefund = async (contract, campaignAddress) => {  
    const refundClaim = () => contract.claimRefund(campaignAddress);     
    try {

        await increaseTime(DEFAULT_STARTDATE_SHIFT + DEFAULT_DEADLINE_SHIFT + 1);

        log();
        log(`Campaign has ended...`, tabs = 3, sep = '');
        log();

        const refund_tx = await refundClaim();
		const refund_receipt = await refund_tx.wait();
		const refund_amount = refund_receipt?.logs[0]?.data;
        const refund_eth = Number(web3.utils.fromWei(refund_amount, 'ether'));

        log(`Refund process:`, tabs = 3, sep = '');
        log(`Refund amount of ${refund_eth.toFixed(2)} ETH claimed`, tabs = 4);
        log();

        return { tx: refund_tx, refund_amount: refund_eth }

    } catch (e) {
        return { 
            tx: null, 
            get method() { return (refundClaim)() }
        }
    }
}

const claimDonation = async (contract, campaignAddress) => {  
    const donationClaim = () => contract.claimDonation(campaignAddress);     
    try {

        await increaseTime(DEFAULT_STARTDATE_SHIFT + DEFAULT_DEADLINE_SHIFT + 1);

        log();
        log(`Campaign has ended...`, tabs = 3, sep = '');
        log();

        const donation_tx = await donationClaim();
		const donation_receipt = await donation_tx.wait();
		const donation_amount = donation_receipt?.logs[0]?.data;
        const donation_eth = Number(web3.utils.fromWei(donation_amount, 'ether'));

        log(`Donation process:`, tabs = 3, sep = '');
        log(`Donation amount of ${donation_eth.toFixed(2)} ETH claimed`, tabs = 4);
        log();

        return { tx: donation_tx, donation_amount: donation_eth }

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