import { MigrationInterface, QueryRunner } from 'typeorm';

export class WidenCardLast4ForEncryption1767000000000
  implements MigrationInterface
{
  name = 'WidenCardLast4ForEncryption1767000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "invoices"
      ALTER COLUMN "card_last4" TYPE varchar
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "invoices"
      ALTER COLUMN "card_last4" TYPE varchar(4)
    `);
  }
}
