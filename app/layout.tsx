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
  title: 'Igreja Catedral de Amor e Fé | Atividades, Louvor e Comunhão',
  description:
    'Portal oficial da Igreja Catedral de Amor e Fé. Um lugar de fé, amor, comunhão e transformação. Confira nossas conferências, fotos, vídeos, horários e canais de atendimento.',
  openGraph: {
    title: 'Igreja Catedral de Amor e Fé | Atividades, Louvor e Comunhão',
    description:
      'Portal oficial da Igreja Catedral de Amor e Fé. Desenvolvido por Baobá Universe.',
    type: 'website',
    locale: 'pt_PT',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Igreja Catedral de Amor e Fé',
    description:
      'Portal oficial da Igreja Catedral de Amor e Fé. Um lugar de fé, amor e comunhão.',
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
