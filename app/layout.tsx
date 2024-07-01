// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "./(navbar)/navbar";
import WidthWrapper from "./(wrapper)/widthWrapper";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Notably",
  description: "A Spotify Playlist Generator",
  keywords: ["spotify", "playlists", "generator", "music"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${poppins.className} bg-palette-background`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}