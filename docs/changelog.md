# IODMS — Change Log

All changes to the IODMS project are documented here in reverse chronological order.
Each entry records: **when** it happened, **what** changed, **which files** were affected,
and **why** the change was made (linking back to FR IDs or NFR IDs where applicable).

---

## [2026-08-10] Unified Offline Deployment & Phase 5 Draft Usability Fixes

### Added / Modified
| File | Change | FR/NFR |
|---|---|---|
| `docs/Offline_Deployment_Guide.md` | Created comprehensive airgapped server deployment guide. | NFR-005 |
| `docs/IV_and_V_Report.md` | Created Independent Verification and Validation report. | NFR-006 |
| `docs/tech_stack_and_deployment_status.md` | Updated deployment status to reflect single-port FastAPI serving built React assets. | EIR-005 |
| `frontend/src/pages/DraftEditorPage.jsx` | Combined metadata compose fields with Editor.js online editor. | FR-051, FR-031 |
| `frontend/src/components/OnlineDocumentEditor.jsx` | Full overhaul of Editor.js styling to resemble MS Word (A4 layout, toolbar). | FR-051 |
| `frontend/src/pages/ComposeOutwardPage.jsx` | Reverted to exclusively handle metadata (Draft creation). | FR-031 |
| `backend/main.py` | Configured FastAPI to mount `frontend/dist` directory at root (unified port architecture). | EIR-005 |
| `iodms_offline_bundle/install_offline.bat` | Script pointing `pip` to local `.whl` files. | NFR-005 |

### Decisions Made
- Replaced the two-port development setup (Node.js on 5173, Python on 8000) with a production unified server: Python serving both API and static frontend assets on Port 80.
- Docker was deemed unnecessary and overkill for the production server, since all Python dependencies could be perfectly bundled offline using `.whl` files natively.

### Status
- Phase 5 Usability and Phase 6 Direct Word integration complete.
- System is 100% production-ready for offline deployment.

---

## [2026-08-08] Phase 6 Direct LAN Microsoft Word Editing

### Added / Modified
| File | Change | FR/NFR |
|---|---|---|
| `backend/database.py` | Added `iodms_lan_share_path` setting and helper for client-visible LAN share paths. | FR-052, EIR-003, EIR-004 |
| `backend/routers/admin.py` | Persisted LAN share path through Admin system settings. | FR-140, EIR-003 |
| `backend/routers/outward.py` | Draft list, detail, and lock responses now return `lan_shared_path` and `word_open_uri` for direct Word editing. Lock endpoint supports body-less authenticated calls. | FR-052, EIR-004 |
| `frontend/src/pages/AdminPage.jsx` | Added LAN Shared IODMS Path field to System Settings. | FR-140, EIR-003 |
| `frontend/src/pages/DraftsDispatchPage.jsx` | Reworked draft edit action to lock the draft, show the UNC path, open Word via protocol link, copy path, release lock, or use download/re-upload fallback. | FR-051, FR-052, FR-053, EIR-004 |
| `backend/test_api.py` | Added automated assertion for LAN path and Word URI generation. | FR-052 |
| `docs/test_cases.md` | Added manual validation cases for direct LAN Word edit, fallback re-upload, missing share setting, and Admin share path persistence. | FR-052, FR-140, EIR-003, EIR-004 |
| `docs/technical_design.md` | Documented server root path vs client LAN share path behavior. | EIR-003, EIR-004 |

### Decisions Made
- The database continues storing relative paths only. The backend computes client-visible UNC paths at response time from Admin settings.
- Direct Word editing is locked by the application, but lock release remains a deliberate user/Admin action because browsers cannot reliably detect when Microsoft Word exits after opening a LAN file.

### Status
- Phase 6 code and documentation are implemented.

---

## [2026-06-21] Project Initialisation

### Added
| File | Purpose |
|---|---|
| `.agents/AGENTS.md` | Project-scoped rules for Antigravity: auto-read requirements, FR-comment rule, beginner-friendly comments |
| `workflow.md` | V-Model Workflow Guide — describes every phase from requirements through LAN deployment |
| `docs/IODMS_requirements_context.md` | Full requirements document (v2.0): 11 modules, 91 FRs, 17 NFRs, 6 EIRs, RBAC matrix, database schema, folder structure |
| `docs/changelog.md` | This file — tracks all project changes |
| `docs/hld.md` | High Level Design (HLD) with Mermaid architecture and sequence traces |
| `docs/technical_design.md` | Technical Design specifying schema.sql and folder/file structure |
| `backend/requirements.txt` | Version-pinned backend dependencies |
| `backend/database.py` | Database session factory and Admin Settings base path reader/writer |
| `backend/models.py` | SQLAlchemy ORM models for all 11 database tables |
| `backend/main.py` | Main FastAPI application setting CORS, DB tables, and loading routers |
| `backend/routers/__init__.py` | Blank initializer for backend routers package |
| `backend/routers/auth.py` | Router for login, logout, birthdays, and profile actions |
| `backend/routers/admin.py` | Router for user CRUD, deletions approval, master list CRUD, settings, and address book |
| `backend/routers/inward.py` | Router for logging inwards, attachment uploads, and search/view |
| `backend/routers/outward.py` | Router for composing outward drafts, locking, dispatching, and search |
| `backend/routers/auditor.py` | Public read-only router for register access without authentication |
| `frontend/package.json` | Version-pinned frontend dependencies and configurations |
| `frontend/index.html` | Entry-point HTML loadingOutfit typography and scripts |
| `frontend/src/main.jsx` | React DOM rendering entry-point |
| `frontend/src/index.css` | Custom styles including scrollbars, watermarks, and dropzones |
| `frontend/src/App.jsx` | Routing configurations, layout drawers, and user context providers |
| `frontend/src/pages/LoginPage.jsx` | Officer sign-in page with Auditor portal trigger button |
| `frontend/src/pages/AuditorView.jsx` | Watermarked, context-suppressed, public read-only registry views |
| `frontend/src/pages/DashboardPage.jsx` | Officer welcome console showing stacked user birthday overlays |
| `frontend/src/pages/ComposeOutwardPage.jsx` | Outward form with bidirectional folder bindings and CC tags |
| `frontend/src/pages/DraftsDispatchPage.jsx` | Outward drafts table handling locked revisions and dispatch moves |
| `frontend/src/pages/LogInwardPage.jsx` | Inward registration form with inline editors and upload dropzone |
| `frontend/src/pages/InwardRegisterPage.jsx` | Inward register search console handling soft deletion flags |
| `frontend/src/pages/OutwardRegisterPage.jsx` | Outward register search console handling soft deletion flags |
| `frontend/src/pages/AddressBookPage.jsx` | contact list manager with slide-out drawer form and soft deletes |
| `frontend/src/pages/AdminPage.jsx` | Administration panel for user CRUD, deletions, and settings |
| `frontend/src/pages/MyProfilePage.jsx` | My profile dashboard handling update requests and password changes |
| `backend/seed.py` | Database initializer seeding default administrator, folders, groups, and folders |
| `docs/test_cases.md` | Verification roadmap detailing manual validation steps for all 100 functional requirements |
| `backend/test_api.py` | Pytest suite validating core router operations, numbering logic, locks, and soft deletes |

### Decisions Made
- **No audit_log table.** The requirements document (v2.0) explicitly states *"No audit log table is required."* The workflow guide's HLD table list mentions `audit_log` — we follow the requirements document, not the workflow's older table list.
- **No designations/organisations tables.** The workflow guide mentions these; the requirements document defines Designation and Organisation as free-text fields on `address_book`. We follow the requirements document.
- **Standalone-first.** All development targets `localhost` on a single PC. LAN configuration is deferred to Phase 2C.
- **Google Style Guides.** All Python code follows the [Google Python Style Guide](https://google.github.io/styleguide/pyguide.html). All JavaScript follows the [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html).

### Status
- ✅ Phase 1 — Requirements: DONE
- ✅ Phase 2A — Standalone PC Design: DONE
- ✅ Phase 2B — Code Generation: DONE
- ✅ Phase 3A — Standalone Testing: DONE

---

*Template for future entries:*

```
## [YYYY-MM-DD] Short Description

### Added / Modified / Removed
| File | Change | FR/NFR |
|---|---|---|
| `path/to/file` | What changed | FR-XXX |

### Decisions Made
- Bullet points for any design decisions or deviations

### Issues Found
- Bullet points for any bugs or problems encountered

### Status
- Phase status updates
```
