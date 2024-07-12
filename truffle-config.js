require('dotenv').config();

module.exports = {
  networks: {
    development: {
      host: process.env.HOST,
      port: process.env.PORT,
      network_id: "*", // * Match any network id
      from: process.env.MANAGER
    },
  },
  contracts_directory: './contracts/',
  contracts_build_directory: './build/',
  compilers: {
    solc: {
      version: "0.8.0",
      settings: { 
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
}
