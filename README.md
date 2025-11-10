# BillSnipe

Monitor utility usage and prices, select optimal plans, schedule flexible loads, and save on energy costs. BillSnipe charges a percentage of verified savings.

## Overview

BillSnipe helps users optimize their utility bills by:
- Monitoring real-time usage and pricing
- Analyzing historical usage patterns
- Recommending optimal utility plans
- Automating plan switching (with user consent)
- Tracking and verifying savings
- Charging only a percentage of verified savings

## Repository Structure

This monorepo contains two main applications:

```
billsnipe/
├── billsnipe_web/          # Next.js web application
│   ├── src/
│   ├── prisma/
│   └── README.md
├── billsnipe_ios/          # SwiftUI iOS application
│   ├── BillSnipe/
│   └── README.md
└── README.md               # This file
```

## Technology Stack

### Web (billsnipe_web)
- Next.js 15 with App Router
- TypeScript 5
- Tailwind CSS + shadcn/ui
- PostgreSQL 16 + Prisma 5 + pgvector
- Clerk (Passkeys/WebAuthn)
- Stripe for payments
- Cloudflare R2 for storage
- Sentry for error tracking

### iOS (billsnipe_ios)
- SwiftUI
- Swift async/await + Combine
- CryptoKit for encryption
- Passkey authentication
- iOS 16.0+

## Key Features

### Core Functionality
- **Usage Monitoring**: Track hourly energy consumption
- **Plan Analysis**: Compare utility plans (TOU, ULO, Tiered, Fixed, Indexed)
- **Smart Recommendations**: AI-powered plan suggestions
- **Automatic Switching**: Optional automated plan switching
- **Savings Tracking**: Detailed savings reports with verification
- **Green Button Connect**: Integration with Ontario utility APIs

### Security & Privacy
- Passkey/WebAuthn authentication (Face ID, Touch ID)
- Client-side encryption for sensitive data
- Server only stores ciphertext
- Role-based access control (RBAC)
- Data export and deletion (GDPR compliance)

### Monetization
- 15% of verified savings (capped)
- Alternative: $2.99-$4.99/month subscription
- "Never Worse Off" guarantee with refund logic

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 16+
- Xcode 15+ (for iOS development)
- Clerk account
- Stripe account
- Cloudflare R2 account

### Quick Start - Web

```bash
cd billsnipe_web
npm install
cp .env.example .env
# Edit .env with your credentials
npx prisma migrate dev
npm run dev
```

See [billsnipe_web/README.md](./billsnipe_web/README.md) for detailed setup.

### Quick Start - iOS

```bash
cd billsnipe_ios
open BillSnipe.xcodeproj
# Configure signing & capabilities in Xcode
# Build and run (Cmd+R)
```

See [billsnipe_ios/README.md](./billsnipe_ios/README.md) for detailed setup.

## Architecture

### Database Schema

```
User
├── UtilityAccount
│   ├── UsageHour (hourly kWh data)
│   ├── SwitchAction (plan switch requests)
│   └── SavingsReport (monthly savings)
└── ...

PlanCatalog (available plans by region)
```

### API Endpoints

- `GET /api/health` - Health check
- `POST /api/usage/import` - Import usage data
- `GET /api/plan/compare` - Compare plans
- `POST /api/switch/request` - Request plan switch
- `GET /api/savings/report` - Get savings reports

### Client-Side Encryption Flow

1. User prepares sensitive data (e.g., account credentials)
2. iOS/Web app encrypts data with AES-GCM-256
3. Encrypted data uploaded to server
4. Server stores ciphertext in database
5. On retrieval, client decrypts with local key

## Development Workflow

### Web Development

```bash
cd billsnipe_web
npm run dev          # Start dev server
npm run lint         # Lint code
npm run type-check   # Type check
npx prisma studio    # Database GUI
```

### iOS Development

```bash
cd billsnipe_ios
# Open in Xcode
# Cmd+R to build and run
# Cmd+U to run tests
```

## Security Considerations

- Never commit `.env` files
- Never broker user accounts without explicit consent
- Always encrypt sensitive data client-side
- Implement rate limiting on all API endpoints
- Use HTTPS in production
- Validate all user inputs
- Implement proper CORS policies

## Compliance

- GDPR: Data export and deletion available
- CCPA: User data rights respected
- PCI DSS: Stripe handles payment card data
- SOC 2: Implementing security controls

## Testing

### Web
```bash
cd billsnipe_web
npm test
```

### iOS
- Run tests in Xcode (Cmd+U)

## Deployment

### Web (Vercel)
```bash
cd billsnipe_web
vercel
```

### iOS (TestFlight)
- Archive in Xcode
- Upload to App Store Connect
- Submit for TestFlight review

## Contributing

This is a private repository. For internal development:

1. Create a feature branch
2. Make your changes
3. Run tests
4. Submit a pull request
5. Get review approval
6. Merge to main

## License

Proprietary - All rights reserved

## Support

For issues and questions:
- Internal: Contact the development team
- External: support@billsnipe.app

## Roadmap

### Phase 1 (MVP)
- [x] User authentication with passkeys
- [x] Basic usage data import
- [x] Simple savings calculation
- [ ] Plan comparison engine
- [ ] Basic iOS app

### Phase 2
- [ ] Green Button Connect integration
- [ ] Automated plan switching
- [ ] Enhanced savings reports
- [ ] Smart device integration

### Phase 3
- [ ] AI-powered recommendations
- [ ] Load scheduling
- [ ] Multi-utility support
- [ ] Advanced analytics

## Contact

- Website: https://billsnipe.app
- Email: team@billsnipe.app
