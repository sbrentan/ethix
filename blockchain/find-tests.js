// find-tests.js
const fs = require('fs');
const glob = require('glob');

function findTests(searchPattern) {
  const testFiles = glob.sync('test/**/*.js'); // Adjust the pattern to match your test files
  const matchingTests = [];

  testFiles.forEach((file) => {
    const fileContent = fs.readFileSync(file, 'utf-8');

    // Use regular expressions to find `describe` and `it` blocks
    const describeRegex = /describe\s*\(\s*['"`](.+?)['"`]\s*,\s*function\s*\(\s*\)\s*\{/g;
    const itRegex = /it\s*\(\s*['"`](.+?)['"`]\s*,\s*async?\s*function\s*\(\s*\)\s*\{/g;

    const describeStack = [];
    let descriptions = {};
    let match;

    initialIndex = 0;
    while ((match = describeRegex.exec(fileContent))) {
      const describeIndex = match.index;

      const lastNewLineIndex = fileContent.slice(initialIndex, describeIndex).lastIndexOf("\n");
      const level = describeIndex - (lastNewLineIndex + initialIndex);

      describeStack.push(match[1]);
      descriptions[describeRegex.lastIndex] = {"type": "describe", "value": match[1], "level": level - 1};

      initialIndex = describeIndex;
    }

    initialIndex = 0;
    while ((match = itRegex.exec(fileContent))) {
      const itIndex = match.index;
      const lastNewLineIndex = fileContent.slice(initialIndex, itIndex).lastIndexOf("\n");
      const level = itIndex - (lastNewLineIndex + initialIndex);

      descriptions[itIndex] = {"type": "it", "value": match[1], 'level': level - 1};

      initialIndex = itIndex;

      //break; // Remove this line to search for all tests
    }
    // console.log("descriptions: ", descriptions);


    let previousValues = {};
    let previousValuesKeys = [];
    let newTexts = [];
    for(const [index, description] of Object.entries(descriptions)) {

        if(description["type"] == "describe") {
            previousValues[description["level"]] = description["value"];
            previousValuesKeys = Object.keys(previousValues).filter((key) => key <= description["level"]);

            // previousValue = previousValuesKeys.map((key) => previousValues[key]).join(" ");
        } else if(description["type"] == "it") {
            let sortedKeys = previousValuesKeys.sort((a, b) => a - b);
            sortedKeys = sortedKeys.filter((key) => key < description["level"]);
            let previousValue = sortedKeys.map((key) => previousValues[key]).join(" ");
            let newText = previousValue + " " + description["value"];
            newTexts.push(newText);
        }

    }
    // console.log("newTexts: ", newTexts);


    // console.log("------------")

    // perform regex search on newTexts
    for (let i = 0; i < newTexts.length; i++) {
        // const inputString = "charity deployment T001 - Should deploy the contract";
        const inputString = newTexts[i];

        // const words = "charity t001 deploy".split(" ");
        const words = searchPattern;//.split(" ");

        let start = 0;
        let found = true;
        for (let i = 0; i < words.length; i++) {
            words_i = words[i].trim().toLowerCase();
            // console.log("start  ", start);
            let word_to_check = inputString.slice(start)
            if(start != 0){
                word_to_check = word_to_check.split(" ").slice(0).join(" ");
                // console.log("slice", word_to_check.split(" ").slice(0));
            }
            // console.log("word_to_check: ", word_to_check);

            // console.log("looking for '", words_i, "' in '", word_to_check);
            regex = new RegExp(words_i + "[a-zA-Z0-9]*", 'i');
            match = regex.exec(word_to_check);
            if (match) {
                // console.log("match found ", match.index);
                start += match.index + match[0].length;
                // if(words_i.length == match[0].length){
                //     start -= 2;
                // }
            } else {
                found = false;
                break;
            }
            // console.log('--------');
        }
        if (found) {
            matchingTests.push(inputString);
        }
    }

  });

  return matchingTests;
}

if (process.argv.length < 3) {
  console.log('Please provide a search pattern as an argument.');
  process.exit(1);
}
// get all following arguments
const searchPattern = process.argv.slice(2).join(' ').split(" ");

const matchingTests = findTests(searchPattern);

let result = "";
let commonPart = "";
if(matchingTests.length == 1)
	result = matchingTests[0];
else if(matchingTests.length > 1){
    // find the common part between all the tests
    for (let i = 0; i < matchingTests[0].length; i++) {
        let char = matchingTests[0][i];
        let common = true;
        for (let j = 1; j < matchingTests.length; j++) {
            if(matchingTests[j][i] != char){
                common = false;
                break;
            }
        }
        if(common) {
            commonPart += char;
        } else {
            break;
        }
    }
    if (commonPart.length > 0) {
        // commonPart = commonPart.split(" ");
        // commonPart = commonPart.slice(0, commonPart.length - 1);
        result = commonPart.trim();
    } else {
	    result = searchPattern.join(" ").trim();
    }
}
console.log(result);

err_msg = "";
if(matchingTests.length == 0){
    run_msg = "!!! Stopping the command as no test has been found !!!\n";
	err_msg = "* No matching tests found *\n\n\n" + run_msg;
}
else if(matchingTests.length > 1){
    if(commonPart.length > 0)
        run_msg = "!!! Running directly hh command with common part: `npx hardhat test --grep \"" + commonPart + "\"` !!!\n";
    else
        run_msg = "!!! Running directly hh command: `npx hardhat test --grep \"" + searchPattern.join(" ").trim() + "\"` !!!\n";
    err_msg = "\n* Multiple matching tests found, cannot retrieve direct test *\n\n\n" + run_msg;
}

process.stderr.write(
	'----------------------------------------------------------------------------------\n\n'+
	'Matching test descriptions:\n'+
	matchingTests.map((test) => `- ${test}`).join('\n') + '\n' +
	err_msg + '\n' +
	'----------------------------------------------------------------------------------\n\n'
)

