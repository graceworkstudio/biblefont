import urllib.request
import urllib.parse
import http.cookiejar

cookie_jar = http.cookiejar.CookieJar()
handler = urllib.request.HTTPCookieProcessor(cookie_jar)
opener = urllib.request.build_opener(handler)

url_basket = "https://biblezoom.co.kr/exec/front/order/basket/"
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
    'Referer': 'https://biblezoom.co.kr/product/detail.html?product_no=53022',
    'Content-Type': 'application/x-www-form-urlencoded'
})
try:
    with opener.open(req) as r:
        response_text = r.read().decode('utf-8')
        if "alert" in response_text:
            print("Successfully added to cart (alert found)")
        else:
            print(f"Form submission response: {response_text[:500]}")
except Exception as e:
    print(f"Error: {e}")

