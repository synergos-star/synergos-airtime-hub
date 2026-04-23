import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Synergos Airtime Hub",
  description: "Buy airtime instantly with Synergos Airtime Hub.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}