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

  let lastTranslation = '개역개정';
  let lastPublisher = '';
  let lastModel = '';
  let lastSize = '';

  lines.forEach((line, idx) => {
    if (!line.trim()) return;
    const parts = line.split('\t');
    
    let translation, publisher, model, size, option, variantLabel, img, url, originalPriceStr, salePriceStr, mmStr;
    
    if (parts.length >= 11 && parts[0].trim() !== '') {
      // Full row with translation in column 0
      translation = parts[0].trim();
      publisher = parts[1].trim();
      model = parts[2].trim();
      size = parts[3].trim();
      option = parts[4].trim();
      variantLabel = parts[5].trim();
      img = parts[6].trim();
      url = parts[7].trim();
      originalPriceStr = parts[8];
      salePriceStr = parts[9];
      mmStr = parts[10];
    } else {
      // Merged row
      // We look for the first non-empty value.
      // Usually option is at index 4 if first 4 are empty
      // Example: '', '', '', '', '옵션2', '특강대용단본/...', ...
      
      translation = lastTranslation;
      publisher = lastPublisher;
      model = lastModel;
      size = lastSize;
      
      option = parts[4] ? parts[4].trim() : '';
      variantLabel = parts[5] ? parts[5].trim() : '';
      img = parts[6] ? parts[6].trim() : '';
      url = parts[7] ? parts[7].trim() : '';
      originalPriceStr = parts[8] || '';
      salePriceStr = parts[9] || '';
      mmStr = parts[10] || '';
    }

    lastTranslation = translation;
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
    } else {
      // If we already have this model, ensure translation matches what we parsed (if it changed or was empty)
      if (translation && newItems[pubKey][model].translation !== translation) {
         newItems[pubKey][model].translation = translation;
      }
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

  console.log(`Successfully updated data. Updated/Added ${updatedCount} variants for 강대용 sheet.`);

} catch (e) {
  console.error("Error updating bible data:", e);
}
