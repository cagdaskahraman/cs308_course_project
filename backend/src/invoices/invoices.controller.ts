import {
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Res,
} from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { InvoiceDto } from './dto/invoice.dto';
import { InvoicesService } from './invoices.service';

type PdfResponse = {
  setHeader(name: string, value: string): void;
  end(chunk: Buffer): void;
};

@ApiTags('Invoices')
@Controller()
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get('orders/:orderId/invoice')
  @ApiOperation({
    summary: 'Fetch the invoice issued for an order',
    description:
      'Returns the persisted invoice document linked to the order (billing info, line items, total).',
  })
  @ApiParam({ name: 'orderId', format: 'uuid' })
  @ApiOkResponse({ type: InvoiceDto })
  @ApiNotFoundResponse({ description: 'No invoice exists for this order.' })
  getByOrderId(
    @Param('orderId', new ParseUUIDPipe({ version: '4' })) orderId: string,
  ): Promise<InvoiceDto> {
    return this.invoicesService.getByOrderId(orderId);
  }

  @Get('orders/:orderId/invoice.pdf')
  @ApiOperation({
    summary: 'Download the invoice PDF for an order',
    description: 'Renders the persisted invoice as a PDF attachment.',
  })
  @ApiParam({ name: 'orderId', format: 'uuid' })
  @ApiProduces('application/pdf')
  @Header('Content-Type', 'application/pdf')
  async downloadPdf(
    @Param('orderId', new ParseUUIDPipe({ version: '4' })) orderId: string,
    @Res() res: PdfResponse,
  ): Promise<void> {
    const { dto, pdf } = await this.invoicesService.renderPdfByOrderId(orderId);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${dto.invoiceNumber}.pdf"`,
    );
    res.setHeader('Content-Length', pdf.length.toString());
    res.end(pdf);
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Fetch invoice by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: InvoiceDto })
  @ApiNotFoundResponse({ description: 'Invoice does not exist.' })
  getById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<InvoiceDto> {
    return this.invoicesService.getById(id);
  }
}
