with open('src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

idx = content.find('const addToCart')
end_idx = content.find('const handleKakaoCartShare')
print(content[idx:end_idx])
