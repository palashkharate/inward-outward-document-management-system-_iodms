import re
import os

path = r'backend/test_api.py'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# Update the assertion for word_open_uri in test_lan_word_open_info
c = c.replace(
    'assert "Drafts/2026/Su-30/draft-admin.doc" in open_info["word_open_uri"]',
    'assert "drafts/123/draft-admin.doc" in open_info["word_open_uri"]'
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)

print('Patched test_api.py assertion successfully')
