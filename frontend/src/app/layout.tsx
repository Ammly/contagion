import type { Metadata } from 'next'
import { Outfit, JetBrains_Mono, Manrope } from 'next/font/google'
import { SSEProvider } from '@/components/layout/sse-provider'
import { ThemeProvider } from '@/components/layout/theme-provider'
import TopNav from '@/components/layout/top-nav'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  weight: ['400', '500'],
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'CONTAGION · Safaricom AI Ops · Decode 2026',
  description:
    'Live demonstration of AI agent mesh security — Morris II worm propagation and Judge Agent defence.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${outfit.variable} ${jetbrainsMono.variable} ${manrope.variable}`}
    >
      <head>
        {/* Default to light; respect stored preference */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('contagion-theme')||'light';document.documentElement.classList.toggle('dark',t==='dark');document.documentElement.classList.toggle('light',t==='light');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <SSEProvider />
          <TopNav />
          {/* Offset content below fixed 72px nav */}
          <div style={{ paddingTop: 72 }}>
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
