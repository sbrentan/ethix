const { assertCorrectParameterAssignments } = require("../assertions/creation-assertions.js");
const { log } = require("../../../common/utils.js");

const test_campaign_constructor_parameter_assignments = async (contract, accounts) => {
    log();
    log(`[Test campaign constructor parameter assignments]`, tabs = 2, sep = '');

    await assertCorrectParameterAssignments(contract);
}

module.exports = {
    test_campaign_constructor_parameter_assignments
}