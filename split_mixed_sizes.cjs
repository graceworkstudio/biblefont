const fs = require('fs');
const path = require('path');

const BIBLE_DATA_PATH = path.join(__dirname, 'src', 'data', 'bibleData.js');

const bibleDataFile = fs.readFileSync(BIBLE_DATA_PATH, 'utf-8');
const jsonStr = bibleDataFile.replace('export const bibleData = ', '').replace(/;\s*$/, '');
const bibleData = eval('(' + jsonStr + ')');

function extractSize(label) {
  if (label.startsWith('특강대용')) return '특강대용';
  if (label.startsWith('강대용')) return '강대용';
  if (label.startsWith('특대')) return '특대';
  if (label.startsWith('대')) return '대';
  if (label.startsWith('중')) return '중';
  if (label.startsWith('소')) return '소';
  if (label.startsWith('특미니')) return '특미니';
  if (label.startsWith('미니')) return '미니';
  return '알수없음';
}

let modified = false;

Object.keys(bibleData).forEach(pubKey => {
  const newItems = [];
  bibleData[pubKey].items.forEach(item => {
    const sizeGroups = {};
    item.variants.forEach(v => {
      const size = extractSize(v.label);
      if (!sizeGroups[size]) {
        sizeGroups[size] = [];
      }
      sizeGroups[size].push(v);
    });

    const sizes = Object.keys(sizeGroups);
    if (sizes.length > 1 || (sizes.length === 1 && sizes[0] !== '알수없음' && sizes[0] !== item.size)) {
      // Need to split or update size
      modified = true;
      sizes.forEach(size => {
        const newItem = { ...item, variants: sizeGroups[size] };
        if (size !== '알수없음') {
          newItem.size = size;
        }
        newItems.push(newItem);
        console.log(`Split/Updated ${item.model} -> size: ${size}, variants count: ${newItem.variants.length}`);
      });
    } else {
      newItems.push(item);
    }
  });
  bibleData[pubKey].items = newItems;
});

if (modified) {
  const newFileContent = `export const bibleData = ${JSON.stringify(bibleData, null, 2)};\n`;
  fs.writeFileSync(BIBLE_DATA_PATH, newFileContent, 'utf-8');
  console.log('Successfully split mixed sizes and updated bibleData.js.');
} else {
  console.log('No mixed sizes found.');
}
