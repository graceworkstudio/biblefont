const fs = require('fs');

// 1. Read current App.jsx
const appPath = 'src/App.jsx';
const appContent = fs.readFileSync(appPath, 'utf8');

// 2. Extract bibleData
const bibleDataMatch = appContent.match(/const bibleData = (\{[\s\S]*?\n  \});/);
if (!bibleDataMatch) {
    console.error("Could not find bibleData");
    process.exit(1);
}

// 3. Parse bibleData (it's a JS object, not JSON)
// We'll use new Function to evaluate it safely in this context
let bibleData;
try {
    bibleData = new Function('return ' + bibleDataMatch[1])();
} catch (e) {
    console.error("Failed to parse bibleData:", e);
    process.exit(1);
}

// 4. Restore Daehan (C) from test file
const testAppPath = '/Users/azkara/.gemini/antigravity/scratch/bible-font-comparison-test/src/App.jsx';
const testContent = fs.readFileSync(testAppPath, 'utf8');
// U is at lines 371-470 in test file
const testLines = testContent.split('\n');
const uLines = testLines.slice(370, 470).join('\n');
// We need to parse this too. It's part of an object literal.
// We'll wrap it in braces to make it a valid object for parsing
let daehanData;
try {
    const tempObj = new Function('return {' + uLines + '}')();
    daehanData = tempObj.U;
} catch (e) {
    console.error("Failed to parse Daehan data from test file:", e);
    process.exit(1);
}

// 5. Apply fixes
// a. Restore C
bibleData.C = daehanData;

// b. Fix Seongseowon (S)
if (bibleData.S) {
    bibleData.S.items.forEach(item => {
        const modelName = item.model.trim();
        // Remove spaces in model name (e.g. 주석 큰 성경 -> 주석큰성경)
        item.model = modelName.replace(/\s+/g, '');
        
        // Remove model name prefix from labels
        if (item.variants) {
            item.variants.forEach(v => {
                const label = v.label || v.name;
                // If label starts with modelName + space, remove it
                if (label.startsWith(modelName + ' ')) {
                    v.label = label.substring(modelName.length + 1);
                } else if (label.startsWith(item.model + ' ')) {
                    v.label = label.substring(item.model.length + 1);
                }
                // Also handle cases without space if any
                if (v.label && v.label.startsWith(item.model)) {
                    // Only if it's exactly the model name followed by something
                    // But usually there's a space. Let's be careful.
                }
            });
        }
    });
}

// c. Fix Daehan (C)
if (bibleData.C) {
    bibleData.C.items.forEach(item => {
        if (item.model) {
            item.model = item.model.replace(/\s+/g, '');
        }
    });
}

// 6. Stringify and write back
// We want to keep the JS object format (not strict JSON)
// But JSON.stringify is a good start.
function customStringify(obj) {
    return JSON.stringify(obj, null, 2);
}

const newBibleDataStr = 'const bibleData = ' + customStringify(bibleData) + ';';
const newAppContent = appContent.replace(/const bibleData = \{[\s\S]*?\n  \};/, newBibleDataStr);

fs.writeFileSync(appPath, newAppContent, 'utf8');
console.log("Successfully restored C and fixed S/C model names and labels");
