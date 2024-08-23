// run-tests.js
const { execSync } = require('child_process');

// Get the arguments passed to `npm test`
const args = process.argv.slice(2);

// Run `find_tests.js` with those arguments and capture the output
const findTestsResult = execSync(`node find-tests.js ${args.join(' ')}`, { encoding: 'utf8' }).trim();

// If no tests were found, exit early
if (findTestsResult === '') {
    process.exit(0);
}

// Run `npx hardhat test` with the result from `find_tests.js`
try{
    execSync(`npx hardhat test --grep "${findTestsResult}"`, { stdio: 'inherit' });
} catch (error) {
    process.exit(1);
}
