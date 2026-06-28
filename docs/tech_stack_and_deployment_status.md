# IODMS Technical Overview & Deployment Status

This document explains the technical architecture of the **Inward Outward Document Management System (IODMS)**, its current implementation status, and considerations for deploying it in the company's offline network.

## 1. Technology Stack

The system is built using a modern, decoupled architecture:

*   **Frontend (User Interface):** 
    *   **React 18** (JavaScript Library for building UI)
    *   **Vite** (Next-generation, ultra-fast build tool)
    *   **Material-UI (MUI)** (Professional component library providing the "Aviation Cockpit Slate Blue" theme)
    *   *Why this stack?* It creates a highly responsive, "wow-factor" single-page application (SPA) that runs entirely in the user's browser without reloading the page.
*   **Backend (API & Logic):** 
    *   **Python 3.14**
    *   **FastAPI** (High-performance web framework for building APIs)
    *   **SQLAlchemy** (Object Relational Mapper to talk to the database)
    *   *Why this stack?* FastAPI is incredibly fast and provides automatic validation of all data coming from the frontend.
*   **Database:** 
    *   **PostgreSQL** (Enterprise-grade relational database)
    *   *Why this stack?* Robust, secure, and capable of handling high volumes of document logs.
*   **Deployment Mechanism (Planned):**
    *   **Docker & Docker Compose** to run the backend and frontend seamlessly on a computer without Python installed.

---

## 2. Windows 7 Client Compatibility

You mentioned some officers have Windows 7 PCs. 

**Will the website open on Windows 7?**
*   **YES, but with conditions:** The React frontend requires a modern browser. 
*   **Supported Browsers on Windows 7:** Google Chrome (up to version 109) or Mozilla Firefox (up to version 115 ESR). The website will run perfectly on these.
*   **UNSUPPORTED:** Internet Explorer 11 (IE11) is completely unsupported by modern React and Vite. If officers try to open it in IE11, they will see a blank screen. Please ensure they use Chrome or Firefox.

---

## 3. Server Requirements (Microsoft Server)

You asked if "Microsoft Server" is required.
*   **No, Windows Server is not strictly required.** The system can run on a standard Windows 10/11 Pro machine, a Windows Server (2016/2019/2022), or Linux. 
*   Because you have **Docker** installed on the offline PC, Docker will create isolated "containers" that run Linux environments inside your Windows machine. This means the server PC does not need Python, Node.js, or any complex setups installed natively. Docker will handle everything internally.

---

## 4. What Is Implemented So Far

*   **Authentication & Roles:** Admin, Officer, and Auditor roles with JWT secure login.
*   **Inward Register:** Full logging, auto-generating Inward Numbers (e.g., F01-2026-001), document upload, and modifying entries.
*   **Outward Register:** Dispatching documents, handling single vs. multiple addresses, generating dispatch slips, and marking pending deliveries.
*   **Admin Panel:** Managing Users, Folder Types, Address Book, and approving permanent file deletions (Soft Delete mechanism).
*   **Auditor View:** Specialized read-only dashboard with watermarks, disabled right-click, and text-selection disabled to prevent data theft.
*   **Database Seeding:** Automatic creation of master lists (IAF, BEL, Aircraft folders, etc.).

---

## 5. What Is NOT Implemented (Pending / Future Scope)

Based on the original requirements, the following features are not yet fully implemented or may need future expansion:
1.  **Email / SMS Notifications:** The system currently does not send actual emails or SMS when an inward document is assigned to an officer. This requires an internal SMTP server which is likely unavailable on an air-gapped network anyway.
2.  **Advanced Optical Character Recognition (OCR):** The system stores scanned PDFs/Images but does not read the text *inside* the images to make them searchable.
3.  **Active Directory (LDAP) Integration:** Users currently log in using accounts created within the app. It is not tied to the company's Windows Active Directory domain logins.
4.  **Automated Daily Backups:** A script to automatically backup the PostgreSQL database and the `IODMS_DATA` folder every night needs to be configured on the host machine.
5.  **Multi-Node Scaling:** Currently designed to run on a single server machine.

---

## Next Steps for Offline Deployment

Since the target PC has **Docker** and no Python, the next phase is to write the `Dockerfile` for the frontend and backend, and a `docker-compose.yml` file to orchestrate them. This will allow you to package the entire app into a single bundle, copy it via USB, and run one command (`docker-compose up`) to start everything offline.
