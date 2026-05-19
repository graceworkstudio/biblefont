import re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

start_idx = content.find('const App = () => {')
end_idx = content.find('// Base64 공유', start_idx)
if end_idx == -1: end_idx = start_idx + 1000

print(content[start_idx:end_idx])
