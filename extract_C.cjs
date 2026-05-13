const fs = require('fs');

const testAppPath = '/Users/azkara/.gemini/antigravity/scratch/bible-font-comparison-test/src/App.jsx';
const testContent = fs.readFileSync(testAppPath, 'utf8');

function extractPublisher(content, key) {
  // Try different regex to find the publisher block
  const regex = new RegExp(`[\\s]${key}: \\{ name: "(.+?)", items: ([\\s\\S]*?)\\]\\s*\\}`, 'g');
  const match = regex.exec(content);
  if (!match) return null;
  
  const name = match[1];
  let itemsStr = match[2] + ']';
  
  try {
    const items = eval(itemsStr);
    return { name, items };
  } catch (e) {
    console.error("Failed to parse items for", key, e);
    return null;
  }
}

const daehanData = extractPublisher(testContent, 'U');

if (daehanData) {
  // Fix spaces in model names
  daehanData.items.forEach(item => {
    if (item.model) {
      item.model = item.model.replace(/\s+/g, '');
    }
  });
  
  fs.writeFileSync('/Users/azkara/.gemini/antigravity/scratch/bible-font-comparison/C_data.json', JSON.stringify(daehanData, null, 2));
  console.log("Extracted C data successfully.");
} else {
  console.log("Failed to extract C data.");
}
