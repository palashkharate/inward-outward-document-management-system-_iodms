# Offline Deployment Guide (Airgapped Server)
**Target OS:** Windows Server 2012 (or later)
**Network:** Offline / Airgapped
**Architecture:** Unified FastAPI Server (Serves Backend + Pre-built React Frontend)

This guide provides instructions for deploying the IODMS application to a server with **zero internet access**.

---

## Prerequisites
Before you begin, ensure you have the following installed on the target Windows Server:
1. **Python 3.9+** (Must be added to the Windows PATH during installation).
2. **PostgreSQL 14+** (Ensure the PostgreSQL service is running and the credentials match the `DATABASE_URL` in your `.env` file).
3. The IODMS Source Code folder.
4. The `iodms_offline_bundle` folder (provided by the dev team).

> [!CAUTION]
> Do **NOT** install Node.js. It is not required for production. The frontend has already been pre-compiled into static HTML/JS files in the `frontend/dist/` directory, which Python will serve.

---

## Step 1: Install Python Dependencies Offline

1. Copy the `iodms_offline_bundle` folder onto the Windows Server desktop (or any directory).
2. Open the folder.
3. Double-click the `install_offline.bat` file.
   - *What it does:* This script tells `pip` to ignore the internet and install the required modules directly from the `.whl` files inside the `backend_wheels` folder.
4. Verify that the script outputs: `SUCCESS: All dependencies installed successfully!`

---

## Step 2: Configure the Environment

1. Inside the root of your IODMS source code folder, create a `.env` file (if it doesn't already exist).
2. Set your environment variables:
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/iodms_db
SECRET_KEY=your_secure_random_string_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=720
```

---

## Step 3: Run Database Migrations

Before starting the server, you must initialize the database tables.

1. Open **Command Prompt** (`cmd.exe`).
2. Navigate to the `backend` folder inside your IODMS code:
   ```cmd
   cd C:\path\to\inword_outword_folder\backend
   ```
3. Run the setup script to create tables and the default admin user:
   ```cmd
   python setup_db.py
   ```
   *(Assuming `setup_db.py` handles your SQLAlchemy `Base.metadata.create_all(bind=engine)` logic)*

---

## Step 4: Start the Server

1. From the root `inword_outword_folder` directory, run:
   ```cmd
   uvicorn backend.main:app --host 0.0.0.0 --port 80
   ```
2. The server is now running! 
3. Open a web browser on any machine connected to the same LAN and navigate to the server's IP address (e.g., `http://192.168.1.50`).

> [!TIP]
> **Running as a Background Service**
> Because this is a Windows Server, you shouldn't leave a command prompt open forever. You can use a tool like **NSSM (Non-Sucking Service Manager)** to install Uvicorn as a permanent background Windows Service that starts automatically when the server boots.

---

## Step 5: Configure the LAN Path (Optional but Recommended)

For the "Open in Word" feature to work across the network:
1. Log in to the IODMS web interface as an Admin.
2. Go to the **Admin Panel** -> **System Settings**.
3. Under **LAN Shared IODMS Path**, enter the network share path to the IODMS root directory (e.g., `\\192.168.1.50\IODMS_DATA`).
4. Click **Save Settings**. 

Now, when users click "Open in Word", Microsoft Word will directly fetch the document from the shared network drive.
