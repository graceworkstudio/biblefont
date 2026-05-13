const fs = require('fs');

const appPath = '/Users/azkara/.gemini/antigravity/scratch/bible-font-comparison/src/App.jsx';
const testAppPath = '/Users/azkara/.gemini/antigravity/scratch/bible-font-comparison-test/src/App.jsx';

const appContent = fs.readFileSync(appPath, 'utf8');
const testContent = fs.readFileSync(testAppPath, 'utf8');

// 1. Parse main bibleData
const mainStartIdx = appContent.indexOf('const bibleData = {');
const mainEndIdx = appContent.indexOf('};', mainStartIdx) + 2;
let mainBibleDataStr = appContent.substring(mainStartIdx, mainEndIdx);
mainBibleDataStr = mainBibleDataStr.replace('const bibleData = ', '').replace(/;$/, '');
mainBibleDataStr = mainBibleDataStr.replace(/,,\s*/g, ',\n'); // Just in case of malformed data

let mainBibleData;
try {
    mainBibleData = new Function('return ' + mainBibleDataStr)();
} catch (e) {
    console.error("Failed to parse main bibleData:", e);
    process.exit(1);
}

// 2. Parse test bibleData
const testStartIdx = testContent.indexOf('const bibleData = {');
const testEndIdx = testContent.indexOf('};', testStartIdx) + 2;
let testBibleDataStr = testContent.substring(testStartIdx, testEndIdx);
testBibleDataStr = testBibleDataStr.replace('const bibleData = ', '').replace(/;$/, '');

let testBibleData;
try {
    testBibleData = new Function('return ' + testBibleDataStr)();
} catch (e) {
    console.error("Failed to parse test bibleData:", e);
    process.exit(1);
}

// 3. Map the data
// A and L are preserved.
mainBibleData.B = testBibleData.W; // 생명의말씀사
mainBibleData.C = testBibleData.U; // 대한기독교서회
mainBibleData.D = testBibleData.S; // 성서원
mainBibleData.E = testBibleData.D; // 두란노

// 4. Apply safety fixes to C and D
if (mainBibleData.C) {
    mainBibleData.C.items.forEach(item => {
        if (item.model) item.model = item.model.replace(/\s+/g, '');
    });
}

if (mainBibleData.D) {
    mainBibleData.D.items.forEach(item => {
        if (!item.model || item.model === "") {
            if (item.variants && item.variants.length > 0) {
                const firstLabel = item.variants[0].label || "";
                if (firstLabel.includes("주석큰성경")) item.model = "주석큰성경";
                else if (firstLabel.includes("베스트성경")) item.model = "베스트성경";
                else if (firstLabel.includes("좋은성경")) item.model = "좋은성경";
                else if (firstLabel.includes("빅컬러성경")) item.model = "빅컬러성경";
                else if (firstLabel.includes("만나성경")) item.model = "만나성경";
            }
        }
        
        const originalModel = item.model || "";
        item.model = originalModel.replace(/\s+/g, '');
        
        if (item.variants) {
            item.variants.forEach(v => {
                let label = v.label || v.name || "";
                const prefixes = [originalModel, item.model, "주석큰성경", "베스트성경", "좋은성경", "빅컬러성경", "만나성경"];
                prefixes.forEach(p => {
                    if (p && label.startsWith(p + " ")) {
                        label = label.substring(p.length + 1);
                    } else if (p && label.startsWith(p)) {
                        if (p === "주석큰성경" && label.startsWith("주석큰성경")) label = label.replace("주석큰성경", "").trim();
                        if (p === "베스트성경" && label.startsWith("베스트성경")) label = label.replace("베스트성경", "").trim();
                        if (p === "만나성경" && label.startsWith("만나성경")) label = label.replace("만나성경", "").trim();
                        if (p === "좋은성경" && label.startsWith("좋은성경")) label = label.replace("좋은성경", "").trim();
                        if (p === "빅컬러성경" && label.startsWith("빅컬러성경")) label = label.replace("빅컬러성경", "").trim();
                    }
                });
                v.label = label;
            });
        }
    });
}

// Just enforce order nicely
const orderedKeys = ["A", "B", "C", "D", "E", "L"];
const finalBibleData = {};
orderedKeys.forEach(k => {
    if (mainBibleData[k]) finalBibleData[k] = mainBibleData[k];
});

// 5. Save back
const resultStr = 'const bibleData = ' + JSON.stringify(finalBibleData, null, 2) + ';';
const newAppContent = appContent.substring(0, mainStartIdx) + resultStr + appContent.substring(mainEndIdx);

fs.writeFileSync(appPath, newAppContent, 'utf8');
console.log("Data restoration completed successfully!");
