import type { Metadata } from 'next';
import { Fredoka, Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { CartProvider } from '@/lib/cart-context';
import { FlyToCartProvider } from '@/lib/fly-to-cart-context';
import { Navbar } from '@/components/Navbar';

const fredoka = Fredoka({ subsets: ['latin'], variable: '--font-fredoka', weight: ['500', '600', '700'] });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Amaranta — Tienda y Clínica para mascotas',
  description: 'Compra productos para tu mascota y agenda citas en Amaranta.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${fredoka.variable} ${inter.variable} font-sans`}>
        <AuthProvider>
          <CartProvider>
            <FlyToCartProvider>
              <Navbar />
              <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
            </FlyToCartProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
