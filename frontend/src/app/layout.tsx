import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header/header";
import { NextAuthProvider } from "@/components/providers/next-auth-provider";

import styles from "./layout.module.css"


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
      <body className={styles["body"]}>
        <NextAuthProvider>
          <Header />
          <main>
            {children}
          </main>
        </NextAuthProvider>
      </body>
    </html>
  );
}
