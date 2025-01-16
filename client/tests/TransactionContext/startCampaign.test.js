const { getCharityContractMocks, getMocks, functionCaller, mockFunction, MOCKED_PARAMS } = require('./common.js');
import Web3 from 'web3';

describe('TransactionContext createCampaign tests', () => {
	const DONOR_ADDRESS = "0x8588f4d002C747C5E7B6274752B251402c77d858";
	let startCampaignParams = [{ campaignId: MOCKED_PARAMS.CAMPAIGN_ID, campaignAddress: MOCKED_PARAMS.CAMPAIGN_ADDRESS}];
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

	it('should call CharityContract.startCampaign with the correct parameters', async () => {
		let send_mock = mockFunction(() => ({ events: { CampaignCreated: { returnValues: { campaignId: MOCKED_PARAMS.CAMPAIGN_ID, } } } }));
		let start_mock = mockFunction(() => ({ send: send_mock.func}));
		charityContractMock.methods.startCampaign = start_mock.func;

		const connectedAccount = DONOR_ADDRESS;
		const mocks = getMocks(connectedAccount, {
			charityContract: charityContractMock
		});

		let result = await functionCaller("startCampaign", startCampaignParams, mocks.funcs);
		expect(result).toMatch(/^blob:.+/);
		

		expect(mocks.mocks.generateRandomWallet).toHaveBeenCalled();
		expect(start_mock.mock).toHaveBeenCalled();
		expect(send_mock.mock).toHaveBeenCalled();

		let contractMethodParams = [
			MOCKED_PARAMS.CAMPAIGN_ADDRESS,
			MOCKED_PARAMS.SEED,
			MOCKED_PARAMS.RANDOM_WALLET,
			MOCKED_PARAMS.SIGNATURE
		];

		const web3 = new Web3(window.ethereum);
		expect(start_mock.mock).toHaveBeenCalledWith(...contractMethodParams);
		expect(send_mock.mock).toHaveBeenCalledWith({ 
			from: DONOR_ADDRESS, 
			value: web3.utils.toWei(String(MOCKED_PARAMS.TARGET_ETH), 'ether')
		});

		// restore the original mock function
		let temp = getCharityContractMocks();
		charityContractMocks = temp.mocks;
		charityContractMock = temp.charityContract;
	});

	it('should fail if contract call fails', async () => {
		const connectedAccount = DONOR_ADDRESS;
		let startCampaignMock = mockFunction(() => ({ send: () => { throw new Error("Campaign start failed") } }));
		charityContractMock.methods.startCampaign = startCampaignMock.func;
		const mocks = getMocks(connectedAccount, {
			charityContract: charityContractMock,
		});

		let result = await functionCaller("startCampaign", startCampaignParams, mocks.funcs);
		expect(result).toEqual(null);

		expect(mocks.mocks.generateRandomWallet).toHaveBeenCalled();
		expect(startCampaignMock.mock).toHaveBeenCalled();
		expect(mocks.mocks.setCampaign).not.toHaveBeenCalled();
		expect(mocks.mocks.generateCampaignTokens).not.toHaveBeenCalled();
	});

	it('should fail if wallet generation fails', async () => {
		const connectedAccount = DONOR_ADDRESS;
		const mocks = getMocks(connectedAccount, {
			charityContract: charityContractMock,
			generateRandomWallet: () => ({ error: { data: { message: "Failed to generate wallet" } } })
		});

		let result = await functionCaller("startCampaign", startCampaignParams, mocks.funcs);
		console.log(result)
		expect(result).toEqual(null);

		expect(mocks.mocks.generateRandomWallet).toHaveBeenCalled();
		expect(mocks.mocks.generateCampaignTokens).not.toHaveBeenCalled();
		expect(mocks.mocks.setCampaign).not.toHaveBeenCalled();
	});

	it('should fail if called without params', async () => {
		const connectedAccount = DONOR_ADDRESS;
		const mocks = getMocks(connectedAccount, {
			charityContract: charityContractMock,
		});

		let result = await functionCaller("startCampaign", [{}], mocks.funcs);
		expect(result).toEqual(null);

		expect(mocks.mocks.generateRandomWallet).not.toHaveBeenCalled();
		expect(mocks.mocks.generateCampaignTokens).not.toHaveBeenCalled();
		expect(mocks.mocks.setCampaign).not.toHaveBeenCalled();
	});

	it('should fail if not connected', async () => {
		const connectedAccount = null;
		const mocks = getMocks(connectedAccount, {
			charityContract: charityContractMock,
		});

		let result = await functionCaller("startCampaign", startCampaignParams, mocks.funcs);
		expect(result).toEqual(undefined);

		expect(mocks.mocks.generateRandomWallet).not.toHaveBeenCalled();
		expect(mocks.mocks.generateCampaignTokens).not.toHaveBeenCalled();
		expect(mocks.mocks.setCampaign).not.toHaveBeenCalled();

		expect(mocks.mocks.alert).toHaveBeenCalled();
	});

	it('should fail if metamask is not installed', async () => {
		const connectedAccount = DONOR_ADDRESS;
		const mocks = getMocks(connectedAccount, {
			charityContract: charityContractMock,
			window: { ethereum: null }
		});

		let result = await functionCaller("startCampaign", startCampaignParams, mocks.funcs);
		expect(result).toEqual(undefined);

		expect(mocks.mocks.generateRandomWallet).not.toHaveBeenCalled();
		expect(mocks.mocks.generateCampaignTokens).not.toHaveBeenCalled();
		expect(mocks.mocks.setCampaign).not.toHaveBeenCalled();

		expect(mocks.mocks.alert).toHaveBeenCalled();
	});
});
