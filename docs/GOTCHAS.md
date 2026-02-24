# Gotchas — DNA Hub + Daily DNA

Lessons learned the hard way. Check this before writing migrations or API routes.

---

## Next.js 15+ — `params` is a Promise

Dynamic route `params` is now a `Promise` in both API routes and page components.

**API routes:**
```ts
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // ✅
}
```

**Client pages:**
```ts
const { id } = use(params); // ✅  (React `use()` hook)
```

**Old pattern that breaks Vercel builds:**
```ts
{ params }: { params: { id: string } }  // ❌ TypeScript build failure
```

---

## Supabase — DROP + CREATE loses EXECUTE grants

When you recreate a function (required when changing its return type), grants are lost.

**Always re-add after DROP + CREATE:**
```sql
GRANT EXECUTE ON FUNCTION my_function() TO anon, authenticated;
```

**What went wrong:** Migration 059 dropped `get_church_branding_by_subdomain` and forgot to re-add grants — broke all white-label subdomain detection.

---

## Supabase — RPC column refs must exist first

If a migration adds a column reference inside an RPC function, the column must already exist in the table. The RPC compiles at migration time.

**What went wrong:** Migration 071 referenced `churches.contact_email` inside the branding RPC, but the column didn't exist yet — crashed the entire branding RPC and broke all subdomain white-labeling. Fixed by Migration 073 (added the column first).

**Rule:** When writing an RPC that touches a new column, add the column in the same migration or an earlier one.

---

## Supabase — Modifying a function's return type drops prior columns

When you update a function's return type in a later migration, you must re-include ALL columns added by prior migrations.

**What went wrong:** Migration 059 updated `get_church_branding_by_subdomain` and dropped `header_style` (added in 052), breaking logo/text header mode.

**Rule:** Copy the full SELECT column list from the previous migration version when modifying the return type.

---

## Supabase — `ON CONFLICT` with partial-index predicate is invalid PL/pgSQL

```sql
-- ❌ Invalid — partial-index predicate not supported in ON CONFLICT
INSERT INTO ... ON CONFLICT (col) WHERE condition DO UPDATE ...

-- ✅ Use IF NOT EXISTS guard instead
IF NOT EXISTS (SELECT 1 FROM table WHERE ...) THEN
  INSERT INTO ...
END IF;
```

---

## Supabase — `jsonb_set` with string-concatenated JSON breaks on timestamps

```ts
// ❌ Breaks when value contains colons (timestamps, ISO dates)
jsonb_set(col, '{key}', '"' || value || '"')

// ✅ Use jsonb_build_object() instead
jsonb_set(col, '{key}', jsonb_build_object('key', value)->'key')
```

---

## Supabase — `get_my_calendar_events()` RPC requires anon client

This RPC uses `auth.jwt()->>'email'` — it only works when a JWT is present in the request (anon client with user session).

- **Daily DNA:** uses anon client + user JWT → RPC works
- **DNA Hub:** uses admin client → null JWT → RPC returns empty/null

**Fix for Hub:** skip the RPC, use a direct query with `.eq('group_id', groupId)` filter instead.

---

## Supabase — `promote_to_dna_leader` trigger ID resolution

Trigger 022 used `NEW.leader_id` but the FK chains are:
- `user_roles.user_id` → `users.id`
- `dna_leader_journeys.user_id` → `auth.users.id`

These are different tables. Must resolve both via email lookup, not ID passthrough.

---

## Supabase — `PromiseLike` has no `.catch()`

Supabase query results return `PromiseLike`, not a full `Promise`. Chaining `.then().catch()` fails at runtime.

```ts
// ❌ Runtime error — PromiseLike has no .catch()
supabase.from('table').select('*').then(handler).catch(errHandler)

// ✅ Wrap in async IIFE
void (async () => {
  try {
    const { data, error } = await supabase.from('table').select('*');
    handler(data);
  } catch (err) {
    errHandler(err);
  }
})();
```

---

## Supabase — RLS policy changes require service role to test

RLS policies apply to `anon` and `authenticated` roles only. The service role (admin client) bypasses all RLS. Always test RLS policies using the anon client with a real user JWT — never the admin client.

**Relevant migrations:** 057–060 resolved all Supabase linter ERROR-level findings.

---

## Co-leader invitation — 3 user states

When inviting a co-leader, there are 3 cases to handle:

1. **New user** — create `users` + `user_roles` + `dna_leaders` + `co_leader_invitations`, send signup link with `co_leader_token` param
2. **Existing active leader** — send standard accept/decline email to their existing account
3. **Unactivated leader** (created but never signed up) — refresh their `signup_token` and resend the signup link

The `/groups/signup` page auto-accepts the co-leader invitation after account activation when `co_leader_token` is present in the URL.

---

## Admin client vs. anon client — when to use which

| Use case | Client |
|---|---|
| Hub API routes (server-side) | Admin client (`getSupabaseAdmin()`) |
| Daily DNA API routes | Admin client for writes; anon client for RPC calls that need JWT |
| RPC that uses `auth.jwt()` | Anon client only |
| Seeding / migrations | Admin client |
| RLS-protected user data | Anon client + user JWT |
