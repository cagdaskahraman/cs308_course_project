import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductPopularity1748000000000 implements MigrationInterface {
  name = 'AddProductPopularity1748000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
        ADD COLUMN "popularity" integer NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
        DROP COLUMN IF EXISTS "popularity"
    `);
  }
}
