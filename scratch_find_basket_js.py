import urllib.request
import re

url = "https://chhouse.kr/product/detail.html?product_no=53022"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        
        scripts = re.findall(r'<script[^>]*src="([^"]+)"', html)
        print("Scripts:")
        for s in scripts:
            if "front" in s or "basket" in s or "product" in s:
                print(s)
                
except Exception as e:
    print(e)
