const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('src/components', (filePath) => {
    if (!filePath.endsWith('.css')) return;
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace width and max-width in px (only if > 10px to avoid borders/small decorations)
    let modified = content.replace(/(max-width|width):\s*(\d+)px/g, (match, prop, val) => {
        const num = parseInt(val, 10);
        if (num > 20 && num !== 768 && num !== 1024 && num !== 900 && num !== 430) {
            return `${prop}: ${num / 16}rem`;
        }
        return match;
    });

    if (modified !== content) {
        fs.writeFileSync(filePath, modified, 'utf8');
        console.log(`Updated ${filePath}`);
    }
});
