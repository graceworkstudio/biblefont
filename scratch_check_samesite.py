import re

filepath = "dist/assets/index.js"
try:
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Check if "SameSite" is in the local file
    print(f"Local 'SameSite' in file: {'SameSite' in content}")
    # Check if "SameSite" is in the server file
    import urllib.request
    url = "http://chhouse.cafe24.com/web/biblezoom_test/assets/index.js"
    with urllib.request.urlopen(url) as response:
        server_content = response.read().decode('utf-8')
    print(f"Server 'SameSite' in file: {'SameSite' in server_content}")

except Exception as e:
    print(f"Error: {e}")
