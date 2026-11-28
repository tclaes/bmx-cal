# language-switch Specification

## Purpose
Defines how users see and change the interface language: the control, the locales it offers, its accessible name, and how a choice applies and persists.

## Requirements

### Requirement: Language switch is a native select
The application SHALL offer the language switch as a native select control that lists every supported locale (English, Nederlands, Français), with the current locale selected.

#### Scenario: Current locale preselected
- **WHEN** a page loads with the interface in Dutch
- **THEN** the language select shows Dutch as the selected option

#### Scenario: Every locale offered
- **WHEN** the user opens the language select
- **THEN** it offers English, Dutch and French, and nothing else

### Requirement: Changing language applies immediately and persists
Selecting a language SHALL switch the interface to that language without a page reload, and the choice SHALL still apply after reloading the page.

#### Scenario: Switching to Dutch
- **WHEN** the user selects Dutch in the language select
- **THEN** the page text changes to Dutch straight away

#### Scenario: Choice survives a reload
- **WHEN** the user has selected Dutch and reloads the page
- **THEN** the interface is still in Dutch

### Requirement: Accessible name in the current language
The language select SHALL have an accessible name in the current interface language: "Language", "Taal" or "Langue".

#### Scenario: Screen reader in French
- **WHEN** the interface is in French and the language select receives focus
- **THEN** assistive technology announces it as "Langue"

### Requirement: Available in the bar and in the mobile menu
The language select SHALL be shown in the navigation bar on desktop widths (1024px and wider) and in the mobile menu below that width, as one control per context.

#### Scenario: Desktop
- **WHEN** the navigation bar is shown at 1280px
- **THEN** it contains exactly one language select, vertically centred with the navigation links and no taller than them

#### Scenario: Mobile menu
- **WHEN** the user opens the mobile menu at 375px
- **THEN** the menu contains one language select with a touch target of at least 44px, showing full language names
