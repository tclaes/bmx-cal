# Spec Delta

## Purpose

Defines which callers each Supabase edge function accepts, how rejected calls are reported and which CORS headers every response carries, so access rules are stated once and can be tested.

## ADDED Requirements

### Requirement: Admin-only functions
`create-github-issue`, `reopen-github-issue`, `get-github-issue-statuses` and `analyze-pdf` SHALL accept only callers who present a valid user session whose `app_metadata.role` is `admin`.

#### Scenario: Admin calls an admin-only function
- **WHEN** a signed-in admin calls `analyze-pdf`
- **THEN** the request is processed

#### Scenario: Non-admin is rejected
- **WHEN** a signed-in user without the admin role calls `create-github-issue`
- **THEN** the response is 403 with `{"error":"Unauthorized"}`

#### Scenario: Non-admin is rejected by the other admin-only functions
- **WHEN** a signed-in user without the admin role calls `analyze-pdf` or `get-github-issue-statuses`
- **THEN** the response is 401 with `{"error":"Unauthorized"}`

#### Scenario: Anonymous key only
- **WHEN** a request carries only the project anon key as bearer
- **THEN** it is rejected as unauthenticated

### Requirement: Admin or team-manager function
`analyze-image` SHALL accept a valid user session whose role is `admin` or who is listed as a team manager.

#### Scenario: Team manager
- **WHEN** a signed-in team manager who is not an admin calls `analyze-image`
- **THEN** the request is processed

#### Scenario: Neither admin nor team manager
- **WHEN** a signed-in user who is neither admin nor team manager calls `analyze-image`
- **THEN** the response is 401 with `{"error":"Unauthorized"}`

### Requirement: Signed-in user function
`delete-account` SHALL act only on the account of the caller's own valid session.

#### Scenario: Missing or invalid session
- **WHEN** `delete-account` is called without a valid user session
- **THEN** the response is 401 with `{"error":"Unauthorized"}` and no account is touched

### Requirement: Scheduled functions
`sync-jstiming` and `search-uec-livestream` SHALL accept the scheduler (service-role key or the function's shared cron token) or an admin session, and `send-push-notifications` SHALL additionally reject a non-admin signed-in caller that is not in test mode.

#### Scenario: Scheduled run
- **WHEN** the bearer equals the service-role key or the function's cron token
- **THEN** the request is processed without a user session

#### Scenario: Unknown caller
- **WHEN** the bearer is neither a scheduler credential nor an admin session
- **THEN** the response is 401 with `{"error":"Unauthorized"}`

#### Scenario: Non-admin broadcast
- **WHEN** a signed-in non-admin calls `send-push-notifications` outside test mode
- **THEN** the response is 403 with `{"error":"Forbidden"}`

### Requirement: Public functions
`send-contact-email` and `send-password-reset` SHALL be callable without a session and SHALL validate input and rate-limit callers.

#### Scenario: Invalid input
- **WHEN** a public function receives a malformed payload
- **THEN** the response is 400

#### Scenario: Too many requests
- **WHEN** a caller exceeds the function's rate limit
- **THEN** the response is 429

### Requirement: CORS on every response
Every edge function SHALL answer `OPTIONS` preflight requests and SHALL include the same CORS headers on every response, successes and errors alike.

#### Scenario: Preflight
- **WHEN** a browser sends an `OPTIONS` request to any function
- **THEN** the response carries the CORS headers and no body processing occurs

#### Scenario: Error response
- **WHEN** any function returns an error status
- **THEN** the response still carries the CORS headers and a JSON content type
