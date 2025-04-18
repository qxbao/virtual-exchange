import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "@/assets/styles/globals.css";
import { PopupProvider } from "@/contexts/PopupContext";

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700", "900"],
  subsets: ["latin"],
  display: 'swap'
});

export const metadata: Metadata = {
  title: "VirtualExchange",
  description: "Generated by create next app",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable}`}>
        <div id="root">
          <PopupProvider>
            {children}
          </PopupProvider>
        </div>
      </body>
    </html>
  );
}
