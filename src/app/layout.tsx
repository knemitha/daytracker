import type { Metadata } from "next";
import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import TopNav from "./_components/top-nav";
import styles from "./layout.module.css";
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
  title: "Day Tracker",
  description: "Track daily logs, tasks, calendar items, and progress stats.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${styles.shell} antialiased`}>
        <div className={styles.frame}>
          <div className={styles.topBar}>
            <div className={styles.logo}>
              <Image src="/main-logo.png" alt="Day Tracker Logo" width={200} height={200} />
            </div>
            <TopNav />
          </div>
          {children}
        </div>
      </body>
    </html>
  );
}
