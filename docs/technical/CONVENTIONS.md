# DNA Hub Coding Conventions

> Standards and patterns used throughout the codebase. Follow these when adding new code.

## File Naming

| Type | Convention | Example |
|------|------------|---------|
| Pages | `page.tsx` in route folder | `app/dashboard/page.tsx` |
| API Routes | `route.ts` in route folder | `app/api/auth/route.ts` |
| Utilities | `camelCase.ts` | `lib/auth.ts` |
| Components | `PascalCase.tsx` | `components/Button.tsx` |
| SQL | `kebab-case.sql` | `supabase-migration-funnel.sql` |

## TypeScript

### Types Location
All shared types live in `/src/lib/types.ts`.

### Type Patterns
```typescript
// Entity types match database tables
interface Church {
  id: string
  name: string
  status: ChurchStatus
  // ...
}

// Enum-like union types for status fields
type ChurchStatus =
  | 'pending_assessment'
  | 'awaiting_discovery'
  | 'proposal_sent'
  | 'awaiting_agreement'
  | 'awaiting_strategy'
  | 'active'
  | 'completed'
  | 'paused'
  | 'declined'

// API response types
interface DashboardData {
  church: Church
  leader: ChurchLeader
  phases: Phase[]
  // ...
}
```

### Null Handling
```typescript
// Prefer optional chaining
const name = church?.name ?? 'Unknown'

// Check before access
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

## React Patterns

### Client Components
```typescript
'use client'

import { useState, useEffect } from 'react'

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const res = await fetch('/api/dashboard')
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (!data) return null

  return <MainContent data={data} />
}
```

### Form State
```typescript
// Single state object for form fields
const [form, setForm] = useState({
  email: '',
  name: '',
  phone: ''
})

// Update individual field
const updateField = (field: string, value: string) => {
  setForm(prev => ({ ...prev, [field]: value }))
}

// Error tracking
const [errors, setErrors] = useState<Record<string, string>>({})
```

### Event Handlers
```typescript
// Async handlers for API calls
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  setSubmitting(true)

  try {
    const res = await fetch('/api/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    // ...
  } finally {
    setSubmitting(false)
  }
}
```

## API Route Patterns

### Standard Structure
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  // 1. Auth check (if protected)
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse params
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  // 3. Database operation
  const { data, error } = await supabase
    .from('table')
    .select('*')
    .eq('id', id)
    .single()

  // 4. Error handling
  if (error) {
    console.error('[API_NAME]', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }

  // 5. Return data
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse body
  const body = await request.json()

  // Validate
  if (!body.requiredField) {
    return NextResponse.json({ error: 'Missing required field' }, { status: 400 })
  }

  // Database operation
  const { data, error } = await supabase
    .from('table')
    .insert(body)
    .select()
    .single()

  if (error) {
    console.error('[API_NAME]', error)
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }

  return NextResponse.json(data)
}
```

### Response Format
```typescript
// Success with data
return NextResponse.json({ data: result })
return NextResponse.json(result) // or direct data

// Success message
return NextResponse.json({ success: true })

// Client error (4xx)
return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
return NextResponse.json({ error: 'Not found' }, { status: 404 })

// Server error (5xx)
return NextResponse.json({ error: 'Internal error' }, { status: 500 })
```

### Logging
```typescript
// Use bracketed prefix for easy filtering
console.log('[MAGIC_LINK] Sending to:', email)
console.error('[DASHBOARD]', error)
```

## Database Patterns

### Queries
```typescript
// Single record
const { data, error } = await supabase
  .from('churches')
  .select('*')
  .eq('id', churchId)
  .single()

// Multiple with relations
const { data, error } = await supabase
  .from('church_progress')
  .select(`
    *,
    milestone:milestones(*)
  `)
  .eq('church_id', churchId)

// Insert with return
const { data, error } = await supabase
  .from('churches')
  .insert({ name, status: 'pending_assessment' })
  .select()
  .single()

// Update
const { error } = await supabase
  .from('churches')
  .update({ status: 'active' })
  .eq('id', churchId)
```

### Error Handling
```typescript
const { data, error } = await supabase.from('table').select()

if (error) {
  console.error('[CONTEXT]', error)
  // Return appropriate HTTP status
}
```

## Styling

### CSS Variables (globals.css)
```css
:root {
  --background: #FFFBF5;      /* Cream */
  --foreground: #1A2332;      /* Navy (text) */
  --foreground-muted: #6B7280;

  --navy: #1A2332;            /* Primary */
  --gold: #D4A853;            /* Accent/CTA */
  --teal: #2D6A6A;            /* Links */

  --success: #059669;
  --error: #DC2626;
  --warning: #D97706;
}
```

### Component Classes
```css
/* Buttons */
.btn-primary     /* Gold background, navy text */
.btn-secondary   /* Transparent, gold border */

/* Cards */
.card            /* White bg, border, shadow */

/* Phase indicators */
.phase-current   /* Gold border */
.phase-completed /* Green with checkmark */
.phase-locked    /* Gray, disabled */
```

### Tailwind Usage
```tsx
// Layout
<div className="container mx-auto px-4 py-8">
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Spacing
<div className="mt-4 mb-6 space-y-4">

// Typography
<h1 className="text-3xl font-bold text-[var(--navy)]">
<p className="text-[var(--foreground-muted)]">

// Responsive
<div className="hidden md:block">
<div className="text-sm md:text-base lg:text-lg">
```

## Authentication

### Check Session
```typescript
import { getSession, isAdmin } from '@/lib/auth'

// In API route
const session = await getSession()
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// Access session data
const { leaderId, churchId } = session

// Check admin
if (!isAdmin(session.email)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

### Session Structure
```typescript
interface Session {
  token: string
  leaderId: string
  churchId: string
  email: string
  createdAt: number
}
```

## Error Messages

### User-Facing (vague for security)
```typescript
'Invalid credentials'        // Not "email not found"
'Unable to process request'  // Not internal details
'Please try again'           // Generic retry
```

### Logging (detailed)
```typescript
console.error('[AUTH] Token expired for user:', email)
console.error('[DB] Insert failed:', error.message)
```

## File Uploads

### Validation
```typescript
const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg']

if (file.size > MAX_SIZE) {
  return { error: 'File too large' }
}

if (!ALLOWED_TYPES.includes(file.type)) {
  return { error: 'Invalid file type' }
}
```

## Comments

### When to Comment
```typescript
// Complex business logic
// Workarounds or hacks (with TODO)
// Non-obvious decisions

// DON'T comment obvious code
```

### Format
```typescript
// Single line for brief notes

/*
 * Multi-line for complex explanations
 * that need more context
 */

// TODO: Description of what needs to be done
// HACK: Why this workaround exists
```
