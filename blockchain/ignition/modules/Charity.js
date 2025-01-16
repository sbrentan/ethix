const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("CharityModule", (m) => {

  const charity = m.contract("Charity");

  return { charity };
});
