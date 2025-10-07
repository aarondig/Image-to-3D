
# Task 1 — Queue-Only Fallback (TripoSR → Tripo3D)

## Objective
Implement a **queue-only fallback**: the app first attempts to generate with **TripoSR (free)**, and only if the job remains **QUEUED for more than 8–16 seconds**, automatically switch to **Tripo3D (paid)**. Once the job transitions to `RUNNING`, fallback must be disabled and the initial provider continues to completion.

## Technical Design
- Extend `/api/create-mesh` and `/api/status` to support the fallback mechanism.
- Preserve existing fields (`status`, `progress`, `message`, `asset`, `error`) for backward compatibility.
- Add metadata fields: `provider`, `stage`, `queueWaitMs`, `fallback`.

```json
{
  "taskId": "job_123",
  "provider": "tripoSR",
  "status": "QUEUED",
  "stage": "QUEUE",
  "queueWaitMs": 8000,
  "fallback": { "attempted": false },
  "asset": null
}
```

## Fallback Logic
1. When `/api/create-mesh` is called, initialize job:
    - `provider = tripoSR`
    - `status = QUEUED`
    - `stage = QUEUE`
    - Store `queueStartedAt = Date.now()`

2. Polling (`/api/status`):
    - If provider returns `QUEUED`, calculate `queueWaitMs`.
    - If `queueWaitMs >= 6000–12000ms` and no fallback attempted → **trigger fallback to Tripo3D**.
    - If provider returns `RUNNING` → **lock fallback**, continue job normally.
    - If `FAILED` before `RUNNING`, fallback once (`reason: 'primary-failed'`).

3. Fallback Process:
    - Create a new Tripo3D job.
    - Retain same `taskId` for frontend.
    - Update:
      ```ts
      fallback = { attempted: true, reason: 'queue-timeout', attemptedAt: Date.now() }
      provider = 'tripo3D';
      stage = 'FALLBACK';
      ```

4. Once job succeeds or fails, set `stage` to `COMPLETE` or `ERROR`.

## Example State Transitions
| Stage        | Status    | Provider | Action                        |
|---------------|-----------|-----------|--------------------------------|
| INIT          | QUEUED    | tripoSR   | Job created                    |
| QUEUE         | QUEUED    | tripoSR   | Waiting in queue               |
| FALLBACK      | QUEUED    | tripo3D   | Fallback triggered             |
| GENERATE      | RUNNING   | tripoSR   | Job started (no fallback)      |
| COMPLETE      | SUCCEEDED | tripoSR   | Finished successfully          |
| ERROR         | FAILED    | tripoSR   | Failed (may fallback)          |

## UI/UX Considerations
These will be initial and will be overwritten later when I design the UI in Figma.
- Show provider chip: “Using TripoSR” or “Switched to Tripo3D”.
- Display queue timer (e.g., `8s waiting…`).
- Timeline visualization: INIT → QUEUE → (FALLBACK) → GENERATE → COMPLETE.

## Claude Code Prompt
> Implement queue-only fallback in `/api/create-mesh` and `/api/status`. Fallback triggers only if status=QUEUED >6–12s. If job enters RUNNING, fallback is locked. Extend API responses with `provider`, `stage`, `queueWaitMs`, and `fallback`. Maintain original fields for compatibility. Add tests covering all fallback paths.
