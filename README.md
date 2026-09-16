# Proofly — Testimonial & Social Proof Collector Backend

Proofly is a robust, production-grade RESTful API backend built with Node.js, Express.js, MongoDB, and Mongoose. It empowers businesses to create custom review collection spaces, collect customer testimonials without login, moderate reviews, view growth analytics, and generate embeddable Wall of Love & social proof widgets.

---

## Key Features

- 🔐 **Owner Authentication & Security**:
  - JWT Access Token (15-minute expiration).
  - Refresh Token Rotation (7-day `httpOnly`, `SameSite=Lax` cookie).
  - Hashed refresh tokens stored in MongoDB (`SHA-256`).
  - Automatic **Refresh Token Reuse Detection** (revokes all active user sessions if a compromised token is reused).
  - Password hashing with `bcryptjs`.
  - Rate limiting with `express-rate-limit`, security HTTP headers via `helmet`, CORS protection.
- 📁 **Testimonial Spaces Management**:
  - Full CRUD operations for testimonial spaces.
  - Auto-generated URL-safe unique slugs (e.g. `acme-corp`).
  - Custom branding: prompt text, logo URL, avatar requirements, rating requirements, custom questions array, and color theme preferences.
- ✍️ **Public Testimonial Submission**:
  - Unauthenticated public submission API for customer reviews.
  - Support for client name, email, company role, 1–5 star rating, review text, custom Q&A answers, and avatar image uploads via `multer` + `cloudinary`.
  - Defaults all incoming submissions to `pending` status for owner moderation.
- 🛡️ **Review Moderation Dashboard**:
  - Filter testimonials by space, status (`pending`, `approved`, `archived`), star rating, or text search.
  - Paginated list response.
  - Actions to approve/archive reviews, toggle `featured` state, toggle `liked` state, or delete reviews.
  - Strict space ownership authorization checks.
- 📊 **Analytics & Growth Engine**:
  - Summary metrics: total reviews, average rating (computed on approved reviews only), pending count, featured count, liked count.
  - Star rating breakdown distribution (1 to 5 stars frequency and percentage).
  - Timeseries growth reports (daily review counts & cumulative growth).
- 💖 **Wall of Love & Embed Generator**:
  - Public Wall of Love API returning approved testimonials for display (with customer email addresses stripped for privacy).
  - Embed configuration generator supporting Grid, Carousel, and Badge widget layouts with custom themes, width, height, and display toggles.

---

## Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **Node.js & Express.js** | Web Application & REST API Framework |
| **MongoDB & Mongoose** | Database & Object Data Modeling (ODM) |
| **JWT & Bcrypt** | Security, Password Hashing & Access Tokens |
| **Multer & Cloudinary** | Image File Upload Processing with Cloud Fallback |
| **Zod** | Strict Request Payload & Query Validation |
| **Helmet & CORS** | Security Headers & Cross-Origin Resource Sharing |
| **Express-Rate-Limit** | Protection against Denial-of-Service & Brute Force |
| **Jest & Supertest** | Automated Testing Framework |

---

## Directory Structure

```
testimonial-collector/
├── app.js                  # Express app setup & middleware wiring
├── server.js               # Entry point & database initialization
├── package.json            # Scripts & dependencies
├── .env.example            # Environment template file
├── config/
│   ├── db.js               # Database connection
│   └── cloudinary.js       # Cloudinary SDK & fallback handler
├── models/
│   ├── User.js             # Owner user model
│   ├── Space.js            # Testimonial space model
│   ├── Testimonial.js      # Submitted testimonial model
│   └── RefreshToken.js     # Hashed refresh token model
├── controllers/
│   ├── authController.js   # Authentication & session handlers
│   ├── spaceController.js  # Space management handlers
│   ├── testimonialController.js # Review submission & moderation handlers
│   ├── analyticsController.js   # Analytics & reporting handlers
│   └── embedController.js      # Wall of Love & Widget embed handlers
├── routes/
│   ├── authRoutes.js       # /api/auth routes
│   ├── spaceRoutes.js      # /api/spaces routes
│   ├── testimonialRoutes.js# /api/testimonials routes
│   ├── publicRoutes.js     # /api/public routes
│   └── analyticsRoutes.js  # /api/analytics routes
├── middleware/
│   ├── authMiddleware.js   # JWT authentication & ownership checks
│   ├── validateMiddleware.js # Zod validation middleware
│   ├── uploadMiddleware.js # Multer image upload handler
│   ├── rateLimiter.js      # Express rate limiters
│   └── errorHandler.js     # Standardized JSON error response handler
├── services/
│   └── authService.js      # Token generation, hashing, and rotation logic
├── utils/
│   ├── appError.js         # Custom AppError class
│   ├── logger.js           # Logger utility
│   └── slugify.js          # URL slug generator
├── scripts/
│   └── seed.js             # Database seeding script
├── tests/
│   └── api.test.js         # Integration test suite
└── docs/
    ├── API_DOCUMENTATION.md # Detailed endpoints guide
    ├── DATABASE_SCHEMA.md  # Database models & relationships
    ├── AUTH_FLOW.md        # Authentication & Refresh token rotation specification
    ├── EXAMPLE_REQUESTS.md # cURL & Fetch code samples
    └── proofly.postman_collection.json # Postman v2.1 collection
```

---

## Quick Start Guide

### 1. Prerequisites
- Node.js (v18+ recommended)
- MongoDB instance (Local running at `mongodb://127.0.0.1:27017/proofly_db` or MongoDB Atlas URI)

### 2. Environment Setup
Clone or navigate to the project root and create `.env`:
```bash
cp .env.example .env
```

Set your configuration variables:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/proofly_db
ACCESS_TOKEN_SECRET=proofly_access_token_secret_key_change_in_production_32bytes
REFRESH_TOKEN_SECRET=proofly_refresh_token_secret_key_change_in_production_32bytes
CLIENT_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Seed Database (Optional)
Populate MongoDB with demo owner accounts, testimonial spaces, and sample reviews:
```bash
npm run seed
```
> **Default Seed Credentials**:
> - Email: `owner@proofly.io`
> - Password: `Password123!`

### 5. Run Server
- **Development mode** (with live reload):
  ```bash
  npm run dev
  ```
- **Production mode**:
  ```bash
  npm start
  ```

---

## Running Automated Tests

Run the integration test suite using Jest and Supertest:
```bash
npm test
```

---

## API Summary

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Public | Register new owner account |
| `POST` | `/api/auth/login` | Public | Authenticate owner & set refresh token cookie |
| `POST` | `/api/auth/refresh-token` | Public | Rotate refresh token cookie & return new access token |
| `POST` | `/api/auth/logout` | Public | Revoke refresh token & clear cookie |
| `GET` | `/api/auth/me` | Protected | Get current owner profile |
| `POST` | `/api/spaces` | Protected | Create a new testimonial space |
| `GET` | `/api/spaces` | Protected | List spaces owned by current user |
| `GET` | `/api/spaces/:id` | Protected | Get space details |
| `PUT` | `/api/spaces/:id` | Protected | Update space settings |
| `DELETE` | `/api/spaces/:id` | Protected | Delete space & associated reviews |
| `GET` | `/api/public/spaces/:slug` | Public | Get public space details for review submission |
| `POST` | `/api/public/spaces/:slug/testimonials` | Public | Submit a new testimonial (unauthenticated) |
| `GET` | `/api/public/spaces/:slug/testimonials` | Public | Get approved testimonials for a space |
| `GET` | `/api/testimonials` | Protected | Owner review moderation dashboard (search & filter) |
| `PATCH` | `/api/testimonials/:id/status` | Protected | Update testimonial status (`approved`, `pending`, `archived`) |
| `PATCH` | `/api/testimonials/:id/featured` | Protected | Toggle featured flag |
| `PATCH` | `/api/testimonials/:id/liked` | Protected | Toggle liked flag |
| `DELETE` | `/api/testimonials/:id` | Protected | Delete testimonial |
| `GET` | `/api/analytics/:spaceId/summary` | Protected | Get review totals & average rating |
| `GET` | `/api/analytics/:spaceId/distribution` | Protected | Get 1 to 5 star rating distribution |
| `GET` | `/api/analytics/:spaceId/timeseries` | Protected | Get review velocity & growth over time |
| `GET` | `/api/public/spaces/:slug/wall` | Public | Wall of Love API (emails omitted) |
| `GET` | `/api/public/spaces/:slug/embed` | Public | Widget embed generator API |

For full request/response schemas, refer to [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md).

---

## License
MIT
