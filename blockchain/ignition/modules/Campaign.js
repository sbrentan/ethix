const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("CampaignModule", (m) => {

  const campaign = m.contract("Campaign");

  return { campaign };
});
