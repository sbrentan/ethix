const { getCharityContractMocks, getMocks, functionCaller,  mockFunction } = require('./common.js');

describe('TransactionContext organization', () => {
	const MANAGER_ADDRESS = "0x8588f4d002C747C5E7B6274752B251402c77d858";
    const ORGANIZATION_ADDRESS = "0xc05B7bC6Bde92F8e6820fD47c7e23DFE01869886";
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

    describe('verifyOrganization tests', () => {

        it('should call verifyOrganization with correct parameters', async () => {
            const connectedAccount = MANAGER_ADDRESS;
            const mocks = getMocks(connectedAccount, {
                charityContract: charityContractMock
            });


            let result = await functionCaller("verifyOrganization", [ORGANIZATION_ADDRESS], mocks.funcs);
            expect(result).toBe(true);

            expect(charityContractMocks.verifyOrganization).toHaveBeenCalledWith(ORGANIZATION_ADDRESS);
            expect(mocks.mocks.setOrganization).toHaveBeenCalledWith({ address: ORGANIZATION_ADDRESS, is_verified: true });
        });

        it('should fail if contract call fails', async () => {
            const connectedAccount = MANAGER_ADDRESS;
            let verifyOrganizationMock = mockFunction(() => ({ send: () => { throw new Error("Organization already verified") } }));
            charityContractMock.methods.verifyOrganization = verifyOrganizationMock.func;
            const mocks = getMocks(connectedAccount, {
                charityContract: charityContractMock,
            });

            let result = await functionCaller("verifyOrganization", [ORGANIZATION_ADDRESS], mocks.funcs);
            expect(result).toBe(false);

            expect(verifyOrganizationMock.mock).toHaveBeenCalled();
            expect(mocks.mocks.setOrganization).not.toHaveBeenCalled();
        });

        it('should fail if metaMask is not installed', async () => {
            const connectedAccount = MANAGER_ADDRESS;
            const mocks = getMocks(connectedAccount, {
                charityContract: charityContractMock,
                window: { ethereum: null }
            });

            let result = await functionCaller("verifyOrganization", [ORGANIZATION_ADDRESS], mocks.funcs);
            expect(result).toBe(undefined);

            expect(charityContractMocks.verifyOrganization).not.toHaveBeenCalled();
            expect(mocks.mocks.setOrganization).not.toHaveBeenCalled();
        });

        it('should fail if wallet is not logged in', async () => {
            const connectedAccount = null;
            const mocks = getMocks(connectedAccount, {
                charityContract: charityContractMock,
            });

            let result = await functionCaller("verifyOrganization", [ORGANIZATION_ADDRESS], mocks.funcs);
            expect(result).toBe(undefined);

            expect(charityContractMocks.verifyOrganization).not.toHaveBeenCalled();
            expect(mocks.mocks.setOrganization).not.toHaveBeenCalled();
        });
    });

    describe('revokeOrganization tests', () => {
        
        it('should call revokeOrganization with correct parameters', async () => {
            const connectedAccount = MANAGER_ADDRESS;
            const mocks = getMocks(connectedAccount, {
                charityContract: charityContractMock
            });

            let result = await functionCaller("revokeOrganization", [ORGANIZATION_ADDRESS], mocks.funcs);
            expect(result).toBe(true);

            expect(charityContractMocks.revokeOrganization).toHaveBeenCalledWith(ORGANIZATION_ADDRESS);
            expect(mocks.mocks.setOrganization).toHaveBeenCalledWith({ address: ORGANIZATION_ADDRESS, is_verified: false });
        });
        
        it('should fail if contract call fails', async () => {
            const connectedAccount = MANAGER_ADDRESS;
            let revokeOrganizationMock = mockFunction(() => ({ send: () => { throw new Error("Organization already revoked") } }));
            charityContractMock.methods.revokeOrganization = revokeOrganizationMock.func;
            const mocks = getMocks(connectedAccount, {
                charityContract: charityContractMock,
            });

            let result = await functionCaller("revokeOrganization", [ORGANIZATION_ADDRESS], mocks.funcs);
            expect(result).toBe(false);

            expect(revokeOrganizationMock.mock).toHaveBeenCalled();
            expect(mocks.mocks.setOrganization).not.toHaveBeenCalled();
        });

        it('should fail if metaMask is not installed', async () => {
            const connectedAccount = MANAGER_ADDRESS;
            const mocks = getMocks(connectedAccount, {
                charityContract: charityContractMock,
                window: { ethereum: null }
            });

            let result = await functionCaller("revokeOrganization", [ORGANIZATION_ADDRESS], mocks.funcs);
            expect(result).toBe(undefined);

            expect(charityContractMocks.revokeOrganization).not.toHaveBeenCalled();
            expect(mocks.mocks.setOrganization).not.toHaveBeenCalled();
        });

        it('should fail if wallet is not logged in', async () => {
            const connectedAccount = null;
            const mocks = getMocks(connectedAccount, {
                charityContract: charityContractMock,
            });

            let result = await functionCaller("revokeOrganization", [ORGANIZATION_ADDRESS], mocks.funcs);
            expect(result).toBe(undefined);

            expect(charityContractMocks.revokeOrganization).not.toHaveBeenCalled();
            expect(mocks.mocks.setOrganization).not.toHaveBeenCalled();
        });

    });
});