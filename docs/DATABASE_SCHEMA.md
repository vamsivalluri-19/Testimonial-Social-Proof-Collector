# Proofly Database Schema Documentation

Proofly uses **MongoDB** as its primary document store, managed via **Mongoose ODM**.

---

## Entity Relationship Diagram

```
+------------------+             +--------------------+
|       User       | 1         * |       Space        |
+------------------+-------------+--------------------+
| _id              |             | _id                |
| name             |             | owner (ref User)   |
| email            |             | name               |
| username         |             | slug               |
| passwordHash     |             | logo               |
| isEmailVerified  |             | prompt             |
| createdAt        |             | theme              |
+------------------+             +--------------------+
         |                                 |
         | 1                               | 1
         |                                 |
         *                                 *
+------------------+             +--------------------+
|   RefreshToken   |             |    Testimonial     |
+------------------+             +--------------------+
| _id              |             | _id                |
| userId (ref User)|             | space (ref Space)  |
| tokenHash        |             | clientName         |
| expiresAt        |             | email              |
| isRevoked        |             | companyRole        |
| replacedByToken  |             | rating (1-5)       |
+------------------+             | reviewText         |
                                 | avatarUrl          |
                                 | status             |
                                 | featured           |
                                 | liked              |
                                 +--------------------+
```

---

## Data Models

### 1. `User` Model
Collection: `users`

| Field | Type | Modifiers / Validation | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Auto-generated Primary Key | Unique user identifier |
| `name` | String | `required`, max 100 chars | Full name of space owner |
| `email` | String | `required`, `unique`, `lowercase`, `index` | Owner login email address |
| `username` | String | `required`, `unique`, `lowercase`, `index` | Unique handle |
| `passwordHash` | String | `required`, `select: false` | Hashed password (`bcryptjs`) |
| `isEmailVerified` | Boolean | `default: false` | Verification status flag |
| `emailVerificationToken` | String | `select: false`, `default: null` | Token for email verification |
| `emailVerificationExpires`| Date | `select: false`, `default: null` | Verification expiration date |
| `passwordResetToken` | String | `select: false`, `default: null` | Hashed password reset token |
| `passwordResetExpires` | Date | `select: false`, `default: null` | Reset token expiration date |
| `createdAt` | Date | Auto-timestamp | Account creation time |
| `updatedAt` | Date | Auto-timestamp | Account last update time |

---

### 2. `RefreshToken` Model
Collection: `refreshtokens`

| Field | Type | Modifiers / Validation | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Auto-generated Primary Key | Unique token document ID |
| `userId` | ObjectId | `required`, `ref: 'User'`, `index` | Owner reference |
| `tokenHash` | String | `required`, `index` | `SHA-256` hash of raw refresh token |
| `expiresAt` | Date | `required`, `index (TTL 0s)` | Token expiration timestamp (7 days) |
| `isRevoked` | Boolean | `default: false` | Revocation status flag |
| `replacedByToken` | String | `default: null` | SHA-256 hash of rotated token |
| `createdAt` | Date | Auto-timestamp | Creation timestamp |
| `updatedAt` | Date | Auto-timestamp | Modification timestamp |

---

### 3. `Space` Model
Collection: `spaces`

| Field | Type | Modifiers / Validation | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Auto-generated Primary Key | Space identifier |
| `owner` | ObjectId | `required`, `ref: 'User'`, `index` | Reference to space owner |
| `name` | String | `required`, max 100 chars | Public title of the space |
| `slug` | String | `required`, `unique`, `index`, `lowercase` | URL-safe slug (e.g. `acme-corp`) |
| `logo` | String | `default: ''` | URL to space logo image |
| `prompt` | String | `default: '...'` | Review prompt prompt presented to clients |
| `avatarSetting` | String | `enum: ['optional', 'required', 'hidden']` | Customer avatar upload requirement |
| `ratingSetting` | String | `enum: ['optional', 'required', 'hidden']` | Customer star rating requirement |
| `customQuestions` | Array | `[{ label: String, required: Boolean }]` | Custom Q&A questions |
| `theme` | Object | `{ primaryColor, backgroundColor, textColor, darkMode }` | Design theme customization |
| `createdAt` | Date | Auto-timestamp | Space creation time |

---

### 4. `Testimonial` Model
Collection: `testimonials`

| Field | Type | Modifiers / Validation | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Auto-generated Primary Key | Testimonial ID |
| `space` | ObjectId | `required`, `ref: 'Space'`, `index` | Reference to space |
| `clientName` | String | `required`, max 100 chars | Review author name |
| `email` | String | `required`, `lowercase` | Review author email (private) |
| `companyRole` | String | `default: ''` | Author job title & company |
| `rating` | Number | `required`, `min: 1`, `max: 5` | Star rating (1 to 5) |
| `reviewText` | String | `required`, max 3000 chars | Review body text |
| `avatarUrl` | String | `default: ''` | Author avatar photo URL |
| `customAnswers` | Array | `[{ question: String, answer: String }]` | Answers to custom questions |
| `status` | String | `enum: ['pending', 'approved', 'archived']`, `index` | Moderation state |
| `featured` | Boolean | `default: false`, `index` | Featured state on Wall of Love |
| `liked` | Boolean | `default: false` | Owner favorite bookmark |
| `createdAt` | Date | Auto-timestamp | Submission timestamp |
