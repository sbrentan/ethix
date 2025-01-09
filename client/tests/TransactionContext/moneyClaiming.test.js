const { MOCKED_PARAMS, getCharityContractMocks, getMocks, functionCaller,  mockFunction } = require('./common.js');

describe('TransactionContext money claiming', () => {
    describe('claimRefund tests', () => {
        const DONOR_ADDRESS = "0x8588f4d002C747C5E7B6274752B251402c77d858";
        let claimRefundParams = [MOCKED_PARAMS.CAMPAIGN_ID]
        let charityContractMocks = {};
        let charityContractMock = null;

        beforeAll(() => {
            let temp = getCharityContractMocks();
            charityContractMocks = temp.mocks;
            charityContractMock = temp.charityContract;
        });

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should call Charity.claimRefund with correct parameters', async () => {
            const connectedAccount = DONOR_ADDRESS;
            const mocks = getMocks(connectedAccount, {
                charityContract: charityContractMock
            });
            
            let result = await functionCaller("claimRefund", claimRefundParams, mocks.funcs);
            expect(result).toBe(MOCKED_PARAMS.REFUNDED_AMOUNT);

            expect(charityContractMocks.claimRefund).toHaveBeenCalledWith(...claimRefundParams);
            expect(mocks.mocks.setCampaign).toHaveBeenCalledTimes(1);
        });

        it('should fail if contract call fails', async () => {
            const connectedAccount = DONOR_ADDRESS;
            let claimRefundMock = mockFunction(() => ({ send: () => { throw new Error("Refund already claimed") } }));
            charityContractMock.methods.claimRefund = claimRefundMock.func;
            const mocks = getMocks(connectedAccount, {
                charityContract: charityContractMock,
            });

            let result = await functionCaller("claimRefund", claimRefundParams, mocks.funcs);
            expect(result).toBe(0);

            expect(claimRefundMock.mock).toHaveBeenCalled();
            expect(mocks.mocks.setCampaign).not.toHaveBeenCalled();
        });

        it('should fail if metaMask is not installed', async () => {
            const connectedAccount = DONOR_ADDRESS;
            const mocks = getMocks(connectedAccount, {
                charityContract: charityContractMock,
                window: { ethereum: null }
            });

            let result = await functionCaller("claimRefund", claimRefundParams, mocks.funcs);
            expect(result).toBe(undefined);

            expect(charityContractMocks.claimRefund).not.toHaveBeenCalled();
            expect(mocks.mocks.setCampaign).not.toHaveBeenCalled();
        });

        it('should fail if wallet is not connected', async () => {
            const connectedAccount = null;
            const mocks = getMocks(connectedAccount, {
                charityContract: charityContractMock
            });

            let result = await functionCaller("claimRefund", claimRefundParams, mocks.funcs);
            expect(result).toBe(undefined);

            expect(charityContractMocks.claimRefund).not.toHaveBeenCalled();
            expect(mocks.mocks.setCampaign).not.toHaveBeenCalled();
        });
    });

    describe('claimDonation tests', () => {
        const BENEFICIARY_ADDRESS = "0x8588f4d002C747C5E7B6274752B251402c77d858";
        let claimDonationParams = [MOCKED_PARAMS.CAMPAIGN_ID]
        let charityContractMocks = {};
        let charityContractMock = null;

        beforeAll(() => {
            let temp = getCharityContractMocks();
            charityContractMocks = temp.mocks;
            charityContractMock = temp.charityContract;
        });

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should call Charity.claimDonation with correct parameters', async () => {
            const connectedAccount = BENEFICIARY_ADDRESS;
            const mocks = getMocks(connectedAccount, {
                charityContract: charityContractMock
            });
            
            let result = await functionCaller("claimDonation", claimDonationParams, mocks.funcs);
            expect(result).toBe(MOCKED_PARAMS.REFUNDED_AMOUNT);

            expect(charityContractMocks.claimDonation).toHaveBeenCalledWith(...claimDonationParams);
            expect(mocks.mocks.setCampaign).toHaveBeenCalledTimes(1);
        });

        it('should fail if contract call fails', async () => {
            const connectedAccount = BENEFICIARY_ADDRESS;
            let claimDonationMock = mockFunction(() => ({ send: () => { throw new Error("Donation already claimed") } }));
            charityContractMock.methods.claimDonation = claimDonationMock.func;
            const mocks = getMocks(connectedAccount, {
                charityContract: charityContractMock,
            });

            let result = await functionCaller("claimDonation", claimDonationParams, mocks.funcs);
            expect(result).toBe(0);

            expect(claimDonationMock.mock).toHaveBeenCalled();
            expect(mocks.mocks.setCampaign).not.toHaveBeenCalled();
        });

        it('should fail if metaMask is not installed', async () => {
            const connectedAccount = BENEFICIARY_ADDRESS;
            const mocks = getMocks(connectedAccount, {
                charityContract: charityContractMock,
                window: { ethereum: null }
            });

            let result = await functionCaller("claimDonation", claimDonationParams, mocks.funcs);
            expect(result).toBe(undefined);

            expect(charityContractMocks.claimDonation).not.toHaveBeenCalled();
            expect(mocks.mocks.setCampaign).not.toHaveBeenCalled();
        });

        it('should fail if wallet is not connected', async () => {
            const connectedAccount = null;
            const mocks = getMocks(connectedAccount, {
                charityContract: charityContractMock
            });

            let result = await functionCaller("claimDonation", claimDonationParams, mocks.funcs);
            expect(result).toBe(undefined);

            expect(charityContractMocks.claimDonation).not.toHaveBeenCalled();
            expect(mocks.mocks.setCampaign).not.toHaveBeenCalled();
        });
    });
});