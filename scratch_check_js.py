import urllib.request

url = "http://chhouse.cafe24.com/web/biblezoom_test/assets/index.js"
try:
    with urllib.request.urlopen(url) as response:
        content = response.read().decode('utf-8')
        # Check if the alert text is present in the live JS
        has_alert = "쇼핑몰 보안 정책" in content
        print(f"Has alert text: {has_alert}")
        # Print a small portion to verify
        idx = content.find("handleBatchCheckout")
        if idx != -1:
            print("Found handleBatchCheckout:")
            print(content[idx:idx+400])
        else:
            print("handleBatchCheckout not found in JS!")
except Exception as e:
    print(f"Error: {e}")
