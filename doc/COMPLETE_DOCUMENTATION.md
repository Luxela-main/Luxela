# 📚 LUXELA PLATFORM - COMPLETE DOCUMENTATION

**Last Updated**: 2024  
**Status**: Production Ready ✅  
**Version**: 1.0  

---

## 📑 TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Payment System & Escrow](#payment-system--escrow)
3. [Real-Time Payout System](#real-time-payout-system)
4. [Dojah ID Verification](#dojah-id-verification)
5. [Enterprise Support System](#enterprise-support-system)
6. [Loyalty NFT System](#loyalty-nft-system)
7. [Update Listing Guide](#update-listing-guide)
8. [SEO Implementation](#seo-implementation)
9. [Quick Reference](#quick-reference)

---

# EXECUTIVE SUMMARY

## ✅ MAJOR COMPLETIONS

### Priority 1: Atomic Checkout → Payment Flow ✅ COMPLETE
- Cart checkout returns real order IDs (not fabricated)
- Payment component uses actual order/payment IDs from checkout
- Single atomic transaction: checkout + payment creation together
- Files: `server/routers/cartImproved.ts`, `modules/cart/components/cartPaymentImproved.tsx`

### Priority 2: Error Handling with Rollback ✅ COMPLETE
- Entire checkout wrapped in database transaction
- Automatic rollback if payment creation fails (no orphaned orders)
- Buyer notifications on success/failure

### Priority 3: Webhook Monitoring Infrastructure ✅ COMPLETE
- webhookLogs table created in schema
- Retry mechanism with exponential backoff implemented
- Webhook event tracking ready for production

### Priority 4: Real-Time Payout Page ✅ COMPLETE
- Real database data from financial_ledger table
- Real-time updates via 10-second polling + WebSocket
- Enterprise-grade error handling and reconnection logic
- Zero TypeScript errors

### Priority 5: Dojah ID Verification ✅ COMPLETE
- 5 major improvements implemented
- Frontend UI fully functional
- Backend utility functions ready
- Multi-country support (6 countries)
- Automatic retry logic with exponential backoff
- Response validation with Zod schemas

### BONUS: Enterprise Support System ✅ COMPLETE
- Real-time WebSocket notifications
- Admin dashboard with metrics
- SLA tracking and automation
- Team member management
- Escalation rules and routing
- Email notifications

### BONUS: Loyalty NFT System ✅ COMPLETE
- Automatic NFT minting on spending thresholds
- Multi-tier support (Bronze, Silver, Gold)
- Webhook-triggered processing
- Real database storage

---

# PAYMENT SYSTEM & ESCROW

## System Architecture

### Complete Payment Flow

```
┌─────────────────────────────────────────────────────┐
│ 1. CART PAGE                                        │
│    User reviews items, applies discount             │
│    Clicks "Complete Payment"                        │
└────────────────┬──────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────┐
│ 2. ATOMIC CHECKOUT                                  │
│    ✅ Create orders for each item (ATOMIC)          │
│    ✅ Create payment records (ATOMIC)               │
│    ✅ Link orders ↔ payments                        │
│    ✅ Decrement stock                               │
│    ✅ Clear cart                                    │
│    If ANY step fails → ENTIRE transaction rollback │
└────────────────┬──────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────┐
│ 3. TSARA PAYMENT MODAL                              │
│    ✅ Receives actual order IDs                     │
│    ✅ Receives actual payment IDs                   │
│    ✅ Redirects to Tsara for payment                │
└────────────────┬──────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────┐
│ 4. TSARA PAYMENT PROCESSING                         │
│    User authorizes payment on Tsara                 │
└────────────────┬──────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────┐
│ 5. WEBHOOK PROCESSING                               │
│    ✅ Signature verification (HMAC-SHA256)          │
│    ✅ Idempotency check                             │
│    ✅ IN TRANSACTION:                               │
│    │  ├─ Update payment status                      │
│    │  ├─ Update order status                        │
│    │  ├─ Create payment hold (escrow)               │
│    │  ├─ Create financial ledger entry              │
│    │  └─ Send notifications                         │
│    ✅ Log to webhookLogs table                      │
│    └─ Mark as processed                             │
└────────────────┬──────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────┐
│ 6. NOTIFICATIONS                                    │
│    ✅ Seller: Payment received + funds in escrow    │
│    ✅ Buyer: Order confirmed, awaiting shipment     │
│    ✅ Errors: Both parties notified of failures     │
└─────────────────────────────────────────────────────┘
```

## ✅ What's Working

### 1. Tsara Integration ✅
- **Fiat Payment Links** - NGN card/bank transfers
- **Stablecoin Payments** - USDC on Solana
- **Payment Verification** - Real-time status checks
- **Error Handling** - Comprehensive retry logic
- **Webhook Signature Verification** - HMAC-SHA256 validation

### 2. Single Listing Checkout ✅
- User adds single listing to cart
- Checkout calculates subtotal + shipping
- Creates order with inventory reservation (30 min)
- Redirects to Tsara
- Webhook confirms payment
- Order marked as "confirmed"
- Inventory reserved properly

### 3. Collection Listing Checkout ✅
- User selects multiple items from collection
- Cart shows all items with correct pricing
- Checkout creates separate orders per item
- Single payment covers all items
- All inventory reservations created simultaneously
- Webhook confirms all orders at once

### 4. Inventory Management ✅
```
✅ Reserve inventory (30 min hold during pending payment)
✅ Confirm reservation (deduct from quantityAvailable on payment success)
✅ Release reservation (restore stock if payment fails)
✅ Cleanup expired reservations (auto-release after 30 min)
```

### 5. Order State Management ✅
```
pending → confirmed (payment verified) or canceled (payment failed)
confirmed → shipped (seller confirms) or canceled
shipped → delivered (tracking confirms) or canceled (dispute)
delivered → refunded (refund processed) or returned (physical return)
```

### 6. Payment Hold Escrow (30 Days) ✅
- Payment confirmed → Creates hold record
- `heldAt`: Payment confirmation timestamp
- `releaseableAt`: 30 days from heldAt
- Status: `active` → `released` (after 30 days)
- If dispute: `refunded` (back to buyer)

### 7. Webhook Processing ✅
- **Signature verification** - Validates webhook authenticity
- **Duplicate prevention** - Tracks eventId to prevent double-processing
- **Atomic transactions** - Payment + order + inventory all succeed or all fail
- **Error recovery** - Failed webhooks logged, can be retried
- **Notification system** - Sends notifications to buyer & seller

### 8. Error Handling & Rollbacks ✅
Database transactions ensure consistency - all operations succeed or all fail (ACID)

---

# REAL-TIME PAYOUT SYSTEM

## Overview

The payout page has been completely enhanced to use **real database data** with **enterprise-grade real-time capabilities**.

## Backend Implementation

### Enhanced Finance Router (`server/routers/finance.ts`)
- `getPayoutStats`: Calculates real metrics from the financial_ledger table
- `getPayoutHistory`: Fetches actual transactions with proper status mapping
- Implements proper currency conversion (amountCents to decimal)
- Calculates monthly growth percentage from real data

### Real-Time WebSocket Server (`server/websocket/payout-server.ts`)
- Enterprise-level payout notifications
- Handles multiple seller connections with isolation
- Broadcasts balance updates, transaction notifications, and payout status changes
- Auto-reconnection with exponential backoff
- Heartbeat mechanism for connection health

## Frontend Features

### Real-Time Query Hooks (Already Optimized)
**Location**: `modules/seller/queries/usePayoutStats.ts`
- Aggressive 10-second polling for live balance updates
- Background refresh enabled (`refetchIntervalInBackground: true`)
- Immediate refresh on tab focus
- Auto-retry with exponential backoff

### New Real-Time Hook
**Location**: `modules/seller/hooks/usePayoutRealtimeUpdates.ts`
- WebSocket client for instant updates
- Automatic reconnection (5 attempts with exponential delay)
- Syncs data with React Query cache
- Handles message routing for different update types

### Updated Components
- **PayoutStats.tsx**: Uses real data, WebSocket integration, live indicator badge
- **PayoutHistory.tsx**: Displays real transactions from database, proper status filtering
- **PayoutsPage.tsx**: Displays actual payout stats with real-time updates

## Key Features

✓ **Real Data**: All metrics pull from `financial_ledger` database table
✓ **Real-Time Updates**: Dual approach - 10-second polling + WebSocket
✓ **Enterprise-Grade**: Automatic reconnection, heartbeats, multi-seller isolation
✓ **Live Indicators**: Visual "● Live" badge when connected
✓ **Error Handling**: Proper retry logic and fallback states
✓ **Performance**: Optimized query caching and stale time management
✓ **No TypeScript Errors**: Clean type casting where needed

---

# DOJAH ID VERIFICATION

## Overview

**5 Major Improvements Implemented:**

1. ✅ **API Credentials Configuration** - Secure credential management
2. ✅ **Country-Specific Verification** - Multi-country support
3. ✅ **Detailed Response Data** - Store verified personal information
4. ✅ **Retry Logic** - Exponential backoff for failed requests
5. ✅ **Response Validation** - Strict Dojah response validation

## Files Created/Modified

### 1. **server/lib/dojah.ts** ✅ CREATED
Comprehensive Dojah utility module with:
- Country endpoints mapping (Nigeria, Kenya, Ghana, South Africa, Uganda, Tanzania)
- ID type mapping to Dojah format
- Response validation using Zod schemas
- Retry logic with exponential backoff
- Reusable verification function

### 2. **server/db/schema.ts** ✅ MODIFIED
Added new fields to `sellerBusiness` table:
```typescript
verificationStatus: varchar('verification_status')      // pending, verified, failed
firstName: varchar('verified_first_name')
lastName: varchar('verified_last_name')
dateOfBirth: varchar('verified_date_of_birth')
verificationCountry: varchar('verification_country')
verificationDate: timestamp('verification_date')
dojahResponse: jsonb('dojah_response')                 // Full response for audit trail
```

### 3. **Frontend Component** ✅ CREATED
Enterprise-level ID verification UI with:
- Country selection and display
- ID type dropdown with 4 options
- ID number input field
- Real-time validation
- Loading, success, and error states
- Verified data display with toggle-able visibility
- Help text and guidance

## Supported Countries

| Country | Code | Status |
|---------|------|--------|
| Nigeria | NG | ✅ Supported |
| Kenya | KE | ✅ Supported |
| Ghana | GH | ✅ Supported |
| South Africa | ZA | ✅ Supported |
| Uganda | UG | ✅ Supported |
| Tanzania | TZ | ✅ Supported |

## Key Features

### ✅ 1. API Credentials - Secure Configuration
Validates credentials before making any API calls. Returns helpful error if not configured.

### ✅ 2. Country-Specific Verification
Supports Nigeria, Kenya, Ghana, South Africa, Uganda, and Tanzania with dedicated endpoints.

### ✅ 3. Detailed Response Data Capture
Stores all verified personal information including:
- First name, last name
- Date of birth
- Phone, email, address
- Full Dojah response for audit trail

### ✅ 4. Retry Logic with Exponential Backoff
- Max 3 retries
- Initial delay: 1 second
- Exponential backoff: doubles each attempt
- Max delay: 10 seconds
- Auto-retries network errors and server errors

### ✅ 5. Response Validation
Strict Zod schema validation ensures:
- Proper response structure
- Required fields present
- Detailed error messages if validation fails

## Quick Setup

### Step 1: Get Credentials
1. Visit https://dojah.io
2. Sign up for an account
3. Navigate to API Keys section
4. Copy App ID and Secret Key

### Step 2: Configure Environment
```env
DOJAH_APP_ID=your_actual_app_id
DOJAH_SECRET_KEY=your_actual_secret_key
```

### Step 3: Database Migration
```bash
npm run db:generate
npm run db:migrate
```

### Step 4: Build & Test
```bash
pnpm build
```

---

# ENTERPRISE SUPPORT SYSTEM

## Overview

Full enterprise-level support management system with:
- Real-time WebSocket notifications
- Admin dashboard
- SLA tracking and automation
- Team member management
- Escalation rules and routing
- Comprehensive email notifications
- Audit logging

## Key Features

### 1. Real-time Notifications via WebSocket
**Location**: `server/websocket/support-server.ts`

Provides live updates for:
- New ticket creation
- Ticket assignment
- SLA breaches
- Escalations
- Status changes

### 2. Admin Dashboard
**Location**: `app/admin/support/page.tsx`

Real-time metrics including:
- Total Tickets
- Open Tickets
- In Progress
- SLA Breaches
- Average Response Time
- Average Resolution Time
- Team Utilization
- Top Categories
- Urgent Tickets

### 3. SLA Policy Management
Define SLA policies per category and priority:
```typescript
{
  category: 'payment_problem',
  priority: 'urgent',
  responseSlaMinutes: 15,      // Must respond within 15 mins
  resolutionSlaMinutes: 120    // Must resolve within 2 hours
}
```

### 4. Ticket Assignment & Routing
- Assign tickets to specific team members
- Track team member capacity (max active tickets)
- Auto-update current active ticket count
- Prevent overload (can't exceed max capacity)

### 5. Escalation Rules & Automation
**Trigger Types**:
- `sla_breach`: Escalate when SLA is breached
- `no_response_hours`: No response for X hours
- `priority_level`: Specific priority levels
- `custom`: Custom conditions

### 6. Email Notifications
Email types sent:
1. **Ticket Created** - Sent to support team
2. **Ticket Assigned** - Sent to assigned agent
3. **Ticket Resolved** - Sent to customer
4. **SLA Breach** - Sent to supervisor (CRITICAL)
5. **Escalation** - Sent to manager

### 7. Team Member Management
Track:
- User ID
- Role (agent, supervisor, manager)
- Status (active, inactive, on-leave)
- Max active tickets capacity
- Current active tickets
- Average resolution time

### 8. Internal Notes & Audit Logs
- Add internal notes not visible to customers
- Track which agent added the note
- Every action is logged
- Full change history

## Database Schema

### supportTeamMembers
```sql
id: UUID
userId: UUID
role: VARCHAR (agent, supervisor, manager)
status: VARCHAR (active, inactive, on-leave)
maxActiveTickets: INTEGER
currentActiveTickets: INTEGER
averageResolutionTime: INTEGER (minutes)
createdAt: TIMESTAMP
```

### supportTicketAssignments
```sql
id: UUID
ticketId: UUID (FK)
assignedToId: UUID
assignedAt: TIMESTAMP
unassignedAt: TIMESTAMP (nullable)
```

### supportSLAPolicy
```sql
id: UUID
category: ENUM
priority: ENUM
responseSlaMinutes: INTEGER
resolutionSlaMinutes: INTEGER
UNIQUE(category, priority)
```

### supportSLAMetrics
```sql
id: UUID
ticketId: UUID (FK)
responseSlaDeadline: TIMESTAMP
resolutionSlaDeadline: TIMESTAMP
responseBreached: BOOLEAN
resolutionBreached: BOOLEAN
```

---

# LOYALTY NFT SYSTEM

## Overview
The Loyalty NFT System automatically mints NFTs for buyers when they reach spending thresholds on Luxela.

## NFT Tiers & Thresholds

| Tier | Spending Threshold | Points Required | Description |
|------|-------------------|-----------------|-------------|
| Bronze | $100+ | 100 | Entry-level NFT for new loyal customers |
| Silver | $500+ | 500 | Mid-tier NFT for regular buyers |
| Gold | $1000+ | 1000 | Premium NFT for top-tier customers |

## Database Schema

### loyaltyNFTs Table
- `id`: Unique NFT identifier
- `buyerId`: Reference to buyer
- `tier`: NFT tier (Bronze, Silver, Gold)
- `loyaltyPoints`: Points accumulated from purchases
- `earnedDate`: When the NFT was minted
- `image`: NFT image URL
- `title`: NFT name/title
- `rarity`: Rarity level based on tier
- `property`: Category/property of the NFT

## Services

### loyaltyService.ts
- `processBuyerLoyalty()`: Main function called after successful payment
- Checks buyer spending total
- Creates NFTs for newly unlocked tiers
- Updates loyalty points

## Payment Integration

### tsara/route.ts
- Listens for successful Tsara payments
- Calls `processBuyerLoyalty()` after payment confirmation
- Automatically mints NFTs without buyer interaction

## Implementation Flow

1. **Buyer Makes Purchase**
   - Payment processed through Tsara
   - Payment webhook receives callback

2. **Webhook Processing**
   - Confirms payment success
   - Creates order in database
   - Calls `processBuyerLoyalty(buyerId, totalPaid)`

3. **Loyalty Processing**
   - Calculates buyer's total spending
   - Checks against tier thresholds
   - Mints new NFTs for unlocked tiers
   - Updates loyalty points

4. **NFT Display**
   - Buyer views NFTs on profile → Loyalty tab
   - Shows tier, points, earned date
   - Displays rarity and property info

## API Endpoints

### Buyer Router
```
GET /trpc/buyer.getLoyaltyNFTs
  - Returns: Array of buyer's NFTs
  - Fields: id, image, title, loyaltyPoints, earnedDate, rarity, property
```

## Key Features
- ✅ Automatic NFT minting on spending thresholds
- ✅ Real database storage (not mock data)
- ✅ Multiple tier support (Bronze, Silver, Gold)
- ✅ Loyalty points tracking
- ✅ Rarity classification
- ✅ Webhook-triggered (no manual intervention needed)

---

# UPDATE LISTING GUIDE

## Quick Reference

### Import
```typescript
import { useUpdateListing } from '@/modules/sellers';
```

### Basic Usage
```typescript
const mutation = useUpdateListing();

mutation.mutate({
  id: 'listing-uuid',
  // Only include fields you want to update
  priceCents: 9999,
  description: 'New description'
});
```

### All Updatable Fields

| Category | Field | Type | Example |
|----------|-------|------|---------|
| **Core** | `id` | UUID | `550e8400-e29b-41d4...` |
| | `title` | string | `"Premium T-Shirt"` |
| | `description` | string\|null | `"High quality cotton"` |
| | `category` | enum | `"men_clothing"` |
| **Pricing** | `priceCents` | number | `9999` |
| | `currency` | string | `"SOL"` |
| **Images** | `image` | string\|null | `"https://..."` |
| | `images` | string[] | `["url1", "url2"]` |
| **Stock** | `quantityAvailable` | number | `50` |
| | `supplyCapacity` | enum | `"limited"` |

### Common Examples

#### Update Price
```typescript
mutation.mutate({
  id: listingId,
  priceCents: 15999  // $159.99
});
```

#### Update Description
```typescript
mutation.mutate({
  id: listingId,
  description: 'Premium quality product description'
});
```

#### Update Stock
```typescript
mutation.mutate({
  id: listingId,
  supplyCapacity: 'limited',
  quantityAvailable: 50
});
```

#### Multiple Updates
```typescript
mutation.mutate({
  id: listingId,
  priceCents: 9999,
  description: 'Updated',
  category: 'women_clothing',
  supplyCapacity: 'limited',
  quantityAvailable: 100,
  sizes: ['XS', 'S', 'M', 'L', 'XL']
});
```

### Loading States
```typescript
mutation.isPending    // true while updating
mutation.isSuccess    // true after success
mutation.isError      // true on error
mutation.data         // Updated listing
mutation.error        // Error details
```

---

# SEO IMPLEMENTATION

## Overview
The SEO implementation follows Next.js best practices and includes:
- Dynamic metadata generation
- Structured data (JSON-LD schemas)
- Open Graph and Twitter Card tags
- XML sitemaps and robots.txt
- Web performance monitoring
- Analytics integration (Google Analytics 4)

## Core Components

### 1. Metadata Management
**Location**: `lib/seo/metadata-generators.ts`

Features:
- Dynamic page metadata generation
- Open Graph tags for social media sharing
- Twitter Card support
- Canonical URL management
- Custom robots directives
- Structured data injection

### 2. Structured Data / Schema.org
**Location**: `lib/seo/schema-generators.ts`

Implemented Schemas:
- **Organization Schema** - Company information
- **WebSite Schema** - Site structure with search action
- **Product Schema** - Product details, pricing, availability
- **Breadcrumb Schema** - Navigation hierarchy
- **Article Schema** - Content metadata
- **Collection Schema** - Category information
- **FAQ Schema** - Frequently asked questions
- **Review Schema** - Product ratings

### 3. Sitemaps
**Location**: `app/sitemap.ts`

Features:
- Automatically includes all pages with dynamic routes
- Adds product pages from database
- Includes static pages (home, brands, collections)
- Proper priority and change frequency settings
- Includes image URLs for image search optimization

### 4. Robots Configuration
**Location**: `app/robots.ts`

Features:
- Controls search engine crawler access
- Disallows admin and private routes
- Allows crawler access to public product pages
- Specifies sitemap location

### 5. Web Vitals & Performance
**Location**: `lib/seo/performance.ts` and `lib/analytics/web-vitals.ts`

Monitors:
- **Largest Contentful Paint (LCP)** - Page loading speed
- **Cumulative Layout Shift (CLS)** - Visual stability
- **First Input Delay (FID)** - Interactivity
- **First Contentful Paint (FCP)** - Perceived load speed
- **Time to First Byte (TTFB)** - Server response time

### 6. Google Analytics 4 Integration
**Location**: `lib/analytics/ga.ts`

Features:
- Automatic page view tracking
- Event tracking capability
- Custom dimension/metric support
- Conversion tracking

## Setup Instructions

### 1. Environment Variables
Create a `.env.local` file with:
```env
NEXT_PUBLIC_SITE_URL=https://yoursite.com
NEXT_PUBLIC_GTM_ID=GTM-XXXXXX
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_API_URL=https://api.yoursite.com
```

### 2. Configure Site Information
Edit `lib/seo/config.ts`:
```typescript
export const SITE = {
  name: 'Your Site Name',
  description: 'Your site description',
  url: process.env.NEXT_PUBLIC_SITE_URL,
  defaultImage: 'https://yoursite.com/og-image.jpg',
  keywords: ['relevant', 'keywords'],
  twitter: '@yourhandle',
};
```

## SEO Best Practices Implemented

✅ **Technical SEO:**
- Canonical URLs to prevent duplicate content
- XML sitemap for crawler discovery
- robots.txt for crawler guidance
- Mobile-responsive design
- Fast page loading
- Structured data for rich results

✅ **On-Page SEO:**
- Unique, descriptive titles
- Meta descriptions for every page
- Heading hierarchy (H1, H2, etc.)
- Image alt text
- Internal linking strategy

✅ **Technical Performance:**
- Web Vitals monitoring and reporting
- Image optimization
- CSS and JavaScript bundling
- Caching strategies

✅ **Social Media:**
- Open Graph tags for all pages
- Twitter Card support
- Product image sharing

## Performance Targets

- **LCP**: < 2.5s
- **CLS**: < 0.1
- **FID/INP**: < 100ms
- **TTFB**: < 600ms
- **First Contentful Paint**: < 1.8s

---

# QUICK REFERENCE

## Common Commands

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run type checking
npm run typecheck

# Run tests
npm run test

# Format code
npm run format

# Lint code
npm run lint
```

## Important Files

### Configuration
- `lib/seo/config.ts` - SEO configuration
- `lib/seo/schema-generators.ts` - Structured data
- `.env.local` - Environment variables

### Payment System
- `server/routers/payment.ts` - Payment routes
- `app/api/webhooks/tsara/route.ts` - Webhook handler
- `server/services/tsara.ts` - Tsara API client

### Database
- `db/schema.ts` - Database schema
- `db/migrations/` - Migration files

### Payout System
- `server/routers/finance.ts` - Finance routes
- `server/websocket/payout-server.ts` - Real-time WebSocket server
- `modules/seller/hooks/usePayoutRealtimeUpdates.ts` - Real-time updates hook

### Dojah Integration
- `server/lib/dojah.ts` - Dojah utility functions
- `server/routers/seller.ts` - Seller verification routes
- `app/sellersAccountSetup/setup.tsx` - Frontend integration

### Support System
- `server/routers/support-admin.ts` - Admin support routes
- `server/websocket/support-server.ts` - Real-time support WebSocket
- `app/admin/support/page.tsx` - Admin dashboard

## Environment Variables Required

```env
# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...

# Tsara Payment
NEXT_PUBLIC_TSARA_PUBLIC_KEY=...
TSARA_WEBHOOK_SECRET=...

# Google Analytics
NEXT_PUBLIC_GA_ID=G-...
NEXT_PUBLIC_GTM_ID=GTM-...

# Dojah ID Verification
DOJAH_APP_ID=...
DOJAH_SECRET_KEY=...

# Support System
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=support@luxela.com

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://...
NEXT_PUBLIC_API_URL=https://...
```

## Troubleshooting

### Build Errors
1. Clear `.next` directory: `rm -rf .next`
2. Clear node_modules: `rm -rf node_modules && npm install`
3. Run type check: `npm run typecheck`

### Database Issues
1. Check connection string in `.env.local`
2. Verify PostgreSQL is running
3. Run migrations: `npm run migrate`

### API Issues
1. Check environment variables are loaded
2. Verify API endpoints are accessible
3. Check error logs for detailed information

### Payment Issues
1. Verify Tsara credentials in `.env`
2. Check webhook URL configuration in Tsara dashboard
3. Monitor webhook events in database

### Payout Issues
1. Check financial_ledger table has real data
2. Verify seller exists and has sales
3. Check WebSocket connection status

### Dojah Issues
1. Verify API credentials in `.env`
2. Check seller's country is supported
3. Review error logs for detailed messages

---

## 📞 Support Resources

- **Next.js Documentation**: https://nextjs.org/docs
- **Drizzle ORM**: https://orm.drizzle.team/
- **TRPC**: https://trpc.io/
- **Tsara Payment**: https://tsara.io/
- **Dojah ID Verification**: https://dojah.io/
- **Schema.org**: https://schema.org/
- **Google Search Central**: https://developers.google.com/search

---

## Document Metadata

- **Created**: 2024
- **Last Updated**: 2024
- **Maintained By**: Development Team
- **Version**: 1.0 - Complete Consolidated
- **Status**: Production Ready ✅

**Total Documentation Pages Consolidated**: 20+  
**All content unified into one comprehensive guide**

---

**END OF COMPLETE DOCUMENTATION**