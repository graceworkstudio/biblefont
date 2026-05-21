import urllib.request
import urllib.parse
import http.cookiejar

cookie_jar = http.cookiejar.CookieJar()
handler = urllib.request.HTTPCookieProcessor(cookie_jar)
opener = urllib.request.build_opener(handler)

# 1. Init session
req_detail = urllib.request.Request("https://chhouse.kr/product/detail.html?product_no=53022", headers={'User-Agent': 'Mozilla/5.0'})
with opener.open(req_detail) as response:
    response.read()

# 2. Add to cart via AJAX
url_basket = "https://chhouse.kr/exec/front/order/basket/"
data = {
    'product_no': '53022',
    'quantity': '1',
    'basket_type': 'A0000',
    'delvtype': 'A',
    'selected_item[]': '1||P000DALI000A'
}
encoded_data = urllib.parse.urlencode(data).encode('utf-8')
req = urllib.request.Request(url_basket, data=encoded_data, headers={
    'User-Agent': 'Mozilla/5.0',
    'Referer': 'https://chhouse.kr/product/detail.html?product_no=53022',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json, text/javascript, */*; q=0.01'
})
try:
    with opener.open(req) as r:
        print(f"AJAX response: {r.read().decode('utf-8')}")
except Exception as e:
    print(f"Error: {e}")

