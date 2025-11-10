# BillSnipe Web

Next.js-based web application for BillSnipe - Monitor utility usage and prices, select optimal plans, and save on energy costs.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL 16 + Prisma 5 + pgvector
- **Authentication**: Clerk (Passkeys/WebAuthn-first)
- **Payments**: Stripe
- **Storage**: Cloudflare R2 (S3-compatible)
- **Observability**: Sentry + OpenTelemetry
- **API**: REST with OpenAPI documentation

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 16+
- A Clerk account (for authentication)
- A Stripe account (for payments)
- Cloudflare R2 account (for object storage)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `CLERK_SECRET_KEY`: Clerk secret key
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk publishable key
- `STRIPE_SECRET_KEY`: Stripe secret key
- `CLOUDFLARE_R2_*`: R2 storage credentials
- `SENTRY_DSN`: Sentry error tracking DSN

### 3. Set Up the Database

Make sure PostgreSQL is running with the pgvector extension:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Then run Prisma migrations:

```bash
npx prisma migrate dev
```

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
billsnipe_web/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/            # API routes
│   │   │   ├── health/     # Health check endpoint
│   │   │   ├── usage/      # Usage data endpoints
│   │   │   └── webhooks/   # Webhook handlers
│   │   └── ...
│   ├── components/          # React components
│   │   └── ui/             # shadcn/ui components
│   ├── lib/                # Utility functions
│   │   ├── db.ts           # Prisma client
│   │   ├── auth.ts         # Auth helpers
│   │   └── utils.ts        # General utilities
│   └── hooks/              # Custom React hooks
├── prisma/
│   └── schema.prisma       # Database schema
├── public/                 # Static assets
└── ...
```

## API Endpoints

### Health Check
- `GET /api/health` - Check API and database health

### Usage Data
- `POST /api/usage/import` - Import hourly usage data

### Authentication
- `POST /api/webhooks/clerk` - Clerk webhook handler for user sync

## Database Schema

Key models:
- **User**: User accounts with Clerk integration
- **UtilityAccount**: User's utility accounts
- **UsageHour**: Hourly energy usage data
- **PlanCatalog**: Available utility plans
- **SwitchAction**: Plan switch requests
- **SavingsReport**: Monthly savings reports

## Authentication

This app uses Clerk for authentication with passkey/WebAuthn support:

1. Configure your Clerk application at [clerk.com](https://clerk.com)
2. Enable passkey authentication in Clerk settings
3. Set up webhook endpoint for user synchronization

## Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Docker

```bash
docker build -t billsnipe-web .
docker run -p 3000:3000 billsnipe-web
```

## Security Features

- Passkey/WebAuthn authentication
- Role-based access control (RBAC)
- Client-side encryption for sensitive data
- HTTPS only in production
- CSRF protection
- Rate limiting on API endpoints

## Development

### Code Quality

```bash
npm run lint        # Run ESLint
npm run type-check  # Run TypeScript compiler
```

### Database Management

```bash
npx prisma studio   # Open Prisma Studio
npx prisma migrate dev --name migration_name  # Create migration
npx prisma db push  # Push schema changes without migration
```

## Environment Variables Reference

See `.env.example` for a complete list of required and optional environment variables.

## Support

For issues and questions, please open an issue on GitHub.

## License

Proprietary - All rights reserved
