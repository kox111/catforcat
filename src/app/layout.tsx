import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import ThemeProvider from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400"],
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
        className={`${inter.variable} ${jetbrains.variable} ${playfair.variable} antialiased`}
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
