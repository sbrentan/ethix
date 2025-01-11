process.env.WEB3_NETWORK_ADDRESS = 'http://fake:8545';
process.env.WEB3_MANAGER_PRIVATE_KEY = '0x1'
process.env.WEB3_CONTRACT_ADDRESS = '0x2'

const MOCKED_PARAMS = {
	SEED: 'mockSeed',
	SEED_HASH: 'mockSeedHash',
	SIGNATURE: { r: 'r', s: 's', v: 'v' },
	ADDRESS_ACCOUNTS: {
		'0x1': {
			address: '0x3',
			privateKey: '0x1',
		},
	}
};

let mocks = {
	randomHex: jest.fn(() => MOCKED_PARAMS.SEED),
	keccak256: jest.fn(() => MOCKED_PARAMS.SEED_HASH),
	sign: jest.fn(() => MOCKED_PARAMS.SIGNATURE),
	privateKeyToAccount: jest.fn((private_key) => MOCKED_PARAMS.ADDRESS_ACCOUNTS[private_key]),
	wallet_add: jest.fn(),
	getBlockNumber: jest.fn(),
	Contract_createCampaign: jest.fn(),
};

jest.mock('web3', () => ({
	Web3: jest.fn().mockImplementation(() => ({
		utils: {
			randomHex: mocks.randomHex,
			keccak256: mocks.keccak256,
		},
		eth: {
			accounts: {
				sign: mocks.sign,
				privateKeyToAccount: mocks.privateKeyToAccount,
				wallet: {
					add: mocks.wallet_add
				}
			},
			getBlockNumber: mocks.getBlockNumber,
			Contract: jest.fn().mockImplementation(() => ({
				methods: {
					createCampaign: mocks.Contract_createCampaign,
				},
			})),
		},
	})),
}));
const { Web3 } = require('web3');
const web3 = new Web3();

const { createNewCampaign } = require('../controllers/campaignsController.js');
const httpMocks = require('node-mocks-http');

jest.mock('../models/Campaign', () => ({
	create: jest.fn(),
}));

describe('createNewCampaign', () => {
	let req, res;
	let createCampaignParams = {
		target: 100,
		targetEur: 50,
		tokensCount: 10,
		maxTokensCount: 20,
		title: 'Campaign Title',
		image: 'Image URL',
		description: 'Campaign Description',
		startingDate: '2025-01-10',
		deadline: '2025-12-31',
		receiver: 'Receiver ID',
		draft: true,
	}

	beforeEach(() => {
		req = httpMocks.createRequest();
		res = httpMocks.createResponse();
		req.session = {};
		req.userId = 'testUserId'; // Mock the authenticated user ID
	});

	it('should return 400 if required fields are missing', async () => {
		req.body = {}; // No required fields provided

		await createNewCampaign(req, res);

		expect(res.statusCode).toBe(400);
		expect(res._getJSONData()).toEqual({ message: 'All fields are required' });
	});

	it('should return 200 and seedHash if the campaign is a draft', async () => {
		_createCampaignParams = { ...createCampaignParams, draft: true };
		req.body = _createCampaignParams;

		await createNewCampaign(req, res);

		expect(res.statusCode).toBe(200);
		expect(res._getJSONData()).toEqual({
			message: 'Validation passed',
			seedHash: MOCKED_PARAMS.SEED_HASH,
			signature: MOCKED_PARAMS.SIGNATURE,
		});
		expect(req.session.seed).toBe(MOCKED_PARAMS.SEED); // Ensure seed is stored in session

		expect(mocks.randomHex).toHaveBeenCalled();
		expect(mocks.keccak256).toHaveBeenCalledWith(MOCKED_PARAMS.SEED);
		expect(mocks.sign).toHaveBeenCalledWith(
			MOCKED_PARAMS.SEED_HASH, MOCKED_PARAMS.ADDRESS_ACCOUNTS[process.env.WEB3_MANAGER_PRIVATE_KEY].privateKey
		);
	});
});
