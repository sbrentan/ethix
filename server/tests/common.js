const fs = require('fs');
const path = require('path');

if (process.env.NODE_ENV === 'test') {
    process.env = {
        NODE_ENV: 'test',
        WEB3_NETWORK_ADDRESS: 'http://fake:8545',
        WEB3_MANAGER_PRIVATE_KEY: '0x1',
        WEB3_CONTRACT_ADDRESS: '0x2',
        QR_CODE_GENERATION_ON_SERVER: 'false',
        REFRESH_TOKEN_SECRET: 'secret',
    };
}

const MOCKED_PARAMS = {
    CAMPAIGN_ADDRESS: '0x3',
	SEED: 'mockSeed',
	SEED_HASH: 'mockSeedHash',
    BLOCK_NUMBER: 1,
    SIGNATURE: { 
        r: '0x1c657dc504c1180d7b8d3153d2b5f2ea0b2dddcf780dbdd7e9c94a2e7dfb7d0f', 
        s: '0x25d36a635587d39a4f9e7edc29965c12a8e431b7b95ea0b4bdf325cf7ed6bc5c', 
        v: '0x1b', 
        signature: '0x1c657dc504c1180d7b8d3153d2b5f2ea0b2dddcf780dbdd7e9c94a2e7dfb7d0f25d36a635587d39a4f9e7edc29965c12a8e431b7b95ea0b4bdf325cf7ed6bc5c' 
    },
    RANDOM_WALLET: '0x4',
	ADDRESS_ACCOUNTS: {
		'0x1': {
			address: '0x3',
			privateKey: '0x1',
		},
        '0x2': {
            address: '0x4',
            privateKey: '0x2',
        },
	},
    MAX_TOKENS_COUNT: 20,
    T2_TOKENS: []
};
// generate random t15 tokens as the number of tokens in the campaign
const tokens_seed = 'tokens_seed';
for (let i = 0; i < MOCKED_PARAMS.MAX_TOKENS_COUNT; i++) {
    MOCKED_PARAMS.T2_TOKENS.push({
        token: require('crypto').createHash('sha256').update(tokens_seed + i).digest('hex'),
        redeemed: false,
    });
}

function findRootDirWithConfig(startPath, configFileName) {
    let currentPath = startPath;
    let importPath = "";

    while (currentPath !== path.parse(currentPath).root) {
        const configFilePath = path.join(currentPath, configFileName);
        if (fs.existsSync(configFilePath)) {
            importPath = path.join(importPath, '..');
            return importPath;
        }
        currentPath = path.dirname(currentPath);
        importPath = path.join(importPath, '..');
    }
    return null;
}

const root_dirname = findRootDirWithConfig(process.cwd(), 'jest.config.js');
if(process.platform === "win32")
    process.chdir(root_dirname + '\\server');
else
    process.chdir(root_dirname + '/server');
const Campaign = require(path.join(root_dirname, 'models/Campaign.js'));
const User = require(path.join(root_dirname, 'models/User.js'));
const TokenSalt = require(path.join(root_dirname, 'models/TokenSalt.js'));
const RedeemableToken = require(path.join(root_dirname, 'models/RedeemableToken.js'));
const mock_user = new User({
    username: 'mockUsername',
    address: 'mockAddress',
    password: 'mockPassword',
    role: 'user',
    verified: false
});

const today = new Date();
const startingDate = today.toISOString().split('T')[0];
const deadlineDate = new Date(today);
deadlineDate.setDate(today.getDate() + 10);
const deadline = deadlineDate.toISOString().split('T')[0];

const mock_campaign = new Campaign({
    createdBy: mock_user._id,
    campaignId: MOCKED_PARAMS.CAMPAIGN_ADDRESS,
    target: 100,
    targetEur: 50,
    tokensCount: 10,
    maxTokensCount: MOCKED_PARAMS.MAX_TOKENS_COUNT,
    image: 'Image URL',
    title: 'Campaign Title',
    description: 'Campaign Description',
    startingDate: startingDate,
    deadline: deadline,
    donor: mock_user._id,
    receiver: 'Receiver ID',
    batchRedeem: 1,
    seed: MOCKED_PARAMS.SEED,
    blockNumber: MOCKED_PARAMS.BLOCK_NUMBER,
});
MOCKED_PARAMS.CAMPAIGN_ID = mock_campaign._id.toString();

const mock_token_salt = new TokenSalt({
    campaignId: mock_campaign._id,
    hash: MOCKED_PARAMS.SEED_HASH,
    salt: MOCKED_PARAMS.SEED,
    redeemed: false,
});

const mock_redeemable_token = new RedeemableToken({
    campaignId: mock_campaign._id,
    token: 'mockToken15',
    signature: MOCKED_PARAMS.SIGNATURE.signature,
});

const MOCKED_MODELS = {
    Campaign: mock_campaign,
    User: mock_user,
    TokenSalt: mock_token_salt,
    RedeemableToken: mock_redeemable_token
};
// for each mocked model, mock the save function
Object.keys(MOCKED_MODELS).forEach(modelName => {
    const mock_model = MOCKED_MODELS[modelName];
    mock_model.save = jest.fn(() => mock_model);
    if (modelName === 'RedeemableToken')
        mock_model.deleteOne = jest.fn();
});

const mocks = {
	randomHex: jest.fn(() => MOCKED_PARAMS.SEED),
	keccak256: jest.fn(() => MOCKED_PARAMS.SEED_HASH),
    toHex: jest.fn((value) => (`0x${value.toString().toLowerCase().replace(/^0x/i, '')}`)),
    toWei: jest.fn((value, unit) => (value * 10 ** 18)),
	sign: jest.fn(() => MOCKED_PARAMS.SIGNATURE),
	privateKeyToAccount: jest.fn((private_key) => MOCKED_PARAMS.ADDRESS_ACCOUNTS[private_key]),
	wallet_add: jest.fn(),
    accounts_create: jest.fn(() => MOCKED_PARAMS.ADDRESS_ACCOUNTS['0x2']),
	getBlockNumber: jest.fn(() => MOCKED_PARAMS.BLOCK_NUMBER),
    Contract_generateTokenHashes_call: jest.fn(() => (MOCKED_PARAMS.T2_TOKENS)),
	Contract_generateTokenHashes: jest.fn(() => ({
        call: mocks.Contract_generateTokenHashes_call,
    })),
    Contract_isTokenValid_call: jest.fn(() => (true)),
    Contract_isTokenValid: jest.fn(() => ({
        call: mocks.Contract_isTokenValid_call,
    })),
    Contract_redeemTokensBatch_call: jest.fn(() => ({ gas: 1000000 })),
    Contract_redeemTokensBatch: jest.fn(() => ({
        send: mocks.Contract_redeemTokensBatch_call,
    })),
};

let db_mocks = {};
if (process.env.NODE_ENV === 'test') {
    jest.mock('web3', () => ({
        Web3: jest.fn().mockImplementation(() => ({
            utils: {
                randomHex: mocks.randomHex,
                keccak256: mocks.keccak256,
                toHex: mocks.toHex,
                toWei: mocks.toWei
            },
            eth: {
                accounts: {
                    create: mocks.accounts_create,
                    sign: mocks.sign,
                    privateKeyToAccount: mocks.privateKeyToAccount,
                    wallet: {
                        add: mocks.wallet_add
                    }
                },
                getBlockNumber: mocks.getBlockNumber,
                Contract: jest.fn().mockImplementation(() => ({
                    methods: {
                        generateTokenHashes: mocks.Contract_generateTokenHashes,
                        isTokenValid: mocks.Contract_isTokenValid,
                        redeemTokensBatch: mocks.Contract_redeemTokensBatch
                    },
                })),
            },
        })),
    }));
    
    jest.mock('../models/Campaign', () => {
        const mockCampaign = jest.fn().mockImplementation(() => {
            return mock_campaign;
        });
        mockCampaign.create = jest.fn(() => mock_campaign);
        mockCampaign.findById = jest.fn((id) => (id ? {
            exec: jest.fn(() => mock_campaign),
            lean: jest.fn(() => mock_campaign),
        } : {
            exec: jest.fn(() => null),
            lean: jest.fn(() => null),
        }));
        mockCampaign.findOne = jest.fn(() => ({}));
        mockCampaign.find = jest.fn(() => ({
            limit: jest.fn(() => ({
                exec: jest.fn(() => []),
            })),
        }));
        mockCampaign.deleteOne = jest.fn();
        mockCampaign.insertMany = jest.fn();
        mockCampaign.countDocuments = jest.fn(() => ({
            exec: jest.fn(() => 0),
        }));
        mockCampaign.findByIdAndUpdate = jest.fn();
        return mockCampaign;
    });

    jest.mock('../models/User', () => {
        const mockUser = jest.fn().mockImplementation(() => {
            return mock_user;
        });
        mockUser.create = jest.fn(() => mock_user);
        mockUser.findById = jest.fn();
        mockUser.findOne = jest.fn(() => ({
            exec: jest.fn(() => mock_user),
        }));
        mockUser.find = jest.fn(() => ({
            exec: jest.fn(() => mock_user),
        }));
        mockUser.deleteOne = jest.fn();
        mockUser.insertMany = jest.fn();
        mockUser.countDocuments = jest.fn();
        mockUser.findByIdAndUpdate = jest.fn();
        return mockUser;
    });

    jest.mock('../models/TokenSalt', () => {
        const mockTokenSalt = jest.fn().mockImplementation(() => {
            return mock_redeemable_token;
        });
        mockTokenSalt.create = jest.fn();
        mockTokenSalt.findById = jest.fn();
        mockTokenSalt.findOne = jest.fn(() => ({
            exec: jest.fn(() => mock_token_salt),
        }));
        mockTokenSalt.find = jest.fn();
        mockTokenSalt.deleteOne = jest.fn();
        mockTokenSalt.insertMany = jest.fn();
        mockTokenSalt.countDocuments = jest.fn(() => ({
            exec: jest.fn(() => 0),
        }));
        return mockTokenSalt;
    });

    jest.mock('../models/RedeemableToken', () => {
        const mockRedeemableToken = jest.fn().mockImplementation(() => {
            return mock_redeemable_token;
        });
        mockRedeemableToken.create = jest.fn();
        mockRedeemableToken.findById = jest.fn();
        mockRedeemableToken.findOne = jest.fn(() => ({}));
        mockRedeemableToken.find = jest.fn(() => ({
            limit: jest.fn(() => ({
                exec: jest.fn(() => [mock_redeemable_token]),
            })),
        }));
        mockRedeemableToken.deleteOne = jest.fn();
        mockRedeemableToken.insertMany = jest.fn();
        mockRedeemableToken.countDocuments = jest.fn(() => ({
            exec: jest.fn(() => 0),
        }));
        mockRedeemableToken.findByIdAndUpdate = jest.fn();
        return mockRedeemableToken;
    });

    db_mocks = {
        Campaign: require('../models/Campaign'),
        User: require('../models/User'),
        TokenSalt: require('../models/TokenSalt'),
        RedeemableToken: require('../models/RedeemableToken'),
    };
}

module.exports = {
    mocks,
    db_mocks,
    MOCKED_MODELS,
    MOCKED_PARAMS
}
