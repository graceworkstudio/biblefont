const xlsx = require('xlsx');
const workbook = xlsx.readFile('성경기타번역본들.xlsx');
workbook.SheetNames.forEach(sheetName => {
  const worksheet = workbook.Sheets[sheetName];
  const rawData = xlsx.utils.sheet_to_json(worksheet);
  if (rawData.length > 0) {
    console.log(`Sheet: ${sheetName} keys:`, Object.keys(rawData[0]));
  }
});
