import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'
import ConditionalLayout from '@/components/layout/ConditionalLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TrainPulse - Your Fitness Business, Simplified',
  description: 'The all-in-one platform that personal trainers love. Manage clients, schedules, workouts, and payments effortlessly. Scale your fitness business with TrainPulse.',
  icons: {
    icon: '/favicon.ico',
  },
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
    <html lang="en" suppressHydrationWarning>
      <head>
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

