import "@fontsource-variable/dm-sans";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SignalRoom | Conversation Intelligence",
  description: "AI-powered sentiment and conversation intelligence for customer calls.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
