const { 
    HOUR,
    DEFAULT_SLICE,
} = require('./constants.js');
const network_helpers = require("@nomicfoundation/hardhat-network-helpers");


const log = (message, tabs = 3, sep = "-") => {
    if (process.env.DEBUG) {
        if (!message) message = "";
        if (message === "") sep = "";
        console.log(`${" ".repeat(tabs * 4)}${sep} ${message}`);
    }
};

const logJson = data => {
    for (const key in data) {
        if (data[key].length > 64)
            log(`${key}: ${data[key].slice(0, DEFAULT_SLICE) + "........." + data[key].slice(-DEFAULT_SLICE)}`, tabs = 4, sep = '*');
        else log(`${key}: ${data[key]}`, tabs = 4, sep = '*');
    }
}

const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000).toLocaleString('it-IT', {
        timeZone: 'Europe/Rome',
        hour12: false
    }).replace(',', '');

    return `${date} [${timestamp}]`;
}

const getPrivateKey = (index = 0) => {
    const _accounts = config.networks.hardhat.accounts;
    const _wallet = ethers.Wallet.fromPhrase(_accounts.mnemonic, _accounts.path + `/${index}`);
    return _wallet.privateKey;
}

const encodePacked = (walletAddress, campaignAddress) => {
    // Remove '0x' prefix and concatenate
    const concatenated = walletAddress.substring(2) + campaignAddress.substring(2);
    // Re-add '0x' and hash the packed data
    return web3.utils.keccak256("0x" + concatenated);
}

const increaseTime = async (hours) => {
    log();
    log('Starting the time passing process...');
    log(`Increased time by ${hours} hours in the system!`);
    await network_helpers.time.increase(hours * HOUR);
}

const getTestName = () => {
    const stack = new Error().stack;
    const caller = stack.split("\n")[3].split(" ").pop();
    return caller.includes("Charity") ? "Charity" : "Campaign";
}

module.exports = {
    log,
    logJson,
    formatDate,
    getPrivateKey,
    encodePacked,
    increaseTime,
    getTestName
};