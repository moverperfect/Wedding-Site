-- CreateTable
CREATE TABLE "Rsvp" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isAttending" BOOLEAN NOT NULL,
    "numberOfGuests" INTEGER,
    "dietary" TEXT,
    "morningWalk" BOOLEAN,
    "clientIp" TEXT NOT NULL
);
