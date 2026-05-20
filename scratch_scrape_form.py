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
    
    print("Found forms in the product detail HTML:")
    # Look for form tags
    forms = re.findall(r'<form[^>]*action="[^"]*basket[^"]*"[^>]*>(.*?)</form>', html, re.DOTALL)
    if not forms:
        forms = re.findall(r'<form[^>]*name="[Pp]rdDetailForm"[^>]*>(.*?)</form>', html, re.DOTALL)
        
    for idx, form_content in enumerate(forms[:3]):
        print(f"--- Form {idx+1} inputs ---")
        inputs = re.findall(r'<input[^>]*>', form_content)
        for inp in inputs:
            # print only names and values
            name = re.search(r'name="([^"]*)"', inp)
            val = re.search(r'value="([^"]*)"', inp)
            type_attr = re.search(r'type="([^"]*)"', inp)
            name_str = name.group(1) if name else ""
            val_str = val.group(1) if val else ""
            type_str = type_attr.group(1) if type_attr else ""
            if name_str:
                print(f"Type: {type_str:8} | Name: {name_str:25} | Value: {val_str}")
                
except Exception as e:
    print(f"Error: {e}")
