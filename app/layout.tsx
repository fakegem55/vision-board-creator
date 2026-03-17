import type { Metadata } from 'next';
import { Geist, Dancing_Script } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/contexts/LanguageContext';

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const dancing = Dancing_Script({ variable: '--font-dancing', subsets: ['latin'], weight: ['700'] });

export const metadata: Metadata = {
  title: 'Vision Board Creator',
  description: '나만의 비전보드를 간단하게 만들어보세요',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${geist.variable} antialiased`}>
        <LanguageProvider>
          <div className={dancing.variable}>{children}</div>
        </LanguageProvider>
      </body>
    </html>
  );
}
