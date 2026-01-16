# Deployment & Implementation Guide

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Database Setup](#database-setup)
3. [Server Setup](#server-setup)
4. [Route Integration](#route-integration)
5. [Testing & Validation](#testing--validation)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### System Requirements
- [ ] Node.js v16 or higher
- [ ] PostgreSQL v12 or higher
- [ ] npm or yarn package manager
- [ ] Git (optional, for version control)

### Project Structure
```
SandhaBackend/
├── routes/
│   ├── auth.js
│   ├── contributors.js (original)
│   ├── contributors_complete.js (new)
│   ├── transactions.js (original)
│   ├── transactions_complete.js (new)
│   └── ...
├── migrations/
│   ├── migration_lock.toml
│   ├── 20251213103230_init/
│   └── ...
├── src/
│   └── generated/
│       └── (Prisma generated files)
├── .env
├── package.json
├── prisma.config.ts
├── schema.prisma
└── server.js
```

---

## Database Setup

### Step 1: Configure Environment Variables

Create or update `.env` file:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/sandhabackend"

# Server Configuration
PORT=3000
NODE_ENV=development

# Optional
API_PREFIX=/api
LOG_LEVEL=debug
```

### Step 2: Install Dependencies

```bash
cd /path/to/SandhaBackend

# Install npm packages
npm install

# Or if using yarn
yarn install
```

### Step 3: Update Prisma Schema

Ensure `schema.prisma` includes both models:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
  output   = "./src/generated"
}

model Contributor {
  id           String          @id @default(uuid())
  name         String          @db.VarChar(255)
  mobile       String          @unique @db.VarChar(20)
  email        String?         @db.VarChar(255)
  amount       BigInt          @default(0)
  transactions Transaction[]
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt

  @@index([createdAt])
  @@index([name])
}

model Transaction {
  id              String      @id @default(uuid())
  contributorId   String
  amount          BigInt
  phoneNumber     String
  paymentMethod   String      @default("cash")
  status          String      @default("completed")
  month           String?     @db.VarChar(10)
  notes           String?
  contributor     Contributor @relation(fields: [contributorId], references: [id], onDelete: Cascade)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([contributorId])
  @@index([createdAt])
  @@index([month])
  @@index([status])
}
```

### Step 4: Run Database Migrations

```bash
# Create and apply migrations
npx prisma migrate deploy

# Or if first time
npx prisma db push

# Generate Prisma client
npx prisma generate

# Optional: Seed test data
npx prisma db seed
```

### Step 5: Verify Database Connection

```bash
# Test connection
npx prisma studio

# This opens a GUI at http://localhost:5555 to view database
```

---

## Server Setup

### Step 1: Update Main Server File (server.js)

```javascript
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

// Import routes
import contributorsRouter from './routes/contributors_complete.js';
import transactionsRouter from './routes/transactions_complete.js';
import authRouter from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// API Routes
const apiPrefix = process.env.API_PREFIX || '/api';

app.use(`${apiPrefix}/contributors`, contributorsRouter);
app.use(`${apiPrefix}/transactions`, transactionsRouter);
app.use(`${apiPrefix}/auth`, authRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: false,
    message: 'Route not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    status: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📝 API endpoints available at http://localhost:${PORT}${apiPrefix}`);
});
```

### Step 2: Update package.json Scripts

```json
{
  "name": "sandha-backend",
  "version": "1.0.0",
  "description": "Contributor & Transaction Management System",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "npm run test:unit",
    "test:unit": "echo 'Tests to be implemented'",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:seed": "node prisma/seed.js"
  },
  "dependencies": {
    "@prisma/adapter-pg": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "express": "^4.18.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.0",
    "prisma": "^5.0.0"
  }
}
```

---

## Route Integration

### Step 1: Backup Original Routes (Optional)

```bash
# Create backup
cp routes/contributors.js routes/contributors.backup.js
cp routes/transactions.js routes/transactions.backup.js
```

### Step 2: Option A: Replace Original Routes

```bash
# Replace with new versions
mv routes/contributors_complete.js routes/contributors.js
mv routes/transactions_complete.js routes/transactions.js
```

### Step 3: Option B: Run Both Versions (Testing)

Keep both versions and use different endpoints:

```javascript
// server.js
app.use('/api/v1/contributors', contributorsRouter); // original
app.use('/api/v2/contributors', contributorsRouterComplete); // new
```

### Step 4: Verify Route Files

Ensure both files are present and properly structured:

```bash
# Check contributors_complete.js exists
ls -la routes/contributors_complete.js

# Check transactions_complete.js exists
ls -la routes/transactions_complete.js

# Check imports work
node -e "import('./routes/contributors_complete.js')"
```

---

## Testing & Validation

### Unit 1: Start Server

```bash
# Development mode (with auto-reload)
npm run dev

# Or production mode
npm start

# Expected output:
# ✅ Server running on http://localhost:3000
# 📝 API endpoints available at http://localhost:3000/api
```

### Unit 2: Health Check

```bash
curl http://localhost:3000/health

# Expected response:
# {
#   "status": "OK",
#   "timestamp": "2026-01-15T10:30:00Z",
#   "uptime": 12.345
# }
```

### Unit 3: Test Endpoints

#### Create Test Contributor

```bash
curl -X POST http://localhost:3000/api/contributors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Contributor",
    "mobile": "9876543210",
    "email": "test@example.com"
  }'

# Expected: 201 Created with contributor data
```

#### List Contributors

```bash
curl -X GET "http://localhost:3000/api/contributors"

# Expected: 200 OK with array of contributors
```

#### Create Transaction

```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "contributorName": "Test Contributor",
    "amount": 1000,
    "month": "2026-01",
    "paymentMethod": "cash",
    "status": "completed"
  }'

# Expected: 201 Created with transaction data
```

### Unit 4: Validate Data Consistency

```bash
# 1. Create contributor
CONTRIB_ID=$(curl -X POST http://localhost:3000/api/contributors \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","mobile":"9999999999","email":"t@t.com"}' \
  | jq -r '.data.id')

echo "Created contributor: $CONTRIB_ID"

# 2. Check initial amount (should be 0)
curl -X GET "http://localhost:3000/api/contributors/$CONTRIB_ID" | jq '.data.amount'

# 3. Create transaction
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{"contributorName":"Test","amount":1000,"month":"2026-01","status":"completed"}'

# 4. Check amount updated (should be 1000)
curl -X GET "http://localhost:3000/api/contributors/$CONTRIB_ID" | jq '.data.amount'
```

### Unit 5: Comprehensive Test Suite

Use the POSTMAN collection:

```bash
# Import collection
# File: API_TESTING_POSTMAN_COLLECTION.json

# Or run manual tests using the COMPLETE_API_TESTING_GUIDE.md
```

---

## Deployment

### Option 1: Local Development

```bash
npm run dev
```

### Option 2: Production Server (Node)

```bash
# Install PM2 for process management
npm install -g pm2

# Start with PM2
pm2 start server.js --name "sandha-backend"

# Monitor
pm2 monit

# Logs
pm2 logs
```

### Option 3: Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:

```bash
# Build image
docker build -t sandha-backend:1.0 .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  sandha-backend:1.0

# Or use docker-compose
docker-compose up -d
```

### Option 4: Cloud Deployment (Heroku)

```bash
# Login
heroku login

# Create app
heroku create sandha-backend

# Set environment variables
heroku config:set DATABASE_URL="postgresql://..."

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

### Option 5: AWS/Azure/Google Cloud

1. Set up managed PostgreSQL database
2. Deploy Node.js application to App Service/EC2/Cloud Run
3. Configure environment variables
4. Set up CI/CD pipeline

---

## Troubleshooting

### Issue 1: Database Connection Failed

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**:
1. Verify PostgreSQL is running: `psql -U postgres`
2. Check DATABASE_URL in .env
3. Verify credentials and host
4. Ensure database exists: `createdb sandhabackend`

### Issue 2: Prisma Client Not Generated

```
Error: Cannot find module '@prisma/client'
```

**Solution**:
```bash
npm install @prisma/client
npx prisma generate
```

### Issue 3: Port Already in Use

```
Error: listen EADDRINUSE :::3000
```

**Solution**:
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm start
```

### Issue 4: Migration Conflicts

```
Error: Migration already exists
```

**Solution**:
```bash
# Reset database (careful - deletes data)
npx prisma migrate reset

# Or create new migration
npx prisma migrate dev --name add_new_field
```

### Issue 5: CORS Issues

```
Error: Cross-Origin Request Blocked
```

**Solution**: 
Update server.js middleware:
```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
```

### Issue 6: Route Not Found

```
404: Route not found
```

**Solution**:
1. Verify route file is imported correctly
2. Check endpoint URL matches route path
3. Verify request method (GET/POST/PUT/DELETE)
4. Check API prefix in server.js

---

## Monitoring & Maintenance

### Health Checks

```bash
# Monitor endpoints
watch -n 5 'curl -s http://localhost:3000/health | jq'

# Check database connections
curl http://localhost:3000/api/contributors | jq '.data | length'
```

### Logs

```bash
# View logs
tail -f logs/app.log

# Or with pm2
pm2 logs sandha-backend
```

### Backup Database

```bash
# PostgreSQL backup
pg_dump sandhabackend > backup.sql

# Restore
psql sandhabackend < backup.sql
```

### Performance Monitoring

```bash
# Check response times
ab -n 100 -c 10 http://localhost:3000/api/contributors

# Monitor database queries (Prisma)
export DEBUG="prisma:*"
npm run dev
```

---

## API Documentation Links

- **Endpoints Summary**: [ENDPOINTS_SUMMARY.md](ENDPOINTS_SUMMARY.md)
- **Testing Guide**: [COMPLETE_API_TESTING_GUIDE.md](COMPLETE_API_TESTING_GUIDE.md)
- **Postman Collection**: [API_TESTING_POSTMAN_COLLECTION.json](API_TESTING_POSTMAN_COLLECTION.json)

---

## Success Criteria

✅ All 23 endpoints deployed and accessible  
✅ Database properly configured and connected  
✅ All validation working correctly  
✅ Amount auto-updates on transaction creation  
✅ Amount reverses on transaction deletion  
✅ Dashboard analytics functional  
✅ Error handling comprehensive  
✅ Response times acceptable (< 500ms)  
✅ Pagination working  
✅ Filtering working  
✅ Sorting working  

---

## Next Steps

1. **Deploy to staging environment** for full team testing
2. **Run load tests** to verify performance
3. **Set up monitoring** for production
4. **Create backup strategy**
5. **Document API usage** for frontend team
6. **Schedule training** for team members
7. **Plan scaling strategy** for future growth

---

## Support

For issues or questions:
1. Check [COMPLETE_API_TESTING_GUIDE.md](COMPLETE_API_TESTING_GUIDE.md)
2. Review endpoint examples in [ENDPOINTS_SUMMARY.md](ENDPOINTS_SUMMARY.md)
3. Check server logs for error details
4. Verify database connection

