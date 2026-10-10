import type { Metadata } from "next";

import { siteOrigin } from "@/lib/discipline-paths";
import "./globals.css";

const indexProduction = process.env.VERCEL_ENV !== "preview";

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: {
    default: "Lövésznapló Statisztika | Magyar sportlövészeti eredmények",
    template: "%s | Lövésznapló Statisztika",
  },
  description:
    "Magyar sportlövészeti versenyeredmények, szezonranglisták és statisztikák a hivatalos forrásadatok alapján.",
  robots: {
    index: indexProduction,
    follow: indexProduction,
    googleBot: { index: indexProduction, follow: indexProduction },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="hu" className="h-full">
      <body className="min-h-full bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
