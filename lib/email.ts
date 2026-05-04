import { Lead } from './lead-management';
import { Kalkulation, detectGenderFromName } from './calculation';
import { getEmailLayout } from './email-template';

function capitalize(name: string): string {
  if (!name) return name;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export function getBestaetigunsEmailTemplate(email: string): EmailTemplate {
  return {
    subject: 'Ihre Anfrage ist eingegangen – Primundus 24h-Pflege',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5; color: #333; }
          .wrapper { max-width: 600px; margin: 0 auto; background: white; }
          .header { background-color: #5C4A32; padding: 30px 40px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 22px; font-weight: 600; }
          .content { padding: 40px; }
          .content p { line-height: 1.7; margin: 0 0 16px; }
          .checkmark { color: #4CAF50; font-size: 48px; text-align: center; margin: 0 0 20px; }
          .footer { background: #f5f5f5; padding: 24px 40px; text-align: center; font-size: 12px; color: #888; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="header">
            <h1>Primundus 24h-Pflege</h1>
          </div>
          <div class="content">
            <div class="checkmark">&#10003;</div>
            <p><strong>Vielen Dank fuer Ihre Anfrage!</strong></p>
            <p>Wir haben Ihre Anfrage erhalten und werden uns schnellstmoeglich bei Ihnen melden.</p>
            <p>Ihr persoenlicher Berater kontaktiert Sie in der Regel innerhalb von 24 Stunden, um alles Weitere mit Ihnen zu besprechen.</p>
            <p>Bei dringenden Fragen erreichen Sie uns unter: <strong>089 200 000 830</strong></p>
            <p>Herzliche Gruesse<br><strong>Ihr Primundus-Team</strong></p>
          </div>
          <div class="footer">
            <p>Primundus Deutschland | 24h-Pflege und Betreuung<br>
            Telefon: 089 200 000 830 | E-Mail: info@primundus.de</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Vielen Dank fuer Ihre Anfrage!

Wir haben Ihre Anfrage erhalten und werden uns schnellstmoeglich bei Ihnen melden.

Ihr persoenlicher Berater kontaktiert Sie in der Regel innerhalb von 24 Stunden.

Bei dringenden Fragen: 089 200 000 830

Herzliche Gruesse
Ihr Primundus-Team

Primundus Deutschland | 24h-Pflege und Betreuung
Telefon: 089 200 000 830 | E-Mail: info@primundus.de
    `,
  };
}

export function getKalkulationEmailTemplate(
  email: string,
  kalkulation: Kalkulation,
  leadId: string,
  siteUrl?: string,
  anrede?: string,
  vorname?: string,
  nachname?: string
): EmailTemplate {
  const baseUrl = siteUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://primundus.de';
  const eigenanteil = kalkulation.eigenanteil.toFixed(2).replace('.', ',');
  const kalkulationUrl = `${baseUrl}/kalkulation/${leadId}`;

  // Generate greeting – use explicit anrede if given, otherwise auto-detect from first name
  const effectiveAnrede = anrede || (vorname ? detectGenderFromName(vorname) : null);
  let greeting = 'Guten Tag';
  if (effectiveAnrede && (vorname || nachname)) {
    if (effectiveAnrede === 'Familie') {
      greeting = `Guten Tag Familie ${capitalize(nachname || vorname || '')}`.trim();
    } else if (nachname) {
      greeting = `Guten Tag ${effectiveAnrede} ${capitalize(nachname)}`.trim();
    } else if (vorname) {
      greeting = `Guten Tag ${capitalize(vorname)}`;
    } else {
      greeting = `Guten Tag ${effectiveAnrede}`;
    }
  } else if (vorname) {
    greeting = `Guten Tag ${capitalize(vorname)}`;
  }

  const content = `
    <p style="font-size: 14px; line-height: 1.4; color: #8B7355; margin: 0 0 25px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Ihre persönliche Kalkulation</p>

    <p style="font-size: 18px; line-height: 1.6; color: #333;">${greeting},</p>

    <p style="font-size: 16px; line-height: 1.7; color: #555;">vielen Dank für Ihr Interesse an unserer 24h-Pflege. Wir haben Ihre <strong>individuelle Kostenberechnung</strong> erstellt – transparent, detailliert und sofort abrufbar.</p>

    <div style="margin: 35px 0; text-align: center;">
      <a href="${kalkulationUrl}" class="cta-button" style="display: inline-block; background: linear-gradient(135deg, #B5A184 0%, #9A8A73 100%); color: #ffffff; text-decoration: none; padding: 18px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(181, 161, 132, 0.35); transition: all 0.3s ease;">
        📄 Kalkulation jetzt ansehen & als PDF speichern
      </a>
    </div>

    <div style="background: #F5F0E8; border-radius: 8px; padding: 25px; margin: 25px 0;">
      <h3 style="color: #3D2B1F; font-size: 17px; font-weight: 600; margin: 0 0 15px 0; text-align: center;">
        Das ist in Ihrer Kalkulation enthalten:
      </h3>
      <ul style="margin: 0; padding: 0; list-style: none; text-align: left;">
        <li style="margin-bottom: 10px; padding-left: 0; font-size: 15px; color: #555; text-align: left;">
          <strong>• Individuelle Kostenberechnung</strong> basierend auf Ihren Angaben
        </li>
        <li style="margin-bottom: 10px; padding-left: 0; font-size: 15px; color: #555; text-align: left;">
          <strong>• Alle Zuschüsse & Förderungen</strong> (Pflegegeld, Entlastungsbudget, etc.)
        </li>
        <li style="margin-bottom: 0; padding-left: 0; font-size: 15px; color: #555; text-align: left;">
          <strong>• Steuervorteile</strong> und Finanzierungsoptionen
        </li>
      </ul>
    </div>

    <hr class="divider" style="border: 0; border-top: 2px solid #E5E5E5; margin: 40px 0;">

    <div style="background: #F5F0E8; border-radius: 8px; padding: 30px 25px; margin: 25px 0; border-left: 4px solid #B5A184;">
      <h3 style="color: #3D2B1F; font-size: 19px; font-weight: 600; margin: 0 0 10px 0;">So geht es jetzt weiter</h3>
      <p style="font-size: 14px; line-height: 1.6; color: #666; margin: 0 0 25px 0;">In 3 einfachen Schritten zur 24-Stunden-Betreuung</p>

      <div style="background: white; border-radius: 6px; padding: 20px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 15px 0; border-bottom: 1px solid #f0f0f0; vertical-align: top;">
              <div style="display: inline-block; width: 36px; height: 36px; background: #5C4033; color: white; border-radius: 50%; text-align: center; line-height: 36px; font-weight: bold; font-size: 16px; margin-right: 12px; vertical-align: top;">1</div>
              <div style="display: inline-block; vertical-align: top; width: calc(100% - 55px);">
                <strong style="color: #3D2B1F; font-size: 15px; display: block; margin-bottom: 6px;">Sie beauftragen uns</strong>
                <span style="color: #555; font-size: 13px; line-height: 1.5; display: block; margin-bottom: 8px;">Entscheiden Sie sich für Primundus und beauftragen Sie uns mit der Vermittlung einer passenden Pflegekraft für Ihre individuelle Situation.</span>
                <span style="display: inline-block; background: #E8F5E9; color: #2E7D32; padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: 600;">✓ Täglich kündbar</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 15px 0; border-bottom: 1px solid #f0f0f0; vertical-align: top;">
              <div style="display: inline-block; width: 36px; height: 36px; background: #5C4033; color: white; border-radius: 50%; text-align: center; line-height: 36px; font-weight: bold; font-size: 16px; margin-right: 12px; vertical-align: top;">2</div>
              <div style="display: inline-block; vertical-align: top; width: calc(100% - 55px);">
                <strong style="color: #3D2B1F; font-size: 15px; display: block; margin-bottom: 6px;">Sie erhalten Personalvorschläge</strong>
                <span style="color: #555; font-size: 13px; line-height: 1.5; display: block; margin-bottom: 8px;">Wir senden Ihnen passende Pflegekräfte-Profile zu. Sie entscheiden, welche Betreuungskraft am besten zu Ihnen und Ihren Angehörigen passt.</span>
                <span style="display: inline-block; background: #E8F5E9; color: #2E7D32; padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: 600;">👤 Erfahrene Pflegekräfte</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 15px 0; vertical-align: top;">
              <div style="display: inline-block; width: 36px; height: 36px; background: #5C4033; color: white; border-radius: 50%; text-align: center; line-height: 36px; font-weight: bold; font-size: 16px; margin-right: 12px; vertical-align: top;">3</div>
              <div style="display: inline-block; vertical-align: top; width: calc(100% - 55px);">
                <strong style="color: #3D2B1F; font-size: 15px; display: block; margin-bottom: 6px;">Die Betreuung beginnt</strong>
                <span style="color: #555; font-size: 13px; line-height: 1.5; display: block; margin-bottom: 8px;">Die Pflegekraft reist an und beginnt mit der Betreuung. Kosten entstehen erst, wenn die Pflegekraft tatsächlich bei Ihnen arbeitet.</span>
                <span style="display: inline-block; background: #E8F5E9; color: #2E7D32; padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: 600;">✓ Tagesgenaue Abrechnung</span>
              </div>
            </td>
          </tr>
        </table>
      </div>

      <div style="margin-top: 25px; text-align: center;">
        <a href="${baseUrl}/lead?email=${encodeURIComponent(email)}" class="cta-button" style="display: inline-block; background: linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%); color: #ffffff; text-decoration: none; padding: 18px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(46, 125, 50, 0.35);">
          🎯 Jetzt Angebot anfordern
        </a>
      </div>
    </div>

    <div class="info-box" style="background-color: #E8F5E9; border-left: 4px solid #4CAF50; padding: 20px; margin: 25px 0; border-radius: 6px;">
      <strong style="color: #2E7D32; font-size: 15px;">💚 Gut zu wissen:</strong>
      <span style="color: #555; font-size: 15px;"> Die Kalkulation ist unverbindlich und Sie gehen keinerlei Verpflichtungen ein.</span>
    </div>

    <div style="background: #F5F0E8; border-radius: 8px; padding: 20px; margin: 30px 0 20px 0; border-left: 4px solid #B5A184;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">Bei Fragen stehen wir Ihnen gerne zur Verfügung:</p>
      <p style="margin: 0; font-size: 20px; font-weight: 600; color: #6B5B45;">
        📞 089 200 000 830
      </p>
    </div>

    <p style="font-size: 16px; line-height: 1.7; color: #555; margin-top: 30px;">Herzliche Grüße<br><strong style="color: #3D2B1F;">Ihr Primundus-Team</strong></p>
  `;

  const preheader = `Ihr monatlicher Eigenanteil: ${eigenanteil} € - Jetzt Kalkulation ansehen`;

  const html = getEmailLayout({ content, preheader, siteUrl: baseUrl }).replace('{{EMAIL}}', email);

  return {
    subject: 'Ihre persönliche 24h-Pflege-Kalkulation',
    html,
    text: `
Ihre persönliche 24h-Pflege-Kalkulation

${greeting},

vielen Dank für Ihr Interesse an unserer 24h-Pflege. Hier ist Ihre persönliche Kostenübersicht mit:

• Individueller Kostenberechnung basierend auf Ihren Angaben
• Allen Zuschüssen und Förderungen (Pflegegeld, Entlastungsbudget, etc.)
• Steuervorteilen und Finanzierungsoptionen

---
IHR MONATLICHER EIGENANTEIL: ${eigenanteil} €
(bereits abzüglich aller Zuschüsse)
---

Diese Kalkulation können Sie in Ruhe mit Ihrer Familie besprechen, als PDF speichern oder ausdrucken.

Kalkulation jetzt ansehen & als PDF speichern:
${kalkulationUrl}

---

WIE GEHT ES WEITER?

Wenn Sie möchten, können Sie jetzt ein unverbindliches Angebot mit passenden Pflegekräfte-Profilen anfordern:

1. Wir erstellen für Sie kostenlos passende Profile
2. Ihr persönlicher Berater meldet sich innerhalb von 24 Stunden
3. Sie entscheiden in Ruhe, ob und wann Sie starten möchten

Jetzt Angebot anfordern:
${baseUrl}/lead

Gut zu wissen: Die Kalkulation ist unverbindlich und Sie gehen keinerlei Verpflichtungen ein.

Bei Fragen stehen wir Ihnen gerne telefonisch zur Verfügung: 089 200 000 830

Herzliche Grüße
Ihr Primundus-Team

---
Primundus Deutschland | 24h-Pflege und Betreuung
Telefon: 089 200 000 830 | E-Mail: info@primundus.de
www.primundus.de
    `,
  };
}

export function getEingangsbestaetigungEmailTemplate(
  lead: Lead,
  kalkulation: Kalkulation
): EmailTemplate {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://primundus.de';

  const kalkulationData = kalkulation as any;
  const aufschluesselung = kalkulationData?.aufschluesselung || [];

  const getLabel = (kategorie: string) => {
    const item = aufschluesselung.find((a: any) => a.kategorie === kategorie);
    return item?.label || 'Nicht angegeben';
  };

  const betreuungFuer = getLabel('betreuung_fuer');
  const pflegegrad = aufschluesselung.find((a: any) => a.kategorie === 'pflegegrad')?.antwort || 'Nicht angegeben';
  const weiterePersonen = getLabel('weitere_personen');
  const mobilitaet = getLabel('mobilitaet');
  const nachteinsaetze = getLabel('nachteinsaetze');
  const deutschkenntnisse = getLabel('deutschkenntnisse');
  const erfahrung = getLabel('erfahrung');
  const fuehrerschein = getLabel('fuehrerschein');
  const geschlecht = getLabel('geschlecht');
  const careStartTiming = lead.care_start_timing || 'Nicht angegeben';

  const detectedAnrede = lead.anrede_text || detectGenderFromName(lead.vorname || '');
  const eingangsNachname = lead.nachname || '';
  let eingangsGreeting: string;
  if (detectedAnrede === 'Frau' && eingangsNachname) {
    eingangsGreeting = `Guten Tag Frau ${eingangsNachname}`;
  } else if (detectedAnrede === 'Herr' && eingangsNachname) {
    eingangsGreeting = `Guten Tag Herr ${eingangsNachname}`;
  } else if (detectedAnrede === 'Familie' && eingangsNachname) {
    eingangsGreeting = `Guten Tag Familie ${eingangsNachname}`;
  } else if (lead.vorname) {
    eingangsGreeting = `Guten Tag ${lead.vorname}`;
  } else {
    eingangsGreeting = 'Guten Tag';
  }

  const content = `
    <p style="font-size: 18px; line-height: 1.6; color: #333; margin-bottom: 25px;">${eingangsGreeting},</p>

    <p style="font-size: 16px; line-height: 1.7; color: #555; margin-bottom: 25px;">vielen Dank für Ihre Anfrage zur 24h-Pflege. Wir haben Ihre Angaben erhalten und <strong>werden Ihnen schnellstmöglich ein persönliches Angebot</strong> zusenden.</p>

    <div style="background: #F5F0E8; border-radius: 8px; padding: 25px; margin: 30px 0; border-left: 4px solid #B5A184;">
      <h3 style="color: #3D2B1F; font-size: 17px; font-weight: 600; margin: 0 0 20px 0;">Ihre Angaben im Überblick</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #E5E5E5; color: #666; font-size: 14px; width: 45%;">Name:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #E5E5E5; color: #333; font-size: 14px; font-weight: 600;">${[lead.anrede_text, lead.vorname, lead.nachname].filter(Boolean).join(' ') || 'Nicht angegeben'}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #E5E5E5; color: #666; font-size: 14px;">E-Mail:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #E5E5E5; color: #333; font-size: 14px; font-weight: 600;">${lead.email}</td>
        </tr>
        ${lead.telefon ? `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #E5E5E5; color: #666; font-size: 14px;">Telefon:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #E5E5E5; color: #333; font-size: 14px; font-weight: 600;">${lead.telefon}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #E5E5E5; color: #666; font-size: 14px;">Betreuung für:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #E5E5E5; color: #333; font-size: 14px; font-weight: 600;">${betreuungFuer}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #E5E5E5; color: #666; font-size: 14px;">Weitere Personen:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #E5E5E5; color: #333; font-size: 14px; font-weight: 600;">${weiterePersonen}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #E5E5E5; color: #666; font-size: 14px;">Pflegegrad:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #E5E5E5; color: #333; font-size: 14px; font-weight: 600;">${pflegegrad}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #E5E5E5; color: #666; font-size: 14px;">Mobilität:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #E5E5E5; color: #333; font-size: 14px; font-weight: 600;">${mobilitaet}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #E5E5E5; color: #666; font-size: 14px;">Nachteinsätze:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #E5E5E5; color: #333; font-size: 14px; font-weight: 600;">${nachteinsaetze}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #E5E5E5; color: #666; font-size: 14px;">Deutschkenntnisse:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #E5E5E5; color: #333; font-size: 14px; font-weight: 600;">${deutschkenntnisse}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #E5E5E5; color: #666; font-size: 14px;">Erfahrung:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #E5E5E5; color: #333; font-size: 14px; font-weight: 600;">${erfahrung}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #E5E5E5; color: #666; font-size: 14px;">Führerschein:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #E5E5E5; color: #333; font-size: 14px; font-weight: 600;">${fuehrerschein}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #E5E5E5; color: #666; font-size: 14px;">Geschlecht:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #E5E5E5; color: #333; font-size: 14px; font-weight: 600;">${geschlecht}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #666; font-size: 14px;">Wann soll die Betreuung starten?:</td>
          <td style="padding: 10px 0; color: #333; font-size: 14px; font-weight: 600;">${careStartTiming}</td>
        </tr>
      </table>
    </div>

    <div class="info-box" style="background-color: #E8F5E9; border-left: 4px solid #4CAF50; padding: 20px; margin: 25px 0; border-radius: 6px;">
      <strong style="color: #2E7D32; font-size: 15px;">Wie geht es weiter?</strong>
      <p style="color: #555; font-size: 15px; margin: 10px 0 0 0; line-height: 1.6;">Unser Team prüft Ihre Anfrage und meldet sich in Kürze mit einem passenden Angebot bei Ihnen.</p>
    </div>

    <div style="background: #F5F0E8; border-radius: 8px; padding: 20px; margin: 35px 0 20px 0; border-left: 4px solid #B5A184;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">Bei Fragen stehen wir Ihnen gerne zur Verfügung:</p>
      <p style="margin: 0; font-size: 20px; font-weight: 600; color: #6B5B45;">
        +49 89 200 000 830
      </p>
    </div>

    <p style="font-size: 16px; line-height: 1.7; color: #555; margin-top: 30px;">Herzliche Grüße<br><strong style="color: #3D2B1F;">Ihr Primundus-Team</strong></p>
  `;

  const preheader = 'Ihre Anfrage ist eingegangen - Wir melden uns in Kürze';

  const html = getEmailLayout({ content, preheader, siteUrl: baseUrl }).replace('{{EMAIL}}', lead.email);

  return {
    subject: 'Ihre Anfrage ist eingegangen – Primundus 24h-Pflege',
    html,
    text: `
Ihre Anfrage ist eingegangen – Primundus 24h-Pflege

${eingangsGreeting},

vielen Dank für Ihre Anfrage zur 24h-Pflege. Wir haben Ihre Angaben erhalten und werden Ihnen schnellstmöglich ein persönliches Angebot zusenden.

IHRE ANGABEN IM ÜBERBLICK

Name: ${lead.vorname || 'Nicht angegeben'}
E-Mail: ${lead.email}
${lead.telefon ? `Telefon: ${lead.telefon}` : ''}
Betreuung für: ${betreuungFuer}
Weitere Personen: ${weiterePersonen}
Pflegegrad: ${pflegegrad}
Mobilität: ${mobilitaet}
Nachteinsätze: ${nachteinsaetze}
Deutschkenntnisse: ${deutschkenntnisse}
Erfahrung: ${erfahrung}
Führerschein: ${fuehrerschein}
Geschlecht: ${geschlecht}
Wann soll die Betreuung starten?: ${careStartTiming}

WIE GEHT ES WEITER?

Unser Team prüft Ihre Anfrage und meldet sich in Kürze mit einem passenden Angebot bei Ihnen.

Bei Fragen stehen wir Ihnen gerne telefonisch zur Verfügung: +49 89 200 000 830

Herzliche Grüße
Ihr Primundus-Team

---
Primundus Deutschland | 24h-Pflege und Betreuung
Telefon: +49 89 200 000 830 | E-Mail: info@primundus.de
www.primundus.de
    `,
  };
}

export function getAngebotsEmailTemplate(
  lead: Lead,
  kalkulation: Kalkulation,
  options?: { isResend?: boolean }
): EmailTemplate {
  const isResend = options?.isResend === true;
  const kalkulationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/kalkulation/${lead.id}`;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://primundus.de';

  const anrede = lead.anrede_text || detectGenderFromName(lead.vorname || '') || '';
  const nachname = lead.nachname || '';
  const vorname = lead.vorname || '';

  let anredeText: string;
  if (anrede === 'Frau' && nachname) {
    anredeText = `Sehr geehrte Frau ${capitalize(nachname)}`;
  } else if (anrede === 'Herr' && nachname) {
    anredeText = `Sehr geehrter Herr ${capitalize(nachname)}`;
  } else if (anrede === 'Familie' && nachname) {
    anredeText = `Sehr geehrte Familie ${capitalize(nachname)}`;
  } else if (vorname && nachname) {
    anredeText = `Guten Tag ${capitalize(vorname)} ${capitalize(nachname)}`;
  } else if (vorname) {
    anredeText = `Guten Tag ${capitalize(vorname)}`;
  } else if (nachname) {
    anredeText = `Guten Tag ${capitalize(nachname)}`;
  } else {
    anredeText = 'Guten Tag';
  }

  const introText = isResend
    ? 'wie gewünscht senden wir Ihnen Ihr persönliches Angebot noch einmal zu.'
    : 'vielen Dank für Ihre Anfrage.';

  const resendNotice = isResend ? `
    <div style="background-color: #f9f6f2; border: 1px solid #e8ddd0; border-radius: 6px; padding: 12px 16px; margin-top: 32px;">
      <p style="margin: 0; font-size: 13px; color: #9a8a73; line-height: 1.5;">
        ℹ️ Diese E-Mail wurde auf Ihre Bitte hin erneut zugesendet und enthält Ihr aktuelles persönliches Angebot.
      </p>
    </div>
  ` : '';

  const content = `
    <p style="font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 25px;">${anredeText},</p>

    <p style="font-size: 16px; line-height: 1.7; color: #555; margin-bottom: 20px;">${introText}</p>

    <p style="font-size: 16px; line-height: 1.7; color: #555; margin-bottom: 20px;">Auf Grundlage Ihrer Angaben haben wir ein <strong>persönliches Angebot</strong> für die Betreuung im eigenen Zuhause vorbereitet.</p>

    <p style="font-size: 16px; line-height: 1.7; color: #555; margin-bottom: 20px;">In dem Angebot finden Sie eine transparente Übersicht der monatlichen Kosten, mögliche Zuschüsse der Pflegekasse sowie alle wichtigen Informationen zum weiteren Ablauf.</p>

    <div style="margin: 35px 0; text-align: center;">
      <a href="${kalkulationUrl}" style="display: inline-block; background: linear-gradient(135deg, #B5A184 0%, #9A8A73 100%); color: #ffffff; text-decoration: none; padding: 18px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(181, 161, 132, 0.35);">
        Angebot jetzt einsehen
      </a>
    </div>

    <p style="font-size: 16px; line-height: 1.7; color: #555; margin-bottom: 20px;">Wenn alles für Sie passt, benötigen wir lediglich eine kurze Bestätigung von Ihnen. Dann starten wir direkt mit der Auswahl passender Betreuungskräfte und bereiten parallel alle organisatorischen und vertraglichen Modalitäten vor.</p>

    <div style="background-color: #E8F5E9; border-left: 4px solid #4CAF50; padding: 20px; margin: 25px 0; border-radius: 6px;">
      <p style="color: #555; font-size: 15px; margin: 0; line-height: 1.6;">Für Sie bleibt selbstverständlich alles <strong>unverbindlich</strong>, bis Sie sich für eine passende Betreuungskraft entscheiden und diese anreist.</p>
    </div>

    <!-- Ilka CTA – wie auf der Website -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin: 35px 0; border: 1px solid #e8ddd0; border-radius: 12px; overflow: hidden;">
      <!-- Label -->
      <tr>
        <td style="padding: 16px 24px 0; background: #ffffff;">
          <p style="margin: 0; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; color: #9a8a73; text-transform: uppercase; text-align: left;">KOSTENLOSE BERATUNG</p>
        </td>
      </tr>
      <!-- Ilka + Buttons + Badge -->
      <tr>
        <td style="padding: 16px 24px 20px; background: #ffffff;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <!-- Photo + Info -->
              <td style="vertical-align: middle; width: 200px;">
                <table cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td style="padding-right: 14px; vertical-align: middle;">
                      <img src="${baseUrl}/images/ilka-wysocki_pm-mallorca.webp" alt="Ilka Wysocki" width="56" height="56"
                        style="display: block; width: 56px; height: 56px; border-radius: 8px; object-fit: cover;" />
                    </td>
                    <td style="vertical-align: middle;">
                      <p style="margin: 0 0 2px 0; font-size: 15px; font-weight: 700; color: #3D2B1F; text-align: left;">Ilka Wysocki</p>
                      <p style="margin: 0 0 2px 0; font-size: 13px; color: #555; text-align: left;">Pflegeberaterin</p>
                      <p style="margin: 0; font-size: 12px; color: #9a8a73; text-align: left;">Mo – So, 8 – 20 Uhr</p>
                    </td>
                  </tr>
                </table>
              </td>
              <!-- Phone + WA buttons -->
              <td style="vertical-align: middle; text-align: center; width: 110px;">
                <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 auto;">
                  <tr>
                    <td style="padding-right: 10px;">
                      <a href="tel:+4989200000830"
                        style="display: inline-block; background-color: #f0ebe4; border-radius: 50%; width: 44px; height: 44px; text-align: center; line-height: 44px; text-decoration: none; font-size: 18px;">📞</a>
                    </td>
                    <td>
                      <a href="https://wa.me/4989200000830"
                        style="display: inline-block; background-color: #25D366; border-radius: 50%; width: 44px; height: 44px; text-align: center; line-height: 44px; text-decoration: none; font-size: 18px;">💬</a>
                    </td>
                  </tr>
                </table>
              </td>
              <!-- Testsieger badge -->
              <td style="vertical-align: middle; text-align: right;">
                <div style="display: inline-block; border: 1px solid #e8ddd0; border-radius: 8px; padding: 10px 14px; text-align: left;">
                  <p style="margin: 0 0 2px 0; font-size: 13px; font-weight: 700; color: #3D2B1F; white-space: nowrap;">Testsieger <span style="color: #B5A184;">DIE WELT</span></p>
                  <p style="margin: 0; font-size: 11px; color: #888; line-height: 1.4;">Ausgezeichnet für Preis,<br>Qualität &amp; Kundenservice</p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- Stats row -->
      <tr>
        <td style="background: #f9f6f2; border-top: 1px solid #e8ddd0;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="padding: 14px 0; text-align: center; width: 33%; border-right: 1px solid #e8ddd0;">
                <p style="margin: 0; font-size: 13px; color: #555; line-height: 1.4; text-align: center;">Über 20 Jahre<br>Erfahrung</p>
              </td>
              <td style="padding: 14px 0; text-align: center; width: 33%; border-right: 1px solid #e8ddd0;">
                <p style="margin: 0; font-size: 13px; color: #555; line-height: 1.4; text-align: center;">60.000+<br>betreute Einsätze</p>
              </td>
              <td style="padding: 14px 0; text-align: center; width: 33%;">
                <p style="margin: 0; font-size: 13px; color: #555; line-height: 1.4; text-align: center;">Persönlicher<br>Ansprechpartner, 7&nbsp;Tage/Woche</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- Media logos -->
      <tr>
        <td style="background: #ffffff; border-top: 1px solid #e8ddd0; padding: 12px 24px; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #bbb; letter-spacing: 0.04em; text-align: center;">DIE WELT &nbsp;·&nbsp; Frankfurter Allgemeine &nbsp;·&nbsp; ARD &nbsp;·&nbsp; NDR &nbsp;·&nbsp; SAT.1 &nbsp;·&nbsp; Bild der Frau</p>
        </td>
      </tr>
    </table>

    <p style="font-size: 16px; line-height: 1.7; color: #555; margin-top: 10px;">Mit freundlichen Grüßen<br><strong style="color: #3D2B1F;">Ilka Wysocki</strong></p>

    ${resendNotice}
  `;

  const preheader = isResend
    ? 'Ihr persönliches Angebot zur 24-Stunden-Betreuung – erneut zugesendet'
    : 'Ihr persönliches Angebot zur 24-Stunden-Betreuung ist bereit';

  const html = getEmailLayout({ content, preheader, siteUrl: baseUrl }).replace('{{EMAIL}}', lead.email);

  const subject = isResend
    ? 'Ihr Angebot zur 24-Stunden-Betreuung (erneut zugesendet)'
    : 'Ihr persönliches Angebot zur 24-Stunden-Betreuung';

  return {
    subject,
    html,
    text: `
${subject}

${anredeText},

${isResend ? 'wie gewünscht senden wir Ihnen Ihr persönliches Angebot noch einmal zu.' : 'vielen Dank für Ihre Anfrage.'}

Auf Grundlage Ihrer Angaben haben wir ein persönliches Angebot für die Betreuung im eigenen Zuhause vorbereitet.

In dem Angebot finden Sie eine transparente Übersicht der monatlichen Kosten, mögliche Zuschüsse der Pflegekasse sowie alle wichtigen Informationen zum weiteren Ablauf.

Sie können Ihr persönliches Angebot hier einsehen:
${kalkulationUrl}

Wenn alles für Sie passt, benötigen wir lediglich eine kurze Bestätigung von Ihnen. Dann starten wir direkt mit der Auswahl passender Betreuungskräfte und bereiten parallel alle organisatorischen und vertraglichen Modalitäten vor.

Für Sie bleibt selbstverständlich alles unverbindlich, bis Sie sich für eine passende Betreuungskraft entscheiden und diese anreist.

Mit freundlichen Grüßen
Ilka Wysocki

---
Primundus Deutschland | 24h-Pflege und Betreuung
Telefon: +49 89 200 000 830 | E-Mail: info@primundus.de
www.primundus.de
    `,
  };
}

export function getVertragsbestaetigungTemplate(
  lead: Lead,
  vertragId: string
): EmailTemplate {
  const vertragDetectedAnrede = lead.anrede_text || detectGenderFromName(lead.vorname || '');
  const vertragNachname = lead.nachname || '';
  let vertragGreeting: string;
  if (vertragDetectedAnrede === 'Frau' && vertragNachname) {
    vertragGreeting = `Guten Tag Frau ${vertragNachname}`;
  } else if (vertragDetectedAnrede === 'Herr' && vertragNachname) {
    vertragGreeting = `Guten Tag Herr ${vertragNachname}`;
  } else if (vertragDetectedAnrede === 'Familie' && vertragNachname) {
    vertragGreeting = `Guten Tag Familie ${vertragNachname}`;
  } else if (lead.vorname) {
    vertragGreeting = `Guten Tag ${lead.vorname}`;
  } else {
    vertragGreeting = 'Guten Tag';
  }

  return {
    subject: 'Ihre Beauftragung ist eingegangen',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #5C4A32; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; }
          .success { background: #E8F5E9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0; }
          .highlight { background: #FFF8E7; border-left: 4px solid #5C4A32; padding: 15px; margin: 20px 0; }
          .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Beauftragung eingegangen</h1>
          </div>
          <div class="content">
            <p>${vertragGreeting},</p>
            <div class="success">
              <strong>Ihre Beauftragung ist bei uns eingegangen.</strong><br>
              Anbei Ihr Vertrag als PDF.
            </div>
            <p><strong>Nächste Schritte:</strong></p>
            <ol>
              <li>Wir suchen die passende Betreuungskraft.</li>
              <li>Ihr Berater meldet sich innerhalb von 24h mit Profilen.</li>
              <li>Gemeinsam legen wir den Start fest.</li>
            </ol>
            <div class="highlight">
              <strong>Zur Erinnerung:</strong> Tägliche Kündigungsfrist, taggenaue Abrechnung. Sie zahlen erst ab dem tatsächlichen Einsatz.
            </div>
            <p><strong>Fragen?</strong> Rufen Sie uns gerne an: 089 200 000 830</p>
            <p>Herzliche Grüße<br>Ihr Primundus-Team</p>
          </div>
          <div class="footer">
            <p>Primundus Deutschland | 24h-Pflege und Betreuung<br>
            Telefon: 089 200 000 830 | E-Mail: info@primundus.de</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Ihre Beauftragung ist eingegangen ✓

${vertragGreeting},

Ihre Beauftragung ist bei uns eingegangen.
Anbei Ihr Vertrag als PDF.

Nächste Schritte:
1. Wir suchen die passende Betreuungskraft.
2. Ihr Berater meldet sich innerhalb von 24h mit Profilen.
3. Gemeinsam legen wir den Start fest.

Zur Erinnerung: Tägliche Kündigungsfrist, taggenaue
Abrechnung. Sie zahlen erst ab dem tatsächlichen Einsatz.

Fragen? 089 200 000 830

Herzliche Grüße
Ihr Primundus-Team

Primundus Deutschland | 24h-Pflege und Betreuung
Telefon: 089 200 000 830 | E-Mail: info@primundus.de
    `,
  };
}

export function getTeamNotificationTemplate(
  lead: Lead,
  status: string,
  additionalData?: any
): EmailTemplate {
  const statusEmojis = {
    info_requested: '🔵',
    angebot_requested: '🟡',
    vertrag_abgeschlossen: '🟢',
  };

  const statusText = {
    info_requested: 'Neuer Lead – Kalkulation angefordert',
    angebot_requested: 'Neuer Lead – Angebot angefordert',
    vertrag_abgeschlossen: 'Neuer Vertrag abgeschlossen!',
  };

  const emoji = statusEmojis[status as keyof typeof statusEmojis] || '📋';
  const text = statusText[status as keyof typeof statusText] || 'Lead-Update';

  const kalkulation = lead.kalkulation as any;
  const eigenanteil = kalkulation?.eigenanteil
    ? kalkulation.eigenanteil.toFixed(2).replace('.', ',')
    : 'N/A';

  const aufschluesselung = kalkulation?.aufschluesselung || [];

  const getLabel = (kategorie: string) => {
    const item = aufschluesselung.find((a: any) => a.kategorie === kategorie);
    return item?.label || 'Nicht angegeben';
  };

  const getAntwort = (kategorie: string) => {
    const item = aufschluesselung.find((a: any) => a.kategorie === kategorie);
    return item?.antwort || 'Nicht angegeben';
  };

  const betreuungFuer = getLabel('betreuung_fuer');
  const pflegegrad = getAntwort('pflegegrad');
  const weiterePersonen = getLabel('weitere_personen');
  const mobilitaet = getLabel('mobilitaet');
  const nachteinsaetze = getLabel('nachteinsaetze');
  const deutschkenntnisse = getLabel('deutschkenntnisse');
  const erfahrung = getLabel('erfahrung');
  const fuehrerschein = getLabel('fuehrerschein');
  const geschlecht = getLabel('geschlecht');
  const careStartTiming = lead.care_start_timing || 'Nicht angegeben';

  return {
    subject: `${emoji} ${text}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Courier New', monospace; font-size: 14px; color: #333; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
          table { width: 100%; border-collapse: collapse; background: white; margin-bottom: 20px; }
          th { background: #5C4A32; color: white; padding: 10px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          .section-title { background: #B5A184; color: white; padding: 10px; margin-top: 20px; }
          .highlight { background: #FFF8E7; padding: 15px; margin: 10px 0; border-left: 4px solid #5C4A32; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>${emoji} ${text}</h2>

          <div class="section-title">Kontaktdaten</div>
          <table>
            <tr><th>Feld</th><th>Wert</th></tr>
            <tr><td><strong>Name</strong></td><td>${[lead.anrede_text, lead.vorname, lead.nachname].filter(Boolean).join(' ') || 'N/A'}</td></tr>
            <tr><td><strong>E-Mail</strong></td><td>${lead.email}</td></tr>
            <tr><td><strong>Telefon</strong></td><td>${lead.telefon || 'N/A'}</td></tr>
            <tr><td><strong>Status</strong></td><td>${lead.status}</td></tr>
          </table>

          <div class="section-title">Pflegesituation & Anforderungen</div>
          <table>
            <tr><th>Feld</th><th>Wert</th></tr>
            <tr><td><strong>Betreuung für</strong></td><td>${betreuungFuer}</td></tr>
            <tr><td><strong>Pflegegrad</strong></td><td>${pflegegrad}</td></tr>
            <tr><td><strong>Weitere Personen im Haushalt</strong></td><td>${weiterePersonen}</td></tr>
            <tr><td><strong>Mobilität</strong></td><td>${mobilitaet}</td></tr>
            <tr><td><strong>Nachteinsätze erforderlich</strong></td><td>${nachteinsaetze}</td></tr>
            <tr><td><strong>Wann soll die Betreuung starten?</strong></td><td>${careStartTiming}</td></tr>
          </table>

          <div class="section-title">Anforderungen an die Pflegekraft</div>
          <table>
            <tr><th>Feld</th><th>Wert</th></tr>
            <tr><td><strong>Deutschkenntnisse</strong></td><td>${deutschkenntnisse}</td></tr>
            <tr><td><strong>Erfahrung</strong></td><td>${erfahrung}</td></tr>
            <tr><td><strong>Führerschein</strong></td><td>${fuehrerschein}</td></tr>
            <tr><td><strong>Geschlecht der Pflegekraft</strong></td><td>${geschlecht}</td></tr>
          </table>

          <div class="section-title">Kosten</div>
          <table>
            <tr><th>Feld</th><th>Wert</th></tr>
            <tr><td><strong>Eigenanteil (monatlich)</strong></td><td>${eigenanteil} €</td></tr>
            <tr><td><strong>Bruttopreis</strong></td><td>${kalkulation?.bruttopreis ? kalkulation.bruttopreis.toFixed(2).replace('.', ',') : 'N/A'} €</td></tr>
            <tr><td><strong>Zuschüsse gesamt</strong></td><td>${kalkulation?.zuschüsse?.gesamt ? kalkulation.zuschüsse.gesamt.toFixed(2).replace('.', ',') : 'N/A'} €</td></tr>
          </table>

          ${additionalData ? `
            <div class="section-title">Zusätzliche Daten</div>
            <table>
              ${Object.entries(additionalData).map(([key, value]) => `
                <tr><td><strong>${key}</strong></td><td>${value}</td></tr>
              `).join('')}
            </table>
          ` : ''}

          <div class="highlight">
            <strong>⏰ Keine Aktion erforderlich - Lead wurde automatisch im System erfasst</strong>
          </div>
          <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/leads/${lead.id}" style="color: #0066CC; font-weight: bold;">➜ Lead im Admin-Panel öffnen</a></p>
        </div>
      </body>
      </html>
    `,
    text: `
${emoji} ${text}

=== KONTAKTDATEN ===
Name: ${[lead.anrede_text, lead.vorname, lead.nachname].filter(Boolean).join(' ') || 'N/A'}
E-Mail: ${lead.email}
Telefon: ${lead.telefon || 'N/A'}
Status: ${lead.status}

=== PFLEGESITUATION & ANFORDERUNGEN ===
Betreuung für: ${betreuungFuer}
Pflegegrad: ${pflegegrad}
Weitere Personen im Haushalt: ${weiterePersonen}
Mobilität: ${mobilitaet}
Nachteinsätze erforderlich: ${nachteinsaetze}
Wann soll die Betreuung starten?: ${careStartTiming}

=== ANFORDERUNGEN AN DIE PFLEGEKRAFT ===
Deutschkenntnisse: ${deutschkenntnisse}
Erfahrung: ${erfahrung}
Führerschein: ${fuehrerschein}
Geschlecht der Pflegekraft: ${geschlecht}

=== KOSTEN ===
Eigenanteil (monatlich): ${eigenanteil} €
Bruttopreis: ${kalkulation?.bruttopreis ? kalkulation.bruttopreis.toFixed(2).replace('.', ',') : 'N/A'} €
Zuschüsse gesamt: ${kalkulation?.zuschüsse?.gesamt ? kalkulation.zuschüsse.gesamt.toFixed(2).replace('.', ',') : 'N/A'} €

${additionalData ? `
=== ZUSÄTZLICHE DATEN ===
${Object.entries(additionalData).map(([key, value]) => `${key}: ${value}`).join('\n')}
` : ''}

⏰ Keine Aktion erforderlich - Lead wurde automatisch im System erfasst

Lead im Admin-Panel: ${process.env.NEXT_PUBLIC_SITE_URL}/admin/leads/${lead.id}
    `,
  };
}

export function getVertragEmailTemplate(
  lead: Lead,
  options: {
    subject?: string;
    anschreiben?: string;
    vertragsBeginn?: string;
    vertragsDauer?: string;
    tagessatz?: string;
    agName?: string;
    leName?: string;
  } = {}
): EmailTemplate {
  const anrede = lead.anrede_text || detectGenderFromName(lead.vorname || '');
  const nachname = lead.nachname || '';
  const vorname = lead.vorname || '';

  let anredeText: string;
  if (anrede === 'Frau' && nachname) anredeText = `Sehr geehrte Frau ${capitalize(nachname)}`;
  else if (anrede === 'Herr' && nachname) anredeText = `Sehr geehrter Herr ${capitalize(nachname)}`;
  else if (anrede === 'Familie' && nachname) anredeText = `Sehr geehrte Familie ${capitalize(nachname)}`;
  else if (vorname && nachname) anredeText = `Guten Tag ${capitalize(vorname)} ${capitalize(nachname)}`;
  else if (vorname) anredeText = `Guten Tag ${capitalize(vorname)}`;
  else anredeText = 'Guten Tag';

  const defaultAnschreiben = `anbei finden Sie Ihren Dienstleistungsvertrag mit PRIMUNDUS Deutschland zur Durchsicht. Bitte prüfen Sie alle Angaben sorgfältig und senden Sie uns den unterzeichneten Vertrag zurück – per Post, Fax oder eingescannt per E-Mail.

Bei Fragen stehen wir Ihnen jederzeit gerne zur Verfügung.`;

  const anschreiben = (options.anschreiben || defaultAnschreiben)
    .split('\n\n')
    .map(p => `<p style="margin:0 0 16px 0;line-height:1.7;">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');

  const subject = options.subject || `Ihr Dienstleistungsvertrag – PRIMUNDUS Deutschland`;

  const detailRows = [
    options.agName ? `<tr><td style="padding:6px 12px 6px 0;color:#888;white-space:nowrap;">Auftraggeber</td><td style="padding:6px 0;font-weight:600;">${options.agName}</td></tr>` : '',
    options.leName ? `<tr><td style="padding:6px 12px 6px 0;color:#888;white-space:nowrap;">Leistungsempfänger</td><td style="padding:6px 0;font-weight:600;">${options.leName}</td></tr>` : '',
    options.vertragsBeginn && options.vertragsBeginn !== '_______________' ? `<tr><td style="padding:6px 12px 6px 0;color:#888;white-space:nowrap;">Vertragsbeginn</td><td style="padding:6px 0;font-weight:600;">${options.vertragsBeginn}</td></tr>` : '',
    options.vertragsDauer ? `<tr><td style="padding:6px 12px 6px 0;color:#888;white-space:nowrap;">Vertragsdauer</td><td style="padding:6px 0;font-weight:600;">${options.vertragsDauer}</td></tr>` : '',
    options.tagessatz && options.tagessatz !== '_______________' ? `<tr><td style="padding:6px 12px 6px 0;color:#888;white-space:nowrap;">Tagessatz (§ 4)</td><td style="padding:6px 0;font-weight:600;">${options.tagessatz}/Tag</td></tr>` : '',
  ].filter(Boolean).join('');

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f0ece6;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a1a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0ece6;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr><td style="background:#5C4A32;padding:28px 40px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td><span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:1px;">PRIMUNDUS</span><span style="color:#c8b89a;font-size:13px;font-weight:400;margin-left:8px;">Deutschland</span></td>
              <td align="right"><span style="color:#c8b89a;font-size:12px;">24h-Pflege und Betreuung</span></td>
            </tr>
          </table>
        </td></tr>

        <!-- Title bar -->
        <tr><td style="background:#4a3928;padding:14px 40px;">
          <span style="color:#e8ddd0;font-size:14px;letter-spacing:0.5px;">📄 Dienstleistungsvertrag</span>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:40px 40px 32px;">
          <p style="margin:0 0 24px 0;font-size:17px;color:#1a1a1a;">${anredeText},</p>
          <div style="font-size:15px;color:#444;">${anschreiben}</div>

          ${detailRows ? `
          <!-- Contract details -->
          <div style="background:#faf8f5;border:1px solid #e8ddd0;border-left:3px solid #5C4A32;border-radius:0 4px 4px 0;padding:20px 24px;margin:28px 0;">
            <p style="margin:0 0 12px 0;font-size:12px;color:#7a6a56;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Vertragsdetails</p>
            <table cellpadding="0" cellspacing="0" style="font-size:14px;color:#333;width:100%;">
              ${detailRows}
            </table>
          </div>` : ''}

          <p style="margin:28px 0 0 0;font-size:14px;color:#666;line-height:1.7;">Den vollständigen Vertrag finden Sie im Anhang dieser E-Mail. Bitte drucken Sie ihn aus, unterschreiben ihn und senden Sie ein Exemplar zurück.</p>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:0 40px 32px;">
          <p style="margin:0 0 8px 0;font-size:13px;color:#888;">Fragen? Wir sind für Sie da:</p>
          <p style="margin:0;font-size:15px;font-weight:600;color:#5C4A32;">089 200 000 830 &nbsp;·&nbsp; info@primundus.de</p>
        </td></tr>

        <!-- Sign-off -->
        <tr><td style="padding:0 40px 40px;border-top:1px solid #f0ece6;">
          <p style="margin:24px 0 4px 0;font-size:15px;color:#333;">Mit freundlichen Grüßen</p>
          <p style="margin:0;font-size:15px;font-weight:600;color:#1a1a1a;">Ihr PRIMUNDUS-Team</p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f7f4f0;padding:20px 40px;border-top:1px solid #e8ddd0;">
          <p style="margin:0;font-size:12px;color:#999;line-height:1.6;text-align:center;">
            PRIMUNDUS Deutschland (VITANAS GROUP sp. z o. o) · Poznanska 21/48, 00-685 Warszawa<br>
            Telefon: 089 200 000 830 · E-Mail: info@primundus.de · www.primundus.de
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `${anredeText},

${options.anschreiben || defaultAnschreiben}

Vertragsdetails:
${options.agName ? `Auftraggeber: ${options.agName}` : ''}
${options.leName ? `Leistungsempfänger: ${options.leName}` : ''}
${options.vertragsBeginn && options.vertragsBeginn !== '_______________' ? `Vertragsbeginn: ${options.vertragsBeginn}` : ''}
${options.vertragsDauer ? `Vertragsdauer: ${options.vertragsDauer}` : ''}
${options.tagessatz && options.tagessatz !== '_______________' ? `Tagessatz: ${options.tagessatz}/Tag` : ''}

Den vollständigen Vertrag finden Sie im Anhang.

Mit freundlichen Grüßen
Ihr PRIMUNDUS-Team

PRIMUNDUS Deutschland · Telefon: 089 200 000 830 · info@primundus.de`;

  return { subject, html, text };
}

export async function sendConfirmationEmail(data: {
  to: string;
  template: EmailTemplate;
  attachments?: any[];
}): Promise<{ success: boolean; error?: string }> {
  return sendEmail(data.to, data.template, data.attachments);
}

export async function sendEmail(
  to: string,
  template: EmailTemplate,
  attachments?: any[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const nodemailer = await import('nodemailer');

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ionos.de',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
      },
    });

    const mailOptions: any = {
      from: `"${process.env.SMTP_FROM_NAME || 'Primundus 24h-Pflege'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject: template.subject,
      text: template.text,
      html: template.html,
    };

    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments.map((att: any) => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType || 'application/octet-stream',
      }));
    }

    await transporter.sendMail(mailOptions);
    console.log(`Email sent via SMTP to: ${to}`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('SMTP send error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}
