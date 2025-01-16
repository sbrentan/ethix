const { getCharityContractMocks, getMocks, functionCaller, mockFunction, MOCKED_PARAMS } = require('./common.js');

describe('TransactionContext createCampaign tests', () => {
	const DONOR_ADDRESS = "0x8588f4d002C747C5E7B6274752B251402c77d858";
	const RECEIVER_ADDRESS = "0xc05B7bC6Bde92F8e6820fD47c7e23DFE01869886";
	let createCampaignParams = [1000, 'Test Campaign', 'A test description', 'image-url', Date.now(), Date.now() + 7 * 24 * 60 * 60 * 1000, 1.5, 100, 200, DONOR_ADDRESS, 'Receiver123', RECEIVER_ADDRESS]
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

	it('should call Charity.createCampaign with correct parameters', async () => {
		const connectedAccount = DONOR_ADDRESS;
		const mocks = getMocks(connectedAccount, {
			charityContract: charityContractMock
		});


		let result = await functionCaller("createCampaign", createCampaignParams, mocks.funcs);
		expect(result).toBe(true);

		expect(mocks.mocks.isOrganizationVerified).toHaveBeenCalled();
		expect(charityContractMocks.createCampaign).toHaveBeenCalled();
		expect(mocks.mocks.setCampaign).toHaveBeenCalledTimes(2);
		expect(mocks.mocks.initCampaign).toHaveBeenCalledTimes(2);

		let contractMethodParams = [
			"Test Campaign",
			Math.floor(createCampaignParams[4] / 1000),
			Math.floor(createCampaignParams[5] / 1000),
			100,
			200,
			RECEIVER_ADDRESS,
			MOCKED_PARAMS.SEED_HASH,
			MOCKED_PARAMS.SIGNATURE
		];

		expect(charityContractMocks.createCampaign).toHaveBeenCalledWith(...contractMethodParams);
	});

	it('should fail if contract call fails', async () => {
		const connectedAccount = DONOR_ADDRESS;
		let createCampaignMock = mockFunction(() => ({ send: () => { throw new Error("Campaign creation failed") } }));
		charityContractMock.methods.createCampaign = createCampaignMock.func;
		const mocks = getMocks(connectedAccount, {
			charityContract: charityContractMock,
		});

		let result = await functionCaller("createCampaign", createCampaignParams, mocks.funcs);
		expect(result).toBe(false);

		expect(mocks.mocks.isOrganizationVerified).toHaveBeenCalled();
		expect(createCampaignMock.mock).toHaveBeenCalled();
		expect(mocks.mocks.setCampaign).not.toHaveBeenCalled();
		expect(mocks.mocks.initCampaign).toHaveBeenCalledTimes(1);
	});

	it('should fail if organization is not verified', async () => {
		const connectedAccount = DONOR_ADDRESS;
		const mocks = getMocks(connectedAccount, {
			charityContract: charityContractMock,
			isOrganizationVerified: jest.fn().mockResolvedValue(false),
		});

		let result = await functionCaller("createCampaign", createCampaignParams, mocks.funcs);
		expect(result).toBe(false);

		expect(mocks.mocks.isOrganizationVerified).toHaveBeenCalled();
		expect(charityContractMocks.createCampaign).not.toHaveBeenCalled();
		expect(mocks.mocks.setCampaign).not.toHaveBeenCalled();
		expect(mocks.mocks.initCampaign).not.toHaveBeenCalled();
	});

	it('should fail if called without params', async () => {
		const connectedAccount = DONOR_ADDRESS;
		const mocks = getMocks(connectedAccount, {
			charityContract: charityContractMock,
		});

		let result = await functionCaller("createCampaign", [], mocks.funcs);
		expect(result).toBe(false);

		expect(mocks.mocks.isOrganizationVerified).not.toHaveBeenCalled();
		expect(charityContractMocks.createCampaign).not.toHaveBeenCalled();
		expect(mocks.mocks.setCampaign).not.toHaveBeenCalled();
		expect(mocks.mocks.initCampaign).not.toHaveBeenCalled();
	});

	it('should fail if not connected', async () => {
		const connectedAccount = null;
		const mocks = getMocks(connectedAccount, {
			charityContract: charityContractMock,
		});

		let result = await functionCaller("createCampaign", createCampaignParams, mocks.funcs);
		expect(result).toBe(undefined);

		expect(mocks.mocks.isOrganizationVerified).not.toHaveBeenCalled();
		expect(charityContractMocks.createCampaign).not.toHaveBeenCalled();
		expect(mocks.mocks.setCampaign).not.toHaveBeenCalled();
		expect(mocks.mocks.initCampaign).not.toHaveBeenCalled();

		expect(mocks.mocks.alert).toHaveBeenCalledWith("Please connect your wallet.");
	});

	it('should fail if metamask is not installed', async () => {
		const connectedAccount = DONOR_ADDRESS;
		const mocks = getMocks(connectedAccount, {
			charityContract: charityContractMock,
			window: { ethereum: null }
		});

		let result = await functionCaller("createCampaign", createCampaignParams, mocks.funcs);
		expect(result).toBe(undefined);

		expect(mocks.mocks.isOrganizationVerified).not.toHaveBeenCalled();
		expect(charityContractMocks.createCampaign).not.toHaveBeenCalled();
		expect(mocks.mocks.setCampaign).not.toHaveBeenCalled();
		expect(mocks.mocks.initCampaign).not.toHaveBeenCalled();

		expect(mocks.mocks.alert).toHaveBeenCalledWith("Please install MetaMask.");
	});
});