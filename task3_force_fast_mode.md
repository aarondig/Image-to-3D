
# Task 3 — Force “Fast / Low-Quality” Mode

## Objective
Conserve API credits by defaulting all mesh generations to `{ quality: 'fast' }` unless the user explicitly selects “High” mode.

## Backend Changes
- In `/api/create-mesh`, force payload to include:
  ```json
  { "options": { "quality": "fast" } }
  ```
- Allow override only if user passes `quality: "high"`.

## Frontend Changes
- Add a mode switch UI:
  - **Preview (fast)** — default.
  - **Full 3D (high)** — user-triggered, slower.
- Update text labels to reflect time/cost trade-offs.

## Claude Code Prompt
> In `/api/create-mesh`, default provider options to `{ quality: 'fast' }` unless client explicitly sends `quality: 'high'`. Update the UI with a mode switch (Preview vs Full 3D) that sets this flag and updates labels to reflect cost/time differences.
