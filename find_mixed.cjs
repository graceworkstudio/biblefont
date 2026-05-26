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

Object.keys(bibleData).forEach(pubKey => {
  bibleData[pubKey].items.forEach(item => {
    const sizes = new Set();
    item.variants.forEach(v => {
      sizes.add(extractSize(v.label));
    });
    if (sizes.size > 1) {
      console.log(`Mixed sizes in ${bibleData[pubKey].name} - ${item.model}: ${Array.from(sizes).join(', ')}`);
    }
  });
});
