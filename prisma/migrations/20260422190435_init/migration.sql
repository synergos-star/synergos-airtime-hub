-- CreateTable
CREATE TABLE "Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "transactionReference" TEXT NOT NULL,
    "recipientNumber" TEXT NOT NULL,
    "payingNumber" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "airtimeAmount" REAL NOT NULL,
    "rateUsed" REAL NOT NULL,
    "amountToPay" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "mpesaReceipt" TEXT,
    "checkoutRequestId" TEXT,
    "merchantRequestId" TEXT,
    "failureReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_transactionReference_key" ON "Transaction"("transactionReference");
