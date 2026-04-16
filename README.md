# 📦 ShelfNest – Community Shelf Platform

A full-stack web application that enables users within a verified community to **lend and borrow items** (tools, appliances, etc.) in a secure and trust-based environment.

![Tech Stack](https://img.shields.io/badge/React-19-blue?logo=react) ![Node.js](https://img.shields.io/badge/Node.js-Express_5-green?logo=node.js) ![SQLite](https://img.shields.io/badge/SQLite-Database-blue?logo=sqlite) ![JWT](https://img.shields.io/badge/Auth-JWT-orange)

## ✨ Features

- **Community-based access** — Users join via a shared community code
- **Item listing** with images, categories, conditions, and deposit amounts
- **Calendar-based booking** with date conflict prevention
- **Full booking workflow**: Request → Approve → Pickup (photo) → Complete (photo) → Review
- **Condition verification** via image upload at pickup and return
- **Ratings & Reviews** — Both borrower and owner can review each other
- **Responsive dark-mode UI** with glassmorphism design
- **Search & filter** items by category and keywords

## 🛠️ Tech Stack

| Layer     | Technology                    |
|-----------|-------------------------------|
| Frontend  | React 19 + Vite               |
| Backend   | Node.js + Express 5           |
| Database  | SQLite (better-sqlite3)       |
| Auth      | JWT (jsonwebtoken + bcryptjs) |
| Uploads   | Multer (local storage)        |
| Styling   | Vanilla CSS (custom design)   |

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** (tested with v24)
- **Git for Windows** (if on Windows)

### Setup

```bash
# 1. Install all dependencies (root + server + client)
npm run install:all

# 2. Seed the database with demo data
npm run seed

# 3. Start the application
npm run dev
```

The app will be available at:
- 👉 **Frontend**: http://localhost:3000
- 👉 **Backend API**: http://localhost:5000

### Demo Accounts

After seeding, use these accounts (password: `password123`):

| Name          | Email              | Role              |
|---------------|--------------------|-------------------|
| Arjun Mehta   | arjun@example.com  | Has 3 items listed|
| Priya Sharma  | priya@example.com  | Has 2 items listed|
| Rahul Verma   | rahul@example.com  | Has 2 items listed|
| Sneha Patel   | sneha@example.com  | Has 2 items listed|

**Community Code**: `SHELF2024`

## 📁 Project Structure

```
CommunityShelf/
├── package.json              # Root scripts (runs both)
├── client/                   # React frontend (Vite)
│   ├── src/
│   │   ├── api/              # API client
│   │   ├── components/       # Reusable components
│   │   ├── context/          # Auth context
│   │   ├── pages/            # Page components
│   │   ├── App.jsx           # Router setup
│   │   ├── main.jsx          # Entry point
│   │   └── index.css         # Design system
│   └── vite.config.js        # Vite + proxy config
├── server/                   # Express backend
│   ├── db/
│   │   ├── init.js           # Schema + migrations
│   │   └── seed.js           # Demo data
│   ├── middleware/
│   │   └── auth.js           # JWT middleware
│   ├── routes/
│   │   ├── auth.js           # Auth endpoints
│   │   ├── items.js          # Item CRUD
│   │   ├── bookings.js       # Booking workflow
│   │   ├── reviews.js        # Reviews
│   │   └── upload.js         # Image uploads
│   ├── uploads/              # Uploaded images
│   └── index.js              # Server entry
└── README.md
```

## 🔄 Booking Workflow

```
Borrower → Request    (pending)
Owner    → Approve    (approved)  or  Reject (rejected)
Owner    → Pickup     (active)    + upload pickup photo
Owner    → Complete   (completed) + upload return photo
Both     → Review     ⭐⭐⭐⭐⭐
```

## 🔑 API Endpoints

### Auth
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Sign in
- `GET  /api/auth/me` — Current user
- `PUT  /api/auth/profile` — Update profile

### Items
- `GET    /api/items` — List community items
- `GET    /api/items/mine` — User's items
- `GET    /api/items/:id` — Item detail + bookings + reviews
- `POST   /api/items` — Create item
- `PUT    /api/items/:id` — Update item
- `DELETE /api/items/:id` — Delete item

### Bookings
- `GET /api/bookings` — User's bookings
- `POST /api/bookings` — Request booking
- `PUT /api/bookings/:id/approve` — Approve
- `PUT /api/bookings/:id/reject` — Reject
- `PUT /api/bookings/:id/activate` — Mark pickup
- `PUT /api/bookings/:id/complete` — Mark return
- `PUT /api/bookings/:id/cancel` — Cancel

### Reviews
- `POST /api/reviews` — Submit review
- `GET  /api/reviews/user/:id` — User reviews

### Upload
- `POST /api/upload` — Upload image

## ⚡ Success Criteria Met

- ✅ No booking conflicts (date overlap prevention)
- ✅ Smooth end-to-end flow (list → book → approve → complete → review)
- ✅ Community verification via shared codes
- ✅ Condition verification with image uploads
- ✅ JWT-based authentication
- ✅ Mobile-responsive design
- ✅ Clean, well-structured codebase
