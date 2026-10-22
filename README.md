# SAS Enterprise - Student Attendance & Intelligence System

Institutional Role-Based Attendance Management System featuring Student, Instructor, Academic Advisor, and Administrator workflows.

---

## 🚀 How to Run in VS Code (Guaranteed Zero Errors)

You can launch the complete system without installing heavy GUI toolkits (such as PySide6 or Qt) using any of the methods below:

### Method 1: Open index.html directly (Zero Installation)
1. Open the project folder in VS Code or in File Explorer / Finder.
2. **Double-click `index.html`** (or in VS Code, right-click `index.html` and choose **Open with Live Server**).
3. The interface will open immediately in your web browser with all 5 screens, styling, and interactive data functioning 100%!
*(On Windows, you can also double-click **`run.bat`**)*.

---

### Method 2: Standard Python Terminal (Zero pip Packages Required)
Python 3 includes a built-in HTTP server in its standard library.
Open your VS Code terminal and run:

```bash
python server.py
# OR:
python main.py
```
👉 Both commands automatically launch your browser and serve the application at `http://localhost:8000/index.html`.

---

### Method 3: Node.js / Vite Dev Server
```bash
npm install
npm run dev
```
Open `http://localhost:3000`.

---

## 🔑 Demo Account Credentials (Default Password: `password123`)

| Role | Email | Full Name | Module Description |
| :--- | :--- | :--- | :--- |
| **Student** | `a.rivera@university.edu` | Alex Rivera | Direct PIN/QR check-in (<15m Present, 15-45m Late), personal attendance %, submit excuse requests |
| **Instructor** | `dr.vance@university.edu` | Dr. Evelyn Vance | Open attendance session (dynamic 6-digit PIN + 15m timer), real-time roster with status override dropdowns, approve/reject excuses, export CSV reports |
| **Advisor** | `m.brody@university.edu` | Marcus Brody | Early Warning System (EWS) for <80% attendance or 3 consecutive absences, intervention counseling notes |
| **Administrator** | `sysadmin@university.edu` | Root Systems Admin | Master User CRUD (Add/Edit accounts), school-wide attendance report export, tamper-evident audit logs |

*(The login screen also features 4 one-click quick login buttons to instantly test each role).*

---

## 📁 Key Files Overview

- **`index.html`**: Complete standalone web application with Glacier Dark Glassmorphism design.
- **`server.py`**: Zero-dependency Python server using standard library modules.
- **`run.bat`**: Windows 1-click launcher.
- **`run.sh`**: macOS / Linux 1-click launcher.
- **`main.py`, `database.py`, `logic.py`, `main_app.ui`**: PySide6 MVC implementation with automatic browser fallback.
