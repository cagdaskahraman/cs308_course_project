import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserAddressAndInvoiceDetails1763000000000
  implements MigrationInterface
{
  name = 'AddUserAddressAndInvoiceDetails1763000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "full_name" varchar
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "tax_id" varchar
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "home_address" text
    `);

    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD COLUMN IF NOT EXISTS "delivery_address" text
    `);

    await queryRunner.query(`
      ALTER TABLE "invoices"
      ADD COLUMN IF NOT EXISTS "tax_id" varchar
    `);
    await queryRunner.query(`
      ALTER TABLE "invoices"
      ADD COLUMN IF NOT EXISTS "billing_address" text
    `);

    await queryRunner.query(`
      UPDATE "invoices"
      SET "billing_address" = 'N/A'
      WHERE "billing_address" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "invoices"
      ALTER COLUMN "billing_address" SET NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "invoices"
      DROP COLUMN IF EXISTS "billing_address"
    `);
    await queryRunner.query(`
      ALTER TABLE "invoices"
      DROP COLUMN IF EXISTS "tax_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "orders"
      DROP COLUMN IF EXISTS "delivery_address"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "home_address"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "tax_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "full_name"
    `);
  }
}
