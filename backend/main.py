import sys
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# This adds the current folder to Python's search path so it can find database.py, models.py, etc.
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import models
from database import engine
from routers import auth, admin, inward, outward, auditor, dashboard

# FR-011: Initialise database tables if they do not already exist on system startup.
# This runs the SQL commands to create the tables in PostgreSQL.
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="IODMS Backend API",
    description="Backend API for the Inward/Outward Document Management System at HAL AURDC, Nashik",
    version="1.0"
)

from sqlalchemy import text
@app.on_event("startup")
def apply_migrations():
    with engine.begin() as conn:
        migrations = [
            "ALTER TABLE outward_register ADD COLUMN linked_documents VARCHAR[] DEFAULT '{}'",
            "ALTER TABLE outward_register ADD COLUMN attachment_paths VARCHAR[] DEFAULT '{}'",
            "ALTER TABLE draft_files ADD COLUMN attachment_paths VARCHAR[] DEFAULT '{}'",
            "ALTER TABLE draft_files ADD COLUMN linked_documents VARCHAR[] DEFAULT '{}'"
        ]
        for query in migrations:
            try:
                conn.execute(text(query))
            except Exception:
                pass


# NFR-001, NFR-006: Allow only local connections (CORS configuration).
# This prevents other websites from making requests to our backend.
# The React development server typically runs on port 3000 or 5173.
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# FR-014, FR-023: Include the modules as separate sub-routers
# Router for Authentication & Profile (Module 1, 2, 10)
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])

# Router for Administrative & Master Lists (Module 8, 9)
app.include_router(admin.router, prefix="/api/admin", tags=["Administration"])
app.include_router(admin.address_router, prefix="/api/admin", tags=["Address Book"])

# Router for Dashboard Analytics
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])

# Router for Inward Registrations (Module 5, 6)
app.include_router(inward.router, prefix="/api/inward", tags=["Inward Register"])

# Router for Outward Registrations & Drafting (Module 3, 4, 7)
app.include_router(outward.router, prefix="/api/outward", tags=["Outward Register"])

# Router for Auditor View (Module 0)
app.include_router(auditor.router, prefix="/api/auditor", tags=["Auditor View"])

@app.get("/")
def read_root():
    """Simple health check endpoint to verify backend is running."""
    return {"status": "running", "app": "IODMS API"}
