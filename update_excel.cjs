const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const FILE_NAME = '성경기타번역본들.xlsx';
const BIBLE_DATA_PATH = path.join(__dirname, 'src', 'data', 'bibleData.js');

try {
  const workbook = xlsx.readFile(FILE_NAME);
  
  // Publisher mapping
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

  // 모든 시트를 순회
  workbook.SheetNames.forEach(sheetName => {
    console.log(`Processing sheet: ${sheetName}`);
    const worksheet = workbook.Sheets[sheetName];
    const rawData = xlsx.utils.sheet_to_json(worksheet);

    let lastTranslation = sheetName; // 시트명을 기본 번역본으로 사용 (필요시)
    let lastPublisher = '';
    let lastModel = '';
    let lastSize = '';
    let lastMm = 0;

    rawData.forEach((row, idx) => {
      // Inherit from previous row if undefined
      const translation = row['번역본'] || lastTranslation || '개역개정';
      const publisher = row['출판사'] || lastPublisher;
      const model = row['모델명'] || lastModel;
      const size = row['크기'] || lastSize;
      const variantLabel = row['모델명상세'];
      const variantImg = row['표지이미지링크'];
      const variantUrl = row['상세페이지링크'];
      const originalPrice = row[' 정가 '] || row['정가'] || 0;
      const salePrice = row[' 할인가 '] || row['할인가'] || 0;
      const rawMm = row['폰트크기'] || row['mm'];
      const mm = rawMm !== undefined ? parseFloat(rawMm) : lastMm;

      // Update last seen values
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
          type: 'standard', // default type
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

  console.log(`Total variants read from all sheets: ${totalVariantsRead}`);

  let bibleDataFile = fs.readFileSync(BIBLE_DATA_PATH, 'utf-8');
  
  const jsonStr = bibleDataFile.replace('export const bibleData = ', '').replace(/;\s*$/, '');
  let bibleData;
  try {
    bibleData = JSON.parse(jsonStr);
  } catch (e) {
    bibleData = eval('(' + jsonStr + ')');
  }

  let addedCount = 0;

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
          if (!existingItem.variants.find(ev => ev.label === nv.label)) {
            existingItem.variants.push(nv);
            addedCount++;
          }
        });
      } else {
        bibleData[pubKey].items.push(newItem);
        addedCount += newItem.variants.length;
      }
    });
  });

  const updatedFileContent = `export const bibleData = ${JSON.stringify(bibleData, null, 2)};\n`;
  fs.writeFileSync(BIBLE_DATA_PATH, updatedFileContent, 'utf-8');

  console.log(`Successfully merged data. Added ${addedCount} variants into bibleData.js.`);

} catch (e) {
  console.error("Error updating bible data:", e);
}
