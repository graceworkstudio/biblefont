import urllib.request
import urllib.parse
from http.cookiejar import CookieJar

cj = CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
opener.addheaders = [
    ('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'),
    ('Accept', 'application/json, text/javascript, */*; q=0.01'),
    ('X-Requested-With', 'XMLHttpRequest'),
    ('Referer', 'https://chhouse.kr/product/detail.html?product_no=53022')
]

url = "https://chhouse.kr/exec/front/order/basket/"
data = urllib.parse.urlencode({
    'product_no': '53022',
    'quantity': '1',
    'basket_type': 'A0000'
}).encode('utf-8')

try:
    response = opener.open(url, data=data)
    print("Response Code:", response.getcode())
    print("Response:", response.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)
