import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserIdToCarts1748000000000 implements MigrationInterface {
  name = 'AddUserIdToCarts1748000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "carts"
      ADD COLUMN "user_id" uuid NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "carts"
      ADD CONSTRAINT "FK_carts_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_carts_user_id" ON "carts" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_carts_user_id"`);
    await queryRunner.query(`ALTER TABLE "carts" DROP CONSTRAINT "FK_carts_user"`);
    await queryRunner.query(`ALTER TABLE "carts" DROP COLUMN "user_id"`);
  }
}
