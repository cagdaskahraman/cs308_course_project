import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductsTable1743034800000 implements MigrationInterface {
  name = 'CreateProductsTable1743034800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying NOT NULL,
        "description" text NOT NULL,
        "price" numeric NOT NULL,
        "stock_quantity" integer NOT NULL,
        "category" character varying NOT NULL,
        "image_url" character varying NOT NULL,
        CONSTRAINT "PK_products" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "products"`);
  }
}
