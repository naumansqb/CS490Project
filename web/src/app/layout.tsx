import { Toaster } from "sonner";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from '@/contexts/AuthContext';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JobBuddy",
  description: "Your job search companion",
  icons: {
    icon: [
      { url: "/Logo/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/Logo/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/Logo/favicon.ico", type: "image/x-icon" },
    ],
    apple: "/Logo/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
