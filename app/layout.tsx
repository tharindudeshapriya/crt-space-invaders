import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SPACE DEFENDER 1984 - Retro CRT Arcade Shooter",
  description: "Authentic 1980s CRT Television 2D Space Shooter built with Next.js, Canvas 2D, and Web Audio synth.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-[#08070c] antialiased">
      <body className="min-h-full flex flex-col justify-center items-center bg-[#08070c] text-[#00ff66] font-retro selection:bg-[#ff007f] selection:text-white">
        {children}
      </body>
    </html>
  );
}
