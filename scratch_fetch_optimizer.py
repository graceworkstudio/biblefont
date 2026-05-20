import urllib.request
import re

url = "https://chhouse.kr/product/detail.html?product_no=53022"
req = urllib.request.Request(
    url, 
    headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
)

try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
    
    # Find all optimizer js urls
    js_urls = re.findall(r'src="([^"]*optimizer\.php[^"]*)"', html)
    print(f"Found optimizer scripts: {js_urls}")
    
    for js_url in js_urls:
        if not js_url.startswith("http"):
            js_url = "https://chhouse.kr" + js_url
            
        print(f"Downloading {js_url[:100]}...")
        req_js = urllib.request.Request(
            js_url, 
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        with urllib.request.urlopen(req_js) as res_js:
            js_content = res_js.read().decode('utf-8')
            
        print(f"Downloaded JS length: {len(js_content)}")
        
        # Let's search for function product_submit
        idx = js_content.find("function product_submit")
        if idx != -1:
            print("Found function product_submit!")
            print(js_content[idx:idx+1500])
        else:
            # Let's try searching for "product_submit" as a variable or property
            matches = [m.start() for m in re.finditer(r'product_submit', js_content)]
            print(f"Occurrences of 'product_submit': {len(matches)}")
            for m in matches[:5]:
                print(js_content[m:m+200])
                print("-" * 20)

except Exception as e:
    print(f"Error: {e}")
