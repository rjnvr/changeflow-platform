ALTER TABLE "User"
RENAME COLUMN "monthlyProjectBriefLimit" TO "dailyProjectBriefLimit";

ALTER TABLE "User"
ALTER COLUMN "dailyProjectBriefLimit" SET DEFAULT 3;

UPDATE "User"
SET "dailyProjectBriefLimit" = 3;
