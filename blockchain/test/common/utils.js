const { DEFAULT_SLICE } = require('./constants.js');

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
            log(`* ${key}: ${data[key].slice(0, DEFAULT_SLICE) + "........." + data[key].slice(-DEFAULT_SLICE)}`, 3);
        else log(`* ${key}: ${data[key]}`, 3);
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

const encodePacked = function (walletAddress, campaignAddress) {
    // Remove '0x' prefix and concatenate
    const concatenated = walletAddress.substring(2) + campaignAddress.substring(2);
    // Re-add '0x' and hash the packed data
    return web3.utils.keccak256("0x" + concatenated);
}

module.exports = {
    log,
    logJson,
    formatDate,
    getPrivateKey,
    encodePacked
};