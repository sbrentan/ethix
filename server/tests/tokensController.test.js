const { MOCKED_PARAMS, mocks, db_mocks, MOCKED_MODELS } = require('./common.js');
const { generateTokens, redeemToken } = require('../controllers/tokensController.js');
const ethUtil = require('ethereumjs-util');
const httpMocks = require('node-mocks-http');
const jwt = require('jsonwebtoken');

describe('Tokens Controller', () => {
	describe('generateTokens', () => {
		let req, res;

		beforeEach(() => {
			jest.clearAllMocks();
			req = httpMocks.createRequest();
			res = httpMocks.createResponse();
			req.session = {};
			req.userId = 'testUserId'; // Mock the authenticated user ID
		});

		it('should return 400 if required fields are missing', async () => {
			req.params = {}; // No required fields provided

			await generateTokens(req, res);

			expect(res.statusCode).toBe(400);
			expect(res._getJSONData()).toEqual({ message: 'Campaign ID not provided' });
		});

        it('should return 404 if campaign is not found', async () => {
			req.params.id = MOCKED_PARAMS.CAMPAIGN_ID;
			db_mocks.Campaign.findById.mockImplementationOnce(() => ({
				exec: jest.fn(() => null)
			}));

			await generateTokens(req, res);

			expect(res.statusCode).toBe(404);
			expect(res._getJSONData()).toEqual({ message: 'Campaign not found' });
		});

        it('should return 400 if campaign is not associated with a blockchain campaign address', async () => {
			req.params.id = MOCKED_PARAMS.CAMPAIGN_ID;
            
            const tempCampaign = MOCKED_MODELS.Campaign.toObject();
            delete tempCampaign.campaignId;
            
			db_mocks.Campaign.findById.mockImplementationOnce(() => ({
				exec: jest.fn(() => tempCampaign)
			}));

			await generateTokens(req, res);

			expect(res.statusCode).toBe(400);
			expect(res._getJSONData()).toEqual({ message: 'Campaign not associated with a blockchain campaign' });
		});

        it('should return 400 if the session wallet is not found', async () => {
			req.params.id = MOCKED_PARAMS.CAMPAIGN_ID;
            req.session.wallet = '';
            
            await generateTokens(req, res);

            expect(res.statusCode).toBe(400);
            expect(res._getJSONData()).toEqual({ message: 'Wallet not found' });
        });

        it('should return 400 if the campaign seed is not defined', async () => {
            req.params.id = MOCKED_PARAMS.CAMPAIGN_ID;
            req.session.wallet = MOCKED_PARAMS.RANDOM_WALLET;
            
            const tempCampaign = MOCKED_MODELS.Campaign.toObject();
            delete tempCampaign.seed;

            db_mocks.Campaign.findById.mockImplementationOnce(() => ({
                exec: jest.fn(() => tempCampaign)
            }));

            await generateTokens(req, res);

            expect(res.statusCode).toBe(400);
            expect(res._getJSONData()).toEqual({ message: 'Campaign seed not defined' });
        });

        it('should correctly generate the tokens', async () => {
            req.params.id = MOCKED_PARAMS.CAMPAIGN_ID;
            req.session.wallet = MOCKED_PARAMS.RANDOM_WALLET;

            await generateTokens(req, res);
            expect(res.statusCode).toBe(200);

            const token_size = MOCKED_MODELS.Campaign.maxTokensCount;
            const insertMany_input_tokens = db_mocks.TokenSalt.insertMany.mock.calls[0][0];
            expect(insertMany_input_tokens.length).toBe(token_size);
            expect(insertMany_input_tokens[0].campaignId).toBe(MOCKED_MODELS.Campaign._id);
            expect(insertMany_input_tokens[0].hash).not.toBeUndefined();
            expect(insertMany_input_tokens[0].salt).not.toBeUndefined();

            const MANAGER_ACCOUNT = MOCKED_PARAMS.ADDRESS_ACCOUNTS['0x1'];
            const chunk_size = Math.floor(token_size / 100) + 1;
            expect(mocks.Contract_generateTokenHashes).toHaveBeenCalledTimes(chunk_size);
            expect(mocks.Contract_generateTokenHashes_call).toHaveBeenCalledTimes(chunk_size);
            expect(mocks.Contract_generateTokenHashes_call).toHaveBeenCalledWith({ from: MANAGER_ACCOUNT.address });  // MANAGER ACCOUNT

            expect(mocks.sign).toHaveBeenCalledTimes(token_size);
            expect(mocks.sign).toHaveBeenCalledWith(expect.anything(), MANAGER_ACCOUNT.private_key);

            // check output tokens
            const signed_tokens = res._getJSONData().signedTokens;

            // decode the signed tokens jwt
            const decoded_tokens = signed_tokens.map(token => jwt.verify(token.token, process.env.REFRESH_TOKEN_SECRET));

            // check only first token
            const token = decoded_tokens[0];
            expect(token.campaignId).toEqual(MOCKED_PARAMS.CAMPAIGN_ID);
            expect(token.campaignAddress).toBe(MOCKED_MODELS.Campaign.campaignId);
            expect(token.tokenId).not.toBeUndefined();
            expect(token.signature).toEqual(MOCKED_PARAMS.SIGNATURE.signature);

            // check expiration date is the deadline of the campaign
            const deadline = Math.floor(MOCKED_MODELS.Campaign.deadline.getTime() / 1000);
            expect(token.exp).toEqual(deadline);

            // check if the campaign seed in the db is deleted
            expect(db_mocks.Campaign.findByIdAndUpdate).toHaveBeenCalledWith(MOCKED_MODELS.Campaign._id, { seed: undefined });
        });

        it('should correctly generate a bigger number of tokens chunking the contract calls', async () => {
            req.params.id = MOCKED_PARAMS.CAMPAIGN_ID;
            req.session.wallet = MOCKED_PARAMS.RANDOM_WALLET;

            const token_size = 150;
            const tempCampaign = MOCKED_MODELS.Campaign.toObject();
            tempCampaign.maxTokensCount = token_size;

            const initial_t2_tokens = MOCKED_PARAMS.T2_TOKENS;
            const tokens_seed = 'tokens_seed';
            MOCKED_PARAMS.T2_TOKENS = [];
            for (let i = 0; i < token_size; i++) {
                MOCKED_PARAMS.T2_TOKENS.push({
                    token: require('crypto').createHash('sha256').update(tokens_seed + i).digest('hex'),
                    redeemed: false,
                });
            }

            db_mocks.Campaign.findById.mockImplementationOnce(() => ({
                exec: jest.fn(() => tempCampaign)
            }));

            await generateTokens(req, res);
            expect(res.statusCode).toBe(200);

            const insertMany_input_tokens = db_mocks.TokenSalt.insertMany.mock.calls[0][0];
            expect(insertMany_input_tokens.length).toBe(token_size);

            const chunk_size = Math.floor(token_size / 100) + 1;
            expect(mocks.Contract_generateTokenHashes).toHaveBeenCalledTimes(chunk_size);
            expect(mocks.Contract_generateTokenHashes_call).toHaveBeenCalledTimes(chunk_size);

            MOCKED_PARAMS.T2_TOKENS = initial_t2_tokens;
        });
            
    });

    describe("redeemToken", () => {

        let req, res;
        
        beforeEach(() => {
			jest.clearAllMocks();
			req = httpMocks.createRequest();
			res = httpMocks.createResponse();
        });

        it('should correctly redeem a valid token', async () => {
            req.params = { token: 'valid_token' };
            req.body = {
                token: 'valid_token',
                campaignId: MOCKED_PARAMS.CAMPAIGN_ID,
                signature: MOCKED_PARAMS.SIGNATURE.signature
            }
            const { v, r, s } = ethUtil.fromRpcSig(req.body.signature);

            console.log(v, r, s)

            // db_mocks.TokenSalt.findOne.mockImplementationOnce(() => ({
            //     exec: jest.fn(() => ({ token: token }))
            // }));

            // db_mocks.TokenSalt.countDocuments.mockImplementationOnce(() => ({
            //     exec: jest.fn(() => 0)
            // }));

            // db_mocks.RedeemableToken.find.mockImplementationOnce(() => ({
            //     limit: jest.fn(() => ({
            //         exec: jest.fn(() => [MOCKED_MODELS.RedeemableToken])
            //     }))
            // }));
            
            const MANAGER_ACCOUNT = MOCKED_PARAMS.ADDRESS_ACCOUNTS['0x1'];
            await redeemToken(req, res);
            // expect(res.statusCode).toBe(200);
            // expect(res._getJSONData()).toEqual({ message: 'Token redeemed' });

            expect(mocks.Contract_isTokenValid).toHaveBeenCalledWith(MOCKED_PARAMS.CAMPAIGN_ADDRESS, expect.anything(), {v, r, s});
            expect(mocks.Contract_isTokenValid_call).toHaveBeenCalledWith({ from: MANAGER_ACCOUNT.address })

            expect(MOCKED_MODELS.TokenSalt.save).toHaveBeenCalled();
            expect(db_mocks.TokenSalt.countDocuments).toHaveBeenCalledWith({ campaignId: MOCKED_PARAMS.CAMPAIGN_ID, redeemed: true });

            expect(MOCKED_MODELS.RedeemableToken.save).toHaveBeenCalled();
            expect(MOCKED_MODELS.Campaign.save).toHaveBeenCalled();

            expect(mocks.Contract_redeemTokensBatch).toHaveBeenCalledWith(MOCKED_PARAMS.CAMPAIGN_ADDRESS, expect.anything(), [{r, s, v}]);
        });

    });
});