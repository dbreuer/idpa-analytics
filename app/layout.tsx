import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://hero-of-idpa.hu"),
  title: "Hero of IDPA | Szezonstatisztikák",
  description:
    "A magyarországi IDPA-versenyek eredményei, rangsorai és statisztikái az MDLSZ hivatalos versenyadatai alapján.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="hu" className="h-full">
      <body className="min-h-full bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
