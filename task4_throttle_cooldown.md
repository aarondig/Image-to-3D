
# Task 4 — Throttle High-Cost Calls (30s Cooldown + Countdown)

## Objective
Prevent rapid repeated calls to the Tripo API and visually communicate cooldown time.

## Requirements
- 30s cooldown between `/api/create-mesh` calls.
- Show live countdown timer on the Generate button.
- Prevent concurrent jobs.

## Implementation
```ts
const COOLDOWN_MS = 30000;
const [nextAllowedAt, setNextAllowedAt] = useState(0);

async function handleGenerate() {
  const now = Date.now();
  if (now < nextAllowedAt) return;
  setNextAllowedAt(now + COOLDOWN_MS);
  startGeneration();
}

useEffect(() => {
  const timer = setInterval(() => {
    const remaining = Math.max(0, nextAllowedAt - Date.now());
    setCountdown(Math.ceil(remaining / 1000));
  }, 1000);
  return () => clearInterval(timer);
}, [nextAllowedAt]);
```

## UI
- Show countdown overlay on button: “Retry in 27s”.
- Disable button during cooldown.

## Claude Code Prompt
> Implement a 30s cooldown between `/api/create-mesh` calls. Store `nextAllowedAt` in state, disable button until time passes, and render countdown (mm:ss). Prevent concurrent calls. Add tests for edge cases (tab refocus, system clock drift).
