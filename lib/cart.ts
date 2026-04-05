import Decimal from 'decimal.js';
import { VAT_RATE } from './config';

export type CartItem = {
  id: string;
  name: string;
  buy_price: number;
  sell_price: number;
  quantity: number;
};

const STORAGE_KEY = 'grocery-cart';

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function save(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getCart(): CartItem[] {
  return load();
}

export function addToCart(
  item: { id: string; name: string; buy_price: number; sell_price: number },
): CartItem[] {
  const cart = load();
  const existing = cart.find((c) => c.id === item.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...item, quantity: 1 });
  }
  save(cart);
  return cart;
}

export function updateQuantity(id: string, quantity: number): CartItem[] {
  const cart = load();
  const item = cart.find((c) => c.id === id);
  if (!item || quantity < 1) return cart;
  item.quantity = quantity;
  save(cart);
  return cart;
}

export function removeFromCart(id: string): CartItem[] {
  const cart = load().filter((c) => c.id !== id);
  save(cart);
  return cart;
}

export function clearCart() {
  save([]);
}

type SummaryItem = CartItem & {
  lineTotal: string;
  profit: string;
  stock_quantity: number;
};

type CartSummary = {
  items: SummaryItem[];
  subtotal: string;
  vat: string;
  grandTotal: string;
  totalProfit: string;
};

export function getCartSummary(): CartSummary {
  const items = load();
  const lines: SummaryItem[] = items.map((item) => {
    const unitPrice = new Decimal(item.sell_price);
    const qty = new Decimal(item.quantity);
    const lineTotal = unitPrice.mul(qty);
    const profit = unitPrice.minus(item.buy_price).mul(qty);
    return {
      ...item,
      lineTotal: lineTotal.toFixed(2),
      profit: profit.toFixed(2),
      stock_quantity: 0,
    };
  });

  const subtotalSum = lines.reduce((sum, l) => sum.plus(new Decimal(l.lineTotal)), new Decimal(0));
  const vat = subtotalSum.mul(new Decimal(VAT_RATE));
  const grandTotal = subtotalSum.plus(vat);
  const totalProfit = lines.reduce((sum, l) => sum.plus(new Decimal(l.profit)), new Decimal(0));

  return {
    items: lines,
    subtotal: subtotalSum.toFixed(2),
    vat: vat.toFixed(2),
    grandTotal: grandTotal.toFixed(2),
    totalProfit: totalProfit.toFixed(2),
  };
}
