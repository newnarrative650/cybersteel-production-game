import type { Metadata } from "next";
import "./globals.css";
import "./game.css";
export const metadata: Metadata = {
  metadataBase: new URL("https://cybersteel-production-game.al-muzalewsky.chatgpt.site"),
  title: "CYBERSTEEL — Собери технологию",
  description: "Три типа труб, один вызов: восстанови производственную цепочку. Интерактивная игра CYBERSTEEL.",
  robots: { index: false, follow: false },
  icons: { icon: { url: "/tubes.webp", type: "image/webp" } },
  openGraph: { type: "website", title: "CYBERSTEEL — Собери технологию", description: "От заготовки до готовой трубы. Расставь этапы производства в правильном порядке.", locale: "ru_RU", images: [{ url: "/og.png", width: 1536, height: 1024, alt: "CYBERSTEEL — Собери технологию" }] },
  twitter: { card: "summary_large_image", title: "CYBERSTEEL — Собери технологию", description: "Три типа труб. 11 этапов. Собери свою технологию.", images: ["/og.png"] }
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
