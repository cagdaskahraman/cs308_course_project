import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserEmailDisplayNameRole1744700000000 implements MigrationInterface {
  name = 'AddUserEmailDisplayNameRole1744700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "user_role_enum" AS ENUM ('product_manager', 'customer')
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD "email" character varying NOT NULL DEFAULT 'pending@placeholder.local'
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD "display_name" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD "role" "user_role_enum" NOT NULL DEFAULT 'customer'
    `);

    await queryRunner.query(`
      ALTER TABLE "users" ALTER COLUMN "email" DROP DEFAULT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "display_name"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email"`);
    await queryRunner.query(`DROP TYPE "user_role_enum"`);
  }
}
