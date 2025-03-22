/*
  Warnings:

  - The primary key for the `Booking` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Booking` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `bookingId` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `bookingId` on the `PaymentLog` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "slotId" INTEGER NOT NULL,
    "bundleBookingId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "bookedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "timezone" TEXT NOT NULL,
    "roomId" INTEGER,
    CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "Slot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_bundleBookingId_fkey" FOREIGN KEY ("bundleBookingId") REFERENCES "BundleBooking" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Booking_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("bookedAt", "bundleBookingId", "endTime", "id", "roomId", "slotId", "startTime", "status", "timezone", "userId") SELECT "bookedAt", "bundleBookingId", "endTime", "id", "roomId", "slotId", "startTime", "status", "timezone", "userId" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE UNIQUE INDEX "Booking_id_key" ON "Booking"("id");
CREATE UNIQUE INDEX "Booking_slotId_key" ON "Booking"("slotId");
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "bookingId" INTEGER,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "method" TEXT NOT NULL,
    "transactionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amount", "bookingId", "createdAt", "currency", "id", "method", "status", "transactionId", "userId") SELECT "amount", "bookingId", "createdAt", "currency", "id", "method", "status", "transactionId", "userId" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE TABLE "new_PaymentLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "bookingId" INTEGER,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'INTENT',
    "method" TEXT NOT NULL,
    "errorMessage" TEXT,
    "stripePaymentIntentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PaymentLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PaymentLog" ("amount", "bookingId", "createdAt", "currency", "errorMessage", "id", "method", "status", "stripePaymentIntentId", "userId") SELECT "amount", "bookingId", "createdAt", "currency", "errorMessage", "id", "method", "status", "stripePaymentIntentId", "userId" FROM "PaymentLog";
DROP TABLE "PaymentLog";
ALTER TABLE "new_PaymentLog" RENAME TO "PaymentLog";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
