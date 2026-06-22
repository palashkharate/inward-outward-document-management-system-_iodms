# Learning Guide: Local Development vs. Final Deployment

Welcome! As a beginner learning through building the **Inward Outward Document Management System (IODMS)**, it's completely normal to wonder why we run terminal commands and whether we have to do this forever. 

This guide breaks down the core concepts of running a web application in **Development** versus **Production**.

---

## 🏗️ 1. Local Development Mode (What we are doing now)

**Development mode** is your "sandbox" or workshop. When you are writing code, testing features, or fixing bugs, you want an environment that gives you instant feedback and detailed error messages.

### How it works:
- **Frontend (Vite + React)**: When you run `npm run dev`, Vite creates a lightweight, temporary web server. If you edit a React component and hit save, Vite instantly injects the new code into your browser without even refreshing the page (this is called "Hot Module Replacement").
- **Backend (FastAPI)**: When you run `uv run uvicorn main:app --reload`, the `--reload` flag tells Python to watch your files. If you change a `.py` file, the server automatically restarts to apply your changes.
- **The Catch**: These development servers are **not** designed for heavy traffic or high security. If you close the terminal, the server dies immediately.

### Why do we need two terminals?
Our application is **decoupled**, meaning the Frontend and Backend are entirely separate systems that simply talk to each other over the network (via APIs). 
- Terminal 1 runs the Python logic (the brain/database manager).
- Terminal 2 runs the React UI (the buttons and forms the user sees).

---

## 🚀 2. Final Deployment / Production Mode (The end goal)

**Production mode** is the polished, final product that your users will interact with. In this mode, the system runs silently in the background, starts automatically when the computer turns on, and handles errors gracefully. You **do not** need to keep terminal windows open.

### How we transition from Development to Production:

#### Step A: Building the Frontend
Instead of running a temporary Vite server, you will run a build command:
```bash
npm run build
```
**What happens?** This takes all your React JSX files, CSS, and images, and compiles them down into pure, highly-optimized, static HTML, CSS, and Javascript files. These files are placed in a `dist/` (distribution) folder. 
**The Result:** You no longer need Node.js to run the frontend! You can serve these static files using a robust web server like **IIS** (built into Windows) or **Nginx**.

#### Step B: Running the Backend as a Service
Instead of using the `--reload` flag in a terminal, we configure the backend to run as a **Background Service**. 
On Windows, this is typically done using a tool like **NSSM (Non-Sucking Service Manager)**.
**What happens?** NSSM registers your FastAPI backend as an official Windows Service (just like the Print Spooler or Windows Update). 
**The Result:** If the server machine reboots, Windows automatically starts your Python backend in the background before anyone even logs in. If the app crashes, Windows will automatically restart it.

#### Step C: The Database
PostgreSQL is inherently a production-ready system. When you installed it via the EnterpriseDB installer, it automatically registered itself as a Windows Service. That's why you never have to manually type a command to start the database!

---

## 🧠 Summary Table

| Feature | Local Development Mode | Production Deployment |
| :--- | :--- | :--- |
| **Purpose** | Building, writing code, and testing. | End-users using the application daily. |
| **Terminals** | Must be kept open manually. | Runs invisibly in the background. |
| **Auto-Start** | No. Must be started by the developer. | Yes. Starts automatically when the server boots. |
| **Code Changes** | Applied instantly on save (`--reload`). | Requires a re-build and service restart. |
| **Frontend** | Hosted via temporary `npm run dev` server. | Pre-built into static files (`npm run build`). |
| **Performance** | Slower (contains debugging tools). | Highly optimized and fast. |

### Your Next Steps in the Learning Journey
For now, continue to use **Local Development Mode** to test the system and get comfortable with how the frontend and backend communicate. Once you verify the application works perfectly for your needs, we will create the Production Deployment!
