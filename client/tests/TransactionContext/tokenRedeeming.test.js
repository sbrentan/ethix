const { MOCKED_PARAMS, getCharityContractMocks, getMocks, functionCaller } = require('./common.js');

describe('TransactionContext token redeeming', () => {
    const OTHER_ADDRESS = "0xc05B7bC6Bde92F8e6820fD47c7e23DFE01869886";
    let redeemTokenParams = [MOCKED_PARAMS.CAMPAIGN_ID, MOCKED_PARAMS.TOKEN_ID, MOCKED_PARAMS.SIGNATURE];
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

    it('should call redeemToken with correct parameters', async () => {
        const connectedAccount = OTHER_ADDRESS;
        const mocks = getMocks(connectedAccount, {
            charityContract: charityContractMock,
        });

        let result = await functionCaller("redeemToken", redeemTokenParams, mocks.funcs);
        expect(result).toBe(true);

        let params = {
            campaignId: MOCKED_PARAMS.CAMPAIGN_ID,
            token: MOCKED_PARAMS.TOKEN_ID,
            signature: MOCKED_PARAMS.SIGNATURE
        }

        expect(mocks.mocks.claimToken).toHaveBeenCalledWith(params);
    });

    it('should fail to redeemToken with invalid parameters', async () => {
        const connectedAccount = OTHER_ADDRESS;
        const mocks = getMocks(connectedAccount, {
            charityContract: charityContractMock,
        });

        let result = await functionCaller("redeemToken", [], mocks.funcs);
        expect(result).toBe(false);

        expect(mocks.mocks.claimToken).not.toHaveBeenCalled();
    });
});