const fs = require('fs');

const appPath = 'src/App.jsx';
const appContent = fs.readFileSync(appPath, 'utf8');

const testAppPath = '/Users/azkara/.gemini/antigravity/scratch/bible-font-comparison-test/src/App.jsx';
const testContent = fs.readFileSync(testAppPath, 'utf8');
const testLines = testContent.split('\n');

// Extract C (Daehan) - U in test file
const uLines = testLines.slice(370, 470).join('\n');
const daehanData = new Function('return {' + uLines + '}')().U;
daehanData.items.forEach(item => { if (item.model) item.model = item.model.replace(/\s+/g, ''); });

// Fix S labels and models in the current object
// We'll extract bibleData, but since it might be broken, let's just find the whole block.
const startIdx = appContent.indexOf('const bibleData = {');
const endIdx = appContent.indexOf('};', startIdx) + 2;
const bibleDataStr = appContent.substring(startIdx, endIdx);

// We'll fix the string so it's evaluatable
let cleanBibleDataStr = bibleDataStr.replace('const bibleData = ', '').replace(/;$/, '');
// Fix the ,, we might have missed
cleanBibleDataStr = cleanBibleDataStr.replace(/,,\s*/g, ',\n');

let bibleData;
try {
    bibleData = new Function('return ' + cleanBibleDataStr)();
} catch (e) {
    console.error("Failed to parse bibleData even after cleanup:", e);
    // If it fails, we'll try to find where it's broken.
    process.exit(1);
}

// Update C
bibleData.C = daehanData;

// Fix S
if (bibleData.S) {
    // Restore the model names if they were erased
    // We'll use the items from the last turn's logic
    bibleData.S.items.forEach(item => {
        // item.model was 주석큰성경, etc.
        // If it was erased, we'll try to infer it from variants or just leave it for now if it's not empty
        if (!item.model || item.model === "") {
            // Check variants labels
            if (item.variants && item.variants.length > 0) {
                const firstLabel = item.variants[0].label || "";
                if (firstLabel.includes("주석큰성경")) item.model = "주석큰성경";
                else if (firstLabel.includes("베스트성경")) item.model = "베스트성경";
                else if (firstLabel.includes("좋은성경")) item.model = "좋은성경";
                else if (firstLabel.includes("빅컬러성경")) item.model = "빅컬러성경";
                else if (firstLabel.includes("만나성경")) item.model = "만나성경";
            }
        }
        
        const originalModel = item.model;
        item.model = originalModel.replace(/\s+/g, '');
        
        if (item.variants) {
            item.variants.forEach(v => {
                let label = v.label || v.name || "";
                // Remove model name prefix (with or without space)
                const prefixes = [originalModel, item.model, "주석큰성경", "베스트성경", "좋은성경", "빅컬러성경", "만나성경"];
                prefixes.forEach(p => {
                    if (p && label.startsWith(p + " ")) {
                        label = label.substring(p.length + 1);
                    } else if (p && label.startsWith(p)) {
                        // Only remove if it's followed by a space or specific separator
                        // But to be safe and simple:
                        if (p === "주석큰성경" && label.startsWith("주석큰성경")) label = label.replace("주석큰성경", "").trim();
                        if (p === "베스트성경" && label.startsWith("베스트성경")) label = label.replace("베스트성경", "").trim();
                        // ... and so on
                    }
                });
                v.label = label;
            });
        }
    });
}

// Final order of publishers
const orderedKeys = ["A", "W", "C", "S", "D", "L"];
const orderedBibleData = {};
orderedKeys.forEach(k => { if (bibleData[k]) orderedBibleData[k] = bibleData[k]; });

const resultStr = 'const bibleData = ' + JSON.stringify(orderedBibleData, null, 2) + ';';
const newAppContent = appContent.substring(0, startIdx) + resultStr + appContent.substring(endIdx);

fs.writeFileSync(appPath, newAppContent, 'utf8');
console.log("Bible data restored and cleaned successfully.");
