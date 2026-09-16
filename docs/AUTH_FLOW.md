# Proofly Authentication & Token Rotation Flow

Proofly implements a state-of-the-art secure authentication flow featuring short-lived **JWT Access Tokens**, **Refresh Token Rotation**, **Hashed Token Database Storage**, and **Reuse Detection & Automatic Revocation**.

---

## Architecture Overview

```
Client App                                  Proofly Backend API                             MongoDB
   |                                                |                                          |
   |--- 1. POST /api/auth/login ------------------->|                                          |
   |                                                |--- Validate credentials ---------------->|
   |                                                |--- Hash & store Refresh Token ---------->|
   |<-- 2. Return Access Token (JSON) --------------|                                          |
   |       + Set Refresh Token (httpOnly Cookie) ---|                                          |
   |                                                |                                          |
   |--- 3. API Request with Authorization Bearer -->|                                          |
   |                                                |--- Verify JWT Access Token ------------->|
   |<-- 4. Protected Resource Data -----------------|                                          |
   |                                                |                                          |
   |--- 5. POST /api/auth/refresh-token ----------->|                                          |
   |       (Sends httpOnly Refresh Token cookie)    |--- Verify & Hash incoming token -------->|
   |                                                |--- Rotate Token (Revoke old, issue new) ->|
   |<-- 6. Return New Access Token -----------------|                                          |
   |       + Set New Refresh Token Cookie ----------|                                          |
```

---

## Token Configurations

| Token Type | Storage Location | Lifetime | Format / Algorithm |
| :--- | :--- | :--- | :--- |
| **Access Token** | Client Memory / State | **15 minutes** | Signed JWT (`HS256`) |
| **Refresh Token** | `httpOnly`, `SameSite=Lax` Cookie | **7 days** | Opaque 80-char hex string (Hashed as `SHA-256` in DB) |

---

## Security Guarantees & Features

### 1. Refresh Token Hashing
Raw refresh tokens are never stored in plaintext in the database. When a refresh token is created:
1. A cryptographically random 40-byte hex token is generated.
2. Its `SHA-256` hash is stored in MongoDB in the `RefreshToken` collection.
3. The raw token is sent back to the client inside an `httpOnly`, `Secure`, `SameSite=Lax` cookie.

### 2. Refresh Token Rotation
Every time `/api/auth/refresh-token` is invoked:
1. The server extracts the `refreshToken` cookie.
2. It hashes the raw token string and looks up the document in MongoDB.
3. If valid and unexpired:
   - The old token is marked `isRevoked: true` and its `replacedByToken` field is set to the hash of the new token.
   - A brand new refresh token is generated and stored in the database.
   - A new 15-minute access token is returned in the response payload, and the updated refresh token cookie is set.

### 3. Refresh Token Reuse Detection
If a compromised or revoked refresh token is sent to `/api/auth/refresh-token`:
1. The server detects that `isRevoked === true`.
2. **Immediate Defense Action**: The server revokes **ALL** active refresh tokens belonging to that user ID across all devices (`updateMany({ userId }, { isRevoked: true })`).
3. The client receives a `401 Unauthorized` response with the message:
   `"Invalid or revoked refresh token. Please log in again."`

---

## Cookie Options

```js
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};
```
