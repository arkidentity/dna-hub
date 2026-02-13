# White Labeling Implementation Plan for Daily DNA App

## Context

The Daily DNA app currently has ARK Identity branding hardcoded throughout (colors, logos, metadata). Churches implementing DNA discipleship need the app to reflect their own branding to create a cohesive experience for their disciples. The database schema already has `church_id` and `church_subdomain` fields prepared in `disciple_app_accounts`, but they're unused. This plan implements subdomain-based white labeling with logo and color customization.

**User Requirements:**
- Subdomain-based routing (e.g., `fbchurch.dailydna.app`)
- Logo and primary/accent color customization per church
- Auto-assign church when signing up via subdomain
- Settings menu option for root domain signups to select church
- No separate deployments (single codebase, multi-tenant)

## Proposed Architecture

### High-Level Flow

```
User visits: fbchurch.dailydna.app
     ↓
Middleware detects subdomain → Looks up church in database
     ↓
Church theme config loaded (logo_url, primary_color, accent_color)
     ↓
Theme injected via CSS variables + metadata
     ↓
User signs up → church_id auto-assigned from subdomain
     ↓
App renders with church branding
```

### Key Components

1. **Database Schema Updates** - Add branding fields to churches table
2. **Middleware Layer** - Detect subdomain, load church config
3. **Theme System** - Dynamic CSS variable injection
4. **Auth Flow Updates** - Auto-assign church_id from subdomain
5. **Church Settings UI** (Hub) - Admin interface for branding config
6. **Church Selection** (App) - Settings menu for root domain users
7. **Asset Storage** - Upload/serve church logos via Supabase Storage

---

## Implementation Plan

### Phase 1: Database Schema (Migration 051)

**File:** `/dna-hub/database/051_church_branding.sql`

```sql
-- Add branding fields to churches table
ALTER TABLE churches
ADD COLUMN IF NOT EXISTS subdomain TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#143348',
ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#e8b562',
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Create index for subdomain lookups
CREATE INDEX IF NOT EXISTS idx_churches_subdomain
ON churches(subdomain) WHERE subdomain IS NOT NULL;

-- Create church_branding_settings table for extended config
CREATE TABLE church_branding_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Metadata
  app_title TEXT DEFAULT 'DNA Daily',
  app_description TEXT DEFAULT 'Daily discipleship tools',

  -- Advanced colors (optional)
  text_color TEXT,
  background_color TEXT,

  -- PWA settings
  theme_color TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_church_branding_church ON church_branding_settings(church_id);

-- RPC function to fetch church branding by subdomain
CREATE OR REPLACE FUNCTION get_church_branding_by_subdomain(p_subdomain TEXT)
RETURNS TABLE (
  church_id UUID,
  church_name TEXT,
  subdomain TEXT,
  logo_url TEXT,
  primary_color TEXT,
  accent_color TEXT,
  app_title TEXT,
  app_description TEXT,
  theme_color TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.subdomain,
    c.logo_url,
    c.primary_color,
    c.accent_color,
    COALESCE(cbs.app_title, 'DNA Daily'),
    COALESCE(cbs.app_description, 'Daily discipleship tools'),
    COALESCE(cbs.theme_color, c.primary_color)
  FROM churches c
  LEFT JOIN church_branding_settings cbs ON c.id = cbs.church_id
  WHERE c.subdomain = p_subdomain;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_church_branding_by_subdomain TO anon;
GRANT EXECUTE ON FUNCTION get_church_branding_by_subdomain TO authenticated;
```

**Files to create:**
- `/dna-hub/database/051_church_branding.sql`

**Files to update:**
- `/dna-hub/database/README.md` - Document migration 051

---

### Phase 2: Middleware for Subdomain Detection

**File:** `/daily-dna/middleware.ts` (new file)

Create Next.js middleware to:
1. Extract subdomain from request headers
2. Fetch church branding from Supabase
3. Store in cookie for client access
4. Set response headers for theme color

```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const subdomain = getSubdomain(hostname);

  // Skip middleware for root domain or www
  if (!subdomain || subdomain === 'www') {
    return NextResponse.next();
  }

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    // ... cookie handling
  );

  // Fetch church branding
  const { data: branding } = await supabase
    .rpc('get_church_branding_by_subdomain', { p_subdomain: subdomain });

  if (branding && branding.length > 0) {
    const response = NextResponse.next();

    // Store church config in cookie (encrypted)
    response.cookies.set('church_config', JSON.stringify(branding[0]), {
      httpOnly: false, // Client needs to read it
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    // Set theme-color header for PWA
    response.headers.set('X-Church-Theme-Color', branding[0].theme_color);

    return response;
  }

  // Invalid subdomain - redirect to root or show error
  return NextResponse.redirect(new URL('https://dailydna.app'));
}

function getSubdomain(hostname: string): string | null {
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    return parts[0]; // e.g., "fbchurch" from "fbchurch.dailydna.app"
  }
  return null;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json).*)',
  ],
};
```

**Files to create:**
- `/daily-dna/middleware.ts`

**Dependencies to install:**
- `@supabase/ssr` (for server-side Supabase client with cookie handling)

---

### Phase 3: Dynamic Theme System

**File:** `/daily-dna/lib/theme.ts` (new file)

```typescript
export interface ChurchTheme {
  church_id: string;
  church_name: string;
  subdomain: string;
  logo_url: string | null;
  primary_color: string;
  accent_color: string;
  app_title: string;
  app_description: string;
  theme_color: string;
}

export function getChurchTheme(): ChurchTheme | null {
  if (typeof window === 'undefined') return null;

  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('church_config='));

  if (!cookie) return null;

  try {
    return JSON.parse(decodeURIComponent(cookie.split('=')[1]));
  } catch {
    return null;
  }
}

export function applyTheme(theme: ChurchTheme) {
  const root = document.documentElement;

  // Set CSS variables
  root.style.setProperty('--primary-color', theme.primary_color);
  root.style.setProperty('--accent-color', theme.accent_color);
  root.style.setProperty('--head', theme.primary_color); // 3D framework
  root.style.setProperty('--hands', theme.accent_color);

  // Update meta theme-color
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', theme.theme_color);
  }

  // Update title
  document.title = theme.app_title;
}

export const DEFAULT_THEME: ChurchTheme = {
  church_id: '',
  church_name: 'DNA Daily',
  subdomain: '',
  logo_url: null,
  primary_color: '#143348',
  accent_color: '#e8b562',
  app_title: 'DNA Daily',
  app_description: 'Daily discipleship tools',
  theme_color: '#143348',
};
```

**File:** `/daily-dna/components/ThemeProvider.tsx` (new file)

```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getChurchTheme, applyTheme, DEFAULT_THEME } from '@/lib/theme';
import type { ChurchTheme } from '@/lib/theme';

const ThemeContext = createContext<ChurchTheme>(DEFAULT_THEME);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ChurchTheme>(DEFAULT_THEME);

  useEffect(() => {
    const churchTheme = getChurchTheme();
    if (churchTheme) {
      setTheme(churchTheme);
      applyTheme(churchTheme);
    }
  }, []);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
```

**Update:** `/daily-dna/app/layout.tsx`

Add ThemeProvider wrapper:
```typescript
import { ThemeProvider } from '@/components/ThemeProvider';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**Update:** `/daily-dna/app/globals.css`

Replace hardcoded colors with CSS variables:
```css
/* Replace existing color definitions */
:root {
  --primary-color: #143348;  /* Default, overridden by theme */
  --accent-color: #e8b562;   /* Default, overridden by theme */

  /* 3D Framework - use theme colors */
  --head: var(--primary-color);
  --heart: #5f0c0b;  /* Keep maroon for heart */
  --hands: var(--accent-color);

  /* Update all references to use variables */
  --ark-navy: var(--primary-color);
  --ark-gold: var(--accent-color);
}
```

**Files to create:**
- `/daily-dna/lib/theme.ts`
- `/daily-dna/components/ThemeProvider.tsx`

**Files to update:**
- `/daily-dna/app/layout.tsx`
- `/daily-dna/app/globals.css`

---

### Phase 4: Auth Flow - Auto-assign Church ID

**Update:** `/daily-dna/lib/auth.js`

Modify `ensureDiscipleAccount()` to:
1. Check for church_config cookie
2. Auto-populate `church_id` and `church_subdomain` on signup

```javascript
async function ensureDiscipleAccount(user) {
  // ... existing code ...

  // Extract church info from cookie (set by middleware)
  const churchConfig = getChurchThemeFromCookie(); // Helper function

  const accountData = {
    id: user.id,
    email: user.email,
    display_name: user.user_metadata?.name || user.email.split('@')[0],
    auth_provider: provider,
    email_verified: user.email_confirmed_at ? true : false,
    is_active: true,
    church_id: churchConfig?.church_id || null,  // NEW
    church_subdomain: churchConfig?.subdomain || null,  // NEW
  };

  // Upsert with church fields
  const { error } = await supabase
    .from('disciple_app_accounts')
    .upsert(accountData, { onConflict: 'id' });

  // ... rest of function ...
}
```

**Files to update:**
- `/daily-dna/lib/auth.js`

---

### Phase 5: Church Branding Admin UI (DNA Hub)

**File:** `/dna-hub/src/components/admin/BrandingTab.tsx` (new component)

Create admin UI for:
- Setting church subdomain (validated for uniqueness)
- Uploading logo (Supabase Storage, reuse upload pattern from ResourcesTab)
- Color pickers for primary/accent colors
- Preview of app with church branding
- App title/description customization

**API Routes to create:**

**File:** `/dna-hub/src/app/api/admin/branding/route.ts`
```typescript
// GET - Fetch church branding settings
// POST - Update church branding settings
```

**File:** `/dna-hub/src/app/api/admin/branding/upload-logo/route.ts`
```typescript
// POST - Upload church logo to Supabase Storage
// Pattern: Follow ResourcesTab upload implementation
// Bucket: Create new "church-logos" bucket
// Naming: {church_id}/{timestamp}.{ext}
// Max size: 5MB
// Allowed types: PNG, JPG, SVG
```

**Supabase Storage Bucket:**
- Create `church-logos` bucket (public read, admin write)
- Store as: `church-logos/{church_id}/logo.{ext}`
- Return public URL for `churches.logo_url`

**Files to create:**
- `/dna-hub/src/components/admin/BrandingTab.tsx`
- `/dna-hub/src/app/api/admin/branding/route.ts`
- `/dna-hub/src/app/api/admin/branding/upload-logo/route.ts`

**Files to update:**
- `/dna-hub/src/app/admin/page.tsx` - Add BrandingTab to admin dashboard

**Reference implementations:**
- `/dna-hub/src/components/admin/ResourcesTab.tsx` - File upload pattern
- `/dna-hub/src/app/api/admin/resources/upload/route.ts` - Storage upload logic

---

### Phase 6: Church Selection UI (Daily DNA Settings)

**File:** `/daily-dna/components/ChurchSelector.tsx` (new component)

For users who sign up at root domain (dailydna.app):
- Add "Church Affiliation" section in profile/settings
- Dropdown to select church (fetch from `/api/churches` endpoint)
- Save selection updates `church_id` in `disciple_app_accounts`
- Refresh theme on selection

**API Route:**

**File:** `/daily-dna/app/api/churches/route.ts` (new route)
```typescript
// GET - List all churches with active subdomains
// Returns: [{ id, name, subdomain, logo_url }]
// RLS: Public read (anon access)
```

**Update:** `/daily-dna/app/profile/page.tsx`
- Add ChurchSelector component below existing profile fields
- Show current church if set
- Allow change with confirmation

**Files to create:**
- `/daily-dna/components/ChurchSelector.tsx`
- `/daily-dna/app/api/churches/route.ts`

**Files to update:**
- `/daily-dna/app/profile/page.tsx`

---

### Phase 7: Logo Display

**Update:** `/daily-dna/components/Header.tsx` (or equivalent)

Replace hardcoded ARK logo with dynamic church logo:
```tsx
import { useTheme } from '@/components/ThemeProvider';

function Header() {
  const theme = useTheme();

  return (
    <header>
      {theme.logo_url ? (
        <img src={theme.logo_url} alt={theme.church_name} className="h-10" />
      ) : (
        <span className="text-xl font-bold">{theme.app_title}</span>
      )}
    </header>
  );
}
```

**Files to update:**
- All header/navigation components that show logo
- `/daily-dna/app/page.tsx` - Splash/landing logo
- `/daily-dna/components/auth/*` - Auth screens with logo

---

### Phase 8: DNS & Deployment

**Vercel/Hosting Configuration:**

1. **Wildcard DNS:** Point `*.dailydna.app` → Vercel
2. **Vercel Domain Settings:** Add wildcard domain `*.dailydna.app`
3. **Environment Variables:** No changes needed (single Supabase instance)

**No code changes required** - middleware handles routing automatically.

---

## Database Trigger (Auto-link to Group)

**Migration 051 addition:**

```sql
-- Auto-populate church_id when disciple joins a group
CREATE OR REPLACE FUNCTION auto_assign_church_from_group()
RETURNS TRIGGER AS $$
BEGIN
  -- When a disciple is added to a group, update their app account
  UPDATE disciple_app_accounts
  SET
    church_id = (
      SELECT church_id FROM dna_groups WHERE id = NEW.group_id
    ),
    church_subdomain = (
      SELECT subdomain FROM churches
      WHERE id = (SELECT church_id FROM dna_groups WHERE id = NEW.group_id)
    )
  WHERE disciple_id = NEW.disciple_id
  AND church_id IS NULL; -- Only if not already set

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_assign_church
AFTER INSERT ON group_disciples
FOR EACH ROW
EXECUTE FUNCTION auto_assign_church_from_group();
```

This ensures disciples who:
1. Sign up at root domain (no church assigned)
2. Later get added to a group by a leader
→ Automatically get church_id populated

---

## Critical Files Summary

### Files to Create (12 new files):
1. `/dna-hub/database/051_church_branding.sql`
2. `/daily-dna/middleware.ts`
3. `/daily-dna/lib/theme.ts`
4. `/daily-dna/components/ThemeProvider.tsx`
5. `/daily-dna/components/ChurchSelector.tsx`
6. `/daily-dna/app/api/churches/route.ts`
7. `/dna-hub/src/components/admin/BrandingTab.tsx`
8. `/dna-hub/src/app/api/admin/branding/route.ts`
9. `/dna-hub/src/app/api/admin/branding/upload-logo/route.ts`

### Files to Update (6 existing files):
1. `/dna-hub/database/README.md`
2. `/daily-dna/app/layout.tsx`
3. `/daily-dna/app/globals.css`
4. `/daily-dna/lib/auth.js`
5. `/daily-dna/app/profile/page.tsx`
6. `/dna-hub/src/app/admin/page.tsx`

### Dependencies to Install:
```bash
# Daily DNA
cd /Users/docgrfx/Documents/GitHub/dna-app/daily-dna
npm install @supabase/ssr
```

---

## Testing & Verification

### Database Testing:
1. Apply migration 051 in Supabase SQL Editor
2. Create test church: `INSERT INTO churches (name, subdomain, primary_color, accent_color) VALUES ('Test Church', 'testchurch', '#ff0000', '#00ff00');`
3. Upload test logo via Hub admin UI
4. Verify RPC: `SELECT * FROM get_church_branding_by_subdomain('testchurch');`

### Middleware Testing:
1. Run dev server: `npm run dev`
2. Add test subdomain to `/etc/hosts`: `127.0.0.1 testchurch.localhost`
3. Visit `http://testchurch.localhost:3000`
4. Check browser cookies for `church_config`
5. Verify theme colors applied in DevTools

### Auth Flow Testing:
1. Sign up new account via subdomain
2. Check `disciple_app_accounts` table for `church_id` and `church_subdomain` populated
3. Sign up via root domain, verify church_id is NULL
4. Use church selector in settings, verify update

### End-to-End Testing:
1. Create church in Hub with branding
2. Visit church subdomain
3. Sign up new disciple account
4. Verify church colors/logo display
5. Test all major pages render correctly with theme
6. Verify PWA manifest uses church theme color

### Production Deployment:
1. Set up wildcard DNS: `*.dailydna.app` → Vercel
2. Add domain in Vercel: `*.dailydna.app`
3. Deploy and verify SSL cert generation for subdomains
4. Test multiple church subdomains concurrently

---

## Rollback Plan

If issues arise, rollback is safe:
1. Database changes are additive (no data loss)
2. Middleware can be disabled by removing `/middleware.ts`
3. ThemeProvider wraps existing components (remove wrapper to revert)
4. Auth changes are backward-compatible (NULL church_id still works)

---

## Future Enhancements (Out of Scope)

- Custom domains per church (e.g., `dna.firstbaptist.org`)
- Dark mode per-church theme
- Font family customization
- Advanced PWA manifest per church (custom icons/names)
- Church-specific content filtering
- Analytics per church subdomain
