import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { CalculatorProvider } from '@/lib/calculator-context';
import { AnalyticsProvider } from '@/components/AnalyticsProvider';
import { CookieConsent } from '@/components/CookieConsent';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://kostenrechner.primundus.de'),
  title: '24h-Pflege Kostenrechner 2026 — Eigenanteil berechnen | Primundus',
  description: '24h-Pflegekosten sofort berechnen: Eigenanteil nach Pflegegrad, Pflegegeld und Entlastungsbudget eingerechnet. Kostenlos & anonym — Ergebnis in 2 Minuten.',
  alternates: {
    canonical: 'https://kostenrechner.primundus.de',
  },
  robots: { index: false, follow: true },
  openGraph: {
    title: '24h-Pflege Kostenrechner 2026 | Primundus',
    description: '24h-Pflegekosten sofort berechnen — kostenlos & unverbindlich. Pflegegeld & Zuschüsse werden automatisch abgezogen.',
    url: 'https://kostenrechner.primundus.de',
    siteName: 'Primundus',
    locale: 'de_DE',
    type: 'website',
    images: [{ url: '/images/primundus_logo_header.webp' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: [{ url: '/images/primundus_logo_header.webp' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className={inter.className}>
        <Script
          id="schema-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "WebApplication",
                "name": "24h-Pflege Kostenrechner",
                "url": "https://kostenrechner.primundus.de",
                "description": "Kostenloser Online-Rechner für 24-Stunden-Pflege: Eigenanteil nach Pflegegrad, Pflegegeld und Entlastungsbudget berechnen.",
                "applicationCategory": "HealthApplication",
                "operatingSystem": "Web",
                "offers": { "@type": "Offer", "price": "0", "priceCurrency": "EUR" },
                "provider": {
                  "@type": "Organization",
                  "name": "Primundus",
                  "url": "https://primundus.de",
                  "telephone": "+4989200000830",
                  "logo": "https://primundus.de/images/primundus_logo_header.webp"
                }
              },
              {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Primundus", "item": "https://primundus.de/" },
                  { "@type": "ListItem", "position": 2, "name": "Kostenrechner 24h-Pflege", "item": "https://kostenrechner.primundus.de/" }
                ]
              }
            ]),
          }}
        />
        <Script
          id="gtm"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-59V6N7RC');`,
          }}
        />
        <Script
          id="ga-consent"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  function loadGoogleAnalytics() {
    if (window.gaLoaded) return;
    window.gaLoaded = true;

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-W2QEQ18EE7';
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-W2QEQ18EE7');
  }

  try {
    var consent = localStorage.getItem('cookie-consent');
    if (consent) {
      var prefs = JSON.parse(consent);
      if (prefs.analytics) {
        loadGoogleAnalytics();
      }
    }
  } catch(e) {}

  window.addEventListener('cookie-consent-changed', function(e) {
    if (e.detail && e.detail.analytics) {
      loadGoogleAnalytics();
    }
  });
})();
            `,
          }}
        />
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-59V6N7RC"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <AnalyticsProvider>
          <CalculatorProvider>
            {children}
          </CalculatorProvider>
        </AnalyticsProvider>
        <CookieConsent />
      </body>
    </html>
  );
}
