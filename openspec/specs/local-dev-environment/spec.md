# local-dev-environment Specification

## Purpose

Defines which backend each development command targets, so that running the app locally is the default and the production Supabase project is only reached on purpose.

## Requirements

### Requirement: Default dev command targets the local stack
`npm run dev` SHALL serve the app at http://localhost:5173 against the local Supabase test stack, using the connection values written by `npm run test-env:start`.

#### Scenario: Stack is running
- **WHEN** the developer has run `npm run test-env:start` and then runs `npm run dev`
- **THEN** the app is served at http://localhost:5173 and signs in with the seeded test users against the local stack

#### Scenario: Production values exist in `.env`
- **WHEN** `.env` contains production Supabase values and the local stack env file exists
- **THEN** `npm run dev` uses the local stack values, not the values in `.env`

### Requirement: Dev command refuses to fall back to production
`npm run dev` SHALL NOT start when the local stack connection values are missing or point to a non-local host.

#### Scenario: Stack never started
- **WHEN** `.env.e2e.local` does not exist and the developer runs `npm run dev`
- **THEN** the command exits with a non-zero status and a message telling them to run `npm run test-env:start`, and no dev server is started

#### Scenario: Non-local URL
- **WHEN** the stack env file contains a Supabase URL whose host is not localhost
- **THEN** the command exits with a non-zero status and names the offending host

### Requirement: Remote dev command is explicit
`npm run dev:remote` SHALL serve the app against the Supabase project configured in `.env` and SHALL NOT require the local stack.

#### Scenario: Opt in to the real project
- **WHEN** the developer runs `npm run dev:remote` with a valid `.env`
- **THEN** the app starts using the values from `.env`

### Requirement: Existing local-run entry points keep working
`npm run dev:e2e` SHALL behave the same as `npm run dev`, and mocked-Supabase e2e runs SHALL NOT depend on the local stack.

#### Scenario: Legacy alias
- **WHEN** the developer or Playwright runs `npm run dev:e2e`
- **THEN** it behaves exactly like `npm run dev`

#### Scenario: Mocked e2e without a stack
- **WHEN** `npm run test:e2e:mock` runs on a machine where the local stack was never started
- **THEN** the dev server starts with the injected dummy Supabase values and the tests run
