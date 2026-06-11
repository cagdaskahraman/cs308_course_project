import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSalesManagerPricingWishlist1765000000000
  implements MigrationInterface
{
  name = 'AddSalesManagerPricingWishlist1765000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "user_role_enum"
      ADD VALUE IF NOT EXISTS 'sales_manager'
    `);

    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "list_price" numeric,
      ADD COLUMN IF NOT EXISTS "discount_rate" numeric NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      UPDATE "products"
      SET "list_price" = "price"
      WHERE "list_price" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "products"
      ALTER COLUMN "list_price" SET NOT NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "wishlist_items" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_wishlist_items" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_wishlist_user_product" UNIQUE ("user_id", "product_id"),
        CONSTRAINT "FK_wishlist_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_wishlist_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "wishlist_items"`);
    await queryRunner.query(`
      ALTER TABLE "products"
      DROP COLUMN IF EXISTS "discount_rate",
      DROP COLUMN IF EXISTS "list_price"
    `);
  }
}
