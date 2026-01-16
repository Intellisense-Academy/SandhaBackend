# Updated Transaction API - Quick Reference

## What Changed?

The transaction creation and filtering has been updated to:
1. ✅ Search for contributors by name (instead of using ID)
2. ✅ Add month field for transaction filtering
3. ✅ Filter by payment status (paid/unpaid)
4. ✅ Auto-populate phone number from contributor record
5. ✅ Support paid/unpaid dashboard summary

---

## New Endpoints

### 1. Search Contributor by Name
**GET** `/api/transactions/search/contributor?name=john`

**Response:**
```json
{
  "status": true,
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "mobile": "9876543210",
      "amount": 5000
    }
  ]
}
```

### 2. Create Transaction (Updated)
**POST** `/api/transactions`

**Request Body:**
```json
{
  "contributorName": "John Doe",
  "amount": 1000,
  "month": "2026-01",
  "paymentMethod": "cash",
  "status": "completed",
  "notes": "January payment"
}
```

**Changes:**
- Now uses `contributorName` instead of `contributorId`
- Requires `month` in YYYY-MM format
- Phone number is auto-populated from contributor record
- Status options: `completed` (paid), `pending` (unpaid), `failed`

**Response:**
```json
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
    "contributor": {
      "id": "uuid",
      "name": "John Doe",
      "mobile": "9876543210",
      "amount": 6000
    },
    "createdAt": "2026-01-10T00:00:00Z"
  }
}
```

### 3. Filter by Month and Status
**GET** `/api/transactions/filter/month-status?month=2026-01&paymentStatus=completed&page=1&limit=20`

**Query Parameters:**
- `month` - Required, format: YYYY-MM
- `paymentStatus` - Optional, values: `completed` (paid), `pending`, `failed`
- `page` - Optional, default: 1
- `limit` - Optional, default: 20

**Response:**
```json
{
  "status": true,
  "data": [
    {
      "id": "tx-uuid",
      "amount": 1000,
      "status": "completed",
      "month": "2026-01",
      "contributor": {
        "name": "John Doe",
        "mobile": "9876543210"
      }
    }
  ],
  "summary": {
    "month": "2026-01",
    "paymentStatus": "completed",
    "total": 5,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

### 4. Paid vs Unpaid Summary
**GET** `/api/transactions/summary/paid-unpaid?month=2026-01`

**Response:**
```json
{
  "status": true,
  "data": {
    "month": "2026-01",
    "summary": {
      "paid": {
        "count": 8,
        "amount": 8000
      },
      "unpaid": {
        "count": 3,
        "amount": 1500
      },
      "total": {
        "count": 11,
        "amount": 9500
      }
    },
    "contributors": [
      {
        "id": "uuid",
        "name": "John Doe",
        "mobile": "9876543210",
        "transactions": [
          {
            "id": "tx-uuid",
            "amount": 1000,
            "status": "completed",
            "month": "2026-01"
          }
        ]
      }
    ]
  }
}
```

### 5. Get Transactions with Month Filter
**GET** `/api/transactions?month=2026-01&status=completed&page=1&limit=20`

**Query Parameters:**
- `month` - Optional, filter by YYYY-MM
- `status` - Optional, filter by status
- `startDate` - Optional, ISO date
- `endDate` - Optional, ISO date
- `page` - Optional, default: 1
- `limit` - Optional, default: 20

---

## Usage Examples

### Frontend Form - Create Transaction
```javascript
// Step 1: Search for contributor
const contributors = await fetch('/api/transactions/search/contributor?name=john')
  .then(r => r.json())
  .then(r => r.data);

// Step 2: Show dropdown of matching contributors

// Step 3: Create transaction
const transaction = await fetch('/api/transactions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contributorName: 'John Doe',      // from dropdown
    amount: 1000,                      // admin input
    month: '2026-01',                  // selected month
    paymentMethod: 'cash',             // admin selection
    status: 'completed',               // admin selection
    notes: 'January contribution'
  })
})
.then(r => r.json());
```

### Dashboard - View Paid/Unpaid
```javascript
// Get summary of paid vs unpaid for a month
const summary = await fetch('/api/transactions/summary/paid-unpaid?month=2026-01')
  .then(r => r.json())
  .then(r => r.data);

console.log(`${summary.summary.paid.count} contributors paid`);
console.log(`${summary.summary.unpaid.count} contributors not paid`);
console.log(`Total collected: ${summary.summary.paid.amount}`);
```

### Filter - Show Only Unpaid
```javascript
// Get all unpaid transactions for January
const unpaid = await fetch('/api/transactions/filter/month-status?month=2026-01&paymentStatus=pending')
  .then(r => r.json())
  .then(r => r.data);
```

---

## Key Features

| Feature | Before | After |
|---------|--------|-------|
| Search by name | ❌ | ✅ |
| Month selection | ❌ | ✅ |
| Auto phone number | ❌ | ✅ |
| Paid/unpaid filter | ❌ | ✅ |
| Monthly summary | ❌ | ✅ |
| Month filtering | ❌ | ✅ |

---

## Database Changes

### New Field: `month`
- Format: YYYY-MM (e.g., 2026-01)
- Type: VARCHAR
- Indexed for fast filtering
- Used for grouping transactions by month

### New Indexes
- `transactions_month_idx` - For month filtering
- `transactions_status_idx` - For status filtering

---

## Status Reference

| Status | Meaning | Updates Amount? | Display |
|--------|---------|-----------------|---------|
| `completed` | Paid ✅ | Yes | Counted as paid |
| `pending` | Awaiting payment ⏳ | No | Counted as unpaid |
| `failed` | Payment failed ❌ | No | Counted as unpaid |

---

## Migration Steps

1. Update schema.prisma ✅
2. Create migration file ✅
3. Run migration: `npx prisma migrate deploy`
4. Generate client: `npx prisma generate`
5. Restart server

---

## API Examples

### Create Paid Transaction
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "contributorName": "Rajesh Kumar",
    "amount": 1000,
    "month": "2026-01",
    "paymentMethod": "cash",
    "status": "completed"
  }'
```

### Create Pending Transaction
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "contributorName": "Priya Singh",
    "amount": 500,
    "month": "2026-01",
    "paymentMethod": "bank transfer",
    "status": "pending"
  }'
```

### Search Contributor
```bash
curl http://localhost:3000/api/transactions/search/contributor?name=raj
```

### Get Month Summary
```bash
curl http://localhost:3000/api/transactions/summary/paid-unpaid?month=2026-01
```

### Filter Paid in January
```bash
curl 'http://localhost:3000/api/transactions/filter/month-status?month=2026-01&paymentStatus=completed'
```

### Filter Unpaid in January
```bash
curl 'http://localhost:3000/api/transactions/filter/month-status?month=2026-01&paymentStatus=pending'
```

---

## Validation Rules

| Field | Rule | Example |
|-------|------|---------|
| contributorName | Must exist in contributors table | "John Doe" |
| amount | Must be > 0 | 1000 |
| month | Format YYYY-MM | "2026-01" |
| paymentMethod | Any string | "cash", "bank", "upi" |
| status | One of: completed, pending, failed | "completed" |

---

## Error Responses

### Contributor Not Found
```json
{
  "status": false,
  "message": "Contributor with name \"John\" not found"
}
```

### Invalid Month Format
```json
{
  "status": false,
  "message": "Month must be in format YYYY-MM (e.g., 2026-01)"
}
```

### Invalid Status
```json
{
  "status": false,
  "message": "Status must be one of: completed, pending, failed"
}
```

---

## Updated Endpoints Summary

### Search
- `GET /api/transactions/search/contributor` - Search by name

### CRUD
- `POST /api/transactions` - Create (with contributorName & month)
- `GET /api/transactions` - List (with month filter)
- `GET /api/transactions/:id` - Get by ID
- `PUT /api/transactions/:id` - Update
- `DELETE /api/transactions/:id` - Delete

### Filtering
- `GET /api/transactions/filter/month-status` - Filter by month & status
- `GET /api/transactions/summary/paid-unpaid` - Paid vs unpaid summary

### Dashboard
- `GET /api/transactions/dashboard/contributor-summary` - Summary by contributor
- `GET /api/transactions/dashboard/statistics` - Overall statistics

---

## Next Steps

1. **Update Frontend** - Use new search and month fields
2. **Run Migration** - Deploy database changes
3. **Test Endpoints** - Verify all new features
4. **Update Dashboard** - Show paid/unpaid summary
5. **Add UI** - Month selector and status filter

---

**Status**: ✅ READY TO DEPLOY
**Last Updated**: January 10, 2026
