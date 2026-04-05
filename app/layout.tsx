import type { Metadata, Viewport } from 'next';
import './globals.css';
import ThemeProvider from '@/components/ThemeProvider';
import ThemeToggle from '@/components/ThemeToggle';
import CartButton from '@/components/CartButton';

export const metadata: Metadata = {
  title: 'Grocery Price Scanner',
  description: 'Scan barcodes and check prices instantly',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Price Scanner',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="bg-white text-black dark:bg-gray-900 dark:text-white min-h-screen">
        <ThemeProvider>
          <div className="max-w-md mx-auto min-h-screen flex flex-col relative">
            {children}
            <CartButton />
            <ThemeToggle />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
