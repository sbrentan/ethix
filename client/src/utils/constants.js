import Charity from "./Charity.json";

// Contract address retrieved from Ganache after deploying the contract
export const CHARITY_CONTRACT_ADDRESS = process.env.REACT_APP_CHARITY_CONTRACT_ADDRESS;

// The contract ABI retrieved from the compiled contract
export const CHARITY_CONTRACT_ABI = Charity.abi;