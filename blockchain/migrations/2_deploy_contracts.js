var Campaign = artifacts.require("Campaign");
var Charity = artifacts.require("Charity");

module.exports = function(deployer) {
  //deployer.deploy(Campaign);
  deployer.deploy(Charity);
};
