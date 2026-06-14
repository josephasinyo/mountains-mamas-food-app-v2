import './globals.css';
import type { Metadata } from 'next';
import { Inter, Bebas_Neue, Pacifico, Geist } from 'next/font/google';
import ConditionalLayout from '@/components/layout/ConditionalLayout';
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ['latin'] });
const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-bebas' });
const pacifico = Pacifico({ weight: '400', subsets: ['latin'], variable: '--font-pacifico' });

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Mountain Mama's Café",
  description: 'Order your favorite food',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

import { Toaster } from 'sonner';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={`${inter.className} ${bebas.variable} ${pacifico.variable}`}>
        <ConditionalLayout>
          {children}
        </ConditionalLayout>
        <Toaster position="top-center" expand={true} richColors />
      </body>
    </html>
  );
}
