# QUICK START GUIDE
# Organic Farm Marketplace Setup

## STEP 1: Prerequisites
- Node.js 18+ installed
- PostgreSQL running locally or remote database
- npm or yarn package manager

## STEP 2: Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local and fill in:
# - DATABASE_URL: postgresql://user:password@localhost:5432/organic_farm_db
# - NEXTAUTH_SECRET: Generate with: openssl rand -base64 32
# - NEXTAUTH_URL: http://localhost:3000
```

## STEP 3: Install Dependencies
```bash
npm install
```

## STEP 4: Database Setup
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations (creates tables)
npm run prisma:migrate

# Optional: View database in UI
npm run prisma:studio
```

## STEP 5: Run Development Server
```bash
npm run dev
```

Open http://localhost:3000 in browser

## FOLDER STRUCTURE - Manual Creation Guide
==============================================

If you need to create folders manually, here's what to create:

ROOT LEVEL:
  ✓ package.json (created)
  ✓ tsconfig.json (created)
  ✓ next.config.js (created)
  ✓ tailwind.config.js (created)
  ✓ postcss.config.js (created)
  ✓ README.md (created)
  ✓ .env.example (created)

CREATE THESE FOLDERS:
  □ app/
  □ app/(auth)/login
  □ app/(auth)/register
  □ app/(customer)/dashboard/cart
  □ app/(customer)/dashboard/orders
  □ app/(customer)/dashboard/billing
  □ app/(farmer)/dashboard/inventory
  □ app/(farmer)/dashboard/orders
  □ app/(farmer)/dashboard/analytics
  □ app/api/auth
  □ app/api/products
  □ app/api/orders
  □ app/api/users
  □ app/api/analytics
  □ app/api/payments
  □ components/customer
  □ components/farmer
  □ components/common
  □ components/ui
  □ lib/utils
  □ lib/db
  □ lib/auth
  □ hooks/
  □ contexts/
  □ types/
  □ styles/
  □ public/images
  □ public/icons
  □ prisma/
  □ socket/
  □ middleware/
  □ config/

## BUILDING & DEPLOYMENT

### Local Build:
```bash
npm run build
npm run start
```

### Deploy to Vercel (Recommended):
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy to Docker:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## KEY TECHNOLOGIES

✓ Next.js 14 - React framework with API routes
✓ TypeScript - Type safety
✓ Tailwind CSS - Styling
✓ Prisma - ORM for database
✓ PostgreSQL - Database
✓ NextAuth.js - Authentication
✓ Socket.io - Real-time updates
✓ Recharts - Data visualization
✓ Zustand - State management

## API ENDPOINTS OVERVIEW

AUTH:
  POST /api/auth/login - Login
  POST /api/auth/register - Register
  POST /api/auth/logout - Logout
  GET /api/auth/profile - Get profile

PRODUCTS:
  GET /api/products - List all
  POST /api/products - Create (farmer)
  GET /api/products/[id] - Get detail
  PUT /api/products/[id] - Update (farmer)
  DELETE /api/products/[id] - Delete (farmer)

ORDERS:
  GET /api/orders - Get user orders
  POST /api/orders - Create order
  GET /api/orders/[id] - Get detail
  PUT /api/orders/[id] - Update status

ANALYTICS:
  GET /api/analytics/sales - Sales data (farmer)
  GET /api/analytics/products - Product stats (farmer)

CART:
  GET /api/cart - Get cart
  POST /api/cart - Add item
  DELETE /api/cart/[itemId] - Remove item

PAYMENTS:
  POST /api/payments - Initiate payment
  POST /api/payments/webhook - Payment callback

## REAL-TIME SOCKET EVENTS

CLIENT SIDE (Listen):
  order:placed - New order received (farmer)
  order:status-updated - Order status changed
  billing:updated - Payment status changed
  inventory:updated - Product quantity changed

SERVER SIDE (Emit):
  Similar events for real-time updates

## DATABASE SCHEMA OVERVIEW

Users:
  - id, email, password, name, role (customer/farmer), phone, address

Products:
  - id, name, description, price, quantity, category, image, farmerId

Orders:
  - id, userId, totalAmount, status, paymentStatus, createdAt

OrderItems:
  - id, orderId, productId, quantity, price

BillingLogs:
  - id, orderId, amount, status (initiated/processing/completed/failed)

Cart:
  - id, userId

CartItems:
  - id, cartId, productId, quantity

Reviews:
  - id, userId, productId, rating, comment

Sales:
  - id, farmerId, orderId, amount, date

## NEXT STEPS

1. Create app folders manually
2. Run: npm install
3. Create .env.local
4. Setup PostgreSQL database
5. Run: npm run prisma:migrate
6. Create basic pages:
   - app/page.tsx (home)
   - app/layout.tsx (root layout)
   - app/(auth)/login/page.tsx
   - app/(auth)/register/page.tsx
7. Create utility files:
   - lib/db.ts (Prisma client)
   - lib/auth.ts (NextAuth config)
   - hooks/useAuth.ts
8. Create components
9. Start development: npm run dev

## TROUBLESHOOTING

Q: Database connection fails
A: Check DATABASE_URL in .env.local, ensure PostgreSQL is running

Q: Port 3000 already in use
A: npm run dev -- -p 3001

Q: Prisma migrations fail
A: Check if database exists, run: npx prisma db push

Q: Build fails
A: Clear node_modules: rm -rf node_modules && npm install

## SUPPORT & RESOURCES

- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
- NextAuth Docs: https://next-auth.js.org
- Tailwind CSS: https://tailwindcss.com/docs
- Socket.io: https://socket.io/docs
