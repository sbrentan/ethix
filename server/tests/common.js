const fs = require('fs');
const path = require('path');

if (process.env.NODE_ENV === 'test') {
    process.env = {
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
	SIGNATURE: { r: 'r', s: 's', v: 'v', signature: '0xrsv' },
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
process.chdir(root_dirname + '\\server');
const Campaign = require(path.join(root_dirname, 'models/Campaign'));
const User = require(path.join(root_dirname, 'models/User'));
const TokenSalt = require(path.join(root_dirname, 'models/TokenSalt'));
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
    batchRedeem: 3,
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

const MOCKED_MODELS = {
    Campaign: mock_campaign,
    User: mock_user,
    TokenSalt: mock_token_salt
};

const mocks = {
	randomHex: jest.fn(() => MOCKED_PARAMS.SEED),
	keccak256: jest.fn(() => MOCKED_PARAMS.SEED_HASH),
    toHex: jest.fn((value) => (`0x${value.toString().toLowerCase().replace(/^0x/i, '')}`)),
	sign: jest.fn(() => MOCKED_PARAMS.SIGNATURE),
	privateKeyToAccount: jest.fn((private_key) => MOCKED_PARAMS.ADDRESS_ACCOUNTS[private_key]),
	wallet_add: jest.fn(),
    accounts_create: jest.fn(() => MOCKED_PARAMS.ADDRESS_ACCOUNTS['0x2']),
	getBlockNumber: jest.fn(() => MOCKED_PARAMS.BLOCK_NUMBER),
    Contract_generateTokenHashes_call: jest.fn(() => (MOCKED_PARAMS.T2_TOKENS)),
	Contract_generateTokenHashes: jest.fn(() => ({
        call: mocks.Contract_generateTokenHashes_call,
    })),
};

jest.mock('web3', () => ({
	Web3: jest.fn().mockImplementation(() => ({
		utils: {
			randomHex: mocks.randomHex,
			keccak256: mocks.keccak256,
            toHex: mocks.toHex,
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
				},
			})),
		},
	})),
}));

let db_mocks = {};
// for each model in model folder create db_mocks as above
const modelsPath = path.join(__dirname, '../models');
const modelFiles = fs.readdirSync(modelsPath).filter(file => file.endsWith('.js'));
modelFiles.forEach(file => {
    const modelName = path.basename(file, '.js');
    const empty_object_result = {
        exec: jest.fn(() => null),
        lean: jest.fn(() => null),
    }
    const db_object_result = {
        exec: jest.fn(() => MOCKED_MODELS[modelName]),
        lean: jest.fn(() => MOCKED_MODELS[modelName]),
    }
    db_mocks[modelName] = {
        create: jest.fn(() => (MOCKED_MODELS[modelName])),
        findById: jest.fn((id) => (id ? db_object_result : empty_object_result)),
        //findById: jest.fn(() => (db_object_result)),
        findOne: jest.fn(() => (db_object_result)),
        find: jest.fn(() => (db_object_result)),
        deleteOne: jest.fn(),
        save: jest.fn(),
        insertMany: jest.fn(),
        countDocuments: jest.fn(),
        findByIdAndUpdate: jest.fn(),
    };
});

Object.keys(db_mocks).forEach(modelName => {
    const mock_model = db_mocks[modelName];
    jest.mock(`../models/${modelName}`, () => (mock_model));
});

function get_custom_db_mocks(custom_mocks) {
    custom_mocks = custom_mocks || {};
    return {
        ...db_mocks,
        ...custom_mocks,
    };
}


module.exports = {
    mocks,
    db_mocks,
    MOCKED_MODELS,
    MOCKED_PARAMS
}
