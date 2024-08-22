const {
    loadFixture,
  } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
  require("@nomicfoundation/hardhat-chai-matchers");
  const { expect } = require("chai");
  const CharityModule = require("../ignition/modules/Charity");
  
  describe("Charity", function () {
    async function deployCharityFixture() {
      const { charity } = await ignition.deploy(CharityModule);

      console.log(`charity deployed to: ${await charity.getAddress()}`);
      return { charity: charity };
    }
  
    describe("Deployment", function () {
      it("T001 - Should deploy the contract", async function () {
        const { charity } = await loadFixture(deployCharityFixture);
        console.log(`charity deployed to: ${await charity.getAddress()}`);
        console.log(charity);
        expect(charity.address).to.be.properAddress;
      });
    });
  });
