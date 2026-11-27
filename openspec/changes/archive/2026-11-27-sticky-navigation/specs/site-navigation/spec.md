# Spec Delta

## Purpose

Defines how the global navigation bar at the top of every page behaves, so users can always reach navigation, language switching and sign-in without scrolling back up.

## ADDED Requirements

### Requirement: Navigation bar stays pinned while scrolling
The navigation bar SHALL remain visible at the top of the viewport while the page content scrolls, on every page and at every viewport width.

#### Scenario: Scrolling a long page on desktop
- **WHEN** a user on a desktop viewport (1024px or wider) scrolls down a page taller than the viewport, such as the calendar overview
- **THEN** the navigation bar remains fully visible at the top of the viewport

#### Scenario: Scrolling a long page on mobile
- **WHEN** a user on a mobile viewport (narrower than 1024px) scrolls down a page taller than the viewport
- **THEN** the navigation bar, including the menu toggle, remains fully visible at the top of the viewport

### Requirement: Mobile menu fits within the viewport
When the mobile menu is open, it SHALL fit in the viewport space below the navigation bar and SHALL scroll on its own when its items do not fit, so every menu item stays reachable.

#### Scenario: Opening the menu on a short screen
- **WHEN** a user opens the mobile menu on a viewport too short to show all menu items, after scrolling down the page
- **THEN** the user can scroll within the menu to reach and activate its last item, including the language switcher

#### Scenario: Menu fits without scrolling
- **WHEN** a user opens the mobile menu on a viewport tall enough to show all menu items
- **THEN** all menu items are visible without scrolling

### Requirement: Pinned bar does not hide navigation targets
Content that the user navigates to within a page SHALL come to rest below the pinned navigation bar, not underneath it.

#### Scenario: Following an in-page link
- **WHEN** a user follows an in-page link to a section, such as an entry in a guide page's table of contents
- **THEN** the section heading is visible below the navigation bar

#### Scenario: Using the skip link
- **WHEN** a keyboard user activates the "Skip to main content" link
- **THEN** focus moves to the main content and its start is visible below the navigation bar

### Requirement: Sticky page elements sit below the bar
Page elements that themselves stay pinned while scrolling SHALL rest below the navigation bar without being covered by it.

#### Scenario: Calendar filter sidebar on desktop
- **WHEN** a user on a desktop viewport scrolls the calendar overview
- **THEN** the filter sidebar stays fully visible below the navigation bar

### Requirement: Navigation bar layering
The pinned navigation bar SHALL render above page content and below dropdowns, modals, toasts, the cookie consent banner and the install prompt.

#### Scenario: Page content scrolls underneath
- **WHEN** a user scrolls page content past the navigation bar
- **THEN** the content passes underneath the bar and does not cover it

#### Scenario: Overlay opened while scrolled
- **WHEN** a dropdown, modal or toast opens while the pinned bar is visible
- **THEN** the overlay is displayed above the navigation bar
