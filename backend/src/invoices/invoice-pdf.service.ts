import { Injectable } from '@nestjs/common';

import { InvoiceDto } from './dto/invoice.dto';

/**
 * Minimal PDF generator implemented without external dependencies so the demo
 * setup stays friction-free. Produces a single-page PDF 1.4 document with the
 * core WinAnsi (Helvetica) font. Only ASCII content is guaranteed to render.
 */
@Injectable()
export class InvoicePdfService {
  generate(invoice: InvoiceDto): Buffer {
    const lines: string[] = [];
    lines.push('ELECTROSTORE - INVOICE');
    lines.push(`Invoice No: ${invoice.invoiceNumber}`);
    lines.push(`Issued At : ${invoice.issuedAt}`);
    lines.push(`Order Id  : ${invoice.orderId}`);
    lines.push(`Authz Ref : ${invoice.authorizationReference}`);
    lines.push('');
    lines.push(`Billed To : ${invoice.billingName}`);
    lines.push(`Email     : ${invoice.billingEmail}`);
    lines.push(`Card      : **** **** **** ${invoice.cardLast4}`);
    lines.push('');
    lines.push('Items');
    lines.push('------');
    for (const it of invoice.items) {
      lines.push(
        `${it.quantity} x ${it.name} @ ${it.unitPrice.toFixed(2)} = ${it.lineTotal.toFixed(2)}`,
      );
    }
    lines.push('');
    lines.push(`Subtotal: ${invoice.subtotal.toFixed(2)}`);
    lines.push(`Total   : ${invoice.total.toFixed(2)}`);

    return InvoicePdfService.buildPdf(lines);
  }

  private static buildPdf(textLines: string[]): Buffer {
    const pageWidth = 595; // A4 in points
    const pageHeight = 842;
    const marginLeft = 56;
    const startY = pageHeight - 72;
    const lineHeight = 16;

    const escape = (s: string): string =>
      s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

    let content = 'BT\n/F1 12 Tf\n';
    content += `${marginLeft} ${startY} Td\n`;
    content += `(${escape(textLines[0] ?? '')}) Tj\n`;
    for (let i = 1; i < textLines.length; i++) {
      content += `0 -${lineHeight} Td\n`;
      content += `(${escape(textLines[i])}) Tj\n`;
    }
    content += 'ET';

    const streamBuffer = Buffer.from(content, 'latin1');
    const objects: string[] = [
      '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
      '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj',
      `3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 5 0 R >> >> /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents 4 0 R >>\nendobj`,
      `4 0 obj\n<< /Length ${streamBuffer.length} >>\nstream\n${content}\nendstream\nendobj`,
      '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj',
    ];

    const header = '%PDF-1.4\n%\u00E2\u00E3\u00CF\u00D3\n';
    const chunks: Buffer[] = [];
    chunks.push(Buffer.from(header, 'latin1'));

    const offsets: number[] = [];
    let running = chunks[0].length;
    for (const obj of objects) {
      offsets.push(running);
      const piece = Buffer.from(obj + '\n', 'latin1');
      chunks.push(piece);
      running += piece.length;
    }

    const xrefOffset = running;
    let xref = `xref\n0 ${objects.length + 1}\n`;
    xref += '0000000000 65535 f \n';
    for (const off of offsets) {
      xref += `${String(off).padStart(10, '0')} 00000 n \n`;
    }
    chunks.push(Buffer.from(xref, 'latin1'));

    const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    chunks.push(Buffer.from(trailer, 'latin1'));

    return Buffer.concat(chunks);
  }
}
