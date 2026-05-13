const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

const match = content.match(/(const bibleData = )(\{[\s\S]*?\n\};)(\n\s*const filteredItems)/);
if (!match) {
  console.log('bibleData not found');
  process.exit(1);
}

const data = eval('(' + match[2].slice(0, -1) + ')'); // slice out the semicolon

// Updates logic
const updates = {
  // 아가페
  'NKR82AB': { '특대': 4.6 },
  'NKR72EAB': { '대': 4.4 },
  'NKR72AB': { '중': 3.9 },
  'NKR62EAB': { '소': 3.4 },
  'NKR72EAM': { '대': 4.4 }, // If another "대"
  '큰글자 굿모닝성경': { '대': 3.6, '중': 3.3, '소': 2.9 },
  '뉴슬림 굿모닝성경': { '소': 2.6, '특미니': 2.4, '초미니': 2 },
  '컬러성경': { '대': 4, '중': 3.3 },
  '예스 주석성경': { '대': 3.7 },
  
  // 생명의말씀사
  '큰글자 스터디성경': { '대': 4.2, '중': 3.9 },
  '슬림 스터디성경': { '소': 2.6 },
  '프리미엄 굿데이성경': { '대': 3.9 },
  '뉴빅슬림 굿데이성경': { '중': 3.5 },
  '올 뉴 굿데이성경': { '초미니': 2.3 },
  '모던컬러성경': { '대': 4.1, '중': 3.5, '소': 3 }, // user wrote "모던 컬러 성경"
  '모던 컬러 성경': { '대': 4.1, '중': 3.5, '소': 3 },
  '베이직성경': { '중': 3.2, '소': 2.8 },
  '슬림성경': { '중': 3 },
  '더바이블': { '소': 2.8 },
  '위드바이블': { '미니': 2.6, 'undefined': 2.6 }, // user didn't specify size
  
  // 성서원
  '주석큰성경': { '특대': 4.5, '중': 4 },
  '베스트성경': { '중': 3.5, '특소': 2.9 },
  '좋은성경': { '대': 3.7, '특소': 2.9 },
  '빅컬러성경': { '대': 4 },
  '빅컬러 성경': { '대': 4 },
  '만나성경': { '특미니': 2.4 },
  
  // 대한기독교서회
  '프라임 주석 성경': { '대': 4.5, '중': 4.1 },
  '취리히바이블': { '특대': 4, '특중': 3.5, '소': 3 },
  '포커스성경': { '특소': 2.6, '초미니': 2.1 },
  '포커스 성경': { '특소': 2.6, '초미니': 2.1 },
  
  // 두란노
  '비전성경': { '중': 3.2, '특미니': 2.4, '초미니': 2 }
};

for (const k in data) {
  for (const item of data[k].items) {
    // Determine type
    const model = item.model;
    const isStudy = /스터디|주석|비전|포커스|만나|굿모닝/.test(model);
    item.type = isStudy ? 'study' : 'standard';

    // Update mm
    const modelUpdates = updates[model] || updates[model.replace(/\s+/g, '')];
    if (modelUpdates) {
      if (modelUpdates[item.size]) {
        item.mm = modelUpdates[item.size];
      } else if (modelUpdates['undefined'] && !item.size) {
        item.mm = modelUpdates['undefined'];
      } else if (modelUpdates['미니'] && item.size === '미니') {
        item.mm = modelUpdates['미니'];
      }
    }
    
    // Hardcode fallback for '위드바이블'
    if (model.includes('위드바이블')) item.mm = 2.6;
  }
}

const newObjStr = JSON.stringify(data, null, 2);
content = content.replace(match[2], newObjStr + ';');
fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log('App.jsx updated with script!');
