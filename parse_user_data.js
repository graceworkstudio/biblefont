const fs = require('fs');

// We will parse the text manually since it's semi-structured.
const data = {
  A: {
    name: "아가페",
    items: [
      // 2. 성경전서: NKR72ATH에서 처음 데이타만 남기고 나머지(결혼성경) 삭제
      // 3. 해설/주석: 큰글자 굿모닝성경 대/중, 뉴슬림 굿모닝성경 특미니/초미니, 컬러성경 대/중, 예스 주석성경 대
    ]
  },
  W: { name: "생명의말씀사", items: [] },
  S: { name: "성서원", items: [] },
  C: { name: "대한기독교서회", items: [] },
  D: { name: "두란노", items: [] },
  L: { name: "라스텔라", items: [] } // keep existing L
};

// I will write the actual script in the next step after I extract the exact existing A, L data.
