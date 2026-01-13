import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'
import ConditionalLayout from '@/components/layout/ConditionalLayout'

import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

const siteUrl = 'https://trainpulse.fit'
const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-FEPJ19W2DB'
const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID


export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'TrainPulse - Personal Trainer Software | Fitness Business Management',
    template: '%s | TrainPulse',
  },
  description: 'The all-in-one personal trainer software for fitness professionals in the USA. Manage clients, schedules, workouts, and payments effortlessly. Built by trainers, for trainers.',
  keywords: [
    'personal trainer software',
    'fitness business management',
    'trainer client management software',
    'personal trainer scheduling app',
    'fitness trainer CRM',
    'gym management software for trainers',
    'personal training business software',
    'trainer appointment scheduling',
    'fitness business software',
    'personal trainer software USA',
  ],
  authors: [{ name: 'TrainPulse' }],
  creator: 'TrainPulse',
  publisher: 'TrainPulse',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.png', type: 'image/png' },
      { url: '/favicon.ico', type: 'image/x-icon' },
    ],
    apple: '/icons/icon-192x192.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TrainPulse',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'TrainPulse',
    title: 'TrainPulse - Personal Trainer Software | Fitness Business Management',
    description: 'The all-in-one personal trainer software for fitness professionals. Manage clients, schedules, workouts, and payments effortlessly.',
    images: [
      {
        url: `${siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'TrainPulse - Personal Trainer Software',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TrainPulse - Personal Trainer Software | Fitness Business Management',
    description: 'The all-in-one personal trainer software for fitness professionals. Manage clients, schedules, workouts, and payments effortlessly.',
    images: [`${siteUrl}/twitter-image.jpg`],
    creator: '@trainpulse', // Update with actual Twitter handle if available
  },
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
  alternates: {
    canonical: siteUrl,
  },
  category: 'Business Software',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563eb' },
    { media: '(prefers-color-scheme: dark)', color: '#1e40af' },
  ],
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get the pathname from headers during SSR
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || headersList.get('x-invoke-path') || '/'
  
  return (
    <html lang="en-US" suppressHydrationWarning>
      <head>
        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', '${gaMeasurementId}');
          `}
        </Script>

        {/* Microsoft Clarity */}
        {clarityProjectId && (
          <Script id="microsoft-clarity" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${clarityProjectId}");
            `}
          </Script>
        )}
        
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TrainPulse" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var shouldBeDark = theme === 'dark' || (!theme && systemPrefersDark);
                  if (shouldBeDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <ConditionalLayout initialPathname={pathname}>{children}</ConditionalLayout>
        </ThemeProvider>
      </body>
    </html>
  )
}

