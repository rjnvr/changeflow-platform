CREATE TABLE "ChangeOrderComment" (
    "id" TEXT NOT NULL,
    "changeOrderId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChangeOrderComment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ChangeOrderComment"
ADD CONSTRAINT "ChangeOrderComment_changeOrderId_fkey"
FOREIGN KEY ("changeOrderId") REFERENCES "ChangeOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
