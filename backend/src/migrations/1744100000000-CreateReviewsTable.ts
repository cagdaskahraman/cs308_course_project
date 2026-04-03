import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReviewsTable1744100000000 implements MigrationInterface {
  name = 'CreateReviewsTable1744100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "reviews" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "rating" smallint NOT NULL,
        "comment" text,
        "approved" boolean NOT NULL DEFAULT false,
        "product_id" uuid NOT NULL,
        CONSTRAINT "PK_reviews" PRIMARY KEY ("id"),
        CONSTRAINT "FK_reviews_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_reviews_rating_range" CHECK ("rating" >= 1 AND "rating" <= 5)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "reviews"`);
  }
}
