import os
import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Let's explain: SQLAlchemy is a library that lets Python talk to the PostgreSQL database.
# An Engine represents the connection to the database.
# A SessionMaker creates session objects, which are like individual conversations with the database.
# Base is the parent class for all our database tables (models).

# Database connection URL. It defaults to connecting to PostgreSQL running on the local PC (localhost)
# using the default username 'postgres', password 'postgres', and database 'iodms_db'.
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/iodms_db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Default configuration settings file path
SETTINGS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "settings.json")

# FR-140: IODMS Root Path
def get_iodms_settings():
    """Reads settings (like IODMS Root Path) from settings.json or returns defaults.
    
    This function implements FR-140 by reading the current configured path.
    """
    default_settings = {
        "iodms_root_path": os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "IODMS_DATA")),
        "cutover_override_date": None  # FR-141
    }
    if not os.path.exists(SETTINGS_FILE):
        # Create default file if it doesn't exist
        save_iodms_settings(default_settings)
        return default_settings
    try:
        with open(SETTINGS_FILE, "r") as f:
            data = json.load(f)
            # Ensure all default keys exist
            for key, val in default_settings.items():
                if key not in data:
                    data[key] = val
            return data
    except Exception:
        return default_settings

# FR-140: IODMS Root Path
def save_iodms_settings(settings):
    """Saves updated settings to settings.json file.
    
    This function implements FR-140 by saving the newly updated path or settings.
    """
    try:
        with open(SETTINGS_FILE, "w") as f:
            json.dump(settings, f, indent=4)
        return True
    except Exception:
        return False

# FR-140: IODMS Root Path
def get_iodms_root_path():
    """Gets the active IODMS root path from settings.
    
    This function implements FR-140 so that any document creation or read operation
    uses the folder path configured here.
    """
    settings = get_iodms_settings()
    return settings["iodms_root_path"]

# FR-013: No session timeout is enforced, but database connections are leased per request.
def get_db():
    """Creates a temporary database session and closes it when the request is done.
    
    This function is used as a FastAPI dependency to provide database access to routers.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
