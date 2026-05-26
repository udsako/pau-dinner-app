# PAU Final Year Dinner — Food Ordering System

A real-time food ordering and dispatch system for Pan-Atlantic University's Final Year Dinner. Supports 240 students across 24 tables with smart batch dispatch, stock management, and a full admin dashboard.

---

## Tech Stack

- **Frontend + Backend**: Next.js 14 (App Router) + TypeScript
- **Database**: PostgreSQL via [Neon](https://neon.tech) (free tier)
- **ORM**: Prisma
- **Auth**: JWT + bcrypt
- **Hosting**: Vercel

---

## Project Structure

```
pau-final-year-dinner/
├── prisma/
│   ├── schema.prisma          # Database schema (all 6 tables)
│   └── seed.ts                # Seeds 24 dinner tables + sample menu
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                        # Root layout (fonts, toast)
│   │   ├── page.tsx                          # Student landing page
│   │   ├── globals.css                       # Design tokens + utility classes
│   │   │
│   │   ├── order/
│   │   │   └── page.tsx                      # Student order form (/order?table=X)
│   │   │
│   │   ├── confirmation/
│   │   │   └── page.tsx                      # Order confirmation page
│   │   │
│   │   ├── admin/
│   │   │   ├── layout.tsx                    # Admin layout with sidebar
│   │   │   ├── login/page.tsx                # Admin login
│   │   │   ├── register/page.tsx             # Admin registration
│   │   │   ├── dashboard/page.tsx            # Dashboard (24-table grid + stats)
│   │   │   ├── tables/
│   │   │   │   ├── page.tsx                  # All tables list view
│   │   │   │   └── [tableNumber]/page.tsx    # Table detail + dispatch
│   │   │   ├── menu/page.tsx                 # Menu management (CRUD)
│   │   │   └── notifications/page.tsx        # Alerts and event log
│   │   │
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── register/route.ts         # POST — create admin/waiter account
│   │       │   └── login/route.ts            # POST — login and get JWT
│   │       ├── orders/
│   │       │   └── route.ts                  # POST (place order) + GET (list by table)
│   │       ├── menu/
│   │       │   ├── route.ts                  # GET (all) + POST (create)
│   │       │   └── [id]/route.ts             # PATCH (update) + DELETE
│   │       ├── tables/
│   │       │   └── route.ts                  # GET — all 24 tables overview
│   │       ├── admin/
│   │       │   ├── dispatch/route.ts         # POST — manual dispatch a table
│   │       │   ├── notifications/
│   │       │   │   ├── route.ts              # GET — all notifications
│   │       │   │   └── [id]/route.ts         # PATCH — mark as read
│   │       │   └── waiters/route.ts          # GET — list all staff accounts
│   │       └── cron/
│   │           └── grace-timer/route.ts      # GET — grace period auto-dispatch (cron)
│   │
│   ├── lib/
│   │   ├── prisma.ts                         # Prisma client singleton
│   │   ├── auth.ts                           # JWT, bcrypt, PAU email validation
│   │   ├── batchDispatch.ts                  # Core batch logic engine
│   │   └── api.ts                            # Frontend API helper
│   │
│   ├── store/
│   │   └── authStore.ts                      # Zustand auth state
│   │
│   └── types/
│       └── index.ts                          # All TypeScript types
│
├── vercel.json                               # Cron job config (grace timer)
├── .env.example                              # Environment variables template
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.ts
```

---

## Setup Instructions

### 1. Clone and Install

```bash
git clone https://github.com/YOUR_USERNAME/pau-final-year-dinner.git
cd pau-final-year-dinner
npm install
```

### 2. Set Up PostgreSQL

Go to [neon.tech](https://neon.tech), create a free project, and copy your connection string.

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
DATABASE_URL="your-neon-postgresql-url"
JWT_SECRET="your-random-64-char-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
CRON_SECRET="your-cron-secret"
```

### 4. Initialize Database

```bash
npx prisma db push       # Creates all tables
npx prisma db seed       # Seeds 24 dinner tables + sample menu items
```

### 5. Run Locally

```bash
npm run dev
```

Visit:
- `http://localhost:3000` — Student landing page
- `http://localhost:3000/order?table=1` — Order form for Table 1
- `http://localhost:3000/admin/register` — Create first admin account
- `http://localhost:3000/admin/dashboard` — Admin dashboard

---

## Deployment (Vercel)

1. Push to GitHub
2. Import to [vercel.com](https://vercel.com)
3. Add all environment variables in Vercel project settings
4. Deploy

The cron job in `vercel.json` runs every minute to auto-dispatch tables whose grace period has expired.

---

## Event Day Setup Checklist

- [ ] Create admin/waiter accounts via `/admin/register`
- [ ] Add menu items with correct quantities via `/admin/menu`
- [ ] Generate QR codes: `yourapp.vercel.app/order?table=1` through `?table=24`
- [ ] Print and place QR codes on tables
- [ ] Open dashboard on operations laptop
- [ ] Notify students to start ordering at the designated time

---

## How the Batch System Works

1. Student scans QR → places order → food quantity decremented immediately (first-come-first-serve preserved)
2. When **7 out of 10** people on a table order → Quorum reached → 10-minute grace period starts
3. During grace period, remaining 3 can still order and be included in the batch
4. After 10 minutes → auto-dispatch fires (or admin can click "Send to Waiter" at any time)
5. Waiter gets one consolidated ticket for the whole table — one trip per table

---

## API Quick Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Create admin/waiter account |
| POST | `/api/auth/login` | No | Login and get JWT token |
| GET | `/api/menu` | No | Get all menu items (for order form) |
| POST | `/api/menu` | Admin | Add a menu item |
| PATCH | `/api/menu/[id]` | Admin | Update a menu item |
| DELETE | `/api/menu/[id]` | Admin | Delete a menu item |
| POST | `/api/orders` | No | Student places an order |
| GET | `/api/orders?tableNumber=X` | Yes | Get all orders for a table |
| GET | `/api/tables` | Yes | Get overview of all 24 tables |
| POST | `/api/admin/dispatch` | Yes | Manually dispatch a table |
| GET | `/api/admin/notifications` | Yes | Get system notifications |
| PATCH | `/api/admin/notifications/[id]` | Yes | Mark notification as read |
| GET | `/api/admin/waiters` | Yes | List all staff accounts |
| GET | `/api/cron/grace-timer` | Cron | Auto-dispatch expired grace timers |

---

*Built for PAU Final Year Dinner 2025*
