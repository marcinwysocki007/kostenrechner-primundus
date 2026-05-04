'use client';

import { useEffect, useState } from 'react';
import { CircleCheck as CheckCircle, Mail, Phone, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/calculator/Header';
import { Footer } from '@/components/calculator/Footer';
import Link from 'next/link';

export default function BetreuungBestaetigung({ params }: { params: { leadId: string } }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F8F7F5]">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#5C8A5C] rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#3D3D3D] mb-4">
            Vielen Dank für Ihr Vertrauen!
          </h1>
          <p className="text-xl text-[#5A5A5A]">
            Ihre Betreuungsanfrage wurde erfolgreich übermittelt
          </p>
        </div>

        <Card className="mb-8 border-2 border-[#5C8A5C]/20">
          <CardHeader className="bg-[#E8F5E3]">
            <CardTitle className="text-[#5C8A5C]">Was passiert jetzt?</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-[#5C8A5C] text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Bestätigung per E-Mail</h3>
                <p className="text-[#5A5A5A]">
                  Sie erhalten in wenigen Minuten eine Bestätigungs-E-Mail mit allen Details zu Ihrer Anfrage.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-[#5C8A5C] text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Persönliche Beratung</h3>
                <p className="text-[#5A5A5A]">
                  Unser Team meldet sich innerhalb von 24 Stunden bei Ihnen, um alle Details zu besprechen.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-[#5C8A5C] text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Betreuungskraft finden</h3>
                <p className="text-[#5A5A5A]">
                  Wir suchen die passende Betreuungskraft für Ihre individuellen Bedürfnisse aus.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-[#5C8A5C] text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold mb-1">Betreuung starten</h3>
                <p className="text-[#5A5A5A]">
                  Die Betreuung kann je nach Verfügbarkeit innerhalb von 4-7 Tagen beginnen.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#5C8A5C] mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Haben Sie Fragen?</h3>
                  <p className="text-[#5A5A5A] mb-2">Rufen Sie uns gerne an:</p>
                  <a
                    href="tel:+4971140098188"
                    className="text-[#5C8A5C] font-semibold hover:underline"
                  >
                    +49 89 200 000 830
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#5C8A5C] mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">E-Mail-Kontakt</h3>
                  <p className="text-[#5A5A5A] mb-2">Schreiben Sie uns:</p>
                  <a
                    href="mailto:info@primundus.de"
                    className="text-[#5C8A5C] font-semibold hover:underline"
                  >
                    info@primundus.de
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Link href="/">
            <Button variant="outline" size="lg">
              Zurück zur Startseite
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
