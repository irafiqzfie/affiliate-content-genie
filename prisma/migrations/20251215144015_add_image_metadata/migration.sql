-- CreateTable
CREATE TABLE "ImageMetadata" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageType" TEXT NOT NULL,
    "prompt" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImageMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImageMetadata_userId_idx" ON "ImageMetadata"("userId");

-- CreateIndex
CREATE INDEX "ImageMetadata_userId_imageType_idx" ON "ImageMetadata"("userId", "imageType");

-- AddForeignKey
ALTER TABLE "ImageMetadata" ADD CONSTRAINT "ImageMetadata_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
