# BillSnipe - Complete Feature Documentation

**Version**: 1.0.0  
**Last Updated**: 2025-11-10  
**Platform**: Web + iOS

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Web Application Features](#web-application-features)
4. [iOS Application Features](#ios-application-features)
5. [API Endpoints](#api-endpoints)
6. [Database Schema](#database-schema)
7. [Security Features](#security-features)
8. [DevOps & Infrastructure](#devops--infrastructure)
9. [Setup & Installation](#setup--installation)
10. [Usage Guide](#usage-guide)
11. [Testing](#testing)
12. [Deployment](#deployment)

---

## Overview

BillSnipe is a utility cost optimization platform that helps users monitor energy usage, compare utility plans, and save money through intelligent plan switching and analysis.

### Key Benefits

- **Real-time Monitoring**: Track hourly energy consumption
- **Smart Recommendations**: AI-powered plan suggestions based on usage patterns
- **Automated Switching**: Optional automated plan switching with user consent
- **Savings Verification**: Detailed reports with verified savings calculations
- **Multi-platform**: Full-featured web and iOS applications

### Monetization

- 15% of verified savings (capped)
- Alternative: $2.99-$4.99/month subscription
- "Never Worse Off" guarantee with automatic refunds

---

## Architecture

### Technology Stack

#### Web Application
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **Database**: PostgreSQL 16 + Prisma 5 + pgvector
- **Authentication**: Clerk (Passkeys/WebAuthn-first)
- **Payments**: Stripe
- **Storage**: Cloudflare R2 (S3-compatible)
- **Observability**: Sentry + OpenTelemetry
- **Testing**: Vitest + React Testing Library

#### iOS Application
- **Framework**: SwiftUI
- **Architecture**: MVVM with Combine
- **Concurrency**: Swift async/await
- **Security**: CryptoKit (AES-GCM-256)
- **Storage**: Keychain for secure data
- **Min iOS Version**: 16.0+

### Design Patterns

- **Web**: Server-side rendering with client components
- **iOS**: MVVM with reactive data flow
- **API**: RESTful with OpenAPI documentation
- **Database**: Row-level security with Prisma
- **Encryption**: Client-side encryption for sensitive data

---

## Web Application Features

### 1. Dashboard (`/dashboard`)

**Purpose**: Central hub for monitoring savings and account status

**Features**:
- Total savings overview with visual metrics
- Active accounts count
- Pending plan switches indicator
- Recent savings reports table with verification status
- Period filtering (all time, year, month)
- Real-time data refresh

**Technical Details**:
- Server-side rendered with Clerk authentication
- Client component for interactive features
- Prisma queries with aggregations
- Responsive design for mobile/tablet/desktop

**Files**:
- `billsnipe_web/src/app/dashboard/page.tsx`
- `billsnipe_web/src/app/dashboard/dashboard-client.tsx`

### 2. Accounts Management (`/accounts`)

**Purpose**: Manage utility accounts and connections

**Features**:
- List all utility accounts with statistics
- Add new accounts with region, provider, account number
- View usage records, switch actions, and savings reports per account
- Account status badges (active, inactive)
- Quick actions: View Details, Import Data
- Empty state with onboarding prompt

**Technical Details**:
- Modal dialog for adding accounts
- Form validation with Zod
- Real-time UI updates after account creation
- Stats computed with Prisma aggregations

**Files**:
- `billsnipe_web/src/app/accounts/page.tsx`
- `billsnipe_web/src/app/accounts/accounts-client.tsx`

### 3. Plan Comparison (`/plans`)

**Purpose**: Compare utility plans and find optimal savings

**Features**:
- Account selection dropdown
- Current plan cost display
- Top 5 plan recommendations sorted by savings
- Estimated monthly and annual costs
- Savings calculations
- Plan features list (TOU, tiered, green energy, etc.)
- Best savings highlight
- One-click plan switching

**Technical Details**:
- Usage-based cost calculations
- TOU (Time-of-Use) pricing support
- Tiered rate calculations
- Plan type indicators
- Visual comparison cards

**Files**:
- `billsnipe_web/src/app/plans/page.tsx`
- `billsnipe_web/src/app/plans/plans-client.tsx`

### 4. UI Components Library

**shadcn/ui Components**:
- `Button` - Multiple variants (default, destructive, outline, secondary, ghost, link)
- `Card` - Modular card components (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
- `Input` - Form input with validation support

**Files**:
- `billsnipe_web/src/components/ui/button.tsx`
- `billsnipe_web/src/components/ui/card.tsx`
- `billsnipe_web/src/components/ui/input.tsx`

---

## iOS Application Features

### 1. Dashboard View

**Purpose**: Main screen showing savings overview and recent activity

**Features**:
- Total savings display with trends
- Current plan information
- Recent savings reports
- Account summary
- Refresh capability
- Tab navigation

**Technical Details**:
- SwiftUI with async/await
- Combine for reactive updates
- Environment objects for state management
- Pull-to-refresh support

**Files**:
- `billsnipe_ios/BillSnipe/Features/Dashboard/DashboardView.swift`
- `billsnipe_ios/BillSnipe/Features/Dashboard/DashboardViewModel.swift`

### 2. Plan Comparison View

**Purpose**: Compare plans and visualize savings potential

**Features**:
- Account selection picker
- Current plan card with monthly cost
- Recommended plans with savings breakdown
- Plan features list with checkmarks
- "Best Savings" badge for top recommendation
- One-tap plan switching
- Loading states

**Technical Details**:
- Custom card components
- Async API calls with error handling
- State management with @Published properties
- Responsive layout with VStack/HStack

**Files**:
- `billsnipe_ios/BillSnipe/Features/PlanComparison/PlanComparisonView.swift`
- `billsnipe_ios/BillSnipe/Features/PlanComparison/PlanComparisonViewModel.swift`

### 3. Accounts Management View

**Purpose**: Manage utility accounts

**Features**:
- List of all accounts with details
- Add new account sheet
- Account status badges
- Statistics per account (usage records, switches, reports)
- Pull-to-refresh
- Empty state with call-to-action
- Form validation

**Technical Details**:
- Sheet presentation for add account
- List with custom rows
- Form with text fields
- Async account creation
- Navigation view with toolbar

**Files**:
- `billsnipe_ios/BillSnipe/Features/Accounts/AccountsManagementView.swift`

### 4. Sign-In View

**Purpose**: Authentication with passkeys (Face ID/Touch ID)

**Features**:
- Passkey authentication
- Face ID/Touch ID biometric auth
- Loading states
- Error handling
- Secure credential storage

**Technical Details**:
- AuthenticationServices framework
- ASAuthorizationController
- Keychain storage
- Error alerts

**Files**:
- `billsnipe_ios/BillSnipe/Features/SignIn/SignInView.swift`
- `billsnipe_ios/BillSnipe/Modules/Auth/AuthService.swift`

### 5. Settings View

**Purpose**: App settings and user preferences

**Features**:
- Account information
- Privacy & data controls
- Export data functionality
- Account deletion
- Notification settings
- Privacy settings
- App version info
- Terms of Service & Privacy Policy links
- Sign out

**Technical Details**:
- List-based UI
- Confirmation dialogs
- Sheet modals
- External link handling

**Files**:
- `billsnipe_ios/BillSnipe/Features/Settings/SettingsView.swift`

### 6. Networking Module

**Purpose**: API communication layer

**Features**:
- Type-safe API client
- Async/await support
- Automatic token injection
- Error handling
- Request/response models
- JSON encoding/decoding

**Technical Details**:
- URLSession wrapper
- Generic request method
- Codable models
- ISO8601 date handling

**Files**:
- `billsnipe_ios/BillSnipe/Modules/Networking/NetworkService.swift`
- `billsnipe_ios/BillSnipe/Modules/Networking/APIClient.swift`

### 7. Crypto Module

**Purpose**: Client-side encryption for sensitive data

**Features**:
- AES-GCM-256 encryption
- Key generation and management
- HKDF key derivation
- SHA-256 hashing
- Secure storage integration

**Technical Details**:
- CryptoKit framework
- SymmetricKey management
- PBKDF2 for password-based keys
- UserDefaults integration

**Files**:
- `billsnipe_ios/BillSnipe/Modules/Crypto/CryptoService.swift`

---

## API Endpoints

### Health & Status

#### GET `/api/health`
- **Purpose**: Check API and database health
- **Auth**: None required
- **Response**: Status, timestamp, database connectivity

### Authentication

#### POST `/api/webhooks/clerk`
- **Purpose**: Clerk webhook for user sync
- **Auth**: Webhook signature
- **Events**: user.created, user.deleted
- **Response**: Confirmation

### Accounts

#### GET `/api/accounts`
- **Purpose**: Get user's utility accounts
- **Auth**: Required (Clerk)
- **Response**: Array of accounts with statistics

#### POST `/api/accounts`
- **Purpose**: Create new utility account
- **Auth**: Required (Clerk)
- **Body**: region, provider (optional), accountNumber (optional)
- **Response**: Created account object

### Usage Data

#### POST `/api/usage/import`
- **Purpose**: Import hourly usage data
- **Auth**: Required (Clerk)
- **Body**: accountId, data array (timestamp, kWh)
- **Response**: Success status, records imported count
- **Validation**: Zod schema validation

### Plan Comparison

#### POST `/api/plan/compare`
- **Purpose**: Compare utility plans based on usage
- **Auth**: Required (Clerk)
- **Body**: accountId, region, startDate (optional), endDate (optional)
- **Response**: 
  - currentPlan: Current plan details and cost
  - recommendations: Top 5 plans with savings
  - analysisPeriod: Date range and total usage
- **Algorithms**:
  - TOU (Time-of-Use) cost calculation
  - Tiered pricing calculation
  - Flat rate calculation

### Savings Reports

#### GET `/api/savings/report`
- **Purpose**: Retrieve savings reports
- **Auth**: Required (Clerk)
- **Query Params**: accountId, startMonth, endMonth, verified
- **Response**: 
  - reports: Array of savings reports
  - summary: Total savings, averages, verification stats
  - trends: Monthly aggregated data

#### POST `/api/savings/report`
- **Purpose**: Create new savings report
- **Auth**: Required (Clerk)
- **Body**: accountId, month, baseline, actual
- **Response**: Created report with calculated savings

### Plan Switching

#### GET `/api/switch/request`
- **Purpose**: Get plan switch requests
- **Auth**: Required (Clerk)
- **Query Params**: accountId, status
- **Response**: Array of switch requests with status

#### POST `/api/switch/request`
- **Purpose**: Request a plan switch
- **Auth**: Required (Clerk)
- **Body**: accountId, planId, consent (required), notes (optional)
- **Response**: Switch action details
- **Validation**: 
  - Explicit consent required
  - Prevents duplicate pending requests
  - Verifies plan availability

---

## Database Schema

### Users Table
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  clerkId   String   @unique
  role      String   @default("user")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  utilityAccounts UtilityAccount[]
}
```

### Utility Accounts Table
```prisma
model UtilityAccount {
  id            String   @id @default(cuid())
  userId        String
  region        String
  provider      String?
  accountNumber String?
  status        String   @default("active")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user           User            @relation(fields: [userId], references: [id])
  usageHours     UsageHour[]
  switchActions  SwitchAction[]
  savingsReports SavingsReport[]
}
```

### Usage Hours Table
```prisma
model UsageHour {
  id        String   @id @default(cuid())
  accountId String
  timestamp DateTime
  kWh       Float
  createdAt DateTime @default(now())

  account   UtilityAccount @relation(fields: [accountId], references: [id])
}
```

### Plan Catalog Table
```prisma
model PlanCatalog {
  id        String   @id @default(cuid())
  region    String
  name      String
  provider  String
  schema    Json     // Plan structure (TOU, tiered, etc.)
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  switchActions SwitchAction[]
}
```

### Switch Actions Table
```prisma
model SwitchAction {
  id          String    @id @default(cuid())
  accountId   String
  planId      String
  status      String    @default("pending")
  requestedAt DateTime  @default(now())
  completedAt DateTime?
  notes       String?

  account UtilityAccount @relation(fields: [accountId], references: [id])
  plan    PlanCatalog    @relation(fields: [planId], references: [id])
}
```

### Savings Reports Table
```prisma
model SavingsReport {
  id        String   @id @default(cuid())
  accountId String
  month     DateTime
  baseline  Float    // Cost on old plan
  actual    Float    // Cost on new plan
  savings   Float    // Difference
  verified  Boolean  @default(false)
  createdAt DateTime @default(now())

  account   UtilityAccount @relation(fields: [accountId], references: [id])
}
```

---

## Security Features

### 1. Authentication

**Web**:
- Clerk authentication with passkey/WebAuthn support
- Magic links as fallback
- Session management
- Role-based access control (RBAC)

**iOS**:
- Passkey authentication with Face ID/Touch ID
- Secure Keychain storage for tokens
- Automatic token refresh
- Biometric authentication required

### 2. Authorization

- User-based data isolation
- Account ownership verification
- API route protection with middleware
- Role checking for admin operations

### 3. Client-Side Encryption

**Purpose**: Encrypt sensitive data before sending to server

**Implementation**:
- AES-GCM-256 encryption
- Client generates encryption key
- Server only stores ciphertext
- Keys stored in Keychain (iOS) or secure storage (Web)

**Use Cases**:
- Account credentials
- Personal identification data
- Billing information

### 4. Data Protection

- HTTPS only in production
- CSRF protection
- XSS prevention
- SQL injection protection (Prisma ORM)
- Rate limiting on API endpoints
- Input validation with Zod

### 5. Compliance

- **GDPR**: Data export and deletion
- **CCPA**: User data rights
- **PCI DSS**: Stripe handles payment data
- **SOC 2**: Security controls implementation

---

## DevOps & Infrastructure

### Docker Configuration

**Files**:
- `Dockerfile` - Multi-stage build for web app
- `docker-compose.yml` - Local development environment
- `.dockerignore` - Optimized build context

**Services**:
1. **PostgreSQL** (pgvector/pgvector:pg16)
   - Port: 5432
   - Volume persistence
   - Health checks
   - pgvector extension enabled

2. **Web Application** (Next.js)
   - Port: 3000
   - Hot reload in development
   - Environment variables
   - Volume mounts

3. **Redis** (redis:7-alpine)
   - Port: 6379
   - For caching and queues
   - Health checks

**Commands**:
```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f web

# Stop services
docker-compose down

# Rebuild
docker-compose up --build
```

### GitHub Actions CI/CD

#### CI Pipeline (`.github/workflows/web-ci.yml`)

**Jobs**:
1. **Lint & Type Check**
   - ESLint validation
   - TypeScript type checking
   - Code quality checks

2. **Test**
   - PostgreSQL service container
   - Vitest test execution
   - Coverage reporting

3. **Build**
   - Production build
   - Artifact verification
   - Build optimization

**Triggers**:
- Push to main/develop
- Pull requests to main/develop
- File changes in billsnipe_web/

#### CD Pipeline (`.github/workflows/web-deploy.yml`)

**Jobs**:
1. **Deploy to Vercel**
   - Automated production deployment
   - Environment variable injection
   - Build artifacts deployment

**Triggers**:
- Push to main branch
- File changes in billsnipe_web/

**Required Secrets**:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### Testing Infrastructure

**Framework**: Vitest + React Testing Library

**Configuration**:
- jsdom environment
- Coverage reporting (v8 provider)
- Global test utilities
- Mock environment variables

**Files**:
- `vitest.config.ts` - Test configuration
- `vitest.setup.ts` - Global setup
- `src/__tests__/` - Test files

**Commands**:
```bash
# Run tests
npm test

# Run with UI
npm run test:ui

# Generate coverage
npm run test:coverage
```

---

## Setup & Installation

### Prerequisites

**Required**:
- Node.js 18+ and npm
- PostgreSQL 16+ with pgvector extension
- Git

**For iOS Development**:
- macOS 13+
- Xcode 15+
- iOS Simulator or physical device

**Third-Party Services**:
- Clerk account (authentication)
- Stripe account (payments)
- Cloudflare R2 account (storage)
- Sentry account (error tracking)

### Web Application Setup

1. **Clone Repository**
```bash
git clone <repository-url>
cd billsnipe
```

2. **Install Dependencies**
```bash
cd billsnipe_web
npm install
```

3. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your credentials
```

4. **Set Up Database**
```bash
# Create database with pgvector
psql -U postgres
CREATE DATABASE billsnipe;
\c billsnipe
CREATE EXTENSION vector;
\q

# Run migrations
npx prisma migrate dev
```

5. **Start Development Server**
```bash
npm run dev
# Open http://localhost:3000
```

### iOS Application Setup

1. **Navigate to iOS Directory**
```bash
cd billsnipe_ios
```

2. **Open in Xcode**
```bash
open BillSnipe.xcodeproj
```

3. **Configure Signing & Capabilities**
- Select BillSnipe target
- Choose your development team
- Enable Associated Domains
- Enable Keychain Sharing

4. **Update API Base URL**
Edit `BillSnipe/Modules/Networking/NetworkService.swift`:
```swift
self.baseURL = "http://localhost:3000/api" // Development
// or
self.baseURL = "https://api.billsnipe.app/api" // Production
```

5. **Build and Run**
- Select target device or simulator
- Press Cmd+R to build and run

### Docker Setup (Recommended for Development)

1. **Start All Services**
```bash
cd billsnipe
docker-compose up
```

2. **Access Services**
- Web App: http://localhost:3000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

3. **Run Migrations**
```bash
docker-compose exec web npx prisma migrate dev
```

---

## Usage Guide

### For End Users

#### Getting Started

1. **Sign Up**
   - Open app (web or iOS)
   - Click "Sign Up"
   - Set up passkey (Face ID/Touch ID on iOS)
   - Verify email

2. **Add Utility Account**
   - Navigate to Accounts
   - Click "Add Account"
   - Enter region (e.g., "Ontario")
   - Optionally add provider and account number
   - Save

3. **Import Usage Data**
   - Go to account details
   - Click "Import Data"
   - Upload CSV or connect via Green Button
   - Data is processed and stored

4. **Compare Plans**
   - Navigate to Plans
   - Select your account
   - Click "Compare Plans"
   - View recommendations sorted by savings

5. **Switch Plans**
   - Review plan details
   - Click "Switch to This Plan"
   - Provide consent
   - Track switch status

6. **View Savings**
   - Check Dashboard for total savings
   - View monthly reports
   - Export data if needed

#### Dashboard Overview

**Total Savings Card**:
- Shows cumulative savings across all accounts
- Trend indicator (up/down)
- Visual representation

**Active Accounts**:
- Number of connected accounts
- Pending switches count

**Recent Savings Table**:
- Month-by-month breakdown
- Baseline vs actual costs
- Savings amount
- Verification status

#### Account Management

**Add New Account**:
- Required: Region
- Optional: Provider name, account number
- Status automatically set to "active"

**Account Details**:
- Usage records count
- Switch actions history
- Savings reports
- Quick actions menu

#### Plan Comparison

**How It Works**:
1. System analyzes last 90 days of usage
2. Calculates costs for all available plans in region
3. Sorts by potential savings
4. Displays top 5 recommendations

**Plan Types Supported**:
- **TOU (Time-of-Use)**: Different rates by time of day
- **Tiered**: Rates change based on usage volume
- **Flat Rate**: Fixed price per kWh
- **Indexed**: Market-based pricing

**Comparison Metrics**:
- Estimated monthly cost
- Annual savings projection
- Plan features
- Rate structure

### For Developers

#### Adding New API Endpoints

1. **Create Route Handler**
```typescript
// src/app/api/feature/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  // Implementation
}
```

2. **Add OpenAPI Documentation**
```typescript
/**
 * @swagger
 * /api/feature:
 *   get:
 *     summary: Feature description
 *     security:
 *       - bearerAuth: []
 */
```

3. **Implement Validation**
```typescript
import { z } from 'zod'

const RequestSchema = z.object({
  field: z.string(),
})

const validated = RequestSchema.parse(body)
```

#### Adding iOS Features

1. **Create Feature Module**
```swift
// Features/NewFeature/NewFeatureView.swift
import SwiftUI

struct NewFeatureView: View {
    @StateObject private var viewModel = NewFeatureViewModel()
    
    var body: some View {
        // Implementation
    }
}
```

2. **Create ViewModel**
```swift
// Features/NewFeature/NewFeatureViewModel.swift
@MainActor
class NewFeatureViewModel: ObservableObject {
    @Published var data: [Item] = []
    
    func loadData() async {
        // Implementation
    }
}
```

3. **Add API Client Method**
```swift
// Modules/Networking/APIClient.swift
func getFeature() async throws -> FeatureResponse {
    try await networkService.request(endpoint: "/feature")
}
```

---

## Testing

### Web Testing

**Unit Tests**:
```bash
npm test
```

**Component Tests**:
```typescript
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'

describe('Component', () => {
  it('renders correctly', () => {
    // Test implementation
  })
})
```

**API Tests**:
```typescript
describe('API Endpoint', () => {
  it('returns expected data', async () => {
    // Mock Prisma
    // Call endpoint
    // Assert response
  })
})
```

**Coverage Report**:
```bash
npm run test:coverage
# Opens HTML report
```

### iOS Testing

**Unit Tests** (Xcode):
```swift
import XCTest
@testable import BillSnipe

class FeatureTests: XCTestCase {
    func testFeature() {
        // Test implementation
    }
}
```

**Run Tests**:
- Xcode: Cmd+U
- Or select specific test to run

### Integration Testing

1. **Start Services**
```bash
docker-compose up
```

2. **Run E2E Tests**
```bash
# Web
npm run test:e2e

# iOS
# Use Xcode UI testing
```

---

## Deployment

### Web Deployment (Vercel)

**Automated** (via GitHub Actions):
- Push to main branch
- Actions workflow triggers
- Vercel deploys automatically

**Manual**:
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd billsnipe_web
vercel --prod
```

**Environment Variables** (Set in Vercel Dashboard):
- All variables from `.env.example`
- Production database URL
- Production Clerk keys
- Production Stripe keys
- Sentry DSN

### iOS Deployment

**TestFlight**:
1. Archive app (Product > Archive)
2. Upload to App Store Connect
3. Submit for review
4. Invite testers

**App Store**:
1. Complete App Store Connect listing
2. Add screenshots and metadata
3. Submit for review
4. Release after approval

### Database Migrations

**Development**:
```bash
npx prisma migrate dev --name migration_name
```

**Production**:
```bash
npx prisma migrate deploy
```

---

## Monitoring & Observability

### Error Tracking (Sentry)

- Automatic error capture
- Source maps for debugging
- Release tracking
- User feedback

### Logging

- Structured JSON logs
- Request/response logging
- Error stack traces
- Performance metrics

### Metrics

- API response times
- Database query performance
- User activity tracking
- Savings calculations accuracy

---

## Support & Maintenance

### Common Issues

**Database Connection Failed**:
- Check DATABASE_URL in .env
- Verify PostgreSQL is running
- Check pgvector extension

**Authentication Errors**:
- Verify Clerk credentials
- Check webhook configuration
- Ensure HTTPS in production

**Build Failures**:
- Clear .next directory
- Delete node_modules and reinstall
- Check TypeScript errors

### Updates

**Dependencies**:
```bash
# Check for updates
npm outdated

# Update all
npm update

# Update Prisma
npx prisma generate
```

### Contributing

See main README.md for contribution guidelines.

---

## Changelog

### Version 1.0.0 (2025-11-10)

**Initial Release**:
- Web application with dashboard, accounts, and plans
- iOS application with all core features
- Complete API implementation
- Database schema and migrations
- Docker configuration
- CI/CD pipelines
- Comprehensive documentation

**Features**:
- ✅ User authentication (passkeys)
- ✅ Account management
- ✅ Usage data import
- ✅ Plan comparison engine
- ✅ Switch request workflow
- ✅ Savings tracking and reporting
- ✅ Client-side encryption
- ✅ GDPR compliance tools

---

## License

Proprietary - All rights reserved

## Contact

- Website: https://billsnipe.app
- Email: support@billsnipe.app
- Issues: GitHub Issues

---

**End of Documentation**
