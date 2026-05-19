import re
import sys

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find where bibleData starts
start_match = re.search(r'  const bibleData = {', content)
if not start_match:
    print("bibleData not found")
    sys.exit(1)

start_idx = start_match.start()

# Find the end of the bibleData object by counting braces
brace_count = 0
in_string = False
escape_next = False
quote_char = ''
end_idx = -1

for i in range(start_idx, len(content)):
    c = content[i]
    if escape_next:
        escape_next = False
        continue
    
    if c == '\\':
        escape_next = True
        continue
        
    if in_string:
        if c == quote_char:
            in_string = False
        continue
        
    if c in ('"', "'", "`"):
        in_string = True
        quote_char = c
        continue
        
    if c == '{':
        brace_count += 1
    elif c == '}':
        brace_count -= 1
        if brace_count == 0:
            end_idx = i + 1
            # Check for trailing semicolon
            if end_idx < len(content) and content[end_idx] == ';':
                end_idx += 1
            break

if end_idx == -1:
    print("Could not find end of bibleData")
    sys.exit(1)

bible_data_str = content[start_idx:end_idx]

# Write to data file
with open('src/data/bibleData.js', 'w', encoding='utf-8') as f:
    f.write("export " + bible_data_str.strip() + "\n")

# Remove from App.jsx and add import
new_content = content[:start_idx] + content[end_idx:]

import_statement = "import { bibleData } from './data/bibleData';\n"
import_idx = new_content.find("import BannerComponent")
if import_idx != -1:
    line_end = new_content.find('\n', import_idx) + 1
    new_content = new_content[:line_end] + import_statement + new_content[line_end:]
else:
    print("Could not find import insertion point")
    
# Remove EMPATHY_BULLETS, SCALE_OPTIONS etc if they exist
constants_to_remove = ['APP_VERSION', 'UPDATE_NOTES', 'ENABLE_UI_UPDATE_MODAL', 'EMPATHY_PARENT_HEADLINE', 'EMPATHY_BULLETS']
for const in constants_to_remove:
    # simple regex to remove top-level const definitions up to semicolon
    pattern = re.compile(r'^const ' + const + r'\s*=[\s\S]*?;$', re.MULTILINE)
    new_content = pattern.sub('', new_content)

# Add constants import
const_import = "import { APP_VERSION, UPDATE_NOTES, ENABLE_UI_UPDATE_MODAL, EMPATHY_PARENT_HEADLINE, EMPATHY_BULLETS } from './constants/uiConstants';\n"
import_idx = new_content.find("import { bibleData }")
if import_idx != -1:
    line_end = new_content.find('\n', import_idx) + 1
    new_content = new_content[:line_end] + const_import + new_content[line_end:]

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Extracted {end_idx - start_idx} chars of bibleData.")
