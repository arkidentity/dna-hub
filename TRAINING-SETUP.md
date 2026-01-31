# DNA Training Platform - Setup & Testing Guide

## Issue: Magic Link Emails Not Sending

### Root Cause
Missing `.env.local` file with required environment variables.

---

## Quick Fix for Testing (No Email Service Needed)

Since you're in development, the API returns the magic link directly in the response when `RESEND_API_KEY` is not configured. This is actually perfect for testing!

### Step 1: Create Basic .env.local

Create a file called `.env.local` in the project root with your Supabase credentials:

```bash
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email (optional for dev - if missing, link is returned in API response)
# RESEND_API_KEY=re_your_api_key

# App URL (optional, defaults to localhost:3000 in dev)
# NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 2: Run Database Migrations

Make sure your Supabase database has the required tables by running these migrations in your Supabase SQL Editor:

1. `database/022_dna-training-system.sql` - Creates training tables and roles
2. `database/024_training-magic-links.sql` - Creates magic link tokens table

### Step 3: Test Signup (Dev Mode)

Run the test script:

```bash
# Make sure dev server is running
npm run dev

# In another terminal, run the test
node test-training-signup.js
```

The script will output something like:

```
✅ DEV MODE: Magic link generated!

🔗 Click this link to log in:

http://localhost:3000/api/training/verify?token=abc123...
```

Just click that link to log in!

---

## Full Production Setup (With Email Service)

### Step 1: Get Resend API Key

1. Go to https://resend.com
2. Sign up for free account
3. Create an API key
4. Verify your domain (or use their test domain for development)

### Step 2: Update .env.local

Add the Resend API key:

```bash
RESEND_API_KEY=re_your_actual_key_here
```

### Step 3: Test With Real Emails

Now when you sign up or log in, you'll receive actual emails to your inbox!

---

## Testing Checklist

- [ ] `.env.local` file created with Supabase credentials
- [ ] Database migrations run in Supabase
- [ ] Dev server running (`npm run dev`)
- [ ] Test script runs successfully (`node test-training-signup.js`)
- [ ] Magic link works (redirects to training dashboard)
- [ ] (Optional) Resend API key added for real email delivery

---

## Troubleshooting

### "Supabase configuration missing" error
- Check that `.env.local` has all Supabase environment variables
- Restart your dev server after adding env variables

### "Invalid or expired link" error
- Magic links expire after 24 hours
- Each link can only be used once
- Request a new link from the login page

### "An account with this email already exists"
- User already signed up
- Use the login page instead: http://localhost:3000/training/login

### Emails not arriving (with Resend configured)
- Check Resend dashboard for delivery logs
- Verify email domain in Resend
- Check spam folder
- Look for email logs in your dev server console

---

## Next Steps After Login

Once you log in successfully, you'll be redirected to:
- `/training/page.tsx` - Your training dashboard
- Complete the Flow Assessment
- Unlock DNA Manual
- Progress through Launch Guide
- Eventually create your first DNA Group!

---

## Admin Access

Your email (thearkidentity@gmail.com) is already configured as an admin in the codebase, so you'll have full access to all training features.
