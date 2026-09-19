-- AlterTable
ALTER TABLE "Color" DROP CONSTRAINT IF EXISTS "Color_productId_fkey";
ALTER TABLE "Color" ADD CONSTRAINT "Color_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Variant" DROP CONSTRAINT IF EXISTS "Variant_productId_fkey";
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Feedback" DROP CONSTRAINT IF EXISTS "Feedback_productId_fkey";
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
