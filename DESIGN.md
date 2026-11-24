# CampOS design context

## Product identity
CampOS is a practical campus operating system for students, faculty and college administrators. Its interface should feel like a calm, reliable campus control surface rather than a generic enterprise CRM.

## Existing visual system (source: src/index.css and current application screens)
- Ink: #172B4D — primary text, navigation and structural surfaces.
- Blue: #386BE8 — primary actions and active navigation.
- Mint: #14A89C — focus indicator and positive campus accent.
- Paper: #F8F7F2 — application canvas.
- Violet: #7653C8 — governance and elevated permission actions.
- Supporting surfaces: white cards, slate borders and muted slate text.

## Typography
- Display / headings: Manrope, with DM Sans fallback.
- Body / controls: DM Sans.
- Keep labels compact and functional; use strong weight for hierarchy rather than oversized display text.

## Layout and interaction
- The application shell uses a deep ink sidebar, a warm paper canvas and white content panels.
- Admin workspaces use a clear page heading, short explanatory copy, bordered sections and compact status labels.
- Preserve visible keyboard focus, native form semantics, reduced-motion support and touch-friendly control heights.
- Permission actions must communicate their scope and consequences. Client-side visibility is only a usability layer; database authorization is authoritative.

## Governance signature
Use violet sparingly to distinguish role and permission management from the blue student-facing action system. Never use color alone to communicate role, status or permission.
