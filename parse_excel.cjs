const xlsx = require('xlsx');
const fs = require('fs');

const FILE_NAME = '성경기타번역본들.xlsx';

try {
  const workbook = xlsx.readFile(FILE_NAME);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const data = xlsx.utils.sheet_to_json(worksheet);
  console.log("=== EXCEL PREVIEW ===");
  console.log(JSON.stringify(data.slice(0, 5), null, 2));
  console.log(`\nTotal rows: ${data.length}`);
  
  // Let's analyze issues
  const issues = [];
  data.forEach((row, idx) => {
    // Check if required fields exist
    // Assuming columns might be like 'model', 'size', 'mm', 'translation', etc.
    const keys = Object.keys(row);
    // Find mm
    const mmKey = keys.find(k => k.toLowerCase().includes('mm') || k.includes('크기') && !k.includes('휴대'));
    const sizeKey = keys.find(k => k.includes('용도') || k.includes('휴대성') || k === 'size');
    const translationKey = keys.find(k => k.includes('번역') || k === 'translation');
    const modelKey = keys.find(k => k.includes('모델') || k === 'model');
    
    if (mmKey) {
      if (typeof row[mmKey] === 'string' && row[mmKey].toLowerCase().includes('mm')) {
        issues.append(`Row ${idx+2}: mm 값에 문자('mm')가 포함되어 있습니다 -> ${row[mmKey]}`);
      }
    }
  });

  if (issues.length > 0) {
    console.log("\n=== ISSUES FOUND ===");
    issues.forEach(iss => console.log(iss));
  } else {
    console.log("\n=== NO CRITICAL ISSUES FOUND ===");
  }
  
  fs.writeFileSync('excel_preview.json', JSON.stringify(data, null, 2));
} catch (e) {
  console.error("Error reading excel file:", e);
}
