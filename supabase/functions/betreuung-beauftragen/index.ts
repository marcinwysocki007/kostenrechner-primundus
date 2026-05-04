import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.10";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  fromName: string;
  siteUrl: string;
}

async function getSmtpConfig(supabase: any): Promise<SmtpConfig> {
  const { data, error } = await supabase.rpc("get_smtp_config");

  if (error) {
    console.error("Error fetching SMTP config:", error.message);
    throw new Error(`Failed to get SMTP config: ${error.message}`);
  }

  return {
    host: data?.host || "smtp.ionos.de",
    port: parseInt(data?.port || "587"),
    user: data?.user || "",
    pass: data?.pass || "",
    from: data?.from || "",
    fromName: data?.fromName || "Primundus 24h-Pflege",
    siteUrl: data?.siteUrl || "https://kostenrechner.primundus.de",
  };
}

async function sendEmailSmtp(
  smtpConfig: SmtpConfig,
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const transport = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: false,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
      },
    });

    await new Promise<void>((resolve, reject) => {
      transport.sendMail(
        {
          from: `"${smtpConfig.fromName}" <${smtpConfig.from}>`,
          to,
          subject,
          html,
        },
        (error: any) => {
          if (error) return reject(error);
          resolve();
        }
      );
    });

    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

function buildTeamEmailHtml(lead: any, formData: any): string {
  const kalkulation = lead.kalkulation || {};
  const gesamtkosten = kalkulation.gesamtkostenMonatlich || 0;
  const pflegegrad = kalkulation.pflegegrad || "Nicht angegeben";

  const careStartMap: Record<string, string> = {
    sofort: "So schnell wie moeglich",
    "1-2-wochen": "In 1-2 Wochen",
    "1-monat": "In etwa 1 Monat",
    planen: "Ich plane voraus",
  };
  const careStartText =
    careStartMap[lead.care_start_timing] || "Nicht angegeben";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { background: #5C8A5C; color: white; padding: 20px; text-align: center; }
  .content { padding: 20px; background: #f9f9f9; }
  .section { margin-bottom: 20px; padding: 15px; background: white; border-left: 4px solid #5C8A5C; }
  .label { font-weight: bold; color: #5C8A5C; }
  .value { margin-left: 10px; }
  .highlight { background: #E8F5E3; padding: 15px; margin: 20px 0; border-radius: 5px; }
</style></head><body>
<div class="container">
  <div class="header"><h1>Neue Betreuungsbeauftragung</h1></div>
  <div class="content">
    <div class="highlight">
      <p style="margin:0;font-size:18px;font-weight:bold;">Ein Kunde hat eine Betreuung verbindlich beauftragt!</p>
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
      <p><span class="label">Monatliche Kosten:</span><span class="value">${gesamtkosten.toLocaleString("de-DE")} EUR</span></p>
      <p><span class="label">Betreuungsbeginn:</span><span class="value">${careStartText}</span></p>
    </div>
    ${
      formData.specialRequirements
        ? `<div class="section"><h2>Besondere Anforderungen</h2><p>${formData.specialRequirements}</p></div>`
        : ""
    }
    <div class="section">
      <h2>Lead-Details</h2>
      <p><span class="label">Lead-ID:</span><span class="value">${lead.id}</span></p>
      <p><span class="label">Beauftragt am:</span><span class="value">${new Date().toLocaleString("de-DE")}</span></p>
    </div>
  </div>
</div></body></html>`;
}

function capitalize(name: string): string {
  if (!name) return name;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function buildAnredeText(anrede: string, nachname: string): string {
  const n = capitalize(nachname);
  if (anrede === "Frau" && n) return `Sehr geehrte Frau ${n}`;
  if (anrede === "Herr" && n) return `Sehr geehrter Herr ${n}`;
  if (anrede === "Familie" && n) return `Sehr geehrte Familie ${n}`;
  if (n) return `Guten Tag ${n}`;
  return "Sehr geehrte Damen und Herren";
}

function buildCustomerEmailHtml(lead: any, formData: any, siteUrl: string): string {
  const kalkulation = lead.kalkulation || {};
  const gesamtkosten = kalkulation.gesamtkostenMonatlich || kalkulation.eigenanteil || 0;
  const pflegegrad = kalkulation.pflegegrad || lead.kalkulation?.aufschluesselung?.find((a: any) => a.kategorie === "pflegegrad")?.antwort || "Nicht angegeben";

  const careStartMap: Record<string, string> = {
    sofort: "So schnell wie möglich",
    "1-2-wochen": "In 1–2 Wochen",
    "1-monat": "In etwa 1 Monat",
    planen: "Ich plane voraus",
  };
  const careStartText = careStartMap[lead.care_start_timing] || "Nicht angegeben";

  const anredeText = buildAnredeText(formData.anrede || "", formData.nachname || "");
  const logoUrl = `${siteUrl}/images/Primundus-Logo_V6.png`;
  const kostenbetrag = typeof gesamtkosten === "number" ? gesamtkosten.toLocaleString("de-DE") : "0";

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Primundus 24h-Pflege – Bestätigung</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #f4f4f4; -webkit-font-smoothing: antialiased; }
    .email-wrapper { width: 100%; background-color: #f4f4f4; padding: 20px 0; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.10); }
    .email-header { background: #ffffff; padding: 28px 30px 20px 30px; border-bottom: 4px solid #B5A184; text-align: center; }
    .email-header img { max-width: 180px; height: auto; display: inline-block; }
    .success-banner { background: linear-gradient(135deg, #B5A184 0%, #9A8A73 100%); padding: 32px 30px; text-align: center; }
    .success-banner .checkmark { width: 56px; height: 56px; border-radius: 50%; background: rgba(255,255,255,0.2); border: 2px solid rgba(255,255,255,0.6); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; }
    .success-banner .checkmark-symbol { color: #ffffff; font-size: 28px; font-weight: bold; line-height: 1; }
    .success-banner h1 { color: #ffffff; font-size: 22px; font-weight: 700; margin: 0; letter-spacing: -0.3px; }
    .email-content { padding: 40px 36px; }
    .greeting { font-size: 18px; color: #3D2B1F; font-weight: 600; margin-bottom: 16px; }
    .intro-text { font-size: 15px; color: #555555; line-height: 1.7; margin-bottom: 28px; }
    .overview-box { background: #F5F0E8; border-radius: 8px; padding: 24px; margin: 28px 0; border-left: 4px solid #B5A184; }
    .overview-box h2 { color: #3D2B1F; font-size: 16px; font-weight: 700; margin: 0 0 18px 0; text-transform: uppercase; letter-spacing: 0.4px; }
    .overview-row { display: flex; padding: 10px 0; border-bottom: 1px solid #E8DDD0; }
    .overview-row:last-child { border-bottom: none; padding-bottom: 0; }
    .overview-label { color: #8B7355; font-size: 13px; font-weight: 600; width: 45%; flex-shrink: 0; }
    .overview-value { color: #3D2B1F; font-size: 13px; font-weight: 600; }
    .steps-box { background: #ffffff; border: 1px solid #E8DDD0; border-radius: 8px; padding: 24px; margin: 28px 0; }
    .steps-box h2 { color: #3D2B1F; font-size: 16px; font-weight: 700; margin: 0 0 18px 0; }
    .step-item { display: flex; align-items: flex-start; margin-bottom: 14px; }
    .step-item:last-child { margin-bottom: 0; }
    .step-number { width: 28px; height: 28px; background: #5C4033; color: white; border-radius: 50%; text-align: center; line-height: 28px; font-size: 13px; font-weight: 700; flex-shrink: 0; margin-right: 12px; margin-top: 1px; }
    .step-text { font-size: 14px; color: #555555; line-height: 1.6; }
    .contact-box { background: #F5F0E8; border-radius: 8px; padding: 20px 24px; margin: 28px 0; border-left: 4px solid #B5A184; }
    .contact-box p { margin: 0 0 4px 0; font-size: 13px; color: #8B7355; }
    .contact-box .phone { font-size: 20px; font-weight: 700; color: #5C4033; margin: 4px 0 2px 0; }
    .contact-box .mail { font-size: 14px; color: #6B5B45; }
    .sign-off { font-size: 15px; color: #555555; line-height: 1.7; margin-top: 28px; }
    .sign-off strong { color: #3D2B1F; }
    .email-footer { background-color: #f8f9fa; padding: 28px 30px; text-align: center; border-top: 1px solid #e0e0e0; }
    .footer-company { font-weight: 600; font-size: 15px; color: #3D2B1F; margin-bottom: 6px; }
    .footer-contact { font-size: 13px; color: #888888; line-height: 1.6; }
    .footer-contact a { color: #B5A184; text-decoration: none; }
    .footer-legal { font-size: 11px; color: #aaaaaa; margin-top: 16px; line-height: 1.5; }
    @media only screen and (max-width: 600px) {
      .email-content { padding: 28px 20px; }
      .overview-row { flex-direction: column; }
      .overview-label { width: 100%; margin-bottom: 2px; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center">
          <div class="email-container">
            <div class="email-header">
              <img src="${logoUrl}" alt="Primundus Logo" />
            </div>
            <div class="success-banner">
              <div>
                <div class="checkmark" style="display:inline-block;width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,0.2);border:2px solid rgba(255,255,255,0.6);line-height:56px;text-align:center;margin-bottom:16px;">
                  <span class="checkmark-symbol" style="color:#fff;font-size:28px;font-weight:bold;">&#10003;</span>
                </div>
              </div>
              <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0;">Vielen Dank f&uuml;r Ihr Vertrauen!</h1>
            </div>
            <div class="email-content">
              <p class="greeting">${anredeText},</p>
              <p class="intro-text">vielen Dank f&uuml;r Ihre Beauftragung. Wir haben Ihre Anfrage erhalten und werden uns umgehend um die Vorbereitung Ihrer Betreuung k&uuml;mmern.</p>

              <div class="overview-box">
                <h2>Ihre Beauftragung im &Uuml;berblick</h2>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #E8DDD0;color:#8B7355;font-size:13px;font-weight:600;width:45%;">Pflegegrad</td>
                    <td style="padding:10px 0;border-bottom:1px solid #E8DDD0;color:#3D2B1F;font-size:13px;font-weight:600;">${pflegegrad}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #E8DDD0;color:#8B7355;font-size:13px;font-weight:600;">Monatliche Kosten</td>
                    <td style="padding:10px 0;border-bottom:1px solid #E8DDD0;color:#3D2B1F;font-size:13px;font-weight:600;">${kostenbetrag}&nbsp;EUR</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #E8DDD0;color:#8B7355;font-size:13px;font-weight:600;">Betreuungsbeginn</td>
                    <td style="padding:10px 0;border-bottom:1px solid #E8DDD0;color:#3D2B1F;font-size:13px;font-weight:600;">${careStartText}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;color:#8B7355;font-size:13px;font-weight:600;">Einsatzort</td>
                    <td style="padding:10px 0;color:#3D2B1F;font-size:13px;font-weight:600;">${formData.patientStreet}, ${formData.patientZip} ${formData.patientCity}</td>
                  </tr>
                </table>
              </div>

              <div class="steps-box">
                <h2 style="color:#3D2B1F;font-size:16px;font-weight:700;margin:0 0 18px 0;">Die n&auml;chsten Schritte</h2>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:0 12px 14px 0;vertical-align:top;width:36px;">
                      <div style="width:28px;height:28px;background:#5C4033;color:white;border-radius:50%;text-align:center;line-height:28px;font-size:13px;font-weight:700;">1</div>
                    </td>
                    <td style="padding:0 0 14px 0;font-size:14px;color:#555555;line-height:1.6;border-bottom:1px solid #F0EAE0;">
                      Unser Team meldet sich innerhalb von 24 Stunden bei Ihnen
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:14px 12px 14px 0;vertical-align:top;width:36px;">
                      <div style="width:28px;height:28px;background:#5C4033;color:white;border-radius:50%;text-align:center;line-height:28px;font-size:13px;font-weight:700;">2</div>
                    </td>
                    <td style="padding:14px 0;font-size:14px;color:#555555;line-height:1.6;border-bottom:1px solid #F0EAE0;">
                      Wir besprechen alle Details und kl&auml;ren offene Fragen
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:14px 12px 14px 0;vertical-align:top;width:36px;">
                      <div style="width:28px;height:28px;background:#5C4033;color:white;border-radius:50%;text-align:center;line-height:28px;font-size:13px;font-weight:700;">3</div>
                    </td>
                    <td style="padding:14px 0;font-size:14px;color:#555555;line-height:1.6;border-bottom:1px solid #F0EAE0;">
                      Wir suchen die passende Betreuungskraft f&uuml;r Sie aus
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:14px 12px 0 0;vertical-align:top;width:36px;">
                      <div style="width:28px;height:28px;background:#5C4033;color:white;border-radius:50%;text-align:center;line-height:28px;font-size:13px;font-weight:700;">4</div>
                    </td>
                    <td style="padding:14px 0 0 0;font-size:14px;color:#555555;line-height:1.6;">
                      Die Betreuung kann je nach Verf&uuml;gbarkeit innerhalb von 4&ndash;7 Tagen starten
                    </td>
                  </tr>
                </table>
              </div>

              <div class="contact-box">
                <p style="margin:0 0 6px 0;font-size:13px;color:#8B7355;font-weight:600;">Haben Sie Fragen? Wir sind gerne f&uuml;r Sie da:</p>
                <p class="phone" style="font-size:20px;font-weight:700;color:#5C4033;margin:0 0 4px 0;">+49 89 200 000 830</p>
                <p class="mail" style="font-size:14px;color:#6B5B45;margin:0;">
                  <a href="mailto:info@primundus.de" style="color:#B5A184;text-decoration:none;">info@primundus.de</a>
                </p>
              </div>

              <p class="sign-off" style="font-size:15px;color:#555555;line-height:1.7;margin-top:28px;">
                Mit freundlichen Gr&uuml;&szlig;en<br>
                <strong style="color:#3D2B1F;">Ihr Primundus-Team</strong>
              </p>
            </div>
            <div class="email-footer">
              <div class="footer-company">Primundus Deutschland</div>
              <div class="footer-contact">
                24h-Pflege und Betreuung zu Hause<br>
                <a href="tel:+4989200000830">+49 89 200 000 830</a> |
                <a href="mailto:info@primundus.de">info@primundus.de</a><br>
                <a href="https://primundus.de" style="color:#B5A184;">www.primundus.de</a>
              </div>
              <div class="footer-legal">
                Diese E-Mail wurde versendet an: ${formData.email}<br>
                Primundus Deutschland | Vitanas Group
              </div>
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const {
      leadId,
      anrede,
      vorname,
      nachname,
      email,
      phone,
      patientAnrede,
      patientVorname,
      patientNachname,
      patientStreet,
      patientZip,
      patientCity,
      specialRequirements,
    } = body;

    if (!leadId) {
      return new Response(
        JSON.stringify({ error: "leadId ist erforderlich" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: lead, error: fetchError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .maybeSingle();

    if (fetchError || !lead) {
      console.error("Lead fetch error:", fetchError?.message || "not found");
      return new Response(
        JSON.stringify({
          error: "Lead nicht gefunden",
          details: fetchError?.message,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { error: updateError } = await supabase
      .from("leads")
      .update({
        status: "vertrag_abgeschlossen",
        order_confirmed_at: new Date().toISOString(),
        anrede_text: anrede,
        vorname: vorname,
        nachname: nachname,
        email: email,
        telefon: phone,
        patient_anrede: patientAnrede,
        patient_vorname: patientVorname,
        patient_nachname: patientNachname,
        patient_street: patientStreet,
        patient_zip: patientZip,
        patient_city: patientCity,
        special_requirements: specialRequirements,
      })
      .eq("id", leadId);

    if (updateError) {
      console.error("Error updating lead:", updateError);
      return new Response(
        JSON.stringify({ error: "Fehler beim Speichern der Daten" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    await supabase.from("lead_events").insert({
      lead_id: leadId,
      event_type: "betreuung_beauftragt",
      data: {
        anrede,
        vorname,
        nachname,
        email,
        phone,
        patientStreet,
        patientZip,
        patientCity,
      },
    });

    const formData = {
      anrede,
      vorname,
      nachname,
      email,
      phone,
      patientStreet,
      patientZip,
      patientCity,
      specialRequirements,
    };

    try {
      const smtpConfig = await getSmtpConfig(supabase);

      if (smtpConfig.user && smtpConfig.pass) {
        const adminEmail = smtpConfig.from || "kostenrechner@primundus.de";

        const teamResult = await sendEmailSmtp(
          smtpConfig,
          adminEmail,
          `Neue Betreuungsbeauftragung - ${vorname} ${nachname}`,
          buildTeamEmailHtml(lead, formData)
        );

        await supabase.from("lead_events").insert({
          lead_id: leadId,
          event_type: teamResult.success ? "team_notified_beauftragt" : "team_notify_beauftragt_failed",
          data: { to: adminEmail, ...(teamResult.error ? { error: teamResult.error } : {}) },
        });

        if (email) {
          const customerResult = await sendEmailSmtp(
            smtpConfig,
            email,
            "Best\u00e4tigung Ihrer Betreuungsanfrage",
            buildCustomerEmailHtml(lead, formData, smtpConfig.siteUrl)
          );

          await supabase.from("lead_events").insert({
            lead_id: leadId,
            event_type: customerResult.success ? "email_bestaetigung_beauftragt_sent" : "email_bestaetigung_beauftragt_failed",
            data: { to: email, ...(customerResult.error ? { error: customerResult.error } : {}) },
          });
        }
      }
    } catch (emailError) {
      console.error(
        "Email sending failed (non-critical):",
        emailError instanceof Error ? emailError.message : String(emailError)
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error in betreuung-beauftragen:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
