import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandProductsMetadata1747000000000 implements MigrationInterface {
  name = 'ExpandProductsMetadata1747000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
        ADD COLUMN "model" character varying NULL,
        ADD COLUMN "serial_number" character varying NULL,
        ADD COLUMN "warranty_status" character varying NULL,
        ADD COLUMN "distributor_info" text NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "products"
        ADD CONSTRAINT "UQ_products_serial_number" UNIQUE ("serial_number")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
        DROP CONSTRAINT IF EXISTS "UQ_products_serial_number"
    `);

    await queryRunner.query(`
      ALTER TABLE "products"
        DROP COLUMN IF EXISTS "distributor_info",
        DROP COLUMN IF EXISTS "warranty_status",
        DROP COLUMN IF EXISTS "serial_number",
        DROP COLUMN IF EXISTS "model"
    `);
  }
}
