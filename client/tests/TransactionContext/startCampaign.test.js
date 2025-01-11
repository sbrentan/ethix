const { getCharityContractMocks, getMocks, functionCaller, mockFunction, MOCKED_PARAMS } = require('./common.js');

describe('TransactionContext createCampaign tests', () => {
	const DONOR_ADDRESS = "0x8588f4d002C747C5E7B6274752B251402c77d858";
	let startCampaignParams = [MOCKED_PARAMS.CAMPAIGN_ID, MOCKED_PARAMS.CAMPAIGN_ADDRESS]
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

});