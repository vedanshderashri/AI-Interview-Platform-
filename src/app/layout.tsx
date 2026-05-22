import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Kriyeta AI | Interview Platform',
  description: 'AI-powered interview simulator with real-time analytics.',
};

import { Sidebar } from '@/components/ui/Sidebar';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="h-full flex bg-white text-slate-900 font-inter" suppressHydrationWarning>
        <Sidebar />
        <main className="flex-1 h-screen overflow-y-auto relative scrollbar-none">
          {children}
        </main>
      </body>
    </html>
  );
}
