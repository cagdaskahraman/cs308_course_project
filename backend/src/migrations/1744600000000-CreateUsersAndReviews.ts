import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersAndReviews1744600000000 implements MigrationInterface {
  name = 'CreateUsersAndReviews1744600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "reviews" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "product_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "rating" integer NOT NULL,
        "comment" text NOT NULL,
        "approved" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reviews" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_reviews_rating" CHECK ("rating" >= 1 AND "rating" <= 5),
        CONSTRAINT "FK_reviews_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_reviews_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_reviews_product_id" ON "reviews" ("product_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_reviews_approved" ON "reviews" ("approved")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_reviews_approved"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_reviews_product_id"`);
    await queryRunner.query(`DROP TABLE "reviews"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
