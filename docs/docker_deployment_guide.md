# IODMS Docker Deployment Guide
## A Complete Beginner-Friendly Guide to Packaging and Deploying on an Offline Computer

---

## Table of Contents
1. [What Problem Are We Solving?](#1-what-problem-are-we-solving)
2. [What is Docker and Why Do We Need It?](#2-what-is-docker-and-why-do-we-need-it)
3. [Architecture Overview: How the Pieces Connect](#3-architecture-overview-how-the-pieces-connect)
4. [The Three Docker Containers We Will Create](#4-the-three-docker-containers-we-will-create)
5. [What is docker-compose.yml?](#5-what-is-docker-composeyml)
6. [Step-by-Step: Building on Your Internet PC](#6-step-by-step-building-on-your-internet-pc)
7. [Step-by-Step: Transferring to USB](#7-step-by-step-transferring-to-usb)
8. [Step-by-Step: Loading on the Offline Company PC](#8-step-by-step-loading-on-the-offline-company-pc)
9. [Day-to-Day Operations](#9-day-to-day-operations)
10. [Updating the App in the Future](#10-updating-the-app-in-the-future)
11. [Troubleshooting FAQ](#11-troubleshooting-faq)

---

## 1. What Problem Are We Solving?

Our IODMS application needs **three things** to run:
- **Python** (to run the backend FastAPI server)
- **Node.js** (to build the React frontend into static files)
- **PostgreSQL** (the database where all records are stored)

The company's offline PC has **none of these installed**, and because it has no internet, we cannot download them. But the PC **does have Docker installed**.

Docker solves this perfectly: it lets us package Python, Node.js, PostgreSQL, and our code into self-contained "boxes" (called **containers**) that can run anywhere Docker exists — without installing anything else.

---

## 2. What is Docker and Why Do We Need It?

Think of Docker like a **shipping container** in real life:

```
┌─────────────────────────────────────────────────────────┐
│  SHIPPING CONTAINER (Docker Container)                  │
│                                                         │
│  Inside this box:                                       │
│  ✅ Python 3.12 (pre-installed)                         │
│  ✅ All Python libraries (FastAPI, SQLAlchemy, etc.)    │
│  ✅ Our backend code (main.py, models.py, routers/)     │
│  ✅ Everything configured and ready to run              │
│                                                         │
│  The computer outside doesn't need Python at all!       │
│  Docker runs this box in isolation.                     │
└─────────────────────────────────────────────────────────┘
```

**Key concepts explained simply:**

| Docker Term     | Real-World Analogy | Explanation |
|:----------------|:-------------------|:------------|
| **Image**       | A blueprint/recipe | A read-only template that contains the OS, code, and dependencies. Like a frozen snapshot. |
| **Container**   | A running machine built from the blueprint | A live, running instance of an Image. You can start, stop, and restart it. |
| **Dockerfile**  | A recipe card | A text file with step-by-step instructions telling Docker how to build an Image. |
| **docker-compose.yml** | A project plan | A file that says "run these 3 containers together and connect them to each other." |
| **Volume**      | An external hard drive plugged into the container | A folder on the real PC that the container can read/write to. Data here survives even if the container is deleted. |

---

## 3. Architecture Overview: How the Pieces Connect

Here is how the system works when deployed with Docker:

```
   Officer's PC (Windows 7/10/11)                    Server PC (with Docker)
   ┌──────────────────────┐                ┌──────────────────────────────────────┐
   │                      │                │                                      │
   │  Chrome / Firefox    │   HTTP Request  │  ┌──────────────────────────────┐    │
   │  Browser             │ ──────────────▶│  │  CONTAINER 1: Frontend       │    │
   │                      │                │  │  (Nginx web server)          │    │
   │  Opens:              │                │  │  Serves React HTML/JS/CSS    │    │
   │  http://server-ip    │◀────────────── │  │  on Port 80                  │    │
   │                      │   HTML Response │  │                              │    │
   └──────────────────────┘                │  │  If URL starts with /api →   │    │
                                           │  │  forwards to Container 2     │    │
                                           │  └──────────┬───────────────────┘    │
                                           │             │ /api/* requests        │
                                           │             ▼                        │
                                           │  ┌──────────────────────────────┐    │
                                           │  │  CONTAINER 2: Backend        │    │
                                           │  │  (Python + FastAPI)          │    │
                                           │  │  Runs on Port 8000           │    │
                                           │  │  Handles login, saving       │    │
                                           │  │  documents, reading DB       │    │
                                           │  └──────────┬───────────────────┘    │
                                           │             │ SQL queries            │
                                           │             ▼                        │
                                           │  ┌──────────────────────────────┐    │
                                           │  │  CONTAINER 3: Database       │    │
                                           │  │  (PostgreSQL 15)             │    │
                                           │  │  Runs on Port 5432           │    │
                                           │  │  Stores all records          │    │
                                           │  └──────────────────────────────┘    │
                                           │                                      │
                                           │  📁 VOLUMES (Real folders on disk):  │
                                           │  • C:\iodms\db_data\ (DB files)     │
                                           │  • C:\iodms\uploads\ (PDFs/scans)   │
                                           │  • C:\iodms\settings\ (config)      │
                                           └──────────────────────────────────────┘
```

**Why 3 containers instead of 1?**
This is called "separation of concerns." If the database crashes, the frontend stays up and can show a user-friendly error. If we need to update just the backend code, we rebuild only that one container without touching the database. This is industry best practice.

---

## 4. The Three Docker Containers We Will Create

### Container 1: Frontend (Nginx)
- **What it does:** Serves the React website (HTML, CSS, JavaScript) to the browser.
- **Why Nginx?** In development, we used `npm run dev` (Vite) to serve the frontend. But Vite is a development tool — it's slow and insecure for production. Nginx is a battle-tested, ultra-fast web server used by Netflix, Airbnb, and NASA. It can serve our static files to 100+ users without breaking a sweat.
- **The Proxy Logic:** When an officer's browser requests `http://server-ip/api/inward/register`, Nginx recognizes the `/api` prefix and internally forwards that request to the Backend container on port 8000. The officer's browser never knows the backend exists separately — it all looks like one website.

### Container 2: Backend (Python + FastAPI)
- **What it does:** Runs our Python code. Handles authentication, saving/reading documents, generating inward numbers, etc.
- **Why a separate container?** Because the company PC doesn't have Python. Docker downloads a pre-built Python 3.12 environment and bundles it inside this container. The host PC never needs Python installed.
- **Environment Variable:** The database connection URL is passed as an environment variable (`DATABASE_URL`). Inside Docker, this points to `postgresql+psycopg://postgres:postgres@db:5432/iodms_db`. Notice `@db` — this is the hostname of Container 3 inside Docker's private network.

### Container 3: Database (PostgreSQL 15)
- **What it does:** Stores all tables (inward_register, outward_register, users, address_book, etc.) and all data permanently.
- **Why inside Docker?** This way you don't need to install PostgreSQL on the company PC either. Everything is self-contained.
- **Data Safety (Volumes):** The actual database files are stored on the host PC's hard drive (not inside the container). This means even if you delete and recreate the container, your data is safe.

---

## 5. What is docker-compose.yml?

`docker-compose.yml` is a master configuration file that tells Docker:
1. **What containers to create** (we need 3: frontend, backend, db)
2. **How they connect** (backend talks to db, frontend talks to backend)
3. **What order to start them** (db first → backend second → frontend last)
4. **Where to store persistent data** (volumes mapped to real folders)
5. **What ports to expose** (port 80 for the website)

Without docker-compose, you would need to type very long `docker run` commands for each container manually. With docker-compose, you type one command: `docker-compose up` and everything starts together.

---

## 6. Step-by-Step: Building on Your Internet PC

These commands are run on YOUR PC (the one with internet, where the code lives).

### Step 1: Make sure Docker Desktop is running
Open Docker Desktop application and wait for it to say "Docker is running."

### Step 2: Open a terminal in the project folder
```powershell
cd "C:\Users\Palash\Desktop\inword outword folder"
```

### Step 3: Build the Docker images
```powershell
docker-compose build
```
**What happens behind the scenes:**
- Docker reads the `Dockerfile` inside `frontend/` → Downloads Node.js → Runs `npm install` → Runs `npm run build` → Copies the built files into an Nginx image.
- Docker reads the `Dockerfile` inside `backend/` → Downloads Python 3.12 → Installs all libraries from `requirements.txt` → Copies the backend code.
- Docker pulls the official PostgreSQL 15 image from Docker Hub.

This may take 5-15 minutes on the first run (it downloads base images from the internet). Subsequent builds are much faster because Docker caches layers.

### Step 4: Test it locally
```powershell
docker-compose up
```
Open your browser and go to `http://localhost`. You should see the IODMS login page. Try logging in with `admin1` / `admin123`.

Press `Ctrl+C` in the terminal to stop everything when done testing.

---

## 7. Step-by-Step: Transferring to USB

After building and testing, we need to export the Docker images to files.

### Step 1: Save all images to .tar files
```powershell
# Save the frontend image
docker save -o iodms-frontend.tar iodms-frontend:latest

# Save the backend image  
docker save -o iodms-backend.tar iodms-backend:latest

# Save the PostgreSQL image
docker save -o postgres-15.tar postgres:15
```

### Step 2: Copy to USB drive
Copy these files to your USB drive:
```
USB Drive/
├── iodms-frontend.tar      (~ 50-100 MB)
├── iodms-backend.tar        (~ 200-400 MB)
├── postgres-15.tar           (~ 350 MB)
├── docker-compose.yml        (from project root)
├── backend/
│   └── seed.py               (to seed initial data)
└── README_DEPLOYMENT.txt     (instructions for the server admin)
```

**Total USB space needed: approximately 700 MB to 1 GB.**

---

## 8. Step-by-Step: Loading on the Offline Company PC

These commands are run on the **OFFLINE COMPANY PC** (the server).

### Step 1: Load the Docker images from USB
```powershell
# Plug in the USB drive (assume it is D:\)
docker load -i D:\iodms-frontend.tar
docker load -i D:\iodms-backend.tar
docker load -i D:\postgres-15.tar
```
Each command will say something like: `Loaded image: iodms-frontend:latest`

### Step 2: Copy docker-compose.yml to a permanent location
```powershell
# Create a folder for the project
mkdir C:\IODMS
copy D:\docker-compose.yml C:\IODMS\
```

### Step 3: Start the application
```powershell
cd C:\IODMS
docker-compose up -d
```
The `-d` flag means "detached" — it runs in the background. You can close the terminal and the system keeps running.

### Step 4: Seed the database (first time only)
```powershell
# Run the seed script inside the backend container
docker-compose exec backend python seed.py
```
This creates the default admin account, folder types, and address groups.

### Step 5: Access the website
On the server PC itself: Open browser → `http://localhost`
From an officer's PC on the LAN: Open browser → `http://<server-ip-address>`

(Replace `<server-ip-address>` with the actual IP of the server, e.g., `http://192.168.1.100`)

---

## 9. Day-to-Day Operations

### Starting the system (after a server reboot)
```powershell
cd C:\IODMS
docker-compose up -d
```
> **Tip:** Docker Desktop can be configured to start automatically on boot, and docker-compose services can be set to `restart: always` (already configured in our docker-compose.yml). This means after a power outage or reboot, the system comes back online automatically.

### Stopping the system
```powershell
cd C:\IODMS
docker-compose down
```
This gracefully shuts down all 3 containers. Your data is preserved in the volumes.

### Checking if containers are running
```powershell
docker-compose ps
```
This shows the status of each container (Up, Exited, etc.)

### Viewing error logs
```powershell
# View backend logs (most useful for debugging)
docker-compose logs backend

# View all logs
docker-compose logs
```

---

## 10. Updating the App in the Future

When you make changes to the code on your development PC:

1. **Rebuild** the changed images:
   ```powershell
   docker-compose build
   ```
2. **Save** the updated image(s) to USB:
   ```powershell
   docker save -o iodms-backend.tar iodms-backend:latest
   ```
3. **Transfer** the `.tar` file to the offline PC via USB.
4. **Load** the new image:
   ```powershell
   docker load -i D:\iodms-backend.tar
   ```
5. **Restart** the services:
   ```powershell
   cd C:\IODMS
   docker-compose down
   docker-compose up -d
   ```

Your database data is safe — it lives in a volume, not inside the container.

---

## 11. Troubleshooting FAQ

### Q: "Port 80 is already in use" error
**A:** Another program (like IIS or Skype) is using port 80. Either stop that program, or change the port in `docker-compose.yml` from `"80:80"` to `"8080:80"` and access the site at `http://server-ip:8080`.

### Q: "Cannot connect to database" error in backend logs
**A:** The backend container may have started before the database was ready. Run:
```powershell
docker-compose restart backend
```

### Q: Officers on Windows 7 see a blank page
**A:** They are probably using Internet Explorer. IE does not support modern React. They must use **Google Chrome (v109 or earlier)** or **Mozilla Firefox (v115 ESR)** — both work on Windows 7.

### Q: How do I backup the database?
**A:** Run this command to export the entire database to a SQL file:
```powershell
docker-compose exec db pg_dump -U postgres iodms_db > C:\IODMS\backup.sql
```
Copy `backup.sql` to a safe location regularly.

### Q: How do I restore a database backup?
**A:** 
```powershell
docker-compose exec -T db psql -U postgres iodms_db < C:\IODMS\backup.sql
```

---

## Glossary for Non-Technical Readers

| Term | Simple Explanation |
|:-----|:-------------------|
| **Container** | A lightweight, isolated "virtual computer" running inside Docker. |
| **Image** | A frozen snapshot/template used to create containers. |
| **Volume** | A real folder on the server's hard drive that a container can save files to. |
| **Port** | A numbered "door" on a computer. Port 80 is the standard door for websites. |
| **Nginx** | A very fast, free web server software (pronounced "Engine-X"). |
| **FastAPI** | A modern Python framework for building web APIs (the backend logic). |
| **PostgreSQL** | A powerful, free, open-source database system. |
| **docker-compose** | A tool that manages multiple Docker containers as a single project. |
| **Air-gapped** | A network with no internet connection, isolated for security. |
| **LAN** | Local Area Network — the internal office network connecting PCs. |
