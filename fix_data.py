import json
import re

file_path = '/Users/azkara/.gemini/antigravity/scratch/bible-font-comparison/src/data/bibleData.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 새번역큰글성경 특대 (5.6 -> 4.4)
old_특대 = '''      {
        "model": "새번역큰글성경",
        "size": "특대",
        "mm": 5.6,'''
new_특대 = '''      {
        "model": "새번역큰글성경",
        "size": "특대",
        "mm": 4.4,'''
content = content.replace(old_특대, new_특대)

# Fix 새번역큰글성경 중 (5.6 -> 3.7)
old_중 = '''      {
        "model": "새번역큰글성경",
        "size": "중",
        "mm": 5.6,'''
new_중 = '''      {
        "model": "새번역큰글성경",
        "size": "중",
        "mm": 3.7,'''
content = content.replace(old_중, new_중)

# Fix 굿모닝성경 중 duplicate
# The duplicate block is:
dup_block = '''      {
        "model": "큰글자 굿모닝성경",
        "size": "중",
        "mm": 3.6,
        "type": "study",
        "variants": [
          {
            "label": "중합본/PU/무지퍼/브라운",
            "img": "https://chhouse.kr/web/product/big/202405/a950c25b8da04cc8dceeae38556e6020.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=44929&cate_no=1347&display_group=1",
            "itemCode": "P000COMB000A",
            "originalPrice": 43000,
            "salePrice": 38700
          }
        ]
      },
'''

variant_to_insert = '''          {
            "label": "중합본/PU/무지퍼/브라운",
            "img": "https://chhouse.kr/web/product/big/202405/a950c25b8da04cc8dceeae38556e6020.jpg",
            "url": "https://chhouse.kr/product/detail.html?product_no=44929&cate_no=1347&display_group=1",
            "itemCode": "P000COMB000A",
            "originalPrice": 43000,
            "salePrice": 38700
          },
'''

correct_중_target = '''      {
        "model": "큰글자 굿모닝성경",
        "size": "중",
        "mm": 3.3,
        "type": "study",
        "variants": ['''

correct_중_replacement = correct_중_target + '\n' + variant_to_insert

if dup_block in content:
    content = content.replace(dup_block, '') # Remove the duplicate block
    content = content.replace(correct_중_target, correct_중_replacement) # Insert variant into correct block
    print("Successfully merged 굿모닝성경 중")
else:
    print("Could not find duplicate block for 굿모닝성경 중")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done.")
