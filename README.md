# Daesy's Tropical Sno

A vibrant, mobile-first website for Daesy's Tropical Sno - a sno cone hut in Arlington, TX.

## Features

- 🍧 **Menu Display**: 43 flavors and 56 signature concoctions
- 📝 **Catering Form**: Request form with validation, honeypot spam protection
- 👤 **Admin Dashboard**: Protected dashboard to manage catering requests
- 📧 **Email Notifications**: Automatic email alerts for new submissions
- 📱 **Mobile-First**: Designed for customers checking menu on their phones

## Tech Stack

- **Frontend**: SvelteKit 5, Vite
- **Backend**: Supabase (Database, Auth, Edge Functions)
- **Hosting**: Vercel
- **Email**: Resend API

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

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

1. Go to Supabase Dashboard → Authentication → Users
2. Create a new user with email/password
3. Use those credentials to log in at `/admin`

## Deployment

### Vercel

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
3. Deploy

### Supabase Edge Function

The `notify-new-request` edge function is already deployed. To update:

```bash
# Set RESEND_API_KEY in Supabase Dashboard → Edge Functions → Secrets
```

## Project Structure

```
src/
├── routes/
│   ├── +page.svelte          # Landing page
│   ├── +layout.svelte        # Global layout + SEO
│   └── admin/
│       └── +page.svelte      # Admin dashboard
├── lib/
│   ├── components/           # Svelte components
│   ├── data/                 # Menu data (flavors, concoctions)
│   └── supabase.ts           # Supabase client
└── app.css                   # Global styles
```

## Contact

- **Business**: Daesy's Tropical Sno
- **Address**: 3814 Little Rd, Arlington, TX 76016
- **Phone**: (817) 401-6310
- **Email**: info@daesyssno.com
