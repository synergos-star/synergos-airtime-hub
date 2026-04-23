-- CreateTable
CREATE TABLE "DeliveryJob" (
    "id" SERIAL NOT NULL,
    "transactionId" INTEGER NOT NULL,
    "transactionReference" TEXT NOT NULL,
    "recipientNumber" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "ussdCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "agentName" TEXT,
    "providerResponse" TEXT,
    "failureReason" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeliveryJob_status_createdAt_idx" ON "DeliveryJob"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "DeliveryJob" ADD CONSTRAINT "DeliveryJob_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
