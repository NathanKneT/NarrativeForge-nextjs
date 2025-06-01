import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

// 🔧 FIX: Séparer viewport de metadata (Next.js 14+ requirement)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a2e' },
  ],
};

// 🔧 FIX: Définir metadataBase pour résoudre les warnings OG/Twitter
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  ),
  title: {
    default: 'Asylum Interactive Story',
    template: '%s | Asylum Interactive Story',
  },
  description:
    'An immersive interactive storytelling platform with visual node-based editor. Create and experience branching narratives with professional-grade tools.',
  keywords: [
    'interactive story',
    'visual novel',
    'storytelling',
    'interactive fiction',
    'node editor',
    'narrative design',
    'asylum',
    'visual storytelling',
  ],
  authors: [{ name: 'Nathan RIHET' }],
  creator: 'Nathan RIHET',
  publisher: 'Asylum Interactive',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Asylum Interactive Story Platform',
    description:
      'Create and experience immersive interactive stories with our professional visual editor.',
    siteName: 'Asylum Interactive Story',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Asylum Interactive Story Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Asylum Interactive Story Platform',
    description: 'Create and experience immersive interactive stories',
    creator: '@AsylumStory',
    images: ['/twitter-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#e94560' },
    ],
  },
  manifest: '/site.webmanifest',
  alternates: {
    canonical: '/',
  },
  category: 'entertainment',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {children}
        {/* 🚀 Performance monitoring script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'performance' in window) {
                window.addEventListener('load', function() {
                  setTimeout(function() {
                    const navigation = performance.getEntriesByType('navigation')[0];
                    if (navigation) {
                      const loadTime = navigation.loadEventEnd - navigation.fetchStart;
                      console.log('Page load time:', Math.round(loadTime), 'ms');
                    }
                  }, 0);
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
