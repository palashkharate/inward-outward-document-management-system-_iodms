# Test Cases Specification - Standalone Phase

This document defines the test suite for validating all 100 Functional Requirements (FR-000 to FR-154) of the IODMS. All tests are designed for manual validation by a beginner-level tester on a standalone PC.

---

## 1. Test Suite Summary Table

| Test Case ID | FR ID | Module | Title | Test Procedure | Expected Result |
|---|---|---|---|---|---|
| **TC-000** | FR-000 | Auditor | Auditor button | Open Login page, check for "View Registers (Auditor)" button below form. | Distinct, visible but unobtrusive button is present. |
| **TC-001** | FR-001 | Auditor | View tabs | Click "View Registers (Auditor)" button. | Opens read-only interface displaying Inward and Outward tabs. |
| **TC-002** | FR-002 | Auditor | Duplicate view | Verify presence of year dropdown and search filters in Auditor view. | Identical search & year filter controls are present. |
| **TC-003** | FR-003 | Auditor | Read-only check | Search for rows and look for Edit, Delete, or Dispatch actions. | No action buttons or edit options are present on the screen. |
| **TC-004** | FR-004 | Auditor | Copy-paste block | Attempt to click-drag to select cell text or copy content. | Text selection is disabled via CSS (`user-select: none`). |
| **TC-005** | FR-005 | Auditor | Red watermark | Look across the Auditor View page screen. | Diagonal, light-red watermark "CONFIDENTIAL – VIEW ONLY" is visible. |
| **TC-006** | FR-006 | Auditor | Suppress menu | Right-click anywhere in the Auditor View. | Standard browser context menu is blocked and does not open. |
| **TC-007** | FR-007 | Auditor | Login return | Verify navigation sidebar is missing and click "Back to Login". | No sidebar navigation exists. Returns back to Login screen. |
| **TC-010** | FR-010 | Auth | Login fields | Verify User ID, Password inputs and Login button on Login Page. | All fields are present. |
| **TC-011** | FR-011 | Auth | Successful login | Enter `admin` / `admin123` and click Login. | Redirects successfully to Dashboard screen. |
| **TC-012** | FR-012 | Auth | Failed login | Enter incorrect user ID or password. | Error message "Invalid User ID or Password" is shown. |
| **TC-013** | FR-013 | Auth | No session timeout | Log in, leave app open for 1 hour, try to click a link. | User remains logged in (no timeout). |
| **TC-014** | FR-014 | Auth | Logout action | Click "Log Out" at the bottom of the sidebar. | Logged out immediately, redirected to Login screen. |
| **TC-015** | FR-015 | Auth | Password reset | Login as admin, go to Admin tab, click "Reset PW" for a user, set `newpass`. Log in as user with `newpass`. | Password resets successfully and user can login. |
| **TC-020** | FR-020 | Dashboard | Welcome details | Log in, look at top header / welcome card. | Displays user name and active security role. |
| **TC-021** | FR-021 | Dashboard | Birthday check | Seed a user's DOB to today. Log in as any user. | Full page overlay showing birthday name in Times New Roman. |
| **TC-022** | FR-022 | Dashboard | Birthday stack | Seed two users' DOB to today. Log in. | Names are stacked centrally on top of each other. |
| **TC-030** | FR-030 | Compose | Blank composer | Click "Compose Outward", click "New / Reset". | Form clears all fields, next Outward No. is pre-assigned. |
| **TC-031** | FR-031 | Compose | Subject field | Input very long text in Subject. | Text is accepted without truncating limits. |
| **TC-032** | FR-032 | Compose | Prepared By | Check Prepared By dropdown. | Contains active User IDs. Defaults to logged-in user. |
| **TC-033** | FR-033 | Compose | Date picker | Check date picker. | Defaults to today's date. |
| **TC-034** | FR-034 | Compose | Folder ID select | Select "Su-30" from Folder ID dropdown. | Folder Name changes automatically to "Sukhoi Su-30...". |
| **TC-035** | FR-035 | Compose | Folder Name bind | Select "Tejas Light Combat..." from Folder Name dropdown. | Folder ID changes automatically to "LCA". |
| **TC-037** | FR-037 | Compose | Group filter | Select "IAF" from Address Group. | Address To dropdown is filtered to show only IAF contacts. |
| **TC-039** | FR-039 | Compose | Address details | Select contact in Address To dropdown. | Address card displaying Name, Designation, Organisation, Fax, Email appears. |
| **TC-040** | FR-040 | Compose | CC selections | Click "+ Add CC", select contact. Add another. Remove one. | Contacts appear as removable tags/chips. |
| **TC-042** | FR-042 | Compose | Save Draft | Complete form and click "Save Draft". | Form resets. File `fax-{UserID}-{timestamp}.doc` created in IODMS_DATA/Drafts/{Year}/{FolderID}/. |
| **TC-044** | FR-044 | Compose | Modify mode | Open Outward Register, expand row, click "Edit Details". | Compose page opens pre-filled, button changes to "Modify". |
| **TC-045** | FR-045 | Compose | Modify alert | In Modify Mode, click "Modify Record". | Alert: "You are about to modify Outward No. [XXX]. Do you want to continue?" appears. |
| **TC-050** | FR-050 | Drafts | Drafts table | Click "Drafts & Dispatch". | Displays table showing reserved Outward No., Subject, Prepared By, etc. |
| **TC-051** | FR-051 | Drafts | Row actions | Click arrow to expand a draft row. | Reveals "Open / Edit in Word", "Dispatch", and "Discard Draft" buttons. |
| **TC-052** | FR-052 | Drafts | Edit locking | User A locks draft. User B attempts to edit same draft. | User B gets error: "This draft is currently being edited by [User A]". |
| **TC-053** | FR-053 | Drafts | Release lock | User A clicks "Release Lock & Save" or Admin clicks "Admin: Release Lock". | Draft is unlocked. User B can now edit it. |
| **TC-054** | FR-054 | Drafts | Dispatch document | Click "Dispatch" on draft. | Renames document to next sequential number (e.g. 004.doc), moves it to Outward/2026/Su-30/, adds to Outward Register. |
| **TC-056** | FR-056 | Drafts | Discard draft | Click "Discard Draft" on draft. | Creates deletion request. Draft is hidden from drafts register immediately. |
| **TC-060** | FR-060 | Inward | Inward reset | Click "Log Inward", click "New / Reset". | Form clears, next Inward No. is auto-generated. |
| **TC-064** | FR-064 | Inward | Dropzone | Drag and drop file to attachment area. | File is accepted, name and size are displayed. |
| **TC-067** | FR-067 | Inward | Inline Edit RF | Click "Edit List" next to Received From. Add "IAF-DEA". Close. | Dropdown now contains "IAF-DEA" option. |
| **TC-077** | FR-077 | Inward | Log Inward | Fill form, drop file, click "Save". | File stored as `001.pdf` inside `Inward/2026/Su-30/`. DB log created. |
| **TC-078** | FR-078 | Inward | Modify mode | Open Inward Register, click "Edit Details". Edit, click "Modify". | Alert: "You are about to modify Inward No. [XXX]. Do you want to continue?" appears. |
| **TC-080** | FR-080 | Inward | Inward grid | Click "Inward Register". | Displays paginated table of logged inwards. |
| **TC-081** | FR-081 | Inward | Year filter | Change Year dropdown filter. | Refreshes grid to show logs from selected year only. |
| **TC-082** | FR-082 | Inward | Search filters | Type into Subject search box. | Grid filters live (on-change) as you type. |
| **TC-084** | FR-084 | Inward | Soft delete | Click "Delete Log" on inward row. | Greyed out, red "Pending Deletion" badge appears. |
| **TC-090** | FR-090 | Outward | Outward grid | Click "Outward Register". | Displays paginated table of dispatched outwards. |
| **TC-091** | FR-091 | Outward | Comma cells | Check Address To and CC To columns in Outward Register. | All names are displayed in a single cell, comma-separated. |
| **TC-100** | FR-100 | Contact | Address grid | Click "Address Book". | Displays contacts table. |
| **TC-101** | FR-101 | Contact | Field selector | Select "Email" in search dropdown, type "@". | Grid filters contacts matching email query. |
| **TC-102** | FR-102 | Contact | Add panel | Click "Add Contact Entry". | Side drawer panel slides out with contact details form. |
| **TC-110** | FR-110 | Admin | Users grid | Login as admin, go to Admin tab -> User Management. | Table showing user account list with Active/Inactive switches. |
| **TC-120** | FR-120 | Admin | Approvals grid | Go to Admin tab -> Pending Deletions. | Lists deletion requests (Inward No, Outward No, or Contact ID). |
| **TC-121** | FR-121 | Admin | Approve deletion | Click Approve (Check Icon) on deletion request. | Database record and physical document file are permanently deleted. |
| **TC-125** | FR-125 | Admin | Profile grid | Go to Admin tab -> Profile Edit Approvals. | Lists profile change requests. |
| **TC-126** | FR-126 | Admin | Approve profile | Click Approve on profile edit. | User's name and DOB are updated in the users table. |
| **TC-140** | FR-140 | Admin | Change path | Go to Settings tab, change root path to `D:/HAL_RECORDS`, click Save. Log a document. | Document is saved inside `D:/HAL_RECORDS/Inward/...`. |
| **TC-141** | FR-141 | Admin | Cutover override | Set Cutover Override Date to `2026-01-15`. Log inward on Jan 10. | Inward number is logged under Year `2025` instead of `2026`. |
| **TC-142** | FR-142 | Admin | DBeaver info | Click "Open in DBeaver" button. | Modal opens displaying connection configuration guidelines. |
| **TC-150** | FR-150 | Profile | View details | Click "My Profile". | Details matching User ID, PB No., Name, DOB, Role are shown. |
| **TC-151** | FR-151 | Profile | Edit profile | Change name, click Request Update. | Details unchanged, "Change Pending Approval" warning box appears. |
| **TC-154** | FR-154 | Profile | Reset password | Enter current password, new password, click Change Password. Logout. Login with new password. | Password updates immediately. User can login with new credentials. |
