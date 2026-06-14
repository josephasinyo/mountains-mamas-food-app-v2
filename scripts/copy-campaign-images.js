const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\josep\\.gemini\\antigravity-ide\\brain\\72c967f9-7a01-440a-8439-bd9e1b7b9409';
const destDir = path.join(__dirname, '..', 'public', 'images');

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

const files = fs.readdirSync(srcDir);
files.forEach(file => {
    if (file.startsWith('media__') && file.endsWith('.png')) {
        const srcPath = path.join(srcDir, file);
        const destPath = path.join(destDir, file);
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copied ${file} to public/images/`);
    }
});
