# IODMS Technical Overview & Deployment Status

This document explains the technical architecture of the **Inward Outward Document Management System (IODMS)**, its current implementation status, and considerations for deploying it in the company's offline network.

## 1. Technology Stack

The system is built using a modern, decoupled architecture running behind a unified server:

*   **Frontend (User Interface):** 
    *   **React 18** (JavaScript Library for building UI)
    *   **Vite** (Next-generation, ultra-fast build tool)
    *   **Material-UI (MUI)** (Professional component library providing the "Aviation Cockpit Slate Blue" theme)
    *   *Note:* The frontend is pre-compiled into static HTML/JS files (`frontend/dist/`), requiring no Node.js on the production server.
*   **Backend (API & Logic):** 
    *   **Python 3.9+**
    *   **FastAPI** (High-performance web framework serving both the API and the React frontend)
    *   **SQLAlchemy** (Object Relational Mapper)
*   **Database:** 
    *   **PostgreSQL 14+** (Enterprise-grade relational database)
*   **Deployment Mechanism:**
    *   **Unified Port 80 Architecture:** The system runs on a single Python Uvicorn server on port 80.
    *   **Airgapped Offline Bundle:** All Python dependencies are pre-downloaded as `.whl` binaries in the `iodms_offline_bundle`, allowing installation on disconnected military/defense servers.

---

## 2. Windows Client Compatibility

**Will the website open on Windows 7?**
*   **YES, but with conditions:** The React frontend requires a modern browser. 
*   **Supported Browsers on Windows 7:** Google Chrome (up to version 109) or Mozilla Firefox (up to version 115 ESR). The website will run perfectly on these.
*   **MS Word Integration:** The system uses the `ms-word:` protocol to launch documents directly into the client's Microsoft Word over the LAN. This requires MS Office to be installed on the client PC.

---

## 3. Server Requirements (Windows Server 2012)

*   **Server Setup:** The system is explicitly configured to run on Windows Server 2012 (or newer).
*   **Dependencies:** Only Python and PostgreSQL need to be installed on the server. Node.js and Docker are **NOT** required.
*   **Network:** The server must expose port 80 and port 5432 (Postgres) internally, and the `IODMS_DATA` folder must be shared over the LAN via SMB/CIFS for the Word integration to function.

---

## 4. What Is Implemented So Far

*   **Authentication & Roles:** Admin, Officer, and Auditor roles with JWT secure login.
*   **Inward Register:** Full logging, auto-generating Inward Numbers.
*   **Outward Register & Drafts:** Complex draft creation with Word Templates, real-time concurrency locking, and a Word-like Online Document Editor.
*   **Direct Word Editing:** Documents can be opened directly in Microsoft Word over the LAN from the browser.
*   **Admin Panel:** Managing Users, Folder Types, Address Book, Templates, and LAN path overrides.
*   **Auditor View:** Specialized read-only dashboard with watermarks.

---

## 5. What Is NOT Implemented (Pending / Future Scope)

1.  **Email / SMS Notifications:** The system currently does not send actual emails or SMS when an inward document is assigned (air-gapped limitation).
2.  **Advanced Optical Character Recognition (OCR):** The system stores scanned PDFs/Images but does not parse text *inside* the images.
3.  **Active Directory (LDAP) Integration:** Users currently log in using accounts created within the app.
4.  **Automated Daily Backups:** Must be set up by the Windows Admin (e.g., using Task Scheduler).

---

## Next Steps for Production
Please refer to the `docs/Offline_Deployment_Guide.md` and `docs/IV_and_V_Report.md` for final handover and staging.
