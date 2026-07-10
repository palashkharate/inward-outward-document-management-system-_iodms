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
            "ALTER TABLE draft_files ADD COLUMN is_locked BOOLEAN DEFAULT FALSE",
            "ALTER TABLE draft_files ADD COLUMN locked_by VARCHAR(100) REFERENCES users(user_id) ON UPDATE CASCADE NULL",
            "ALTER TABLE draft_files ADD COLUMN locked_at TIMESTAMP WITHOUT TIME ZONE NULL"
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
