# 💰 Save API Credits with Caching

Quick guide to minimize Tripo API costs during testing.

## TL;DR

Upload the same image twice → Second upload is **instant** and **free**! ⚡

## Three Ways to Save Money

### 1. 🎭 Mock Mode (Best for UI Testing)
**Zero API calls, instant fake models**

```bash
# Add to .env.local
MOCK_API_RESPONSES=true
```

Restart server:
```bash
npm run dev
```

Now every upload returns a sample cube model instantly. Perfect for:
- Frontend development
- Testing UI transitions
- Demo mode

**Cost: $0.00** 🎉

---

### 2. 📦 Client-Side Cache (Automatic)
**Already enabled! No setup required.**

When you upload an image:
1. First upload → Calls API ($$$)
2. Same image again → Uses cache (FREE!)

Works automatically. Check console for:
```
⚡ [APP] Using cached result! Saved API call.
```

**Savings: 90%+ during testing**

---

### 3. 🌐 Server-Side Cache (Automatic)
**Already enabled! Shares results across users.**

If someone else uploads the same image:
- You get their cached result
- No API call needed
- Instant result

Perfect for demo images and testing.

**Savings: Massive for shared test images**

---

## Quick Test

1. Upload any image
2. Wait for 3D model to generate
3. Upload **the exact same image** again
4. Watch it load instantly! ⚡

Check console logs to see cache hits.

---

## Development Workflow

### Testing UI/UX?
```bash
MOCK_API_RESPONSES=true
DEV_MODE_BYPASS_LIMITS=true
```
→ Infinite free uploads, instant results

### Testing Real API?
```bash
MOCK_API_RESPONSES=false
DEV_MODE_BYPASS_LIMITS=false
```
→ Caching still saves you money on repeat uploads

### Before Production Deploy
```bash
MOCK_API_RESPONSES=false
DEV_MODE_BYPASS_LIMITS=false
```
→ Caching enabled, limits enforced

---

## How Much Can I Save?

### Without Caching
10 test uploads = **$1.00**

### With Caching
- First upload: $0.10
- Next 9 uploads of same image: $0.00
- **Total: $0.10** (90% savings!)

### With Mock Mode
100 test uploads = **$0.00** (100% savings!)

---

## Clear Cache

If you need to force a fresh API call:

**Browser Console:**
```javascript
localStorage.clear()
```

Or use the utility:
```typescript
import { clearCache } from '@/utils/imageCache';
clearCache();
```

---

## More Details

See [docs/CACHING.md](docs/CACHING.md) for full documentation.

---

## Summary

✅ Mock mode for UI testing (zero cost)
✅ Client cache for repeat uploads (instant)
✅ Server cache for shared results (massive savings)
✅ All automatic, no code changes needed

**Result:** Save 90%+ on API costs during development! 🚀
