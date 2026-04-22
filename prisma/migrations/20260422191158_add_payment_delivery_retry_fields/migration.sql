-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "transactionReference" TEXT NOT NULL,
    "recipientNumber" TEXT NOT NULL,
    "payingNumber" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "airtimeAmount" REAL NOT NULL,
    "rateUsed" REAL NOT NULL,
    "amountToPay" REAL NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
    "deliveryStatus" TEXT NOT NULL DEFAULT 'NOT_SENT',
    "status" TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
    "mpesaReceipt" TEXT,
    "checkoutRequestId" TEXT,
    "merchantRequestId" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastRetryAt" DATETIME,
    "nextRetryAt" DATETIME,
    "deliveryReference" TEXT,
    "failureReason" TEXT,
    "deliveryFailureReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Transaction" ("airtimeAmount", "amountToPay", "checkoutRequestId", "createdAt", "failureReason", "id", "merchantRequestId", "mpesaReceipt", "operator", "payingNumber", "rateUsed", "recipientNumber", "status", "transactionReference", "updatedAt") SELECT "airtimeAmount", "amountToPay", "checkoutRequestId", "createdAt", "failureReason", "id", "merchantRequestId", "mpesaReceipt", "operator", "payingNumber", "rateUsed", "recipientNumber", "status", "transactionReference", "updatedAt" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE UNIQUE INDEX "Transaction_transactionReference_key" ON "Transaction"("transactionReference");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
