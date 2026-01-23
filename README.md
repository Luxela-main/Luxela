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
- Secure checkout with multiple payment methods
- Real-time order tracking
- Delivery confirmation workflow
- Product reviews and ratings
- Support ticket system
- Order history and wishlist
- Notifications for order updates

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
- Tsara payment gateway integration
- Secure payment processing
- 30-day escrow hold for buyer protection
- Automatic payout release after delivery
- Payment hold tracking
- Refund management
- Financial ledger tracking

### 📞 Support System
- Ticket creation (technical, billing, shipping, general)
- Priority levels (low, medium, high, urgent)
- Ticket status tracking (open, in-progress, resolved, closed)
- Threaded replies and comments
- Seller and buyer support queues

## 🏗️ Tech Stack

### Frontend
- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** React Query (TanStack Query)
- **API Client:** TRPC
- **Authentication:** Supabase Auth
- **UI Components:** Radix UI, shadcn/ui
- **Storage:** localStorage for form persistence
- **Database Client:** Drizzle ORM

### Backend
- **Runtime:** Node.js
- **Framework:** TRPC
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** Supabase Auth
- **File Storage:** Supabase Storage
- **Payment:** Tsara API
- **Validation:** Zod

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
│   ├── buyer/                   # Buyer pages (checkout, orders)
│   ├── sellers/                 # Seller pages (pending-orders, collections)
│   └── layout.tsx               # Root layout with providers
├── server/
│   ├── trpc/
│   │   ├── router.ts            # Main TRPC router with all routers
│   │   ├── trpc.ts              # TRPC setup and context
│   │   └── (individual routers)  # 23 feature routers
│   ├── db/
│   │   ├── schema.ts            # Database schema with Drizzle
│   │   └── (migrations)          # Database migrations
│   ├── services/                # Business logic services
│   │   ├── escrowService.ts     # Escrow & payout management
│   │   ├── paymentService.ts    # Tsara payment processing
│   │   └── (other services)
│   └── index.ts                 # Exports appRouter
├── modules/
│   ├── buyer/
│   │   ├── queries/             # React Query hooks (useCart, useCheckout, etc.)
│   │   ├── components/          # Buyer UI components
│   │   └── types/               # Buyer TypeScript types
│   ├── seller/
│   │   ├── queries/             # React Query hooks (usePendingOrders, etc.)
│   │   ├── components/          # Seller UI components
│   │   └── types/               # Seller TypeScript types
│   └── shared/
│       ├── components/          # Shared UI components
│       ├── hooks/               # Shared hooks (useToast, useLocalStorage)
│       └── types/               # Shared types
├── lib/
│   ├── hooks/                   # Utility hooks
│   ├── utils/                   # Helper functions
│   └── config/                  # Configuration files
├── components/                  # Global components
├── public/                       # Static assets
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
- **Authorization:** Role-based (buyer, seller, admin)
- **Protected Routes:** All seller operations require seller role
- **TRPC Procedures:** Protected procedures check `ctx.userId`

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
- 30-day hold on all payments
- Automatic release after delivery confirmation
- Buyer protection against non-delivery
- Seller protection against false claims
- Payout scheduled for release day

### Order Lifecycle
1. **Placed** - Buyer creates order
2. **Confirmed** - Seller confirms order
3. **Processing** - Seller prepares shipment
4. **Shipped** - Seller marks as shipped
5. **In Transit** - Buyer receives tracking
6. **Delivered** - Buyer confirms delivery
7. **Completed** - Escrow released, payment sent

### Form Persistence
- Checkout form data saved to localStorage
- Pending orders filters persisted
- Auto-restore on page refresh
- Clear on successful completion

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

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] AI-powered recommendations
- [ ] Multi-language support
- [ ] Additional payment methods
- [ ] Subscription model support
- [ ] Live chat support integration
- [ ] Augmented reality product preview

---

**Made with ❤️ by the Luxela Team**