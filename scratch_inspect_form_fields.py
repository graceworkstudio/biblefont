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
    
    # Find form with id="frm_image_zoom" or similar
    # Cafe24 often uses a large form wrapping the entire page or detail area
    form_match = re.search(r'<form[^>]*id="[^"]*frm_image_zoom[^"]*"[^>]*>(.*?)</form>', html, re.DOTALL | re.IGNORECASE)
    if not form_match:
        # search for any form containing product_no="53022" or action with /exec/front/order/basket/
        form_match = re.search(r'<form[^>]*>(.*?)</form>', html, re.DOTALL)
        
    if form_match:
        form_content = form_match.group(1)
        inputs = re.findall(r'<input[^>]*>', form_content)
        print("All inputs inside the detail form:")
        for inp in inputs:
            name = re.search(r'name="([^"]*)"', inp)
            val = re.search(r'value="([^"]*)"', inp)
            type_attr = re.search(r'type="([^"]*)"', inp)
            name_str = name.group(1) if name else ""
            val_str = val.group(1) if val else ""
            type_str = type_attr.group(1) if type_attr else ""
            if name_str:
                print(f"Name: {name_str:25} | Value: {val_str[:50]} | Type: {type_str}")
    else:
        print("No form found!")
        
except Exception as e:
    print(f"Error: {e}")
