import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "ConfigForge", template: "%s | ConfigForge" },
  description: "JSON-driven mini app generator — build full-stack apps from config files",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#0d0a1e] text-white antialiased min-h-screen">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: "#1a1040", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" },
          }}
        />
      </body>
    </html>
  );
}
