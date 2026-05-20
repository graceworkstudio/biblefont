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
    
    # Search for all scripts or onclick handlers containing "basket" or "order" or "product_no"
    print("--- Searching HTML for 'basket' related JS/HTML elements ---")
    matches = []
    for line_no, line in enumerate(html.split('\n'), 1):
        if 'basket' in line or 'product_no' in line:
            matches.append((line_no, line.strip()))
    
    print(f"Total matches found: {len(matches)}")
    # Print the first 30 matches
    for line_no, line in matches[:40]:
        print(f"L{line_no}: {line[:120]}")

except Exception as e:
    print(f"Error: {e}")
