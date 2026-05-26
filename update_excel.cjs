const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const FILE_NAME = '성경기타번역본들.xlsx';
const BIBLE_DATA_PATH = path.join(__dirname, 'src', 'data', 'bibleData.js');

try {
  const workbook = xlsx.readFile(FILE_NAME);
  
  const pubMap = {
    '아가페': 'A',
    '생명의말씀사': 'W',
    '성서원': 'S',
    '대한기독교서회': 'C',
    '기독교서회': 'C',
    '두란노': 'D'
  };

  const newItems = {}; 
  let totalVariantsRead = 0;

  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const rawData = xlsx.utils.sheet_to_json(worksheet);

    let lastTranslation = sheetName; 
    let lastPublisher = '';
    let lastModel = '';
    let lastSize = '';
    let lastMm = 0;

    rawData.forEach((row, idx) => {
      // 띄어쓰기 등 불규칙한 키를 위해 정리된 객체 생성
      const cleanedRow = {};
      Object.keys(row).forEach(k => {
        cleanedRow[k.trim()] = row[k];
      });

      const translation = cleanedRow['번역본'] || lastTranslation || '개역개정';
      const publisher = cleanedRow['출판사'] || lastPublisher;
      const model = cleanedRow['모델명'] || lastModel;
      const size = cleanedRow['크기'] || lastSize;
      const variantLabel = cleanedRow['모델명상세'];
      const variantImg = cleanedRow['표지이미지링크'];
      const variantUrl = cleanedRow['상세페이지링크'];
      const originalPrice = cleanedRow['정가'] || 0;
      const salePrice = cleanedRow['할인가'] || 0;
      const rawMm = cleanedRow['폰트크기'] || cleanedRow['mm'];
      const mm = rawMm !== undefined ? parseFloat(rawMm) : lastMm;

      lastTranslation = translation;
      lastPublisher = publisher;
      lastModel = model;
      lastSize = size;
      lastMm = mm;

      if (!model || !variantLabel) {
        return;
      }

      totalVariantsRead++;

      const pubKey = pubMap[publisher] || 'O'; 

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
        if (mm > 0 && newItems[pubKey][model].mm === 0) {
          newItems[pubKey][model].mm = mm;
        }
        if (size && !newItems[pubKey][model].size) {
          newItems[pubKey][model].size = size;
        }
      }

      if (variantLabel.includes('주석') || variantLabel.includes('스터디') || variantLabel.includes('해설')) {
        newItems[pubKey][model].type = 'study';
      }

      let itemCode = `NEW_${pubKey}_${model}_${newItems[pubKey][model].variants.length}`;
      
      newItems[pubKey][model].variants.push({
        label: variantLabel,
        img: variantImg,
        url: variantUrl,
        itemCode: itemCode,
        originalPrice: parseInt(originalPrice, 10) || 0,
        salePrice: parseInt(salePrice, 10) || 0
      });
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
          } else {
            // Update prices if they are 0
            if (nv.originalPrice > 0) ev.originalPrice = nv.originalPrice;
            if (nv.salePrice > 0) ev.salePrice = nv.salePrice;
            updatedCount++;
          }
        });
      } else {
        bibleData[pubKey].items.push(newItem);
      }
    });
  });

  const updatedFileContent = `export const bibleData = ${JSON.stringify(bibleData, null, 2)};\n`;
  fs.writeFileSync(BIBLE_DATA_PATH, updatedFileContent, 'utf-8');

  console.log(`Successfully updated data. Updated prices for ${updatedCount} variants.`);

} catch (e) {
  console.error("Error updating bible data:", e);
}
