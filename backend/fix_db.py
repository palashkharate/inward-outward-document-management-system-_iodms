from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE inward_register ADD COLUMN updated_at TIMESTAMP WITHOUT TIME ZONE;"))
    except Exception as e:
        print("inward error:", e)
    
    try:
        conn.execute(text("ALTER TABLE outward_register ADD COLUMN updated_at TIMESTAMP WITHOUT TIME ZONE;"))
    except Exception as e:
        print("outward error:", e)

    try:
        conn.execute(text("ALTER TABLE drafts ADD COLUMN updated_at TIMESTAMP WITHOUT TIME ZONE;"))
    except Exception as e:
        print("drafts error:", e)
    
    conn.commit()
    print("Added updated_at columns successfully.")
