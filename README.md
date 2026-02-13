# Luxela - Fashion E-Commerce Platform

A full-stack, production-ready fashion e-commerce platform built with modern web technologies. Luxela enables buyers to discover and purchase fashion items while sellers can manage inventory, process orders, and track payouts with integrated escrow and payment processing.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Supabase account
- Tsara (Payment processor) account

### Installation

```bash
# Clone repository
git clone https://github.com/luxela/luxela.git
cd luxela

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local

# Configure database
npm run db:generate
npm run db:migrate

# Start development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

## ✨ Features

### 👥 Buyer Features
- Browse fashion collections and individual products
- Advanced search and filtering by category, price, rating
- Shopping cart management with persistence
- Secure checkout with multiple payment methods (Card, Bank Transfer, Crypto/Stablecoin)
- Tsara escrow-backed payment processing
- Real-time order tracking
- Delivery confirmation workflow
- Product reviews and ratings
- Support ticket creation and management
- Order history and favorite items
- Notifications for order updates
- Account settings and profile management

### 🏪 Seller Features
- Create and manage product listings (single & collections) with review workflow
- Multi-image upload (up to 4 images per listing)
- Inventory management with real-time updates
- Pending order management (confirm/cancel)
- Automated payout calculations with multiple payment methods
- 30-day escrow hold system
- Order status tracking
- Customer support ticket management
- Sales analytics and statistics
- Collection management
- **Listing Review System**
  - Real-time notification panel for listing status changes
  - Listing approval/rejection feedback from admin reviewers
  - Resubmit capability for rejected or revision-requested listings
  - Complete activity history with timestamps
  - Status tracking (pending_review → approved|rejected|revision_requested)
- **Comprehensive Payout System**
  - Multi-method verification with OTP-based validation (Bank Transfer, PayPal, Wise, Crypto)
  - Payment method management UI (add/edit/delete)
  - Support for immediate, scheduled, and recurring payouts
  - Payout status tracking with real-time notifications
  - Tsara escrow integration for automatic fund release
  - Payment constraints validation based on payout schedule
  - Profile, store, and shipping account management
  - Enhanced seller notifications for all payout events

### 🏛️ Admin Features
- **Listing Review Dashboard**
  - View all pending listings for quality control
  - Filter by status (pending_review, approved, rejected, archived)
  - Pagination and sorting for efficient management
  - Real-time statistics (pending count, daily approvals, rejection rate)
  - Quick action buttons for batch operations
- **Listing Detail & Review Interface**
  - View full listing details with all images
  - Access seller information and history
  - Approve listings immediately (visible to buyers)
  - Reject listings with reason feedback
  - Request revision with specific improvement comments
  - View complete activity log and audit trail
  - See all previous review actions with reviewer info and timestamps
- **Review Workflow Management**
  - Centralized queue for all pending listings
  - Role-based access (admin-only endpoints with authorization checks)
  - Comprehensive audit trail for compliance
  - Seller notification system for all status changes

### 💳 Payment & Escrow
- **Tsara Payment Gateway Integration**
  - Card payments (2% fee, instant processing, 3D verification)
  - Bank transfers (0.5% + ₦100 fee, 1-2 hour processing)
  - Crypto/Stablecoin (0.1% fee, 5-10 second processing)
- Secure payment processing with multiple methods
- **30-day escrow hold** for buyer protection
  - Funds held in escrow until delivery confirmation
  - Buyer-seller protection mechanism
  - Automatic release after delivery
- **Payout System**
  - Multi-method verification (Bank Transfer, PayPal, Wise, Crypto)
  - OTP-based payout method verification flow
  - Redis integration for temporary OTP storage
  - Support for immediate, scheduled, and recurring payouts
  - Automatic payout release after delivery confirmation
  - Tsara escrow integration for fund management
  - Real-time payout status tracking
- Automatic payout release after delivery
- Payment hold tracking and status updates
- Refund management with escrow integration
- Financial ledger tracking with transaction history
- Dynamic fee calculation based on payment method

### 📋 Listing Approval Workflow
- **Three-Tier Status System**
  - **draft** → Initial seller creation state
  - **pending_review** → Awaiting admin approval (default for new listings)
  - **approved** → Visible to all buyers in catalog
  - **rejected** → Not visible; seller notified with reason
  - **archived** → Seller can delete or resubmit
- **Review Process**
  1. Seller creates listing → automatically marked pending_review
  2. Admin reviews in dashboard with full details and images
  3. Admin decision: Approve (live), Reject (reason provided), Request Revision (feedback)
  4. Seller receives notification with action/feedback
  5. For rejection/revision: Seller edits and resubmits
  6. Process repeats until approved or archived
- **Approval Benefits**
  - ✅ Ensures high-quality product listings only
  - ✅ Prevents misleading/fraudulent product information
  - ✅ Maintains brand quality and user trust
  - ✅ Reduces buyer complaints and returns
  - ✅ Complete compliance audit trail

### 📞 Support System
- **Buyer Support**
  - Ticket creation (general_inquiry, technical_issue, payment_problem, order_issue, refund_request, account_issue, listing_help, other)
  - Priority levels (low, medium, high, urgent)
  - Ticket status tracking (open, in-progress, resolved, closed)
  - Real-time ticket count and statistics
  - 30-second auto-refresh for updates
- **Seller Support**
  - Manage and respond to support tickets
  - Threaded replies and comments
  - Ticket assignment to support team
- Unified support queue for admins
- Notification alerts for new tickets

## 🏗️ Tech Stack

### Frontend
- **Framework:** Next.js 16.1.1 (Turbopack) with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS with custom theme colors
- **State Management:** React Query (TanStack Query) & Context API
- **API Client:** TRPC with optimized JWT authentication
  - Client setup at `app/_trpc/client.ts`
  - React hooks integration with useTRPC pattern
- **Authentication:** Supabase Auth with JWT token caching
  - Reads JWT from cookies (sb-auth-token, access_token)
  - Instant local validation via JWT decoding
- **UI Components:** Radix UI, shadcn/ui, Headless UI, Lucide icons
- **Status Indicators:** Color-coded badges (pending: amber, approved: green, rejected: red, revision: orange)
- **Storage:** localStorage for form persistence, cart data, billing preferences
- **Database Client:** Drizzle ORM for type-safe queries
- **JWT Decoding:** jwt-decode for server-side auth optimization
- **Email:** Resend SMTP integration for contact forms and notifications
- **Validation:** Zod for type-safe input validation across all endpoints
- **State Management:** Redis for payout verification OTP storage and session management

### Backend
- **Runtime:** Node.js with Edge Middleware
- **Framework:** TRPC with 30+ routers for type-safe API
- **Database:** PostgreSQL with Drizzle ORM
  - Schema-driven migrations in server/db/schema.ts
  - Type inference from database schema
  - New listing_reviews & listing_activity_log tables for audit trail
  - listing_status enum with draft|pending_review|approved|rejected|archived states
  - payout_methods, payout_verifications tables for payout system
- **Authentication:** Supabase Auth with JWT token validation
- **File Storage:** Supabase Storage
- **Payment:** Tsara API with Escrow integration
- **Email:** Resend SMTP for transactional communications
- **Validation:** Zod for comprehensive input validation across all routers
- **Services:** 30+ services including escrow, payment, notifications, listing reviews, payout execution
- **Cache/Session:** Redis for OTP storage and payout verification state management
- **Routers:**
  - admin-listing-review: getPendingListings, getListingDetails, approveListing, rejectListing, requestRevision, getActivityHistory, getDashboardStats
  - seller-listing-notifications: getNotifications, markNotificationAsRead
  - buyer-listings-catalog: Filter approved listings only with pagination/sorting
  - payoutVerification: sendVerificationCode, verifyPayoutMethod, getVerificationStatus (OTP-based validation)
  - payoutExecution: Support for Bank Transfer, PayPal, Wise, Crypto, and Tsara payouts

### Infrastructure
- **Deployment:** Vercel (Frontend)
- **Database Hosting:** Supabase
- **File Storage:** Supabase Storage
- **Environment:** .env.local configuration

## 📁 Project Structure

```
luxela/
├── app/                          # Next.js App Router pages & routes
│   ├── _trpc/                   # TRPC client setup (React hooks)
│   ├── api/                     # API routes
│   │   ├── contact/             # Contact form endpoint (Email service)
│   │   └── trpc/                # TRPC API endpoints
│   ├── buyer/                   # Buyer pages (dashboard, cart, notifications, support)
│   ├── sellers/                 # Seller pages (dashboard, orders, collections)
│   │   ├── support-tickets/     # Seller support ticket management
│   │   ├── my-listings/         # Seller listing management with notification panel
│   │   └── notifications/       # Listing status notifications
│   ├── admin/                   # Admin pages (support dashboard, listing review)
│   │   ├── listings/            # Listing review dashboard & detail pages
│   │   └── support/             # Support ticket management
│   ├── cart/                    # Shopping cart page with payment flow
│   ├── account/                 # Account settings
│   ├── auth/                    # Authentication pages (signin, signup, verify)
│   ├── actions/                 # Server actions
│   ├── contact/                 # Contact page
│   ├── ClientProviders.tsx       # Client-side providers wrapper
│   └── layout.tsx               # Root layout with providers
├── server/
│   ├── routers/                 # TRPC routers (30+ feature routers)
│   │   ├── auth/                # Authentication logic
│   │   ├── buyer.ts             # Buyer operations
│   │   ├── seller.ts            # Seller operations
│   │   ├── checkout.ts          # Checkout & orders
│   │   ├── support.ts           # Support tickets (buyer & seller)
│   │   ├── support-admin.ts     # Admin support management
│   │   ├── payment.ts           # Payment processing
│   │   ├── notification.ts      # Notifications
│   │   ├── sales.ts             # Seller sales operations
│   │   ├── inventory.ts         # Inventory management
│   │   ├── finance.ts           # Financial operations
│   │   ├── product.ts           # Product operations
│   │   ├── collection.ts        # Collection management
│   │   ├── review.ts            # Product reviews
│   │   ├── refund.ts            # Refund processing
│   │   ├── shipping.ts          # Shipping management
│   │   ├── webhook.ts           # Webhook handlers
│   │   ├── admin-listing-review.ts # Admin listing approval workflow
│   │   ├── seller-listing-notifications.ts # Seller notifications
│   │   ├── buyer-listings-catalog.ts # Approved listings for buyers
│   │   ├── payoutVerification.ts # OTP-based payout method verification
│   │   ├── payoutExecution.ts   # Multi-method payout processing
│   │   └── (10+ additional routers)
│   ├── db/
│   │   └── schema.ts            # Database schema with Drizzle ORM
│   ├── services/                # Business logic services (30+)
│   │   ├── escrowService.ts     # Escrow & payout management
│   │   ├── paymentService.ts    # Tsara payment processing
│   │   ├── payoutExecutionService.ts # Multi-method payout execution (Bank, PayPal, Wise, Crypto, Tsara)
│   │   ├── emailService.ts      # Email sending via Resend SMTP (with payout templates)
│   │   ├── notificationService.ts # Real-time notifications
│   │   ├── orderService.ts      # Order processing
│   │   ├── paymentFlowService.ts # Payment flow orchestration
│   │   ├── shippingService.ts   # Shipping calculations
│   │   ├── automaticPayoutService.ts # Automatic payout scheduler
│   │   ├── schedulerService.ts  # Job scheduling
│   │   ├── listingReviewService.ts # Listing approval workflow management
│   │   ├── listingNotificationService.ts # Listing status notifications to sellers
│   │   └── (18+ additional services)
│   ├── lib/                     # Server utilities
│   ├── utils/                   # Server utilities (seller management)
│   ├── trpc/                    # TRPC setup
│   ├── websocket/               # WebSocket support
│   ├── jobs/                    # Background jobs
│   └── index.ts                 # TRPC initialization
├── modules/
│   ├── cart/
│   │   ├── components/          # Cart UI (payment, summary, billing)
│   │   ├── hooks/               # Cart management hooks
│   │   └── types/               # Cart types
│   ├── buyer/
│   │   ├── components/          # Buyer UI (header, sidebar, dashboard)
│   │   ├── hooks/               # Buyer data hooks
│   │   └── types/               # Buyer types
│   ├── seller/
│   │   ├── components/          # Seller UI (dashboard, orders)
│   │   ├── hooks/               # Seller data hooks
│   │   └── types/               # Seller types
│   ├── sellers/
│   │   ├── components/          # Additional seller components
│   │   │   ├── payouts/         # Payout system components
│   │   │   │   ├── PaymentAccount.tsx # Payment method management UI
│   │   │   │   ├── PayoutMethodVerificationModal.tsx # OTP verification
│   │   │   │   ├── EditPayoutMethodModal.tsx # Edit payment methods
│   │   │   │   ├── DeletePayoutMethodModal.tsx # Delete payment methods
│   │   │   │   ├── ProfileAccount.tsx # Seller profile management
│   │   │   │   ├── StoreAccount.tsx # Store settings
│   │   │   │   ├── AdditionalAccount.tsx # Additional account setup
│   │   │   │   └── ShippingAccount.tsx # Shipping settings
│   │   └── support/             # Support-related seller modules
│   ├── admin/
│   │   └── components/          # Admin UI components
│   └── shared/
│       ├── components/          # Shared UI components
│       ├── hooks/               # Shared hooks
│       └── types/               # Shared types
├── components/
│   ├── buyer/                   # Buyer-specific components
│   ├── ui/                      # Base UI components (shadcn/ui, Radix)
│   └── (shared components)      # Global components
├── lib/
│   ├── _trpc/                   # TRPC client utilities
│   ├── trpc/                    # TRPC configuration
│   ├── hooks/                   # Custom React hooks
│   ├── utils/                   # Helper functions & utilities
│   ├── providers/               # Context providers
│   ├── auth/                    # Authentication utilities
│   ├── analytics/               # Analytics integration
│   ├── emails/                  # Email templates
│   ├── seo/                     # SEO utilities
│   ├── data/                    # Data utilities
│   ├── constants/               # App constants
│   ├── api.ts                   # API client setup
│   ├── trpc.ts                  # TRPC setup
│   └── queryClient.ts           # React Query client
├── context/                      # React Context API providers
├── constants/                    # App-wide constants
├── hooks/                        # Root-level custom hooks
├── types/                        # TypeScript type definitions
├── utils/                        # Root-level utilities
├── services/                     # Additional services
├── functions/                    # Utility functions
├── public/                       # Static assets (SVGs, images, icons)
├── drizzle/                      # Drizzle ORM migrations
├── scripts/                      # Build & utility scripts
├── proxy.ts                      # Authentication middleware (JWT optimization)
├── middleware.ts                 # Next.js middleware
├── env.ts                        # Environment validation
├── env.js                        # Runtime env config
└── docs/
    └── LUXELA_COMPLETE_DOCUMENTATION.md  # Complete technical documentation
```

## 🗄️ Database Schema

### Core Tables
- **users** - Authentication and profiles
- **buyers** - Buyer-specific information
- **sellers** - Seller-specific information
- **products** - Product listings with listing_status field
- **listing_reviews** - Admin review decisions and feedback
- **listing_activity_log** - Complete audit trail of listing actions
- **payout_methods** - Seller payment method configurations (NEW)
- **payout_verifications** - OTP verification tracking for payout methods (NEW)
- **payouts** - Payout records with status and scheduling (NEW)
- **orders** - Customer orders
- **payments** - Payment records
- **escrows** - Escrow holds
- **supportTickets** - Support system
- **collections** - Product collections

### Relationships
- One-to-Many: Users → Orders, Orders → Payments
- One-to-Many: Products → ListingReviews (for audit trail)
- One-to-Many: Products → ListingActivityLog (for activity history)
- One-to-Many: Sellers → PayoutMethods, PayoutMethods → PayoutVerifications
- One-to-Many: Sellers → Payouts (payout schedule tracking)
- One-to-One: Users → Buyers/Sellers
- Many-to-Many: Products → Collections
- Cascading deletes configured for data integrity
- Foreign keys: listing_reviews.reviewer_id → users.id (admin only)
- Foreign keys: payout_methods.seller_id → sellers.id, payout_verifications.method_id → payout_methods.id

See `/docs/LUXELA_COMPLETE_DOCUMENTATION.md` for complete schema details.

## 🚀 Running the Application

### Development
```bash
npm run dev
```
Frontend: `http://localhost:3000`
Optimization: JWT auth caching reduces proxy.ts time from 1-11s to <100ms per request

### Production Build
```bash
npm run build
npm run start
```

### Database Commands
```bash
# Generate migrations
npm run db:generate

# Run migrations
npm run db:migrate

# Push schema to database
npm run db:push

# Open database studio
npm run db:studio
```

## 🔌 API Routes

All API routes are TRPC-based at `/api/trpc/[...trpc]`

### Example Queries
```typescript
// Get products
await trpc.product.getProducts.query({ limit: 10 })

// Get cart items
await trpc.cart.getCart.query()

// Get pending orders (seller)
await trpc.sales.getPendingOrders.query()
```

### Example Mutations
```typescript
// Create order
await trpc.checkout.createOrder.mutate({
  items: [...],
  shippingAddress: {...},
  paymentMethodId: "..."
})

// Confirm order (seller)
await trpc.sales.confirmOrder.mutate({ orderId: "..." })

// Create support ticket
await trpc.support.createTicket.mutate({
  category: "technical",
  priority: "high",
  title: "Issue with listing",
  description: "..."
})
```

## 🔐 Authentication & Authorization

- **Authentication:** Supabase Auth (email/password, OAuth)
- **JWT Optimization:** Server-side token decoding instead of API calls
  - Reads JWT from cookies (sb-auth-token, access_token)
  - Instant local validation (microseconds vs 1-11 seconds)
  - Eliminates Supabase API calls on every request
- **Authorization:** Role-based (buyer, seller, admin)
- **Protected Routes:** All seller operations require seller role
  - Auto-redirect non-sellers to dashboard
  - Graceful error handling for permission denials
- **TRPC Procedures:** Protected procedures check `ctx.userId` and role

## 📝 Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database
DATABASE_URL=postgresql://user:password@host:5432/luxela

# Payment (Tsara)
NEXT_PUBLIC_TSARA_PUBLIC_KEY=your_public_key
TSARA_SECRET_KEY=your_secret_key
TSARA_WEBHOOK_SECRET=your_webhook_secret

# Email Service (Resend SMTP)
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=your_resend_api_key
ADMIN_EMAIL=support@theluxela.com

# API
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## 📊 Key Features Deep Dive

### Escrow System
- **30-day escrow hold** on all payments
  - Protects buyers from non-delivery
  - Protects sellers from false claims
  - Funds held securely in Tsara escrow
- **Payment Methods with Escrow:**
  - **Card**: Payment held until delivery confirmation
  - **Bank Transfer**: Funds held in escrow until seller ships
  - **Crypto/Stablecoin**: Held in smart contract escrow
- Automatic release after delivery confirmation
- Payout scheduled for release day
- Real-time escrow status tracking
- Configurable hold duration (default: 30 days)

### Order Lifecycle
1. **Placed** - Buyer creates order with Tsara payment (escrow initiated)
2. **Payment Confirmed** - Payment processor confirms payment
3. **Confirmed** - Seller confirms order acceptance
4. **Processing** - Seller prepares shipment
5. **Shipped** - Seller marks as shipped with tracking
6. **In Transit** - Buyer receives tracking info, payment in escrow
7. **Delivered** - Buyer confirms delivery
8. **Completed** - Escrow released after 30 days or confirmation
9. **Payout** - Seller receives payment (minus fees and holds)

### Form Persistence & UX
- Checkout form data saved to localStorage
- Billing address selection persisted
- Payment method preference saved
- Pending orders filters persisted
- Auto-restore on page refresh
- Clear on successful completion
- Dynamic shipping calculation (free over ₦50,000)
- Payment fee display (method-specific rates)

## 🧪 Testing

```bash
# Run tests (when configured)
npm run test

# Run tests in watch mode
npm run test:watch
```

## 📚 Documentation

For comprehensive documentation, see `/docs/LUXELA_COMPLETE_DOCUMENTATION.md` which includes:
- Complete API reference for all 23 routers
- Database schema with relationships
- Frontend hooks reference
- Complete buyer and seller workflows
- Escrow and payment system details
- Architecture diagrams
- Best practices
- Deployment guide
- Troubleshooting guide

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## 📋 Code Guidelines

- Use TypeScript for all files
- Follow ESLint configuration
- Add proper error handling
- Use React Query for data fetching
- Implement loading and error states
- Add toast notifications for user feedback
- Test complex business logic

## ⚡ Recent Optimizations & Bug Fixes

### Latest Fixes (v1.2.0 - Comprehensive Payout System Implementation)
- **Multi-Method Payout System**
  - OTP-based payout method verification for Bank Transfer, PayPal, Wise, Crypto
  - payoutVerificationRouter with sendVerificationCode and verifyPayoutMethod endpoints
  - payoutExecutionService supporting immediate, scheduled, and recurring payouts
  - Redis integration for secure OTP storage and session management
  - Email notifications with payout verification templates
  - Real-time payout status tracking and notifications
- **Seller Account Dashboard Redesign**
  - PaymentAccount.tsx - Comprehensive payment method management with add/edit/delete
  - ProfileAccount.tsx - Seller profile information updates
  - StoreAccount.tsx - Store settings and branding
  - AdditionalAccount.tsx & ShippingAccount.tsx - Account setup flows
  - Integrated payout management UI with verification workflows
  - Enhanced seller notifications for all payout events
- **Buyer Experience Improvements**
  - Enhanced dashboard organization and navigation
  - Improved returns and order management
  - Updated support ticket interface
- **Database Schema Enhancements**
  - New payout_methods table for seller payment configurations
  - New payout_verifications table for OTP tracking
  - New payouts table for payout scheduling and status
  - Drizzle migrations 0013, 0014, 0015 for payout system
- **Configuration Updates**
  - Vercel deployment configuration optimized
  - TRPC provider and router enhancements for payout endpoints
  - Comprehensive TypeScript type definitions for payout operations

### Previous Fixes (v1.1.0 - Enterprise Listing Review System)
- **Enterprise Listing Review Workflow**
  - Three-tier approval system (pending_review → approved|rejected|revision_requested)
  - Admin dashboard with statistics and filtering by status
  - Seller notification panel integrated into my-listings page
  - Complete audit trail with activity history for compliance
  - Zod validation schemas for all review endpoints
  - TRPCError handling for authorization and validation
  - Role-based access control (admin-only endpoints)
- **Database Schema Updates**
  - listing_status enum with draft|pending_review|approved|rejected|archived
  - listing_reviews table for storing approval decisions
  - listing_activity_log table for complete audit trail
  - Proper foreign key relationships and indexes
- **UI/UX Enhancements**
  - Color-coded status badges (pending: amber, approved: green, rejected: red, revision: orange)
  - Pagination and filtering on admin dashboard
  - Activity timeline showing all review actions with timestamps
  - Focused modals for approval/rejection/revision actions
  - Notification panel for sellers with status updates
- **Documentation Updates**
  - IMPLEMENTATION_SUMMARY.md with feature overview
  - IMPLEMENTATION_GUIDE.md with integration checklist
  - LISTING_REVIEW_SYSTEM.md with system architecture
  - DEPLOYMENT_READY_CHECKLIST.md with pre/post deployment steps
  - TESTING_GUIDE.md with test scenarios
  - SYSTEM_IMPLEMENTATION_COMPLETE.md with detailed specs

### Other Fixes (v1.0.1)
- Support Ticket TRPC routing corrected to use trpc.support.createTicket
- TRPC client imports fixed to use @/app/_trpc/client
- Resend SMTP email integration for contact forms
- TypeScript type inference for seller profiles

### Performance
- **JWT Auth Caching**: Reduced auth overhead from 1-11s to <100ms
  - Decodes JWT tokens locally instead of calling Supabase
  - Checks multiple cookie locations for compatibility
- **Hydration Mismatch Fixes**: Fixed SSR/client rendering mismatches
  - Proper `mounted` state handling
  - Conditional rendering after hydration
- **Listing Review System**: Enterprise-grade optimization
  - Pagination support for large listing queues
  - Indexed database queries for fast filtering
  - Cached dashboard statistics
  - Efficient audit trail queries
- **Payment Flow**: Enterprise-level improvements
  - Dynamic shipping calculation
  - Payment method-specific fee display
  - Complete billing data collection

### UX/Design
- Removed duplicate wishlist feature (consolidated to favorite-items)
- Enhanced payment method selection with Tsara escrow details
- Improved notification routing and support ticket access
- Added SVG assets for payment methods (Visa, Mastercard, Amex, Crypto wallets)
- **Listing Review System UX**
  - Integrated notification panel into seller dashboard
  - Color-coded status badges for quick visual feedback
  - Timeline view for complete listing history
  - Modal-based actions for approval/rejection/revision
  - Real-time status updates and notifications

## 🐛 Known Issues & Troubleshooting

For common issues and solutions, see the troubleshooting section in `/docs/LUXELA_COMPLETE_DOCUMENTATION.md`

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Support

For issues, feature requests, or questions:
1. Check the documentation in `/docs/LUXELA_COMPLETE_DOCUMENTATION.md`
2. Open an issue on GitHub
3. Contact the development team

## 🎯 Roadmap

### Phase 2 Enhancements
- [ ] Mobile app (React Native)
- [ ] Advanced seller analytics dashboard
- [ ] AI-powered product recommendations
- [ ] Multi-language support
- [ ] Additional payment methods (Apple Pay, Google Pay)
- [ ] Subscription model support for sellers
- [ ] Live chat support integration (WebSocket)
- [ ] Augmented reality product preview
- [ ] SMS notifications for order updates
- [ ] Seller rating and verification system
- [ ] Bulk order discount system
- [ ] Gift cards and vouchers
- [ ] In-app web3 chat

---

## 📖 Version History

### v1.2.0 (Current - Latest)
- ✅ Comprehensive multi-method payout system (Bank, PayPal, Wise, Crypto, Tsara)
- ✅ OTP-based payout method verification with Redis backend
- ✅ Seller account dashboard complete redesign (Payment, Profile, Store, Shipping)
- ✅ PayoutMethodVerificationModal with secure OTP entry
- ✅ EditPayoutMethodModal and DeletePayoutMethodModal components
- ✅ PayoutMethods list with real-time status updates
- ✅ Enhanced SellerNavbar with payout shortcuts
- ✅ payoutExecutionService supporting multiple payout schedules
- ✅ Payout verification email templates via Resend SMTP
- ✅ Real-time payout status tracking and seller notifications
- ✅ Tsara escrow integration for automatic fund release
- ✅ Payment constraint validation for different payout types
- ✅ Database migrations for payout and verification tables

### v1.1.0 (Previous)
- ✅ Enterprise listing review workflow (three-tier approval system)
- ✅ Admin listing review dashboard with statistics and filtering
- ✅ Seller listing notification panel with status updates
- ✅ Complete audit trail (listing_activity_log) for compliance
- ✅ Role-based access control for admin-only endpoints
- ✅ Buyer catalog filtered for approved listings only
- ✅ Zod validation schemas for all review endpoints
- ✅ Color-coded status badges (pending, approved, rejected, revision)
- ✅ Activity timeline with complete listing history
- ✅ Seller resubmission workflow for rejected/revision listings
- ✅ Comprehensive documentation (IMPLEMENTATION_SUMMARY, GUIDE, TESTING_GUIDE)
- ✅ Database schema updates with proper foreign keys and indexes
- ✅ TRPCError handling for authorization and validation

### v1.0.1 (Earlier)
- ✅ Full buyer & seller platform
- ✅ Tsara payment integration with escrow
- ✅ Support ticket system (buyer & seller)
- ✅ Performance optimizations (JWT auth caching)
- ✅ Enterprise payment flow with multiple methods
- ✅ Hydration mismatch fixes
- ✅ Admin support dashboard
- ✅ Resend SMTP email integration for contact forms
- ✅ Fixed TRPC support ticket routing
- ✅ Corrected @/app/_trpc/client import paths
- ✅ TypeScript type inference improvements for seller data

### v1.3.0 (In Progress)
- 🚧 Mobile app (React Native)
- 🚧 Advanced seller analytics dashboard
- 🚧 AI-powered product recommendations
- 🚧 Bulk listing operations
- 🚧 Live chat support integration

---

**Made with ❤️ by the Luxela Team**