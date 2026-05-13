const fs = require('fs');

const appJs = fs.readFileSync('src/App.jsx', 'utf8');
const fullData = fs.readFileSync('full_bible_data.js.tmp', 'utf8');

// Find the bibleData block in App.jsx
const startMarker = '  const bibleData = {';
const endMarker = '  };';

const startIndex = appJs.indexOf(startMarker);
// We need to find the specific }; that ends the bibleData object.
// In the current truncated file, it's the one before '  const filteredItems'.
const filteredItemsMarker = '  const filteredItems =';
const endIndex = appJs.indexOf(filteredItemsMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Markers not found');
  process.exit(1);
}

// Find the last }; before filteredItems
const lastBraceIndex = appJs.lastIndexOf('  };', endIndex);

const newAppJs = appJs.substring(0, startIndex) + fullData + '\n\n' + appJs.substring(endIndex);

fs.writeFileSync('src/App.jsx', newAppJs);
console.log('Successfully restored full data to src/App.jsx');
