import type { Metadata, Viewport } from "next";
import "./globals.css";
import { FloatingBackdrop } from "@/components/Decor";
import { InteractionFeedback } from "@/components/InteractionFeedback";

export const metadata: Metadata = {
  title: "Evelyn Cards",
  description: "Pink flashcards made with love, for reviewing anything.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffe6f0",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <InteractionFeedback />
        <FloatingBackdrop />
        <div className="shell">{children}</div>
      </body>
    </html>
  );
}
