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
    
    # Search for product_code or product_no or item_code in script tags
    print("--- Searching detail HTML for product codes ---")
    vars_to_find = ['product_code', 'item_code', 'product_no', 'has_option', 'product_min', 'product_max']
    for v in vars_to_find:
        match = re.search(rf'var\s+{v}\s*=\s*[\'"]?([^\'";]+)[\'"]?', html)
        if match:
            print(f"{v}: {match.group(1)}")
        else:
            # try without var
            match2 = re.search(rf'{v}\s*=\s*[\'"]?([^\'";]+)[\'"]?', html)
            if match2:
                print(f"{v} (no var): {match2.group(1)}")
            else:
                print(f"{v}: NOT FOUND")
                
except Exception as e:
    print(f"Error: {e}")
