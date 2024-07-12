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
const privateKey = process.env.WEB3_MANAGER_PRIVATE_KEY;
const account = web3.eth.accounts.privateKeyToAccount(privateKey);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;
const WEB3_MANAGER_ACCOUNT = account;


if (!process.env.WEB3_CONTRACT_ADDRESS) {
    console.error('WEB3_CONTRACT_ADDRESS not found in .env');
    process.exit(1);
}

const fs = require('fs');
// read the ABI from the JSON file
const contract_file = fs.readFileSync('../build/Charity.json');
// convert the ABI from JSON
const contractABI = JSON.parse(contract_file).abi;

const contractAddress = process.env.WEB3_CONTRACT_ADDRESS;
const contract = new web3.eth.Contract(contractABI, contractAddress);


const WEB3_CONTRACT = contract;
const WEB3_CONTRACT_ADDRESS = contractAddress;


module.exports = {
    web3,
    WEB3_MANAGER_ACCOUNT,
    WEB3_CONTRACT,
    WEB3_CONTRACT_ADDRESS
};