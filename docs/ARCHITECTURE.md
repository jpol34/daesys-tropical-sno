# Architecture Overview

This document describes the technical architecture of the Daesy's Tropical Sno website.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    SvelteKit App                         ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              ││
│  │  │  Routes  │  │Components│  │ Services │              ││
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘              ││
│  │       │             │             │                      ││
│  │       └─────────────┴─────────────┘                      ││
│  └───────────────────────┬─────────────────────────────────┘│
└──────────────────────────┼──────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────┼──────────────────────────────────┐
│                     Vercel Edge                              │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  Static Assets  │  │   SSR/ISR       │                   │
│  │  (CDN Cached)   │  │   Functions     │                   │
│  └─────────────────┘  └────────┬────────┘                   │
└────────────────────────────────┼────────────────────────────┘
                                 │ HTTPS
┌────────────────────────────────┼────────────────────────────┐
│                         Supabase                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │PostgreSQL│  │   Auth   │  │  Edge    │  │ Realtime │    │
│  │ Database │  │          │  │Functions │  │          │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
daesys-tropical-sno/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI pipeline
├── .husky/                     # Git hooks
├── docs/                       # Documentation
├── src/
│   ├── app.css                 # Global styles
│   ├── app.d.ts                # App-level TypeScript declarations
│   ├── app.html                # HTML template
│   ├── lib/
│   │   ├── actions/            # Svelte actions
│   │   │   └── inview.ts       # Intersection Observer action
│   │   ├── components/         # Reusable components
│   │   ├── config/             # Configuration modules
│   │   │   └── site.ts         # Site constants
│   │   ├── data/               # Static data
│   │   │   ├── businessInfo.ts # Business details
│   │   │   ├── concoctions.ts  # Fallback concoctions
│   │   │   ├── eventTypes.ts   # Event type options
│   │   │   └── flavors.ts      # Fallback flavors
│   │   ├── services/           # Business logic
│   │   │   ├── base.ts         # Service utilities
│   │   │   ├── index.ts        # Service exports
│   │   │   ├── loyalty.ts      # Loyalty program
│   │   │   ├── menu.ts         # Menu management
│   │   │   └── requests.ts     # Catering requests
│   │   ├── types/              # TypeScript types
│   │   │   ├── database.ts     # Database schema types
│   │   │   └── index.ts        # Shared types
│   │   ├── utils/              # Utilities
│   │   │   └── rateLimit.ts    # Rate limiting
│   │   └── supabase.ts         # Supabase client
│   └── routes/
│       ├── +error.svelte       # Error page
│       ├── +layout.svelte      # Root layout
│       ├── +page.svelte        # Home page
│       ├── +page.ts            # Home page data loading
│       ├── admin/              # Admin dashboard
│       │   ├── +error.svelte   # Admin error page
│       │   ├── +page.svelte    # Admin page
│       │   ├── components/     # Admin components
│       │   └── styles/         # Admin styles
│       ├── privacy/            # Privacy policy
│       └── sitemap.xml/        # Dynamic sitemap
├── static/                     # Static assets
├── supabase/
│   ├── functions/              # Edge functions
│   │   └── send-notification/  # Email notifications
│   └── migrations/             # Database migrations
└── tests/
    ├── e2e/                    # Playwright E2E tests
    ├── mocks/                  # Test mocks
    ├── setup.ts                # Test setup
    └── unit/                   # Vitest unit tests
```

## Data Flow

### Public Pages

```
Browser Request
      │
      ▼
┌─────────────┐
│  +page.ts   │ ◄── Server-side data loading
│   (load)    │     with cache headers
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Services   │ ◄── Business logic layer
│   (menu)    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Supabase   │ ◄── Database queries
│  (client)   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ PostgreSQL  │
│  Database   │
└─────────────┘
```

### Form Submission (Catering)

```
User Input
    │
    ▼
┌──────────────────┐
│ Client Validation│ ◄── Zod validation
│ + Rate Limiting  │     + honeypot check
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Supabase Insert  │ ◄── RLS: anon can insert
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Database Trigger │ ◄── pg_net + HTTP
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Edge Function    │ ◄── send-notification
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Resend API     │ ◄── Email delivery
└──────────────────┘
```

## Database Schema

### Tables

| Table               | Purpose                 | RLS                     |
| ------------------- | ----------------------- | ----------------------- |
| `catering_requests` | Customer event requests | Anon: insert only       |
| `flavors`           | Sno cone flavors        | Anon: select, Auth: all |
| `concoctions`       | Signature concoctions   | Anon: select, Auth: all |
| `site_content`      | Dynamic content         | Anon: select, Auth: all |
| `loyalty_members`   | Loyalty program members | Auth only               |
| `loyalty_history`   | Punch/redeem history    | Auth only               |

### Row Level Security

- **Public tables** (flavors, concoctions, site_content): Anyone can read, only authenticated users can modify
- **Catering requests**: Anyone can insert their own, only authenticated can read/update
- **Loyalty tables**: Only authenticated users (admin) can access

## Security Measures

1. **Environment Variables**: Validated at build time
2. **CSP Headers**: Configured in vercel.json
3. **Form Protection**: Honeypot + rate limiting
4. **Database**: Row Level Security on all tables
5. **Auth**: Supabase Auth with session management
6. **HTTPS**: Enforced by Vercel

## Caching Strategy

| Resource      | Cache Duration          | Strategy     |
| ------------- | ----------------------- | ------------ |
| Static assets | 1 year                  | Immutable    |
| Menu data     | 5 min fresh, 1 hr stale | SWR          |
| HTML pages    | No cache                | Dynamic      |
| API responses | Varies                  | Per-endpoint |

## Performance Optimizations

- **Font preconnect**: Google Fonts domains
- **Image optimization**: Vercel Image Optimization
- **Code splitting**: Per-route bundles
- **Lazy loading**: Intersection Observer for sections
- **Server-side data loading**: Menu data fetched in +page.ts

## Deployment

### Production

1. Push to `main` branch
2. GitHub Actions runs CI pipeline
3. Vercel auto-deploys on success
4. Edge functions deployed via Supabase CLI

### Preview

1. Push to feature branch
2. Open pull request
3. Vercel creates preview deployment
4. CI runs on PR

## Monitoring

- **Vercel Analytics**: Performance metrics
- **Supabase Dashboard**: Database metrics, logs
- **GitHub Actions**: CI/CD status
