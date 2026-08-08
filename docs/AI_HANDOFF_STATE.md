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
4. **Draft Editor Integration (Phase 3/5):** 
   - `Editor.js` is embedded in the frontend for online editing (`document_body` JSONB column).
   - Backend `routers/outward.py::create_draft_document()` converts Editor.js JSON blocks to a physical `.docx` template using python-docx.
5. **Concurrency (Locks):** Drafts can be locked by users to prevent overwriting. Lock data is `is_locked`, `locked_by`, `locked_at`.
6. **Unified Server:** A script `build_and_run_prod.bat` compiles the React app and serves it natively from FastAPI `main.py` on port 80.

## Current Work in Progress: Phase 5 (Draft Editor Usability)
We are currently refactoring how Draft editing works because the user reported usability issues:
1. **Issue:** `ComposeOutwardPage.jsx` was bloated with the `OnlineDocumentEditor`.
   - **Fix:** Reverting Compose to just metadata form. Moving the Editor to a new dedicated `DraftEditorPage.jsx`.
2. **Issue:** Users want a View-Only mode if someone else is editing the draft.
   - **Fix:** `DraftEditorPage.jsx` checks the lock status. If locked by another user, it mounts Editor.js in `readOnly: true` mode with a warning banner.
3. **Issue:** `DocumentViewerModal.jsx` (the iframe preview) renders garbage text when viewing `.docx` files because browsers can't render them offline.
   - **Fix:** Adding an extension check. If it's a Word file, hide the iframe and show a "Preview not available, please click Download" message.

## File Locations
- **Backend:** `backend/`
  - `main.py` - FastAPI entrypoint, serves static frontend assets.
  - `models.py` - SQLAlchemy models.
  - `routers/outward.py` - Contains the `GET /drafts/{draft_id}` and `PUT /drafts/{draft_id}` endpoints, plus document generation logic.
- **Frontend:** `frontend/src/`
  - `pages/DraftEditorPage.jsx` - The new dedicated editor page (currently being built).
  - `pages/ComposeOutwardPage.jsx` - Create/Modify metadata only.
  - `pages/DraftsDispatchPage.jsx` - The drafts dashboard with "Edit Online" buttons.
  - `components/DocumentViewerModal.jsx` - The in-browser viewer.
  - `components/OnlineDocumentEditor.jsx` - The Editor.js React wrapper.

You can safely run `npm run build` from the `frontend` folder to test compilations.
