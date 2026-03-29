import type { Metadata, Viewport } from "next";
import { DM_Sans, JetBrains_Mono, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import ThemeProvider from "@/components/ThemeProvider";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600"],
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "catforcat.",
  description: "A CAT tool for translators who care about the craft",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "catforcat.",
    description: "A CAT tool for translators who care about the craft",
    images: ["https://catforcat.app/og-image.png"],
    url: "https://catforcat.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "catforcat.",
    description: "A CAT tool for translators who care about the craft",
    images: ["https://catforcat.app/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#EFC4CC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        className={`${dmSans.variable} ${jetbrains.variable} ${cormorant.variable} antialiased`}
        suppressHydrationWarning
      >
        <ServiceWorkerRegister />
        <ThemeProvider>
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
