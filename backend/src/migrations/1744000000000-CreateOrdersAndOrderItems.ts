import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrdersAndOrderItems1744000000000 implements MigrationInterface {
  name = 'CreateOrdersAndOrderItems1744000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "order_status_enum" AS ENUM (
        'processing',
        'in-transit',
        'delivered',
        'cancelled'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "order_date" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "total_price" numeric NOT NULL,
        "status" "order_status_enum" NOT NULL,
        CONSTRAINT "PK_orders" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "order_items" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "quantity" integer NOT NULL,
        "price_at_purchase" numeric NOT NULL,
        "order_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        CONSTRAINT "PK_order_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_order_items_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_order_items_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "order_items"`);
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP TYPE "order_status_enum"`);
  }
}
