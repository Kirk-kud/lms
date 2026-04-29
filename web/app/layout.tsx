import type { Metadata } from 'next'
import { Geist, Geist_Mono, Figtree } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import { QueryProvider } from '@/providers/QueryProvider'
import { Toaster } from 'sonner'

const figtree = Figtree({ subsets: ['latin'], variable: '--font-sans' })

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Love Inc LMS',
  description: 'Discipleship learning management system',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn(
        'h-full antialiased',
        geistSans.variable,
        geistMono.variable,
        figtree.variable,
        'font-sans',
      )}
    >
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          {children}
          <Toaster position="bottom-right" />
        </QueryProvider>
      </body>
    </html>
  )
}
