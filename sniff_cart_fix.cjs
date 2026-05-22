const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Enable request interception
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (request.url().includes('/exec/front/order/basket/')) {
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
  try {
    await page.evaluate(() => {
      const cartBtn = document.querySelector('.actionCart, .btnBasket, a[onclick*="basket"]');
      if (cartBtn) cartBtn.click();
      else document.querySelector('.buy_btns a:nth-child(2)').click();
    });
  } catch (e) {
    console.log('Error clicking:', e.message);
  }

  // Use a simple promise instead of waitForTimeout
  await new Promise(r => setTimeout(r, 5000));
  
  await browser.close();
})();
