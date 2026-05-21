import urllib.request
import re
import json
import concurrent.futures

with open('src/data/bibleData.js', 'r') as f:
    content = f.read()

urls = re.findall(r'"url":\s*"(https://chhouse\.kr/[^"]+)"', content)
unique_urls = list(dict.fromkeys(urls))
print(f"총 {len(unique_urls)}개 URL 발견", flush=True)

results = {}
failed = []

def fetch_item_code(url):
    q_match = re.search(r'[?&]product_no=(\d+)', url)
    s_match = re.search(r'/product/[^/]+/(\d+)/(?:category|display)/', url)
    product_no = q_match.group(1) if q_match else (s_match.group(1) if s_match else None)
    
    if not product_no:
        return url, None, None, "product_no 추출 실패"

    req = urllib.request.Request(
        url,
        headers={'User-Agent': 'Mozilla/5.0'}
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            html = r.read().decode('utf-8', errors='ignore')
        
        match = re.search(r'item_code\s*[:=]\s*[\'"]([^\'"]+)[\'"]', html)
        if match:
            return url, product_no, match.group(1), None
        else:
            return url, product_no, None, "item_code 없음"
    except Exception as e:
        return url, product_no, None, str(e)

with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
    futures = {executor.submit(fetch_item_code, u): u for u in unique_urls}
    for i, future in enumerate(concurrent.futures.as_completed(futures)):
        url, product_no, item_code, error = future.result()
        if item_code:
            results[url] = {'product_no': product_no, 'item_code': item_code}
            print(f"[{i+1}/{len(unique_urls)}] product_no={product_no} -> {item_code}", flush=True)
        else:
            failed.append(url)
            print(f"[{i+1}/{len(unique_urls)}] 실패: product_no={product_no}, error={error}", flush=True)

with open('all_itemcodes.json', 'w') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
print("all_itemcodes.json 저장 완료", flush=True)
