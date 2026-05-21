import urllib.request
import re

url = "https://chhouse.kr/product/list.html?cate_no=1372"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        
        # search for forms
        forms = re.findall(r'(<form[^>]+>)', html)
        print("Forms found:", forms)
        
        # search for input arrays related to basket
        inputs = re.findall(r'<input[^>]+name="([^"]+\[\])"[^>]*>', html)
        print("Array inputs:", list(set(inputs)))

except Exception as e:
    print(e)
