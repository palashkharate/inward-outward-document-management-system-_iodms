# IODMS - Project State & AI Handoff Context

**Last Updated:** August 2, 2026

If you are a new AI taking over this project, this document provides the critical context of what has been built, the architecture, and current status.

## Environment & Rules (CRITICAL)
- **Environment:** Windows Server 2012, completely Air-Gapped Defense LAN.
- **Rules:** 
  1. DO NOT use external CDNs for anything. Fonts, icons, and libraries must be bundled.
  2. The target database is PostgreSQL (using `psycopg` locally).
  3. All code runs via `cmd /c`. For Python, use `venv\Scripts\python`.
  4. Always add an FR comment above new functions (e.g. `# FR-015: ...`).
  5. UI should follow "Aviation Cockpit Slate Blue" aesthetic.
  6. The backend is FastAPI, and the frontend is React (Vite).
  7. **Unified Production:** Both frontend and backend are served from a single FastAPI process on port 80. The Vite build is output to `frontend/dist` and served by `backend/main.py`.

## Core Features Implemented
1. **Inward Register & Outward Register:** Full CRUD for tracking document metadata.
2. **Linked Documents:** Documents can be linked bi-directionally between Inward/Outward.
3. **Drafts & Dispatch:** Users create drafts (reserves space/folder). Once finalized, a draft is "dispatched", assigning it a final Outward Number and moving it to the Outward Register.
4. **Draft Editor Integration (Phase 5):** 
   - A dedicated `DraftEditorPage.jsx` houses a Word-like rich text editor featuring compose fields editable right alongside the document body.
   - Real-time concurrency: Drafts can be locked by users to prevent overwriting. Lock data is `is_locked`, `locked_by`, `locked_at`.
   - View-Only mode mounts when another user has the lock.
5. **Direct LAN Word Editing (Phase 6):**
   - Implements `ms-word:ofe|u|file://...` protocols allowing users to open drafts and documents directly in desktop Microsoft Word over an SMB LAN Share.
   - Admin panel allows configuring the LAN Shared IODMS Path.
6. **Unified Server & Offline Bundle:** 
   - The Vite build is output to `frontend/dist` and served by `backend/main.py` on port 80.
   - A complete `iodms_offline_bundle` folder with `.whl` files and `install_offline.bat` allows for airgapped deployment on Windows Server 2012 without Docker or internet.

## Current Project State
**Status:** VALIDATED & COMPLETED.
- All functional requirements (FR) from `IODMS_requirements_context.md` have been met.
- Phase 5 (Concurrency & Online Editing) and Phase 6 (Direct Word Editing) are fully merged and functional.
- The system is ready for immediate deployment on the defense server.

## File Locations
- **Backend:** `backend/`
  - `main.py` - FastAPI entrypoint, serves static frontend assets.
  - `models.py` - SQLAlchemy models.
  - `routers/outward.py` - Contains the `GET /drafts/{draft_id}` and `PUT /drafts/{draft_id}` endpoints, plus document generation logic.
- **Frontend:** `frontend/src/`
  - `pages/DraftEditorPage.jsx` - The full-page draft editor combining metadata editing + Word-like Editor.js.
  - `pages/ComposeOutwardPage.jsx` - Create metadata only.
  - `pages/DraftsDispatchPage.jsx` - The drafts dashboard.
  - `components/DocumentViewerModal.jsx` - The in-browser viewer (hides iframe for `.docx`).
  - `components/OnlineDocumentEditor.jsx` - The custom Word-style React wrapper around Editor.js.
