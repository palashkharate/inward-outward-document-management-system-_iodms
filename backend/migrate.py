import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/iodms_db")
engine = create_engine(DATABASE_URL)

def run():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE draft_files ADD COLUMN document_body JSONB;"))
            print("Added document_body to draft_files")
        except Exception as e:
            print("Error draft_files:", e)
        try:
            conn.execute(text("ALTER TABLE outward_register ADD COLUMN document_body JSONB;"))
            print("Added document_body to outward_register")
        except Exception as e:
            print("Error outward_register:", e)
        conn.commit()

if __name__ == "__main__":
    run()
