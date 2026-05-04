import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { findOrCreateLead, logEvent } from '@/lib/lead-management';
import { Kalkulation } from '@/lib/calculation';
import {
  sendEmail,
  getEingangsbestaetigungEmailTemplate,
  getTeamNotificationTemplate,
  getAngebotsEmailTemplate,
} from '@/lib/email';
import { detectGenderFromName } from '@/lib/calculation';
import { generatePDFForLead } from '@/lib/pdf-generator-pdfkit';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Always use anon key for REST queries — service role key may be invalid in this environment
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(url, anonKey);
}

const supabase = getSupabaseClient();

async function scheduleAngebotsEmail(leadId: string, email: string): Promise<{ success: boolean; error?: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/schedule-email`;

  try {
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
        'Apikey': anonKey,
      },
      body: JSON.stringify({
        lead_id: leadId,
        email_type: 'angebot',
        recipient_email: email,
        delay_minutes: 15,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `Edge Function Fehler: ${response.status} - ${text}` };
    }

    const result = await response.json();
    return { success: result.success === true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.leadId && body.sendEmailOnly) {
      return handleSendAngebotsEmailOnly(body.leadId, body.isResend === true);
    }

    const {
      vorname,
      email,
      telefon,
      careStartTiming,
      kalkulation,
    }: {
      vorname: string;
      email: string;
      telefon?: string;
      careStartTiming?: string;
      kalkulation: Kalkulation;
    } = body;

    if (!vorname || !email || !kalkulation) {
      return NextResponse.json(
        { error: 'Vorname, E-Mail und Kalkulation erforderlich' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Ungültige E-Mail-Adresse' },
        { status: 400 }
      );
    }

    const nameParts = vorname.trim().split(/\s+/);
    const parsedVorname = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : nameParts[0];
    const parsedNachname = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
    const detectedAnrede = detectGenderFromName(parsedVorname) || undefined;

    const { lead, isNew, isUpgrade } = await findOrCreateLead(
      email,
      'angebot_requested',
      {
        vorname: parsedVorname,
        nachname: parsedNachname || undefined,
        anrede: detectedAnrede,
        telefon,
        care_start_timing: careStartTiming,
        kalkulation,
      }
    );

    const eingangsEmail = getEingangsbestaetigungEmailTemplate(lead, kalkulation);
    const emailResult = await sendEmail(email, eingangsEmail);

    if (emailResult.success) {
      await logEvent(lead.id, 'email_eingangsbestaetigung_sent', {
        to: email,
        token: lead.token,
      });
    } else {
      console.error('Eingangsbestaetigungs-Email fehlgeschlagen (Lead gespeichert):', emailResult.error);
      await logEvent(lead.id, 'email_eingangsbestaetigung_failed', {
        to: email,
        error: emailResult.error,
      });
    }

    const scheduleResult = await scheduleAngebotsEmail(lead.id, email);
    const scheduleError = !scheduleResult.success;

    if (!scheduleResult.success) {
      console.error('Fehler beim Schedulen der Angebotsmail:', scheduleResult.error);
      await logEvent(lead.id, 'email_angebot_schedule_failed', {
        error: scheduleResult.error,
      });
    } else {
      await logEvent(lead.id, 'email_angebot_scheduled', {
        to: email,
      });
    }

    const teamEmail = getTeamNotificationTemplate(lead, 'angebot_requested');
    const teamEmailResult = await sendEmail('info@primundus.de', teamEmail);
    if (teamEmailResult.success) {
      await logEvent(lead.id, 'team_notified', { status: 'angebot_requested' });
    } else {
      console.error('Team-Benachrichtigung fehlgeschlagen:', teamEmailResult.error);
    }

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      isNew,
      isUpgrade,
      emailSent: emailResult.success,
      angebotsEmailScheduled: !scheduleError,
      message: 'Angebot angefordert',
    });
  } catch (error) {
    console.error('Fehler bei Angebotsanforderung:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('Full error stack:', error.stack);
    }
    return NextResponse.json(
      { error: 'Fehler bei Angebotsanforderung', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

async function handleSendAngebotsEmailOnly(leadId: string, isResend = false) {
  try {
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .maybeSingle();

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Lead nicht gefunden', details: leadError?.message },
        { status: 404 }
      );
    }

    const angebotsEmail = getAngebotsEmailTemplate(lead, lead.kalkulation, { isResend });

    // Generate PDF attachment
    let pdfAttachments: any[] | undefined;
    try {
      const pdfBuffer = await generatePDFForLead(lead);
      if (pdfBuffer) {
        const namePart = [lead.vorname, lead.nachname].filter(Boolean).join('_');
        pdfAttachments = [{
          filename: `Primundus_Angebot${namePart ? `_${namePart}` : ''}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        }];
      }
    } catch (pdfErr) {
      console.error('⚠️ PDF-Generierung fehlgeschlagen (Mail wird trotzdem gesendet):', pdfErr);
    }

    const emailResult = await sendEmail(lead.email, angebotsEmail, pdfAttachments);

    if (emailResult.success) {
      await logEvent(lead.id, 'email_angebot_sent', {
        to: lead.email,
        triggered_by: isResend ? 'admin_resend' : 'scheduled_email',
      });
    } else {
      await logEvent(lead.id, 'email_angebot_failed', {
        to: lead.email,
        error: emailResult.error,
        triggered_by: isResend ? 'admin_resend' : 'scheduled_email',
      });
    }

    return NextResponse.json({
      success: emailResult.success,
      emailSent: emailResult.success,
      emailError: emailResult.error,
    });
  } catch (error) {
    console.error('Fehler beim Senden der Angebotsmail:', error);
    return NextResponse.json(
      { error: 'Fehler beim Senden der Angebotsmail', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
