# IODMS Code & Folder Hygiene Guide
## A beginner's guide to understanding the project structure and writing clean code

Yes, **folder hygiene and code hygiene are present** in this project and are actively being maintained. The project is structured clearly into distinct frontend and backend layers, with logic separated into modules.

This guide explains how the project is organized and sets the standard for how new code should be written.

---

## 1. Folder Structure (Folder Hygiene)

A good folder structure ensures you know exactly where to find things and where to put new things. The IODMS project uses a decoupled **Client-Server Architecture**.

```text
IODMS/
│
├── backend/                  # The FastAPI Server (Python)
│   ├── main.py               # The entry point of the server
│   ├── database.py           # Database connection setup
│   ├── models.py             # Defines the PostgreSQL database tables
│   ├── filesystem_utils.py   # Helper functions for managing PDF files and folders
│   ├── requirements.txt      # Python dependencies
│   └── routers/              # The API endpoints divided by module
│       ├── admin.py
│       ├── auth.py
│       ├── inward.py
│       ├── outward.py
│       └── auditor.py
│
├── frontend/                 # The React UI (JavaScript)
│   ├── package.json          # Node dependencies
│   ├── vite.config.js        # Vite bundler configuration
│   └── src/                  # All React code lives here
│       ├── main.jsx          # Mounts the React app
│       ├── App.jsx           # Handles routing and global Theme (Color Philosophy)
│       ├── index.css         # Global CSS styles
│       └── pages/            # Individual screens and modules
│           ├── LoginPage.jsx
│           ├── DashboardPage.jsx
│           ├── InwardRegisterPage.jsx
│           ├── ...
│
└── docs/                     # Project Documentation
    ├── IODMS_requirements_context.md
    ├── color_philosophy.md
    └── code_hygiene_guide.md (This file)
```

### Why is this good hygiene?
- **Separation of Concerns**: The frontend (`React`) knows nothing about the database, and the backend (`Python`) knows nothing about the UI. They communicate exclusively via API calls.
- **Modular Routers**: Instead of one massive `main.py` with 100 API endpoints, they are logically grouped in the `routers/` folder.
- **Modular Pages**: Instead of one giant UI file, every screen is its own `.jsx` component in the `pages/` folder.

---

## 2. Code Writing Format (Code Hygiene)

When writing or modifying code in this project, follow these standards to ensure it remains easy for future developers (and yourself) to read.

### Rule 1: Always Reference Requirements (Traceability)
Every major function or component must mention the Requirement ID (FR-XXX) it is fulfilling. This is the **most important** rule in this project.
```python
# GOOD
# FR-140: Read IODMS Root Path from settings
def get_iodms_settings():
    ...

# BAD
def get_path():
    ...
```

### Rule 2: DRY (Don't Repeat Yourself)
If you find yourself copy-pasting the same logic in three different files, extract it into a utility function. 
*Example:* We moved all path-joining logic into `backend/filesystem_utils.py` instead of rewriting `os.path.join(...)` in both Inward and Outward modules.

### Rule 3: Naming Conventions
- **Python Variables & Functions**: `snake_case` (e.g., `get_user_profile`, `inward_no`).
- **Python Classes (Models)**: `PascalCase` (e.g., `InwardRegister`, `AddressBook`).
- **React Components**: `PascalCase` (e.g., `DashboardPage.jsx`, `AdminPage`).
- **React Variables & Functions**: `camelCase` (e.g., `fetchUsers`, `isModalOpen`).

### Rule 4: Clear Variable Names
Avoid abbreviations that are difficult to understand.
```javascript
// GOOD
const inwardDocumentNumber = "INW-2026";
const [usersList, setUsersList] = useState([]);

// BAD
const docNo = "INW-2026";
const [u, setU] = useState([]);
```

### Rule 5: Keep Components and Functions Small
- A Python function should ideally do **one** thing. If it validates a user, uploads a file, and saves to the database, consider splitting those into three smaller steps.
- If a React component in `pages/` starts exceeding 500 lines, see if you can break tables or modals out into smaller sub-components.

---

## 3. UI and Styling Hygiene (Color Philosophy)
- Do not write random inline colors like `style={{ color: 'red' }}`. 
- Use the central Theme defined in `frontend/src/App.jsx`.
- When building a module, ensure its UI adheres strictly to the **Color Philosophy Document** (e.g., Inspector Red for Auditors, Sky Blue for Inward).

---

## Conclusion
Code hygiene is like a kitchen. If you leave dirty dishes everywhere (messy code, unused variables, zero comments), the next person trying to cook (code) is going to struggle. By following this guide, we ensure that the IODMS codebase remains a clean, professional, and defence-grade environment.
