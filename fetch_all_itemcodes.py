import urllib.request
import re
import json
import time

# bibleData.js에서 모든 URL 추출
with open('src/data/bibleData.js', 'r') as f:
    content = f.read()

urls = re.findall(r'"url":\s*"(https://chhouse\.kr/[^"]+)"', content)
unique_urls = list(dict.fromkeys(urls))  # 중복 제거, 순서 유지
print(f"총 {len(unique_urls)}개 URL 발견\n")

results = {}
failed = []

for i, url in enumerate(unique_urls):
    # product_no 추출 (쿼리파라미터형 & 슬러그형)
    q_match = re.search(r'[?&]product_no=(\d+)', url)
    s_match = re.search(r'/product/[^/]+/(\d+)/(?:category|display)/', url)
    product_no = q_match.group(1) if q_match else (s_match.group(1) if s_match else None)
    
    if not product_no:
        print(f"[{i+1}/{len(unique_urls)}] product_no 추출 실패: {url[:80]}")
        continue

    req = urllib.request.Request(
        url,
        headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            html = r.read().decode('utf-8', errors='ignore')
        
        match = re.search(r'item_code\s*[:=]\s*[\'"]([^\'"]+)[\'"]', html)
        if match:
            item_code = match.group(1)
            results[url] = {'product_no': product_no, 'item_code': item_code}
            print(f"[{i+1}/{len(unique_urls)}] product_no={product_no} -> {item_code}")
        else:
            failed.append(url)
            print(f"[{i+1}/{len(unique_urls)}] product_no={product_no} -> item_code 없음")
    except Exception as e:
        failed.append(url)
        print(f"[{i+1}/{len(unique_urls)}] ERROR: {e}")
    
    time.sleep(0.3)

print(f"\n=== 완료: 성공 {len(results)}, 실패 {len(failed)} ===")

# JSON으로 저장
with open('all_itemcodes.json', 'w') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
print("all_itemcodes.json 저장 완료")

if failed:
    print("\n실패 URL:")
    for u in failed:
        print(f"  {u}")
