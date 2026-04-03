import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "../globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TopNavBar } from "@/components/TopNavBar";
import { SideNavBar } from "@/components/SideNavBar";
import { AuthProvider } from "@/components/AuthProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-headline" });
const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "DonBlog",
  description: "Trading, Dev, and Travel logs by Don",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark text-[15px]">
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${jetBrainsMono.variable} bg-background text-on-surface font-body selection:bg-primary selection:text-on-primary min-h-screen antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthProvider>
            <TopNavBar />
            <div className="flex min-h-screen pt-16">
              <SideNavBar />
              <div className="flex-grow lg:ml-64 relative">
                {children}
              </div>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
