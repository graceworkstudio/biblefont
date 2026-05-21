import urllib.request
import re

url = "https://chhouse.kr/product/detail.html?product_no=49886"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as r:
    html = r.read().decode('utf-8')

match = re.search(r'item_code\s*[:=]\s*[\'"]([^\'"]+)[\'"]', html)
if match:
    print(f"Product 49886 item_code: {match.group(1)}")
else:
    # try searching for 'P000'
    matches = re.findall(r'P000[A-Z0-9]+', html)
    print("Found P000 strings:", set(matches))
