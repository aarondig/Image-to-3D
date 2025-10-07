
# Task 5 — Credit Budget Gate (3 Generations / Day)

## Objective
Limit users to 3 mesh generations per day and show remaining credits in the UI.

## Backend
- Use cookie `sid` for pseudo-auth.
- KV store structure:
  ```
  credits:{sid}:{date} = usage_count
  ```
- Add `/api/credits` returning:
  ```json
  { "remainingMesh": 2, "dailyMeshLimit": 3 }
  ```
- Block `/api/create-mesh` when limit reached.

## Frontend
- Fetch `/api/credits` on load.
- Show “2/3 generations left” badge.
- Disable Generate button at 0.

## Claude Code Prompt
> Implement daily credit tracking using cookie-based `sid`. Add `/api/credits` endpoint returning remaining mesh generations. Modify `/api/create-mesh` to block when usage >= 3/day with HTTP 402. Display remaining credits in UI header and disable generation when exhausted.
