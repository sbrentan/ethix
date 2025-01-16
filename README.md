# Ethix

![Logo](./logo.png)

This repository contains the project for the Blockchain course for the year 2023/2024 of University of Trento.

The team members for the group project are:

* Simone Brentan (239959)
* Matteo Costalonga (239960)
* Alex Reichert (239961)
* Pietro Farina (249889)

The root folder also contains the report pdf file.

# License
This project is licensed under the [MIT License](https://mit-license.org/).

Feel free to use, modify, and distribute it in accordance with the license terms.

# Project Setup Instructions

To get started with the project, please follow the steps below:

## Clone the Repository

Clone the repository to your local machine using the following command:
```sh
git clone https://github.com/sbrentan/ethix.git
```

## Prerequisites

Make sure you have Node.js installed on your machine. You can download it from the official website: [Node.js](https://nodejs.org)

The _Truffle_ and _Ganache_ tools have been used to manage and test an _Ethereum network_, and are therefore required.
_Truffle_ can be easily installed with:
```sh
npm install truffle
```
While _Ganache_ can be easily downloaded from the official website: [Ganache](https://archive.trufflesuite.com/ganache/)

## Installation

In order to install the required dependencies, navigate to the `blockchain`, `server` and `client` folders and in each of them run the following command:
```sh
npm install
```

### Environment variables
For a smooth **local execution** of the application, be careful to set up the environment variables for each of the three folder: `blockchain`, `server` and `client`.

#### Blockchain .env file
```sh
HOST = "127.0.0.1" 
PORT = "7545"
MANAGER = "<the public address of the account used to deploy the contracts>"
REFRESH_TOKEN_SECRET = "your_refresh_token_secret"
```
Remember to correctly update the `.env` file if  _Ganache_ was set up with different configurations from the default values

#### Client .env file
```sh
REACT_APP_CHARITY_CONTRACT_ADDRESS = '<the Charity contract address, obtainable after the deploy>'
REACT_APP_BASE_URL = "http://localhost:3000"
REACT_APP_BACKEND_URL = "http://localhost:3500"
```

#### Server .env file
```sh
NODE_ENV = 'development' 
DATABASE_URI = 'mongodb+srv://charity-chain:QU0LYteeRT2nGo9b@charitychain.odwkuxl.mongodb.net/?retryWrites=true&w=majority&appName=CharityChain'
ACCESS_TOKEN_SECRET = 'your_access_token_secret' 
REFRESH_TOKEN_SECRET = 'your_refresh_token_secret'
SESSION_SECRET = 'your_session_secret'

# Testing
DATABASE_TEST_URI = 'mongodb+srv://charity-chain:QU0LYteeRT2nGo9b@charitychain.odwkuxl.mongodb.net/?retryWrites=true&w=majority&appName=CharityChain'

# Front end URL
FRONTEND_URL = 'http://localhost:3000/'
CORS_FRONTEND_URL_1 = 'http://localhost:3000'

# Blockchain
WEB3_MANAGER_PRIVATE_KEY = '<private key of the server relayer account>'
WEB3_MANAGER_ADDRESS = '<public key of the server relayer account>'
WEB3_CONTRACT_ADDRESS = '<the Charity contract address, obtainable after the deploy>'
WEB3_NETWORK_ADDRESS = 'http://127.0.0.1:7545'

# Settings
DEFAULT_BATCH_REDEEM = 1
DEFAULT_BATCH_HASH_GENERATION = 100
DEBUG = true
QR_CODE_GENERATION_ON_SERVER = true
```

## Application running

To start the application, follow the instructions below.

Please make sure to enter the respective directories (`blockchain`, `server` and `client`) before running the specified commands.

### Blockchain

1. Start the _Ganache_ tool and create a workspace in it by selecting the `truffle-config.js` file found within the blockchain folder of the project.
2. Deploy the Charity contract using the following command: 
```sh
npm run deploy
```
3. Once the contract is deployed, its address can be found in the terminal or in the _Ganache_ `contracts` section.
4. Copy the contract address inside the `client` and `server` .env files.


### Backend:

1. Navigate to the `server` directory in the terminal.
2. Run the following command to start the backend server:
```sh
npm run dev
```

### Frontend:

1. Install [MetaMask](https://metamask.io/) in your browser and create an account in order to be able to use it.
2. Add the _Ganache_ test network to MetaMask from its settings by specifying:

```
Network Name = Ganache
New URL RPC = http://127.0.0.1:7545
Chain ID = 1337
Coin symbol = ETH
```

3. Import a couple of accounts from the local _Ganache_ network to MetaMask wallet by inserting their private keys. The account manager you previously set in the environment files is probably needed.
3. Navigate now to the `client` directory in the terminal.
4. Run the following command to start the frontend:
```sh
npm run start
```

This will launch the application and you can access it in your web browser.

### Notes

The backend will run on `localhost:3500` while the front end on `localhost:3000`

## Unit testing

Unit tests have been written for the blockchain contracts and backend/frontend application.

### Solidity contracts

The solidity contracts unit tests have been developed through the usage of the hardhat framework, which is capable of simulating the network and contracts execution.

To run the tests it is enough to enter the `blockchain` folder and run `npm run test`

### Backend and Frontend 

The unit tests for both the backend and frontend application have been developed using the `jest` framework.

The implemented unit tests mainly relates to the contracts functions and general application flow.

> WARNING:
> 
> To run both the backend and frontend unit tests, the deployment of the contracts (using `npm run deploy` inside the blockchain folder) is necessary, as both require the contracts ABI to work.

After the contracts have been deployed, to run the tests you just need to run `npm run test`.


## Application usage

In order to utilise the application, a MetaMask connection to the site is required. This allow the application to understand which account is currently being used, and more importantly, allows the interaction with the blockchain.

#### Registration and Beneficiary verification
1. Sign up and create an account for both the donor and the beneficiary.

    > When doing so, remember that the connected wallet will be saved as the user wallet address, and thus will be used for validation and when refunding money. Be sure to register with two different wallets if you want to test the correct contract functioning and validation. All the extensive information required on sign up are meant to be used by the admin to perform the verification process. While we put them in the demo, when testing the application usage you can put fake values as they are not checked (except of course the information about email and password which are used to perform the login)
2. Sign in with the admin account.

    > In the database provided there is already an admin account with email: `admin@admin.admin` and password: `Password1`. Feel free to use that account, the wallet connected however **must be** the one that deployed the contract.
3. Go to the Requests page and verify the latest `Beneficiary` registration.

#### Campaign creation
1. Sign in as the previously created `Donor`. Remember to switch also the MetaMask account. Go to the `My Campaigns` page and press "New campaign".

2. Make sure the starting date is in the future and of course the deadline too. Fill out the form with details data from the campaign and press "Create".

    > For testing, remember that the redeeming of tokens can be done only when the campaign is "live", so when the current time is between the starting date and the deadline.

#### Campaign funding
3. The funding process for a campaign must be done when a block is mined after the campaign creation. During local testing, this operation must be performed manually. To do this, you need to execute a transaction on the blockchain, for example by logging again as an admin and then verifying the same beneficiary as before.

    > This operation is needed because the funding process leverages the Commit-Reveal Randomness approach to generate a secure blockchain-level seed, and for this reason it needs to execute a second call with a different network block number.

4. To fund a campaign, navigate to the dashbord and press "Start". After the transaction is performed, the token values can be downloaded in form of QR Codes in a PDF file.

    > If the start button is still disabled even after executing a blockchain transaction, try reloading the page. For simplicity and testing purposes, the link to the redeem token is added in the PDF file attached to each QR Code.

#### Token redeeming
5. Now, in the "Redeem" page of the application, the tokens can be entered and redeemed if valid.

    > Use the tokens which were previously downloaded. Remember that the campaign must be live, this may require doing again a blockchian transaction to enable it after the starting date passes.

#### Donation and refunds claiming
6. Once a campaign ends, both `Donor` and `Beneficiary` can access their respective dashboard and respectively claim the refunds and the donations for the campaign based on the number of redeemed tokens.

    > This operation can be performed only when the campaign is ended. Remember to switch to the right wallet accounts or the transaction will be denied.
