import urllib.request
import urllib.parse
from http.cookiejar import CookieJar
import json

cj = CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

# 1. Visit product page to initialize session cookies
req1 = urllib.request.Request("https://chhouse.kr/product/detail.html?product_no=53022", headers={'User-Agent': 'Mozilla/5.0'})
try:
    opener.open(req1)
    print("Cookies after visit:", [c.name for c in cj])
except Exception as e:
    print("Init error:", e)

# 2. Try adding to cart WITHOUT selected_item[]
data = urllib.parse.urlencode({
    'product_no': '53022',
    'quantity': '1',
    'basket_type': 'A0000',
    'delvtype': 'A'
}).encode('utf-8')

req2 = urllib.request.Request("https://chhouse.kr/exec/front/order/basket/", data=data, headers={
    'User-Agent': 'Mozilla/5.0',
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Referer': 'https://chhouse.kr/product/detail.html?product_no=53022'
})

try:
    resp = opener.open(req2)
    print("Response Code (No selected_item):", resp.getcode())
    print("Response:", resp.read().decode('utf-8'))
except Exception as e:
    print("Add error:", e)
    
# 3. Try adding to cart WITH selected_item[]
data2 = urllib.parse.urlencode({
    'product_no': '53022',
    'quantity': '1',
    'basket_type': 'A0000',
    'delvtype': 'A',
    'selected_item[]': '1||P000DALI000A'
}).encode('utf-8')

req3 = urllib.request.Request("https://chhouse.kr/exec/front/order/basket/", data=data2, headers={
    'User-Agent': 'Mozilla/5.0',
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Referer': 'https://chhouse.kr/product/detail.html?product_no=53022'
})

try:
    resp2 = opener.open(req3)
    print("Response Code (WITH selected_item):", resp2.getcode())
    print("Response:", resp2.read().decode('utf-8'))
except Exception as e:
    print("Add error:", e)
