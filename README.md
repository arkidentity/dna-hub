# DNA Hub

Church implementation tracking for the DNA Discipleship Framework.

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind 4
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Email:** Resend
- **Deployment:** Vercel

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase and Resend keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
/src              # Application source code
/database         # SQL migrations (numbered for run order)
/docs             # Documentation
  /technical      # Developer docs
  /integrations   # Third-party service docs
  /business       # Strategy & process docs
  /planning       # Roadmaps & future work
```

## Documentation

- **Full docs:** [/docs/README.md](/docs/README.md)
- **Claude/AI context:** [/.claude/CLAUDE.md](/.claude/CLAUDE.md)
- **Database migrations:** [/database/README.md](/database/README.md)

## Live Site

[https://dna.arkidentity.com](https://dna.arkidentity.com)
