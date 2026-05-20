const https = require('https');

https.get('https://www.googletagmanager.com/gtag/js?id=G-45W7QGLF8X', (res) => {
  console.log('Status Code:', res.statusCode);
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Length:', data.length);
    console.log('First 100 chars:', data.substring(0, 100));
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
