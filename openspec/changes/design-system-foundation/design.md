## Context

Design B was explored in a Claude Design artifact (mobile 390x844 and desktop 1440). Reference exports must be copied to `design/` in this change before implementation starts (see tasks).

## Goals / Non-Goals

**Goals:** one token layer that all components use; race type colours defined once; mobile first; AA contrast on the dark surfaces.
**Non-Goals:** converting the screens, new features, light theme, changing data or registration logic.

## Decisions

- **Tokens as CSS custom properties** in `variables.css` (already the project convention); no CSS-in-JS, no new dependency.
- **Palette:** background #14171C / #1E232B / #1A1E25; text #F3F5F7, secondary #B4BCC8 / #9AA3B2; cyan #1C9AD6 / #4DB8EE / #8FD0F2; orange #FF7A2B / #F26B1D / #FF8A3D; start-light green #35D07F.
- **Type colours** (label bg / fg / stripe / dot ring): CV #FFE922 / #111111 / #111111 / #FFE922; TC #DDEEFF / #111111 / black-yellow-red gradient / #DDEEFF; CW #C81E2B / #FFFFFF / #FFD500 / #F0555B; 3NC #FFFFFF / #111111 / #111111 / #FFFFFF; EC #1F4FD8 / #FFFFFF / #FFFFFF / #6C8FF0; WC #FFFFFF / #111111 / rainbow gradient / #2AA5E0. Based on the JSTiming organiser logos; the CW red/yellow is not from a logo and can be revisited.
- **Fonts:** Barlow and Barlow Condensed stay (already loaded). The wordmark in the logo is outlined into the SVG so no extra font loads.
- **RaceRow:** stretched-link pattern. The title is the only anchor; `::after` covers the row; the action slot is `position: relative; z-index: 1` so the registration link sits above it.
- **State source:** components receive a status prop derived from `registration-status.ts`; they never compute dates themselves.

## Risks / Trade-offs

- Existing screens look mixed until `redesign-calendar-screens` lands. Mitigation: token swap behind one PR, review on a deploy preview, keep the old screens usable.
- Navy EC/CW labels were hard to tell apart; mitigated by distinct colour and stripe, verify on a real phone.
