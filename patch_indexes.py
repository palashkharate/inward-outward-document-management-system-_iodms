import re
import os

path = r'backend/models.py'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# InwardRegister
c = c.replace('receiving_date = Column(Date, nullable=False, server_default=func.current_date())', 'receiving_date = Column(Date, nullable=False, server_default=func.current_date(), index=True)')
c = c.replace('inward_letter_no = Column(String(255))', 'inward_letter_no = Column(String(255), index=True)')
c = c.replace('document_type = Column(String(100), nullable=False)', 'document_type = Column(String(100), nullable=False, index=True)')
c = c.replace('subject = Column(Text)', 'subject = Column(Text, index=True)')

# OutwardRegister
c = c.replace('issuing_date = Column(Date, nullable=False)', 'issuing_date = Column(Date, nullable=False, index=True)')
c = c.replace('prepared_by = Column(String(100), ForeignKey("users.user_id", onupdate="CASCADE"))', 'prepared_by = Column(String(100), ForeignKey("users.user_id", onupdate="CASCADE"), index=True)')
c = c.replace('status = Column(String(50), nullable=False, default="Active")', 'status = Column(String(50), nullable=False, default="Active", index=True)')

# Try replacing subject again if it was a different line in OutwardRegister
# It might already have been replaced if they shared exactly the same string, but let's check
if 'subject = Column(Text)' in c:
    c = c.replace('subject = Column(Text)', 'subject = Column(Text, index=True)')

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)

print('Indexes added to models.py')
