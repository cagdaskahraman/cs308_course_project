import { ApiProperty } from '@nestjs/swagger';

export class InvoiceLineItemDto {
  @ApiProperty()
  productId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  unitPrice!: number;

  @ApiProperty()
  lineTotal!: number;
}

export class InvoiceDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  invoiceNumber!: string;

  @ApiProperty({ format: 'uuid' })
  orderId!: string;

  @ApiProperty()
  billingEmail!: string;

  @ApiProperty()
  billingName!: string;

  @ApiProperty()
  cardLast4!: string;

  @ApiProperty()
  authorizationReference!: string;

  @ApiProperty({ type: () => [InvoiceLineItemDto] })
  items!: InvoiceLineItemDto[];

  @ApiProperty()
  subtotal!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  issuedAt!: string;
}
