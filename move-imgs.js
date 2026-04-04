const fs = require('fs');
const path = require('path');

const imgDir = path.join(__dirname, 'img');
const publicDir = path.join(__dirname, 'public');

if (!fs.existsSync(imgDir)) {
    console.log('img directory does not exist');
    process.exit(1);
}

const files = fs.readdirSync(imgDir);

files.forEach(file => {
    const srcPath = path.join(imgDir, file);
    const dstPath = path.join(publicDir, file);
    
    if (file.endsWith('.jpg')) {
        fs.renameSync(srcPath, dstPath);
        console.log(`Moved ${file} to public/`);
    }
});

// Try to remove img dir
try {
    fs.rmdirSync(imgDir);
    console.log('Removed img directory');
} catch (e) {
    console.log('img directory not empty or could not be removed');
}
