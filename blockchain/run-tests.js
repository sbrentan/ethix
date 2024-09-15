// run-tests.js
const { execSync } = require('child_process');

// Get the arguments passed to `npm test`
let args = process.argv.slice(2);
let debug_msg = '';
if(args[0] == 'debug'){
    debug_msg = 'DEBUG=true ';
    args = args.slice(1);
}

// Run `find_tests.js` with those arguments and capture the output
const findTestsResult = execSync(`node find-tests.js ${args.join(' ')}`, { encoding: 'utf8' }).trim();

// If no tests were found, exit early
console.log(""); // this is used to flush the error message
if (findTestsResult === '') {
    process.exit(0);
}

// Run `npx hardhat test` with the result from `find_tests.js`
try{
    //check if on windows
    if(process.platform === 'win32') {
        if (debug_msg !== '')
            execSync(`(set DEBUG=true && npx hardhat test --grep "${findTestsResult}")`, { stdio: 'inherit' });
        else
            execSync(`npx hardhat test --grep "${findTestsResult}"`, { stdio: 'inherit' });
    } else {
        execSync(`${debug_msg}npx hardhat test --grep "${findTestsResult}"`, { stdio: 'inherit' });
    }
} catch (error) {
    process.exit(1);
}
