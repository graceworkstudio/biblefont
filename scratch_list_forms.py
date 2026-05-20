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
    
    print(f"Total HTML length: {len(html)}")
    
    # Let's find all <form tags and their action attribute
    form_tags = re.findall(r'<form[^>]*>', html)
    print("Found Form Tags:")
    for tag in form_tags:
        print(tag)
        
    # Let's print out any elements containing names related to cart, like "basket" or "product_no"
    inputs_with_prod = re.findall(r'<input[^>]*name="[^"]*product_no[^"]*"[^>]*>', html)
    print("\nInputs with product_no:")
    for inp in inputs_with_prod[:5]:
        print(inp)
        
    # Let's print out form with id or name containing "detail"
    detail_forms = re.findall(r'<form[^>]*detail[^>]*>.*?</form>', html, re.DOTALL | re.IGNORECASE)
    print(f"\nDetail forms found: {len(detail_forms)}")

except Exception as e:
    print(f"Error: {e}")
