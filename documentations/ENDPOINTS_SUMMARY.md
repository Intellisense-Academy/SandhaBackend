# Complete Endpoints Summary

## Overview
This document provides a quick reference for all 23 API endpoints across the Sandha Backend system.

---

## Contributors Endpoints (10 Total)

| # | Method | Endpoint | Purpose | Auth | Status |
|---|--------|----------|---------|------|--------|
| 1 | POST | `/api/contributors` | Create new contributor | - | ✅ |
| 2 | GET | `/api/contributors` | List all contributors with pagination | - | ✅ |
| 3 | GET | `/api/contributors/:id` | Get single contributor with stats | - | ✅ |
| 4 | PUT | `/api/contributors/:id` | Update contributor details | - | ✅ |
| 5 | DELETE | `/api/contributors/:id` | Delete contributor | - | ✅ |
| 6 | GET | `/api/contributors/list/autocomplete` | Autocomplete for dropdown | - | ✅ |
| 7 | GET | `/api/contributors/:id/transactions` | Get transactions for contributor | - | ✅ |
| 8 | GET | `/api/contributors/:id/stats` | Get detailed stats for contributor | - | ✅ |
| 9 | POST | `/api/contributors/bulk/get` | Fetch multiple contributors | - | ✅ |
| 10 | GET | `/api/contributors/dashboard/all` | Dashboard aggregation | - | ✅ |

### Contributor Request/Response Examples

#### 1. Create Contributor
```bash
POST /api/contributors
Content-Type: application/json

{
  "name": "Rajesh Kumar",
  "mobile": "9876543210",
  "email": "rajesh@example.com"
}

Response: 201 Created
{
  "status": true,
  "message": "Contributor created successfully",
  "data": {
    "id": "uuid",
    "name": "Rajesh Kumar",
    "mobile": "9876543210",
    "email": "rajesh@example.com",
    "amount": 0,
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  }
}
```

#### 2. Get All Contributors
```bash
GET /api/contributors?page=1&limit=10&search=Raj&sort=name&order=asc

Response: 200 OK
{
  "status": true,
  "data": [
    {
      "id": "uuid",
      "name": "Rajesh Kumar",
      "mobile": "9876543210",
      "email": "rajesh@example.com",
      "amount": 5000,
      "transactionCount": 3
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 10,
    "pages": 2
  }
}
```

#### 3. Get Contributor by ID
```bash
GET /api/contributors/uuid

Response: 200 OK
{
  "status": true,
  "data": {
    "id": "uuid",
    "name": "Rajesh Kumar",
    "mobile": "9876543210",
    "email": "rajesh@example.com",
    "amount": 5000,
    "transactions": [...],
    "stats": {
      "totalTransactions": 5,
      "totalAmount": 5000,
      "lastTransaction": "ISO8601"
    }
  }
}
```

#### 4. Update Contributor
```bash
PUT /api/contributors/uuid
Content-Type: application/json

{
  "name": "Updated Name",
  "mobile": "9876543211",
  "email": "new@example.com"
}

Response: 200 OK
{
  "status": true,
  "message": "Contributor updated successfully",
  "data": { ... }
}
```

#### 5. Delete Contributor
```bash
DELETE /api/contributors/uuid

Response: 200 OK
{
  "status": true,
  "message": "Contributor deleted successfully",
  "data": {
    "deletedId": "uuid",
    "deletedAt": "ISO8601"
  }
}
```

#### 6. Autocomplete Contributor
```bash
GET /api/contributors/list/autocomplete?search=Raj

Response: 200 OK
{
  "status": true,
  "data": [
    {
      "id": "uuid",
      "name": "Rajesh Kumar",
      "mobile": "9876543210"
    }
  ]
}
```

#### 7. Get Contributor Transactions
```bash
GET /api/contributors/uuid/transactions?month=2026-01&status=completed

Response: 200 OK
{
  "status": true,
  "data": [
    {
      "id": "tx-uuid",
      "amount": 1000,
      "status": "completed",
      "month": "2026-01",
      "createdAt": "ISO8601"
    }
  ]
}
```

#### 8. Get Contributor Stats
```bash
GET /api/contributors/uuid/stats

Response: 200 OK
{
  "status": true,
  "data": {
    "totalTransactions": 5,
    "totalContributed": 5000,
    "averageContribution": 1000,
    "lastContributionDate": "ISO8601",
    "contributionsByMonth": {
      "2026-01": 3000,
      "2025-12": 2000
    },
    "statusDistribution": {
      "completed": 5,
      "pending": 0,
      "failed": 0
    }
  }
}
```

#### 9. Bulk Get Contributors
```bash
POST /api/contributors/bulk/get
Content-Type: application/json

{
  "ids": ["uuid1", "uuid2", "uuid3"]
}

Response: 200 OK
{
  "status": true,
  "data": [...],
  "count": 3
}
```

#### 10. Dashboard - All Contributors
```bash
GET /api/contributors/dashboard/all

Response: 200 OK
{
  "status": true,
  "data": {
    "totalContributors": 10,
    "totalContributions": 50000,
    "averageContribution": 5000,
    "topContributors": [...],
    "recentContributors": [...]
  }
}
```

---

## Transactions Endpoints (13 Total)

| # | Method | Endpoint | Purpose | Auth | Status |
|---|--------|----------|---------|------|--------|
| 1 | GET | `/api/transactions/search/contributor` | Search contributor by name | - | ✅ |
| 2 | POST | `/api/transactions` | Create transaction | - | ✅ |
| 3 | GET | `/api/transactions` | List transactions with filtering | - | ✅ |
| 4 | GET | `/api/transactions/:id` | Get single transaction | - | ✅ |
| 5 | PUT | `/api/transactions/:id` | Update transaction | - | ✅ |
| 6 | DELETE | `/api/transactions/:id` | Delete transaction | - | ✅ |
| 7 | GET | `/api/transactions/filter/month-status` | Filter by month and status | - | ✅ |
| 8 | GET | `/api/transactions/summary/paid-unpaid` | Paid vs unpaid summary | - | ✅ |
| 9 | GET | `/api/transactions/dashboard/contributor-summary` | Contributor transaction summary | - | ✅ |
| 10 | GET | `/api/transactions/dashboard/statistics` | Overall statistics | - | ✅ |
| 11 | POST | `/api/transactions/bulk/get` | Fetch multiple transactions | - | ✅ |
| 12 | GET | `/api/transactions/stats/payment-methods` | Payment method breakdown | - | ✅ |
| 13 | GET | `/api/transactions/stats/monthly-trend` | Monthly collection trend | - | ✅ |

### Transaction Request/Response Examples

#### 1. Search Contributor by Name
```bash
GET /api/transactions/search/contributor?name=Raj

Response: 200 OK
{
  "status": true,
  "data": [
    {
      "id": "uuid",
      "name": "Rajesh Kumar",
      "mobile": "9876543210",
      "amount": 5000
    }
  ]
}
```

#### 2. Create Transaction
```bash
POST /api/transactions
Content-Type: application/json

{
  "contributorName": "Rajesh Kumar",
  "amount": 1000,
  "month": "2026-01",
  "paymentMethod": "cash",
  "status": "completed",
  "notes": "Monthly contribution"
}

Response: 201 Created
{
  "status": true,
  "message": "Transaction created successfully",
  "data": {
    "id": "tx-uuid",
    "contributorId": "uuid",
    "amount": 1000,
    "phoneNumber": "9876543210",
    "paymentMethod": "cash",
    "status": "completed",
    "month": "2026-01",
    "notes": "Monthly contribution",
    "createdAt": "ISO8601",
    "contributor": { ... }
  }
}
```

#### 3. Get All Transactions
```bash
GET /api/transactions?page=1&limit=20&status=completed&month=2026-01&sortBy=createdAt&order=desc

Response: 200 OK
{
  "status": true,
  "data": [ ... ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

#### 4-6. Get, Update, Delete Transaction
```bash
GET /api/transactions/tx-uuid
PUT /api/transactions/tx-uuid
DELETE /api/transactions/tx-uuid
```

#### 7. Filter by Month and Status
```bash
GET /api/transactions/filter/month-status?month=2026-01&paymentStatus=completed&page=1&limit=20

Response: 200 OK
{
  "status": true,
  "data": [ ... ],
  "summary": {
    "month": "2026-01",
    "paymentStatus": "completed",
    "total": 8,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

#### 8. Paid vs Unpaid Summary
```bash
GET /api/transactions/summary/paid-unpaid?month=2026-01

Response: 200 OK
{
  "status": true,
  "data": {
    "month": "2026-01",
    "summary": {
      "paid": { "count": 8, "amount": 8000 },
      "unpaid": { "count": 2, "amount": 1500 },
      "total": { "count": 10, "amount": 9500 }
    },
    "contributors": [ ... ]
  }
}
```

#### 9. Dashboard - Contributor Summary
```bash
GET /api/transactions/dashboard/contributor-summary?month=2026-01

Response: 200 OK
{
  "status": true,
  "data": [
    {
      "contributor": { ... },
      "totalTransactionAmount": 3000,
      "transactionCount": 3
    }
  ]
}
```

#### 10. Dashboard - Statistics
```bash
GET /api/transactions/dashboard/statistics?month=2026-01

Response: 200 OK
{
  "status": true,
  "data": {
    "totalTransactions": 50,
    "totalAmount": 50000,
    "uniqueContributors": 10,
    "averageContribution": 1000,
    "byPaymentMethod": [
      {
        "method": "cash",
        "count": 30,
        "amount": 30000
      }
    ]
  }
}
```

#### 11. Bulk Get Transactions
```bash
POST /api/transactions/bulk/get
Content-Type: application/json

{
  "ids": ["tx-uuid1", "tx-uuid2"]
}

Response: 200 OK
{
  "status": true,
  "data": [ ... ],
  "count": 2
}
```

#### 12. Payment Methods Statistics
```bash
GET /api/transactions/stats/payment-methods?month=2026-01

Response: 200 OK
{
  "status": true,
  "data": [
    {
      "paymentMethod": "cash",
      "count": 30,
      "totalAmount": 30000,
      "averageAmount": 1000
    }
  ]
}
```

#### 13. Monthly Collection Trend
```bash
GET /api/transactions/stats/monthly-trend

Response: 200 OK
{
  "status": true,
  "data": {
    "2026-01": { "count": 30, "amount": 30000 },
    "2025-12": { "count": 20, "amount": 20000 }
  }
}
```

---

## Key Features

### Validation Rules

#### Contributor Validation
- **Name**: Required, 2-100 characters
- **Mobile**: Required, 10 digits, unique
- **Email**: Optional, valid email format

#### Transaction Validation
- **Amount**: Required, > 0
- **Month**: Required, YYYY-MM format (e.g., 2026-01)
- **Status**: completed, pending, or failed
- **Contributor**: Must exist in database

### Error Codes

| Code | Meaning | Example |
|------|---------|---------|
| 400 | Bad Request | Missing field, invalid format |
| 404 | Not Found | Contributor/Transaction doesn't exist |
| 409 | Conflict | Duplicate mobile number |
| 500 | Server Error | Database connection issues |

### Common Query Parameters

| Parameter | Type | Default | Max | Example |
|-----------|------|---------|-----|---------|
| page | number | 1 | - | ?page=2 |
| limit | number | 20 | 100 | ?limit=50 |
| sort | string | name | - | ?sort=amount |
| order | string | asc | - | ?order=desc |
| search | string | - | - | ?search=Raj |

---

## Authentication & Security

Currently, all endpoints are **publicly accessible** (no authentication required).

**Future Enhancement**: Add JWT token-based authentication

```javascript
// Example token-based route (to be implemented)
router.post('/login', (req, res) => {
  // Generate JWT token
  // Return token
});

// Middleware for protected routes
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ status: false });
  // Verify token
  next();
};
```

---

## Pagination

All list endpoints support pagination:

```bash
GET /api/contributors?page=1&limit=10
```

Response includes:
```json
{
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "pages": 10
  }
}
```

---

## Sorting

Supported sort fields vary by endpoint:

**Contributors**: name, amount, createdAt  
**Transactions**: amount, createdAt, status, month

```bash
GET /api/contributors?sort=amount&order=desc
```

---

## Filtering

### Date Range Filtering
```bash
GET /api/transactions?startDate=2026-01-01&endDate=2026-01-31
```

### Month Filtering
```bash
GET /api/transactions?month=2026-01
```

### Status Filtering
```bash
GET /api/transactions?status=completed
```

### Multiple Filters
```bash
GET /api/transactions?month=2026-01&status=completed&paymentMethod=cash&page=1&limit=20
```

---

## Database Operations

### Automatic Amount Updates
When a transaction is created with status "completed":
```
Contributor.amount += Transaction.amount
```

When a transaction is deleted:
```
Contributor.amount -= Transaction.amount
```

### Cascade Delete
Deleting a contributor automatically deletes all associated transactions.

---

## Performance Considerations

1. **Pagination**: Always use pagination for large datasets
2. **Indexing**: Database indexes on: contributorId, createdAt, month, status
3. **Response Time**: Target < 500ms for most requests
4. **Batch Operations**: Use `/bulk/get` endpoints for multiple records

---

## Example Workflows

### Workflow 1: Add Monthly Contribution
1. Search for contributor: `GET /search/contributor?name=Raj`
2. Create transaction: `POST /transactions` with contributorName
3. Verify amount updated: `GET /contributors/:id`

### Workflow 2: Generate Monthly Report
1. Get statistics: `GET /transactions/dashboard/statistics?month=2026-01`
2. Get paid/unpaid: `GET /transactions/summary/paid-unpaid?month=2026-01`
3. Get contributor summary: `GET /transactions/dashboard/contributor-summary?month=2026-01`

### Workflow 3: Update Transaction Status
1. Get transaction: `GET /transactions/:id`
2. Update status: `PUT /transactions/:id` with new status
3. Verify in summary: `GET /transactions/summary/paid-unpaid`

---

## Integration Checklist

- [ ] All 23 endpoints deployed
- [ ] Database migrations applied
- [ ] Validation working
- [ ] Error handling verified
- [ ] Pagination tested
- [ ] Filtering tested
- [ ] Amount auto-update working
- [ ] Dashboard analytics functional
- [ ] Performance acceptable
- [ ] Documentation complete
- [ ] Postman collection imported
- [ ] Team trained on API usage

---

## Support & Documentation

- **Testing Guide**: See `COMPLETE_API_TESTING_GUIDE.md`
- **Postman Collection**: `API_TESTING_POSTMAN_COLLECTION.json`
- **Database Schema**: `schema.prisma`
- **Implementation**: `routes/contributors_complete.js`, `routes/transactions_complete.js`

