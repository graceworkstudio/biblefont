import urllib.request
import urllib.parse
from http.cookiejar import CookieJar

cj = CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
opener.addheaders = [
    ('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'),
    ('Referer', 'https://chhouse.kr/')
]

# 1. Get session cookie
print("Visiting homepage...")
opener.open("https://chhouse.kr/")
print("Cookies:", cj)

# 2. Add to cart
opener.addheaders = [
    ('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'),
    ('Accept', 'application/json, text/javascript, */*; q=0.01'),
    ('X-Requested-With', 'XMLHttpRequest'),
    ('Referer', 'https://chhouse.kr/product/detail.html?product_no=53022'),
    ('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
]

url = "https://chhouse.kr/exec/front/order/basket/"
data = urllib.parse.urlencode({
    'product_no': '53022',
    'quantity': '1',
    'basket_type': 'A0000',
    'delvtype': 'A'
}).encode('utf-8')

try:
    print("Adding to cart...")
    response = opener.open(url, data=data)
    print("Response Code:", response.getcode())
    print("Response:", response.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)
