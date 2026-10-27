import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";

const nunito = Nunito({ subsets: ["latin", "latin-ext"], weight: ["400", "600", "700", "800", "900"] });

export const metadata: Metadata = {
  title: "Agenda na Mão | A agenda do salão no celular de quem atende",
  description: "Agenda do dia e da semana, clientes, resumo financeiro e avisos no celular do profissional, ligados ao mesmo sistema da recepção.",
};

export const viewport: Viewport = {
  themeColor: "#7a2e5c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={nunito.className}>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
