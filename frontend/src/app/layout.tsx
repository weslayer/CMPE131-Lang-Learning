import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/ui/header";
import { NextAuthProvider } from "@/components/providers/next-auth-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LangLearn - Learn new texts fast",
  description: "An interactive platform for learning and practicing new languages through text analysis",
  applicationName: "LangLearn",
  authors: [{ name: "LangLearn Team" }],
  keywords: ["language learning", "text analysis", "education"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased">
        <NextAuthProvider>
          <Header />
          <main className="flex-1">
            {children}
          </main>
        </NextAuthProvider>
      </body>
    </html>
  );
}
