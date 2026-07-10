from database import engine
from sqlalchemy import text

with engine.begin() as conn:
    queries = [
        "ALTER TABLE users ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE",
        "ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP",
        "ALTER TABLE users ADD COLUMN deleted_by VARCHAR(100)",
        "ALTER TABLE outward_register ADD COLUMN is_compressed BOOLEAN DEFAULT FALSE",
        "ALTER TABLE inward_register ADD COLUMN actioned_by VARCHAR(100)"
    ]
    for q in queries:
        try:
            conn.execute(text(q))
            print("Successfully executed:", q)
        except Exception as e:
            print("Failed:", q, "Reason:", e)

print("Migration done.")
