import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInvoicesTable1749000000000 implements MigrationInterface {
  name = 'CreateInvoicesTable1749000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "invoices" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "invoice_number" varchar NOT NULL,
        "billing_email" varchar NOT NULL,
        "billing_name" varchar NOT NULL,
        "card_last4" varchar(4) NOT NULL,
        "authorization_reference" varchar NOT NULL,
        "subtotal" decimal NOT NULL,
        "total" decimal NOT NULL,
        "order_id" uuid NOT NULL,
        "issued_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_invoices" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_invoices_invoice_number" UNIQUE ("invoice_number"),
        CONSTRAINT "UQ_invoices_order" UNIQUE ("order_id"),
        CONSTRAINT "FK_invoices_order" FOREIGN KEY ("order_id")
          REFERENCES "orders"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "invoices"`);
  }
}
