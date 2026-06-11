import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReturnRequests1766000000000 implements MigrationInterface {
  name = 'CreateReturnRequests1766000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "return_status_enum" AS ENUM ('pending', 'approved', 'rejected', 'refunded')
    `);
    await queryRunner.query(`
      CREATE TABLE "return_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "order_id" uuid NOT NULL,
        "order_item_id" uuid NOT NULL,
        "quantity" integer NOT NULL,
        "refund_amount" numeric NOT NULL,
        "status" "return_status_enum" NOT NULL DEFAULT 'pending',
        "reason" text,
        "requested_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_return_requests" PRIMARY KEY ("id"),
        CONSTRAINT "FK_return_requests_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_return_requests_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_return_requests_order_item" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_return_requests_status" ON "return_requests" ("status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_return_requests_status"`);
    await queryRunner.query(`DROP TABLE "return_requests"`);
    await queryRunner.query(`DROP TYPE "return_status_enum"`);
  }
}
