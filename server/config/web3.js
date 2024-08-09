if (!process.env.WEB3_NETWORK_ADDRESS) {
    console.error('WEB3_NETWORK_ADDRESS not found in .env');
    process.exit(1);
}

const { Web3 } = require('web3');
const web3 = new Web3(process.env.WEB3_NETWORK_ADDRESS);

if (!process.env.WEB3_MANAGER_PRIVATE_KEY) {
    console.error('WEB3_MANAGER_PRIVATE_KEY not found in .env');
    process.exit(1);
}
const WEB3_MANAGER_PRIVATE_KEY = process.env.WEB3_MANAGER_PRIVATE_KEY;
const account = web3.eth.accounts.privateKeyToAccount(WEB3_MANAGER_PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;
const WEB3_MANAGER_ACCOUNT = account;


if (!process.env.WEB3_CONTRACT_ADDRESS) {
    console.error('WEB3_CONTRACT_ADDRESS not found in .env');
    process.exit(1);
}

// read the ABI from the JSON file
const fs = require('fs');
const contract_file = fs.readFileSync('../blockchain/build/Charity.json');

// convert the ABI from JSON
const contractABI = JSON.parse(contract_file).abi;

const contractAddress = process.env.WEB3_CONTRACT_ADDRESS;
const contract = new web3.eth.Contract(contractABI, contractAddress);


const WEB3_CONTRACT = contract;
const WEB3_CONTRACT_ADDRESS = contractAddress;



// this is needed if you want to sign a message combined from two hex variables
const encodePacked = function(walletAddress, campaignAddress) {
    // Remove '0x' prefix and concatenate
    const concatenated = walletAddress.substring(2) + campaignAddress.substring(2);
    // Re-add '0x' and hash the packed data
    return web3.utils.keccak256("0x" + concatenated);
}


module.exports = {
    web3,
    encodePacked,
    WEB3_MANAGER_ACCOUNT,
    WEB3_CONTRACT,
    WEB3_CONTRACT_ADDRESS,
    WEB3_MANAGER_PRIVATE_KEY
};