ALTER TABLE "ProjectDocument"
ADD COLUMN     "storageKey" TEXT,
ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "contentType" TEXT,
ADD COLUMN     "fileSize" INTEGER;
