import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrderItemStatusAndReviewCommentFlow1763100000000
  implements MigrationInterface
{
  name = 'OrderItemStatusAndReviewCommentFlow1763100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_item_status_enum') THEN
          CREATE TYPE "order_item_status_enum" AS ENUM ('processing', 'in-transit', 'delivered');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "order_items"
      ADD COLUMN IF NOT EXISTS "status" "order_item_status_enum" NOT NULL DEFAULT 'processing'
    `);

    await queryRunner.query(`
      ALTER TABLE "reviews"
      ALTER COLUMN "comment" DROP NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "reviews"
      ADD COLUMN IF NOT EXISTS "pending_comment" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "reviews"
      DROP COLUMN IF EXISTS "pending_comment"
    `);

    await queryRunner.query(`
      UPDATE "reviews"
      SET "comment" = ''
      WHERE "comment" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "reviews"
      ALTER COLUMN "comment" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "order_items"
      DROP COLUMN IF EXISTS "status"
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "order_item_status_enum"
    `);
  }
}
