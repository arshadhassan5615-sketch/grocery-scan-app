import Decimal from 'decimal.js';
import { SHOP_NAME, VAT_RATE } from './config';

export type ReceiptItem = {
  name: string;
  quantity: number;
  sell_price: number;
  lineTotal: string | number;
};

export function generateReceiptText(
  transactionId: string,
  date: string,
  items: ReceiptItem[],
  subtotal: string | number,
  vat: string | number,
  grandTotal: string | number
): string {
  const divider = '='.repeat(32);
  const thinDivider = '-'.repeat(32);

  const lines: string[] = [];
  lines.push(divider);
  lines.push(SHOP_NAME);
  lines.push(divider);
  lines.push(`TXN: ${transactionId}`);
  lines.push(`Date: ${date}`);
  lines.push(thinDivider);
  lines.push('ITEM');

  for (const item of items) {
    const nameLine = `${item.quantity}x ${item.name}`;
    const priceLine = `   ${parseFloat(item.lineTotal.toString()).toFixed(2)}`;
    lines.push(nameLine);
    lines.push(priceLine);
  }

  lines.push(thinDivider);
  lines.push(`Subtotal:    AED ${new Decimal(subtotal).toFixed(2)}`);
  lines.push(`VAT (${(VAT_RATE * 100).toFixed(0)}%):      AED ${new Decimal(vat).toFixed(2)}`);
  lines.push(thinDivider);
  lines.push(`TOTAL:       AED ${new Decimal(grandTotal).toFixed(2)}`);
  lines.push(divider);
  lines.push('Thank you for shopping with us!');
  lines.push(divider);

  return lines.join('\n');
}
