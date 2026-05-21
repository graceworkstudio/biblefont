const fs = require('fs');
const path = require('path');

// 1. JSON 파일 읽기
const itemCodes = JSON.parse(fs.readFileSync('all_itemcodes.json', 'utf8'));

// 2. bibleData.js 읽기
let bibleDataContent = fs.readFileSync('src/data/bibleData.js', 'utf8');

// 정규식으로 "url": "..." 다음에 "itemCode": "..." 를 추가합니다.
// 이미 존재하는 경우에는 무시하거나 덮어씁니다.
// 제일 안전한 방법은 객체를 파싱해서 다시 쓰는 것이지만, bibleData.js는 모듈 export 형태이므로 텍스트 치환을 사용합니다.

let count = 0;
for (const [url, data] of Object.entries(itemCodes)) {
  if (data.item_code) {
    // Escape URL for regex
    const escapedUrl = url.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`("url"\\s*:\\s*"${escapedUrl}")(?!\\s*,\\s*"itemCode")`, 'g');
    
    bibleDataContent = bibleDataContent.replace(regex, `$1,\n            "itemCode": "${data.item_code}"`);
    count++;
  }
}

fs.writeFileSync('src/data/bibleData.js', bibleDataContent, 'utf8');
console.log(`성공적으로 ${count}개의 itemCode를 bibleData.js에 추가했습니다.`);
