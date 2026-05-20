import urllib.request
import re

url = "https://chhouse.kr/product/detail.html?product_no=53022"
req = urllib.request.Request(
    url, 
    headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
)

try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
    
    # Check if there are select elements with option info
    selects = re.findall(r'<select[^>]*>.*?</select>', html, re.DOTALL)
    print(f"Total <select> tags: {len(selects)}")
    for sel in selects:
        if "option" in sel or "Opt" in sel or "option_select" in sel:
            print(sel[:300])
            
    # Search for product_option_id or similar
    opt_inputs = re.findall(r'<input[^>]*option[^>]*>', html)
    print(f"\nOption inputs: {len(opt_inputs)}")
    for inp in opt_inputs[:5]:
        print(inp)
        
    # Search for option_select_count
    matches = re.findall(r'option_select_count\s*=\s*\d+', html)
    print(f"\noption_select_count occurrences: {matches}")
    
except Exception as e:
    print(f"Error: {e}")
