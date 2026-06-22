# IODMS - Inward Outward Document Management System

Welcome to the **Inward Outward Document Management System (IODMS)**! This application provides a robust, user-friendly interface to manage incoming and outgoing official documents securely.

Built specifically for a controlled, air-gapped environment, it features an elegant Material-UI frontend and a powerful FastAPI backend running on PostgreSQL.

---

## 🛠 Prerequisites

Since this application is designed for an air-gapped system, ensure you have the following installed manually on your Windows machine before starting:
1. **Python 3.14+** (Install via official Python installer)
2. **Node.js v18+** (Install via official Node.js MSI installer)
3. **PostgreSQL 16+** (Install via EnterpriseDB Windows installer)
4. **`uv` Package Manager** (Fast Python package manager)

---

## 🚀 Setting Up the Database (PostgreSQL)

Before running the backend, you must create the PostgreSQL database.

1. Open **pgAdmin** or the **psql** command-line tool (installed with PostgreSQL).
2. Connect to your local PostgreSQL server (usually `localhost:5432` with username `postgres`).
3. Run the following SQL command to create the database:
   ```sql
   CREATE DATABASE iodms_db;
   ```
4. Update the database credentials: If you set a different password during PostgreSQL installation, update the `DATABASE_URL` in `backend/database.py`.

---

## ⚙️ Backend Setup

The backend uses Python and FastAPI. We use `uv` to manage the virtual environment.

1. Open your terminal (PowerShell or Command Prompt).
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```
3. Run `uv` to create a virtual environment and install the dependencies:
   ```bash
   uv venv
   uv pip install -r requirements.txt
   ```
4. Initialize the database and populate it with seed data (folders, users, permissions):
   ```bash
   uv run python main.py
   uv run python seed.py
   ```
5. Start the backend server:
   ```bash
   uv run uvicorn main:app --reload
   ```
   *The backend should now be running at `http://127.0.0.1:8000`.*

---

## 🎨 Frontend Setup

The frontend is built with React, Vite, and Material-UI.

1. Open a **new** terminal window.
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
3. Install the Node.js dependencies:
   ```bash
   npm install
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend should now be running at `http://localhost:3000`.*

---

## 🔑 Login Credentials

Once both servers are running, open your web browser and go to `http://localhost:3000`. You can log in using the following seeded accounts:

| Role | Username | Password |
|------|----------|----------|
| **Admin** | `admin1 | `admin123` |
| **Officer** | `officer1` | `officer123` |

*(Note: Auditor view is read-only and features screen-capture protections).*

---

## ✅ Verification & Daily Usage

To verify the installation:
- Login as `admin` to view the Dashboard and ensure folders exist.
- Login as `officer1` and try logging a new Inward document.
- Inward documents and Outward drafts will automatically create subfolders in the `Inward/` and `Drafts/` directories inside the project root.

**Troubleshooting:**
- If you see database connection errors, ensure the PostgreSQL service is running in Windows Services (`services.msc`) and the password matches.
- If the frontend fails to fetch data, ensure the backend terminal is running without errors.

Enjoy managing your documents effortlessly!
