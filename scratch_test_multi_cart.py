import urllib.request
import urllib.parse
import http.cookiejar

cookie_jar = http.cookiejar.CookieJar()
handler = urllib.request.HTTPCookieProcessor(cookie_jar)
opener = urllib.request.build_opener(handler)

req_detail = urllib.request.Request("https://chhouse.kr/product/detail.html?product_no=53022", headers={'User-Agent': 'Mozilla/5.0'})
with opener.open(req_detail) as response:
    response.read()

url_basket = "https://chhouse.kr/exec/front/order/basket/"

# test adding multiple products in one request, Cafe24 might support arrays for product_no?
# Cafe24 often doesn't support multiple different product_nos in a single POST to basket/
# Let's test if we can send multiple POSTs sequentially using the same session.
for p_no, i_code in [('53022', 'P000DALI000A'), ('53023', 'P000DALJ000A')]:
    data = {
        'product_no': p_no,
        'quantity': '1',
        'basket_type': 'A0000',
        'delvtype': 'A',
        'selected_item[]': f'1||{i_code}'
    }
    encoded_data = urllib.parse.urlencode(data).encode('utf-8')
    req = urllib.request.Request(url_basket, data=encoded_data, headers={
        'User-Agent': 'Mozilla/5.0',
        'Referer': f'https://chhouse.kr/product/detail.html?product_no={p_no}',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest'
    })
    try:
        with opener.open(req) as r:
            print(f"Product {p_no}: {r.read().decode('utf-8')}")
    except Exception as e:
        print(f"Error {p_no}: {e}")

