const { MOCKED_PARAMS, mocks, db_mocks, MOCKED_MODELS } = require('./common.js');
const { createNewCampaign, generateRandomWallet } = require('../controllers/campaignsController.js');
const httpMocks = require('node-mocks-http');
const { encodePacked } = require('../config/web3.js');

describe('Campaigns Controller', () => {
	describe('createNewCampaign', () => {
		let req, res;
		const createCampaignParamsDraft = Object.freeze({
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
		});
		const createCampaignParams = Object.freeze({
			...createCampaignParamsDraft,
			draft: false,
			campaignAddress: MOCKED_PARAMS.CAMPAIGN_ADDRESS,
			seedHash: MOCKED_PARAMS.SEED_HASH,
			batchRedeem: 30,
		});

		beforeEach(() => {
			jest.clearAllMocks();
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
			req.body = createCampaignParamsDraft;
			
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
			expect(db_mocks.Campaign.create).not.toHaveBeenCalled(); // Ensure campaign is not created
		});

		it('should create a new campaign on db with correct params if the campaign is not a draft', async () => {
			req.body = createCampaignParams;
			req.session.seed = MOCKED_PARAMS.SEED;

			await createNewCampaign(req, res);

			expect(res.statusCode).toBe(201);
			expect(res._getJSONData().message).toEqual(`New campaign ${req.body.title} created`);

			expect(mocks.randomHex).not.toHaveBeenCalled();
			expect(mocks.keccak256).toHaveBeenCalled();
			expect(mocks.sign).not.toHaveBeenCalled();
			expect(db_mocks.Campaign.create).toHaveBeenCalledWith({
				batchRedeem: createCampaignParams.batchRedeem,
				blockNumber: MOCKED_PARAMS.BLOCK_NUMBER,
				campaignId: createCampaignParams.campaignAddress,
				createdBy: req.userId,
				deadline: createCampaignParams.deadline,
				description: createCampaignParams.description,
				donor: req.userId,
				image: createCampaignParams.image,
				maxTokensCount: createCampaignParams.maxTokensCount,
				receiver: createCampaignParams.receiver,
				seed: MOCKED_PARAMS.SEED,
				startingDate: createCampaignParams.startingDate,
				target: createCampaignParams.target,
				targetEur: createCampaignParams.targetEur,
				title: createCampaignParams.title,
				tokensCount: createCampaignParams.tokensCount,
			});
		});

		it('should return 400 if seed hash is not valid on campaign creation', async () => {
			req.body = structuredClone(createCampaignParams);
			req.body.seedHash = 'invalidSeedHash';
			req.session.seed = MOCKED_PARAMS.SEED;
			
			await createNewCampaign(req, res);

			expect(res.statusCode).toBe(400);
			expect(res._getJSONData()).toEqual({ message: 'Seed is not valid' });
			expect(db_mocks.Campaign.create).not.toHaveBeenCalled();
		});
		
		it('should return 400 if wrong params provided on campaign creation', async () => {
			req.body = {};
			req.session.seed = MOCKED_PARAMS.SEED;

			await createNewCampaign(req, res);

			expect(res.statusCode).toBe(400);
			expect(res._getJSONData()).toEqual({ message: 'All fields are required' });
			expect(db_mocks.Campaign.create).not.toHaveBeenCalled();
		});

		it('should return 400 if campaign address is not provided on campaign creation', async () => {
			req.body = structuredClone(createCampaignParams);
			req.body.campaignAddress = '';
			req.session.seed = MOCKED_PARAMS.SEED;

			await createNewCampaign(req, res);

			expect(res.statusCode).toBe(400);
			expect(res._getJSONData()).toEqual({ message: 'Campaign address is required' });
			expect(db_mocks.Campaign.create).not.toHaveBeenCalled();
		});

		it('should update batchRedeem to tokensCount if batchRedeem is lower than tokensCount on campaign creation', async () => {
			req.body = structuredClone(createCampaignParams);
			req.body.batchRedeem = createCampaignParams.tokensCount - 1;
			req.session.seed = MOCKED_PARAMS.SEED;

			await createNewCampaign(req, res);

			expect(res.statusCode).toBe(201);
			expect(res._getJSONData().message).toEqual(`New campaign ${req.body.title} created`);

			expect(db_mocks.Campaign.create).toHaveBeenCalledWith({
				blockNumber: MOCKED_PARAMS.BLOCK_NUMBER,
				campaignId: createCampaignParams.campaignAddress,
				createdBy: req.userId,
				deadline: createCampaignParams.deadline,
				description: createCampaignParams.description,
				donor: req.userId,
				image: createCampaignParams.image,
				maxTokensCount: createCampaignParams.maxTokensCount,
				receiver: createCampaignParams.receiver,
				seed: MOCKED_PARAMS.SEED,
				startingDate: createCampaignParams.startingDate,
				target: createCampaignParams.target,
				targetEur: createCampaignParams.targetEur,
				title: createCampaignParams.title,
				batchRedeem: createCampaignParams.tokensCount,
				tokensCount: createCampaignParams.tokensCount,
			});
		});

		it('should return 500 if an error occurs on campaign creation', async () => {
			console.log(createCampaignParams);
			console.log(MOCKED_PARAMS.SEED_HASH);
			req.body = createCampaignParams;
			req.session.seed = MOCKED_PARAMS.SEED;
			db_mocks.Campaign.create.mockRejectedValue(new Error('Test error'));

			await createNewCampaign(req, res);

			expect(res.statusCode).toBe(500);
			expect(res._getJSONData().message).toEqual("Something went wrong!");
			expect(db_mocks.Campaign.create).toHaveBeenCalled();
		});
	});

	describe('generateRandomWallet', () => {
		let req, res;

		beforeEach(() => {
			jest.clearAllMocks();
			req = httpMocks.createRequest();
			res = httpMocks.createResponse();
			req.session = {};
			req.userId = 'testUserId'; // Mock the authenticated user ID
		});

		it('should correctly generate a random wallet for a campaign', async () => {
			req.params.id = MOCKED_PARAMS.CAMPAIGN_ID;

			await generateRandomWallet(req, res);

			expect(res.statusCode).toBe(200);

			expect(mocks.accounts_create).toHaveBeenCalled();
			expect(mocks.sign).toHaveBeenCalledWith(
				encodePacked(res._getJSONData().address, MOCKED_PARAMS.CAMPAIGN_ADDRESS),
				process.env.WEB3_MANAGER_PRIVATE_KEY
			);
			expect(req.session.wallet.address).toEqual(res._getJSONData().address);

			console.log(res._getJSONData())
			let tempCampaign = MOCKED_MODELS.Campaign.toObject();
			tempCampaign.startingDate = tempCampaign.startingDate.toISOString();
			tempCampaign.deadline = tempCampaign.deadline.toISOString();
			tempCampaign._id = tempCampaign._id.toString();
			tempCampaign.createdBy = tempCampaign.createdBy.toString();
			tempCampaign.donor = tempCampaign.donor.toString();
			expect(res._getJSONData()).toEqual({
				address: MOCKED_PARAMS.ADDRESS_ACCOUNTS['0x2'].address,
				campaign: tempCampaign,
				signature: MOCKED_PARAMS.SIGNATURE,
			});
		});

		it('should return 400 if the campaign is not found', async () => {
			req.params.id = '';

			await generateRandomWallet(req, res);

			expect(res.statusCode).toBe(400);
			expect(res._getJSONData()).toEqual({ message: 'Campaign not found' });
		});

		it('should return 400 if the campaign is not associated to blockchain', async () => {
			req.params.id = MOCKED_PARAMS.CAMPAIGN_ID;

			const tempCampaign = MOCKED_MODELS.Campaign.toObject();
			delete tempCampaign.campaignId;

			db_mocks.Campaign.findById.mockImplementationOnce(() => ({
				exec: jest.fn(() => tempCampaign)
			}));

			await generateRandomWallet(req, res);

			expect(res.statusCode).toBe(400);
			expect(res._getJSONData()).toEqual({ message: 'Campaign not associated to blockchain' });
		});

		it('should return 400 if the user is not authorized to generate a wallet for the campaign', async () => {
			req.params.id = MOCKED_PARAMS.CAMPAIGN_ID;

			const tempUser = MOCKED_MODELS.User.toObject();
			tempUser._id = 'anotherUserId';

			db_mocks.User.findOne.mockImplementationOnce(() => ({
				exec: jest.fn(() => tempUser)
			}));

			await generateRandomWallet(req, res);

			expect(res.statusCode).toBe(400);
			expect(res._getJSONData()).toEqual({ message: 'User not authorized to generate wallet for this campaign' });
		});

		it('should return 400 if the seed is not found', async () => {
			req.params.id = MOCKED_PARAMS.CAMPAIGN_ID;

			const tempCampaign = MOCKED_MODELS.Campaign.toObject();
			delete tempCampaign.seed;

			db_mocks.Campaign.findById.mockImplementationOnce(() => ({
				exec: jest.fn(() => tempCampaign)
			}));

			await generateRandomWallet(req, res);

			expect(res.statusCode).toBe(400);
			expect(res._getJSONData()).toEqual({ message: 'Seed not found' });
		});
	});
});