const fs = require('fs');

const testAppPath = '/Users/azkara/.gemini/antigravity/scratch/bible-font-comparison-test/src/App.jsx';
const currentAppPath = '/Users/azkara/.gemini/antigravity/scratch/bible-font-comparison/src/App.jsx';

const testContent = fs.readFileSync(testAppPath, 'utf8');
const currentContent = fs.readFileSync(currentAppPath, 'utf8');

function extractBibleData(content) {
  const match = content.match(/const bibleData = (\{[\s\S]*?\n  \};\n)/);
  if (!match) return null;
  try {
    const fn = new Function('return ' + match[1]);
    return fn();
  } catch (e) {
    console.error("Failed to extract bibleData:", e);
    return null;
  }
}

const testData = extractBibleData(testContent);
const currentData = extractBibleData(currentContent);

if (testData && currentData) {
  // Merge logic: For each category and item in currentData, if variants missing, take from testData
  for (const catKey in currentData) {
    const currentCat = currentData[catKey];
    const testCat = testData[catKey];
    
    if (testCat) {
      currentCat.items.forEach(currentItem => {
        // If current item doesn't have variants, try to find it in test data
        if (!currentItem.variants || currentItem.variants.length === 0) {
          const testItem = testCat.items.find(ti => ti.model === currentItem.model && ti.size === currentItem.size);
          if (testItem && testItem.variants && testItem.variants.length > 0) {
            currentItem.variants = testItem.variants;
            console.log(`Restored variants for ${catKey}: ${currentItem.model} (${currentItem.size})`);
          }
        }
      });
    }
  }

  // Stringify the merged data
  const mergedDataStr = 'const bibleData = ' + JSON.stringify(currentData, null, 2) + ';\n';
  
  // Replace in current content
  const newContent = currentContent.replace(/const bibleData = \{[\s\S]*?\n  \};\n/, mergedDataStr);
  
  fs.writeFileSync(currentAppPath, newContent, 'utf8');
  console.log("Bible data merged specifically and restored successfully.");
} else {
  console.log("Could not find bibleData in one of the files.");
}
