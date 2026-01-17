# Daesy's Tropical Sno

A vibrant, mobile-first website for Daesy's Tropical Sno - a sno cone hut in Arlington, TX.

## Features

- **Menu Display**: 43 flavors and 56 signature concoctions with pricing
- **Specials Section**: Highlight limited-time offers and seasonal items
- **Catering Form**: Request form with validation and honeypot spam protection
- **Loyalty Program**: "Sno Squad" digital punch card system (buy 9, get 1 free)
- **Admin Dashboard**: Protected dashboard with multiple management tabs
  - Catering requests management
  - Flavors management
  - Concoctions management
  - Specials management
  - Loyalty program management
- **Email Notifications**: Automatic email alerts for new catering submissions
- **Social Sharing**: Share buttons for menu items
- **Mobile-First**: Designed for customers checking menu on their phones
- **Privacy Policy**: GDPR-compliant privacy page

## Tech Stack

- **Frontend**: SvelteKit 5, Svelte 5, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Hosting**: Vercel
- **Email**: Resend API
- **Testing**: Vitest, Playwright, Testing Library
- **CI/CD**: GitHub Actions

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run development server
npm run dev
```

### Environment Variables

Create a `.env` file with:

```
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Admin Setup

1. Go to Supabase Dashboard > Authentication > Users
2. Create a new user with email/password
3. Use those credentials to log in at `/admin`

## Scripts

```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run preview       # Preview production build
npm run check         # Type-check the project
npm run lint          # Run ESLint
npm run format        # Format code with Prettier

# Testing
npm run test          # Run unit tests in watch mode
npm run test:run      # Run unit tests once
npm run test:coverage # Run tests with coverage report
npm run test:e2e      # Run Playwright E2E tests
npm run test:e2e:ui   # Run E2E tests with interactive UI
npm run test:ci       # Run full test suite (unit + E2E)
```

## Testing

The project includes a comprehensive testing setup:

- **Unit Tests**: Service utilities and business logic (Vitest)
- **Component Tests**: Svelte components with Testing Library
- **E2E Tests**: Critical user flows with Playwright

```bash
# Quick test run
npm run test:run

# Full suite with coverage
npm run test:ci
```

Tests run automatically on every push via GitHub Actions. Failed tests block deployment.

## Deployment

### Vercel

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
3. Deploy

### Supabase Edge Function

The `send-notification` edge function handles email alerts. To configure:

```bash
# Set RESEND_API_KEY in Supabase Dashboard > Edge Functions > Secrets
```

## Project Structure

```
src/
├── routes/
│   ├── +page.svelte           # Landing page
│   ├── +layout.svelte         # Global layout + SEO
│   ├── privacy/               # Privacy policy page
│   └── admin/
│       ├── +page.svelte       # Admin dashboard
│       ├── components/        # Admin tab components
│       └── styles/            # Admin-specific styles
├── lib/
│   ├── actions/               # Svelte actions (inview animations)
│   ├── components/            # Reusable Svelte components
│   ├── data/                  # Static data (flavors, concoctions, etc.)
│   ├── services/              # Business logic and API calls
│   ├── types/                 # TypeScript type definitions
│   └── supabase.ts            # Supabase client
└── app.css                    # Global styles

tests/
├── setup.ts                   # Test setup (jest-dom matchers)
├── unit/
│   ├── services/              # Service utility tests
│   └── components/            # Component render tests
└── e2e/
    └── public-site.spec.ts    # End-to-end user flow tests

supabase/
├── functions/                 # Edge functions
│   └── send-notification/     # Email notification function
└── migrations/                # Database migrations
```

## Documentation

- [Contributing Guide](CONTRIBUTING.md) - How to contribute to this project
- [Architecture Overview](docs/ARCHITECTURE.md) - Technical architecture documentation
- [Refactoring Guide](docs/REFACTORING_GUIDE.md) - Best practices implementation guide

## Contact

- **Business**: Daesy's Tropical Sno
- **Address**: 3814 Little Rd, Arlington, TX 76016
- **Hours**: 1-8pm Tue-Sun, Closed Mon
- **Phone**: (817) 401-6310
- **Email**: info@daesyssno.com
- **Instagram**: [@daesystropicalsno](https://www.instagram.com/daesystropicalsno)

## License

Private - All rights reserved
