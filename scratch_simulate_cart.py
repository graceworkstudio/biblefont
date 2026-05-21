import urllib.request
import urllib.parse
import http.cookiejar

# Create a cookie jar to manage session cookies
cookie_jar = http.cookiejar.CookieJar()
handler = urllib.request.HTTPCookieProcessor(cookie_jar)
opener = urllib.request.build_opener(handler)

# 1. Fetch the product detail page first to get a session cookie and verify variables
url_detail = "https://chhouse.kr/product/detail.html?product_no=53022"
req_detail = urllib.request.Request(
    url_detail,
    headers={
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://chhouse.kr/web/biblezoom_test/index.html'
    }
)

try:
    print("--- 1. Fetching detail page to initialize session ---")
    with opener.open(req_detail) as response:
        html = response.read().decode('utf-8')
    print(f"Session cookies after detail page: {[cookie.name for cookie in cookie_jar]}")
    
    # 2. Perform POST to exec/front/order/basket/
    url_basket = "https://chhouse.kr/exec/front/order/basket/"
    # Let's match the exact parameters
    # product_no: 53022
    # quantity: 1
    # basket_type: A0000
    # delvtype: A
    # selected_item[]: 1||P000DALI000A
    
    data = {
        'product_no': '53022',
        'quantity': '1',
        'basket_type': 'A0000',
        'delvtype': 'A',
        'selected_item[]': '1||P000DALI000A'
    }
    
    encoded_data = urllib.parse.urlencode(data).encode('utf-8')
    
    req_basket = urllib.request.Request(
        url_basket,
        data=encoded_data,
        headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://chhouse.kr/product/detail.html?product_no=53022',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest'
        }
    )
    
    print("\n--- 2. Sending POST to add item to basket ---")
    with opener.open(req_basket) as response_basket:
        resp_body = response_basket.read().decode('utf-8')
        resp_headers = response_basket.info()
        print(f"Response URL: {response_basket.geturl()}")
        print(f"Response Status: {response_basket.getcode()}")
        print(f"Response Headers:\n{resp_headers}")
        print(f"Response Body (first 1000 chars):\n{resp_body[:1000]}")
        
    print(f"\nSession cookies after POST: {[cookie.name for cookie in cookie_jar]}")

except Exception as e:
    print(f"Error during simulation: {e}")
