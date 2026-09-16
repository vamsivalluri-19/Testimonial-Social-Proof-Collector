# Proofly API Documentation

Comprehensive specification of all REST API endpoints provided by the Proofly backend.

---

## Base URL
```
http://localhost:5000/api
```

---

## Authentication Header & Cookies
For protected endpoints:
- **Header**: `Authorization: Bearer <ACCESS_TOKEN>`
- **Cookie**: `refreshToken=<REFRESH_TOKEN>` (`httpOnly`, `SameSite=Lax`)

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {}
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description message",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address"
    }
  ]
}
```

---

## 1. Authentication Endpoints

### 1.1 Sign Up Owner Account
`POST /api/auth/signup`

**Request Body**:
```json
{
  "name": "Sarah Connor",
  "email": "sarah@proofly.io",
  "username": "sarah_c",
  "password": "Password123!"
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "message": "Account created successfully. Verification email simulated.",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "65f8a123bc45678901234567",
    "name": "Sarah Connor",
    "email": "sarah@proofly.io",
    "username": "sarah_c",
    "isEmailVerified": false,
    "createdAt": "2026-09-16T22:00:00.000Z"
  },
  "simulatedEmailVerificationToken": "a1b2c3d4e5f6..."
}
```

---

### 1.2 Log In Owner Account
`POST /api/auth/login`

**Request Body**:
```json
{
  "email": "sarah@proofly.io",
  "password": "Password123!"
}
```

**Response (200 OK)**:
Sets `refreshToken` in `httpOnly` cookie.
```json
{
  "success": true,
  "message": "Login successful.",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "65f8a123bc45678901234567",
    "name": "Sarah Connor",
    "email": "sarah@proofly.io",
    "username": "sarah_c",
    "isEmailVerified": true
  }
}
```

---

### 1.3 Refresh Access Token
`POST /api/auth/refresh-token`

Rotates the refresh token stored in the `httpOnly` cookie and returns a fresh 15-minute access token.

**Response (200 OK)**:
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "65f8a123bc45678901234567",
    "name": "Sarah Connor",
    "email": "sarah@proofly.io",
    "username": "sarah_c"
  }
}
```

---

### 1.4 Verify Email
`POST /api/auth/verify-email`

**Request Body**:
```json
{
  "token": "a1b2c3d4e5f6..."
}
```

---

### 1.5 Forgot Password
`POST /api/auth/forgot-password`

**Request Body**:
```json
{
  "email": "sarah@proofly.io"
}
```

---

### 1.6 Reset Password
`POST /api/auth/reset-password`

**Request Body**:
```json
{
  "token": "reset_token_here",
  "newPassword": "NewStrongPassword123!"
}
```

---

### 1.7 Logout
`POST /api/auth/logout`

Revokes the active refresh token and clears the `refreshToken` cookie.

---

## 2. Space Management Endpoints (Owner Protected)

### 2.1 Create Space
`POST /api/spaces`

**Request Body**:
```json
{
  "name": "Acme Corp Testimonials",
  "slug": "acme-corp",
  "logo": "https://example.com/logo.png",
  "prompt": "How has Acme Corp helped your business scale?",
  "avatarSetting": "optional",
  "ratingSetting": "required",
  "customQuestions": [
    { "label": "What feature did you love most?", "required": false }
  ],
  "theme": {
    "primaryColor": "#6366f1",
    "backgroundColor": "#ffffff",
    "textColor": "#1f2937",
    "darkMode": false
  }
}
```

---

### 2.2 List My Spaces
`GET /api/spaces`

Returns all spaces created by the authenticated owner along with live review count statistics.

---

### 2.3 Get Space by ID
`GET /api/spaces/:id`

---

### 2.4 Update Space
`PUT /api/spaces/:id`

---

### 2.5 Delete Space
`DELETE /api/spaces/:id`

Deletes the specified space and all testimonials associated with it.

---

## 3. Public Review Submission APIs

### 3.1 Get Public Space Configuration
`GET /api/public/spaces/:slug`

Public endpoint used by end-user review collection forms.

---

### 3.2 Submit Testimonial (Unauthenticated)
`POST /api/public/spaces/:slug/testimonials`

Content-Type: `multipart/form-data` or `application/json`

**Form Fields**:
- `clientName` (string, required)
- `email` (string, required)
- `companyRole` (string)
- `rating` (number 1-5, required)
- `reviewText` (string, required)
- `avatar` (file upload, optional)
- `customAnswers` (JSON string or array of `{ question, answer }`)

**Response (201 Created)**:
Defaults status to `pending`.

---

## 4. Testimonial Moderation APIs (Owner Protected)

### 4.1 Filter & Search Testimonials
`GET /api/testimonials`

**Query Parameters**:
- `spaceId` (optional): Filter by space ID
- `status` (optional): `pending` | `approved` | `archived`
- `rating` (optional): Filter by 1-5 stars
- `search` (optional): Search in clientName, email, or reviewText
- `page` (default 1)
- `limit` (default 10)

---

### 4.2 Update Testimonial Status
`PATCH /api/testimonials/:id/status`

**Request Body**:
```json
{
  "status": "approved"
}
```

---

### 4.3 Toggle Featured Review
`PATCH /api/testimonials/:id/featured`

**Request Body**:
```json
{
  "featured": true
}
```

---

### 4.4 Toggle Liked Review
`PATCH /api/testimonials/:id/liked`

**Request Body**:
```json
{
  "liked": true
}
```

---

### 4.5 Delete Testimonial
`DELETE /api/testimonials/:id`

---

## 5. Analytics APIs (Owner Protected)

### 5.1 Summary Stats
`GET /api/analytics/:spaceId/summary`

Returns average rating, total reviews, pending count, approved count, featured count, and liked count.

---

### 5.2 Rating Distribution
`GET /api/analytics/:spaceId/distribution`

Returns breakdown count and percentage for 1, 2, 3, 4, and 5 star ratings.

---

### 5.3 Timeseries Growth
`GET /api/analytics/:spaceId/timeseries`

Returns review velocity and cumulative growth over time.

---

## 6. Wall of Love & Embed Generator APIs

### 6.1 Wall of Love API
`GET /api/public/spaces/:slug/wall`

Returns approved testimonials for public display. Note: `email` field is sanitized and excluded.

---

### 6.2 Widget Embed Generator
`GET /api/public/spaces/:slug/embed`

**Query Parameters**:
- `type`: `grid` | `carousel` | `badge`
- `theme`: `light` | `dark`
- `width`: e.g. `100%`
- `height`: e.g. `600px`
- `avatarVisibility`: `true` | `false`
- `ratingVisibility`: `true` | `false`

Returns embed configuration object, iframe snippet, and script code snippet.
