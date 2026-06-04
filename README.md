# Organic Farm Marketplace

Full-stack marketplace for organic farm products with separate customer and farmer dashboards.

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL + Prisma ORM
- **Real-time**: Socket.io
- **Auth**: NextAuth.js
- **State**: Zustand
- **Charts**: Recharts

## Project Structure

```
organic-farm-marketplace/
├── app/
│   ├── (customer)/          # Customer side
│   │   ├── dashboard/
│   │   │   ├── cart/
│   │   │   ├── orders/
│   │   │   └── billing/
│   │   └── layout.tsx
│   ├── (farmer)/            # Farmer side
│   │   ├── dashboard/
│   │   │   ├── inventory/
│   │   │   ├── orders/
│   │   │   └── analytics/
│   │   └── layout.tsx
│   ├── (auth)/              # Authentication
│   │   ├── login/
│   │   └── register/
│   ├── api/                 # API Routes
│   │   ├── auth/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── users/
│   │   ├── analytics/
│   │   └── payments/
│   └── layout.tsx           # Root layout
├── components/
│   ├── customer/            # Customer UI components
│   ├── farmer/              # Farmer UI components
│   ├── common/              # Shared components
│   └── ui/                  # Reusable UI components
├── lib/
│   ├── utils/               # Utility functions
│   ├── db.ts                # Database client
│   └── auth.ts              # Authentication helpers
├── hooks/                   # Custom React hooks
├── contexts/                # React contexts
├── types/                   # TypeScript types
├── styles/                  # Global styles
├── public/                  # Static assets
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── migrations/
├── socket/                  # Socket.io setup
├── middleware/              # Next.js middleware
├── config/                  # Configuration files
├── .env.example             # Environment variables template
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## Key Features

### Customer Side
- **Product Browsing**: View organic products with filtering & search
- **Shopping Cart**: Add/remove items, persistent storage
- **Order Management**: Place orders, track status in real-time
- **Billing Logs**: Live transaction history with status updates
- **User Profile**: Manage account, addresses, order history

### Farmer Side
- **Inventory Management**: Add/edit/delete products, stock management
- **Order Tracking**: Real-time order notifications and status updates
- **Sales Analytics**: Revenue charts, best-selling products, trends
- **Dashboard**: KPIs and quick stats

## Getting Started

1. **Setup Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your database credentials
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Setup Database**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Open Browser**
   ```
   http://localhost:3000
   ```

## Database Schema

Key entities:
- **User**: Customers and farmers
- **Product**: Farm products with inventory
- **Cart**: Shopping cart for customers
- **Order**: Customer orders
- **OrderItem**: Items in orders
- **BillingLog**: Payment transaction logs
- **Review**: Product reviews
- **Sales**: Sales records for analytics

## API Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/products` - Get all products
- `POST /api/products` - Create product (farmer)
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create order
- `GET /api/analytics/sales` - Get sales data (farmer)

## Real-time Features

Socket.io events:
- `order:placed` - New order notification
- `order:status-updated` - Order status change
- `billing:updated` - Billing log update
- `inventory:updated` - Inventory change notification

## Next Steps

1. Install dependencies: `npm install`
2. Setup database with PostgreSQL
3. Create `.env.local` from `.env.example`
4. Run migrations: `npm run prisma:migrate`
5. Start development: `npm run dev`
