import type { Metadata } from "next";
import AuthBar from "@/components/AuthBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Unidan ランキング",
  description: "TaikoUniverse 段位道場(Unidan)のランキングとマイページ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <AuthBar />
        <main>{children}</main>
      </body>
    </html>
  );
}
