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
- Create and manage product listings (single & collections)
- Multi-image upload (up to 4 images per listing)
- Inventory management with real-time updates
- Pending order management (confirm/cancel)
- Automated payout calculations
- 30-day escrow hold system
- Order status tracking
- Customer support ticket management
- Sales analytics and statistics
- Collection management

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
- Automatic payout release after delivery
- Payment hold tracking and status updates
- Refund management with escrow integration
- Financial ledger tracking with transaction history
- Dynamic fee calculation based on payment method

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
- **Framework:** Next.js 16 (Turbopack) with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** React Query (TanStack Query) & Context API
- **API Client:** TRPC with optimized JWT authentication
- **Authentication:** Supabase Auth with JWT token caching
- **UI Components:** Radix UI, shadcn/ui, Headless UI
- **Storage:** localStorage for form persistence
- **Database Client:** Drizzle ORM
- **JWT Decoding:** jwt-decode for server-side auth optimization

### Backend
- **Runtime:** Node.js with Edge Middleware
- **Framework:** TRPC with 23+ routers
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** Supabase Auth with JWT token validation
- **File Storage:** Supabase Storage
- **Payment:** Tsara API (Card, Bank Transfer, Crypto)
- **Validation:** Zod for type-safe validation
- **Services:** Escrow, Payment, Analytics services

### Infrastructure
- **Deployment:** Vercel (Frontend)
- **Database Hosting:** Supabase
- **File Storage:** Supabase Storage
- **Environment:** .env.local configuration

## 📁 Project Structure

```
luxela/
├── app/                          # Next.js App Router pages
│   ├── api/trpc/                # TRPC API endpoints
│   ├── buyer/                   # Buyer pages (dashboard, cart, notifications, support)
│   ├── seller/                  # Seller pages (dashboard, orders, collections)
│   ├── admin/                   # Admin pages (support dashboard)
│   ├── cart/                    # Shopping cart page with payment flow
│   ├── account/                 # Account settings
│   └── layout.tsx               # Root layout with providers
├── server/
│   ├── routers/                 # TRPC routers (23+ feature routers)
│   │   ├── buyer.ts             # Buyer operations
│   │   ├── seller.ts            # Seller operations
│   │   ├── checkout.ts          # Checkout & orders
│   │   ├── support.ts           # Support tickets (buyer & seller)
│   │   ├── support-admin.ts     # Admin support management
│   │   ├── payment.ts           # Payment processing
│   │   ├── notification.ts      # Notifications
│   │   └── (other routers)      # 16+ additional routers
│   ├── db/
│   │   └── schema.ts            # Database schema with Drizzle ORM
│   ├── services/                # Business logic services
│   │   ├── escrowService.ts     # Escrow & payout management
│   │   ├── paymentService.ts    # Tsara payment processing
│   │   └── (other services)     # Analytics, email, etc.
│   └── utils.ts                 # Server utilities (seller management)
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
│   └── shared/
│       ├── components/          # Shared UI components
│       ├── hooks/               # Shared hooks
│       └── types/               # Shared types
├── components/
│   ├── buyer/                   # Buyer-specific components
│   ├── ui/                      # Base UI components
│   └── (shared components)      # Global components
├── lib/
│   ├── hooks/                   # Custom React hooks
│   ├── utils/                   # Helper functions
│   └── providers/               # Context providers
├── public/                       # Static assets (SVGs, images)
├── proxy.ts                      # Authentication middleware (JWT optimization)
├── middleware.ts                 # Next.js middleware
└── docs/
    └── LUXELA_COMPLETE_DOCUMENTATION.md  # Complete technical documentation
```

## 🗄️ Database Schema

### Core Tables
- **users** - Authentication and profiles
- **buyers** - Buyer-specific information
- **sellers** - Seller-specific information
- **products** - Product listings
- **orders** - Customer orders
- **payments** - Payment records
- **escrows** - Escrow holds
- **supportTickets** - Support system
- **collections** - Product collections

### Relationships
- One-to-Many: Users → Orders, Orders → Payments
- One-to-One: Users → Buyers/Sellers
- Many-to-Many: Products → Collections
- Cascading deletes configured for data integrity

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
- Real-time tax calculation (7.5% VAT)
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

## ⚡ Recent Optimizations

### Performance
- **JWT Auth Caching**: Reduced auth overhead from 1-11s to <100ms
  - Decodes JWT tokens locally instead of calling Supabase
  - Checks multiple cookie locations for compatibility
- **Hydration Mismatch Fixes**: Fixed SSR/client rendering mismatches
  - Proper `mounted` state handling
  - Conditional rendering after hydration
- **Payment Flow**: Enterprise-level improvements
  - Dynamic shipping calculation
  - Tax calculation (7.5% VAT)
  - Payment method-specific fee display
  - Complete billing data collection

### UX/Design
- Removed duplicate wishlist feature (consolidated to favorite-items)
- Enhanced payment method selection with Tsara escrow details
- Improved notification routing and support ticket access
- Added SVG assets for payment methods (Visa, Mastercard, Amex, Crypto wallets)

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

### v1.0.0 (Current)
- ✅ Full buyer & seller platform
- ✅ Tsara payment integration with escrow
- ✅ Support ticket system (buyer & seller)
- ✅ Performance optimizations (JWT auth caching)
- ✅ Enterprise payment flow with multiple methods
- ✅ Hydration mismatch fixes
- ✅ Admin support dashboard

### v1.1.0 (In Progress)
- 🚧 Mobile app
- 🚧 Advanced analytics
- 🚧 AI recommendations

---

**Made with ❤️ by the Luxela Team**