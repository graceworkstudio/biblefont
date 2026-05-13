const fs = require('fs');

const appPath = 'src/App.jsx';
const appContent = fs.readFileSync(appPath, 'utf8');

// 1. Extract bibleData
const startIdx = appContent.indexOf('const bibleData = {');
const endIdx = appContent.indexOf('};', startIdx) + 2;
const bibleDataStr = appContent.substring(startIdx, endIdx);

let bibleData;
try {
    bibleData = new Function('return ' + bibleDataStr.replace('const bibleData = ', '').replace(/;$/, ''))();
} catch (e) {
    console.error("Failed to parse bibleData:", e);
    process.exit(1);
}

// 2. Prepare C (Daehan) data
bibleData.C = {
  "name": "대한기독교서회",
  "items": [
    {
      "model": "프라임주석성경",
      "size": "대",
      "mm": 4.5,
      "type": "study",
      "variants": [
        { "label": "대합본/PU/지퍼/블루블랙", "img": "https://chhouse.kr/web/product/big/202604/79f54e0efb8f7c62283e686c3a52d77a.jpg", "url": "https://chhouse.kr/product/detail.html?product_no=57298&cate_no=1380&display_group=1", "originalPrice": 58000, "salePrice": 52200 },
        { "label": "대합본/PU/지퍼/버건디", "img": "https://chhouse.kr/web/product/big/202604/7f0d306a4a650e6c5ff1b38885ceece3.jpg", "url": "https://chhouse.kr/product/detail.html?product_no=57299&cate_no=1380&display_group=1", "originalPrice": 58000, "salePrice": 52200 }
      ]
    },
    {
      "model": "프라임주석성경",
      "size": "중",
      "mm": 4.1,
      "type": "study",
      "variants": [
        { "label": "중합본/PU/지퍼/다크브라운", "img": "https://chhouse.kr/web/product/big/202604/20a719ef566aadd90b4fd1acd3067542.jpg", "url": "https://chhouse.kr/product/detail.html?product_no=57300&cate_no=1353&display_group=1", "originalPrice": 54000, "salePrice": 48600 },
        { "label": "중합본/PU/지퍼/카키그레이", "img": "https://chhouse.kr/web/product/big/202405/827c19946d4c8e64ebbee65bc74aa7b1.jpg", "url": "https://chhouse.kr/product/detail.html?product_no=40867&cate_no=1380&display_group=1", "originalPrice": 54000, "salePrice": 48600 }
      ]
    },
    {
      "model": "취리히바이블",
      "size": "특대",
      "mm": 4.0,
      "type": "study",
      "variants": [
        { "label": "특대합본/천연/지퍼/블루블랙", "img": "https://chhouse.kr/web/product/big/202405/a01e296ec8e0baf3ab0da2383c49413b.jpg", "url": "https://chhouse.kr/product/detail.html?product_no=37950&cate_no=1366&display_group=1", "originalPrice": 61000, "salePrice": 54900 },
        { "label": "특대합본/천연/지퍼/다크브라운", "img": "https://chhouse.kr/web/product/big/202405/2601c80956f73e33f9c0afc2b6128887.jpg", "url": "https://chhouse.kr/product/detail.html?product_no=37949&cate_no=1366&display_group=1", "originalPrice": 61000, "salePrice": 54900 },
        { "label": "특대합본/PU/지퍼/버건디", "img": "https://chhouse.kr/web/product/big/202405/85d2f781eec3b92a28961296ea3aa56a.jpg", "url": "https://chhouse.kr/product/detail.html?product_no=37954&cate_no=1366&display_group=1", "originalPrice": 49000, "salePrice": 44100 },
        { "label": "특대합본/PU/지퍼/다크브라운", "img": "https://chhouse.kr/web/product/big/202405/923df645eaf9012a96038fa4880d6561.jpg", "url": "https://chhouse.kr/product/detail.html?product_no=37953&cate_no=1366&display_group=1", "originalPrice": 49000, "salePrice": 44100 },
        { "label": "특대합본/PU/지퍼/블루블랙", "img": "https://chhouse.kr/web/product/big/202405/944de7d65be586b91478fab2371cf90b.jpg", "url": "https://chhouse.kr/product/detail.html?product_no=37955&cate_no=1366&display_group=1", "originalPrice": 49000, "salePrice": 44100 }
      ]
    },
    {
      "model": "취리히바이블",
      "size": "특중",
      "mm": 3.5,
      "type": "study",
      "variants": [
        { "label": "특중합본/천연/지퍼/다크브라운", "img": "https://chhouse.kr/web/product/big/202405/8718503ccb1d866d222ddcc9d76ca736.jpg", "url": "https://chhouse.kr/product/detail.html?product_no=37951&cate_no=1446&display_group=1", "originalPrice": 52000, "salePrice": 46800 },
        { "label": "특중합본/천연/지퍼/블루블랙", "img": "https://chhouse.kr/web/product/big/202405/e06145f6e68da1493f4f214270e63bee.jpg", "url": "https://chhouse.kr/product/detail.html?product_no=37952&cate_no=1446&display_group=1", "originalPrice": 52000, "salePrice": 46800 },
        { "label": "특중합본/PU/지퍼/버건디", "img": "https://chhouse.kr/web/product/big/202405/2ac782c3e087b96888978f7777bd4f7e.jpg", "url": "https://chhouse.kr/product/detail.html?product_no=37957&cate_no=1446&display_group=1", "originalPrice": 40000, "salePrice": 36000 },
        { "label": "특중합본/PU/지퍼/다크브라운", "img": "https://chhouse.kr/web/product/big/202405/5bde018b939f8d74d02ed10de703620c.jpg", "url": "https://chhouse.kr/product/detail.html?product_no=37956&cate_no=1446&display_group=1", "originalPrice": 40000, "salePrice": 36000 },
        { "label": "특중합본/PU/지퍼/카키블랙", "img": "https://chhouse.kr/web/product/big/202405/72237e878d678a5bfc8804fa3e92ffbf.jpg", "url": "https://chhouse.kr/product/detail.html?product_no=37958&cate_no=1446&display_group=1", "originalPrice": 40000, "salePrice": 36000 }
      ]
    },
    {
      "model": "취리히바이블",
      "size": "소",
      "mm": 3.0,
      "type": "study",
      "variants": [
        { "label": "소합본/천연/지퍼/다크브라운", "img": "https://chhouse.kr/web/product/big/202405/4c2507346fbfa48739205ad529409957.jpg", "url": "https://chhouse.kr/product/detail.html?product_no=38295&cate_no=1408&display_group=1", "originalPrice": 49000, "salePrice": 44100 },
        { "label": "소합본/천연/지퍼/블루블랙", "img": "https://chhouse.kr/web/product/big/202405/bde44bd74f398c17563afdfaaf07037a.jpg", "url": "https://chhouse.kr/product/detail.html?product_no=38296&cate_no=1408&display_group=1", "originalPrice": 49000, "salePrice": 44100 },
        { "label": "소합본/PU/지퍼/다크브라운", "img": "https://chhouse.kr/web/product/big/202405/151d526a01c20d1e20e1d1a12ca49ab3.jpg", "url": "https://chhouse.kr/product/detail.html?product_no=38297&cate_no=1408&display_group=1", "originalPrice": 37000, "salePrice": 33300 },
        { "label": "소합본/PU/지퍼/레드", "img": "https://chhouse.kr/web/product/big/202405/11f3934693aa6dbfde03601380ea61d2.jpg", "url": "https://chhouse.kr/product/detail.html?product_no=38298&cate_no=1408&display_group=1", "originalPrice": 37000, "salePrice": 33300 },
        { "label": "소합본/PU/지퍼/모던브라운", "img": "https://chhouse.kr/web/product/big/202405/23d2b79457c2a64a8f95eeed48bc0895.jpg", "url": "https://chhouse.kr/product/detail.html?product_no=38299&cate_no=1408&display_group=1", "originalPrice": 37000, "salePrice": 33300 }
      ]
    },
    {
      "model": "포커스성경",
      "size": "특소",
      "mm": 2.6,
      "type": "study",
      "variants": [
        { "label": "특소합본/PU/지퍼/인디핑크", "img": "https://chhouse.kr/web/product/big/202604/441c573a7508a1d6d44d74d22e2616b8.jpg", "url": "https://chhouse.kr/product/detail.html?product_no=57327&cate_no=1363&display_group=1", "originalPrice": 38000, "salePrice": 34200 },
        { "label": "특소합본/PU/지퍼/인디고블루", "img": "https://chhouse.kr/web/product/big/202405/f451410530973703219274223000be22.jpg", "url": "https://chhouse.kr/product/detail.html?product_no=45763&cate_no=1363&display_group=1", "originalPrice": 38000, "salePrice": 34200 },
        { "label": "특소합본/PU/지퍼/민트", "img": "https://chhouse.kr/web/product/big/202405/76cf85ed78bed62b143cf549bacdb214.jpg", "url": "https://chhouse.kr/product/detail.html?product_no=45764&cate_no=1363&display_group=1", "originalPrice": 38000, "salePrice": 34200 }
      ]
    },
    {
      "model": "포커스성경",
      "size": "초미니",
      "mm": 2.1,
      "type": "study",
      "variants": [
        { "label": "초미니합본/PU/지퍼/민트", "img": "https://chhouse.kr/web/product/big/202604/a874032290a1e0d66e92636875b99ccc.jpg", "url": "https://chhouse.kr/product/detail.html?product_no=57301&cate_no=1412&display_group=1", "originalPrice": 32000, "salePrice": 28800 },
        { "label": "초미니합본/PU/지퍼/인디고블루", "img": "https://chhouse.kr/web/product/big/202405/df3d34c98d6fa6c26291d38382a4cbef.jpg", "url": "https://chhouse.kr/product/detail.html?product_no=45767&cate_no=1412&display_group=1", "originalPrice": 32000, "salePrice": 28800 },
        { "label": "초미니합본/PU/지퍼/로즈핑크", "img": "https://chhouse.kr/web/product/big/202405/43ed95643aa508e60ab19527066cab64.jpg", "url": "https://chhouse.kr/product/detail.html?product_no=45768&cate_no=1412&display_group=1", "originalPrice": 32000, "salePrice": 28800 }
      ]
    }
  ]
};

// 3. Update D (Duranno) study items
// Keep standard items, replace study items
bibleData.D.items = bibleData.D.items.filter(item => item.type === "standard");
bibleData.D.items.push(
  {
    "model": "비전성경",
    "size": "중",
    "mm": 3.2,
    "type": "study",
    "variants": [
      { "label": "중합본/PU/지퍼/황갈색", "img": "https://chhouse.cafe24.com/web/product/big/202405/c318b200d83cb98d5f73d07f4cb4e062.jpg", "url": "https://chhouse.cafe24.com/product/detail.html?product_no=42829&cate_no=1393&display_group=1", "originalPrice": 40000, "salePrice": 36000 },
      { "label": "중합본/PU/지퍼/진갈색", "img": "https://chhouse.cafe24.com/web/product/big/202405/65eda45ae5171c3f264a832dc4999afb.jpg", "url": "https://chhouse.cafe24.com/product/detail.html?product_no=42828&cate_no=1393&display_group=1", "originalPrice": 40000, "salePrice": 36000 },
      { "label": "중합본/PU/지퍼/진청색", "img": "https://chhouse.cafe24.com/web/product/big/202405/5102004daef0073a8b7e6f39b73788ad.jpg", "url": "https://chhouse.cafe24.com/product/detail.html?product_no=42830&cate_no=1393&display_group=1", "originalPrice": 40000, "salePrice": 36000 }
    ]
  },
  {
    "model": "비전성경",
    "size": "특미니",
    "mm": 2.4,
    "type": "study",
    "variants": [
      { "label": "특미니합본/PU/지퍼/모카무스", "img": "https://chhouse.cafe24.com/web/product/big/202601/6d017950082a1e5fefa0272510dc4952.jpg", "url": "https://chhouse.cafe24.com/product/detail.html?product_no=56538&cate_no=1452&display_group=1", "originalPrice": 32000, "salePrice": 28800 },
      { "label": "특미니합본/PU/지퍼/네이비", "img": "https://chhouse.cafe24.com/web/product/big/202601/35fe15c583b4245561a6108244a9c818.jpg", "url": "https://chhouse.cafe24.com/product/detail.html?product_no=56537&cate_no=1452&display_group=1", "originalPrice": 32000, "salePrice": 28800 },
      { "label": "특미니합본/PU/지퍼/베이지", "img": "https://chhouse.cafe24.com/web/product/big/202601/6fa323de1e49cf3d8ac20ab06ad3f153.jpg", "url": "https://chhouse.cafe24.com/product/detail.html?product_no=56540&cate_no=1452&display_group=1", "originalPrice": 32000, "salePrice": 28800 },
      { "label": "특미니합본/PU/지퍼/민트블루", "img": "https://chhouse.cafe24.com/web/product/big/202601/417964cc2e7dfaa691e6df48b7b9a984.jpg", "url": "https://chhouse.cafe24.com/product/detail.html?product_no=56539&cate_no=1452&display_group=1", "originalPrice": 32000, "salePrice": 28800 }
    ]
  },
  {
    "model": "비전성경",
    "size": "초미니",
    "mm": 2.0,
    "type": "study",
    "variants": [
      { "label": "초미니합본/PU/밴드형/샌드베이지", "img": "https://chhouse.cafe24.com/web/product/big/202602/8e4ae1f259c5f1b1a71a1e521fc85dff.jpg", "url": "https://chhouse.cafe24.com/product/detail.html?product_no=56767&cate_no=1392&display_group=1", "originalPrice": 30000, "salePrice": 27000 },
      { "label": "초미니합본/PU/밴드형/로즈핑크", "img": "https://chhouse.cafe24.com/web/product/big/202602/eed9eab338e331440d34892fa6b8c8d4.jpg", "url": "https://chhouse.cafe24.com/product/detail.html?product_no=56766&cate_no=1392&display_group=1", "originalPrice": 30000, "salePrice": 27000 },
      { "label": "초미니합본/PU/밴드형/라이트네이비", "img": "https://chhouse.cafe24.com/web/product/big/202602/dc8e0fddfacca0968b8fb2f31e553919.jpg", "url": "https://chhouse.cafe24.com/product/detail.html?product_no=56765&cate_no=1392&display_group=1", "originalPrice": 30000, "salePrice": 27000 },
      { "label": "초미니합본/PU/밴드형/다크그레이", "img": "https://chhouse.cafe24.com/web/product/big/202602/c23db938c221f219b36dc015a3025951.jpg", "url": "https://chhouse.cafe24.com/product/detail.html?product_no=56764&cate_no=1392&display_group=1", "originalPrice": 30000, "salePrice": 27000 }
    ]
  }
);

// 4. Stringify and write back
const resultStr = 'const bibleData = ' + JSON.stringify(bibleData, null, 2) + ';';
const newAppContent = appContent.substring(0, startIdx) + resultStr + appContent.substring(endIdx);

fs.writeFileSync(appPath, newAppContent, 'utf8');
console.log("Updated Daehan and Duranno data successfully.");
