import './globals.css'

export const metadata = {
  title: 'FinPilot',
  description: 'AI-guided financial learning, portfolio planning, and FIRE tracking for US investors.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
