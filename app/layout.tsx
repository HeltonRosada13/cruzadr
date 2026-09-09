import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Newsreader } from 'next/font/google';
import './globals.css'; // Global styles

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-editorial',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#000000',
};

export const metadata: Metadata = {
  title: 'Portal da Igreja | Atividades, Louvor e Comunhão',
  description:
    'Portal oficial de atividades, programação e mídias da igreja. Desenvolvido por Baobá Universe.',
  openGraph: {
    title: 'Portal da Igreja | Atividades, Louvor e Comunhão',
    description:
      'Portal oficial de atividades, fotos, vídeos e canais da igreja. Desenvolvido por Baobá Universe.',
    type: 'website',
    locale: 'pt_PT',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Portal da Igreja',
    description:
      'Portal oficial de atividades, programação e mídias da igreja.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt" className={`scroll-smooth ${plusJakarta.variable} ${newsreader.variable}`}>
      <body suppressHydrationWarning className="bg-[#FDFDFC] text-[#1A1A1A] antialiased min-h-screen selection:bg-[#C5A059] selection:text-white">
        {children}
      </body>
    </html>
  );
}
