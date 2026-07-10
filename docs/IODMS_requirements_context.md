# IODMS — Project Context & Requirements
## Inward/Outward Document Management System
### HAL AURDC (Aircraft Upgrade Research & Design Centre), Nashik — DEA (Design & Engineering Activity)

---

## Project Context

- Redevelopment of a legacy Microsoft Access-based document management system
- Legacy DB is inaccessible; 5 tables exported to XLSX are available for one-time migration
- ~5000+ scanned documents/PDFs from 2006 onwards need to be migrated into the new folder structure
- Air-gapped LAN setup (no internet connectivity) — HAL is protected under the Official Secrets Act, 1923
- Central server PC hosts the database and the shared IODMS folder; all clients connect over LAN
- ~30 registered users; maximum 10 concurrent users (very rare peak load)
- Tech Stack: **React + Material UI** (frontend) · **FastAPI / Python** (backend) · **PostgreSQL** (database)
- Frontend is browser-based; no software installation required on client machines
- On-demand desktop packaging (e.g. Electron) from the same codebase is a future scope item — defer to last
- SDLC: V-Model (4-phase). Current phase: Requirements (SRS) — in progress
- RBAC: three access levels — **User**, **Admin**, **Auditor** (view-only, no login required)

---

## Terminology Reference
> ⚠️ **Canonical naming used throughout this document. AI shall not deviate from these terms.**

| Legacy / Ambiguous Term | Canonical Term Used in This Document |
|---|---|
| File (referring to Su-30, LCA grouping) | **Folder** |
| File No. / File Number | **Folder ID** (short code, e.g. `Su-30`, `LCA`) |
| File Name / File Folder Name | **Folder Name** (full descriptive name) |
| Create File | **Compose Outward** |
| Finalise File / Draft File | **Drafts & Dispatch** |
| Inward Entry | **Log Inward** |
| Type / Category (in Inward) | **Document Type** |
| Finalise (action button) | **Dispatch** |
| Move to Trash (in Drafts) | **Discard Draft** |
| Address Group / Category (in Compose Outward) | **Address Group** |
| Referred To | **Assign To** |
| Created By / Issued By | **Prepared By** |
| Register No. | **Outward No.** |
| Dept Inward No. | **Inward No.** |

---

## Document & Folder Storage Structure

```
IODMS/
├── Inward/
│   └── {Year}/
│       └── {Folder ID e.g. Su-30, LCA}/
│           └── 001, 002, 003 ... 999, 1000, 1001  (cumulative; file extension preserved from upload)
├── Outward/
│   └── {Year}/
│       └── {Folder ID}/
│           └── 001, 002, 003 ... (cumulative; .doc)
├── Drafts/
│   └── {Year}/
│       └── {Folder ID}/
│           └── fax-{UserID}-{YYYYMMDD}-{HHMMSS}.doc
└── Database/   ← PostgreSQL data directory (managed by server)
```

**Numbering Rules:**
- Numbering resets to `001` on January 1 each year, per Folder ID, per register type (Inward and Outward are independent sequences)
- Zero-padding is fixed to 3 digits up to `999` (i.e. `001`–`999`), then switches naturally to 4+ digits (`1000`, `1001`, …) to comply with legacy migration records
- Draft filenames follow the format `fax-{UserID}-{YYYYMMDD}-{HHMMSS}.doc` and are **never renumbered**
- On Dispatch, a draft is renamed to the next sequential number in `Outward/{Year}/{FolderID}/` and moved there
- Inward attachments are stored as their next sequential number but retain their original file extension (e.g. `003.pdf`, `004.jpg`)
- The base path of the IODMS folder is configurable by Admin (to support future server migrations); default at deployment is `IODMS/` relative to the configured root

---

## Database Schema

All dropdown/admin-editable data lives in the database — never hard-coded.

| Table | Purpose |
|---|---|
| `inward_register` | All inward records (legacy migrated + new) |
| `outward_register` | All outward records (legacy migrated + new) |
| `address_book` | All address entries (legacy migrated + new) |
| `received_from_list` | Standalone list for "Received From" in Log Inward (name only; managed inline) |
| `originated_by_list` | Standalone list for "Originated By" in Log Inward (name only; managed inline) |
| `users` | Officer accounts, roles (User/Admin), credentials, PB No., DOB |
| `folder_types` | Master list of Folder IDs and their full Folder Names (e.g. `Su-30` → `Sukhoi Su-30 MKI`) |
| `address_groups` | Address Group/Category labels; each linked to address book entries |
| `draft_files` | Metadata for all draft documents awaiting Dispatch |
| `pending_deletions` | Soft-deleted records flagged for Admin approval (all tables) |
| `pending_profile_edits` | User-submitted profile change requests awaiting Admin approval |

> ℹ️ No audit log table is required.

---

### Table: `inward_register`

| Column | Type | Notes |
|---|---|---|
| `inward_no` | VARCHAR(10) | Auto-generated on New; format `001`–`999`/`1000`+ per year per Folder ID |
| `receiving_date` | DATE | Date picker; default today |
| `inward_letter_no` | VARCHAR | Free text; reference number on the incoming letter |
| `inward_date` | DATE | Date of the original incoming letter |
| `received_from` | VARCHAR | Selected from `received_from_list` |
| `originated_by` | VARCHAR | Selected from `originated_by_list` |
| `subject` | TEXT | No character limit |
| `assign_to` | VARCHAR[] | Array of User IDs; multi-select |
| `folder_id` | VARCHAR | FK → `folder_types.folder_id` |
| `cc_sent_to` | INTEGER[] | Array of Address IDs → `address_book` |
| `remarks` | TEXT | No character limit |
| `document_type` | VARCHAR | ENUM: `Query`, `Snag`, `File` |
| `status` | VARCHAR | ENUM: `Active`, `Not Active` |
| `attachment_path` | VARCHAR | Relative path to stored file within IODMS folder |
| `attachment_original_ext` | VARCHAR | Original file extension of uploaded attachment |
| `year` | INTEGER | Derived from `receiving_date`; used for partitioning/filtering |

---

### Table: `outward_register`

| Column | Type | Notes |
|---|---|---|
| `outward_no` | VARCHAR(10) | Auto-generated on New (on Drafts & Dispatch page); format `001`+ per year per Folder ID |
| `folder_id` | VARCHAR | FK → `folder_types.folder_id` |
| `issuing_date` | DATE | Date of dispatch/finalisation |
| `address_to` | INTEGER[] | Array of Address IDs → `address_book` (primary recipients) |
| `cc_to` | INTEGER[] | Array of Address IDs → `address_book` |
| `subject` | TEXT | No character limit |
| `remarks` | TEXT | No character limit |
| `prepared_by` | VARCHAR | User ID of officer on whose behalf document was prepared |
| `actioned_by` | VARCHAR | User ID of officer who actually performed the action (for internal record) |
| `document_path` | VARCHAR | Relative path to `.doc` file within IODMS folder |
| `template_type` | VARCHAR | ENUM: `Fax_With_GM_Sig`, `Fax_Without_GM_Sig`, `Internal_Letter` |
| `year` | INTEGER | Derived from `issuing_date` |

---

### Table: `address_book`

| Column | Type | Notes |
|---|---|---|
| `address_id` | SERIAL | Auto-generated; primary key |
| `name` | VARCHAR | Full name |
| `designation` | VARCHAR | Free text |
| `organisation` | VARCHAR | Free text |
| `address_line_1` | VARCHAR | |
| `address_line_2` | VARCHAR | |
| `fax_no` | VARCHAR | |
| `email` | VARCHAR | |
| `address_group` | VARCHAR | FK → `address_groups`; also serves as the "Type" field (IAF, BEL, Others, etc.) |

---

### Table: `draft_files`

| Column | Type | Notes |
|---|---|---|
| `draft_id` | SERIAL | Auto-generated |
| `file_path` | VARCHAR | Relative path: `Drafts/{Year}/{FolderID}/fax-{UserID}-{YYYYMMDD}-{HHMMSS}.doc` |
| `outward_no` | VARCHAR(10) | Pre-assigned outward number (generated on New in Drafts & Dispatch) |
| `folder_id` | VARCHAR | FK → `folder_types.folder_id` |
| `issuing_date` | DATE | Date picker value from Compose Outward form |
| `address_to` | INTEGER[] | FK array → `address_book` |
| `cc_to` | INTEGER[] | FK array → `address_book` |
| `subject` | TEXT | |
| `remarks` | TEXT | |
| `prepared_by` | VARCHAR | User ID |
| `actioned_by` | VARCHAR | User ID of person who created the draft |
| `template_type` | VARCHAR | ENUM: `Fax_With_GM_Sig`, `Fax_Without_GM_Sig`, `Internal_Letter` |
| `is_locked` | BOOLEAN | `true` when a user has the file open in MS Word; prevents concurrent editing |
| `locked_by` | VARCHAR | User ID of the user currently editing |
| `year` | INTEGER | |
| `created_on` | TIMESTAMP | Auto set on creation |

---

### Table: `users`

| Column | Type | Notes |
|---|---|---|
| `user_id` | VARCHAR | Primary key; used for login |
| `pb_no` | VARCHAR | Personnel Book number; unique; stored for Admin reference only |
| `name` | VARCHAR | Full name |
| `dob` | DATE | Used for birthday feature |
| `password_hash` | VARCHAR | bcrypt hash |
| `role` | VARCHAR | ENUM: `User`, `Admin` |
| `is_active` | BOOLEAN | Admin can activate/deactivate |

---

### Table: `folder_types`

| Column | Type | Notes |
|---|---|---|
| `folder_id` | VARCHAR | Short code, e.g. `Su-30`, `LCA`; primary key |
| `folder_name` | VARCHAR | Full descriptive name, e.g. `Sukhoi Su-30 MKI` |

---

### Table: `address_groups`

| Column | Type | Notes |
|---|---|---|
| `group_id` | SERIAL | |
| `group_name` | VARCHAR | e.g. `IAF`, `BEL`, `Others` |

---

### Table: `received_from_list` / `originated_by_list`

| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL | |
| `name` | VARCHAR | Display name only |

---

### Table: `pending_deletions`

| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL | |
| `source_table` | VARCHAR | Which table the record belongs to |
| `record_id` | VARCHAR | PK of the flagged record |
| `requested_by` | VARCHAR | User ID |
| `requested_on` | TIMESTAMP | |
| `status` | VARCHAR | ENUM: `Pending`, `Approved`, `Rejected` |

---

### Table: `pending_profile_edits`

| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL | |
| `user_id` | VARCHAR | User requesting the change |
| `proposed_changes` | JSONB | Fields and new values |
| `requested_on` | TIMESTAMP | |
| `status` | VARCHAR | ENUM: `Pending`, `Approved`, `Rejected` |

---

## Functional Requirements

---

### Module 0 — Auditor View (No Login Required)

> Accessible from the Login page via a clearly labelled button: **"View Registers (Auditor)"**. No credentials required.

| FR ID | Requirement |
|---|---|
| FR-000 | A **"View Registers (Auditor)"** button shall be present on the Login page, below the login form, visually distinct but unobtrusive |
| FR-001 | Clicking it opens a read-only view showing two tabs: **Inward Register** and **Outward Register** |
| FR-002 | Both tabs shall display the full register table with year filter and search functionality identical to the logged-in register views |
| FR-003 | No actions (edit, delete, add, dispatch, etc.) shall be available in Auditor View |
| FR-004 | Text selection and copy-paste shall be disabled via CSS (`user-select: none`) on all content in Auditor View |
| FR-005 | A persistent visible watermark **"CONFIDENTIAL – VIEW ONLY"** shall appear across the page in light red diagonal text |
| FR-006 | Right-click context menu shall be suppressed on this page |
| FR-007 | No navigation to any other module shall be available from Auditor View; only a **"Back to Login"** button |

---

### Module 1 — Login & Session

| FR ID | Requirement |
|---|---|
| FR-010 | Login screen shall have fields: **User ID**, **Password**, and a **Login** button |
| FR-011 | On successful login, the system shall redirect to the Dashboard |
| FR-012 | On failed login (wrong credentials), display an inline error: *"Invalid User ID or Password"* |
| FR-013 | No session timeout shall be enforced (LAN environment; users are trusted officers) |
| FR-014 | A **Logout** option shall be available at all times from the navigation bar |
| FR-015 | Password reset can be performed by the Admin on behalf of any user from the Admin Panel |
| FR-016 | No SSO, no OTP, no email-based reset — credential-based authentication only |
| FR-017 | **Auto-Logout on Tab Close**: The session token shall be stored in `sessionStorage` rather than `localStorage`, ensuring the user is automatically logged out when the browser tab or window is closed. |
| FR-018 | **Auto-Save Drafts**: Any progress typed into Compose Draft or Log Inward forms is continuously auto-saved to `sessionStorage` so it can be restored if the user accidentally reloads the page. |

---

### Module 2 — Dashboard

| FR ID | Requirement |
|---|---|
| FR-020 | On login, display a welcome screen showing the logged-in user's name and role |
| FR-021 | **Birthday Overlay**: On dashboard load, if any officer/admin has a birthday today, a colorful animated greeting card overlay appears with cake emoji (🎂), confetti-style gradient background, and the birthday person's name(s) stacked centrally. It auto-shows once per day on first login. Users can reopen the greeting at any time by clicking a balloon icon (🎈) in the header. |
| FR-022 | If multiple users share the same birthday, display all their names stacked centrally |
| FR-023 | Navigation sidebar/topbar shall provide links to all modules accessible to the current user's role |

---

### Module 3 — Compose Outward *(formerly "Create File")*

> This module allows users to prepare a new outward document draft.

| FR ID | Requirement |
|---|---|
| FR-030 | The page shall have a **New** button; clicking it initialises a blank Compose Outward form |
| FR-031 | **Subject** — free text input; no character limit |
| FR-032 | **Prepared By** — dropdown of all active User IDs; any logged-in user may select any other user (on-behalf-of support); defaults to the currently logged-in user |
| FR-033 | **Date** — date picker; defaults to today |
| FR-034 | **Folder ID** — dropdown populated from `folder_types.folder_id`; selecting it auto-populates the **Folder Name** field |
| FR-035 | **Folder Name** — dropdown populated from `folder_types.folder_name`; selecting it auto-populates the **Folder ID** field; the two fields are bidirectional |
| FR-036 | **Template** — dropdown with three options: `Fax / Outside Letter (With GM Signature)`, `Fax / Outside Letter (Without GM Signature)`, `Internal Letter`; selected while filling the form |
| FR-037 | **Address Group** — dropdown from `address_groups`; selecting it filters the Address To dropdown |
| FR-038 | **Address To** — dropdown showing names of addresses belonging to the selected Address Group; supports single primary selection; show full name in dropdown |
| FR-039 | **Selected Address Display** — below the dropdown, display the full address details (Name, Designation, Organisation, Address Line 1, Address Line 2, Fax, Email) of the selected Address To entry |
| FR-040 | **CC** — multi-select from full address book; user may add multiple CC entries using a **"+ Add CC"** button; each added entry shown as a removable chip/tag |
| FR-041 | **Remarks** — free text input; no character limit |
| FR-042 | On clicking **Save Draft**: the system shall generate a `.doc` file from the selected template pre-filled with all form data; save it to `IODMS/Drafts/{Year}/{FolderID}/fax-{UserID}-{YYYYMMDD}-{HHMMSS}.doc`; create a record in `draft_files`; *(template population logic to be configured later — for now the file is created with placeholder tags)* |
| FR-043 | Only one draft can be created per form submission; the form resets after successful save |
| FR-044 | **Modify mode**: if a user opens an existing record from Outward Register for editing, this form opens pre-filled; the **New** button is replaced by a **Modify** button; on save, the existing `outward_register` record is updated in place and the `.doc` file is replaced on disk (no new draft created) |
| FR-045 | When editing an existing record, if the user modifies any field that matches an existing record, display a confirmation dialog: *"You are about to modify Outward No. [XXX]. Do you want to continue?"* — Yes proceeds, No clears the form |

---

### Module 4 — Drafts & Dispatch *(formerly "Finalise File")*

> This module shows all draft documents and allows them to be dispatched (finalised) or discarded.

| FR ID | Requirement |
|---|---|
| FR-050 | Display a table of all records in `draft_files` with columns: **Outward No.**, **Folder ID**, **Folder Name**, **Date**, **Address To**, **Subject**, **Remarks**, **Prepared By**, **Created On** |
| FR-051 | Clicking any row reveals two action buttons inline: **Open / Edit in MS Word** and **Dispatch** |
| FR-052 | **Download–Edit–Re-upload with Pessimistic Locking**: When a user clicks "Edit" on a draft, the system locks the file (`is_locked = true`, `locked_by`, `locked_at` timestamp). The user downloads the file, edits in MS Word, and re-uploads via a dedicated re-upload button. Other users see "Currently being edited by [User Name]" and can only view (read-only). Locks auto-expire after 30 minutes of inactivity. Admin can force-release any lock. |
| FR-053 | Lock release mechanism: provide a manual **"Release Lock"** button visible to Admin at all times; for the editing user, lock is released on next page load after Word is closed *(auto-sync via LAN share)* |
| FR-054 | **Dispatch**: clicking Dispatch moves the draft to `outward_register`; renames the file from `fax-{UserID}-{YYYYMMDD}-{HHMMSS}.doc` to the next sequential number (e.g. `004.doc`) and moves it to `IODMS/Outward/{Year}/{FolderID}/`; sets `issuing_date` to today; removes record from `draft_files` |
| FR-055 | The **Outward No.** is pre-assigned at the time the user clicks **New** in Compose Outward (i.e. reserved immediately, before saving the draft) to prevent number conflicts. An officer cannot allocate a new Outward number if they already have an existing undispatched draft. |
| FR-056 | **Discard Draft**: soft-deletes the draft record; flags it in `pending_deletions` for Admin approval; draft file on disk is not deleted until Admin approves; draft is hidden from the table immediately after flagging |
| FR-057 | All users can see all drafts (no per-user filtering) |
| FR-057a | **Upload Existing Document to Draft**: User can upload an existing PDF or document file directly to drafts via an upload button, without going through the Compose Outward form. The file is stored in the Drafts directory structure. |
| FR-058 | **Edit Audit Log**: Every create, edit, lock, unlock, dispatch, or re-upload action on any register record (inward, outward, draft) is logged in an `edit_log` table with: `edited_by` (user ID), `edited_at` (timestamp), `changes` (JSONB diff of before/after), and `action` (create/edit/lock/unlock/dispatch/reupload). An "Edit History" button on each expanded row shows the log in a timeline-style popover. |
| FR-059 | **In-Browser Document Viewer**: Documents (PDF, DOCX) open in a full-screen modal viewer within the browser. PDFs use browser-native `<iframe>` rendering. DOCX files use the `docx-preview` library for layout-accurate rendering. Falls back to download link for unsupported formats. Applies to Inward Register (FR-083), Outward Register (FR-094), and Drafts view. |

---

### Module 5 — Log Inward *(formerly "Inward Entry")*

> This module allows users to log a new incoming document.

| FR ID | Requirement |
|---|---|
| FR-060 | The page shall have a **New** button; clicking it initialises a blank Log Inward form and auto-generates the next **Inward No.** |
| FR-061 | **Inward No.** — auto-generated; displayed as read-only; format `001`+ per year per Folder ID; shown prominently at top of form |
| FR-062 | **Date of Receipt** — date picker; default today |
| FR-063 | **Scanned Format** — dropdown label with three options: `Image (JPG / PNG / JPEG)`, `Document (DOC / DOCX)`, `PDF`; this is a descriptive label only (no functional trigger at this stage) |
| FR-064 | **File Upload Area** — a large, prominent dropzone at the bottom of the form with label *"Drop file here or click to browse"*; supports single file upload; clicking it opens the OS file picker; the uploaded file is stored to `IODMS/Inward/{Year}/{FolderID}/{NextSequentialNo}.{original_ext}` on Save |
| FR-065 | **Inward Letter Ref No.** — free text input; reference number printed on the incoming letter |
| FR-066 | **Letter Date** — date picker; date of the original incoming letter |
| FR-067 | **Received From** — dropdown from `received_from_list`; with an inline **Edit List** button beside it that opens a small panel to Add / Rename / Remove entries in `received_from_list` without navigating away |
| FR-068 | **Originated By** — dropdown from `originated_by_list`; same inline **Edit List** behaviour as Received From |
| FR-069 | **Subject** — free text input; no character limit |
| FR-070 | **Assign To** — multi-select dropdown of active User IDs; user may add multiple assignees using a **"+ Add"** button |
| FR-071 | **Folder ID** — dropdown from `folder_types.folder_id`; selecting auto-populates **Folder Name** |
| FR-072 | **Folder Name** — dropdown from `folder_types.folder_name`; selecting auto-populates **Folder ID**; bidirectional |
| FR-073 | **CC Sent To** — multi-select from `address_book`; show name in dropdown; supports multiple entries via **"+ Add CC"** |
| FR-074 | **Remarks** — free text input; no character limit |
| FR-075 | **Document Type** — dropdown: `Query`, `Snag`, `File` |
| FR-076 | **Status** — toggle: `Active` / `Not Active`; default `Active` |
| FR-077 | On **Save**: create record in `inward_register`; store uploaded file at computed path; show success confirmation |
| FR-078 | **Modify mode**: if a user opens an existing record from Inward Register for editing, this form opens pre-filled; **New** button is replaced by **Modify**; on save, the existing record is updated in place; display confirmation dialog before saving: *"You are about to modify Inward No. [XXX]. Do you want to continue?"* |

---

### Module 6 — Inward Register

| FR ID | Requirement |
|---|---|
| FR-080 | Display a paginated table with columns: **Inward No.**, **Date of Receipt**, **Inward Letter Ref No.**, **Letter Date**, **Received From**, **Subject**, **Originated By**, **Assign To**, **Folder ID**, **CC Sent To**, **Remarks**, **Document Type**, **Status** |
| FR-081 | **Year filter** — dropdown at top of page; filters entire table by year; defaults to current year; includes an "All Years" option to search across all years (FR-173) |
| FR-082 | **Search bar** — filters rows by: Assign To (dropdown of User IDs), Received From (text), Originated By (text), Subject (text); search is live/on-change |
| FR-083 | **In-Browser File View**: Inward attachments open in a full-screen in-browser viewer modal (PDF via `<iframe>`, DOCX via `docx-preview` library) instead of downloading to a new tab. |
| FR-084 | **Delete** — users may flag a record for deletion; it is added to `pending_deletions` and greyed out in the table with a "Pending Deletion" badge until Admin approves or rejects. If Admin approves, the physical file is deleted, but the record is kept with status 'Permanently Deleted' to ensure the number is permanently lost and never reused. These lost numbers appear in a separate Admin panel tab. |
| FR-170 | **Multiple File Upload**: Inward Register supports uploading multiple files (e.g., both .ppt and .doc) for a single record. Files are stored as an array of paths. |
| FR-171 | **Document Linking**: Users can link related documents across registers (Inward to Outward, Inward to Inward, etc.). Linked documents display as clickable chips on the record details. |

---

### Module 7 — Outward Register

| FR ID | Requirement |
|---|---|
| FR-090 | Display a paginated table with columns: **Outward No.**, **Folder ID**, **Folder Name**, **Issuing Date**, **Address To**, **CC To**, **Subject**, **Remarks**, **Prepared By** |
| FR-091 | **Address To** and **CC To** columns display all entries in a single cell (comma-separated names); no expand required |
| FR-092 | **Year filter** — dropdown; defaults to current year; includes an "All Years" option to search across all years (FR-173) |
| FR-093 | **Search** — filter by: Folder ID (dropdown), Prepared By (dropdown of User IDs), Address To (text), Subject (text) |
| FR-094 | **In-Browser Document View**: Outward documents open in a full-screen in-browser viewer modal instead of downloading. |
| FR-095 | **Delete** — same soft-delete/pending flow and permanent loss rules as Inward Register |
| FR-170b| **Multiple File Upload**: Outward Register and Drafts support multiple file uploads for a single record. |
| FR-171b| **Document Linking**: Outward Register supports linking to Inward and other Outward documents. |

---

### Module 8 — Address Book

| FR ID | Requirement |
|---|---|
| FR-100 | Display a paginated table with columns: **Address ID**, **Name**, **Designation**, **Organisation**, **Address Line 1**, **Address Line 2**, **Fax No.**, **Email**, **Address Group** |
| FR-101 | **Search** — filter by Name, Designation, Organisation, Fax No., Email; a dropdown selector lets the user choose which field to search, followed by a text input |
| FR-102 | **Add New Entry** button opens an inline form or side panel with fields: Name (text), Designation (text), Organisation (text), Address Line 1 (text), Address Line 2 (text), Fax No. (text), Email (text), Address Group (dropdown from `address_groups`) |
| FR-103 | **Address ID** is auto-generated by the database on insert |
| FR-104 | Clicking a row reveals **Edit** and **Delete** options; Delete follows the soft-delete/pending flow |
| FR-105 | **Address Groups** are managed in the Admin Panel; the dropdown here is read-only (not editable inline) |

---

### Module 9 — Admin Panel

> Accessible only to users with role = Admin.

#### 9A — User Management

| FR ID | Requirement |
|---|---|
| FR-110 | Display a table of all users with columns: **User ID**, **PB No.**, **Name**, **DOB**, **Role**, **Status (Active/Inactive)** |
| FR-111 | **Add New User**: form with fields — PB No. (text, unique), User ID (text, unique), Name (text), DOB (date picker), Role (dropdown: User / Admin), Password (set by Admin) |
| FR-112 | **Edit User**: Admin may edit any field for any user directly |
| FR-113 | **Activate / Deactivate**: toggle user account status |
| FR-114 | **Reset Password**: Admin may set a new password for any user |
| FR-115 | **Delete User (Soft Delete)**: Admin can delete a user account. The user record is marked `is_deleted = true` with `deleted_at` timestamp and `deleted_by` (admin user ID). Deleted users cannot log in. All their existing inward/outward records are preserved. |
| FR-116 | **Deleted Accounts View**: A new tab "Deleted Accounts" in the Admin Panel displays all soft-deleted users with columns: User ID, Name, Role, Deleted On, Deleted By. Admin may **Restore** (set `is_deleted = false`) or **Permanently Delete** (remove record entirely). |

#### 9B — Pending Approvals — Deletion Requests

| FR ID | Requirement |
|---|---|
| FR-120 | Dedicated page listing all records in `pending_deletions` with columns: **Source Table**, **Record ID**, **Requested By**, **Requested On** |
| FR-121 | Admin may **Approve** (permanently delete the record and file on disk) or **Reject** (restore the record to normal visibility, remove the "Pending Deletion" badge) each item |

#### 9C — Pending Approvals — Profile Edit Requests

| FR ID | Requirement |
|---|---|
| FR-125 | Dedicated page listing all records in `pending_profile_edits` with columns: **User ID**, **Proposed Changes** (field-by-field diff), **Requested On** |
| FR-126 | Admin may **Approve** (apply changes to `users` table) or **Reject** (discard proposed changes) |

#### 9D — Master List Management

| FR ID | Requirement |
|---|---|
| FR-130 | Admin can view, add, rename, and delete entries in `folder_types` (Folder ID + Folder Name); renaming a Folder ID renames the corresponding physical folder on disk automatically |
| FR-131 | Admin can view, add, rename, and delete entries in `address_groups` |
| FR-132 | Admin can view, add, rename, and delete entries in `received_from_list` |
| FR-133 | Admin can view, add, rename, and delete entries in `originated_by_list` |

#### 9E — System Settings

| FR ID | Requirement |
|---|---|
| FR-140 | **IODMS Root Path**: Admin may view and update the base filesystem path where the IODMS folder is located (to support server migrations); changing this path updates all future file read/write operations |
| FR-141 | **New Year Cutover**: the system automatically resets sequential numbering on January 1 and creates the new `{Year}` subfolder structure; Admin may manually override the cutover date if needed |
| FR-142 | **Direct Database Access**: a clearly labelled button **"Open in DBeaver"** launches DBeaver (must be pre-installed on the server machine); no embedded DB editor is provided within the application |
| FR-143 | **Template Management**: Admin can upload, view, and delete document templates (.docx files) from a "Templates" tab in the Admin Panel. Each template has a name and type (General/Confidential/Secret). When a user composes an outward document, the selected template determines the base document structure used for draft generation. |
| FR-144 | **Previous Year Document Entry**: Admin can create inward or outward records for a previous year from the System Settings. A year selector dropdown allows choosing the target year. The inward/outward number continues sequentially from the last number of that year's records. Files are stored in the selected year's folder structure (e.g., `Inward/2024/Su-30/`). |
| FR-172 | **IP Address Configuration**: Admin Panel contains a "Security Settings" tab allowing Admin to whitelist/allow specific IP addresses or subnets. Logins from unapproved IPs are blocked. |

---

### Module 10 — My Profile

| FR ID | Requirement |
|---|---|
| FR-150 | Any logged-in user may view their own profile details: User ID, Name, DOB, Role |
| FR-151 | User may edit their own Name and DOB; on submitting changes, a record is created in `pending_profile_edits`; existing profile details remain unchanged and visible until Admin approves |
| FR-152 | A small **"Change Pending Approval"** flag/badge is displayed next to the edited fields until the Admin acts on the request |
| FR-153 | User may submit a new profile edit even while a previous edit is pending (the new request overwrites the previous pending entry) |
| FR-154 | **Change Password**: user may change their own password by entering current password + new password + confirm new password; takes effect immediately without Admin approval |

---

## Non-Functional Requirements

| NFR ID | Category | Requirement |
|---|---|---|
| NFR-001 | Security | System operates exclusively on air-gapped LAN; no internet calls shall be made at any point; compliant with Official Secrets Act, 1923 |
| NFR-002 | Security | All passwords stored as bcrypt hashes; plaintext passwords never stored or logged |
| NFR-003 | Security | No session timeout enforced (LAN environment; trusted officers) |
| NFR-004 | Security | Deletion of any data record requires Admin approval; no user may permanently delete any record unilaterally |
| NFR-005 | Performance | Query response for any register view or search shall complete within 3 seconds for datasets of 50,000+ records |
| NFR-006 | Performance | System shall support 30 registered users with up to 10 concurrent sessions without degradation |
| NFR-007 | Reliability | Daily automated database backup; 99% uptime during office hours |
| NFR-008 | Compatibility | System shall be fully functional on Chromium-based browsers (Google Chrome, Microsoft Edge, Opera) as the exclusive supported client runtime; Firefox, Safari, and Internet Explorer are explicitly out of scope |
| NFR-009 | Compatibility | The minimum supported Chromium engine version is **Chromium 109** (the final release supporting Windows 7 and Windows 8.1, January 2023); all frontend code shall be compatible with this baseline without polyfills or transpilation workarounds |
| NFR-010 | Portability | The frontend shall avoid use of any JavaScript or CSS features introduced after Chromium 109 |
| NFR-011 | Maintainability | All frontend and backend software dependencies shall be version-pinned (exact versions, no floating/wildcard ranges) at initial deployment |
| NFR-012 | Maintainability | Codebase shall use the **minimum number of source files** (files may be long; avoid fragmentation); each file shall be heavily commented; maintainable by a single developer |
| NFR-013 | Maintainability | All development is AI-reliant; this requirements document is the single source of truth; AI shall not make assumptions beyond what is stated here |
| NFR-014 | Offline Operability | The system shall be fully installable, buildable, and operable without internet connectivity; all dependencies shall be pre-downloaded and transferred via USB removable media into the air-gapped environment |
| NFR-015 | Scalability | Database schema and file numbering scheme shall support at minimum 20 years of records (2006–2026 legacy + ongoing) |
| NFR-016 | Migration | One-time migration of 5 legacy XLSX tables (`inward_register`, `outward_register`, `address_book`, `draft_files`, `outward` as available) into PostgreSQL; ~5000+ scanned documents migrated into the new IODMS folder structure |
| NFR-017 | Packaging | On-demand desktop packaging via Electron (or equivalent) from the same React codebase is a future-scope item; defer to the final phase |

---

## External Interface Requirements

| EIR ID | Requirement |
|---|---|
| EIR-001 | The system's frontend shall interface with client machines exclusively through Chromium-based web browsers; no non-Chromium browser support is required |
| EIR-002 | The system shall not make any live internet calls during operation; all data exchange with the development/build environment shall occur via offline removable storage (USB) |
| EIR-003 | The shared IODMS folder shall be accessible from all client machines via a LAN network share; for the current development/standalone phase, it shall be a local folder path configurable by Admin |
| EIR-004 | MS Word is the primary document editor. Users download `.doc`/`.docx` files via the system, edit in their locally installed MS Word, and re-upload the edited file through the application's re-upload interface. No in-browser document editing is provided; the system provides in-browser document viewing only. |
| EIR-005 | DBeaver shall be pre-installed on the server machine; the Admin Panel provides a launch button only — no embedded database UI is built into the application |
| EIR-006 | Scanner integration is out of scope for the current phase; file upload is via manual browse/drag-drop only |

---

## RBAC Summary

| Feature / Action | User | Admin | Auditor (No Login) |
|---|---|---|---|
| Login | ✅ | ✅ | ❌ |
| View Inward & Outward Register | ✅ | ✅ | ✅ (read-only, watermarked) |
| Compose Outward (New Draft) | ✅ | ✅ | ❌ |
| Drafts & Dispatch (view/edit/dispatch) | ✅ | ✅ | ❌ |
| Discard Draft | ✅ | ✅ | ❌ |
| Log Inward (New / Modify) | ✅ | ✅ | ❌ |
| Edit any register record | ✅ | ✅ | ❌ |
| Request deletion (flag) | ✅ | ✅ | ❌ |
| Approve / Reject deletions | ❌ | ✅ | ❌ |
| Approve / Reject profile edits | ❌ | ✅ | ❌ |
| Address Book (view / add / edit) | ✅ | ✅ | ❌ |
| My Profile (view / edit) | ✅ | ✅ | ❌ |
| Admin Panel (all sub-modules) | ❌ | ✅ | ❌ |
| Prepared By = any user (on-behalf-of) | ✅ | ✅ | ❌ |

---

## Open Items / Future Scope

| ID | Item | Notes |
|---|---|---|
| FS-001 | Desktop packaging | Electron or equivalent; defer to final phase |
| FS-002 | Scanner SDK integration | Direct scan-to-upload from connected scanner; specs TBD |
| FS-003 | Template configuration | **MOVED TO ACTIVE — see FR-143** |
| FS-004 | IODMS folder migration tool | Admin-triggered bulk move of IODMS folder to new server path with automatic path update |
| FS-005 | Multi-file inward attachments | Currently one file per inward record; multi-attachment support deferred |

---

*Document Version: 2.0 | Last Updated: June 2026 | Status: Requirements Complete — Ready for SRS Conversion*
