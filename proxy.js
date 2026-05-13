import express from 'express';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const app = express();
const port = 5005;
const MALL_ID = "chhouse";

const TOKEN_FILE = path.join(process.cwd(), 'cafe24_token.json');

// .env 파서
const envPath = path.join(process.cwd(), '.env');
const envConfig = {};
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) envConfig[match[1]] = match[2];
  });
}

const CAFE24_CLIENT_ID = envConfig.CAFE24_CLIENT_ID || process.env.CAFE24_CLIENT_ID || "local_test_id";
const CAFE24_CLIENT_SECRET = envConfig.CAFE24_CLIENT_SECRET || process.env.CAFE24_CLIENT_SECRET || "local_test_secret";

function getLocalToken() {
  if (fs.existsSync(TOKEN_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
    } catch (e) {
      console.error('Failed to parse token file', e);
    }
  }
  return null;
}

function saveLocalToken(tokenData) {
  tokenData.issued_at = Date.now();
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokenData, null, 2));
}

async function getValidAccessToken() {
  let tokenData = getLocalToken();
  if (!tokenData || !tokenData.access_token) return process.env.CAFE24_ACCESS_TOKEN;

  const expiresAt = tokenData.issued_at + (2 * 60 * 60 * 1000); // 2 hours
  const now = Date.now();

  // If token is expired or expires in less than 5 minutes
  if (now >= expiresAt - (5 * 60 * 1000)) {
    console.log("Token expired, refreshing...");
    try {
      const tokenUrl = `https://${MALL_ID}.cafe24api.com/api/v2/oauth/token`;
      const base64Auth = Buffer.from(`${CAFE24_CLIENT_ID}:${CAFE24_CLIENT_SECRET}`).toString('base64');
      const params = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: tokenData.refresh_token
      });
      const tokenRes = await fetch(tokenUrl, { 
        method: "POST", 
        body: params,
        headers: {
          'Authorization': `Basic ${base64Auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      const newTokenData = await tokenRes.json();
      if (newTokenData.access_token) {
        saveLocalToken(newTokenData);
        return newTokenData.access_token;
      } else {
        console.error("Failed to refresh token", newTokenData);
        return process.env.CAFE24_ACCESS_TOKEN;
      }
    } catch (err) {
      console.error("Refresh error", err);
      return process.env.CAFE24_ACCESS_TOKEN;
    }
  }
  return tokenData.access_token;
}

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  next();
});

app.get('/login', (req, res) => {
  // 스크린샷에서 확인된 정확한 주소를 사용합니다.
  const redirectUri = `https://biblefont-api-12345.cloudfunctions.net/cafe24OAuthCallback`;
  const authUrl = `https://${MALL_ID}.cafe24api.com/api/v2/oauth/authorize?response_type=code&client_id=${CAFE24_CLIENT_ID}&state=test&redirect_uri=${encodeURIComponent(redirectUri)}&scope=mall.read_product`;
  res.redirect(authUrl);
});

app.get('/oauth', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Authorization code missing.");

  try {
    const tokenUrl = `https://${MALL_ID}.cafe24api.com/api/v2/oauth/token`;
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: `https://biblefont-api-12345.cloudfunctions.net/cafe24OAuthCallback`
    });
    const base64Auth = Buffer.from(`${CAFE24_CLIENT_ID}:${CAFE24_CLIENT_SECRET}`).toString('base64');
    
    const response = await fetch(tokenUrl, {
      method: "POST",
      body: params,
      headers: {
        'Authorization': `Basic ${base64Auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const data = await response.json();
    if (data.access_token) {
      saveLocalToken(data);
      res.send("<h1>Token saved successfully!</h1><p>You can now test the real API.</p><script>setTimeout(() => window.close(), 3000);</script>");
    } else {
      res.status(400).json({ error: "Failed to get token", details: data });
    }
  } catch (err) {
    console.error("OAuth Error:", err);
    res.status(500).send("Server error during OAuth");
  }
});

app.get('/biblefont/us-central1/cafe24ProductsTest', async (req, res) => {
  const keyword = req.query.keyword;
  if (!keyword) return res.status(400).json({ error: "Keyword is required" });

  const searchKeyword = keyword.replace(/\s+/g, '');
  const CAFE24_ACCESS_TOKEN = await getValidAccessToken();

  if (!CAFE24_ACCESS_TOKEN) {
    // 생명의말씀사 (Life Book) 수동 입력 데이터
    if (searchKeyword.includes('큰글자스터디성경')) {
      if (searchKeyword.includes('대')) {
        return res.json({
          products: [
            { name: "큰글자 스터디성경 (대합본/천연/지퍼/뉴다크브라운)", price: 68000, salePrice: 61200, thumbnail: "https://chhouse.cafe24.com/web/product/big/202504/29e03364f251595758292afd3bb0e3bb.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=53022&cate_no=1372&display_group=1" },
            { name: "큰글자 스터디성경 (대합본/천연/지퍼/뉴버건디)", price: 68000, salePrice: 61200, thumbnail: "https://chhouse.cafe24.com/web/product/big/202504/651a8123e2eede49bf2620f20574b6cd.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=53023&cate_no=1372&display_group=1" },
            { name: "큰글자 스터디성경 (대합본/PU/지퍼/다크브라운)", price: 56000, salePrice: 50400, thumbnail: "https://chhouse.cafe24.com/web/product/big/202406/96e5787d088f897ab3d624634a395dc1.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=18492&cate_no=1372&display_group=1" }
          ]
        });
      } else {
        return res.json({
          products: [
            { name: "큰글자 스터디성경 (중합본/천연/지퍼/다크브라운)", price: 78000, salePrice: 70200, thumbnail: "https://chhouse.cafe24.com/web/product/big/202409/d6a0714e7ab45f3d1652e351bd24b1f0.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=50086&cate_no=1371&display_group=1" },
            { name: "큰글자 스터디성경 (중합본/PU/지퍼/다크네이비)", price: 55000, salePrice: 49500, thumbnail: "https://chhouse.cafe24.com/web/product/big/202409/1ac63e48135a48688875453c9a28c929.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=50085&cate_no=1371&display_group=1" }
          ]
        });
      }
    }

    if (searchKeyword.includes('슬림스터디성경')) {
      return res.json({
        products: [
          { name: "슬림 스터디성경 (소합본/천연/지퍼/다크브라운)", price: 42000, salePrice: 37800, thumbnail: "https://chhouse.cafe24.com/web/product/big/202411/b577b20e25030f4625e462020eb08ba4.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=51317&cate_no=1345&display_group=1" },
          { name: "슬림 스터디성경 (소합본/PU/밴드형/그린)", price: 36000, salePrice: 32400, thumbnail: "https://chhouse.cafe24.com/web/product/big/202404/d33088e88ae1ea84b717e7a898b1ac55.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=42796&cate_no=1345&display_group=1" },
          { name: "슬림 스터디성경 (소합본/PU/밴드형/네이비)", price: 36000, salePrice: 32400, thumbnail: "https://chhouse.cafe24.com/web/product/big/202404/9c0d9ca2f99d8ffef81a9b6e3b71d507.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=42795&cate_no=1345&display_group=1" }
        ]
      });
    }

    if (searchKeyword.includes('프리미엄굿데이성경')) {
      return res.json({
        products: [
          { name: "프리미엄 굿데이성경 (대합본/천연/지퍼/다크브라운)", price: 67000, salePrice: 60300, thumbnail: "https://chhouse.cafe24.com/web/product/big/202501/5378bcf8416c0e8609f24bba6a4d42e3.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=18174&cate_no=1372&display_group=1" },
          { name: "프리미엄 굿데이성경 (대합본/천연/지퍼/다크네이비)", price: 67000, salePrice: 60300, thumbnail: "https://chhouse.cafe24.com/web/product/big/202501/55f6a0044745f3d68fd17689c271b8cf.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=52204&cate_no=1372&display_group=1" },
          { name: "프리미엄 굿데이성경 (대합본/PU/지퍼/블랙)", price: 63000, salePrice: 56700, thumbnail: "https://chhouse.cafe24.com/web/product/big/202405/01d65352b6e0ed2c0a0733ae09f38015.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=44462&cate_no=1372&display_group=1" },
          { name: "프리미엄 굿데이성경 (대합본/PU/지퍼/다크네이비)", price: 51000, salePrice: 45900, thumbnail: "https://chhouse.cafe24.com/web/product/big/202405/8c225d754a59a3e16f85f2e63d86cc35.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=44337&cate_no=1372&display_group=1" },
          { name: "프리미엄 굿데이성경 (대합본/PU/지퍼/브라운)", price: 51000, salePrice: 45900, thumbnail: "https://chhouse.cafe24.com/web/product/big/202405/fd4c68d48959eeb01077303ebc70348b.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=44336&cate_no=1372&display_group=1" }
        ]
      });
    }

    if (searchKeyword.includes('뉴빅슬림굿데이성경')) {
      return res.json({
        products: [
          { name: "뉴빅슬림 굿데이성경 (중합본/천연/지퍼/뉴버건디)", price: 57000, salePrice: 51300, thumbnail: "https://chhouse.cafe24.com/web/product/big/202405/f6e0e890f8035c9a4cfb6a3e053f546e.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=38862&cate_no=1371&display_group=1" },
          { name: "뉴빅슬림 굿데이성경 (중합본/천연/지퍼/뉴다크브라운)", price: 57000, salePrice: 51300, thumbnail: "https://chhouse.cafe24.com/web/product/big/202405/b58e62b5aa0261bc589d6813e15815b9.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=38861&cate_no=1371&display_group=1" },
          { name: "뉴빅슬림 굿데이성경 (중합본/PU/지퍼/뉴브라운)", price: 47000, salePrice: 42300, thumbnail: "https://chhouse.cafe24.com/web/product/big/202405/b504f15f35c8edf0ab540ae48f597e6a.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=38336&cate_no=1371&display_group=1" },
          { name: "뉴빅슬림 굿데이성경 (중합본/PU/지퍼/뉴네이비)", price: 47000, salePrice: 42300, thumbnail: "https://chhouse.cafe24.com/web/product/big/202409/ae865f4cf05ad35f7355feb7d89c2e47.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=38335&cate_no=1371&display_group=1" }
        ]
      });
    }

    if (searchKeyword.includes('올뉴굿데이성경')) {
      return res.json({
        products: [
          { name: "올 뉴 굿데이성경 (초미니합본/천연/지퍼/베이지)", price: 38000, salePrice: 34200, thumbnail: "https://chhouse.cafe24.com/web/product/big/202406/3104124bc91cfde09c6280771876bd48.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=48705&cate_no=1387&display_group=1" },
          { name: "올 뉴 굿데이성경 (초미니합본/PU/지퍼/뉴분홍)", price: 32000, salePrice: 28800, thumbnail: "https://chhouse.cafe24.com/web/product/big/202406/45aaf593eeafcc47968b3e8a565e2bed.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=48706&cate_no=1387&display_group=1" },
          { name: "올 뉴 굿데이성경 (초미니합본/PU/지퍼/뉴베이지)", price: 32000, salePrice: 28800, thumbnail: "https://chhouse.cafe24.com/web/product/big/202406/34db1144e17138313786f36ec8178761.jpg", url: "https://chhouse.cafe24.com/product/detail.html?product_no=48704&cate_no=1387&display_group=1" },
          { name: "올 뉴 굿데이성경 (초미니합본/PU/지퍼/뉴파랑)", price: 32000, salePrice: 28800, thumbnail: "https://chhouse.kr/web/product/big/202406/3bedc900213eb974752f343cc216d4e3.jpg", url: "https://chhouse.kr/product/detail.html?product_no=48654&cate_no=1387&display_group=1" },
          { name: "올 뉴 굿데이성경 (초미니합본/PU/지퍼/뉴하늘)", price: 32000, salePrice: 28800, thumbnail: "https://chhouse.kr/web/product/big/202406/f0523e71e14e910b252777132ce5b49f.jpg", url: "https://chhouse.kr/product/detail.html?product_no=48655&cate_no=1387&display_group=1" }
        ]
      });
    }

    if (searchKeyword.includes('모던컬러성경')) {
      if (searchKeyword.includes('대')) {
        return res.json({
          products: [
            { name: "모던컬러성경 (대합본/천연/지퍼/다크브라운)", price: 76000, salePrice: 68400, thumbnail: "https://chhouse.kr/web/product/big/202409/cba3646ac31b26551e7722af1145dee1.jpg", url: "https://chhouse.kr/product/detail.html?product_no=43362&cate_no=1372&display_group=1" },
            { name: "모던컬러성경 (대합본/천연/지퍼/베이지)", price: 76000, salePrice: 68400, thumbnail: "https://chhouse.kr/web/product/big/202405/e39f311d5dfa726569a3e2aae5760664.jpg", url: "http://chhouse.kr/product/detail.html?product_no=43361&cate_no=1372&display_group=1" },
            { name: "모던컬러성경 (대합본/PU/지퍼/브라운)", price: 62000, salePrice: 55800, thumbnail: "https://chhouse.kr/web/product/big/202405/ad2efa4720bb949c8dc4a3e63c5afaad.jpg", url: "https://chhouse.kr/product/detail.html?product_no=43359&cate_no=1372&display_group=1" },
            { name: "모던컬러성경 (대합본/PU/지퍼/초코브라운)", price: 62000, salePrice: 55800, thumbnail: "https://chhouse.kr/web/product/big/202405/288ff91cdba6a81af7bb4e0839e54842.jpg", url: "https://chhouse.kr/product/detail.html?product_no=43360&cate_no=1372&display_group=1" }
          ]
        });
      } else if (searchKeyword.includes('중')) {
        return res.json({
          products: [
            { name: "모던컬러성경 (중합본/천연/지퍼/다크브라운)", price: 64000, salePrice: 57600, thumbnail: "https://chhouse.kr/web/product/big/202405/97b5c7d29ac8fec2297efe7b201d8f82.jpg", url: "https://chhouse.kr/product/detail.html?product_no=45118&cate_no=1371&display_group=1" },
            { name: "모던컬러성경 (중합본/천연/지퍼/다크네이비)", price: 64000, salePrice: 57600, thumbnail: "https://chhouse.kr/web/product/big/202405/793bacad25f0402ebf91fef66864c8ab.jpg", url: "https://chhouse.kr/product/detail.html?product_no=45119&cate_no=1371&display_group=1" },
            { name: "모던컬러성경 (중합본/PU/지퍼/브라운)", price: 45000, salePrice: 40500, thumbnail: "https://chhouse.kr/web/product/big/202405/953e5ebb3b52e53a5ed368068d4fbe78.jpg", url: "https://chhouse.kr/product/detail.html?product_no=45116&cate_no=1371&display_group=1" },
            { name: "모던컬러성경 (중합본/PU/지퍼/블랙)", price: 45000, salePrice: 40500, thumbnail: "https://chhouse.kr/web/product/big/202405/7a8785fed2754fe1dba4ca31be51c811.jpg", url: "https://chhouse.kr/product/detail.html?product_no=45117&cate_no=1371&display_group=1" }
          ]
        });
      } else {
        return res.json({
          products: [
            { name: "모던컬러성경 (소합본/천연/지퍼/다크브라운)", price: 54000, salePrice: 48600, thumbnail: "https://chhouse.kr/web/product/big/202409/9cf962817da36912afa0b84f5f33f432.jpg", url: "https://chhouse.kr/product/detail.html?product_no=49873&cate_no=1345&display_group=1" },
            { name: "모던컬러성경 (소합본/천연/지퍼/다크네이비)", price: 54000, salePrice: 48600, thumbnail: "https://chhouse.kr/web/product/big/202409/ac5b880e9c666ebd245efd9c9fa67e87.jpg", url: "https://chhouse.kr/product/detail.html?product_no=49874&cate_no=1345&display_group=1" },
            { name: "모던컬러성경 (소합본/PU/지퍼/브라운)", price: 44000, salePrice: 39600, thumbnail: "https://chhouse.kr/web/product/big/202409/0ff2fc6e434e7492d902725acf4e7aa4.jpg", url: "https://chhouse.kr/product/detail.html?product_no=49872&cate_no=1345&display_group=1" },
            { name: "모던컬러성경 (소합본/PU/지퍼/블랙)", price: 44000, salePrice: 39600, thumbnail: "https://chhouse.kr/web/product/big/202409/d30f1978ce22c6e9522f775f3a54eb73.jpg", url: "https://chhouse.kr/product/detail.html?product_no=49871&cate_no=1345&display_group=1" }
          ]
        });
      }
    }

    if (searchKeyword.includes('베이직성경')) {
      if (searchKeyword.includes('중')) {
        return res.json({
          products: [
            { name: "베이직성경 (중합본/천연/지퍼/레드브라운)", price: 54000, salePrice: 48600, thumbnail: "https://chhouse.kr/web/product/big/202603/1ec16262340d019c0fa9cc1d5acede2c.jpg", url: "https://chhouse.kr/product/detail.html?product_no=57193&cate_no=1371&display_group=1" },
            { name: "베이직성경 (중합본/천연/지퍼/브라운)", price: 52000, salePrice: 46800, thumbnail: "https://chhouse.kr/web/product/big/202506/d8b2ed969fccd3622d764b72d90d2ccd.jpg", url: "https://chhouse.kr/product/detail.html?product_no=54071&cate_no=1371&display_group=1" },
            { name: "베이직성경 (중합본/PU/지퍼/그레이)", price: 42000, salePrice: 37800, thumbnail: "https://chhouse.kr/web/product/big/202506/955fe9a0e44439f0859b2dede2bfab15.jpg", url: "https://chhouse.kr/product/detail.html?product_no=54068&cate_no=1371&display_group=1" },
            { name: "베이직성경 (중합본/PU/지퍼/네이비)", price: 42000, salePrice: 37800, thumbnail: "https://chhouse.kr/web/product/big/202506/9889b58103692066fe0f204de3281c88.jpg", url: "https://chhouse.kr/product/detail.html?product_no=54069&cate_no=1371&display_group=1" },
            { name: "베이직성경 (중합본/PU/지퍼/베이지)", price: 42000, salePrice: 37800, thumbnail: "https://chhouse.kr/web/product/big/202506/42d6312e2643ee1fe1f1678570f78d8f.jpg", url: "https://chhouse.kr/product/detail.html?product_no=54070&cate_no=1344&display_group=1" },
            { name: "베이직성경 (중단본/PU/무지퍼/웜그레이)", price: 34000, salePrice: 30600, thumbnail: "https://chhouse.kr/web/product/big/202603/ec587f378dabd80c7bb8ecc06db1e5b5.jpg", url: "https://chhouse.kr/product/detail.html?product_no=57111&cate_no=1371&display_group=1" },
            { name: "베이직성경 (중단본/PU/무지퍼/베이지)", price: 34000, salePrice: 30600, thumbnail: "https://chhouse.kr/web/product/big/202603/8309e14ed258cdb3e62989510c77f7de.jpg", url: "https://chhouse.kr/product/detail.html?product_no=57110&cate_no=1371&display_group=1" }
          ]
        });
      } else {
        return res.json({
          products: [
            { name: "베이직성경 (소합본/천연/지퍼/다크네이비)", price: 49000, salePrice: 44100, thumbnail: "https://chhouse.kr/web/product/big/202510/4d618aaf472368a9e571ccbb90ad3f9b.jpg", url: "https://chhouse.kr/product/detail.html?product_no=55697&cate_no=1345&display_group=1" },
            { name: "베이직성경 (소합본/천연/지퍼/스카이블루)", price: 49000, salePrice: 44100, thumbnail: "https://chhouse.kr/web/product/big/202510/5cbdf1f9a175e01186fa1345ee820769.jpg", url: "https://chhouse.kr/product/detail.html?product_no=55698&cate_no=1345&display_group=1" },
            { name: "베이직성경 (소합본/PU/지퍼/블랙)", price: 39000, salePrice: 35100, thumbnail: "https://chhouse.kr/web/product/big/202510/5ebfe03e50977dfaf1bc34a90bd8d27a.jpg", url: "https://chhouse.kr/product/detail.html?product_no=55701&cate_no=1345&display_group=1" },
            { name: "베이직성경 (소합본/PU/지퍼/베이지)", price: 39000, salePrice: 35100, thumbnail: "https://chhouse.kr/web/product/big/202510/ebc20e575f52100b604b8babb549c81b.jpg", url: "https://chhouse.kr/product/detail.html?product_no=55700&cate_no=1345&display_group=1" },
            { name: "베이직성경 (소단본/PU/지퍼/그레이)", price: 30000, salePrice: 27000, thumbnail: "https://chhouse.kr/web/product/big/202510/64abe985dd05c8809066362dde89f2f8.jpg", url: "https://chhouse.kr/product/detail.html?product_no=55552&cate_no=1345&display_group=1" },
            { name: "베이직성경 (소단본/PU/지퍼/브라운)", price: 30000, salePrice: 27000, thumbnail: "https://chhouse.kr/web/product/big/202510/0aa1462058fc550edc23186a2544c277.jpg", url: "https://chhouse.kr/web/product/detail.html?product_no=55553&cate_no=1345&display_group=1" }
          ]
        });
      }
    }

    if (searchKeyword.includes('슬림성경')) {
      return res.json({
        products: [
          { name: "슬림성경 (중합본/천연/지퍼/뉴버건디)", price: 48000, salePrice: 43200, thumbnail: "https://chhouse.kr/web/product/big/202410/b756e3b36e61e2e8ab8736dca376f89c.jpg", url: "https://chhouse.kr/product/detail.html?product_no=51148&cate_no=1371&display_group=1" },
          { name: "슬림성경 (중합본/PU/지퍼/뉴레드브라운)", price: 38000, salePrice: 34200, thumbnail: "https://chhouse.kr/web/product/big/202411/b6a6e28fa9e8053c2169c675eaac1ee2.jpg", url: "https://chhouse.kr/product/detail.html?product_no=51316&cate_no=1371&display_group=1" },
          { name: "슬림성경 (중합본/PU/지퍼/뉴다크올리브)", price: 38000, salePrice: 34200, thumbnail: "https://chhouse.kr/web/product/big/202411/46132b86a03c42d6e4600438c00a6134.jpg", url: "https://chhouse.kr/product/detail.html?product_no=51315&cate_no=1371&display_group=1" },
          { name: "슬림성경 (중합본/PU/지퍼/뉴네이비)", price: 38000, salePrice: 34200, thumbnail: "https://chhouse.kr/web/product/big/202411/6cf9dbbc396339baa2a75c9d3a6d59e8.jpg", url: "https://chhouse.kr/product/detail.html?product_no=51314&cate_no=1371&display_group=1" }
        ]
      });
    }

    if (searchKeyword.includes('더바이블')) {
      if (searchKeyword.includes('중')) {
        return res.json({
          products: [
            { name: "더바이블 (중합본/천연/지퍼/다크브라운)", price: 47000, salePrice: 42300, thumbnail: "https://chhouse.kr/web/product/big/202404/6464154ffc6ebd5cb9c475129417bf01.jpg", url: "https://chhouse.kr/product/detail.html?product_no=18165&cate_no=1371&display_group=1" }
          ]
        });
      } else {
        return res.json({
          products: [
            { name: "더바이블 (소합본/천연/지퍼/베이지)", price: 44000, salePrice: 39600, thumbnail: "https://chhouse.kr/web/product/big/202404/7ac80b9715a7e8568f38bc095a3b3b4a.jpg", url: "https://chhouse.kr/product/detail.html?product_no=42958&cate_no=1345&display_group=1" },
            { name: "더바이블 (소합본/PU/지퍼/다크네이비)", price: 35000, salePrice: 31500, thumbnail: "https://chhouse.kr/web/product/big/202404/d060dfbe39adb802a0f173d16b02a394.jpg", url: "https://chhouse.kr/product/detail.html?product_no=37706&cate_no=1345&display_group=1" },
            { name: "더바이블 (소합본/PU/지퍼/브라운)", price: 35000, salePrice: 31500, thumbnail: "https://chhouse.kr/web/product/big/202404/479cc0dc5da04ac49bc625a358c35956.jpg", url: "https://chhouse.kr/product/detail.html?product_no=37705&cate_no=1345&display_group=1" },
            { name: "더바이블 (소합본/PU/지퍼/올리브그린)", price: 35000, salePrice: 31500, thumbnail: "https://chhouse.kr/web/product/big/202404/42d83f68c9460385f4803d47271977e4.jpg", url: "https://chhouse.kr/product/detail.html?product_no=37704&cate_no=1345&display_group=1" }
          ]
        });
      }
    }

    if (searchKeyword.includes('위드바이블')) {
      return res.json({
        products: [
          { name: "위드바이블 (미니합본/PU/지퍼/교회)", price: 37000, salePrice: 33300, thumbnail: "https://chhouse.kr/web/product/big/202602/a31f6317eaed5517661fc30c6ef7d583.jpg", url: "https://chhouse.kr/product/detail.html?product_no=56806&cate_no=1457&display_group=1" },
          { name: "위드바이블 (미니합본/PU/지퍼/책상)", price: 37000, salePrice: 33300, thumbnail: "https://chhouse.kr/web/product/big/202602/dbc472f163e513dfe252f7bb3161912d.jpg", url: "https://chhouse.kr/product/detail.html?product_no=56807&cate_no=1457&display_group=1" },
          { name: "위드바이블 (미니합본/PU/지퍼/자전거)", price: 37000, salePrice: 33300, thumbnail: "https://chhouse.kr/web/product/big/202602/cec5211a82a5dd53030f3342fa47c077.jpg", url: "https://chhouse.kr/product/detail.html?product_no=56808&cate_no=1457&display_group=1" },
          { name: "위드바이블 (미니합본/PU/지퍼/책)", price: 35000, salePrice: 31500, thumbnail: "https://chhouse.kr/web/product/big/202408/46aedfad4bb22c157874526eb10b50e2.jpg", url: "https://chhouse.kr/product/detail.html?product_no=41018&cate_no=1457&display_group=1" },
          { name: "위드바이블 (미니합본/PU/지퍼/의자)", price: 35000, salePrice: 31500, thumbnail: "https://chhouse.kr/web/product/big/202408/45c64dff893b6046f2df6ae1648218de.jpg", url: "https://chhouse.kr/product/detail.html?product_no=41017&cate_no=1457&display_group=1" },
          { name: "위드바이블 (미니합본/PU/지퍼/소년)", price: 35000, salePrice: 31500, thumbnail: "https://chhouse.kr/web/product/big/202408/f8f8098568cac77909b45d3abaa30bf6.jpg", url: "https://chhouse.kr/product/detail.html?product_no=41016&cate_no=1457&display_group=1" },
          { name: "위드바이블 (미니합본/PU/지퍼/소녀)", price: 35000, salePrice: 31500, thumbnail: "https://chhouse.kr/web/product/big/202408/856a0cb20f0e31b7e9f383ee5b93efaf.jpg", url: "https://chhouse.kr/product/detail.html?product_no=41015&cate_no=1457&display_group=1" }
        ]
      });
    }

    if (searchKeyword.includes('NKR82WBU')) {
      return res.json({
        products: [
          { id: "ab_1", name: "천연우피 큰글자성경전서 NKR82AB 특대단본 개역개정 다크브라운", price: 72000, salePrice: 64800, thumbnail: "https://chhouse.kr/web/product/medium/202512/69e22214107e97fe216cae836580d0d0.jpg", url: "https://chhouse.kr/product/detail.html?product_no=56150" },
          { id: "ab_2", name: "천연우피 큰글자성경전서 NKR82AB 특대합본 개역개정 새찬송가 다크브라운", price: 92000, salePrice: 82800, thumbnail: "https://chhouse.kr/web/product/medium/202409/7f32d47955cd81e98680c818d0fd3709.jpg", url: "https://chhouse.kr/product/detail.html?product_no=49887" },
          { id: "ab_3", name: "천연우피 큰글자성경전서 NKR82AB 특대합본 개역개정 새찬송가 자주", price: 92000, salePrice: 82800, thumbnail: "https://chhouse.kr/web/product/medium/202409/7f32d47955cd81e98680c818d0fd3709.jpg", url: "https://chhouse.kr/product/detail.html?product_no=49886" },
          { id: "ab_4", name: "아가페 큰글자성경전서 특대합본 개역개정 새찬송가 지퍼 NKR82AB 브라운", price: 72000, salePrice: 64800, thumbnail: "https://chhouse.kr/web/product/medium/202512/69e22214107e97fe216cae836580d0d0.jpg", url: "https://chhouse.kr/product/detail.html?product_no=18102" },
          { id: "ab_5", name: "아가페 큰글자성경전서 특대합본 개역개정 새찬송가 지퍼 NKR82AB 다크브라운", price: 72000, salePrice: 64800, thumbnail: "https://chhouse.kr/web/product/medium/202409/7f32d47955cd81e98680c818d0fd3709.jpg", url: "https://chhouse.kr/product/detail.html?product_no=18099" }
        ]
      });
    }

    if (searchKeyword.includes('비전성경')) {
      return res.json({
        products: [
          { id: "vision_1", name: "두란노 비전성경 (중/합본/가죽/다크브라운)", price: 48000, salePrice: 43200, thumbnail: "https://chhouse.kr/web/product/medium/202409/7f32d47955cd81e98680c818d0fd3709.jpg", url: "https://chhouse.kr/product/detail.html?product_no=901" },
          { id: "vision_2", name: "두란노 비전성경 (특미니/단본/PU/버건디)", price: 32000, salePrice: 28800, thumbnail: "https://chhouse.kr/web/product/medium/202512/69e22214107e97fe216cae836580d0d0.jpg", url: "https://chhouse.kr/product/detail.html?product_no=902" },
          { id: "vision_3", name: "두란노 비전성경 (초미니/합본/지퍼/네이비)", price: 35000, salePrice: 31500, thumbnail: "https://chhouse.kr/web/product/medium/202409/7f32d47955cd81e98680c818d0fd3709.jpg", url: "https://chhouse.kr/product/detail.html?product_no=903" }
        ]
      });
    }

    // 기본 Mock (기타 모델)
    return res.json({
      products: [
        {
          id: "demo1",
          name: `[테스트] ${keyword} 임시 상품`,
          price: 45000,
          salePrice: 40500,
          thumbnail: "https://chhouse.kr/web/product/medium/202409/7f32d47955cd81e98680c818d0fd3709.jpg",
          url: `https://chhouse.kr/product/detail.html?product_no=1`
        }
      ]
    });
  }

  try {
    const url = `https://${MALL_ID}.cafe24api.com/api/v2/admin/products?product_name=${encodeURIComponent(searchKeyword)}&display=T&selling=T`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CAFE24_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Cafe24-Api-Version': '2023-09-01'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Cafe24 API Error:", errorText);
      return res.status(response.status).json({ error: "Cafe24 API Fetch Failed" });
    }

    const data = await response.json();
    const filteredProducts = (data.products || [])
      .filter(p => {
        if (p.sold_out === 'T') return false;
        if (p.selling === 'F') return false;
        if (p.display === 'F') return false;

        // 성경 관련 키워드가 하나라도 포함되어 있는지 검사 (비관련 상품 필터링)
        const bibleKeywords = ['성경', '합본', '단본', '색인', '지퍼', '무지퍼', '초미니', '특미니', '미니', '특소', '소', '중', '특중', '대', '특대'];
        const isBible = bibleKeywords.some(kw => p.product_name.includes(kw));
        if (!isBible) return false;

        return true;
      })
      .slice(0, 10) // UI 성능 및 가독성을 위해 최대 10개까지만 노출
      .map(p => {
        let thumb = p.tiny_image || p.list_image || p.small_image;
        if (thumb && thumb.startsWith('//')) {
          thumb = 'https:' + thumb; // 프로토콜 자동 추가
        }
        return {
          id: p.product_no,
          name: p.product_name,
          price: parseFloat(p.price) || 0,
          salePrice: parseFloat(p.retail_price) || parseFloat(p.price) || 0,
          thumbnail: thumb,
          url: `https://chhouse.kr/product/detail.html?product_no=${p.product_no}`
        };
      });

    res.json({ products: filteredProducts });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, () => console.log(`Proxy server running on port ${port}`));
