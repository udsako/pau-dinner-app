# PAU Final Year Dinner — Food Ordering System
## Full Project Documentation

---

## 1. Project Overview

The **PAU Final Year Dinner Food Ordering System** is a real-time web application built for Pan-Atlantic University's final year dinner event. It solves the logistical challenge of serving 240 students (24 tables × 10 students) efficiently, without creating chaos for waiters or leaving students hungry.

### The Core Problem It Solves
Without a system, food service at a large dinner becomes chaotic: waiters rush between tables serving one person at a time, food runs out without warning, and no one knows who ordered what. This app eliminates all of that.

### The Solution in Plain English
Students scan a QR code at their table and place their food order on their phone. The system collects those orders **per table** and dispatches them as a single batch to the waiter once enough people on a table have ordered (7 out of 10). The remaining 3 people on a table are handled by a **grace period timer** — if they haven't ordered within 10 minutes of the 7th person ordering, the batch auto-dispatches anyway so the table isn't left waiting indefinitely. Administrators can also manually dispatch any table at any time with the click of a button.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   STUDENT FLOW                       │
│                                                      │
│  QR Code → Landing Page → Order Form → Confirmation │
└─────────────────────────┬───────────────────────────┘
                          │ POST /api/orders
                          ▼
┌─────────────────────────────────────────────────────┐
│               NEXT.JS API ROUTES (Backend)           │
│                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ Auth Routes │  │ Order Routes │  │Menu Routes │ │
│  └─────────────┘  └──────────────┘  └────────────┘ │
│                          │                           │
│              ┌───────────▼────────────┐              │
│              │   Batch Logic Engine   │              │
│              │  - Quorum Check (7/10) │              │
│              │  - Grace Timer (10min) │              │
│              │  - Manual Dispatch     │              │
│              └───────────┬────────────┘              │
└──────────────────────────┼──────────────────────────┘
                           │
          ┌────────────────▼───────────────┐
          │         PostgreSQL DB           │
          │  (via Prisma ORM)               │
          └────────────────┬───────────────┘
                           │
┌──────────────────────────▼──────────────────────────┐
│                  ADMIN DASHBOARD                      │
│                                                      │
│  Table Grid → Table Detail → Waiter Ticket           │
│  Menu Mgmt → Stock Levels → Low-Stock Alerts         │
│  Notifications → Real-time Updates                   │
└─────────────────────────────────────────────────────┘
```

---

## 3. User Roles

| Role | Access | Email Restriction |
|------|--------|-------------------|
| **Student** | Order form only — no login required | None (identified by name + table) |
| **Admin/Waiter** | Full dashboard — login required | Must be `@pau.edu.ng` |

---

## 4. Detailed Feature Specifications

### 4.1 Student Ordering Flow

**Entry Point:** QR code at each table links to `/order?table=X` where X is the table number (1–24).

**Order Form Fields:**
- Full Name (text input)
- Table Number (pre-filled from URL, locked)
- Food Selection (one item from each available category — e.g., Main Course, Side Dish, Drink, Dessert)
- Special dietary notes (optional text)

**Submission Rules:**
- Each name + table combination can only submit once (prevents duplicate orders)
- Food quantity is decremented immediately on submission (first-come-first-serve fairness)
- If a food item reaches 0 quantity, it is immediately marked unavailable and grayed out
- Student sees a confirmation page with their order summary and a unique order ID

### 4.2 Table Batch Dispatch System

This is the core logistics engine of the app.

**Phase 1 — Reservation:**
When a student submits their order, the system:
1. Decrements the food item quantity in the database
2. Creates an order record with status `PENDING`
3. Increments the table's `orderedCount`
4. Checks if the quorum trigger condition is met

**Phase 2 — Dispatch Triggers (3 ways a table batch fires):**

| Trigger | Condition | Action |
|---------|-----------|--------|
| **Quorum Trigger** | 7 out of 10 people on a table have ordered | Auto-dispatch fires immediately |
| **Grace Period Timer** | 10 minutes have passed since the 7th order on that table | Auto-dispatch fires for remaining orders |
| **Manual Dispatch** | Admin clicks "Send to Waiter" button for a table | Force-dispatch all pending orders for that table |

**What happens on dispatch:**
- All `PENDING` orders for that table become `DISPATCHED`
- A waiter ticket is generated (consolidated list of all food for the table)
- Table status changes to `DISPATCHED`
- The waiter sees the ticket in their queue

**Handling the Remaining 3 (after quorum of 7):**
The system does NOT wait indefinitely. After 7 people order:
- A 10-minute countdown begins (visible to the admin)
- If the 3 remaining people order within those 10 minutes, they're included in the same batch
- After 10 minutes, dispatch fires automatically — whoever hasn't ordered yet simply doesn't get food
- Admin can also manually dispatch early if they see fit

**Edge Case — Tables with fewer than 10 present:**
If 5 people on a table are absent/not ordering, admin can hit the **"Force Dispatch"** button at any time. This is intentional — the system trusts the admin's judgement.

### 4.3 Food Stock Management

**Stock Levels:**
- Each menu item has a `quantity` field tracking remaining servings
- Quantity decrements on every successful order submission
- Admin can set initial quantities when creating/editing menu items

**Low-Stock Notifications:**
| Threshold | Alert |
|-----------|-------|
| ≤ 5 remaining | 🟡 Yellow warning — "Low stock: Jollof Rice (4 left)" |
| 0 remaining | 🔴 Red critical — "SOLD OUT: Jollof Rice" — item auto-disabled |

Notifications appear:
- In the admin's notification panel (bell icon, badge count)
- As a toast popup on the admin dashboard
- Optionally via email (if configured)

### 4.4 Admin Dashboard

**Dashboard Overview Page (`/admin/dashboard`):**
- Live count: Total orders, tables dispatched, tables pending, items low on stock
- 24-table grid — each table shows status at a glance:
  - 🔄 Collecting (< 7 ordered)
  - ⏳ Quorum met — dispatching in X min (7+ ordered, timer running)
  - ✅ Dispatched
- Click any table to see full detail

**Table Detail Page (`/admin/tables/[id]`):**
- List of all orders for that table (name, food selection, time ordered, status)
- Consolidated food summary (e.g., "3× Jollof Rice, 2× Fried Rice, 1× Pasta")
- Timer countdown (if in grace period)
- **"Send to Waiter" button** (manual dispatch — always available regardless of quorum)
- Waiter assignment dropdown

**Menu Management Page (`/admin/menu`):**
- Add / edit / delete food items
- Set item name, category, description, image, quantity
- Toggle item availability (disable without deleting)
- See current stock levels per item

**Notifications Page (`/admin/notifications`):**
- Chronological log of all system events
- Filter by type: Low Stock | Sold Out | Dispatch | New Order

---

## 5. Database Schema

### Tables

**`User`** — Admin/waiter accounts
```
id          String    (UUID)
email       String    (unique, must end in @pau.edu.ng)
name        String
role        Enum      (ADMIN | WAITER)
createdAt   DateTime
```

**`MenuItem`** — Food items available for ordering
```
id           String    (UUID)
name         String
category     String    (e.g. "Main Course", "Drink", "Dessert")
description  String?
imageUrl     String?
quantity     Int       (remaining servings — decrements on order)
isAvailable  Boolean   (false when quantity = 0 or manually disabled)
createdAt    DateTime
updatedAt    DateTime
```

**`DinnerTable`** — The 24 physical tables
```
id               String    (UUID)
tableNumber      Int       (1–24, unique)
capacity         Int       (default 10)
orderedCount     Int       (how many people have ordered — increments per order)
status           Enum      (COLLECTING | QUORUM_MET | DISPATCHED)
quorumMetAt      DateTime? (when the 7th person ordered — starts grace timer)
dispatchedAt     DateTime?
assignedWaiter   String?   (User ID of assigned waiter)
```

**`Order`** — Individual student food orders
```
id            String    (UUID)
studentName   String
tableId       String    (FK → DinnerTable)
tableNumber   Int
status        Enum      (PENDING | DISPATCHED | SERVED)
specialNotes  String?
createdAt     DateTime
updatedAt     DateTime
```

**`OrderItem`** — Line items within an order (one per food category)
```
id           String    (UUID)
orderId      String    (FK → Order)
menuItemId   String    (FK → MenuItem)
menuItemName String    (snapshot at time of order)
quantity     Int       (always 1 per item in this context)
```

**`Notification`** — System event log
```
id        String    (UUID)
type      Enum      (LOW_STOCK | SOLD_OUT | DISPATCHED | NEW_ORDER)
message   String
metadata  Json?     (e.g. { menuItemId, tableNumber })
isRead    Boolean
createdAt DateTime
```

---

## 6. API Documentation

### Authentication

#### `POST /api/auth/register`
Register a new admin/waiter account.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "janedoe@pau.edu.ng",
  "password": "securepassword123",
  "role": "WAITER"
}
```

**Validation:**
- Email must end in `@pau.edu.ng` — hard rejection otherwise
- Password minimum 8 characters
- Role must be `ADMIN` or `WAITER`

**Response 201:**
```json
{
  "success": true,
  "user": { "id": "...", "name": "Jane Doe", "email": "janedoe@pau.edu.ng", "role": "WAITER" }
}
```

**Response 400:**
```json
{ "success": false, "error": "Email must be a PAU email address (@pau.edu.ng)" }
```

---

#### `POST /api/auth/login`
Log in to the admin panel.

**Request Body:**
```json
{
  "email": "janedoe@pau.edu.ng",
  "password": "securepassword123"
}
```

**Response 200:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "...", "name": "Jane Doe", "role": "WAITER" }
}
```

---

### Orders

#### `POST /api/orders`
Submit a student food order. **No authentication required.**

**Request Body:**
```json
{
  "studentName": "John Smith",
  "tableNumber": 12,
  "items": [
    { "menuItemId": "abc123" },
    { "menuItemId": "def456" }
  ],
  "specialNotes": "No pepper please"
}
```

**Logic executed server-side:**
1. Validate tableNumber is 1–24
2. Check student hasn't already ordered from this table (name + tableNumber unique check)
3. For each item: check quantity > 0, decrement quantity, create OrderItem
4. Create Order record (status: PENDING)
5. Increment table's orderedCount
6. Check quorum: if orderedCount >= 7 AND table status is COLLECTING → set status to QUORUM_MET, record quorumMetAt
7. If orderedCount == 10 → auto-dispatch immediately
8. Check for low-stock (quantity ≤ 5 → create LOW_STOCK notification; quantity == 0 → SOLD_OUT + disable item)

**Response 201:**
```json
{
  "success": true,
  "order": {
    "id": "ord_xyz",
    "studentName": "John Smith",
    "tableNumber": 12,
    "status": "PENDING",
    "items": [
      { "name": "Jollof Rice", "category": "Main Course" },
      { "name": "Chapman", "category": "Drink" }
    ],
    "createdAt": "2025-11-15T20:30:00Z"
  }
}
```

**Response 400:**
```json
{ "success": false, "error": "You have already placed an order from Table 12" }
```

**Response 409:**
```json
{ "success": false, "error": "Jollof Rice is no longer available" }
```

---

#### `GET /api/orders?tableNumber=12`
Get all orders for a specific table. **Requires auth.**

**Response 200:**
```json
{
  "success": true,
  "table": {
    "tableNumber": 12,
    "status": "QUORUM_MET",
    "orderedCount": 8,
    "quorumMetAt": "2025-11-15T20:38:00Z"
  },
  "orders": [
    {
      "id": "ord_xyz",
      "studentName": "John Smith",
      "status": "PENDING",
      "items": [...],
      "createdAt": "..."
    }
  ],
  "summary": {
    "Jollof Rice": 3,
    "Fried Rice": 2,
    "Pasta": 1,
    "Chapman": 4
  }
}
```

---

### Tables

#### `GET /api/tables`
Get overview of all 24 tables. **Requires auth.**

**Response 200:**
```json
{
  "success": true,
  "tables": [
    {
      "tableNumber": 1,
      "orderedCount": 3,
      "status": "COLLECTING",
      "assignedWaiter": null
    },
    {
      "tableNumber": 4,
      "orderedCount": 7,
      "status": "QUORUM_MET",
      "quorumMetAt": "2025-11-15T20:34:00Z",
      "assignedWaiter": "janedoe@pau.edu.ng"
    },
    {
      "tableNumber": 12,
      "orderedCount": 10,
      "status": "DISPATCHED",
      "dispatchedAt": "2025-11-15T20:42:00Z"
    }
  ]
}
```

---

### Admin Actions

#### `POST /api/admin/dispatch`
Manually dispatch all pending orders for a table. **Requires auth.**

**Request Body:**
```json
{
  "tableNumber": 12,
  "waiterId": "user_abc123"
}
```

**Logic:**
1. Find all PENDING orders for this table
2. Set all their statuses to DISPATCHED
3. Set table status to DISPATCHED, record dispatchedAt
4. Assign waiter if provided
5. Create DISPATCHED notification

**Response 200:**
```json
{
  "success": true,
  "dispatched": {
    "tableNumber": 12,
    "orderCount": 8,
    "summary": { "Jollof Rice": 3, "Fried Rice": 2, "Chapman": 3 },
    "assignedWaiter": "Jane Doe"
  }
}
```

---

#### `GET /api/admin/notifications`
Get all system notifications. **Requires auth.**

**Query params:** `?unreadOnly=true` | `?type=LOW_STOCK`

**Response 200:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": "notif_1",
      "type": "LOW_STOCK",
      "message": "Jollof Rice is running low — 4 servings remaining",
      "isRead": false,
      "createdAt": "2025-11-15T20:41:00Z"
    },
    {
      "id": "notif_2",
      "type": "SOLD_OUT",
      "message": "Fried Rice is now SOLD OUT",
      "isRead": false,
      "createdAt": "2025-11-15T20:45:00Z"
    }
  ],
  "unreadCount": 2
}
```

---

#### `PATCH /api/admin/notifications/[id]`
Mark a notification as read.

---

### Menu

#### `GET /api/menu`
Get all available menu items. **No auth required** (students need this for the order form).

**Response 200:**
```json
{
  "success": true,
  "menu": [
    {
      "id": "abc123",
      "name": "Jollof Rice",
      "category": "Main Course",
      "description": "Party jollof with assorted meat",
      "quantity": 47,
      "isAvailable": true
    },
    {
      "id": "def456",
      "name": "Fried Rice",
      "category": "Main Course",
      "quantity": 0,
      "isAvailable": false
    }
  ]
}
```

---

#### `POST /api/menu` — Create menu item (Auth required)
#### `PATCH /api/menu/[id]` — Update menu item (Auth required)
#### `DELETE /api/menu/[id]` — Delete menu item (Auth required)

---

## 7. Technology Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 14 (App Router) + TypeScript | Full-stack, fast, great DX |
| Styling | Tailwind CSS | Rapid, consistent UI |
| Database | PostgreSQL | Reliable relational data with transactions |
| ORM | Prisma | Type-safe DB queries, easy migrations |
| Auth | JWT (jsonwebtoken) + bcrypt | Simple, stateless session management |
| Hosting (Frontend) | Vercel | Zero-config Next.js deployment |
| Hosting (DB) | Neon / Supabase (free tier) | Managed PostgreSQL |
| Background Jobs | Vercel Cron Jobs | Grace period timer (polls every minute) |

---

## 8. Deployment Checklist

- [ ] Set up PostgreSQL database (Neon or Supabase)
- [ ] Add `DATABASE_URL` to Vercel environment variables
- [ ] Add `JWT_SECRET` to Vercel environment variables
- [ ] Run `npx prisma db push` to create tables
- [ ] Run `npx prisma db seed` to seed 24 dinner tables
- [ ] Deploy to Vercel via GitHub integration
- [ ] Generate QR codes for tables 1–24 (URL: `yourapp.vercel.app/order?table=X`)
- [ ] Create admin/waiter accounts via `/admin/register`
- [ ] Add menu items via `/admin/menu`
- [ ] Set food quantities before the event starts

---

## 9. Event Day Checklist

- [ ] All waiters logged in and ready
- [ ] Menu items loaded with correct quantities
- [ ] QR codes printed and placed on tables
- [ ] Admin dashboard open on operations laptop
- [ ] Test order submitted and dispatched
- [ ] Notify students they can start ordering at X time

---

*Built for PAU Final Year Dinner — by [Your Name]*
