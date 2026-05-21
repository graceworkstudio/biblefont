import urllib.request
from html.parser import HTMLParser

class FormParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_form = False
        self.inputs = []

    def handle_starttag(self, tag, attrs):
        attr_dict = dict(attrs)
        if tag == "form" and attr_dict.get("id") == "frm_image_zoom":
            self.in_form = True
        elif tag == "input" and self.in_form:
            self.inputs.append(attr_dict)

    def handle_endtag(self, tag):
        if tag == "form" and self.in_form:
            self.in_form = False

url = "https://chhouse.kr/product/detail.html?product_no=53022"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        
    parser = FormParser()
    parser.feed(html)
    for inp in parser.inputs:
        print(f"Name: {inp.get('name', '')}, Value: {inp.get('value', '')}")
except Exception as e:
    print(e)
