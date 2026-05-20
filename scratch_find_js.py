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
    
    # Check if product_submit is inline
    matches = re.findall(r'function product_submit.*?\n}', html, re.DOTALL)
    print("Inline product_submit function:")
    for match in matches:
        print(match)
        
    # Let's search all scripts imported in HTML
    scripts = re.findall(r'<script[^>]*src="([^"]*)"', html)
    print("\nImported scripts:")
    for src in scripts:
        print(src)

except Exception as e:
    print(f"Error: {e}")
