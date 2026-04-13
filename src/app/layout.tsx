import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import NewsTicker from '@/components/NewsTicker'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: 'Gacha Usin Friends',
  description: 'Pull cards of your homies',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <div style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))' }}>{children}</div>
        <div className="fixed bottom-0 left-0 right-0 z-50 px-2" style={{ paddingBottom: 'max(4px, env(safe-area-inset-bottom, 4px))' }}>
          <NewsTicker />
        </div>
      </body>
    </html>
  )
}
