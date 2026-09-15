import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/common/navbar";
import { Footer } from "@/components/common/footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Intellix — Intelligent Study Material Question Generator",
  description: "Turn your study material into an intelligent, personalized, and grounded practice system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col font-sans bg-background text-foreground antialiased selection:bg-indigo-500/20 selection:text-indigo-600 relative overflow-x-hidden">
        {/* Ambient Top Glows */}
        <div className="fixed top-[-10%] left-[20%] w-[500px] h-[350px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none -z-10 animate-pulse-glow" />
        <div className="fixed top-[15%] right-[10%] w-[450px] h-[300px] rounded-full bg-purple-500/10 blur-[100px] pointer-events-none -z-10" />
        <div className="fixed bottom-[10%] left-[5%] w-[400px] h-[300px] rounded-full bg-blue-500/10 blur-[110px] pointer-events-none -z-10" />
        
        {/* Subtle Tech Grid Pattern */}
        <div className="fixed inset-0 bg-grid-pattern opacity-60 pointer-events-none -z-10" />
        
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
