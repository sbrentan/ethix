import { render, act } from '@testing-library/react';
import { store } from '../../src/app/store'
import { Provider } from 'react-redux'

import React, { useContext, useImperativeHandle, } from 'react';

process.env.REACT_APP_BACKEND_URL = 'http://localhost:5000';

global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

let alertMock = mockFunction(() => {console.log("alert called")});
global.window.alert = alertMock.func;

const { TransactionContext, TransactionsProvider } = require('../../src/context/TransactionContext');

const MOCKED_PARAMS = {
	SEED_HASH: "0x" + "1".repeat(64),
	SIGNATURE: { v: 2, r: "0x" + "3".repeat(64), s: "0x" + "4".repeat(64) },
	CAMPAIGN_ID: "677aa31cdf9a000d612aca0f", // MongoDB ObjectId
	CAMPAIGN_ADDRESS: "0x" + "6".repeat(40), // Ethereum address
	ORGANIZATION_ADDRESS: "0x" + "6".repeat(40),
	REFUNDED_AMOUNT: 1000,
	TOKEN_ID: "0x" + "7".repeat(64)
};

// Component that uses useContext
const TestComponent = React.forwardRef((props, ref) => {
	const ctx = useContext(TransactionContext);
	useImperativeHandle(ref, () => ({
		caller: async (fnName, params) => {
			return await ctx[fnName](...params);
		}
	}));
	return (
		<div>
		</div>
	);
});

// Custom render function with context provider
const customRender = (ui, mocks) => {
	return render(
		<Provider store={store}>
			<TransactionsProvider mocks={mocks}>
				{ui}
			</TransactionsProvider>
		</Provider>
	);
};

async function functionCaller(fn_name, fn_params, mocks) {
	const componentRef = React.createRef();
	customRender(<TestComponent ref={componentRef} />, mocks);
	return await act(async () => (
		await componentRef.current.caller(fn_name, fn_params)
	));
}

function mockFunction(function_to_mock) {
	let mock = jest.fn();
	return {
		mock: mock,
		func: (...params) => {
			mock(...params);
			console.log("mock called with params: ", params);
			return function_to_mock(...params);
		}
	};
}

function getMocks(connectedAccount, functionMocks) {
	let ethereumMethodsMock = {
		eth_accounts: [connectedAccount],
		eth_requestAccounts: [connectedAccount],
	};

	let mockWindow = {
		ethereum: {
			isMetaMask: true,
			provider: { request: () => {} },
			request: ({method}) => (new Promise((resolve, reject) => {
				resolve(ethereumMethodsMock[method]);
			})),
			on: () => {},
			removeListener: () => {},
		},
		location: { reload: jest.fn() },
	};

	let defaultMocks = {
		isOrganizationVerified: jest.fn().mockResolvedValue(true),
		initCampaign: jest.fn((params) => (params?.draft ? { data: {seedHash: MOCKED_PARAMS.SEED_HASH, signature: MOCKED_PARAMS.SIGNATURE }} : { data: { campaignId: MOCKED_PARAMS.CAMPAIGN_ID } })),
		claimToken: jest.fn().mockResolvedValue({}),
		setCampaign: jest.fn(),
		setOrganization: jest.fn(),
		setWallet: jest.fn(),
		window: mockWindow,
		wallet: { address: connectedAccount, is_logged: true },
		...functionMocks
	};

	let dict_with_func_and_mocks = {funcs: {}, mocks: {}};
	// iterate default mocks and call mockFunction for each function, then add the function mock to the dict mock ovject
	Object.keys(defaultMocks).forEach((key) => {
		if (typeof defaultMocks[key] === 'function') {
			let mock = mockFunction(defaultMocks[key]);
			dict_with_func_and_mocks.funcs[key] = mock.func;
			dict_with_func_and_mocks.mocks[key] = mock.mock;
		} else
			dict_with_func_and_mocks.funcs[key] = defaultMocks[key];
	});
	dict_with_func_and_mocks.mocks['alert'] = alertMock.mock;
	return dict_with_func_and_mocks;
}


function getCharityContractMocks() {
	function mockWithSend(output) {
		return (mockFunction(() => ({ send: () => (output) })));
	}
	const contractCreateCampaign = mockWithSend({ events: { CampaignCreated: { returnValues: { campaignId: MOCKED_PARAMS.CAMPAIGN_ID, } } } });
	const verifyOrganization = mockWithSend({ events: { OrganizationVerified: { returnValues: { } } } });
	const revokeOrganization = mockWithSend({ events: { OrganizationRevoked: { returnValues: { } } } });
	const claimRefund = mockWithSend({ events: { RefundClaimed: { returnValues: { amount: MOCKED_PARAMS.REFUNDED_AMOUNT } } } });
	const claimDonation = mockWithSend({ events: { DonationClaimed: { returnValues: { amount: MOCKED_PARAMS.REFUNDED_AMOUNT } } } });
	let charityContractMock = {
		methods: {
			createCampaign: contractCreateCampaign.func,
			verifyOrganization: verifyOrganization.func,
			revokeOrganization: revokeOrganization.func,
			claimRefund: claimRefund.func,
			claimDonation: claimDonation.func
		}
	};
	
	return {
		charityContract: charityContractMock,
		mocks: {
			createCampaign: contractCreateCampaign.mock,
			verifyOrganization: verifyOrganization.mock,
			revokeOrganization: revokeOrganization.mock,
			claimRefund: claimRefund.mock,
			claimDonation: claimDonation.mock
		}
	};
}

module.exports = {
    functionCaller,
    mockFunction,
    getMocks,
    getCharityContractMocks,
	MOCKED_PARAMS
}