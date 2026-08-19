import re
import os

path = r'backend/main.py'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# Add gzip import
if "from fastapi.middleware.gzip import GZipMiddleware" not in c:
    c = c.replace("from fastapi.middleware.cors import CORSMiddleware", "from fastapi.middleware.cors import CORSMiddleware\nfrom fastapi.middleware.gzip import GZipMiddleware")

# Add middleware
if "app.add_middleware(GZipMiddleware" not in c:
    # Find the line after app = FastAPI(...) is created
    # It usually has the CORS middleware next
    cors_str = "app.add_middleware(\n    CORSMiddleware,"
    if cors_str in c:
        c = c.replace(cors_str, "app.add_middleware(GZipMiddleware, minimum_size=1000)\n" + cors_str)
    else:
        # Fallback if formatted differently
        c = c.replace("app.add_middleware(CORSMiddleware", "app.add_middleware(GZipMiddleware, minimum_size=1000)\napp.add_middleware(CORSMiddleware")

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)

print('Added GZipMiddleware to main.py')
