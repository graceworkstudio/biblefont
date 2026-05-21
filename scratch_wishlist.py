import urllib.request
import re

url = "https://chhouse.kr/myshop/wish_list.html"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        
    form_match = re.search(r'<form[^>]*name="frmWishlist"[^>]*>(.*?)</form>', html, re.DOTALL | re.IGNORECASE)
    if form_match:
        print("Wishlist form found.")
        # Find action
        action = re.search(r'action="([^"]+)"', html)
        if action: print("Action:", action.group(1))
    else:
        print("Wishlist form not found.")
except Exception as e:
    print(e)
