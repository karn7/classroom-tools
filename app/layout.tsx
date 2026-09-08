import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Classroom Tools",
  description: "เครื่องมือสำหรับกิจกรรมการเรียนการสอน",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
