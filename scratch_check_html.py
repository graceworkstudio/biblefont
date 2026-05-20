import urllib.request

url = "http://chhouse.cafe24.com/web/biblezoom_test/index.html"
try:
    with urllib.request.urlopen(url) as response:
        content = response.read().decode('utf-8')
    print("Live HTML script tags:")
    for line in content.split("\n"):
        if "assets/" in line:
            print(line.strip())
except Exception as e:
    print(f"Error: {e}")
