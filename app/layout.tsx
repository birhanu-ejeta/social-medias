import type { Metadata } from 'next';
import { GeistSans, GeistMono } from 'geist/font';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: 'SocialFlow - Connect with the world',
  description: 'A modern social media platform for everyone',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en" 
      suppressHydrationWarning 
      className={cn("bg-background", GeistSans.variable, GeistMono.variable)}
    >
      <body className={cn("font-sans antialiased", GeistSans.className)}>
        <Providers>
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
