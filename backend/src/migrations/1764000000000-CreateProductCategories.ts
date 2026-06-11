import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductCategories1764000000000 implements MigrationInterface {
  name = 'CreateProductCategories1764000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_categories" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_categories" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_product_categories_name" UNIQUE ("name")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_categories_name_lower"
      ON "product_categories" (LOWER("name"))
    `);

    await queryRunner.query(`
      INSERT INTO "product_categories" ("name")
      SELECT DISTINCT "category"
      FROM "products"
      WHERE "category" IS NOT NULL AND TRIM("category") <> ''
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_product_categories_name_lower"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_categories"`);
  }
}
