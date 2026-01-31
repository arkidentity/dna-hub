# Domain Migration Checklist
## From dna.arkidentity.com → dnadiscipleship.com

**Status:** In Progress
**Date:** January 30, 2026

---

## ✅ Completed

### 1. DNS & Hosting
- [x] Updated Vercel project to point to `dnadiscipleship.com`
- [x] Set up Cloudflare redirect from `dna.arkidentity.com` → `dnadiscipleship.com`
- [x] SSL certificate provisioned by Vercel

### 2. Code Updates
- [x] Updated `.env.example` with new domain
- [x] Updated hardcoded fallback URLs in:
  - `src/lib/email.ts` (2 references)
  - `src/app/api/cron/follow-ups/route.ts`
  - `src/app/api/admin/churches/route.ts` (2 references)
  - `src/app/api/dna-leaders/invite/route.ts`

---

## 🔄 Required Actions

### 3. Vercel Environment Variables
Update these in your Vercel dashboard (Settings → Environment Variables):

```bash
NEXT_PUBLIC_APP_URL=https://dnadiscipleship.com
GOOGLE_REDIRECT_URI=https://dnadiscipleship.com/api/auth/google/callback
```

**How to update:**
1. Go to https://vercel.com/your-project/settings/environment-variables
2. Edit both variables above
3. Redeploy the app after changing

---

### 4. Resend Email Configuration

#### Option A: Keep using @mail.arkidentity.com (Easiest)
**No changes needed!** Your current setup will continue working:
- Current FROM address: `DNA Church Hub <notifications@mail.arkidentity.com>`
- This is perfectly fine and won't affect deliverability

#### Option B: Switch to @dnadiscipleship.com (Better branding)
If you want emails to come from your new domain:

1. **Add domain in Resend:**
   - Go to https://resend.com/domains
   - Click "Add Domain"
   - Enter: `dnadiscipleship.com`

2. **Add DNS records to Cloudflare:**
   Resend will provide DNS records like:
   ```
   TXT: resend._domainkey → [DKIM value]
   TXT: @ → v=spf1 include:amazonses.com ~all
   ```
   Add these in Cloudflare DNS settings

3. **Update code** in `/src/lib/email.ts:4`:
   ```typescript
   const FROM_EMAIL = 'DNA Church Hub <notifications@dnadiscipleship.com>';
   ```

4. **Wait for verification** (usually 5-10 minutes)

5. **Test** by triggering a magic link email

**Recommendation:** Start with Option A (no changes). Switch to Option B later if desired.

---

### 5. Google OAuth Configuration

Update the authorized redirect URI in Google Cloud Console:

1. Go to https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", add:
   ```
   https://dnadiscipleship.com/api/auth/google/callback
   ```
4. Keep the old one temporarily for safety:
   ```
   https://dna.arkidentity.com/api/auth/google/callback
   ```
5. Save changes

---

### 6. Google Calendar Appointment Scheduling

If your calendar embed URLs contain `dna.arkidentity.com`, update them:

1. Go to Google Calendar → Settings → Appointment schedules
2. Review each appointment type (Discovery, Proposal Review, Strategy)
3. If needed, recreate scheduling links (they'll auto-use the new domain)
4. Update environment variables with new URLs:
   ```bash
   NEXT_PUBLIC_DISCOVERY_CALENDAR_URL=https://calendar.google.com/...
   DISCOVERY_CALENDAR_URL=https://calendar.google.com/...
   PROPOSAL_CALENDAR_URL=https://calendar.google.com/...
   STRATEGY_CALENDAR_URL=https://calendar.google.com/...
   ```

**Note:** This is only needed if the embed URLs themselves have changed.

---

## 📋 Optional Updates

### 7. Documentation Files
The following files contain old domain references but are documentation only:
- Resources and planning docs in `/resources/` and `/planning/`
- Business docs in `/business/`
- Integration docs in `/integrations/`

**Action:** Update when convenient, not urgent.

---

## ✨ Testing Checklist

After making the above changes, test these flows:

- [ ] Visit `https://dnadiscipleship.com` - site loads
- [ ] Visit `https://dna.arkidentity.com` - redirects to new domain
- [ ] Magic link login - email arrives with correct domain in links
- [ ] Assessment submission - confirmation email works
- [ ] DNA leader invitation - signup link has correct domain
- [ ] Google Calendar integration - OAuth flow works
- [ ] Admin features - church invitation emails work

---

## 🚀 Deployment Steps

1. Commit code changes:
   ```bash
   git add .
   git commit -m "Update domain references from dna.arkidentity.com to dnadiscipleship.com"
   git push
   ```

2. Update Vercel environment variables (see section 3)

3. Trigger a new deployment or wait for auto-deploy

4. Update Google OAuth settings (see section 5)

5. Test all critical flows (see testing checklist)

---

## ⚠️ Important Notes

- **Email sending will continue working** even before Resend domain verification (using current @mail.arkidentity.com)
- **Old domain will redirect** via Cloudflare, so existing links won't break
- **Environment variables** are the most critical update - magic links won't work until these are changed in Vercel
- **Google OAuth** needs the redirect URI updated or calendar sync will fail

---

## 📞 Need Help?

- **Vercel issues:** Check deployment logs in Vercel dashboard
- **Email issues:** Check Resend dashboard and logs
- **DNS issues:** Use https://dnschecker.org to verify propagation
- **OAuth issues:** Check Google Cloud Console error messages
