# Proofly Example API Requests

Copy-pasteable cURL commands and JavaScript `fetch()` examples for integrating with the Proofly backend.

---

## 1. Authentication

### Signup Owner Account
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sarah Connor",
    "email": "sarah@proofly.io",
    "username": "sarah_c",
    "password": "Password123!"
  }'
```

### Login Owner Account
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -c cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sarah@proofly.io",
    "password": "Password123!"
  }'
```

### Refresh Access Token (using stored cookie)
```bash
curl -X POST http://localhost:5000/api/auth/refresh-token \
  -b cookies.txt \
  -c cookies.txt
```

---

## 2. Spaces Management

### Create New Space
```bash
curl -X POST http://localhost:5000/api/spaces \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Acme Corp Testimonials",
    "slug": "acme-corp",
    "prompt": "How has Acme Corp helped your team?",
    "theme": {
      "primaryColor": "#6366f1"
    }
  }'
```

### List My Spaces
```bash
curl -X GET http://localhost:5000/api/spaces \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 3. Public Review Submissions

### Fetch Public Space Info (for review form)
```bash
curl -X GET http://localhost:5000/api/public/spaces/acme-corp
```

### Submit Testimonial (JSON format)
```bash
curl -X POST http://localhost:5000/api/public/spaces/acme-corp/testimonials \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "Alex Johnson",
    "email": "alex@techcorp.com",
    "companyRole": "CTO at TechCorp",
    "rating": 5,
    "reviewText": "Proofly skyrocketed our landing page conversions by 24%!"
  }'
```

### Submit Testimonial with Avatar Image Upload (Multipart Form)
```bash
curl -X POST http://localhost:5000/api/public/spaces/acme-corp/testimonials \
  -F "clientName=Elena Rostova" \
  -F "email=elena@designhub.io" \
  -F "companyRole=Head of Design" \
  -F "rating=5" \
  -F "reviewText=The embed widgets match our brand aesthetics perfectly." \
  -F "avatar=@/path/to/avatar.jpg"
```

---

## 4. Testimonial Moderation

### Filter & Search Testimonials
```bash
curl -X GET "http://localhost:5000/api/testimonials?status=pending&search=conversions" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Approve Testimonial
```bash
curl -X PATCH http://localhost:5000/api/testimonials/TESTIMONIAL_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{ "status": "approved" }'
```

### Toggle Featured Flag
```bash
curl -X PATCH http://localhost:5000/api/testimonials/TESTIMONIAL_ID/featured \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{ "featured": true }'
```

---

## 5. Analytics

### Summary Stats
```bash
curl -X GET http://localhost:5000/api/analytics/SPACE_ID/summary \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Star Distribution
```bash
curl -X GET http://localhost:5000/api/analytics/SPACE_ID/distribution \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 6. Public Wall of Love & Widget Embed Generator

### Fetch Wall of Love
```bash
curl -X GET http://localhost:5000/api/public/spaces/acme-corp/wall?theme=dark&featured=true
```

### Get Widget Embed Code
```bash
curl -X GET "http://localhost:5000/api/public/spaces/acme-corp/embed?type=carousel&theme=light"
```
