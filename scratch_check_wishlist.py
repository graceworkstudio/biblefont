import urllib.request
import re

url = "https://chhouse.kr/myshop/wish_list.html"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        
        # Look for basket_chk or add_basket
        print("Checking for basket functions:")
        for match in re.finditer(r'function ([^(]+basket[^)]*)\(', html):
            print(match.group(1))
            
        print("Checking for form actions:")
        for match in re.finditer(r'<form[^>]+action=["\']([^"\']+)["\']', html):
            print(match.group(1))

except Exception as e:
    print(e)
