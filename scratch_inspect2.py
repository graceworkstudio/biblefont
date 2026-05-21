import urllib.request
import re

url = "https://chhouse.kr/product/detail.html?product_no=53022"
req = urllib.request.Request(
    url, 
    headers={'User-Agent': 'Mozilla/5.0'}
)

with urllib.request.urlopen(req) as response:
    html = response.read().decode('utf-8')

# Find the form that posts to /exec/front/order/basket/
forms = re.findall(r'<form[^>]*>(.*?)</form>', html, re.DOTALL | re.IGNORECASE)
for i, form in enumerate(forms):
    if 'product_no' in form and 'quantity' in form:
        print(f"--- Form {i} ---")
        inputs = re.findall(r'<input[^>]*>', form)
        for inp in inputs:
            print(inp)
