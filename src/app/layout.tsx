import type {Metadata} from 'next';
import { Poppins, Geist_Mono } from 'next/font/google'; // Changed Geist to Poppins
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'], // Added standard Poppins weights
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'പെരുന്നാൾ പൈസ - Spin The Wheel!',
  description: 'Spin the wheel and try your luck to win exciting prizes this Perunnal!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
