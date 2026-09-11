-- CreateEnum
CREATE TYPE "Category" AS ENUM ('JUPE', 'ENSEMBLE', 'ROBE', 'HIJAB', 'PANTALON', 'VESTE');

-- Normalize existing Product.category values before converting to enum
UPDATE "Product"
SET "category" = CASE
  WHEN UPPER(TRIM("category")) = 'JUPE' THEN 'JUPE'
  WHEN UPPER(TRIM("category")) = 'ENSEMBLE' THEN 'ENSEMBLE'
  WHEN UPPER(TRIM("category")) = 'ROBE' THEN 'ROBE'
  WHEN UPPER(TRIM("category")) = 'HIJAB' THEN 'HIJAB'
  WHEN UPPER(TRIM("category")) = 'PANTALON' THEN 'PANTALON'
  WHEN UPPER(TRIM("category")) = 'VESTE' THEN 'VESTE'
  ELSE 'JUPE'
END;

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "category" TYPE "Category" USING ("category"::"Category");

-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN "storyLink" TEXT;

-- CreateTable
CREATE TABLE "SearchLog" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchLog_pkey" PRIMARY KEY ("id")
);
