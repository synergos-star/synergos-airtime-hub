import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Synergos Airtime Hub",
  description: "Instant airtime anytime, anywhere.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}