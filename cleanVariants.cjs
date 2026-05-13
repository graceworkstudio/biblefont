const fs = require('fs');
const path = './src/App.jsx';
let content = fs.readFileSync(path, 'utf8');

// Use a regular expression or simple string manipulation to remove variants.
// Wait, regex might be tricky. Let's just find "variants: [" and remove everything until "]"
// Actually, it's a bit nested. Let's evaluate the bibleData object by extracting it, mapping it, and putting it back.
const match = content.match(/const bibleData = (\{[\s\S]*?\n  \};\n)/);
if (match) {
  let dataStr = match[1];
  // Replace `variants: [ ... ]` with empty or remove it.
  // The variants are like: `variants: [\n ... \n        ]\n`
  // We can just use a regex to match variants array.
  dataStr = dataStr.replace(/,\s*variants:\s*\[[\s\S]*?\]/g, '');
  content = content.replace(match[1], dataStr);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Variants removed successfully.");
} else {
  console.log("Could not find bibleData.");
}
