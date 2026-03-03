import { Inter } from 'next/font/google'
import './globals.css'
import { SessionProvider } from '@/components/SessionProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'LinkBio Brasil - Seus Links em Um Só Lugar',
  description: 'Crie sua página de links personalizada e compartilhe tudo em um único lugar.',
}

export default function RootLayout({ children }) {
  return (
    <SessionProvider>
      <html lang="pt-BR">
        <body className={inter.className}>{children}</body>
      </html>
    </SessionProvider>
  )
}
