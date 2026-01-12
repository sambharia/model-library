import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import JsonLd from '@/components/JsonLd'

export const metadata: Metadata = {
  title: 'Portkey Models - AI Model Pricing & Comparison for 2000+ LLMs',
  description: 'Accurate pricing for 2000+ AI models across 40+ providers including OpenAI GPT-4, Claude, Gemini, Llama, Mistral. Compare LLM costs, features, and context windows.',
  keywords: ['AI model pricing', 'LLM pricing comparison', 'GPT-4 pricing', 'Claude pricing', 'Gemini pricing', 'AI API costs', 'LLM cost calculator', 'AI model comparison', 'OpenAI pricing', 'Anthropic pricing'],
  authors: [{ name: 'Portkey', url: 'https://portkey.ai' }],
  openGraph: {
    title: 'Portkey Models - AI Model Pricing & Comparison for 2000+ LLMs',
    description: 'Accurate pricing for 2000+ AI models across 40+ providers. Compare costs, features, and capabilities.',
    type: 'website',
    siteName: 'Portkey Models',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Portkey Models - AI Model Pricing & Comparison for 2000+ LLMs',
    description: 'Accurate pricing for 2000+ AI models across 40+ providers. Compare costs, features, and capabilities.',
    creator: '@portkeyai',
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL('https://portkey.ai'),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <JsonLd type="website" />
        <JsonLd type="organization" />
      </head>
      <body className="font-sans antialiased">
        {/* Background Grid Pattern - only on homepage, reduced opacity */}
        <div className="fixed inset-0 bg-grid-pattern opacity-20 pointer-events-none z-[-1]" />
        {children}
      </body>
    </html>
  )
}
