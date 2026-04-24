import { MigrationInterface, QueryRunner } from 'typeorm';

export class StrengthenCheckoutReviewAndRoles1750000000000
  implements MigrationInterface
{
  name = 'StrengthenCheckoutReviewAndRoles1750000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "user_role_enum"
      ADD VALUE IF NOT EXISTS 'admin'
    `);

    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD COLUMN "user_id" uuid
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_orders_user_id" ON "orders" ("user_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD CONSTRAINT "FK_orders_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      DELETE FROM "reviews" r
      USING "reviews" r2
      WHERE r."id" > r2."id"
        AND r."user_id" = r2."user_id"
        AND r."product_id" = r2."product_id"
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_reviews_user_product"
      ON "reviews" ("user_id", "product_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_reviews_user_product"
    `);
    await queryRunner.query(`
      ALTER TABLE "orders"
      DROP CONSTRAINT IF EXISTS "FK_orders_user"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_orders_user_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "orders"
      DROP COLUMN IF EXISTS "user_id"
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
          IF EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'user_role_enum' AND e.enumlabel = 'admin') THEN
            CREATE TYPE "user_role_enum_old" AS ENUM ('customer', 'product_manager');
            ALTER TABLE "users"
              ALTER COLUMN "role" TYPE "user_role_enum_old"
              USING ("role"::text::"user_role_enum_old");
            DROP TYPE "user_role_enum";
            ALTER TYPE "user_role_enum_old" RENAME TO "user_role_enum";
          END IF;
        END IF;
      END$$;
    `);
  }
}
