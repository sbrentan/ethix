const fs = require('fs');
const path = require('path');

// Define the source and destination directories
const sourceDir = "./build/"
const destinationDir = "../client/src/utils/";

// Read the contents of the source directory
fs.readdir(sourceDir, (err, files) => {
    if (err) {
        console.error('Error reading source directory:', err);
        return;
    }

    // Filter out Migrations.json
    const contractFiles = files.filter(file => file === 'Chairity.json');

    // Copy each contract file to the destination directory
    contractFiles.forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    const destinationPath = path.join(destinationDir, file);

    fs.copyFile(sourcePath, destinationPath, err => {
        if (err) {
            console.error(`Error copying ${file}:`, err);
        } else {
            console.log(`${file} copied successfully!`);
        }
    });
    });
});
