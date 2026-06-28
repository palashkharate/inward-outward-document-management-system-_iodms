# Learning Guide: Code Changes & Problem Solving

Welcome to your technical deep-dive! In this document, we are going to walk through the exact bugs we encountered today, the thinking process used to diagnose them, and the line-by-line code changes we made to fix them. 

Think of this as a behind-the-scenes look at how software debugging and architecture actually work.

---

## 1. The "Blue Screen of Death" on Log Inward
**The Problem:** When you clicked on the "Log Inward" page, the entire screen turned blue (the dark background color) and the app froze.

**The Thinking Process:**
1. A completely blank/frozen screen in a React app usually means a "Fatal JavaScript Error" occurred during rendering. When React encounters an undefined component, it panics and unmounts the entire page to protect itself.
2. I knew it wasn't the backend server crashing, because your terminal showed `INFO: Application startup complete` with no red error text.
3. I looked at the code for `LogInwardPage.jsx` and noticed a component called `<ListItemButton>` was being used in the code for the officer assignment popup.
4. I checked the very top of the file where we `import` tools from the `@mui/material` library. `ListItemButton` was missing from that list! 

**The Fix:**
```javascript
// BEFORE (Buggy)
import { List, ListItem, ListItemText } from '@mui/material';

// AFTER (Fixed)
import { List, ListItem, ListItemText, ListItemButton } from '@mui/material';
```
**The Lesson:** In React, if you want to use a tool (a component), you *must* import it at the top of the file. If you forget, React says "I don't know what this is!" and crashes the whole page.

---

## 2. The Docker Build Failure (npm error)
**The Problem:** When we ran `docker-compose build`, it failed in the middle with an error saying: `No matching version found for @mui/icons-material@5.14.20.`

**The Thinking Process:**
1. This error came from `npm install`, which is Node.js trying to download the libraries our frontend needs from the internet.
2. The error explicitly said the version `5.14.20` doesn't exist. Sometimes, library creators (like MUI) remove buggy versions from the internet registry. Because we told our app to download *exactly* `5.14.20`, it failed when it couldn't find it.

**The Fix (in `frontend/package.json`):**
```json
// BEFORE (Strictly pinned versions)
"dependencies": {
  "@mui/material": "5.14.20",
  "@mui/icons-material": "5.14.20"
}

// AFTER (Flexible caret ranges)
"dependencies": {
  "@mui/material": "^5.15.0",
  "@mui/icons-material": "^5.15.0"
}
```
*What does the `^` symbol mean?* It's a "Caret Range". It tells npm: "Download version 5.15.0, OR any newer minor version that is compatible (like 5.15.1 or 5.16.0)." 

**The Lesson:** Hard-coding exact versions can cause builds to break if those versions disappear. Using caret ranges `^` makes your app more resilient because it can fetch the newest safe version.

---

## 3. The CORS Error: "Connection Failed" after Docker Started
**The Problem:** The Docker containers started perfectly, but when you opened the login page and tried to log in, the screen said "connection failed check backend." The backend logs showed `OPTIONS /api/auth/login 400 Bad Request`.

**The Thinking Process:**
1. This is a classic "Cross-Origin Resource Sharing" (CORS) issue. It happens when a browser blocks a website from talking to an API on a different port/address for security reasons.
2. Wait, why are they talking on different addresses? In Docker, we set up **Nginx** (the frontend) to act as a proxy. It's supposed to intercept requests to `/api` and secretly forward them to the backend internally.
3. If a CORS error happened, it means the browser was bypassing Nginx and trying to hit the backend *directly*.
4. I searched our code for `http://localhost:8000` (the direct backend address). I found it hardcoded in 4 different files!

**The Fix (in `App.jsx`, `LoginPage.jsx`, etc.):**
```javascript
// BEFORE: Hardcoded Absolute URL
// This forces the browser to literally dial "localhost:8000"
axios.defaults.baseURL = 'http://localhost:8000'; 
href={`http://localhost:8000/api/inward/view-file?path=...`}

// AFTER: Relative URL
// This tells the browser: "Just add /api/inward to whatever website I'm currently on"
// Nginx sees this relative request and forwards it properly.
href={`/api/inward/view-file?path=...`}
```

**The Lesson:** Never hardcode absolute URLs (like `http://localhost:8000`) in frontend code if you plan to deploy it to production. Always use relative URLs (like `/api/login`), so the routing system (Nginx or Vite) can handle where that traffic should actually go.

---

## 4. Making the Database Path Flexible
**The Problem:** The backend code strictly told the system to save uploaded files into a folder right next to the code. But in Docker, we need those files saved into a special "Volume" mapped to the host PC's hard drive so they aren't deleted when the container turns off.

**The Fix (in `backend/database.py`):**
```python
# BEFORE
default_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "IODMS_DATA"))

# AFTER
default_root = os.getenv("IODMS_ROOT_PATH", os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "IODMS_DATA")))
```
*What is `os.getenv`?* It tells Python to look for an "Environment Variable" injected from the outside. 

**The Lesson:** We updated our `docker-compose.yml` to inject `IODMS_ROOT_PATH=/data/IODMS_DATA` into the container. Python reads this and dynamically changes where it saves files without us having to rewrite the code. This is called making an app "Environment Aware."

---

## 5. The Air-Gapped Font Problem
**The Problem:** In our `index.html`, we were loading the beautiful 'Outfit' font directly from Google's servers. 

**The Fix:**
I removed the Google links from `index.html` and changed the CSS styles:
```css
/* BEFORE */
font-family: 'Outfit', sans-serif;

/* AFTER */
font-family: 'Outfit', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
```

**The Lesson:** The company PC has no internet, so it can't reach Google to download fonts. The app would waste time trying to connect and then look ugly. By adding "Fallback Fonts" (like Segoe UI, which comes built-in with Windows), we guarantee the app still looks professional and modern even when completely offline!
