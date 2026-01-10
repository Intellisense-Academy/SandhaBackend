# Contributor & Transaction Management API Documentation

## Database Schema Overview

### Contributor Table
```
- id (UUID, Primary Key)
- name (VARCHAR, not null)
- mobile (VARCHAR, unique, not null)
- amount (DECIMAL, default 0) - Total contributions
- transactions (Relationship to Transaction table)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

### Transaction Table
```
- id (UUID, Primary Key)
- contributorId (UUID, Foreign Key → Contributor.id)
- amount (DECIMAL, not null)
- phoneNumber (VARCHAR, not null)
- paymentMethod (VARCHAR, default 'cash')
- status (VARCHAR, default 'completed') - completed|pending|failed
- notes (TEXT, optional)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

---

## CONTRIBUTORS API

### 1. Create Contributor
**POST** `/api/contributors`

**Request Body:**
```json
{
  "name": "John Doe",
  "mobile": "9876543210",
  "amount": 0
}
```

**Response (201):**
```json
{
  "status": true,
  "message": "Contributor created successfully",
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "mobile": "9876543210",
    "amount": 0,
    "createdAt": "2026-01-10T00:00:00Z",
    "updatedAt": "2026-01-10T00:00:00Z"
  }
}
```

---

### 2. List Contributors
**GET** `/api/contributors`

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 20, max: 100)
- `search` (optional, searches name or mobile)

**Response:**
```json
{
  "status": true,
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "mobile": "9876543210",
      "amount": 5000,
      "transactions": [
        {
          "id": "tx-uuid",
          "amount": 1000,
          "createdAt": "2026-01-10T00:00:00Z",
          "status": "completed"
        }
      ],
      "createdAt": "2026-01-10T00:00:00Z",
      "updatedAt": "2026-01-10T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

---

### 3. Get Contributor By ID
**GET** `/api/contributors/:id`

**Response:**
```json
{
  "status": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "mobile": "9876543210",
    "amount": 5000,
    "transactions": [
      {
        "id": "tx-uuid",
        "amount": 1000,
        "phoneNumber": "9876543210",
        "paymentMethod": "cash",
        "status": "completed",
        "notes": "Initial payment",
        "createdAt": "2026-01-10T00:00:00Z"
      }
    ],
    "createdAt": "2026-01-10T00:00:00Z"
  }
}
```

---

### 4. Update Contributor
**PUT** `/api/contributors/:id`

**Request Body:**
```json
{
  "name": "Jane Doe",
  "mobile": "9876543211"
}
```

---

### 5. Delete Contributor
**DELETE** `/api/contributors/:id`

**Note:** Cascades delete all associated transactions

---

### 6. Get Contributors for Autocomplete/Dropdown
**GET** `/api/contributors/list/autocomplete`

**Query Parameters:**
- `search` (optional, searches name or mobile)

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

---

### 7. Get Contributor Transaction History
**GET** `/api/contributors/:id/transactions`

**Query Parameters:**
- `startDate` (optional, ISO format)
- `endDate` (optional, ISO format)
- `status` (optional, filter by transaction status)

**Response:**
```json
{
  "status": true,
  "data": [
    {
      "id": "tx-uuid",
      "amount": 1000,
      "phoneNumber": "9876543210",
      "paymentMethod": "cash",
      "status": "completed",
      "notes": "Initial payment",
      "createdAt": "2026-01-10T00:00:00Z"
    }
  ]
}
```

---

## TRANSACTIONS API

### 1. Create Transaction
**POST** `/api/transactions`

**Request Body:**
```json
{
  "contributorId": "uuid",
  "amount": 1000,
  "phoneNumber": "9876543210",
  "paymentMethod": "cash",
  "status": "completed",
  "notes": "Initial payment"
}
```

**Notes:**
- Automatically updates contributor's total amount if status is "completed"
- Uses transactions to ensure data consistency
- Phone number validation (10 digits required)

**Response (201):**
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
    "notes": "Initial payment",
    "contributor": {
      "id": "uuid",
      "name": "John Doe",
      "mobile": "9876543210",
      "amount": 5000
    },
    "createdAt": "2026-01-10T00:00:00Z"
  }
}
```

---

### 2. List Transactions
**GET** `/api/transactions`

**Query Parameters:**
- `contributorId` (optional, filter by contributor)
- `startDate` (optional, ISO format)
- `endDate` (optional, ISO format)
- `status` (optional, completed|pending|failed)
- `page` (optional, default: 1)
- `limit` (optional, default: 20)

**Response:**
```json
{
  "status": true,
  "data": [
    {
      "id": "tx-uuid",
      "amount": 1000,
      "phoneNumber": "9876543210",
      "paymentMethod": "cash",
      "status": "completed",
      "contributor": {
        "id": "uuid",
        "name": "John Doe",
        "mobile": "9876543210",
        "amount": 5000
      },
      "createdAt": "2026-01-10T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

---

### 3. Get Transaction By ID
**GET** `/api/transactions/:id`

---

### 4. Update Transaction
**PUT** `/api/transactions/:id`

**Request Body:**
```json
{
  "amount": 1500,
  "status": "pending",
  "notes": "Updated notes"
}
```

---

### 5. Delete Transaction
**DELETE** `/api/transactions/:id`

**Notes:**
- Reverses contributor's amount if transaction was completed

---

## DASHBOARD API

### 1. Get Contributor Summary
**GET** `/api/transactions/dashboard/contributor-summary`

**Query Parameters:**
- `startDate` (optional, ISO format)
- `endDate` (optional, ISO format)

**Response:**
```json
{
  "status": true,
  "data": [
    {
      "contributor": {
        "id": "uuid",
        "name": "John Doe",
        "mobile": "9876543210",
        "amount": 5000,
        "createdAt": "2026-01-10T00:00:00Z"
      },
      "totalTransactionAmount": 5000,
      "transactionCount": 5
    }
  ]
}
```

---

### 2. Get Overall Statistics
**GET** `/api/transactions/dashboard/statistics`

**Query Parameters:**
- `startDate` (optional, ISO format)
- `endDate` (optional, ISO format)

**Response:**
```json
{
  "status": true,
  "data": {
    "totalTransactions": 150,
    "totalAmount": 50000,
    "uniqueContributors": 25,
    "averageContribution": 333.33
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "status": false,
  "message": "Description of the error"
}
```

### 404 Not Found
```json
{
  "status": false,
  "message": "Resource not found"
}
```

### 500 Server Error
```json
{
  "status": false,
  "message": "Server error"
}
```

---

## Usage Examples

### Example 1: Create a Contributor
```bash
curl -X POST http://localhost:3000/api/contributors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "mobile": "9876543210"
  }'
```

### Example 2: Create a Transaction
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "contributorId": "uuid-here",
    "amount": 1000,
    "phoneNumber": "9876543210",
    "paymentMethod": "cash"
  }'
```

### Example 3: Get Dashboard Statistics
```bash
curl -X GET 'http://localhost:3000/api/transactions/dashboard/statistics?startDate=2026-01-01&endDate=2026-01-31'
```

### Example 4: Filter Transactions by Date Range
```bash
curl -X GET 'http://localhost:3000/api/transactions?startDate=2026-01-01&endDate=2026-01-31&page=1&limit=20'
```

---

## Implementation Notes

1. **Phone Number Validation**: All phone numbers must be 10 digits
2. **Auto-Update**: Contributor's amount field automatically updates when completed transactions are added or deleted
3. **Payment Status**: Only completed transactions update the contributor's amount
4. **Cascade Delete**: Deleting a contributor also deletes all associated transactions
5. **Timestamps**: All dates are ISO 8601 format
6. **Pagination**: Maximum limit is 100 records per page
7. **Foreign Key Relationship**: contributor_id is required for transaction creation
