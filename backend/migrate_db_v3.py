import sys
import os

backend_dir = os.path.abspath(r"c:\Users\Palash\Desktop\inword outword folder\backend")
sys.path.insert(0, backend_dir)

from database import engine
from sqlalchemy import text

def apply_migrations():
    # Use autocommit connection
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        commands = [
            "ALTER TABLE draft_files ADD COLUMN attachment_paths VARCHAR(500)[] DEFAULT '{}'",
            "ALTER TABLE draft_files ADD COLUMN linked_documents VARCHAR(255)[] DEFAULT '{}'",
            "ALTER TABLE inward_register ADD COLUMN attachment_paths VARCHAR(500)[] DEFAULT '{}'",
            "ALTER TABLE inward_register ADD COLUMN linked_documents VARCHAR(255)[] DEFAULT '{}'",
            "ALTER TABLE outward_register ADD COLUMN attachment_paths VARCHAR(500)[] DEFAULT '{}'",
            "ALTER TABLE outward_register ADD COLUMN linked_documents VARCHAR(255)[] DEFAULT '{}'"
        ]
        
        for cmd in commands:
            try:
                conn.execute(text(cmd))
                print(f"Success: {cmd}")
            except Exception as e:
                print(f"Ignored: {e}")

    print("Migrations applied successfully!")

if __name__ == "__main__":
    apply_migrations()
