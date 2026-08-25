import type { Metadata } from "next";
import { Poppins, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { CookieBanner } from "@/components/CookieBanner";
import { WelcomePopup } from "@/components/WelcomePopup";
import { StoreProvider } from "@/components/store/StoreProvider";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "RASTRO | Zapatillas",
  description:
    "Calzado en tendencia al alcance de todos. Tienda online con envíos a todo el país. WhatsApp 341 351-5773 · @rastro.ros",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={cn(
        "h-full",
        "antialiased",
        poppins.variable,
        "font-sans",
        geist.variable
      )}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-full flex-col bg-cream text-ink">
        <StoreProvider>
          {children}
          <WelcomePopup />
          <CookieBanner />
        </StoreProvider>
      </body>
    </html>
  );
}
