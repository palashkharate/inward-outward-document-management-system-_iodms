"""
FR-200: Patch script to replace hardcoded UI labels with t() calls.
This script carefully modifies each frontend file to use the terminology system.
"""
import re
import os

BASE = r'frontend\src'

def read(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'  Patched: {path}')

# ============================================================
# 1. App.jsx — Add TerminologyProvider + update nav labels
# ============================================================
print('=== Patching App.jsx ===')
path = os.path.join(BASE, 'App.jsx')
c = read(path)

# Add import for TerminologyProvider
if 'TerminologyContext' not in c:
    c = c.replace(
        "import DocumentLinkPicker",
        "import { TerminologyProvider, useTerminology } from './TerminologyContext.jsx';\nimport DocumentLinkPicker"
    )
    # If DocumentLinkPicker is not imported, try another anchor
    if 'TerminologyContext' not in c:
        c = c.replace(
            "import DraftsDispatchPage",
            "import { TerminologyProvider, useTerminology } from './TerminologyContext.jsx';\nimport DraftsDispatchPage"
        )

# Wrap the app with TerminologyProvider
# Find the return statement in App() and wrap with provider
if '<AuthContext.Provider' in c and 'TerminologyProvider' not in c:
    c = c.replace(
        '<AuthContext.Provider',
        '<TerminologyProvider>\n    <AuthContext.Provider'
    )
    c = c.replace(
        '</AuthContext.Provider>',
        '</AuthContext.Provider>\n    </TerminologyProvider>'
    )

# Update nav menu items
c = c.replace("text: 'Compose Outward'", "text: t('lbl_compose_outward')")
c = c.replace("text: 'Drafts & Dispatch'", "text: t('lbl_drafts_dispatch')")
c = c.replace("text: 'Outward Register'", "text: t('lbl_outward_register')")
c = c.replace("text: 'Log Inward'", "text: t('lbl_log_inward')")
c = c.replace("text: 'Inward Register'", "text: t('lbl_inward_register')")

# Add useTerminology() hook in AppLayout
if 'useTerminology' in c and "const { t }" not in c:
    c = c.replace(
        "function AppLayout() {\n  const { user } = useAuth();",
        "function AppLayout() {\n  const { user } = useAuth();\n  const { t } = useTerminology();"
    )
    # Try alternate formatting
    if "const { t }" not in c:
        c = c.replace(
            "function AppLayout() {\r\n  const { user } = useAuth();",
            "function AppLayout() {\r\n  const { user } = useAuth();\r\n  const { t } = useTerminology();"
        )

write(path, c)

# ============================================================
# 2. DraftsDispatchPage.jsx
# ============================================================
print('=== Patching DraftsDispatchPage.jsx ===')
path = os.path.join(BASE, 'pages', 'DraftsDispatchPage.jsx')
c = read(path)

# Add import
if 'useTerminology' not in c:
    c = c.replace(
        "import { useAuth } from '../App.jsx';",
        "import { useAuth } from '../App.jsx';\nimport { useTerminology } from '../TerminologyContext.jsx';"
    )

# Add hook in DraftsDispatchPage function
if "const { t }" not in c:
    c = c.replace(
        "const { user } = useAuth();\n  const navigate = useNavigate();",
        "const { user } = useAuth();\n  const { t } = useTerminology();\n  const navigate = useNavigate();"
    )
    if "const { t }" not in c:
        c = c.replace(
            "const { user } = useAuth();\r\n  const navigate = useNavigate();",
            "const { user } = useAuth();\r\n  const { t } = useTerminology();\r\n  const navigate = useNavigate();"
        )

# Replace labels
c = c.replace(">Drafts & Dispatch Register<", ">{t('lbl_drafts_dispatch_title')}<")
c = c.replace(">Outward No.<", ">{t('lbl_outward_no')}<")
c = c.replace("label: 'Folder ID'", "label: t('lbl_folder_id')")
c = c.replace("label: 'Prepared By'", "label: t('lbl_prepared_by')")

# Table headers
c = c.replace(">Folder ID<", ">{t('lbl_folder_id')}<")
c = c.replace(">Folder Name<", ">{t('lbl_folder_name')}<")
c = c.replace(">Prepared By<", ">{t('lbl_prepared_by')}<")

# Buttons
c = c.replace(">Dispatch Document<", ">{t('lbl_dispatch_document')}<")
c = c.replace(">Discard Draft<", ">{t('lbl_discard_draft')}<")

write(path, c)

# ============================================================
# 3. ComposeOutwardPage.jsx
# ============================================================
print('=== Patching ComposeOutwardPage.jsx ===')
path = os.path.join(BASE, 'pages', 'ComposeOutwardPage.jsx')
c = read(path)

if 'useTerminology' not in c:
    c = c.replace(
        "import { useAuth } from '../App.jsx';",
        "import { useAuth } from '../App.jsx';\nimport { useTerminology } from '../TerminologyContext.jsx';"
    )

if "const { t }" not in c:
    c = c.replace(
        "const { user } = useAuth();",
        "const { user } = useAuth();\n  const { t } = useTerminology();",
        1  # only first occurrence
    )

# Page title
c = c.replace(
    "{isModifyMode ? 'Modify Outward Record' : 'Compose Outward Document'}",
    "{isModifyMode ? t('lbl_modify_outward_title') : t('lbl_compose_outward_title')}"
)

# Form field labels
c = c.replace('label="Outward No."', "label={t('lbl_outward_no')}")
c = c.replace('label="Prepared By"', "label={t('lbl_prepared_by')}")
c = c.replace('label="Folder ID"', "label={t('lbl_folder_id')}")
c = c.replace('label="Folder Name"', "label={t('lbl_folder_name')}")
c = c.replace('label="Address Group"', "label={t('lbl_address_group')}")
c = c.replace('label="Address To"', "label={t('lbl_address_to')}")

# Buttons
c = c.replace(">Save Draft<", ">{t('lbl_save_draft')}<")

write(path, c)

# ============================================================
# 4. LogInwardPage.jsx
# ============================================================
print('=== Patching LogInwardPage.jsx ===')
path = os.path.join(BASE, 'pages', 'LogInwardPage.jsx')
c = read(path)

if 'useTerminology' not in c:
    c = c.replace(
        "import { useAuth } from '../App.jsx';",
        "import { useAuth } from '../App.jsx';\nimport { useTerminology } from '../TerminologyContext.jsx';"
    )

if "const { t }" not in c:
    c = c.replace(
        "const { user } = useAuth();",
        "const { user } = useAuth();\n  const { t } = useTerminology();",
        1
    )

# Page title
c = c.replace(
    "{isModifyMode ? 'Modify Inward Details' : 'Log Inward Document'}",
    "{isModifyMode ? t('lbl_modify_inward_title') : t('lbl_log_inward_title')}"
)

# Form fields
c = c.replace('label="Document Type"', "label={t('lbl_document_type')}")
c = c.replace('label="Folder ID"', "label={t('lbl_folder_id')}")
c = c.replace('label="Folder Name"', "label={t('lbl_folder_name')}")
c = c.replace('label="Received From"', "label={t('lbl_received_from')}")
c = c.replace('label="Originated By"', "label={t('lbl_originated_by')}")

# Assign To label
c = c.replace(">Assign To (Officers):<", ">{t('lbl_assign_to')} (Officers):<")

# Buttons
c = c.replace(">Modify Inward<", ">{t('lbl_modify_inward')}<")
c = c.replace(">Save Inward Entry<", ">{t('lbl_save_inward')}<")

write(path, c)

# ============================================================
# 5. InwardRegisterPage.jsx
# ============================================================
print('=== Patching InwardRegisterPage.jsx ===')
path = os.path.join(BASE, 'pages', 'InwardRegisterPage.jsx')
c = read(path)

if 'useTerminology' not in c:
    c = c.replace(
        "import { useAuth } from '../App.jsx';",
        "import { useAuth } from '../App.jsx';\nimport { useTerminology } from '../TerminologyContext.jsx';"
    )

if "const { t }" not in c:
    c = c.replace(
        "const { user } = useAuth();",
        "const { user } = useAuth();\n  const { t } = useTerminology();",
        1
    )

# Page title
c = c.replace(">Inward Register<", ">{t('lbl_inward_register')}<")

# Table headers
c = c.replace(">Inward No.<", ">{t('lbl_inward_no')}<")
c = c.replace(">Folder ID<", ">{t('lbl_folder_id')}<")
c = c.replace(">Received From<", ">{t('lbl_received_from')}<")

# Filter labels
c = c.replace('label="Folder"', "label={t('lbl_folder')}")
c = c.replace('label="Assign To"', "label={t('lbl_assign_to')}")
c = c.replace('label="Received From"', "label={t('lbl_received_from')}")
c = c.replace('label="Originated By"', "label={t('lbl_originated_by')}")

# Expanded metadata labels
c = c.replace(">Folder Name:<", ">{t('lbl_folder_name')}:<")
c = c.replace(">Originated By:<", ">{t('lbl_originated_by')}:<")
c = c.replace(">Assign To:<", ">{t('lbl_assign_to')}:<")

write(path, c)

# ============================================================
# 6. OutwardRegisterPage.jsx
# ============================================================
print('=== Patching OutwardRegisterPage.jsx ===')
path = os.path.join(BASE, 'pages', 'OutwardRegisterPage.jsx')
c = read(path)

if 'useTerminology' not in c:
    c = c.replace(
        "import { useAuth } from '../App.jsx';",
        "import { useAuth } from '../App.jsx';\nimport { useTerminology } from '../TerminologyContext.jsx';"
    )

if "const { t }" not in c:
    c = c.replace(
        "const { user } = useAuth();",
        "const { user } = useAuth();\n  const { t } = useTerminology();",
        1
    )

# Page title
c = c.replace(">Outward Register<", ">{t('lbl_outward_register')}<")

# Table headers
c = c.replace(">Outward No.<", ">{t('lbl_outward_no')}<")
c = c.replace(">Folder ID<", ">{t('lbl_folder_id')}<")
c = c.replace(">Folder Name<", ">{t('lbl_folder_name')}<")
c = c.replace(">Address To<", ">{t('lbl_address_to')}<")
c = c.replace(">Prepared By<", ">{t('lbl_prepared_by')}<")

# Filters
c = c.replace('label="Folder"', "label={t('lbl_folder')}")
c = c.replace('label="Prepared By"', "label={t('lbl_prepared_by')}")
c = c.replace('label="Address To"', "label={t('lbl_address_to')}")

write(path, c)

# ============================================================
# 7. DashboardPage.jsx
# ============================================================
print('=== Patching DashboardPage.jsx ===')
path = os.path.join(BASE, 'pages', 'DashboardPage.jsx')
c = read(path)

if 'useTerminology' not in c:
    # Dashboard may or may not import useAuth — try both
    if "import { useAuth } from '../App.jsx';" in c:
        c = c.replace(
            "import { useAuth } from '../App.jsx';",
            "import { useAuth } from '../App.jsx';\nimport { useTerminology } from '../TerminologyContext.jsx';"
        )
    else:
        # Add at top of imports
        c = "import { useTerminology } from '../TerminologyContext.jsx';\n" + c

# Add hook — Dashboard might not use useAuth
if "const { t }" not in c:
    if "const { user } = useAuth();" in c:
        c = c.replace(
            "const { user } = useAuth();",
            "const { user } = useAuth();\n  const { t } = useTerminology();",
            1
        )
    elif "export default function DashboardPage" in c:
        c = c.replace(
            "export default function DashboardPage() {",
            "export default function DashboardPage() {\n  const { t } = useTerminology();"
        )

# Quick action buttons
c = c.replace(">Log Inward<", ">{t('lbl_log_inward')}<")
c = c.replace(">Compose Outward<", ">{t('lbl_compose_outward')}<")

# Stat cards
c = c.replace('title="Inward This Year"', "title={t('lbl_inward_this_year')}")
c = c.replace('title="Outward This Year"', "title={t('lbl_outward_this_year')}")
c = c.replace('title="Active Drafts"', "title={t('lbl_active_drafts')}")

write(path, c)

# ============================================================
# 8. AdminPage.jsx — System Settings terminology toggle
# ============================================================
print('=== Patching AdminPage.jsx ===')
path = os.path.join(BASE, 'pages', 'AdminPage.jsx')
c = read(path)

if 'useTerminology' not in c:
    c = c.replace(
        "import { useAuth } from '../App.jsx';",
        "import { useAuth } from '../App.jsx';\nimport { useTerminology } from '../TerminologyContext.jsx';"
    )

if "const { t, mode, setMode }" not in c:
    c = c.replace(
        "const { user } = useAuth();",
        "const { user } = useAuth();\n  const { t, mode, setMode } = useTerminology();",
        1
    )

# Replace some Admin labels
c = c.replace('>Log Inward (Previous Year)<', ">{t('lbl_log_inward_prev_year')}<")
c = c.replace('>Compose Outward (Previous Year)<', ">{t('lbl_compose_outward_prev_year')}<")

# Replace master list tabs
c = c.replace('label="Folder Categories"', "label={t('lbl_folder_categories')}")
c = c.replace('label="Address Groups"', "label={t('lbl_address_groups')}")
c = c.replace('label="Received From Origins"', "label={t('lbl_received_from_origins')}")
c = c.replace('label="Originated By Senders"', "label={t('lbl_originated_by_senders')}")

# Folder table headers in master list
c = c.replace(">Folder ID<", ">{t('lbl_folder_id')}<")
c = c.replace(">Folder Name<", ">{t('lbl_folder_name')}<")

write(path, c)

print('\n=== All files patched successfully! ===')
