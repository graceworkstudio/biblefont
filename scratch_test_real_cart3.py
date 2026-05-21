import urllib.request
import urllib.parse
from http.cookiejar import CookieJar

cj = CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

# 1. Get session cookie
opener.open("https://chhouse.kr/")

# 2. Add to cart WITH selected_item[]
opener.addheaders = [
    ('User-Agent', 'Mozilla/5.0'),
    ('X-Requested-With', 'XMLHttpRequest'),
    ('Referer', 'https://chhouse.kr/product/detail.html?product_no=53022')
]

url = "https://chhouse.kr/exec/front/order/basket/"
data = urllib.parse.urlencode({
    'product_no': '53022',
    'quantity': '1',
    'basket_type': 'A0000',
    'delvtype': 'A',
    'selected_item[]': '1||P000DALI000A'
}).encode('utf-8')

try:
    response = opener.open(url, data=data)
    print("Response Code WITH selected_item:", response.getcode())
    print("Response:", response.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)
