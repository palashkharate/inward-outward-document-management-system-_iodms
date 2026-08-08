import sys
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

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
# In production mode (serving frontend from same origin), CORS is less critical
# but we keep it for dev mode when React runs on a separate port.
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://localhost:80",
    "http://127.0.0.1:80",
    "http://localhost",
    "http://127.0.0.1",
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

# FR-NFR: Health check endpoint for monitoring
@app.get("/api/health")
def health_check():
    """Simple health check endpoint to verify backend is running."""
    return {"status": "running", "app": "IODMS API"}


# --- FR-NFR: Unified Production Serving ---
# Serve the compiled React frontend from the dist folder.
# This allows running the entire app (frontend + backend) from a single
# server process on one port — ideal for the air-gapped defense LAN.

# Path to the compiled frontend build output
FRONTEND_DIST = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
)

if os.path.isdir(FRONTEND_DIST):
    # Serve JS, CSS, images, and other static assets from /assets/
    app.mount(
        "/assets",
        StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")),
        name="static-assets"
    )

    # Serve /images/ if it exists (logo, icons, etc.)
    images_dir = os.path.join(FRONTEND_DIST, "images")
    if os.path.isdir(images_dir):
        app.mount(
            "/images",
            StaticFiles(directory=images_dir),
            name="static-images"
        )

    # SPA catch-all: any route that is NOT an /api/* request gets index.html
    # This lets React Router handle client-side routes like /compose-outward
    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        """FR-NFR: Catch-all route that serves the React SPA index.html.
        
        Any URL that doesn't match an /api/* endpoint gets the React app,
        which then handles routing on the client side.
        """
        # If a real file exists in dist (e.g. favicon.ico), serve it directly
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        # Otherwise serve index.html for React Router to handle
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
else:
    # Development mode fallback — no frontend build present
    @app.get("/")
    def read_root():
        """Simple health check endpoint to verify backend is running."""
        return {"status": "running", "app": "IODMS API", "mode": "dev (no frontend dist found)"}
