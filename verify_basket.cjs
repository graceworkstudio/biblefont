const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Navigating to product page...');
  await page.goto('https://chhouse.kr/product/detail.html?product_no=48746', { waitUntil: 'networkidle2' });
  
  console.log('Clicking Add to Cart button...');
  page.on('dialog', async dialog => {
    console.log('Dialog:', dialog.message());
    await dialog.accept();
  });
  await page.evaluate(() => {
    const cartBtn = document.querySelector('.actionCart, .btnBasket, a[onclick*="basket"]');
    if (cartBtn) cartBtn.click();
    else document.querySelector('.buy_btns a:nth-child(2)').click();
  });

  console.log('Waiting 3 seconds for AJAX...');
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: 'after_click.png' });
  
  console.log('Navigating to basket.html...');
  await page.goto('https://chhouse.kr/order/basket.html', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'basket_page.png' });
  
  const html = await page.content();
  if (html.includes('비어있습니다') || html.includes('비어 있습니다')) {
    console.log('BASKET IS EMPTY!');
  } else {
    console.log('BASKET HAS ITEM!');
  }
  
  await browser.close();
})();
