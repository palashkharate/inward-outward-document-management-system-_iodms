# IODMS Color Philosophy

## Core Design Principle

**"Mission Critical Documentation System"**

The interface should communicate:

* Trust
* Accuracy
* Security
* Readability
* Speed
* Long-hour usability
* Government professionalism

Not:

* Startup
* Social media
* Fancy SaaS
* Marketing website
* Gaming dashboard

---

# Emotional Positioning

| Attribute     | Visual Feeling |
| ------------- | -------------- |
| Defence       | Strong, structured, disciplined |
| Air-gapped    | Secure, internal, no external fluff |
| Engineering   | Precise, clean, technical |
| Long-hours    | Calm, high-contrast, low eye-strain |

---

# The Palette

**CRITICAL RULE: 7:1 Contrast Ratio**
Since officers will look at this for 8 hours a day, readability is the absolute priority. No "cool" low-contrast grey-on-grey. 

| Element | Color Name | Hex Code | Why? |
| :--- | :--- | :--- | :--- |
| **Primary Brand** | HAL Defence Navy | `#0B2545` | Replaces the bright blue. Commands authority and security. Used for the main top bar and primary buttons. |
| **Secondary Accent**| Technical Blue | `#1E5AA8` | Used for links, secondary buttons, and active states. Brighter than Navy, but still professional. |
| **Background** | Workspace Grey | `#F8FAFC` | Not pure white. A very subtle, cool grey to reduce screen glare during long shifts. |
| **Card / Paper** | Operations White | `#FFFFFF` | For forms and tables to stand out cleanly against the Workspace Grey. |
| **Borders / Lines**| Aircraft Silver | `#D1D5DB` | Clean division without being harsh. |
| **Text Primary** | Charcoal | `#111827` | Never use pure `#000000`. Charcoal is softer on the eyes but maintains high contrast. |
| **Text Secondary**| Muted Slate | `#6B7280` | For helper text, timestamps, and minor labels. |
| **Error / Alert** | Critical Red | `#E53935` | Used sparingly for errors, deletions, and the Auditor watermark. |
| **Success / Sent**| Dispatch Green | `#2E7D32` | Used to confirm an outward file has been dispatched. |

---

# Module Color Identifiers

To prevent errors (e.g. logging an inward file while thinking you are in the outward register), each major module will have a distinct, subtle color identity. This will be applied as a top border accent on the main card or the header text color for that specific section.

| Module | Identifier Color | Hex | Rationale |
| :--- | :--- | :--- | :--- |
| **Dashboard** | Dashboard Blue | `#1E5AA8` | The standard, neutral starting point. |
| **Compose Outward**| Brand Navy | `#0B2545` | The most "official" action, uses the primary brand color. |
| **Drafts & Dispatch**| Dispatch Teal | `#0F766E` | Denotes movement and sending. |
| **Log Inward** | Inward Sky | `#0284C7` | Lighter, welcoming for incoming data entry. |
| **Inward Register**| Deep Blue | `#1E40AF` | A solid, archival color for searching past records. |
| **Outward Register**| Indigo | `#4338CA` | Distinct from Inward to prevent confusion when searching. |
| **Address Book** | Slate | `#6B7280` | A neutral utility color for the directory. |
| **Admin Panel** | Warm Brown | `#7C2D12` | Very distinct. If you see brown, you know you are changing system settings. |
| **Auditor View** | Critical Red | `#B91C1C` | High alert. Immediate visual cue that this is a restricted, view-only mode. |
| **My Profile** | Steel Blue | `#334155` | Personal, quiet, administrative. |

---

# Specific UI Component Rules

1. **The Sidebar:**
   * **Background:** HAL Defence Navy (`#0B2545`).
   * **Text:** White (`#FFFFFF`).
   * **Active Item:** Do not use bright neon highlights. Use a subtle lighter navy or a white semi-transparent overlay (`rgba(255, 255, 255, 0.15)`).

2. **Tables (The Registers):**
   * **Header Row:** HAL Defence Navy (`#0B2545`) background with White text. This anchors the data.
   * **Rows:** Alternating subtle zebra striping is okay, but pure white is preferred with Aircraft Silver (`#D1D5DB`) borders.
   * **Row Hover:** Very subtle blue (`#EFF6FF`).

3. **Forms (Compose & Log Inward):**
   * Clean white cards.
   * Inputs should have Aircraft Silver borders.
   * On focus (when clicking inside), the border should change to Technical Blue (`#1E5AA8`) with a slight glow.

4. **Auditor View:**
   * **Background:** Very faint red (`#FFF8F8`).
   * **Watermark:** The "AUDITOR MODE - READ ONLY" watermark must be Critical Red (`#E53935`) but set to 10% opacity so it doesn't obscure the text.
