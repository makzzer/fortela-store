import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Toaster } from "@/components/ui/toaster";
import { CartProvider } from "@/components/store/cart-provider";

import { ProductosProvider } from "./context/ProductosContext";
import { CategoriasProvider } from "./context/CategoriasContext";
import { OrdenesProvider } from "@/app/context/OrdenesContext";
import { VentasProvider } from "@/app/context/VentasContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fortela - School Uniform Store",
  description: "Quality school uniforms for all ages",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ProductosProvider>
          <CategoriasProvider>
            <OrdenesProvider>
              <VentasProvider>
                <CartProvider>
                  <div className="flex min-h-screen flex-col">
                    <Header />
                    <main className="flex-1">{children}</main>
                    <Footer />
                  </div>
                  <Toaster />
                </CartProvider>
              </VentasProvider>
            </OrdenesProvider>
          </CategoriasProvider>
        </ProductosProvider>
      </body>
    </html>
  );
}
