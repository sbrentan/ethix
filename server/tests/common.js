const fs = require('fs');
const path = require('path');

process.env = {
    WEB3_NETWORK_ADDRESS: 'http://fake:8545',
    WEB3_MANAGER_PRIVATE_KEY: '0x1',
    WEB3_CONTRACT_ADDRESS: '0x2'
};

const MOCKED_PARAMS = {
    CAMPAIGN_ID: 'mockCampaignId',
    CAMPAIGN_ADDRESS: '0x3',
	SEED: 'mockSeed',
	SEED_HASH: 'mockSeedHash',
    BLOCK_NUMBER: 1,
	SIGNATURE: { r: 'r', s: 's', v: 'v' },
	ADDRESS_ACCOUNTS: {
		'0x1': {
			address: '0x3',
			privateKey: '0x1',
		},
        '0x2': {
            address: '0x4',
            privateKey: '0x2',
        },
	}
};
function findRootDirWithConfig(startPath, configFileName) {
    let currentPath = startPath;
    let importPath = "";

    while (currentPath !== path.parse(currentPath).root) {
        const configFilePath = path.join(currentPath, configFileName);
        if (fs.existsSync(configFilePath)) {
            importPath = path.join(importPath, '..');
            return importPath;
            // return currentPath;
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
const mock_user = new User({
    username: 'mockUsername',
    address: 'mockAddress',
    password: 'mockPassword',
    role: 'user',
    verified: false
});

const mock_campaign = new Campaign({
    createdBy: mock_user,
    campaignId: MOCKED_PARAMS.CAMPAIGN_ID,
    target: 100,
    targetEur: 50,
    tokensCount: 10,
    maxTokensCount: 20,
    image: 'Image URL',
    title: 'Campaign Title',
    description: 'Campaign Description',
    startingDate: '2025-01-10',
    deadline: '2025-12-31',
    donor: mock_user,
    receiver: 'Receiver ID',
    batchRedeem: 3,
    seed: MOCKED_PARAMS.SEED,
    blockNumber: MOCKED_PARAMS.BLOCK_NUMBER,
})
console.log(mock_campaign.startingDate)
const MOCKED_MODELS = {
    Campaign: mock_campaign,
    User: mock_user,
};

const mocks = {
	randomHex: jest.fn(() => MOCKED_PARAMS.SEED),
	keccak256: jest.fn(() => MOCKED_PARAMS.SEED_HASH),
	sign: jest.fn(() => MOCKED_PARAMS.SIGNATURE),
	privateKeyToAccount: jest.fn((private_key) => MOCKED_PARAMS.ADDRESS_ACCOUNTS[private_key]),
	wallet_add: jest.fn(),
    accounts_create: jest.fn(() => MOCKED_PARAMS.ADDRESS_ACCOUNTS['0x2']),
	getBlockNumber: jest.fn(() => MOCKED_PARAMS.BLOCK_NUMBER),
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
					createCampaign: mocks.Contract_createCampaign,
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
    const db_object_result = {
        exec: jest.fn(() => MOCKED_MODELS[modelName]),
        lean: jest.fn(() => MOCKED_MODELS[modelName]),
    }
    db_mocks[modelName] = {
        create: jest.fn(),
        findById: jest.fn(() => (db_object_result)),
        findOne: jest.fn(() => (db_object_result)),
        find: jest.fn(() => (db_object_result)),
        deleteOne: jest.fn(),
        save: jest.fn(),
        insertMany: jest.fn(),
        countDocuments: jest.fn(),
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
