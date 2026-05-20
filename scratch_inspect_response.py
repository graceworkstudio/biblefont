import urllib.request

url = "http://chhouse.cafe24.com/web/biblezoom_test/assets/index.js"
try:
    with urllib.request.urlopen(url) as response:
        content = response.read().decode('utf-8')
        print(f"Content type/length: {len(content)}")
        print("First 300 chars:")
        print(content[:300])
except Exception as e:
    print(f"Error: {e}")
