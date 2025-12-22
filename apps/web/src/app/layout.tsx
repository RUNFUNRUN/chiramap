import type { Metadata } from 'next';
import { M_PLUS_Rounded_1c } from 'next/font/google';
import './globals.css';

const mPlusRounded1c = M_PLUS_Rounded_1c({
  variable: '--font-m-plus-rounded-1c',
  subsets: ['latin'],
  weight: ['400', '700', '800'],
  preload: false, // Japanese fonts can be large, preload false is often safer or use subset if possible. Next.js optimizes Google fonts automatically though.
  // Actually Next.js recommends preloading for performance if possible.
  // But for CJK, often we need to be careful. 'preload: false' avoids blocking if it's huge.
  // However, next/font/google handles subsets. 'latin' is default.
  // Let's set preload: false to avoid errors with huge subsets if we don't specify japanese subset (which isn't always available in google fonts subsets list for nextjs).
  // Actually M PLUS Rounded 1c *does* support 'latin', but Next.js might complain if we don't handle it right.
  // Let's try default settings but weight is required.
});

export const metadata: Metadata = {
  title: 'Chiramap',
  description: 'Short-term location sharing',
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang='ja'>
      <body className={`${mPlusRounded1c.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
};

export default RootLayout;
