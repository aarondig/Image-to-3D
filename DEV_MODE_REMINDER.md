# ⚠️ DEV MODE REMINDER

## Before Deploying to Production

**CRITICAL:** Check the following environment variable settings:

### Credit Limit Bypass

The app has a development mode that **bypasses credit limits** for testing.

**Current Status:** Check your `.env.local` or Vercel environment variables

```bash
# Development (unlimited generations)
DEV_MODE_BYPASS_LIMITS=true

# Production (3 generations/day limit enforced)
DEV_MODE_BYPASS_LIMITS=false
# OR remove the variable entirely
```

### Pre-Deployment Checklist

- [ ] Set `DEV_MODE_BYPASS_LIMITS=false` in production environment
- [ ] Verify credit limits are working (test with new session)
- [ ] Check that cookie-based session tracking is functional
- [ ] Test credit badge shows correct count in header
- [ ] Confirm 402 error shows proper message when limit reached

### How to Test Credit Limits

1. Clear browser cookies
2. Set `DEV_MODE_BYPASS_LIMITS=false` in `.env.local`
3. Restart dev server
4. Try creating 4 generations (should block on 4th)
5. Verify error message: "Daily generation limit reached"

### Location of Dev Mode Check

File: `api/lib/credits.ts:75-80`

```typescript
export function hasExceededLimit(sessionId: string, limit: number = 3): boolean {
  // DEV MODE: Check for bypass flag
  const devModeBypass = process.env.DEV_MODE_BYPASS_LIMITS === 'true';
  if (devModeBypass) {
    console.log('⚠️ DEV MODE: Credit limits bypassed');
    return false;
  }
  // ...
}
```

---

**Remember:** Leaving dev mode enabled in production will allow unlimited API usage and could result in unexpected costs!
