import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QR Code Generator - Create Beautiful QR Codes",
  description:
    "Generate stunning QR codes with custom colors, frames, and export as PNG or SVG. Supports URL, Text, WiFi, and vCard formats.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
