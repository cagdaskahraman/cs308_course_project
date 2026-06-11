import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReviewsTable1746000000000 implements MigrationInterface {
  name = 'CreateReviewsTable1746000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "review_status_enum" AS ENUM (
        'pending',
        'approved',
        'rejected'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "reviews" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "rating" integer NOT NULL,
        "comment" text NOT NULL,
        "status" "review_status_enum" NOT NULL DEFAULT 'pending',
        "product_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reviews" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_reviews_rating_range" CHECK ("rating" BETWEEN 1 AND 5),
        CONSTRAINT "FK_reviews_product" FOREIGN KEY ("product_id")
          REFERENCES "products"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_reviews_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_reviews_product_status"
      ON "reviews" ("product_id", "status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_reviews_product_status"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reviews"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "review_status_enum"`);
  }
}
