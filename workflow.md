# IODMS – V-Model Workflow Guide
## Stack: React (Material UI) + FastAPI + PostgreSQL

---

## What is the V-Model (Plain English)

Normal software development goes in a straight line: design → build → test.

The V-Model folds that line into a V shape. The left side goes down (design), the bottom is coding, and the right side goes up (testing). The key idea is: **every design decision on the left has a matching test on the right.**

Our V is a branched V — the standalone PC phase comes first, and the LAN network phase branches out of it after testing is done.

```
[Phase 1] Requirements (SRS)
            |
            |
     [Phase 2A] Standalone PC Design
            |
            |
     [Phase 2B] Code — Standalone PC
            |        \
            |         \
     [Phase 3A]    [Phase 2C] LAN Network Design
     Standalone         |
     Testing            |
                   [Phase 3B] Code — LAN Changes
                        |
                   [Phase 3C] LAN Testing
                        |
                   [Deployment]
```

You are currently between Phase 1 (done) and Phase 2A (starting next).

---

## Phase 1 — Requirements ✅ DONE

You interviewed the stakeholders (by looking at the old software), wrote down every screen, every field, every behaviour. That became the SRS.

**Outputs you already have:**
- SRS Word document
- Requirements context markdown (with FR-001 to FR-054)
- This workflow file

---

## Set Up the Repo First (so the agent can find everything itself)

With a chat-based AI, you had to paste the requirements file into every new conversation. Claude Code and Antigravity both work directly on your project folder, so instead of pasting, you **save files once and reference them by path.** Create this structure before Step 1:

```
IODMS/
├── CLAUDE.md                     ← Claude Code reads this automatically at the start of every session
├── docs/
│   ├── IODMS_requirements_context.md
│   ├── hld.md                    ← created in Step 1
│   └── technical_design.md       ← created in Step 2 (schema.sql + folder tree)
├── backend/                       ← created in Step 3
└── frontend/                      ← created in Step 3
```
## Phase 2A — Standalone PC Design

**What standalone means:** The server and the user are on the same computer. No network, no other PCs. This keeps things simple for the first build. You are just making sure the software works correctly before worrying about multiple users on a network.

This phase has **3 steps**. Each step produces a document, saved into `docs/`. The agent generates each document and writes the file itself — your job is to read it, check it makes sense, and ask questions if something doesn't match what you know about the software.

---

### Step 1 — High Level Design (HLD)

**① Inputs (already in the repo — nothing to paste)**
- `docs/IODMS_requirements_context.md` — the agent needs FR-001 to FR-054 and the 3 main workflows (create outward file, inward entry, finalise file) to know what it is designing.
- Nothing else. No code, no schema yet — none of that exists.

**② What to do in this step**

Prompt:
```
Read docs/IODMS_requirements_context.md.
Write a 2-page HLD to docs/hld.md.
```

It describes the 3 system components and how they connect:

```
Browser (React + Material UI)  →  FastAPI (Python)  →  PostgreSQL (Database)
                                        ↕
                                   File System
                                (the .docx files)
```

- **Browser (React + Material UI):** What the user sees and clicks on — forms, tables, and dropdowns built from Material UI components.
- **FastAPI:** The middleman — receives requests from the browser, talks to the database, returns answers.
- **PostgreSQL:** Stores every record — inward, outward, address book, users, all dropdown master lists.
- **File system:** Folders on the PC where .docx files are saved and moved, following the fixed structure: `Drafts/`, `Outward/{Year}/{File Type}/`, `Inward/{Year}/{File Type}/`. File numbers (001, 002…) reset every year, separately for each File Type (e.g. Su‑30 resets independently of LCA).

For each of the 3 main workflows, the HLD traces the data flow end to end: what the user clicks, what FastAPI does, what goes into the database, what file moves where.

Your job: Read `docs/hld.md`. If a flow description doesn't match how you remember the old software working, flag it before moving on.

**③ Before moving to Step 2**
- `docs/hld.md` should exist and be saved. Nothing to paste — Step 2 will read it from disk.

---

### Step 2 — Technical Design (Database Schema + Folder/File Structure, combined)

**① Inputs (already in the repo)**
- `docs/IODMS_requirements_context.md` — contains the full table list, the file/folder structure, and what each stores.
- `docs/hld.md` from Step 1 — shows which tables and files each workflow touches, so the schema and the code skeleton stay consistent with the flow.

**② What to do in this step**

Prompt:
```
Read docs/IODMS_requirements_context.md and docs/hld.md.
Write the technical design to docs/technical_design.md, with two parts:
Part A) schema.sql as a code block
Part B) the full backend/frontend folder tree, one-line comment per file
```

One document, two parts, so only one file needs to be carried forward into Step 3.

**Part A — `schema.sql`:** Each table is defined with `CREATE TABLE` statements — every column has a name, data type, and a comment explaining what it holds. The agent also generates a simple text diagram showing which tables reference which (foreign key links).

Tables it will define:

| Table | What it stores |
|---|---|
| `users` | Officer accounts, roles, passwords |
| `designations` | Dropdown options for Designation field |
| `organisations` | Dropdown options for Organisation field |
| `folder_types` | Dropdown options for Folder Type field |
| `address_groups` | The Categories used in Create File |
| `address_book` | All addresses (migrated from legacy XLSX) |
| `inward_register` | All inward records (migrated from legacy XLSX) |
| `outward_register` | All finalised outward records (migrated from legacy XLSX) |
| `draft_files` | Temporary outward drafts waiting to be finalised |
| `audit_log` | Every action any user takes, with timestamp |

The register/file-number columns in `outward_register`, `draft_files`, and `inward_register` must carry a comment noting they reset yearly, scoped per File Type — this is a confirmed requirement, not a placeholder.

**Part B — Folder/file tree:** A full code folder tree, with a one-line comment on each file explaining its purpose. No code is written yet, this is just the skeleton.

Why this matters: the agent generates code one file at a time. If the folder structure isn't locked first, it won't know where to import things from and files will contradict each other.

To keep this maintainable by a single developer (and to keep future prompts shorter), the tree is organised into **4 modules** instead of one-per-screen:

| Module | Combines | Notes |
|---|---|---|
| **Auth** | Login, session, password reset | Everything else depends on this |
| **Admin & Address Book** | Admin Panel + Address Book | Shared master lists (designations, organisations, folder types, address groups) live here |
| **Outward Management** | Create File + Finalise File + Outward Register | Includes the .docx draft generator and the file mover |
| **Inward Management** | Inward Entry + Inward Register | Includes file upload / drag-and-drop for scanned documents — direct scanner-SDK integration has been dropped from requirements |

Your job: Confirm every FR (FR-001 to FR-054) maps to one of these 4 modules — ask the agent to print the mapping if you're unsure anything was missed.

**Tool to view the schema once created:** Use **DBeaver** (free). Connect it to PostgreSQL and browse your tables like a spreadsheet. Simpler than pgAdmin — install that, not pgAdmin.

**③ Before moving to Step 3**
- `docs/technical_design.md` should exist. That's the only new file Step 3 needs — `docs/IODMS_requirements_context.md` is still read automatically (via `CLAUDE.md`, or by name if using Antigravity).

---

### Step 3 — Code Generation (One Module at a Time)

**① Inputs — per file**

For each file you ask the agent to generate, it needs:
- `docs/IODMS_requirements_context.md` (auto-loaded)
- `docs/technical_design.md` (auto-loaded, or mention it by name)
- The already-written files that the current file depends on — the agent can read these straight from disk since they're in the same repo; you don't need to paste them either, just name them.

**② What to do in this step**

Generate code in this dependency order (things other things need go first):

1. Database connection setup
2. All database table models (Python version of the schema)
3. **Auth module** — everything else depends on this
4. **Admin & Address Book module** — dropdowns need these before other modules can use them
5. **Inward Management module** — Inward Entry (incl. file upload/drag-and-drop) + Inward Register
6. **Outward Management module** — Create File + document generator + Finalise File + file mover + Outward Register
7. Frontend pages — same order as backend

Use this prompt pattern for every file:

```
Read docs/technical_design.md if you haven't already.

Now generate: backend/routers/inward.py
Requirements this file covers: FR-016 to FR-033
Files already written that this depends on: database.py, models/inward.py

Rules:
- Add a comment above every function saying which FR ID it implements
- Keep comments simple enough for a non-CSE beginner to understand
- If something is complex, explain it in a comment before the code
```

(If `CLAUDE.md` already states the FR-comment rule and the "explain it simply" rule, you can drop the Rules block — it's shown here in case you're using Antigravity, which doesn't auto-load `CLAUDE.md`.)

Every function must have an FR comment:

```python
# FR-016: When user clicks New, generate the next Inward Number automatically
@router.post("/inward/new")
def create_inward_entry(...):
    ...
```

This is how you trace every line of code back to a requirement. When something breaks, find the FR, find the function, fix it.

**③ Before moving to Phase 3A**
- All code for the 4 modules exists in `backend/` and `frontend/`.
- `docs/technical_design.md` is enough context for Phase 3A — it already contains the folder tree, so the agent knows which module implements which screen. **Do not** ask the agent to re-paste or summarise all the code into a new doc — test cases come from the requirements, not from the code.

---

## Phase 3A — Standalone Testing

**① Inputs (already in the repo)**
- `docs/IODMS_requirements_context.md` — the full FR list is the source of truth for what gets tested.
- `docs/technical_design.md` — so the agent knows which module to reference per test case.

**② What to do in this step**

Prompt:
```
Read docs/IODMS_requirements_context.md and docs/technical_design.md.
Write a test case document to docs/test_cases.md, one row per FR.
```

| TC ID | FR ID | What you test | What you do | What should happen |
|---|---|---|---|---|
| TC-001 | FR-001 | Subject field | Type text into Subject | Text appears correctly |
| TC-016 | FR-016 | Inward No. auto-generate | Click New | INWD-2025-001 appears |
| TC-018 | FR-018 | Scanned document upload | Drag-and-drop a file, or use the Upload button | File attaches to the inward record (no scanner driver involved) |
| TC-013 | FR-013 | Finalise File | Click Finalise | Register No. generated, record moves to Outward Register |

**If you're using Antigravity:** its agents can drive a built-in browser themselves — ask it to step through `docs/test_cases.md` and record a screenshot or short video per test case, instead of you clicking through every row by hand. Still spot-check a handful yourself before signing off.

**If you're using Claude Code:** ask it to write an automated test script (e.g. `pytest` + `Playwright`) covering the FR list and run it, then show you the pass/fail output. Treat that as a first pass — manually click through anything it reports as a fail, plus a few passes, before signing off.

Either way: you run or review each test and mark pass or fail.

If a test fails: note the FR ID, point the agent at the function with that FR comment plus the error, and ask for a fix.

**③ Before moving to Phase 2C**
- Signed-off `docs/test_cases.md` (all TCs marked passed).
- `docs/technical_design.md` is still the schema/folder reference — LAN design adds network config and a shared network folder path on top of the same schema and folder tree; no table or module changes expected.

---

## Phase 2C — LAN Network Design

**① Inputs (already in the repo)**
- `docs/IODMS_requirements_context.md` — specifically the deployment context: air-gapped LAN, central server PC, ~30 users, max 10 concurrent, Chromium browser on client PCs, no client-side install.
- Signed-off `docs/test_cases.md` — confirms the standalone base is stable before adding network layer.
- `docs/technical_design.md` — network config changes touch DB connection settings and the file-system path; the agent needs the existing schema + folder tree to generate correct config patches.

**② What to do in this step**
Very little new code. What changes from standalone:

- FastAPI is configured to listen on the server PC's LAN IP, not just localhost.
- PostgreSQL is configured to accept connections from other PCs on the same LAN.
- The `Drafts/`, `Outward/`, `Inward/` folders move to a shared network path on the server PC so every client can reach the same files.
- Session handling is verified to work correctly with up to 10 simultaneous users.
- A simple install/access guide is written so other PCs can open the app in their browser with no install.

Prompt:
```
Read docs/IODMS_requirements_context.md and docs/technical_design.md.
Update database.py, the uvicorn startup command, and pg_hba.conf for LAN access.
Write docs/deployment_guide.md.
```

Your job: Read `docs/deployment_guide.md`. It must match the actual physical setup — the server PC's fixed LAN IP, the shared network folder where .docx files are stored, and the Chromium browser on client machines.

**③ Before moving to Phase 3B**
- Updated config files, saved in the repo.
- `docs/test_cases.md` — Phase 3B reruns the same tests from a different PC, so the agent extends that document with LAN-specific additions rather than creating a new one.

---

## Phase 3B & 3C — LAN Code Changes and Testing

**① Inputs (already in the repo)**
- `docs/IODMS_requirements_context.md`
- `docs/test_cases.md`
- Updated config files from Phase 2C

**② What to do in this step**
Rerun every test from Phase 3A — this time from a different PC on the network, pointing the browser at the server PC's LAN IP.

Add these LAN-specific tests:

- Two users editing different records at the same time — both changes save correctly.
- Session timeout works across the network — user is logged out after inactivity.
- File upload/drag-and-drop for Inward Entry still works when the `Inward/` folder is on the shared network path (no scanner hardware involved — that integration was dropped from requirements).

Pass all tests → Deployment done.

**③ After deployment**
No further agent sessions needed for standard deployment. If a bug appears post-deployment: point the agent at `docs/IODMS_requirements_context.md`, the specific function with its FR comment, and the error message. Nothing else.

---

## What You Actually Need to Learn (Realistic, in Order)

You do not need to write code from scratch. You need to read it and understand it enough to debug it with the agent's help.

**Before Phase 2B starts (next few weeks):**
- What is an API and what do GET / POST / PUT mean — watch one 20-minute YouTube video
- What is a database table, what is a PRIMARY KEY, what is a FOREIGN KEY — one hour, just read examples
- Basic Python syntax — functions, variables, if/else — not deep, just enough to read it

**While reviewing agent-generated code:**
- FastAPI: what does `@router.get("/something")` mean
- React: what is a component, what does `useState` do, what is a Material UI component — just read, don't memorise
- PostgreSQL: how to run `SELECT * FROM inward_register` in DBeaver to check if data saved

**That's it for now.** As each phase comes, you learn what that phase needs. Don't try to learn everything before starting.

---

## Tools to Install (Standalone PC, in This Order)

| Tool | What it does | Where to get it |
|---|---|---|
| Python 3.11+ | Runs the FastAPI backend | python.org |
| PostgreSQL 15+ | The database | postgresql.org |
| DBeaver | View and query your database visually (simpler than pgAdmin) | dbeaver.io |
| Node.js 20+ | Needed to run React | nodejs.org |
| Git | Saves versions of your code so you can undo mistakes | git-scm.com |
| **Claude Code** *or* **Google Antigravity** | The agentic tool that reads/writes your repo — pick one (or try both, the repo structure works for either) | claude.com/product/claude-code · antigravity.google |
| VS Code (optional) | Only needed if you choose Claude Code and want it inside an editor instead of the terminal — skip this if using Antigravity, since Antigravity already includes a full code editor | code.visualstudio.com |

Install in the order listed. PostgreSQL must be installed before DBeaver.

---

## What to Do Right Now (Next Steps in Order)

1. ✅ SRS done
2. ✅ Requirements markdown ready
3. ✅ This workflow guide ready
4. → Create the `IODMS/` repo folder, with `docs/IODMS_requirements_context.md` inside it. Add `CLAUDE.md` if using Claude Code.
5. → Open the folder in Claude Code (terminal: `claude`) or as an Antigravity project, and ask for the **HLD** (Step 1 prompt above) — it writes `docs/hld.md` itself.
6. → Ask for the **Technical Design document** (Step 2 prompt above) — it writes `docs/technical_design.md`, organised into the 4 modules: Auth, Admin & Address Book, Outward Management, Inward Management.
7. → Begin **code generation**, one module at a time, using the prompt pattern in Step 3.
8. → Install the remaining tools on the standalone PC while the agent is generating design documents.

---

## Rules to Remember

1. **Save the context file once, in the repo — don't paste it every session.** With Claude Code, `CLAUDE.md` auto-loads it for you. With Antigravity, just name the file in your first prompt of a session. AI still has no memory between sessions, but the file living on disk means you never retype it.
2. **Keep `docs/` clean — archive superseded documents instead of leaving them next to the current one.** Once `docs/technical_design.md` exists, move any older schema-only or folder-only notes out of `docs/` (e.g. into `docs/archive/`). The agent reads everything it finds in `docs/`, so clutter there causes the same confusion that pasting old files into a chat used to.
