const fs = require('fs');

const rawData = `
큰글성경	특대	옵션 1	특대합본/천연/지퍼/다크브라운	https://chhouse.kr/web/product/big/202410/7896cf855debbbc0ea7a1d1fd46d89a6.jpg	https://chhouse.kr/product/detail.html?product_no=50774&cate_no=1358&display_group=1	82000	73800
		옵션 2	특대합본/천연/지퍼/자주	https://chhouse.kr/web/product/big/202410/c604b1881dc1e00ea0d1672d023061a9.jpg	https://chhouse.kr/product/detail.html?product_no=50775&cate_no=1358&display_group=1	82000	73800
		옵션 3	특대합본/천연/무지퍼/다크브라운	https://chhouse.kr/web/product/big/202506/9a248873ccfa1d39943d38a626ecdcdc.jpg	https://chhouse.kr/product/detail.html?product_no=53975&cate_no=1358&display_group=1	75000	67500
		옵션 4	특대합본/PU/지퍼/브라운	https://chhouse.kr/web/product/big/202604/b8aaafb5409a0dddc3837300bfed6efc.jpg	https://chhouse.kr/product/detail.html?product_no=32487&cate_no=1358&display_group=1	65000	58500
		옵션 5	특대합본/PU/지퍼/다크브라운	https://chhouse.kr/web/product/big/202604/ce3de01003785531b644fadc9600263a.jpg	https://chhouse.kr/product/detail.html?product_no=32485&cate_no=1358&display_group=1	65000	58500
		옵션 6	특대단본/PU/무지퍼/브라운	https://chhouse.kr/web/product/big/202506/e973f6746ba2b389fc1bb26785aaa483.jpg	https://chhouse.kr/product/detail.html?product_no=54205&cate_no=1358&display_group=1	49000	44100
							
큰글성경	대	옵션 1	대합본/천연/지퍼/다크브라운	https://chhouse.kr/web/product/big/202405/ab5439a3d1aa9927cee7737e8f34067d.jpg	https://chhouse.kr/product/detail.html?product_no=43586&cate_no=1347&display_group=1	77000	69300
		옵션 2	대합본/천연/지퍼/자주	https://chhouse.kr/web/product/big/202405/78377a3b3b6ef018c735a46e42b7d1b6.jpg	https://chhouse.kr/product/detail.html?product_no=45076&cate_no=1347&display_group=1	77000	69300
		옵션 3	대합본/PU/지퍼/다크브라운	https://chhouse.kr/web/product/big/202604/88c5c7dd04a60bf7a3f52b21f27b705a.jpg	https://chhouse.kr/product/detail.html?product_no=37243&cate_no=1347&display_group=1	59000	53100
		옵션 4	대합본/PU/지퍼/브라운	https://chhouse.kr/web/product/big/202404/93d6cb3bcb59f5a025741d9b622255ce.jpg	https://chhouse.kr/product/detail.html?product_no=18777&cate_no=1347&display_group=1	59000	53100
		옵션 5	대합본/PU/무지퍼/브라운	https://chhouse.kr/web/product/big/202510/addd90399bb5cfd542e47ba29ff81fb2.jpg	https://chhouse.kr/product/detail.html?product_no=55603&cate_no=1347&display_group=1	50000	45000
							
큰글성경	중	옵션 1	중합본/천연/지퍼/자주	https://chhouse.kr/web/product/big/202404/8696e7ae87ebe3510e208621a0f38536.jpg	https://chhouse.kr/product/detail.html?product_no=46703&cate_no=1388&display_group=1	67000	60300
		옵션 2	중합본/PU/지퍼/라벤더	https://chhouse.kr/web/product/big/202404/b616d43c2548dec16ac813791ea34800.jpg	https://chhouse.kr/product/detail.html?product_no=18573&cate_no=1388&display_group=1	55000	49500
		옵션 3	중합본/PU/지퍼/브라운	https://chhouse.kr/web/product/big/202404/d5f089f63fcd955cc90b037b6d319343.jpg	https://chhouse.kr/product/detail.html?product_no=18576&cate_no=1388&display_group=1	55000	49500
		옵션 4	중단본/PU/무지퍼/다크브라운	https://chhouse.kr/web/product/big/202507/61f9fd9cbb5d66245e96858fa05bb413.jpg	https://chhouse.kr/product/detail.html?product_no=54283&cate_no=1388&display_group=1	49000	44100
							
큰글성경	소	옵션 1	소합본/천연/지퍼/레드	https://chhouse.cafe24.com/web/product/big/202409/4a3fd5cb8ecfd9ec9ded41e6407ff93e.jpg	https://chhouse.cafe24.com/product/detail.html?product_no=47800&cate_no=1381&display_group=1	60000	54000
		옵션 2	소합본/천연/지퍼/잉키블루	https://chhouse.cafe24.com/web/product/big/202409/1999a4168a9c6a592cd467d88a2ccd38.jpg	https://chhouse.cafe24.com/product/detail.html?product_no=47799&cate_no=1381&display_group=1	60000	54000
		옵션 3	소합본/PU/지퍼/네이비	https://chhouse.kr/web/product/big/202404/6c3214c41ddf0fc61092bdad2b8d389a.jpg	https://chhouse.kr/product/detail.html?product_no=37787&cate_no=1381&display_group=1	50000	45000
		옵션 4	소합본/PU/지퍼/핑크베이지	https://chhouse.kr/web/product/big/202407/4f4e9416c8239ed3d392ec4a6eef0fff.jpg	https://chhouse.kr/product/detail.html?product_no=49042&cate_no=1381&display_group=1	50000	45000
		옵션 5	소단본/천연/무지퍼/베이지	https://chhouse.kr/web/product/big/202404/55797812ad48f17ac58864312b59a156.jpg	https://chhouse.kr/product/detail.html?product_no=38206&cate_no=1381&display_group=1	41000	36900

큰글자 굿모닝성경	소	옵션 1	소합본/PU/지퍼/피치베이지	https://chhouse.kr/web/product/big/202511/b838846f5a8d51481917add52d6f7400.jpg	https://chhouse.kr/product/detail.html?product_no=55854&cate_no=1381&display_group=1	38000	34200
		옵션 2	소합본/PU/지퍼/올리브	https://chhouse.kr/web/product/big/202511/a1c5fbb4fb65e2d67e79230696d28a0b.jpg	https://chhouse.kr/product/detail.html?product_no=55853&cate_no=1381&display_group=1	38000	34200
		옵션 3	소단본/PU/지퍼/그레이	https://chhouse.kr/web/product/big/202511/c63bd76c01c61b66ef2c6a03108413ad.jpg	https://chhouse.kr/product/detail.html?product_no=55995&cate_no=1381&display_group=1	29000	26100

뉴슬림 굿모닝성경	소	옵션 1	소합본/PU/지퍼/아이보리	https://chhouse.kr/web/product/big/202505/a15479aa64a468a4bc043ca9b21d95ff.jpg	https://chhouse.kr/product/detail.html?product_no=53655&cate_no=1381&display_group=1	35000	31500
		옵션 2	소합본/PU/지퍼/네이비	https://chhouse.kr/web/product/big/202505/55970cea88fd01bfd4b4698feae7991a.jpg	https://chhouse.kr/product/detail.html?product_no=53654&cate_no=1381&display_group=1	35000	31500
		옵션 3	소단본/PU/지퍼/올리브	https://chhouse.kr/web/product/big/202505/fd92aefd20decc4cd1aa0258299b8371.jpg	https://chhouse.kr/product/detail.html?product_no=53653&cate_no=1381&display_group=1	28000	25200
`;

const lines = rawData.split('\n');
const parsedData = {};

const getMm = (model, size) => {
  if (model === '큰글성경') {
    if (size === '특대') return 4.6;
    if (size === '대') return 4.4;
    if (size === '중') return 3.9;
    if (size === '소') return 3.4;
  }
  if (model === '큰글자 굿모닝성경') {
    if (size === '소') return 2.9;
  }
  if (model === '뉴슬림 굿모닝성경') {
    if (size === '소') return 2.6;
  }
  return 3.0; // fallback
};

let currentModel = null;
let currentSize = null;

for (const line of lines) {
  if (!line.trim()) continue;
  const parts = line.split('\t').map(s => s.trim()).filter(s => s);
  
  // If the line starts with a model name like '큰글성경', it means it has model, size, and option
  if (parts.length >= 7 && !parts[0].startsWith('옵션')) {
    currentModel = parts[0];
    currentSize = parts[1];
    if (!parsedData[currentModel]) parsedData[currentModel] = {};
    if (!parsedData[currentModel][currentSize]) {
      parsedData[currentModel][currentSize] = {
        model: currentModel,
        size: currentSize,
        mm: getMm(currentModel, currentSize),
        type: 'study', // user asked to add it and earlier sorted it in study
        variants: []
      };
    }
    
    // Parse the variant part which is the rest of the array
    // parts[2] is '옵션 1', parts[3] is label, parts[4] is img, parts[5] is url, parts[6] is orig, parts[7] is sale
    if (parts[2] && parts[2].startsWith('옵션')) {
      const label = parts[3];
      const img = parts[4];
      const url = parts[5];
      const originalPrice = parseInt(parts[6] ? parts[6].replace(/,/g, '') : '0', 10);
      const salePrice = parseInt(parts[7] ? parts[7].replace(/,/g, '') : '0', 10);
      parsedData[currentModel][currentSize].variants.push({ label, img, url, originalPrice, salePrice });
    }
  } else if (parts[0] && parts[0].startsWith('옵션')) {
    // This is a continuation of the previous model/size
    if (currentModel && currentSize) {
      const label = parts[1];
      const img = parts[2];
      const url = parts[3];
      const originalPrice = parseInt(parts[4] ? parts[4].replace(/,/g, '') : '0', 10);
      const salePrice = parseInt(parts[5] ? parts[5].replace(/,/g, '') : '0', 10);
      parsedData[currentModel][currentSize].variants.push({ label, img, url, originalPrice, salePrice });
    }
  }
}

const appContent = fs.readFileSync('src/App.jsx', 'utf8');
const match = appContent.match(/(const bibleData = )(\{[\s\S]*?\n\};)(\n\s*const customStudyOrder)/);
if (!match) {
  console.log('bibleData not found');
  process.exit(1);
}

const data = eval('(' + match[2].slice(0, -1) + ')');

for (const model in parsedData) {
  for (const size in parsedData[model]) {
    const newItem = parsedData[model][size];
    // Find matching item in 'A' (Agape)
    const existingIdx = data['A'].items.findIndex(i => i.model === model && i.size === size);
    if (existingIdx !== -1) {
      data['A'].items[existingIdx] = newItem;
    } else {
      data['A'].items.push(newItem);
    }
  }
}

const newObjStr = JSON.stringify(data, null, 2);
fs.writeFileSync('src/App.jsx', appContent.replace(match[2], newObjStr + ';'), 'utf8');
console.log('Successfully injected Agape models!');
