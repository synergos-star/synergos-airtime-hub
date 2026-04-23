-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "transactionReference" TEXT NOT NULL,
    "recipientNumber" TEXT NOT NULL,
    "payingNumber" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "airtimeAmount" DOUBLE PRECISION NOT NULL,
    "rateUsed" DOUBLE PRECISION NOT NULL,
    "amountToPay" DOUBLE PRECISION NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
    "deliveryStatus" TEXT NOT NULL DEFAULT 'NOT_SENT',
    "status" TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
    "mpesaReceipt" TEXT,
    "checkoutRequestId" TEXT,
    "merchantRequestId" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastRetryAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),
    "deliveryReference" TEXT,
    "failureReason" TEXT,
    "deliveryFailureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_transactionReference_key" ON "Transaction"("transactionReference");
