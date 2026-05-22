const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (request.url().includes('order/basket') && request.method() === 'POST') {
      console.log('PAYLOAD:', request.postData());
    }
    request.continue();
  });
  
  page.on('dialog', async dialog => await dialog.accept());
  
  await page.goto('https://chhouse.kr/product/detail.html?product_no=48746', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    const btn = document.querySelector('.actionCart, .btnBasket, a[onclick*="basket"]');
    if (btn) btn.click();
    else document.querySelector('.buy_btns a:nth-child(2)').click();
  });
  
  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
})();
