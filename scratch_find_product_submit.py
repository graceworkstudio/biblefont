import urllib.request
import re

url = "https://chhouse.kr/product/detail.html?product_no=53022"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})

with urllib.request.urlopen(req) as response:
    html = response.read().decode('utf-8')

js_urls = re.findall(r'src="([^"]*optimizer\.php[^"]*)"', html)
for js_url in js_urls:
    if js_url.startswith('//'):
        js_url = 'https:' + js_url
    elif js_url.startswith('/'):
        js_url = 'https://chhouse.kr' + js_url
        
    print(f"Checking JS: {js_url[:60]}...")
    try:
        req_js = urllib.request.Request(js_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req_js) as r:
            js_content = r.read().decode('utf-8')
            if 'function product_submit' in js_content:
                print("Found product_submit!")
                idx = js_content.find('function product_submit')
                print(js_content[idx:idx+2000])
                break
    except Exception as e:
        print(f"Error fetching JS: {e}")
