import urllib.request
import re
import time

products = [53022, 49886, 49887, 56150, 18102, 18099]
for p in products:
    url = f"https://chhouse.kr/product/detail.html?product_no={p}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as r:
            html = r.read().decode('utf-8')
        match = re.search(r'item_code\s*[:=]\s*[\'"]([^\'"]+)[\'"]', html)
        if match:
            print(f"Product {p} -> {match.group(1)}")
        else:
            print(f"Product {p} -> NOT FOUND")
    except Exception as e:
        print(f"Product {p} -> Error: {e}")
    time.sleep(0.5)
