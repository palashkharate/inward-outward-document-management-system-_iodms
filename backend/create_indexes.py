import sys
from sqlalchemy import text
import models
from database import engine

print("Connecting to DB to create indexes...")
try:
    with engine.begin() as conn:
        # Inward Register
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_inward_register_receiving_date ON inward_register (receiving_date);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_inward_register_inward_letter_no ON inward_register (inward_letter_no);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_inward_register_document_type ON inward_register (document_type);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_inward_register_subject ON inward_register (subject);"))

        # Outward Register
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_outward_register_issuing_date ON outward_register (issuing_date);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_outward_register_subject ON outward_register (subject);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_outward_register_prepared_by ON outward_register (prepared_by);"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_outward_register_status ON outward_register (status);"))
    print("Indexes created successfully!")
except Exception as e:
    print("Error creating indexes:", e)
