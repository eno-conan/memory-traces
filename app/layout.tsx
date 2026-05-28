import type { Metadata } from "next";
import { Zen_Kurenaido } from "next/font/google";
import "./globals.css";
import { AmplifyProvider } from "@/components/AmplifyProvider";
import { SpeedInsights } from "@vercel/speed-insights/next"

const zenKurenaido = Zen_Kurenaido({
  variable: "--font-zen-kurenaido",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Learn Auth App",
  description: "Next.js app with AWS Amplify authentication",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${zenKurenaido.variable} antialiased`}
      >
        <AmplifyProvider>{children}<SpeedInsights /></AmplifyProvider>
      </body>
    </html>
  );
}
