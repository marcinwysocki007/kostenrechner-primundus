import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key = (serviceKey && serviceKey.length > 10 ? serviceKey : null)
    || (anonKey && anonKey.length > 10 ? anonKey : null);

  if (!url || !key) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(url, key);
}

const supabase = getSupabaseClient();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      leadId,
      anrede,
      vorname,
      nachname,
      email,
      phone,
      patientStreet,
      patientZip,
      patientCity,
      specialRequirements,
    } = body;

    const { data: lead, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .maybeSingle();

    if (fetchError || !lead) {
      return NextResponse.json(
        { error: 'Lead nicht gefunden' },
        { status: 404 }
      );
    }

    const { error: updateError } = await supabase
      .from('leads')
      .update({
        status: 'vertrag_abgeschlossen',
        order_confirmed_at: new Date().toISOString(),
        anrede_text: anrede,
        vorname: vorname,
        nachname: nachname,
        email: email,
        telefon: phone,
        patient_street: patientStreet,
        patient_zip: patientZip,
        patient_city: patientCity,
        special_requirements: specialRequirements,
      })
      .eq('id', leadId);

    if (updateError) {
      console.error('Error updating lead:', updateError);
      return NextResponse.json(
        { error: 'Fehler beim Speichern der Daten' },
        { status: 500 }
      );
    }

    await sendConfirmationEmails(lead, {
      anrede,
      vorname,
      nachname,
      email,
      phone,
      patientStreet,
      patientZip,
      patientCity,
      specialRequirements,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in betreuung-beauftragen:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

async function sendConfirmationEmails(lead: any, formData: any) {
  const kalkulation = lead.kalkulation || {};
  const gesamtkosten = kalkulation.eigenanteil || kalkulation.gesamtkostenMonatlich || 0;
  const pflegegradRaw = kalkulation.formularDaten?.pflegegrad ?? kalkulation.pflegegrad;
  const pflegegrad = pflegegradRaw != null && pflegegradRaw !== '' ? `Pflegegrad ${pflegegradRaw}` : 'Nicht angegeben';

  const careStartMap: Record<string, string> = {
    'sofort': 'So schnell wie möglich',
    '1-2-wochen': 'In 1-2 Wochen',
    '1-monat': 'In etwa 1 Monat',
    'planen': 'Ich plane voraus',
  };
  const careStartText = careStartMap[lead.care_start_timing] || 'Nicht angegeben';

  const teamEmailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #5C8A5C; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .section { margin-bottom: 20px; padding: 15px; background: white; border-left: 4px solid #5C8A5C; }
        .label { font-weight: bold; color: #5C8A5C; }
        .value { margin-left: 10px; }
        .highlight { background: #E8F5E3; padding: 15px; margin: 20px 0; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Neue Betreuungsbeauftragung</h1>
        </div>
        <div class="content">
          <div class="highlight">
            <p style="margin: 0; font-size: 18px; font-weight: bold;">
              Ein Kunde hat eine Betreuung verbindlich beauftragt!
            </p>
          </div>

          <div class="section">
            <h2>Kontaktperson</h2>
            <p><span class="label">Anrede:</span><span class="value">${formData.anrede}</span></p>
            <p><span class="label">Name:</span><span class="value">${formData.vorname} ${formData.nachname}</span></p>
            <p><span class="label">E-Mail:</span><span class="value">${formData.email}</span></p>
            <p><span class="label">Telefon:</span><span class="value">${formData.phone}</span></p>
          </div>

          <div class="section">
            <h2>Einsatzort</h2>
            <p><span class="label">Adresse:</span><span class="value">${formData.patientStreet}</span></p>
            <p><span class="label">PLZ/Ort:</span><span class="value">${formData.patientZip} ${formData.patientCity}</span></p>
          </div>

          <div class="section">
            <h2>Kalkulation</h2>
            <p><span class="label">Pflegegrad:</span><span class="value">${pflegegrad}</span></p>
            <p><span class="label">Monatliche Kosten (Eigenanteil):</span><span class="value">${gesamtkosten > 0 ? gesamtkosten.toLocaleString('de-DE') + ' €' : 'Nicht angegeben'}</span></p>
            <p><span class="label">Betreuungsbeginn:</span><span class="value">${careStartText}</span></p>
          </div>

          ${formData.specialRequirements ? `
          <div class="section">
            <h2>Besondere Anforderungen</h2>
            <p>${formData.specialRequirements}</p>
          </div>
          ` : ''}

          <div class="section">
            <h2>Lead-Details</h2>
            <p><span class="label">Lead-ID:</span><span class="value">${lead.id}</span></p>
            <p><span class="label">Beauftragt am:</span><span class="value">${new Date().toLocaleString('de-DE')}</span></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const customerEmailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #5C8A5C; color: white; padding: 30px 20px; text-align: center; }
        .content { padding: 30px 20px; background: #f9f9f9; }
        .checkmark { font-size: 48px; color: white; }
        .section { margin-bottom: 20px; padding: 15px; background: white; border-radius: 5px; }
        .highlight { background: #E8F5E3; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="checkmark">✓</div>
          <h1 style="margin: 10px 0 0 0;">Vielen Dank für Ihr Vertrauen!</h1>
        </div>
        <div class="content">
          <p style="font-size: 18px;">Sehr geehrte/r ${formData.anrede} ${formData.nachname},</p>

          <p>vielen Dank für Ihre Beauftragung. Wir haben Ihre Anfrage erhalten und werden uns umgehend um die Vorbereitung Ihrer Betreuung kümmern.</p>

          <div class="highlight">
            <h2 style="margin-top: 0;">Ihre Beauftragung im Überblick</h2>
            <p><strong>Pflegegrad:</strong> ${pflegegrad}</p>
            <p><strong>Monatliche Kosten (Eigenanteil):</strong> ${gesamtkosten > 0 ? gesamtkosten.toLocaleString('de-DE') + ' €' : 'Nicht angegeben'}</p>
            <p><strong>Gewünschter Betreuungsbeginn:</strong> ${careStartText}</p>
            <p><strong>Einsatzort:</strong> ${formData.patientStreet}, ${formData.patientZip} ${formData.patientCity}</p>
          </div>

          <div class="section">
            <h3>Die nächsten Schritte</h3>
            <ol>
              <li>Unser Team meldet sich innerhalb von 24 Stunden bei Ihnen</li>
              <li>Wir besprechen alle Details und klären offene Fragen</li>
              <li>Wir suchen die passende Betreuungskraft für Sie aus</li>
              <li>Die Betreuung kann je nach Verfügbarkeit innerhalb von 4-7 Tagen starten</li>
            </ol>
          </div>

          <div class="section" style="background: #E8F5E3;">
            <h3 style="margin-top: 0;">Haben Sie Fragen?</h3>
            <p><strong>Telefon:</strong> +49 89 200 000 830</p>
            <p><strong>E-Mail:</strong> info@primundus.de</p>
          </div>

          <p>Wir freuen uns darauf, Sie bei der Betreuung zu unterstützen!</p>

          <p>Mit freundlichen Grüßen<br>
          Ihr Primundus-Team</p>
        </div>
        <div class="footer">
          <p>Primundus GmbH | Telefon: +49 89 200 000 830 | info@primundus.de</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"Primundus" <${process.env.SMTP_FROM}>`,
      to: process.env.SMTP_ADMIN_EMAIL,
      subject: `Neue Betreuungsbeauftragung - ${formData.vorname} ${formData.nachname}`,
      html: teamEmailHtml,
    });

    await transporter.sendMail({
      from: `"Primundus" <${process.env.SMTP_FROM}>`,
      to: formData.email,
      subject: 'Bestätigung Ihrer Betreuungsanfrage',
      html: customerEmailHtml,
    });
  } catch (error) {
    console.error('Error sending emails:', error);
  }
}
