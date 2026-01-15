import urllib.request
import urllib.parse
import http.cookiejar
import re
import json

# Setup cookie jar
cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

# Fetch Login Page to get CSRF token
login_url = 'http://localhost:5001/login'
try:
    resp = opener.open(login_url)
    content = resp.read().decode('utf-8')
    
    # Extract CSRF token
    csrf_match = re.search(r'name="csrf_token" value="([^"]+)"', content)
    if csrf_match:
        csrf_token = csrf_match.group(1)
        # print(f"CSRF Token found: {csrf_token}")
    else:
        print("CSRF Token not found!")
        csrf_token = ''

    # Login
    login_data = urllib.parse.urlencode({
        'username': 'admin', 
        'password': 'admin123',
        'csrf_token': csrf_token
    }).encode('utf-8')
    
    resp = opener.open(login_url, data=login_data)
    # print(f"Login status: {resp.getcode()}")
    
except Exception as e:
    print(f"Login failed: {e}")

# Fetch Aluno 1 API
api_url = 'http://localhost:5001/api/alunos/1'
try:
    resp = opener.open(api_url)
    # print(f"API status: {resp.getcode()}")
    content = resp.read().decode('utf-8')
    print(content)
except Exception as e:
    print(f"Fetch failed: {e}")
