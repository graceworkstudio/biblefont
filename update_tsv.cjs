const fs = require('fs');
const path = require('path');

const TSV_FILE = 'input_data.tsv';
const BIBLE_DATA_PATH = path.join(__dirname, 'src', 'data', 'bibleData.js');

try {
  const content = fs.readFileSync(TSV_FILE, 'utf-8');
  const lines = content.split('\n').map(l => l.replace(/\r/g, ''));

  const pubMap = {
    '아가페': 'A',
    '생명의말씀사': 'W',
    '성서원': 'S',
    '대한기독교서회': 'C',
    '기독교서회': 'C',
    '두란노': 'D'
  };

  const newItems = {}; 
  const translation = '개역개정';

  let lastPublisher = '';
  let lastModel = '';
  let lastSize = '';

  lines.forEach((line, idx) => {
    if (!line.trim()) return;
    const parts = line.split('\t');
    
    // Check if it's the second row of a merged cell
    let publisher, model, size, option, variantLabel, img, url, originalPriceStr, salePriceStr, mmStr;
    
    if (parts.length >= 10 && parts[0].trim() !== '') {
      // Full row
      publisher = parts[0].trim();
      model = parts[1].trim();
      size = parts[2].trim();
      option = parts[3].trim();
      variantLabel = parts[4].trim();
      img = parts[5].trim();
      url = parts[6].trim();
      originalPriceStr = parts[7];
      salePriceStr = parts[8];
      mmStr = parts[9];
    } else {
      // Merged row, parts might start with empty strings
      // Find where '옵션' starts. '옵션' is usually parts[3] if full, but if first 3 are empty...
      const firstNonEmptyIndex = parts.findIndex(p => p.trim() !== '');
      if (firstNonEmptyIndex === -1) return;
      
      publisher = lastPublisher;
      model = lastModel;
      size = lastSize;
      
      // Assume the non-empty parts align with [option, variantLabel, img, url, original, sale, mm]
      // Or we just extract from the end if the structure is somewhat reliable
      // Let's just use the parts array by filtering out leading empty ones, or mapping backwards
      // For the given TSV, it seems to have leading tabs. Let's trace it.
      // 0: '', 1: '', 2: '', 3: '옵션2', 4: '대단본/...', 5: 'https...', etc.
      option = parts[3] ? parts[3].trim() : '';
      variantLabel = parts[4] ? parts[4].trim() : '';
      img = parts[5] ? parts[5].trim() : '';
      url = parts[6] ? parts[6].trim() : '';
      originalPriceStr = parts[7] || '';
      salePriceStr = parts[8] || '';
      mmStr = parts[9] || '';
    }

    lastPublisher = publisher;
    lastModel = model;
    lastSize = size;

    if (!model || !variantLabel) return;

    const pubKey = pubMap[publisher] || 'O'; 
    const originalPrice = parseInt(originalPriceStr.replace(/,/g, ''), 10) || 0;
    const salePrice = parseInt(salePriceStr.replace(/,/g, ''), 10) || 0;
    const mm = parseFloat(mmStr) || 0;

    if (!newItems[pubKey]) newItems[pubKey] = {};
    if (!newItems[pubKey][model]) {
      newItems[pubKey][model] = {
        model: model,
        size: size,
        mm: mm,
        type: 'standard', 
        translation: translation,
        variants: []
      };
    }

    if (variantLabel.includes('주석') || variantLabel.includes('스터디') || variantLabel.includes('해설')) {
      newItems[pubKey][model].type = 'study';
    }

    let itemCode = `NEW_${pubKey}_${model}_${newItems[pubKey][model].variants.length}`;
    
    newItems[pubKey][model].variants.push({
      label: variantLabel,
      img: img,
      url: url,
      itemCode: itemCode,
      originalPrice: originalPrice,
      salePrice: salePrice
    });
  });

  let bibleDataFile = fs.readFileSync(BIBLE_DATA_PATH, 'utf-8');
  const jsonStr = bibleDataFile.replace('export const bibleData = ', '').replace(/;\s*$/, '');
  let bibleData;
  try {
    bibleData = JSON.parse(jsonStr);
  } catch (e) {
    bibleData = eval('(' + jsonStr + ')');
  }

  let updatedCount = 0;

  Object.keys(newItems).forEach(pubKey => {
    if (!bibleData[pubKey]) {
      const pubNames = { 'A': '아가페', 'W': '말씀사', 'S': '성서원', 'C': '기독교서회', 'D': '두란노', 'O': '기타' };
      bibleData[pubKey] = { name: pubNames[pubKey] || '기타', items: [] };
    }

    const models = newItems[pubKey];
    Object.keys(models).forEach(modelName => {
      const newItem = models[modelName];
      const existingItem = bibleData[pubKey].items.find(i => i.model === modelName);
      
      if (existingItem) {
        existingItem.translation = newItem.translation;
        if (newItem.mm > 0) existingItem.mm = newItem.mm;
        if (newItem.size) existingItem.size = newItem.size;
        
        newItem.variants.forEach(nv => {
          const ev = existingItem.variants.find(v => v.label === nv.label);
          if (!ev) {
            existingItem.variants.push(nv);
            updatedCount++;
          } else {
            if (nv.originalPrice > 0) ev.originalPrice = nv.originalPrice;
            if (nv.salePrice > 0) ev.salePrice = nv.salePrice;
            if (nv.url) ev.url = nv.url;
            if (nv.img) ev.img = nv.img;
            updatedCount++;
          }
        });
      } else {
        bibleData[pubKey].items.push(newItem);
        updatedCount += newItem.variants.length;
      }
    });
  });

  const updatedFileContent = `export const bibleData = ${JSON.stringify(bibleData, null, 2)};\n`;
  fs.writeFileSync(BIBLE_DATA_PATH, updatedFileContent, 'utf-8');

  console.log(`Successfully updated data. Updated/Added ${updatedCount} variants for translation '${translation}'.`);

} catch (e) {
  console.error("Error updating bible data:", e);
}
