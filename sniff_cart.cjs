const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Enable request interception
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (request.url().includes('/exec/front/order/basket/')) {
      console.log('--- ADD TO CART REQUEST ---');
      console.log('Method:', request.method());
      console.log('URL:', request.url());
      console.log('Headers:', request.headers());
      console.log('PostData:', request.postData());
      console.log('---------------------------');
      request.continue();
    } else {
      request.continue();
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/exec/front/order/basket/')) {
      console.log('--- ADD TO CART RESPONSE ---');
      console.log('Status:', response.status());
      try {
        const text = await response.text();
        console.log('Body:', text);
      } catch(e) {}
      console.log('----------------------------');
    }
  });

  console.log('Navigating to product page...');
  await page.goto('https://chhouse.kr/product/detail.html?product_no=53022', { waitUntil: 'networkidle2' });
  
  console.log('Clicking Add to Cart button...');
  // Find the add to cart button (usually .btnSubmit or .actionCart)
  try {
    await page.evaluate(() => {
      // 카페24 기본 스크립트 함수 직접 호출
      if (typeof CAFE24 !== 'undefined' && CAFE24.FRONT_BASKET) {
          console.log('Found CAFE24 object');
      }
      const cartBtn = document.querySelector('.actionCart, .btnBasket, a[onclick*="basket"]');
      if (cartBtn) cartBtn.click();
      else document.querySelector('.buy_btns a:nth-child(2)').click();
    });
  } catch (e) {
    console.log('Error clicking:', e.message);
  }

  // Wait a bit for the request to happen
  await page.waitForTimeout(3000);
  
  await browser.close();
})();
