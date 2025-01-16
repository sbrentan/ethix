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
            MOCKED_MODELS.TokenSalt.redeemed = false;
            MOCKED_MODELS.Campaign.redeemableTokens = 0;
            MOCKED_MODELS.Campaign.batchRedeem = 1;
        });

        it('should correctly redeem a valid token', async () => {
            req.body = {
                token: 'valid_token',
                campaignId: MOCKED_PARAMS.CAMPAIGN_ID,
                signature: MOCKED_PARAMS.SIGNATURE.signature
            }
            const { v, r, s } = ethUtil.fromRpcSig(req.body.signature);
            
            const MANAGER_ACCOUNT = MOCKED_PARAMS.ADDRESS_ACCOUNTS['0x1'];
            await redeemToken(req, res);
            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toEqual({ message: 'Token redeemed' });

            expect(mocks.Contract_isTokenValid).toHaveBeenCalledWith(MOCKED_PARAMS.CAMPAIGN_ADDRESS, expect.anything(), {v, r, s});
            expect(mocks.Contract_isTokenValid_call).toHaveBeenCalledWith({ from: MANAGER_ACCOUNT.address })

            expect(MOCKED_MODELS.TokenSalt.save).toHaveBeenCalled();
            expect(db_mocks.TokenSalt.countDocuments).toHaveBeenCalledWith({ campaignId: MOCKED_PARAMS.CAMPAIGN_ID, redeemed: true });

            expect(db_mocks.RedeemableToken).toHaveBeenCalled();
            expect(MOCKED_MODELS.RedeemableToken.save).toHaveBeenCalled();
            expect(MOCKED_MODELS.Campaign.save).toHaveBeenCalled();

            expect(mocks.Contract_redeemTokensBatch).toHaveBeenCalledWith(MOCKED_PARAMS.CAMPAIGN_ADDRESS, expect.anything(), [{r, s, v}]);

            expect(MOCKED_MODELS.RedeemableToken.deleteOne).toHaveBeenCalledTimes(1);
        });

        it('should return 400 if the token is not valid [server token validation failed]', async () => {
            req.body = {
                token: 'invalid_server_token',
                campaignId: MOCKED_PARAMS.CAMPAIGN_ID,
                signature: MOCKED_PARAMS.SIGNATURE.signature
            }

            db_mocks.TokenSalt.findOne.mockImplementationOnce(() => ({
                exec: jest.fn(() => null)
            }));
            
            await redeemToken(req, res);
            expect(res.statusCode).toBe(400);
            expect(res._getJSONData()).toEqual({ message: 'Error redeeming token: Token not valid' });

            expect(mocks.Contract_isTokenValid).not.toHaveBeenCalled();
        });

        it('should return 400 if the token is not valid [contract token validation failed]', async () => {
            req.body = {
                token: 'invalid_contract_token',
                campaignId: MOCKED_PARAMS.CAMPAIGN_ID,
                signature: MOCKED_PARAMS.SIGNATURE.signature
            }

            mocks.Contract_isTokenValid.mockImplementationOnce(() => ({
                call: jest.fn(() => { return false; })
            }));

            await redeemToken(req, res);
            expect(res.statusCode).toBe(400);
            expect(res._getJSONData()).toEqual({ message: 'Error redeeming token: Token not valid' });

            expect(mocks.Contract_isTokenValid).toHaveBeenCalled();

            expect(MOCKED_MODELS.TokenSalt.save).not.toHaveBeenCalled();
        });

        it('should return 400 if the token is already redeemed', async () => {
            req.body = {
                token: 'redeemed_token',
                campaignId: MOCKED_PARAMS.CAMPAIGN_ID,
                signature: MOCKED_PARAMS.SIGNATURE.signature
            }

            MOCKED_MODELS.TokenSalt.redeemed = true

            await redeemToken(req, res);
            expect(res.statusCode).toBe(400);
            expect(res._getJSONData()).toEqual({ message: 'Error redeeming token: Token already redeemed' });

            expect(mocks.Contract_isTokenValid).not.toHaveBeenCalled();
        });

        it('should return 200 if the token is valid on server but the target has already been reached', async () => {
            req.body = {
                token: 'valid_token',
                campaignId: MOCKED_PARAMS.CAMPAIGN_ID,
                signature: MOCKED_PARAMS.SIGNATURE.signature
            }

            db_mocks.TokenSalt.countDocuments.mockImplementationOnce(() => ({
                exec: jest.fn(() => MOCKED_MODELS.Campaign.tokensCount)
            }));

            await redeemToken(req, res);
            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toEqual({ message: 'Token redeemed, but target has already been reached' });

            expect(mocks.Contract_isTokenValid).toHaveBeenCalled();
            expect(db_mocks.RedeemableToken).not.toHaveBeenCalled();
            expect(MOCKED_MODELS.RedeemableToken.save).not.toHaveBeenCalled();
            expect(MOCKED_MODELS.Campaign.save).not.toHaveBeenCalled();
        });

        it('should return 200 if the token is valid but it is scheduled to be redeemed in batch mode', async () => {
            req.body = {
                token: 'valid_token',
                campaignId: MOCKED_PARAMS.CAMPAIGN_ID,
                signature: MOCKED_PARAMS.SIGNATURE.signature
            }

            MOCKED_MODELS.Campaign.batchRedeem = 10;

            await redeemToken(req, res);
            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toEqual({ message: 'Token redeemed' });

            expect(mocks.Contract_isTokenValid).toHaveBeenCalled();
            expect(db_mocks.RedeemableToken).toHaveBeenCalled();
            expect(MOCKED_MODELS.RedeemableToken.save).toHaveBeenCalled();
            expect(MOCKED_MODELS.Campaign.save).toHaveBeenCalled();
            expect(mocks.Contract_redeemTokensBatch).not.toHaveBeenCalled();
        });

        it('should correctly batch redeem a group of redeemed tokens', async () => {
            req.body = {
                token: 'valid_token',
                campaignId: MOCKED_PARAMS.CAMPAIGN_ID,
                signature: MOCKED_PARAMS.SIGNATURE.signature
            }
            const { v, r, s } = ethUtil.fromRpcSig(MOCKED_MODELS.RedeemableToken.signature);
            MOCKED_MODELS.Campaign.batchRedeem = 3;

            db_mocks.RedeemableToken.find.mockImplementationOnce(() => ({
                limit: jest.fn(() => ({
                    exec: jest.fn(() => {
                        const redeemableTokens = Array(MOCKED_MODELS.Campaign.batchRedeem).fill(MOCKED_MODELS.RedeemableToken);
                        return redeemableTokens;
                    })
                }))
            }));
            
            MOCKED_MODELS.Campaign.redeemableTokens = MOCKED_MODELS.Campaign.batchRedeem - 1;

            db_mocks.RedeemableToken.countDocuments.mockImplementationOnce(() => ({
                exec: jest.fn(() => 0)
            }));

            await redeemToken(req, res);
            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toEqual({ message: 'Token redeemed' });

            expect(mocks.Contract_isTokenValid).toHaveBeenCalled();
            expect(db_mocks.RedeemableToken).toHaveBeenCalled();
            expect(MOCKED_MODELS.RedeemableToken.save).toHaveBeenCalled();
            expect(MOCKED_MODELS.Campaign.save).toHaveBeenCalled();
            expect(mocks.Contract_redeemTokensBatch).toHaveBeenCalledWith(
                MOCKED_PARAMS.CAMPAIGN_ADDRESS, Array(MOCKED_MODELS.Campaign.batchRedeem).fill(MOCKED_MODELS.RedeemableToken.token), 
                Array(MOCKED_MODELS.Campaign.batchRedeem).fill({r, s, v})
            );

            expect(MOCKED_MODELS.RedeemableToken.deleteOne).toHaveBeenCalledTimes(MOCKED_MODELS.Campaign.batchRedeem);

            expect(db_mocks.RedeemableToken.countDocuments).toHaveBeenCalled();
            expect(MOCKED_MODELS.Campaign.redeemableTokens).toBe(0);
        });
    });
});