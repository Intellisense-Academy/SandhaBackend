-- Create transactions table
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "contributorId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'cash',
    "status" TEXT NOT NULL DEFAULT 'completed',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- Create indexes for better query performance
CREATE INDEX "transactions_contributorId_idx" ON "transactions"("contributorId");
CREATE INDEX "transactions_createdAt_idx" ON "transactions"("createdAt");

-- Add foreign key constraint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "contributors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update contributor.amount default
ALTER TABLE "contributors" ALTER COLUMN "amount" SET DEFAULT 0;
