const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

const match = content.match(/(const bibleData = )(\{[\s\S]*?\n\};)(\n\s*const filteredItems)/);
if (!match) {
  console.log('bibleData not found');
  process.exit(1);
}

const data = eval('(' + match[2].slice(0, -1) + ')');

for (const k in data) {
  for (const item of data[k].items) {
    // Determine type: Only models with 'NKR' are 'standard', everything else is 'study'
    item.type = item.model.includes('NKR') ? 'standard' : 'study';
  }
}

const newObjStr = JSON.stringify(data, null, 2);
content = content.replace(match[2], newObjStr + ';');
fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log('App.jsx updated with NKR type logic!');
