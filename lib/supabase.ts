import { createBrowserClient as createBrowserSSRClient, createServerClient as createServerSSRClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createClientDirect } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client for client components
export const createBrowserClient = () =>
  createBrowserSSRClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name) {
        const value = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`));
        return value ? decodeURIComponent(value.split('=')[1]) : undefined;
      },
      set(name, value, options) {
        let cookie = `${name}=${encodeURIComponent(value)}; path=/`;
        if (options?.maxAge) cookie += `; max-age=${options.maxAge}`;
        if (options?.expires) cookie += `; expires=${options.expires.toUTCString()}`;
        if (options?.domain) cookie += `; domain=${options.domain}`;
        cookie += `; samesite=${options?.sameSite ?? 'lax'}`;
        if (options?.secure) cookie += '; secure';
        document.cookie = cookie;
      },
      remove(name, options) {
        let cookie = `${name}=; path=/; max-age=0`;
        if (options?.domain) cookie += `; domain=${options.domain}`;
        document.cookie = cookie;
      },
    },
  });

// Server client for server components
export const createServerClient = (getCookie: (name: string) => string | undefined) =>
  createServerSSRClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: getCookie,
      set() {},
      remove() {},
    },
  });

// Legacy supabase export for backward compatibility (browser only, no session)
export const supabase = createClientDirect(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

export type Item = {
  id: string;
  barcode: string | null;
  name: string;
  buy_price: string;
  sell_price: string;
  created_at: string;
  stock_quantity: number;
  low_stock_threshold: number;
  expiry_date?: string | null;
};

export type Transaction = {
  id: string;
  transaction_id: string;
  created_at: string;
  items: Array<{
    id: string;
    name: string;
    buy_price: number;
    sell_price: number;
    quantity: number;
    lineTotal: string;
  }>;
  subtotal: number;
  vat_amount: number;
  grand_total: number;
  total_profit: number;
};

export type ItemInsert = {
  barcode?: string | null;
  name: string;
  buy_price: string | number;
  sell_price: string | number;
};

export type ItemUpdate = {
  barcode?: string | null;
  name?: string;
  buy_price?: string | number;
  sell_price?: string | number;
};
