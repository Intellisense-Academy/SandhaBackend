# Database Schema Documentation

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      CONTRIBUTORS                              │
├─────────────────────────────────────────────────────────────────┤
│ id (UUID) - PRIMARY KEY                                        │
│ name (VARCHAR) - NOT NULL                                      │
│ mobile (VARCHAR) - UNIQUE, NOT NULL                            │
│ amount (DECIMAL) - DEFAULT 0                                   │
│ createdAt (TIMESTAMP) - DEFAULT NOW()                          │
│ updatedAt (TIMESTAMP)                                          │
└────────┬────────────────────────────────────────────────────────┘
         │
         │ (1 to Many)
         │ FK: contributorId
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      TRANSACTIONS                              │
├─────────────────────────────────────────────────────────────────┤
│ id (UUID) - PRIMARY KEY                                        │
│ contributorId (UUID) - FOREIGN KEY ─────────┐                 │
│ amount (DECIMAL) - NOT NULL                 │                 │
│ phoneNumber (VARCHAR) - NOT NULL            │ References      │
│ paymentMethod (VARCHAR) - DEFAULT 'cash'    │ Contributors.id │
│ status (VARCHAR) - DEFAULT 'completed'      │                 │
│ notes (TEXT) - NULLABLE                     │                 │
│ createdAt (TIMESTAMP) - DEFAULT NOW()   ┌───┴─────────────────┘
│ updatedAt (TIMESTAMP)                   │
│ INDEX: (contributorId)                  │
│ INDEX: (createdAt)                      │
└─────────────────────────────────────────┘
```

---

## Table Specifications

### CONTRIBUTORS TABLE

| Column    | Type      | Constraints | Description                          |
|-----------|-----------|-------------|--------------------------------------|
| id        | UUID      | PK          | Auto-generated unique identifier     |
| name      | VARCHAR   | NOT NULL    | Contributor's full name              |
| mobile    | VARCHAR   | UNIQUE      | Unique mobile number (10 digits)     |
| amount    | DECIMAL   | DEFAULT 0   | Total contributions (auto-updated)   |
| createdAt | TIMESTAMP | DEFAULT NOW | Record creation timestamp            |
| updatedAt | TIMESTAMP | AUTO        | Last update timestamp                |

**Indexes:**
- PRIMARY KEY: id
- UNIQUE: mobile

---

### TRANSACTIONS TABLE

| Column       | Type      | Constraints | Description                                    |
|--------------|-----------|-------------|------------------------------------------------|
| id           | UUID      | PK          | Auto-generated unique identifier               |
| contributorId| UUID      | FK, NOT NULL| Reference to contributors table               |
| amount       | DECIMAL   | NOT NULL    | Transaction amount                             |
| phoneNumber  | VARCHAR   | NOT NULL    | Phone number for transaction (10 digits)      |
| paymentMethod| VARCHAR   | DEFAULT     | Payment method (cash, bank, upi, etc.)        |
| status       | VARCHAR   | DEFAULT     | Status (completed, pending, failed)           |
| notes        | TEXT      | NULLABLE    | Optional notes for transaction                 |
| createdAt    | TIMESTAMP | DEFAULT NOW | Record creation timestamp                      |
| updatedAt    | TIMESTAMP | AUTO        | Last update timestamp                         |

**Indexes:**
- PRIMARY KEY: id
- FOREIGN KEY: contributorId → contributors(id)
- INDEX: contributorId (for filtering)
- INDEX: createdAt (for date range filtering)

**Constraints:**
- ON DELETE CASCADE: Deleting contributor deletes all transactions

---

## SQL Queries for Common Operations

### 1. Get Total Contributions by Contributor (Last 30 Days)
```sql
SELECT 
  c.id,
  c.name,
  c.mobile,
  COUNT(t.id) as transaction_count,
  COALESCE(SUM(t.amount), 0) as total_amount
FROM contributors c
LEFT JOIN transactions t ON c.id = t."contributorId"
  AND t."createdAt" >= NOW() - INTERVAL '30 days'
  AND t.status = 'completed'
GROUP BY c.id, c.name, c.mobile
ORDER BY total_amount DESC;
```

### 2. Get All Transactions with Contributor Details
```sql
SELECT 
  t.id,
  t.amount,
  t."phoneNumber",
  t."paymentMethod",
  t.status,
  t."createdAt",
  c.name as contributor_name,
  c.mobile as contributor_mobile
FROM transactions t
JOIN contributors c ON t."contributorId" = c.id
ORDER BY t."createdAt" DESC;
```

### 3. Get Top 10 Contributors by Amount
```sql
SELECT 
  c.id,
  c.name,
  c.mobile,
  c.amount,
  COUNT(t.id) as transaction_count
FROM contributors c
LEFT JOIN transactions t ON c.id = t."contributorId" 
  AND t.status = 'completed'
GROUP BY c.id, c.name, c.mobile, c.amount
ORDER BY c.amount DESC
LIMIT 10;
```

### 4. Get Pending Transactions
```sql
SELECT 
  t.id,
  t.amount,
  t."phoneNumber",
  t."createdAt",
  c.name as contributor_name
FROM transactions t
JOIN contributors c ON t."contributorId" = c.id
WHERE t.status = 'pending'
ORDER BY t."createdAt" DESC;
```

### 5. Get Transaction Summary by Payment Method
```sql
SELECT 
  t."paymentMethod",
  COUNT(*) as transaction_count,
  SUM(t.amount) as total_amount,
  AVG(t.amount) as average_amount
FROM transactions t
WHERE t.status = 'completed'
GROUP BY t."paymentMethod"
ORDER BY total_amount DESC;
```

### 6. Get Duplicate Mobile Checks
```sql
SELECT 
  mobile,
  COUNT(*) as count
FROM contributors
GROUP BY mobile
HAVING COUNT(*) > 1;
```

### 7. Get Transactions in Date Range
```sql
SELECT 
  t.id,
  c.name,
  t.amount,
  t."paymentMethod",
  t.status,
  t."createdAt"
FROM transactions t
JOIN contributors c ON t."contributorId" = c.id
WHERE t."createdAt" BETWEEN '2026-01-01' AND '2026-01-31'
  AND t.status = 'completed'
ORDER BY t."createdAt" DESC;
```

### 8. Get Contributors with No Transactions
```sql
SELECT 
  c.id,
  c.name,
  c.mobile,
  c.amount,
  c."createdAt"
FROM contributors c
LEFT JOIN transactions t ON c.id = t."contributorId"
WHERE t.id IS NULL
ORDER BY c."createdAt" DESC;
```

### 9. Get Monthly Transaction Summary
```sql
SELECT 
  DATE_TRUNC('month', t."createdAt")::date as month,
  COUNT(*) as transaction_count,
  SUM(t.amount) as total_amount,
  COUNT(DISTINCT t."contributorId") as unique_contributors
FROM transactions t
WHERE t.status = 'completed'
GROUP BY DATE_TRUNC('month', t."createdAt")
ORDER BY month DESC;
```

### 10. Verify Data Consistency (Total in Contributor vs Sum of Transactions)
```sql
SELECT 
  c.id,
  c.name,
  c.amount as stored_amount,
  COALESCE(SUM(t.amount), 0) as calculated_amount,
  c.amount - COALESCE(SUM(t.amount), 0) as difference
FROM contributors c
LEFT JOIN transactions t ON c.id = t."contributorId" 
  AND t.status = 'completed'
GROUP BY c.id, c.name, c.amount
HAVING c.amount != COALESCE(SUM(t.amount), 0);
```

---

## Data Validation Rules

### Contributor Table
| Field  | Validation                                      | Example        |
|--------|------------------------------------------------|-----------------|
| name   | Required, min 2 chars, max 255 chars           | "John Doe"     |
| mobile | Required, exactly 10 digits, unique            | "9876543210"   |
| amount | Non-negative decimal, auto-calculated          | 5000.00        |

### Transaction Table
| Field         | Validation                                      | Example              |
|---------------|------------------------------------------------|----------------------|
| contributorId | Required, must exist in contributors            | UUID                |
| amount        | Required, > 0, decimal with 2 places           | 1000.50             |
| phoneNumber   | Required, exactly 10 digits                     | "9876543210"        |
| paymentMethod | Optional, from predefined list                  | "cash", "bank", etc |
| status        | Optional, from: completed/pending/failed        | "completed"         |
| notes         | Optional, max 500 characters                    | "Initial payment"   |

---

## Performance Optimization Tips

### 1. For High-Volume Transactions
```sql
-- Create a materialized view for monthly summaries
CREATE MATERIALIZED VIEW contributor_monthly_summary AS
SELECT 
  DATE_TRUNC('month', t."createdAt")::date as month,
  t."contributorId",
  c.name,
  COUNT(*) as count,
  SUM(t.amount) as total
FROM transactions t
JOIN contributors c ON t."contributorId" = c.id
WHERE t.status = 'completed'
GROUP BY DATE_TRUNC('month', t."createdAt"), t."contributorId", c.name;

-- Refresh monthly
REFRESH MATERIALIZED VIEW contributor_monthly_summary;
```

### 2. Partitioning for Large Transaction Tables
```sql
-- Partition by year if very large
CREATE TABLE transactions_2026 PARTITION OF transactions
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
```

### 3. Archive Old Data
```sql
-- Archive transactions older than 2 years
CREATE TABLE transactions_archive AS
SELECT * FROM transactions
WHERE "createdAt" < NOW() - INTERVAL '2 years';

DELETE FROM transactions
WHERE "createdAt" < NOW() - INTERVAL '2 years';
```

---

## Backup and Recovery

### Regular Backups
```bash
# Daily backup
pg_dump -U username -d database_name -F c -b -v -f "backup_$(date +%Y%m%d).dump"
```

### Restore from Backup
```bash
pg_restore -U username -d database_name "backup_20260110.dump"
```

---

## Migration Path (If Updating Existing System)

1. Create new Transaction table with migration
2. Verify Transaction table structure
3. Migrate historical data if available
4. Update application code to use new routes
5. Test with sample data
6. Enable write operations to new tables
7. Monitor for 24-48 hours
8. Archive old transaction data if applicable
