import os

filepath = r"c:\Users\Palash\Desktop\inword outword folder\frontend\src\App.jsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix AppContent
if "const { t } = useTerminology();" not in content:
    content = content.replace(
        "function AppContent() {\n  const { user, logout } = useAuth();",
        "function AppContent() {\n  const { user, logout } = useAuth();\n  const { t } = useTerminology();"
    )

# Fix App return
if "<TerminologyProvider>" not in content:
    content = content.replace(
        "<AuthContext.Provider value={{ user, login, logout }}>",
        "<TerminologyProvider>\n      <AuthContext.Provider value={{ user, login, logout }}>"
    ).replace(
        "</AuthContext.Provider>",
        "</AuthContext.Provider>\n      </TerminologyProvider>"
    )

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched App.jsx")
