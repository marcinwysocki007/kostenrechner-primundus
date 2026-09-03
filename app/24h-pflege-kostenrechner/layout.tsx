import type { Metadata } from 'next'

// 03.09.2026: Dieser Schritt ist ein Teilschritt des Rechner-Funnels -- ohne
// H1, og:url zeigt auf die Root. Als eigenstaendiges Suchergebnis ungeeignet
// (externer Audit, Ticket TECH-02). Er bleibt technisch erreichbar, weil
// step-2 per Zurueck-Knopf hierher fuehrt; er soll nur nicht indexiert werden.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
