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
| **Admin** | `admin1` | `admin123` |
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

---
---

## 🐳 Docker Deployment for Air-Gapped LAN (Windows Server)

If your company's air-gapped server does not have Python or Node.js installed (or is running an older Windows Server), **Docker** is the recommended deployment method. Docker packages the entire system into portable containers.

### 1. Preparation on an Internet-Connected PC
1. Build the Docker images:
   ```bash
   docker-compose build
   ```
2. Save the images to `.tar` files:
   ```bash
   docker save -o iodms-frontend.tar iodms-frontend:latest
   docker save -o iodms-backend.tar iodms-backend:latest
   docker save -o postgres-15.tar postgres:15
   ```
3. Copy these `.tar` files, `docker-compose.yml`, and `backend/seed.py` to a USB drive.

### 2. Setup on the Offline Windows Server
*Ensure Docker Desktop is installed on the offline Windows Server.*
1. Create a folder (e.g., `C:\IODMS`) and copy the USB files into it.
2. Load the Docker images from the `.tar` files:
   ```bash
   docker load -i iodms-frontend.tar
   docker load -i iodms-backend.tar
   docker load -i postgres-15.tar
   ```
3. Start the system:
   ```bash
   cd C:\IODMS
   docker-compose up -d
   ```
4. Seed the database (first time only):
   ```bash
   docker-compose exec backend python seed.py
   ```

### 3. Connecting to the LAN from Officer PCs
Once the system is running on the central Windows Server via Docker, officers on the same Local Area Network (LAN) can access it through their web browsers.

1. **Find the Server's IP Address:**
   On the Windows Server, open Command Prompt and type `ipconfig`. Look for the "IPv4 Address" (e.g., `192.168.1.100`).
2. **Access from Officer PCs:**
   - Open Google Chrome (v109+ supports Windows 7) or Mozilla Firefox on any officer's PC on the LAN.
   - Enter the server's IP address in the URL bar: `http://192.168.1.100` (Port 80 is the default).
3. **Windows Firewall (If Connection Fails):**
   If officers cannot access the page, the Windows Server Firewall might be blocking Port 80.
   - Open **Windows Defender Firewall with Advanced Security** on the server.
   - Click **Inbound Rules** -> **New Rule...**
   - Choose **Port** -> **TCP** -> Specific local ports: `80`
   - Allow the connection and name it `IODMS Web Server (Port 80)`.
