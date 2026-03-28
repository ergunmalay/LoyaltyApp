import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: 'PocketStamp',
  description: 'Digital stamp cards for your coffee shop. No paper. No app. Just love.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="min-h-screen bg-orange-50 text-stone-900 antialiased font-sans">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
