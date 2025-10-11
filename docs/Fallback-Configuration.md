# TripoSR → Tripo3D Fallback Configuration

## Overview

The app uses **TripoSR (free tier)** as the primary 3D generation engine, with automatic fallback to **Tripo3D (paid tier)** if the queue is too long.

## How It Works

### 1. **Primary Engine: TripoSR (Free)**
- All jobs start with TripoSR model (`v2.0-20240919`)
- Completely free to use
- May have longer queue times during peak usage

### 2. **Fallback Engine: Tripo3D (Paid)**
- Automatically triggered if TripoSR queue exceeds threshold
- **Default threshold: 16 seconds**
- Uses paid API credits
- Generally faster with shorter queues

### 3. **Fallback Logic**
```
User uploads image
  ↓
Create TripoSR job
  ↓
Poll status every 5 seconds
  ↓
If QUEUED for > 16 seconds:
  ↓
Create new Tripo3D job (fallback)
  ↓
Continue polling Tripo3D job
  ↓
Complete
```

## Environment Variables

Add these to your `.env.local` file (copy from `.env.example`):

### `FALLBACK_THRESHOLD_MS`
**Default:** `16000` (16 seconds)

Time in milliseconds before triggering fallback from TripoSR to Tripo3D.

```bash
# Wait 30 seconds before fallback
FALLBACK_THRESHOLD_MS=30000

# Wait 10 seconds before fallback
FALLBACK_THRESHOLD_MS=10000
```

### `DISABLE_FALLBACK`
**Default:** `false`

Set to `true` to completely disable fallback and only use TripoSR (for testing).

```bash
# Test with TripoSR only (no fallback to Tripo3D)
DISABLE_FALLBACK=true
```

## Testing TripoSR Only

To test exclusively with TripoSR (free tier) and prevent any Tripo3D API calls:

1. Add to your `.env.local`:
   ```bash
   DISABLE_FALLBACK=true
   ```

2. Restart your development server:
   ```bash
   npm run dev
   ```

3. Upload an image and generate a model
4. Even if queued for a long time, it will wait for TripoSR (no fallback)

## Production Recommendations

### Conservative (Save Credits)
```bash
FALLBACK_THRESHOLD_MS=30000  # Wait 30 seconds
```

### Balanced (Default)
```bash
FALLBACK_THRESHOLD_MS=16000  # Wait 16 seconds
```

### Aggressive (Better UX, More Cost)
```bash
FALLBACK_THRESHOLD_MS=10000  # Wait 10 seconds
```

## Monitoring

Check server logs for fallback activity:

```bash
# Fallback disabled
⚠️ [FALLBACK] Fallback disabled via DISABLE_FALLBACK env var

# Checking threshold
[FALLBACK] Queue wait: 12000ms, threshold: 16000ms

# Fallback triggered
🚨 [STATUS] Fallback threshold reached! Triggering fallback to Tripo3D
🔄 [FALLBACK] Triggering fallback to Tripo3D (reason: queue-timeout)
✅ [FALLBACK] Fallback job created - newTaskId: abc123
```

## Cost Optimization

TripoSR is **completely free**, while Tripo3D consumes paid credits.

To minimize costs:
1. Increase `FALLBACK_THRESHOLD_MS` to wait longer for TripoSR
2. Set `DISABLE_FALLBACK=true` to never use Tripo3D
3. Monitor your Tripo API dashboard for credit usage

## Troubleshooting

### "Job stuck in queue forever"
- Check if `DISABLE_FALLBACK=true` is set
- TripoSR queue may be very long during peak times
- Either wait or enable fallback

### "Using too many credits"
- Increase `FALLBACK_THRESHOLD_MS` to wait longer
- Consider setting `DISABLE_FALLBACK=true` for testing
- Check if many users are experiencing long queues

### "Fallback not triggering"
- Ensure `DISABLE_FALLBACK` is not set to `true`
- Check server logs for `[FALLBACK]` messages
- Verify job is actually in QUEUED state (not RUNNING)
