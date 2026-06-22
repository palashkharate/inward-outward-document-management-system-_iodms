# Technical Design: Database Schema & Directory Structure

This document details the database schema (`schema.sql`) and the directory layout of the IODMS codebase.

---

## Part A: Database Schema (`schema.sql`)

Below are the `CREATE TABLE` and database comment commands for the 11 tables required by IODMS. All SQL statements are written for PostgreSQL.

```sql
-- 1. Folder Types Table (FR-034, FR-035, FR-071, FR-072, FR-130)
CREATE TABLE folder_types (
    folder_id VARCHAR(50) PRIMARY KEY,
    folder_name VARCHAR(255) NOT NULL
);
COMMENT ON TABLE folder_types IS 'Master list of Folder IDs and full Folder Names (e.g. Su-30)';
COMMENT ON COLUMN folder_types.folder_id IS 'Unique short code representation of a folder (e.g. LCA)';
COMMENT ON COLUMN folder_types.folder_name IS 'Full descriptive name of the folder (e.g. Light Combat Aircraft)';

-- 2. Address Groups Table (FR-037, FR-105, FR-131)
CREATE TABLE address_groups (
    group_id SERIAL PRIMARY KEY,
    group_name VARCHAR(100) UNIQUE NOT NULL
);
COMMENT ON TABLE address_groups IS 'Address Group categories (e.g. IAF, BEL) used to filter contacts';
COMMENT ON COLUMN address_groups.group_id IS 'Auto-generated group identifier';
COMMENT ON COLUMN address_groups.group_name IS 'Name of the address group (e.g. IAF)';

-- 3. Address Book Table (FR-038, FR-039, FR-040, FR-073, FR-100, FR-102, FR-103)
CREATE TABLE address_book (
    address_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    designation VARCHAR(255),
    organisation VARCHAR(255),
    address_line_1 VARCHAR(255),
    address_line_2 VARCHAR(255),
    fax_no VARCHAR(50),
    email VARCHAR(255),
    address_group VARCHAR(100) REFERENCES address_groups(group_name) ON UPDATE CASCADE
);
COMMENT ON TABLE address_book IS 'Contacts and addresses for dispatching and copying documents';
COMMENT ON COLUMN address_book.address_group IS 'Link to the address group categorisation (acts as contact type)';

-- 4. Users Table (FR-010, FR-020, FR-110, FR-111, FR-150)
CREATE TABLE users (
    user_id VARCHAR(100) PRIMARY KEY,
    pb_no VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    dob DATE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('User', 'Admin')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);
COMMENT ON TABLE users IS 'User accounts for officers containing personnel details and passwords';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password';
COMMENT ON COLUMN users.role IS 'Either User or Admin';
COMMENT ON COLUMN users.is_active IS 'Active status toggle; set by Admin';

-- 5. Received From List Table (FR-067, FR-082, FR-132)
CREATE TABLE received_from_list (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
);
COMMENT ON TABLE received_from_list IS 'Standalone dropdown values for the Received From field';

-- 6. Originated By List Table (FR-068, FR-082, FR-133)
CREATE TABLE originated_by_list (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
);
COMMENT ON TABLE originated_by_list IS 'Standalone dropdown values for the Originated By field';

-- 7. Inward Register Table (FR-060, FR-075, FR-077, FR-080, FR-081)
CREATE TABLE inward_register (
    inward_no VARCHAR(10) NOT NULL,
    folder_id VARCHAR(50) REFERENCES folder_types(folder_id) ON UPDATE CASCADE,
    year INTEGER NOT NULL,
    receiving_date DATE NOT NULL DEFAULT CURRENT_DATE,
    inward_letter_no VARCHAR(255),
    inward_date DATE,
    received_from VARCHAR(255),
    originated_by VARCHAR(255),
    subject TEXT,
    assign_to VARCHAR(100)[] DEFAULT '{}',
    cc_sent_to INTEGER[] DEFAULT '{}',
    remarks TEXT,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('Query', 'Snag', 'File')),
    status VARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Not Active')),
    attachment_path VARCHAR(500),
    attachment_original_ext VARCHAR(50),
    PRIMARY KEY (folder_id, year, inward_no)
);
COMMENT ON TABLE inward_register IS 'All logged and stored inward documents';
COMMENT ON COLUMN inward_register.inward_no IS 'Yearly-reset sequential number (001-999, then 1000+) per Folder ID';
COMMENT ON COLUMN inward_register.assign_to IS 'Array of User IDs assigned to action the inward document';
COMMENT ON COLUMN inward_register.cc_sent_to IS 'Array of Address IDs from the address book';

-- 8. Outward Register Table (FR-054, FR-090, FR-091, FR-092)
CREATE TABLE outward_register (
    outward_no VARCHAR(10) NOT NULL,
    folder_id VARCHAR(50) REFERENCES folder_types(folder_id) ON UPDATE CASCADE,
    year INTEGER NOT NULL,
    issuing_date DATE NOT NULL,
    address_to INTEGER[] DEFAULT '{}',
    cc_to INTEGER[] DEFAULT '{}',
    subject TEXT,
    remarks TEXT,
    prepared_by VARCHAR(100) REFERENCES users(user_id) ON UPDATE CASCADE,
    actioned_by VARCHAR(100) REFERENCES users(user_id) ON UPDATE CASCADE,
    document_path VARCHAR(500) NOT NULL,
    template_type VARCHAR(100) NOT NULL CHECK (template_type IN ('Fax_With_GM_Sig', 'Fax_Without_GM_Sig', 'Internal_Letter')),
    PRIMARY KEY (folder_id, year, outward_no)
);
COMMENT ON TABLE outward_register IS 'All finalised and dispatched outward documents';
COMMENT ON COLUMN outward_register.outward_no IS 'Yearly-reset sequential number (001-999, then 1000+) per Folder ID';

-- 9. Draft Files Table (FR-042, FR-050, FR-052, FR-055)
CREATE TABLE draft_files (
    draft_id SERIAL PRIMARY KEY,
    file_path VARCHAR(500) NOT NULL,
    outward_no VARCHAR(10) NOT NULL,
    folder_id VARCHAR(50) REFERENCES folder_types(folder_id) ON UPDATE CASCADE,
    issuing_date DATE NOT NULL,
    address_to INTEGER[] DEFAULT '{}',
    cc_to INTEGER[] DEFAULT '{}',
    subject TEXT,
    remarks TEXT,
    prepared_by VARCHAR(100) REFERENCES users(user_id) ON UPDATE CASCADE,
    actioned_by VARCHAR(100) REFERENCES users(user_id) ON UPDATE CASCADE,
    template_type VARCHAR(100) NOT NULL CHECK (template_type IN ('Fax_With_GM_Sig', 'Fax_Without_GM_Sig', 'Internal_Letter')),
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    locked_by VARCHAR(100) REFERENCES users(user_id) ON UPDATE CASCADE,
    year INTEGER NOT NULL,
    created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE draft_files IS 'Metadata and lock status for outward drafts awaiting dispatch';
COMMENT ON COLUMN draft_files.outward_no IS 'Pre-assigned outward number reserved during creation';
COMMENT ON COLUMN draft_files.is_locked IS 'Lock toggle to prevent concurrent editing of the draft document file';

-- 10. Pending Deletions Table (FR-056, FR-084, FR-095, FR-104, FR-120, FR-121)
CREATE TABLE pending_deletions (
    id SERIAL PRIMARY KEY,
    source_table VARCHAR(100) NOT NULL,
    record_id VARCHAR(255) NOT NULL,
    requested_by VARCHAR(100) REFERENCES users(user_id) ON UPDATE CASCADE,
    requested_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected'))
);
COMMENT ON TABLE pending_deletions IS 'Audit table for deletion requests that require Admin approval';

-- 11. Pending Profile Edits Table (FR-125, FR-126, FR-151, FR-152)
CREATE TABLE pending_profile_edits (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) REFERENCES users(user_id) ON UPDATE CASCADE,
    proposed_changes JSONB NOT NULL,
    requested_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected'))
);
COMMENT ON TABLE pending_profile_edits IS 'Profile modifications submitted by users awaiting Admin approval';
```

---

## Part B: Folder and File Directory Structure

To keep code manageable by a single developer (NFR-012), the project uses a clean structure.

```
inword outword folder/
│
├── backend/
│   ├── main.py                     # Entry point for the FastAPI server (defines CORS, includes routers)
│   ├── database.py                 # Handles SQLAlchemy DB engine, session creation, and setting path configs
│   ├── models.py                   # Declares SQLAlchemy ORM models for all 11 database tables
│   ├── requirements.txt            # Python dependencies with pinned versions (NFR-011)
│   ├── seed.py                     # Database initialisation script (creates Admin, master folder categories)
│   ├── test_api.py                 # Pytest script testing API endpoints
│   │
│   └── routers/                    # Backend API endpoint files divided by operational modules
│       ├── auth.py                 # Auth router: Handles login, logout, profile view, password resets
│       ├── admin.py                # Admin router: User admin, deletions approval, master list CRUD, settings
│       ├── inward.py               # Inward router: Log new inwards, file uploads, register search
│       ├── outward.py              # Outward router: Draft creations, Word file generation, locking, dispatch
│       └── auditor.py              # Auditor router: Read-only register feeds requiring no session auth
│
├── frontend/
│   ├── package.json                # Frontend dependencies with pinned version configurations
│   ├── index.html                  # Main HTML wrapper (references bundled assets)
│   │
│   └── src/
│       ├── App.jsx                 # Configures routing, theme provider, navigation sidebars
│       ├── index.css               # Holds global CSS rules (watermarks, file-drop margins, print rules)
│       │
│       └── pages/                  # Single-file component views corresponding to the App page routing
│           ├── LoginPage.jsx       # Standard form showing officer login fields & Auditor button
│           ├── AuditorView.jsx     # Read-only watermarked register tabs with print & copy disabled
│           ├── DashboardPage.jsx   # Welcome view displaying birthday overlays
│           ├── ComposeOutwardPage.jsx # Outward template composer form with auto folder bindings
│           ├── DraftsDispatchPage.jsx # Draft registry list showing edit locking and final dispatch options
│           ├── LogInwardPage.jsx   # Inward entry capture form with attachment drag-and-drop zone
│           ├── InwardRegisterPage.jsx # General search panel and paginated display list for inward logs
│           ├── OutwardRegisterPage.jsx # General search panel and paginated display list for outward entries
│           ├── AddressBookPage.jsx # Contact register table listing active client details and phone book
│           ├── AdminPage.jsx       # Admin panel holding user settings, approvals, and dropdown lists
│           └── MyProfilePage.jsx   # Personal details panel for editing credentials and requesting updates
│
├── docs/
│   ├── IODMS_requirements_context.md # Master System Requirements Specification (SRS)
│   ├── workflow.md                 # Project V-Model walkthrough steps
│   ├── hld.md                      # High Level Design with sequence workflows
│   ├── technical_design.md         # This document
│   ├── changelog.md                # Reverse chronological change log tracking edits
│   └── test_cases.md               # Visual testing roadmap tracking validation checks
│
└── IODMS_DATA/                     # Configurable root folder where uploaded files and drafts reside
    ├── Inward/                     # Storage for logged inward documents
    ├── Outward/                    # Storage for dispatched final outward documents
    └── Drafts/                     # Temporary storage for active draft outward templates
```
