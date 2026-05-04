"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@supabase/supabase-js';
import {
  Loader as Loader2, ArrowLeft, Mail, Phone, Calendar, MapPin, FileText, Clock,
  CreditCard as Edit, Save, X, RefreshCw, User, CircleCheck as CheckCircle,
  MessageSquare, AlertTriangle, Send, ExternalLink, Check, ChevronDown,
  PhoneCall, PhoneMissed, PhoneOff, Printer, Euro,
} from 'lucide-react';
import { ALL_STATUSES, getStatusMeta } from '../statuses';
import { ContractDocument, EmailPreviewFrame } from './contract-components';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);


// Read a field from lead, falling back to patient_data JSON (for fields not yet in schema)
function lf(lead: any, field: string, fallback = '') {
  return lead?.[field] || lead?.patient_data?.[field] || fallback;
}

function getInfoCompleteness(lead: any) {
  const p = lead.patient_data || {};
  return {
    kontakt:        !!(lead.vorname && lead.nachname && lead.email),
    adresse:        !!(lf(lead, 'ag_street') && lf(lead, 'ag_city')),
    patient:        !!(p.geburtsjahr || p.pflegegrad != null || p.mobilitaet),
    vertragsbeginn: !!(lf(lead, 'vertrags_beginn')),
  };
}

function getDefaultTab(status: string): 'lead' | 'vertrag' {
  if (['vertrag_gesendet', 'vertrag_abgeschlossen', 'in_betreuung'].includes(status)) return 'vertrag';
  return 'lead';
}

// ─── StatusSelect ────────────────────────────────────────────────────────────

function StatusSelect({ currentStatus, saving, onSelect }: { currentStatus: string; saving: boolean; onSelect: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const meta = getStatusMeta(currentStatus);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(v => !v)} disabled={saving}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-gray-200 bg-white hover:border-[#5C4A32]/40 transition-colors text-left ${saving ? 'opacity-50' : ''}`}>
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400 flex-shrink-0" /> : <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${meta.dot}`} />}
        <span className="flex-1 text-sm font-medium text-gray-800">{meta.label}</span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-1">
          {ALL_STATUSES.map(s => {
            const active = s.value === currentStatus;
            return (
              <button key={s.value} onClick={() => { onSelect(s.value); setOpen(false); }} disabled={active}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors text-left disabled:cursor-default">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                <span className={active ? 'font-semibold text-gray-900' : 'text-gray-700'}>{s.label}</span>
                {active && <Check className="w-3.5 h-3.5 text-[#5C4A32] ml-auto" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Call Panel ──────────────────────────────────────────────────────────────

function CallPanel({ callNote, setCallNote, callSaving, onCall, onClose }: {
  callNote: string; setCallNote: (v: string) => void;
  callSaving: boolean; onCall: (r: 'erfolgreich' | 'nicht_erreicht' | 'callback') => void; onClose: () => void;
}) {
  return (
    <div className="mt-3 bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-800">Anruf-Ergebnis notieren</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex gap-2">
        {([
          { key: 'erfolgreich',   icon: PhoneCall,   label: 'Erreicht',         cls: 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100' },
          { key: 'nicht_erreicht',icon: PhoneMissed, label: 'Nicht erreicht',   cls: 'border-gray-200 text-gray-600 hover:bg-gray-50' },
          { key: 'callback',      icon: PhoneOff,    label: 'Rückruf',          cls: 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100' },
        ] as const).map(({ key, icon: Icon, label, cls }) => (
          <button key={key} disabled={callSaving} onClick={() => onCall(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-colors disabled:opacity-50 ${cls}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>
      <input type="text" placeholder="Kurze Notiz (optional)" value={callNote}
        onChange={e => setCallNote(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5C4A32]" />
      {callSaving && <p className="text-xs text-gray-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Wird gespeichert…</p>}
    </div>
  );
}

// ─── ChecklistItem ───────────────────────────────────────────────────────────

function CheckItem({ ok, label, onFix }: { ok: boolean; label: string; onFix?: () => void }) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${ok ? 'bg-green-500' : 'bg-amber-400'}`}>
        {ok ? <Check className="w-3 h-3 text-white" /> : <span className="text-white text-xs font-bold">!</span>}
      </div>
      <span className={ok ? 'text-gray-700' : 'text-amber-700 font-medium'}>{label}</span>
      {!ok && onFix && <button onClick={onFix} className="ml-auto text-xs text-[#5C4A32] underline hover:opacity-70">Ausfüllen</button>}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;

  const [activeTab, setActiveTab] = useState<'lead' | 'vertrag'>('lead');

  // Data
  const [lead,            setLead]            = useState<any>(null);
  const [events,          setEvents]          = useState<any[]>([]);
  const [scheduledEmails, setScheduledEmails] = useState<any[]>([]);
  const [vertrag,         setVertrag]         = useState<any>(null);
  const [loading,         setLoading]         = useState(true);

  // Contact edit
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editedContact,    setEditedContact]    = useState<any>(null);
  const [isSavingContact,  setIsSavingContact]  = useState(false);

  // Patient edit
  const [isEditingPatient,    setIsEditingPatient]    = useState(false);
  const [editedPatient,       setEditedPatient]       = useState<any>(null);
  const [patientEditInitial,  setPatientEditInitial]  = useState<any>(null);
  const [isSavingPatient,     setIsSavingPatient]     = useState(false);
  const [isRecalcFromPatient, setIsRecalcFromPatient] = useState(false);
  const [showNewKalkConfirm,  setShowNewKalkConfirm]  = useState(false);

  // Status
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  // Notes
  const [adminNotes,    setAdminNotes]    = useState('');
  const [isEditingNotes,setIsEditingNotes]= useState(false);

  // Vertragsbeginn
  const [isEditingVertrag, setIsEditingVertrag] = useState(false);
  const [editedVertrag,    setEditedVertrag]    = useState<any>(null);
  const [isSavingVertrag,  setIsSavingVertrag]  = useState(false);

  // Email resend
  const [isResendingEmail,  setIsResendingEmail]  = useState(false);
  const [emailResendStatus, setEmailResendStatus] = useState<'idle'|'success'|'error'>('idle');

  // Vertrag vars
  const [vertragVars,        setVertragVars]        = useState<any>(null);
  const [vertragSubTab,      setVertragSubTab]      = useState<'variablen'|'vorschau'|'versand'>('variablen');
  const [vertragSaving,      setVertragSaving]      = useState(false);
  const [vertragSaved,       setVertragSaved]       = useState(false);
  const [versandBetreff,     setVersandBetreff]     = useState('');
  const [versandAnschreiben, setVersandAnschreiben] = useState('');
  const [showEmailPreview,   setShowEmailPreview]   = useState(false);
  const [isSendingVertrag,   setIsSendingVertrag]   = useState(false);
  const [sendResult,         setSendResult]         = useState<{success:boolean;error?:string}|null>(null);

  // Call logging
  const [showCallPanel, setShowCallPanel] = useState(false);
  const [callNote,      setCallNote]      = useState('');
  const [callSaving,    setCallSaving]    = useState(false);

  useEffect(() => { loadLeadDetails(); }, [leadId]);

  const loadLeadDetails = async () => {
    setLoading(true);
    try {
      const [{ data: ld }, { data: ev }, { data: vt }, { data: se }] = await Promise.all([
        supabase.from('leads').select('*').eq('id', leadId).single(),
        supabase.from('lead_events').select('*').eq('lead_id', leadId).order('created_at', { ascending: false }),
        supabase.from('vertraege').select('*').eq('lead_id', leadId).maybeSingle(),
        supabase.from('scheduled_emails').select('*').eq('lead_id', leadId).order('scheduled_for', { ascending: true }),
      ]);
      if (ld) {
        setLead(ld); setAdminNotes(ld.admin_notes || ''); setActiveTab(getDefaultTab(ld.status));
        const kk = ld.kalkulation || {};
        const bruttoGesamt = kk.bruttopreis ?? kk.totalGross ?? kk.gesamtpreis ?? kk.bruttoGesamt ?? 0;
        const pd = ld.patient_data || {};
        setVertragVars({
          ag_anrede:   ld.anrede_text || ld.anrede || '',
          ag_vorname:  ld.vorname || '',
          ag_nachname: ld.nachname || '',
          ag_street:   lf(ld, 'ag_street'),
          ag_zip:      lf(ld, 'ag_zip'),
          ag_city:     lf(ld, 'ag_city'),
          ag_email:    ld.email || '',
          ag_telefon:  ld.telefon || '',
          le_abweichend: (ld.patient_vorname || ld.patient_nachname || pd.patient_vorname) ? 'ja' : 'nein',
          le_anrede:   ld.patient_anrede || pd.anrede || '',
          le_vorname:  ld.patient_vorname || pd.patient_vorname || '',
          le_nachname: ld.patient_nachname || pd.patient_nachname || '',
          le_street:   ld.patient_street || pd.strasse || '',
          le_zip:      ld.patient_zip || pd.plz || '',
          le_city:     ld.patient_city || pd.ort || '',
          vertrags_beginn:     lf(ld, 'vertrags_beginn'),
          vertrags_dauer_typ:  lf(ld, 'vertrags_ende') ? 'datum' : 'unbegrenzt',
          vertrags_ende:       lf(ld, 'vertrags_ende'),
          tagessatz_override:  lf(ld, 'tagessatz_override'),
          ort_unterzeichnung:  lf(ld, 'ort_unterzeichnung'),
          _bruttoGesamt: bruttoGesamt,
        });
      }
      if (ev) setEvents(ev);
      if (vt) setVertrag(vt);
      if (se) setScheduledEmails(se);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleSetStatus = async (newStatus: string) => {
    setIsSavingStatus(true);
    try {
      await supabase.from('leads').update({ status: newStatus }).eq('id', leadId);
      if (newStatus === 'nicht_interessiert')
        await supabase.from('scheduled_emails').update({ status: 'cancelled' }).eq('lead_id', leadId).eq('status', 'pending');
      await loadLeadDetails();
    } catch (e) { console.error(e); }
    setIsSavingStatus(false);
  };

  const handleLogCall = async (result: 'erfolgreich' | 'nicht_erreicht' | 'callback') => {
    setCallSaving(true);
    const labels = { erfolgreich: 'Anruf erfolgreich', nicht_erreicht: 'Nicht erreicht', callback: 'Rückruf vereinbart' };
    await supabase.from('lead_events').insert({ lead_id: leadId, event_type: `anruf_${result}`, metadata: { ergebnis: labels[result], notiz: callNote || null } });
    if (result === 'erfolgreich' && lead.status === 'angebot_gesendet')
      await supabase.from('leads').update({ status: 'in_beratung' }).eq('id', leadId);
    await loadLeadDetails();
    setCallSaving(false); setShowCallPanel(false); setCallNote('');
  };

  const handleSaveContact = async () => {
    if (!editedContact) return;
    setIsSavingContact(true);
    try {
      await supabase.rpc('update_lead_contact', { lead_id: leadId, p_vorname: editedContact.vorname || null, p_nachname: editedContact.nachname || null, p_anrede: editedContact.anrede || null, p_anrede_text: editedContact.anrede_text || null });
      const extra: any = {};
      if (editedContact.email   !== lead.email)   extra.email   = editedContact.email   || null;
      if (editedContact.telefon !== lead.telefon) extra.telefon = editedContact.telefon || null;
      // Store ag address in patient_data JSON (columns not yet in schema)
      extra.patient_data = {
        ...(lead.patient_data || {}),
        ag_street: editedContact.ag_street || null,
        ag_zip:    editedContact.ag_zip    || null,
        ag_city:   editedContact.ag_city   || null,
      };
      await supabase.from('leads').update(extra).eq('id', leadId);
      await loadLeadDetails(); setIsEditingContact(false); setEditedContact(null);
    } catch (e) { console.error(e); }
    setIsSavingContact(false);
  };

  const handleSavePatient = async () => {
    if (!editedPatient) return;
    setIsSavingPatient(true);
    try {
      const ep = editedPatient;
      // patient_data: full patient record
      const patient_data = {
        ...(lead.patient_data || {}),
        care_start_date: ep.care_start_date || null,
        // Schritt 1
        anzahl:       ep.anzahl       || null,
        geschlecht:   ep.geschlecht   || null,
        geburtsjahr:  ep.geburtsjahr  || null,
        pflegegrad:   ep.pflegegrad !== '' ? ep.pflegegrad : null,
        gewicht:      ep.gewicht      || null,
        groesse:      ep.groesse      || null,
        p2_geschlecht:  ep.p2_geschlecht  || null,
        p2_geburtsjahr: ep.p2_geburtsjahr || null,
        p2_pflegegrad:  ep.p2_pflegegrad !== '' ? ep.p2_pflegegrad : null,
        p2_gewicht:     ep.p2_gewicht     || null,
        p2_groesse:     ep.p2_groesse     || null,
        // Schritt 2
        mobilitaet:   ep.mobilitaet   || null,
        heben:        ep.heben        || null,
        demenz:       ep.demenz       || null,
        inkontinenz:  ep.inkontinenz  || null,
        nacht:        ep.nacht        || null,
        diagnosen:    ep.diagnosen    || null,
        p2_mobilitaet:  ep.p2_mobilitaet  || null,
        p2_heben:       ep.p2_heben       || null,
        p2_demenz:      ep.p2_demenz      || null,
        p2_inkontinenz: ep.p2_inkontinenz || null,
        p2_nacht:       ep.p2_nacht       || null,
        p2_diagnosen:   ep.p2_diagnosen   || null,
        // Schritt 3
        strasse:      ep.strasse      || null,
        plz:          ep.plz          || null,
        ort:          ep.ort          || null,
        haushalt:     ep.haushalt     || null,
        wohnungstyp:  ep.wohnungstyp  || null,
        urbanisierung: ep.urbanisierung || null,
        familieNahe:  ep.familieNahe  || null,
        pflegedienst: ep.pflegedienst || null,
        internet:     ep.internet     || null,
        unterbringung: ep.unterbringung || null,
        tiere:        ep.tiere        || null,
        aufgaben:     ep.aufgaben     || null,
        // Schritt 4
        wunschGeschlecht: ep.wunschGeschlecht || null,
        rauchen:      ep.rauchen      || null,
        sonstigeWuensche: ep.sonstigeWuensche || null,
      };
      // formularDaten: sync back the landingpage-derived fields
      const existingFd = lead.kalkulation?.formularDaten || {};
      const newFd = {
        ...existingFd,
        betreuung_fuer:    ep.anzahl === '2' ? 'ehepaar' : '1-person',
        pflegegrad:        ep.pflegegrad !== '' ? Number(ep.pflegegrad) : existingFd.pflegegrad ?? null,
        weitere_personen:  ep.weitere_personen  || existingFd.weitere_personen  || null,
        mobilitaet:        ep.mobilitaet        || existingFd.mobilitaet        || null,
        nachteinsaetze:    ep.nacht             || existingFd.nachteinsaetze    || null,
        deutschkenntnisse: ep.deutschkenntnisse || existingFd.deutschkenntnisse || null,
        fuehrerschein:     ep.fuehrerschein     || existingFd.fuehrerschein     || null,
        geschlecht:        ep.wunschGeschlecht  || existingFd.geschlecht        || null,
      };
      const update: any = {
        care_start_timing: ep.care_start_timing || null,
        patient_data,
        patient_street: ep.strasse || null,
        patient_zip:    ep.plz    || null,
        patient_city:   ep.ort    || null,
        special_requirements: ep.sonstigeWuensche || null,
      };
      if (lead.kalkulation) update.kalkulation = { ...lead.kalkulation, formularDaten: newFd };
      const { error } = await supabase.from('leads').update(update).eq('id', leadId);
      if (!error) {
        await loadLeadDetails(); setIsEditingPatient(false); setEditedPatient(null);
        if (lead.kalkulation) setShowNewKalkConfirm(true);
      } else { alert('Fehler: ' + error.message); }
    } catch (e) { console.error(e); }
    setIsSavingPatient(false);
  };

  const handleRecalculateFromPatient = async () => {
    setIsRecalcFromPatient(true);
    try {
      const p = lead.patient_data || {};
      const fd = lead.kalkulation?.formularDaten || {};
      const updatedFd = { ...fd, pflegegrad: p.pflegegrad != null ? Number(p.pflegegrad) : fd.pflegegrad, mobilitaet: p.mobilitaet || fd.mobilitaet, nachteinsaetze: p.nacht || fd.nachteinsaetze, weitere_personen: p.anzahl === '2' ? 'ja' : 'nein' };
      const res = await fetch('/api/kalkulation-berechnen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ formularDaten: updatedFd }) });
      if (res.ok) { const k = await res.json(); await supabase.from('leads').update({ kalkulation: { ...k, formularDaten: updatedFd } }).eq('id', leadId); await loadLeadDetails(); setShowNewKalkConfirm(false); }
    } catch (e) { console.error(e); }
    setIsRecalcFromPatient(false);
  };

  const handleResendAngebot = async () => {
    setIsResendingEmail(true); setEmailResendStatus('idle');
    try {
      const res = await fetch('/api/angebot-anfordern', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadId, sendEmailOnly: true, isResend: true }) });
      setEmailResendStatus(res.ok ? 'success' : 'error');
      if (res.ok) await loadLeadDetails();
    } catch { setEmailResendStatus('error'); }
    setIsResendingEmail(false);
    setTimeout(() => setEmailResendStatus('idle'), 4000);
  };

  const handleSaveNotes = async () => {
    await supabase.from('leads').update({ admin_notes: adminNotes }).eq('id', leadId);
    setIsEditingNotes(false); await loadLeadDetails();
  };

  const handleSaveVars = async () => {
    if (!vertragVars) return;
    setVertragSaving(true);
    try {
      // Store all contract fields in patient_data JSON (columns not yet in schema)
      const update: any = {
        patient_street: vertragVars.le_street || null,
        patient_zip:    vertragVars.le_zip    || null,
        patient_city:   vertragVars.le_city   || null,
        patient_data: {
          ...(lead.patient_data || {}),
          ag_street:          vertragVars.ag_street || null,
          ag_zip:             vertragVars.ag_zip    || null,
          ag_city:            vertragVars.ag_city   || null,
          vertrags_beginn:    vertragVars.vertrags_beginn || null,
          vertrags_ende:      vertragVars.vertrags_dauer_typ === 'datum' ? (vertragVars.vertrags_ende || null) : null,
          ort_unterzeichnung: vertragVars.ort_unterzeichnung || null,
          tagessatz_override: vertragVars.tagessatz_override ? parseFloat(vertragVars.tagessatz_override) : null,
        },
      };
      await supabase.from('leads').update(update).eq('id', leadId);
      setVertragSaved(true);
      setTimeout(() => setVertragSaved(false), 3000);
      await loadLeadDetails();
    } finally { setVertragSaving(false); }
  };

  const handleSendVertrag = async () => {
    setIsSendingVertrag(true); setSendResult(null);
    try {
      const res = await fetch('/api/vertrag-senden', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, subject: versandBetreff || undefined, anschreiben: versandAnschreiben || undefined }),
      });
      const data = await res.json();
      setSendResult({ success: data.success, error: data.emailError || data.error });
      if (data.success) await loadLeadDetails();
    } catch (err) {
      setSendResult({ success: false, error: String(err) });
    } finally { setIsSendingVertrag(false); }
  };

  const handleSaveVertrag = async () => {
    if (!editedVertrag) return;
    setIsSavingVertrag(true);
    try {
      const { error } = await supabase.from('leads').update({ vertrags_beginn: editedVertrag.vertrags_beginn || null }).eq('id', leadId);
      if (!error || error.message?.includes('vertrags_beginn')) { await loadLeadDetails(); setIsEditingVertrag(false); setEditedVertrag(null); }
      else alert('Fehler: ' + error.message);
    } catch (e) { console.error(e); }
    setIsSavingVertrag(false);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[#5C4A32]" /></div>;
  if (!lead)   return <div className="text-center py-12"><p className="text-gray-600">Lead nicht gefunden</p><Button onClick={() => router.push('/admin/leads')} className="mt-4">Zurück</Button></div>;

  const kalk  = lead.kalkulation;
  const info  = getInfoCompleteness(lead);
  const meta  = getStatusMeta(lead.status);
  const allOk = info.kontakt && info.adresse && info.patient && info.vertragsbeginn;

  const inp = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C4A32] text-sm";
  const sel = "w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C4A32]";
  const dataRow = (label: string, value: any) => value != null && value !== '' ? (
    <div key={label}><p className="text-xs text-gray-400">{label}</p><p className="text-sm font-medium text-gray-800 capitalize">{String(value)}</p></div>
  ) : null;

  // Tab-aware email list
  const angebotMails = scheduledEmails.filter(e => ['angebot', 'nachfass_1', 'nachfass_2'].includes(e.email_type));
  const angebotEvents = events.filter(e => e.event_type.startsWith('email_angebot') || e.event_type.startsWith('email_nachfass') || e.event_type.startsWith('anruf'));
  const vertragMails  = scheduledEmails.filter(e => e.email_type === 'vertrag');
  const vertragEvents = events.filter(e => e.event_type.startsWith('email_vertrag'));

  const emailTypLabels: Record<string,string> = { angebot: 'Angebotsmail', nachfass_1: 'Nachfassmail 1', nachfass_2: 'Nachfassmail 2', vertrag: 'Vertragsmail' };
  const mailStatusCfg: Record<string, { label: string; cls: string }> = {
    pending:    { label: 'Geplant',       cls: 'bg-amber-50 text-amber-700' },
    processing: { label: 'Wird gesendet', cls: 'bg-blue-50 text-blue-700' },
    sent:       { label: 'Gesendet',      cls: 'bg-green-50 text-green-700' },
    failed:     { label: 'Fehler',        cls: 'bg-red-50 text-red-700' },
    cancelled:  { label: 'Abgebrochen',   cls: 'bg-gray-100 text-gray-500' },
  };
  const eventCfg: Record<string, { label: string; color: string }> = {
    angebot_requested:               { label: 'Anfrage eingegangen',       color: 'bg-blue-500' },
    info_requested:                  { label: 'Info angefordert',           color: 'bg-blue-400' },
    email_eingangsbestaetigung_sent: { label: 'Bestätigung gesendet',      color: 'bg-green-500' },
    email_angebot_scheduled:         { label: 'Angebotsmail terminiert',   color: 'bg-amber-500' },
    email_angebot_sent:              { label: 'Angebot gesendet',          color: 'bg-green-500' },
    email_angebot_failed:            { label: 'Angebot fehlgeschlagen',    color: 'bg-red-500' },
    email_nachfass_1_sent:           { label: 'Nachfassmail 1 gesendet',   color: 'bg-green-500' },
    email_nachfass_2_sent:           { label: 'Nachfassmail 2 gesendet',   color: 'bg-green-500' },
    email_vertrag_gesendet:          { label: 'Vertrag gesendet',          color: 'bg-indigo-500' },
    email_vertrag_failed:            { label: 'Vertrag fehlgeschlagen',    color: 'bg-red-500' },
    anruf_erfolgreich:               { label: 'Anruf erfolgreich',         color: 'bg-[#5C4A32]' },
    anruf_nicht_erreicht:            { label: 'Nicht erreicht',            color: 'bg-gray-400' },
    anruf_callback:                  { label: 'Rückruf vereinbart',        color: 'bg-amber-500' },
    team_notified:                   { label: 'Team benachrichtigt',       color: 'bg-[#5C4A32]' },
    betreuung_beauftragt:            { label: 'Betreuung beauftragt',      color: 'bg-green-700' },
  };

  function EventTimeline({ items }: { items: typeof events }) {
    if (!items.length) return <p className="text-sm text-gray-400">Keine Einträge</p>;
    return (
      <div className="space-y-0">
        {items.map((ev, idx) => {
          const cfg = eventCfg[ev.event_type] ?? { label: ev.event_type.replace(/_/g, ' '), color: 'bg-[#5C4A32]' };
          return (
            <div key={ev.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full ${cfg.color} flex items-center justify-center flex-shrink-0`}><Clock className="w-3.5 h-3.5 text-white" /></div>
                {idx < items.length - 1 && <div className="w-px flex-1 bg-gray-200 my-1" />}
              </div>
              <div className="flex-1 min-w-0 pb-3">
                <p className="text-sm font-medium text-gray-900">{cfg.label}</p>
                <p className="text-xs text-gray-400">{new Date(ev.created_at).toLocaleString('de-DE')}</p>
                {ev.metadata && Object.keys(ev.metadata).filter(k => ev.metadata[k]).length > 0 && (
                  <div className="mt-1 bg-gray-50 border border-gray-100 rounded px-2 py-1.5 space-y-0.5">
                    {Object.entries(ev.metadata).filter(([,v]) => v).map(([k, v]) => (
                      <div key={k} className="flex gap-2 text-xs"><span className="text-gray-400">{k}:</span><span className="text-gray-700 break-all">{String(v)}</span></div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function MailList({ mails }: { mails: typeof scheduledEmails }) {
    if (!mails.length) return <p className="text-sm text-gray-400 italic">Noch keine Mails</p>;
    return (
      <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
        {mails.map(m => {
          const c = mailStatusCfg[m.status] ?? { label: m.status, cls: 'bg-gray-100 text-gray-500' };
          const date = m.status === 'sent' ? m.sent_at : m.scheduled_for;
          return (
            <div key={m.id} className="flex items-center gap-2 px-3 py-2.5 bg-white">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{emailTypLabels[m.email_type] ?? m.email_type}</p>
                {date && <p className="text-xs text-gray-400">{m.status === 'sent' ? 'Gesendet' : 'Geplant'}: {new Date(date).toLocaleString('de-DE')}</p>}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${c.cls}`}>{c.label}</span>
            </div>
          );
        })}
      </div>
    );
  }

  // ─── JSX ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/admin/leads')} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />Zurück
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {[lead.anrede_text || lead.anrede, lead.vorname, lead.nachname].filter(Boolean).join(' ') || `Lead #${lead.id.slice(0, 8)}`}
            </h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />{meta.label}
              </span>
              <span className="text-xs text-gray-400"><Calendar className="w-3 h-3 inline mr-1" />{new Date(lead.created_at).toLocaleDateString('de-DE')}</span>
              {lead.email   && <span className="text-xs text-gray-400"><Mail className="w-3 h-3 inline mr-1" />{lead.email}</span>}
              {lead.telefon && <span className="text-xs text-gray-400"><Phone className="w-3 h-3 inline mr-1" />{lead.telefon}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-0 -mb-px">
          {([
            { key: 'lead',    label: 'Lead',    icon: User },
            { key: 'vertrag', label: 'Vertrag', icon: FileText },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-[#5C4A32] text-[#5C4A32]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </nav>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          TAB: LEAD
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'lead' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left: Kontakt + Patient */}
          <div className="lg:col-span-2 space-y-5">

            {/* Kontaktdaten */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900">Kontaktdaten</h2>
                {!isEditingContact && (
                  <Button variant="outline" size="sm" onClick={() => { setEditedContact({ vorname: lead.vorname||'', nachname: lead.nachname||'', anrede: lead.anrede||'', anrede_text: lead.anrede_text||'', email: lead.email||'', telefon: lead.telefon||'', ag_street: lf(lead,'ag_street'), ag_zip: lf(lead,'ag_zip'), ag_city: lf(lead,'ag_city') }); setIsEditingContact(true); }} className="flex items-center gap-1.5 text-xs">
                    <Edit className="w-3.5 h-3.5" />Bearbeiten
                  </Button>
                )}
              </div>

              {isEditingContact ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Anrede</label>
                      <select value={editedContact.anrede} onChange={e => setEditedContact({ ...editedContact, anrede: e.target.value })} className={sel}>
                        <option value="">Auto</option><option>Herr</option><option>Frau</option><option>Familie</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Vorname</label>
                      <input type="text" value={editedContact.vorname} onChange={e => setEditedContact({ ...editedContact, vorname: e.target.value })} className={inp} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Nachname</label>
                      <input type="text" value={editedContact.nachname} onChange={e => setEditedContact({ ...editedContact, nachname: e.target.value })} className={inp} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Individuelle Anrede</label>
                    <input type="text" value={editedContact.anrede_text||''} onChange={e => setEditedContact({ ...editedContact, anrede_text: e.target.value })} placeholder="z.B. Sehr geehrte Frau Schmidt" className={inp} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs text-gray-500 block mb-1">E-Mail</label><input type="email" value={editedContact.email||''} onChange={e => setEditedContact({ ...editedContact, email: e.target.value })} className={inp} /></div>
                    <div><label className="text-xs text-gray-500 block mb-1">Telefon</label><input type="tel" value={editedContact.telefon||''} onChange={e => setEditedContact({ ...editedContact, telefon: e.target.value })} className={inp} /></div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#5C4A32] uppercase tracking-wide mb-2">Anschrift AG (für Vertrag)</p>
                    <input type="text" placeholder="Straße + Nr." value={editedContact.ag_street||''} onChange={e => setEditedContact({ ...editedContact, ag_street: e.target.value })} className={`${inp} mb-2`} />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="PLZ" value={editedContact.ag_zip||''} onChange={e => setEditedContact({ ...editedContact, ag_zip: e.target.value })} className={inp} />
                      <input type="text" placeholder="Ort" value={editedContact.ag_city||''} onChange={e => setEditedContact({ ...editedContact, ag_city: e.target.value })} className={inp} />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button onClick={handleSaveContact} disabled={isSavingContact} className="flex-1 bg-[#5C4A32] hover:bg-[#4A3A28]">
                      {isSavingContact ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}Speichern
                    </Button>
                    <Button variant="outline" onClick={() => { setIsEditingContact(false); setEditedContact(null); }} className="flex-1"><X className="w-4 h-4 mr-2" />Abbrechen</Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                  {lead.anrede      && <div><p className="text-xs text-gray-400">Anrede</p><p className="text-sm font-medium">{lead.anrede}</p></div>}
                  {lead.vorname     && <div><p className="text-xs text-gray-400">Vorname</p><p className="text-sm font-medium">{lead.vorname}</p></div>}
                  {lead.nachname    && <div><p className="text-xs text-gray-400">Nachname</p><p className="text-sm font-medium">{lead.nachname}</p></div>}
                  {lead.anrede_text && <div><p className="text-xs text-gray-400">Individuelle Anrede</p><p className="text-sm font-medium">{lead.anrede_text}</p></div>}
                  <div><p className="text-xs text-gray-400">E-Mail</p><p className="text-sm font-medium">{lead.email}</p></div>
                  {lead.telefon     && <div><p className="text-xs text-gray-400">Telefon</p><p className="text-sm font-medium">{lead.telefon}</p></div>}
                  {(lf(lead,'ag_street') || lf(lead,'ag_city')) ? (
                    <div className="col-span-2"><p className="text-xs text-gray-400">Anschrift AG</p><p className="text-sm font-medium">{[lf(lead,'ag_street'), [lf(lead,'ag_zip'), lf(lead,'ag_city')].filter(Boolean).join(' ')].filter(Boolean).join(', ')}</p></div>
                  ) : (
                    <div className="col-span-2 text-xs text-amber-600 italic flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />Anschrift für Vertrag noch nicht hinterlegt</div>
                  )}
                </div>
              )}
            </Card>

            {/* Patient */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900">Patient & Einsatzort</h2>
                {!isEditingPatient && (
                  <Button variant="outline" size="sm" onClick={() => {
                    const p = lead.patient_data || {}; const fd2 = lead.kalkulation?.formularDaten || {};
                    setPatientEditInitial({
                      pflegegrad:  String(p.pflegegrad  ?? fd2.pflegegrad  ?? ''),
                      mobilitaet:  p.mobilitaet  || fd2.mobilitaet    || '',
                      nacht:       p.nacht        || fd2.nachteinsaetze || '',
                      anzahl:      p.anzahl       || (fd2.betreuung_fuer === 'ehepaar' ? '2' : '1'),
                    });
                    setEditedPatient({
                      // Allgemeines (formularDaten)
                      care_start_timing: lead.care_start_timing || '',
                      care_start_date:   p.care_start_date || '',
                      weitere_personen:  fd2.weitere_personen  || '',
                      deutschkenntnisse: fd2.deutschkenntnisse || '',
                      fuehrerschein:     fd2.fuehrerschein     || '',
                      // Schritt 1: Zur Person
                      anzahl:       p.anzahl || (fd2.betreuung_fuer === 'ehepaar' ? '2' : '1'),
                      geschlecht:   p.geschlecht   || '',
                      geburtsjahr:  p.geburtsjahr  || '',
                      pflegegrad:   p.pflegegrad   ?? fd2.pflegegrad ?? '',
                      gewicht:      p.gewicht      || '',
                      groesse:      p.groesse      || '',
                      p2_geschlecht:  p.p2_geschlecht  || '',
                      p2_geburtsjahr: p.p2_geburtsjahr || '',
                      p2_pflegegrad:  p.p2_pflegegrad  ?? '',
                      p2_gewicht:     p.p2_gewicht     || '',
                      p2_groesse:     p.p2_groesse     || '',
                      // Schritt 2: Pflegebedarf
                      mobilitaet:   p.mobilitaet   || fd2.mobilitaet    || '',
                      heben:        p.heben        || '',
                      demenz:       p.demenz       || '',
                      inkontinenz:  p.inkontinenz  || '',
                      nacht:        p.nacht        || fd2.nachteinsaetze || '',
                      diagnosen:    p.diagnosen    || '',
                      p2_mobilitaet:  p.p2_mobilitaet  || '',
                      p2_heben:       p.p2_heben       || '',
                      p2_demenz:      p.p2_demenz      || '',
                      p2_inkontinenz: p.p2_inkontinenz || '',
                      p2_nacht:       p.p2_nacht       || '',
                      p2_diagnosen:   p.p2_diagnosen   || '',
                      // Schritt 3: Wohnsituation
                      strasse:      p.strasse      || lead.patient_street || '',
                      plz:          p.plz          || lead.patient_zip    || '',
                      ort:          p.ort          || lead.patient_city   || '',
                      haushalt:     p.haushalt     || '',
                      wohnungstyp:  p.wohnungstyp  || '',
                      urbanisierung: p.urbanisierung || '',
                      familieNahe:  p.familieNahe  || '',
                      pflegedienst: p.pflegedienst || '',
                      internet:     p.internet     || '',
                      unterbringung: p.unterbringung || '',
                      tiere:        p.tiere        || '',
                      aufgaben:     p.aufgaben     || '',
                      // Schritt 4: Wünsche
                      wunschGeschlecht: p.wunschGeschlecht || fd2.geschlecht || '',
                      rauchen:      p.rauchen      || '',
                      sonstigeWuensche: p.sonstigeWuensche || lead.special_requirements || '',
                    });
                    setIsEditingPatient(true);
                  }} className="flex items-center gap-1.5 text-xs">
                    <Edit className="w-3.5 h-3.5" />Bearbeiten
                  </Button>
                )}
              </div>

              {isEditingPatient ? (
                <div className="space-y-0">
                  {(() => {
                    const ep = editedPatient;
                    const set = (k: string, v: any) => setEditedPatient((prev: any) => ({ ...prev, [k]: v }));
                    // Chip: small pill toggle
                    const chip = (active: boolean) =>
                      `px-2.5 py-1 rounded-full border text-xs font-medium transition-colors ${
                        active ? 'border-[#5C4A32] ring-1 ring-[#5C4A32] text-[#5C4A32] bg-white' : 'border-gray-200 text-gray-500 bg-white hover:border-gray-300'
                      }`;
                    // Price-relevant badge
                    const EuroTag = () => <span className="ml-1 px-1 py-0.5 rounded text-[9px] font-semibold bg-amber-100 text-amber-700 leading-none">€</span>;
                    // Compact section header
                    const SH = ({ n, label }: { n: string; label: string }) => (
                      <div className="flex items-center gap-2 py-2.5 border-b border-gray-100 mb-3">
                        <span className="w-5 h-5 rounded-full bg-[#5C4A32]/10 text-[#5C4A32] text-[10px] font-bold flex items-center justify-center flex-shrink-0">{n}</span>
                        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{label}</span>
                      </div>
                    );
                    // Field row: label + content in one line
                    const FR = ({ label, children }: { label: React.ReactNode; children: React.ReactNode }) => (
                      <div className="flex items-center gap-2 min-h-[28px]">
                        <span className="text-xs text-gray-400 w-36 flex-shrink-0 flex items-center">{label}</span>
                        <div className="flex flex-wrap gap-1.5">{children}</div>
                      </div>
                    );
                    // Compact select
                    const CS = ({ value, onChange, children }: any) => (
                      <select value={value} onChange={onChange}
                        className="px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5C4A32] focus:border-[#5C4A32] bg-white">
                        {children}
                      </select>
                    );
                    const years = Array.from({ length: 70 }, (_, i) => String(2000 - i)); // 2000..1931
                    const isTwoPat = ep.anzahl === '2';
                    // Detect price-relevant changes
                    const ini = patientEditInitial;
                    const priceChanged = !!ini && !!lead.kalkulation && (
                      String(ep.pflegegrad) !== ini.pflegegrad ||
                      ep.mobilitaet !== ini.mobilitaet ||
                      ep.nacht      !== ini.nacht ||
                      ep.anzahl     !== ini.anzahl
                    );
                    return (
                      <div className="space-y-0">

                        {/* Price change warning */}
                        {priceChanged && (
                          <div className="mb-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-800">
                            <Euro className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-600" />
                            <span>Preisrelevante Felder geändert — nach dem Speichern bitte die <strong>Kalkulation neu berechnen</strong>.</span>
                          </div>
                        )}

                        {/* ─ Allgemeines ─ */}
                        <div className="pb-4">
                          <SH n="0" label="Allgemeines" />
                          <div className="space-y-2">
                            <FR label="Ab wann?">
                              {([['sofort','Sofort'],['2-4-wochen','2–4 Wo.'],['1-2-monate','1–2 Mon.'],['unklar','Unklar'],['konkretes-datum','Konkretes Datum']] as const).map(([v,l]) => (
                                <button key={v} type="button" onClick={() => { set('care_start_timing', v); if (v !== 'konkretes-datum') set('care_start_date', ''); }} className={chip(ep.care_start_timing===v)}>{l}</button>
                              ))}
                              {ep.care_start_timing === 'konkretes-datum' && (
                                <input
                                  type="text"
                                  placeholder="TT.MM.JJJJ"
                                  value={ep.care_start_date || ''}
                                  onChange={e => set('care_start_date', e.target.value)}
                                  className="px-2 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5C4A32] focus:border-[#5C4A32] bg-white w-28"
                                />
                              )}
                            </FR>
                          </div>
                        </div>

                        {/* ─ Schritt 1: Zur Person ─ */}
                        <div className="pb-4">
                          <SH n="1" label="Zur Person" />
                          <div className="space-y-2">
                            <FR label={<>Anzahl Patienten<EuroTag /></>}>
                              {([['1','1 Person'],['2','2 Personen']] as const).map(([v,l]) => (
                                <button key={v} type="button" onClick={() => set('anzahl',v)} className={chip(ep.anzahl===v)}>{l}</button>
                              ))}
                            </FR>
                          </div>

                          {/* Patient 1 */}
                          <div className="mt-3 bg-gray-50 rounded-lg p-3 space-y-2">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase">Patient 1</p>
                            <FR label="Geschlecht">
                              {([['maennlich','Männlich'],['weiblich','Weiblich']] as const).map(([v,l]) => (
                                <button key={v} type="button" onClick={() => set('geschlecht',v)} className={chip(ep.geschlecht===v)}>{l}</button>
                              ))}
                            </FR>
                            <FR label="Geburtsjahr">
                              <CS value={ep.geburtsjahr} onChange={(e:any)=>set('geburtsjahr',e.target.value)}>
                                <option value="">–</option>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                              </CS>
                            </FR>
                            <FR label="Gewicht">
                              {([['unter-50','Unter 50 kg'],['50-70','50–70 kg'],['70-90','70–90 kg'],['90-110','90–110 kg'],['ueber-110','Über 110 kg']] as const).map(([v,l]) => (
                                <button key={v} type="button" onClick={() => set('gewicht',v)} className={chip(ep.gewicht===v)}>{l}</button>
                              ))}
                            </FR>
                            <FR label="Größe">
                              {([['unter-155','Unter 155 cm'],['155-165','155–165 cm'],['165-175','165–175 cm'],['175-185','175–185 cm'],['ueber-185','Über 185 cm']] as const).map(([v,l]) => (
                                <button key={v} type="button" onClick={() => set('groesse',v)} className={chip(ep.groesse===v)}>{l}</button>
                              ))}
                            </FR>
                            <div>
                              <label className="text-[10px] text-gray-400 flex items-center gap-1 mb-1">Pflegegrad<EuroTag /></label>
                              <div className="flex flex-wrap gap-1.5">
                                {([['','Kein/e'],['1','Pflegegrad 1'],['2','Pflegegrad 2'],['3','Pflegegrad 3'],['4','Pflegegrad 4'],['5','Pflegegrad 5']] as const).map(([v,l]) => (
                                  <button key={v} type="button" onClick={() => set('pflegegrad',v)} className={chip(String(ep.pflegegrad)===v || (v==='' && (ep.pflegegrad==='' || ep.pflegegrad==null)))}>{l}</button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Patient 2 */}
                          {isTwoPat && (
                            <div className="mt-2 bg-blue-50 rounded-lg p-3 space-y-2">
                              <p className="text-[10px] font-semibold text-gray-400 uppercase">Patient 2</p>
                              <FR label="Geschlecht">
                                {([['maennlich','Männlich'],['weiblich','Weiblich']] as const).map(([v,l]) => (
                                  <button key={v} type="button" onClick={() => set('p2_geschlecht',v)} className={chip(ep.p2_geschlecht===v)}>{l}</button>
                                ))}
                              </FR>
                              <FR label="Geburtsjahr">
                                <CS value={ep.p2_geburtsjahr} onChange={(e:any)=>set('p2_geburtsjahr',e.target.value)}>
                                  <option value="">–</option>
                                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </CS>
                              </FR>
                              <FR label="Gewicht">
                                {([['unter-50','Unter 50 kg'],['50-70','50–70 kg'],['70-90','70–90 kg'],['90-110','90–110 kg'],['ueber-110','Über 110 kg']] as const).map(([v,l]) => (
                                  <button key={v} type="button" onClick={() => set('p2_gewicht',v)} className={chip(ep.p2_gewicht===v)}>{l}</button>
                                ))}
                              </FR>
                              <FR label="Größe">
                                {([['unter-155','Unter 155 cm'],['155-165','155–165 cm'],['165-175','165–175 cm'],['175-185','175–185 cm'],['ueber-185','Über 185 cm']] as const).map(([v,l]) => (
                                  <button key={v} type="button" onClick={() => set('p2_groesse',v)} className={chip(ep.p2_groesse===v)}>{l}</button>
                                ))}
                              </FR>
                              <div>
                                <label className="text-[10px] text-gray-400 block mb-1">Pflegegrad</label>
                                <div className="flex flex-wrap gap-1.5">
                                  {([['','Kein/e'],['1','Pflegegrad 1'],['2','Pflegegrad 2'],['3','Pflegegrad 3'],['4','Pflegegrad 4'],['5','Pflegegrad 5']] as const).map(([v,l]) => (
                                    <button key={v} type="button" onClick={() => set('p2_pflegegrad',v)} className={chip(String(ep.p2_pflegegrad)===v || (v==='' && (ep.p2_pflegegrad==='' || ep.p2_pflegegrad==null)))}>{l}</button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* ─ Schritt 2: Pflegebedarf ─ */}
                        <div className="pb-4">
                          <SH n="2" label="Pflegebedarf" />
                          <div className="space-y-2">
                            <FR label={<>Mobilität<EuroTag /></>}>
                              {([['rollstuhl','Rollstuhlfähig'],['gehfaehig-mit-hilfe','Gehfähig mit Hilfe'],['bettlaegerig','Bettlägerig'],['mobil','Selbstständig mobil']] as const).map(([v,l]) => (
                                <button key={v} type="button" onClick={() => set('mobilitaet',v)} className={chip(ep.mobilitaet===v)}>{l}</button>
                              ))}
                            </FR>
                            <FR label="Transfer / Heben">
                              {([['ja','Ja'],['nein','Nein']] as const).map(([v,l]) => (
                                <button key={v} type="button" onClick={() => set('heben',v)} className={chip(ep.heben===v)}>{l}</button>
                              ))}
                            </FR>
                            <FR label="Demenz">
                              {([['nein','Nein'],['leichtgradig','Leichtgradig'],['mittelgradig','Mittelgradig'],['schwer','Schwer']] as const).map(([v,l]) => (
                                <button key={v} type="button" onClick={() => set('demenz',v)} className={chip(ep.demenz===v)}>{l}</button>
                              ))}
                            </FR>
                            <FR label="Inkontinenz">
                              {([['nein','Nein'],['harn','Harninkontinenz'],['stuhl','Stuhlinkontinenz'],['beides','Beides']] as const).map(([v,l]) => (
                                <button key={v} type="button" onClick={() => set('inkontinenz',v)} className={chip(ep.inkontinenz===v)}>{l}</button>
                              ))}
                            </FR>
                            <FR label={<>Nachteinsätze<EuroTag /></>}>
                              {([['nein','Nein'],['gelegentlich','Gelegentlich'],['regelmaessig','Regelmäßig']] as const).map(([v,l]) => (
                                <button key={v} type="button" onClick={() => set('nacht',v)} className={chip(ep.nacht===v)}>{l}</button>
                              ))}
                            </FR>
                            <div>
                              <label className="text-xs text-gray-400 block mb-1">Diagnosen / Erkrankungen</label>
                              <textarea rows={2} value={ep.diagnosen} onChange={e=>set('diagnosen',e.target.value)}
                                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5C4A32] resize-none" />
                            </div>
                          </div>
                          {isTwoPat && (
                            <div className="mt-2 bg-blue-50 rounded-lg p-3 space-y-2">
                              <p className="text-[10px] font-semibold text-gray-400 uppercase">Patient 2 – Pflegebedarf</p>
                              <FR label="Mobilität">
                                {([['vollstaendig-mobil','Vollständig mobil'],['gehstock','Am Gehstock'],['rollator','Rollatorfähig'],['rollstuhl','Rollstuhlfähig'],['bettlaegerig','Bettlägerig']] as const).map(([v,l]) => (
                                  <button key={v} type="button" onClick={() => set('p2_mobilitaet',v)} className={chip(ep.p2_mobilitaet===v)}>{l}</button>
                                ))}
                              </FR>
                              <FR label="Transfer">
                                {([['ja','Ja'],['nein','Nein']] as const).map(([v,l]) => (
                                  <button key={v} type="button" onClick={() => set('p2_heben',v)} className={chip(ep.p2_heben===v)}>{l}</button>
                                ))}
                              </FR>
                              <FR label="Demenz">
                                {([['nein','Nein'],['leichtgradig','Leichtgradig'],['mittelgradig','Mittelgradig'],['schwer','Schwer']] as const).map(([v,l]) => (
                                  <button key={v} type="button" onClick={() => set('p2_demenz',v)} className={chip(ep.p2_demenz===v)}>{l}</button>
                                ))}
                              </FR>
                              <FR label="Inkontinenz">
                                {([['nein','Nein'],['harn','Harninkontinenz'],['stuhl','Stuhlinkontinenz'],['beides','Beides']] as const).map(([v,l]) => (
                                  <button key={v} type="button" onClick={() => set('p2_inkontinenz',v)} className={chip(ep.p2_inkontinenz===v)}>{l}</button>
                                ))}
                              </FR>
                              <FR label="Nachteinsätze">
                                {([['nein','Nein'],['bis-1-mal','Bis zu 1 Mal'],['1-2-mal','1–2 Mal'],['mehr-als-2','Mehr als 2']] as const).map(([v,l]) => (
                                  <button key={v} type="button" onClick={() => set('p2_nacht',v)} className={chip(ep.p2_nacht===v)}>{l}</button>
                                ))}
                              </FR>
                              <div><label className="text-[10px] text-gray-400 block mb-1">Diagnosen</label>
                                <textarea rows={2} value={ep.p2_diagnosen} onChange={e=>set('p2_diagnosen',e.target.value)}
                                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5C4A32] resize-none" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* ─ Schritt 3: Wohnsituation ─ */}
                        <div className="pb-4">
                          <SH n="3" label="Wohnsituation" />
                          <div className="space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              <div className="col-span-3"><input type="text" placeholder="Straße + Nr." value={ep.strasse} onChange={(e:any)=>set('strasse',e.target.value)} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5C4A32] focus:border-[#5C4A32]" /></div>
                              <div className="col-span-1"><input type="text" placeholder="PLZ" value={ep.plz} onChange={(e:any)=>set('plz',e.target.value)} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5C4A32] focus:border-[#5C4A32]" /></div>
                              <div className="col-span-2"><input type="text" placeholder="Ort" value={ep.ort} onChange={(e:any)=>set('ort',e.target.value)} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5C4A32] focus:border-[#5C4A32]" /></div>
                            </div>
                            <FR label="Weitere Personen im HH?">
                              <button type="button" onClick={() => { set('weitere_personen','ja'); }} className={chip(ep.weitere_personen==='ja')}>Ja</button>
                              <button type="button" onClick={() => { setEditedPatient((prev: any) => ({ ...prev, weitere_personen: 'nein', haushalt: '' })); }} className={chip(ep.weitere_personen==='nein')}>Nein</button>
                            </FR>
                            {ep.weitere_personen === 'ja' && (
                              <FR label="">
                                {([['ehepartner','Ehepartner/in'],['kinder','Kind/er'],['andere-familienangehoerige','Andere Familienangehörige'],['weitere-personen','Weitere Personen']] as const).map(([v,l]) => (
                                  <button key={v} type="button" onClick={() => set('haushalt',v)} className={chip(ep.haushalt===v)}>{l}</button>
                                ))}
                              </FR>
                            )}
                            <FR label="Wohnungstyp">
                              {([['einfamilienhaus','Einfamilienhaus'],['mehrfamilienhaus','Wohnung / MFH'],['andere','Andere']] as const).map(([v,l]) => (
                                <button key={v} type="button" onClick={() => set('wohnungstyp',v)} className={chip(ep.wohnungstyp===v)}>{l}</button>
                              ))}
                            </FR>
                            <FR label="Unterkunft PK">
                              {([['zimmer-intern','Zimmer in den Räumlichkeiten'],['bereich-intern','Gesamter Bereich'],['zimmer-extern','Zimmer extern'],['bereich-extern','Bereich extern']] as const).map(([v,l]) => (
                                <button key={v} type="button" onClick={() => set('unterbringung',v)} className={chip(ep.unterbringung===v)}>{l}</button>
                              ))}
                            </FR>
                            <FR label="Lage">
                              {([['grossstadt','Großstadt'],['kleinstadt','Kleinstadt'],['dorf-land','Dorf/Land']] as const).map(([v,l]) => (
                                <button key={v} type="button" onClick={() => set('urbanisierung',v)} className={chip(ep.urbanisierung===v)}>{l}</button>
                              ))}
                            </FR>
                            <FR label="Familie in der Nähe">
                              {([['ja','Ja'],['nein','Nein']] as const).map(([v,l]) => (
                                <button key={v} type="button" onClick={() => set('familieNahe',v)} className={chip(ep.familieNahe===v)}>{l}</button>
                              ))}
                            </FR>
                            <FR label="Pflegedienst">
                              {([['ja','Ja'],['nein','Nein'],['geplant','Geplant']] as const).map(([v,l]) => (
                                <button key={v} type="button" onClick={() => set('pflegedienst',v)} className={chip(ep.pflegedienst===v)}>{l}</button>
                              ))}
                            </FR>
                            <FR label="Internet vorhanden">
                              {([['ja','Ja'],['nein','Nein']] as const).map(([v,l]) => (
                                <button key={v} type="button" onClick={() => set('internet',v)} className={chip(ep.internet===v)}>{l}</button>
                              ))}
                            </FR>
                            <FR label="Haustiere">
                              {([['keine','Keine'],['hund','Hund'],['katze','Katze'],['andere','Andere']] as const).map(([v,l]) => (
                                <button key={v} type="button" onClick={() => set('tiere',v)} className={chip(ep.tiere===v)}>{l}</button>
                              ))}
                            </FR>
                            <div>
                              <label className="text-xs text-gray-400 block mb-1">Besondere Aufgaben</label>
                              <textarea rows={2} value={ep.aufgaben} onChange={e=>set('aufgaben',e.target.value)}
                                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5C4A32] resize-none" />
                            </div>
                          </div>
                        </div>

                        {/* ─ Schritt 4: Wünsche zur PK ─ */}
                        <div className="pb-2">
                          <SH n="4" label="Wünsche zur Pflegekraft" />
                          <div className="space-y-2">
                            <FR label="Geschlecht PK">
                              {([['egal','Egal'],['weiblich','Weiblich'],['maennlich','Männlich']] as const).map(([v,l]) => (
                                <button key={v} type="button" onClick={() => set('wunschGeschlecht',v)} className={chip(ep.wunschGeschlecht===v)}>{l}</button>
                              ))}
                            </FR>
                            <FR label="Sprachniveau PK">
                              {([['grundlegend','Grundlegend'],['kommunikativ','Kommunikativ'],['gut','Gut']] as const).map(([v,l]) => (
                                <button key={v} type="button" onClick={() => set('deutschkenntnisse',v)} className={chip(ep.deutschkenntnisse===v)}>{l}</button>
                              ))}
                            </FR>
                            <FR label="Führerschein PK">
                              {([['ja','Ja'],['nein','Nein'],['egal','Egal']] as const).map(([v,l]) => (
                                <button key={v} type="button" onClick={() => set('fuehrerschein',v)} className={chip(ep.fuehrerschein===v)}>{l}</button>
                              ))}
                            </FR>
                            <FR label="Rauchen erlaubt">
                              {([['ja','Ja'],['nein','Nein']] as const).map(([v,l]) => (
                                <button key={v} type="button" onClick={() => set('rauchen',v)} className={chip(ep.rauchen===v)}>{l}</button>
                              ))}
                            </FR>
                            <div>
                              <label className="text-xs text-gray-400 block mb-1">Sonstige Wünsche</label>
                              <textarea rows={2} value={ep.sonstigeWuensche} onChange={e=>set('sonstigeWuensche',e.target.value)}
                                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#5C4A32] resize-none" />
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-3 border-t border-gray-100">
                          <Button onClick={handleSavePatient} disabled={isSavingPatient} className="flex-1 bg-[#5C4A32] hover:bg-[#4A3A28]">
                            {isSavingPatient ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}Speichern
                          </Button>
                          <Button variant="outline" onClick={() => { setIsEditingPatient(false); setEditedPatient(null); }} className="flex-1"><X className="w-4 h-4 mr-2" />Abbrechen</Button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                (() => {
                  const p  = lead.patient_data || {};
                  const fd = lead.kalkulation?.formularDaten || {};

                  // Label maps
                  const careStartL: Record<string,string> = { sofort:'Sofort', '2-4-wochen':'In 2–4 Wochen', '1-2-monate':'In 1–2 Monaten', unklar:'Noch unklar', '1-2-wochen':'In 1–2 Wochen', '1-monat':'In etwa 1 Monat', planen:'Ich plane voraus' };
                  const patientenL: Record<string,string> = { '1-person':'1 Person', 'ehepaar':'Ehepaar / 2 Personen', '2-person':'2 Personen' };
                  const mobilitL: Record<string,string>   = { mobil:'Mobil', rollator:'Rollator', rollstuhl:'Rollstuhl', bettlaegerig:'Bettlägerig', eingeschraenkt:'Eingeschränkt' };
                  const nachteinsL: Record<string,string> = { nein:'Nein', gelegentlich:'Gelegentlich', taeglich:'Täglich', mehrmals:'Mehrmals/Nacht', regelmaessig:'Regelmäßig' };
                  const deutschL: Record<string,string>   = { grundlegend:'Grundlegend', kommunikativ:'Kommunikativ', 'sehr-gut':'Sehr gut', gut:'Gut', fliessend:'Fließend' };
                  const pkGeschlechtL: Record<string,string> = { egal:'Egal', weiblich:'Weiblich', maennlich:'Männlich' };
                  const patGeschlechtL: Record<string,string> = { maennlich:'Männlich', weiblich:'Weiblich', divers:'Divers' };
                  const jaNeinL: Record<string,string>    = { ja:'Ja', nein:'Nein', egal:'Egal' };

                  // Derived values
                  const careStart      = lead.care_start_timing ? (careStartL[lead.care_start_timing] || lead.care_start_timing) : null;
                  const pflegegrad     = p.pflegegrad != null ? p.pflegegrad : (fd.pflegegrad != null ? fd.pflegegrad : null);
                  const mobilitaet     = p.mobilitaet || fd.mobilitaet || null;
                  const nacht          = p.nacht || fd.nachteinsaetze || null;
                  // fd.geschlecht = desired PK gender (NOT patient gender)
                  const wunschGeschlecht = p.wunschGeschlecht || fd.geschlecht || null;
                  const strasse        = p.strasse || lead.patient_street || null;
                  const plz            = p.plz    || lead.patient_zip    || null;
                  const ort            = p.ort    || lead.patient_city   || null;

                  const has = pflegegrad != null || mobilitaet || careStart || fd.betreuung_fuer || p.geschlecht;
                  if (!has) return <p className="text-sm text-gray-400 italic">Noch keine Daten. Bitte ausfüllen.</p>;

                  const SHr = ({ label }: { label: string }) => (
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2 mt-3 first:mt-0">{label}</p>
                  );
                  return (
                    <div className="space-y-0">

                      {/* Allgemeines */}
                      {(careStart || p.care_start_date || fd.deutschkenntnisse || fd.fuehrerschein) && (
                        <div>
                          <SHr label="Allgemeines" />
                          <div className="grid grid-cols-3 gap-3">
                            {dataRow('Ab wann', careStart)}
                            {p.care_start_date && dataRow('Startdatum', new Date(p.care_start_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }))}
                            {fd.betreuung_fuer && dataRow('Patienten', patientenL[fd.betreuung_fuer] || fd.betreuung_fuer)}
                            {fd.deutschkenntnisse && dataRow('Deutschkenntnisse PK', deutschL[fd.deutschkenntnisse] || fd.deutschkenntnisse)}
                            {fd.fuehrerschein && dataRow('Führerschein PK', jaNeinL[fd.fuehrerschein] || fd.fuehrerschein)}
                          </div>
                        </div>
                      )}

                      {/* Zur Person */}
                      {(p.geschlecht || p.geburtsjahr || pflegegrad != null || p.anzahl) && (
                        <div>
                          <SHr label="Zur Person" />
                          <div className="grid grid-cols-3 gap-3">
                            {p.anzahl && dataRow('Anzahl', p.anzahl === '2' ? '2 Personen' : '1 Person')}
                            {dataRow('Geschlecht Patient', patGeschlechtL[p.geschlecht||''] || p.geschlecht)}
                            {dataRow('Geburtsjahr', p.geburtsjahr)}
                            {dataRow('Pflegegrad', pflegegrad != null ? `PG ${pflegegrad}` : null)}
                            {dataRow('Gewicht', p.gewicht ? `${p.gewicht} kg` : null)}
                            {dataRow('Größe', p.groesse ? `${p.groesse} cm` : null)}
                          </div>
                        </div>
                      )}

                      {/* Pflegebedarf */}
                      {(mobilitaet || p.heben || p.demenz || p.inkontinenz || nacht) && (
                        <div>
                          <SHr label="Pflegebedarf" />
                          <div className="grid grid-cols-3 gap-3">
                            {dataRow('Mobilität', mobilitL[mobilitaet||''] || mobilitaet)}
                            {dataRow('Transfer', p.heben)}
                            {dataRow('Demenz', p.demenz)}
                            {dataRow('Inkontinenz', jaNeinL[p.inkontinenz||''] || p.inkontinenz)}
                            {dataRow('Nachteinsätze', nachteinsL[nacht||''] || nacht)}
                          </div>
                          {p.diagnosen && <p className="mt-1 text-xs text-gray-600 bg-gray-50 rounded p-2">{p.diagnosen}</p>}
                        </div>
                      )}

                      {/* Wohnsituation */}
                      {(strasse || plz || p.wohnungstyp || p.haushalt || p.familieNahe) && (
                        <div>
                          <SHr label="Wohnsituation" />
                          <div className="grid grid-cols-3 gap-3">
                            {dataRow('Adresse', [strasse, plz && ort ? `${plz} ${ort}` : plz || ort].filter(Boolean).join(', '))}
                            {(() => {
                              const haushaltL: Record<string,string> = { 'ehepartner':'Ehepartner/in', 'kinder':'Kind/er', 'andere-familienangehoerige':'Andere Familienangehörige', 'weitere-personen':'Weitere Personen', 'alleine-lebend':'Alleine lebend' };
                              const haushaltVal = fd.weitere_personen === 'nein' ? 'Alleine lebend' : (p.haushalt ? (haushaltL[p.haushalt] || p.haushalt) : null);
                              return dataRow('Haushalt', haushaltVal);
                            })()}
                            {dataRow('Wohnungstyp', p.wohnungstyp)}
                            {dataRow('Urbanisierung', p.urbanisierung)}
                            {dataRow('Familie nah', jaNeinL[p.familieNahe||''] || p.familieNahe)}
                            {dataRow('Pflegedienst', jaNeinL[p.pflegedienst||''] || p.pflegedienst)}
                            {dataRow('Internet', jaNeinL[p.internet||''] || p.internet)}
                            {dataRow('Unterkunft PK', p.unterbringung)}
                            {dataRow('Haustiere', jaNeinL[p.tiere||''] || p.tiere)}
                          </div>
                          {p.aufgaben && <p className="mt-1 text-xs text-gray-600 bg-gray-50 rounded p-2">{p.aufgaben}</p>}
                        </div>
                      )}

                      {/* Wünsche zur PK */}
                      {(wunschGeschlecht || p.rauchen || p.sonstigeWuensche || lead.special_requirements) && (
                        <div>
                          <SHr label="Wünsche zur Pflegekraft" />
                          <div className="grid grid-cols-3 gap-3">
                            {dataRow('Geschlecht PK', pkGeschlechtL[wunschGeschlecht||''] || wunschGeschlecht)}
                            {dataRow('Rauchen', jaNeinL[p.rauchen||''] || p.rauchen)}
                          </div>
                          {(p.sonstigeWuensche || lead.special_requirements) && (
                            <p className="mt-1 text-xs text-gray-600 bg-gray-50 rounded p-2">{p.sonstigeWuensche || lead.special_requirements}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </Card>

            {/* Kalkulation */}
            {kalk ? (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-gray-900">Kalkulation</h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.open(`/kalkulation/${leadId}`, '_blank')} className="flex items-center gap-1.5 text-xs">
                      <ExternalLink className="w-3.5 h-3.5" />Anzeigen
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleRecalculateFromPatient} disabled={isRecalcFromPatient} className="flex items-center gap-1.5 text-xs">
                      {isRecalcFromPatient ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}Neu berechnen
                    </Button>
                  </div>
                </div>

                {/* Confirm nach Patient-Save */}
                {showNewKalkConfirm && (
                  <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <p className="text-sm text-amber-800 flex-1">Patientendaten geändert — neue Kalkulation erstellen?</p>
                    <Button size="sm" onClick={handleRecalculateFromPatient} disabled={isRecalcFromPatient} className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-7 px-3 flex-shrink-0">
                      {isRecalcFromPatient ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Ja, neu berechnen'}
                    </Button>
                    <button onClick={() => setShowNewKalkConfirm(false)} className="text-amber-400 hover:text-amber-600 flex-shrink-0"><X className="w-4 h-4" /></button>
                  </div>
                )}

                <div className="space-y-2">
                  {kalk.aufschluesselung?.length > 0 && (
                    <>
                      <div className="bg-gray-50 rounded-lg p-3 flex justify-between"><span className="text-sm text-gray-600">Basispreis</span><span className="font-semibold">{(kalk.bruttopreis - kalk.aufschluesselung.reduce((s: number, i: any) => s + i.aufschlag, 0)).toLocaleString('de-DE')} €</span></div>
                      {kalk.aufschluesselung.map((i: any, idx: number) => (
                        <div key={idx} className="bg-blue-50 rounded-lg p-3 flex justify-between"><span className="text-sm text-gray-600">{i.label}</span><span className="font-semibold text-blue-700">+ {i.aufschlag.toLocaleString('de-DE')} €</span></div>
                      ))}
                    </>
                  )}
                  <div className="bg-gray-100 rounded-lg p-3 flex justify-between"><span className="font-semibold text-gray-900">Bruttopreis</span><span className="font-bold text-gray-900">{kalk.bruttopreis?.toLocaleString('de-DE')} €</span></div>
                  {kalk.zuschüsse?.gesamt > 0 && <div className="bg-green-50 rounded-lg p-3 flex justify-between"><span className="text-sm text-gray-600">Entlastungen</span><span className="font-semibold text-green-700">− {kalk.zuschüsse.gesamt.toLocaleString('de-DE')} €</span></div>}
                  <div className="bg-gradient-to-r from-[#5C4A32] to-[#8B7355] rounded-lg p-4 flex justify-between items-center">
                    <span className="font-bold text-white">Eigenanteil / Monat</span>
                    <span className="text-2xl font-bold text-white">{kalk.eigenanteil?.toLocaleString('de-DE')} €</span>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-6 border-dashed">
                <p className="text-gray-400 italic text-sm text-center">Noch keine Kalkulation vorhanden.</p>
              </Card>
            )}

            {/* Zuschüsse */}
            {kalk?.zuschüsse?.items?.length > 0 && (
              <Card className="p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Entlastungen & Zuschüsse</h2>
                <div className="space-y-2">
                  {kalk.zuschüsse.items.map((z: any, idx: number) => (
                    <div key={idx} className={`rounded-lg p-3 ${z.in_kalkulation?'bg-green-50 border border-green-200':'bg-gray-50'}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1"><p className="text-sm font-medium">{z.label}</p>{z.beschreibung && <p className="text-xs text-gray-500 mt-0.5">{z.beschreibung}</p>}</div>
                        <div className="text-right ml-4"><p className="font-bold text-green-700">{z.betrag_monatlich?.toLocaleString('de-DE')} €</p><p className="text-xs text-gray-400">/ Monat</p></div>
                      </div>
                      {z.in_kalkulation && <p className="text-xs text-green-700 font-medium mt-1">✓ In Kalkulation berücksichtigt</p>}
                    </div>
                  ))}
                </div>
              </Card>
            )}

          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">

            {/* Status */}
            <Card className="p-5">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Status</h3>
              <StatusSelect currentStatus={lead.status} saving={isSavingStatus} onSelect={handleSetStatus} />
            </Card>

            {/* Notizen */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Notizen</h3>
                {!isEditingNotes && <button onClick={() => setIsEditingNotes(true)} className="text-gray-400 hover:text-[#5C4A32]"><Edit className="w-4 h-4" /></button>}
              </div>
              {isEditingNotes ? (
                <div className="space-y-2">
                  <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={4} placeholder="z.B. Rückruf nächste Woche…" className={`${inp} resize-none`} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveNotes} className="flex-1 bg-[#5C4A32] hover:bg-[#4A3A28] text-xs"><Save className="w-3 h-3 mr-1" />Speichern</Button>
                    <Button size="sm" variant="outline" onClick={() => { setIsEditingNotes(false); setAdminNotes(lead.admin_notes||''); }} className="flex-1 text-xs"><X className="w-3 h-3 mr-1" />Abbrechen</Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{lead.admin_notes || <span className="text-gray-400 italic text-xs">Keine Notizen</span>}</p>
              )}
            </Card>

            {/* Angebot */}
            {kalk && (
              <Card className="p-5">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Angebot</h3>
                <Button onClick={handleResendAngebot} disabled={isResendingEmail} variant="outline" className="w-full flex items-center gap-2 text-sm border-[#5C4A32] text-[#5C4A32] hover:bg-[#5C4A32] hover:text-white">
                  {isResendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}Angebot erneut senden
                </Button>
                {emailResendStatus === 'success' && <p className="text-xs text-green-600 flex items-center gap-1 mt-2"><CheckCircle className="w-3 h-3" />Gesendet</p>}
                {emailResendStatus === 'error'   && <p className="text-xs text-red-600 mt-2">Fehler beim Senden.</p>}
              </Card>
            )}

            {/* Kontakthistorie */}
            <Card className="p-5">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Kontakthistorie</h3>
              {lead.telefon && (
                <div className="mb-4">
                  <button onClick={() => setShowCallPanel(v => !v)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 hover:border-[#5C4A32]/40 text-sm font-medium text-gray-700 transition-colors">
                    <PhoneCall className="w-4 h-4 text-[#5C4A32]" />Anruf notieren — {lead.telefon}
                  </button>
                  {showCallPanel && <CallPanel callNote={callNote} setCallNote={setCallNote} callSaving={callSaving} onCall={handleLogCall} onClose={() => setShowCallPanel(false)} />}
                </div>
              )}
              <EventTimeline items={events} />
            </Card>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB: VERTRAG
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'vertrag' && vertragVars && (() => {
        const tagessatz = vertragVars.tagessatz_override
          ? parseFloat(vertragVars.tagessatz_override)
          : vertragVars._bruttoGesamt > 0 ? vertragVars._bruttoGesamt / 30 : 0;
        const tagessatzFmt = tagessatz > 0
          ? tagessatz.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
          : '_______________';
        const vertragsBeginnFmt = vertragVars.vertrags_beginn
          ? new Date(vertragVars.vertrags_beginn).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
          : '_______________';
        const vertragsDauerFmt = vertragVars.vertrags_dauer_typ === 'datum' && vertragVars.vertrags_ende
          ? `bis zum ${new Date(vertragVars.vertrags_ende).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })} befristet`
          : 'auf unbestimmte Zeit';
        const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const agName = [vertragVars.ag_anrede, vertragVars.ag_vorname, vertragVars.ag_nachname].filter(Boolean).join(' ');
        const agAdresse = [vertragVars.ag_street, [vertragVars.ag_zip, vertragVars.ag_city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
        const leAbweichend = vertragVars.le_abweichend === 'ja' && (vertragVars.le_vorname || vertragVars.le_nachname);
        const leName = [vertragVars.le_anrede, vertragVars.le_vorname, vertragVars.le_nachname].filter(Boolean).join(' ');
        const leAdresse = [vertragVars.le_street, [vertragVars.le_zip, vertragVars.le_city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
        const missingFields: string[] = [];
        if (!agName.trim()) missingFields.push('AG Name');
        if (!agAdresse.trim()) missingFields.push('AG Anschrift');
        if (!vertragVars.vertrags_beginn) missingFields.push('Vertragsbeginn');
        if (vertragVars.vertrags_dauer_typ === 'datum' && !vertragVars.vertrags_ende) missingFields.push('Vertragsende');
        if (!tagessatz) missingFields.push('Tagessatz');
        if (!vertragVars.ort_unterzeichnung) missingFields.push('Ort der Unterzeichnung');
        const sel2 = "w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5C4A32] focus:outline-none";
        const inp2 = "w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5C4A32] focus:outline-none";

        return (
          <div>
            {/* Sub-tabs */}
            <div className="border-b border-gray-200 mb-5">
              <nav className="flex gap-0 -mb-px">
                {([
                  { key: 'variablen', label: 'Variablen',       icon: Edit },
                  { key: 'vorschau',  label: 'Vorschau & Druck', icon: Printer },
                  { key: 'versand',   label: 'Versand',          icon: Send },
                ] as const).map(({ key, label, icon: Icon }) => (
                  <button key={key} onClick={() => setVertragSubTab(key)}
                    className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${vertragSubTab === key ? 'border-[#5C4A32] text-[#5C4A32]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                    <Icon className="w-4 h-4" />{label}
                  </button>
                ))}
              </nav>
            </div>

            {/* SUB-TAB: Variablen */}
            {vertragSubTab === 'variablen' && (
              <div className="max-w-2xl space-y-5">
                {missingFields.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Fehlende Pflichtfelder</p>
                      <p className="text-xs text-amber-700 mt-0.5">{missingFields.join(' · ')}</p>
                    </div>
                  </div>
                )}

                {/* AG */}
                <Card className="p-5">
                  <h3 className="font-semibold text-sm text-[#5C4A32] uppercase tracking-wide mb-4 flex items-center gap-2"><User className="w-4 h-4" />Auftraggeber (AG)</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div><label className="text-xs text-gray-600 block mb-1">Anrede</label>
                        <select value={vertragVars.ag_anrede} onChange={e => setVertragVars({...vertragVars, ag_anrede: e.target.value})} className={sel2}>
                          <option value="">–</option><option>Herr</option><option>Frau</option><option>Familie</option>
                        </select></div>
                      <div><label className="text-xs text-gray-600 block mb-1">Vorname</label><input type="text" value={vertragVars.ag_vorname} onChange={e => setVertragVars({...vertragVars, ag_vorname: e.target.value})} className={inp2} /></div>
                      <div><label className="text-xs text-gray-600 block mb-1">Nachname</label><input type="text" value={vertragVars.ag_nachname} onChange={e => setVertragVars({...vertragVars, ag_nachname: e.target.value})} className={inp2} /></div>
                    </div>
                    <div><label className="text-xs text-gray-600 block mb-1">Straße + Nr.</label><input type="text" value={vertragVars.ag_street} onChange={e => setVertragVars({...vertragVars, ag_street: e.target.value})} className={inp2} /></div>
                    <div className="grid grid-cols-3 gap-3">
                      <div><label className="text-xs text-gray-600 block mb-1">PLZ</label><input type="text" value={vertragVars.ag_zip} onChange={e => setVertragVars({...vertragVars, ag_zip: e.target.value})} className={inp2} /></div>
                      <div className="col-span-2"><label className="text-xs text-gray-600 block mb-1">Ort</label><input type="text" value={vertragVars.ag_city} onChange={e => setVertragVars({...vertragVars, ag_city: e.target.value})} className={inp2} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-xs text-gray-600 block mb-1">E-Mail</label><input type="email" value={vertragVars.ag_email} onChange={e => setVertragVars({...vertragVars, ag_email: e.target.value})} className={inp2} /></div>
                      <div><label className="text-xs text-gray-600 block mb-1">Telefon</label><input type="tel" value={vertragVars.ag_telefon} onChange={e => setVertragVars({...vertragVars, ag_telefon: e.target.value})} className={inp2} /></div>
                    </div>
                  </div>
                </Card>

                {/* LE */}
                <Card className="p-5">
                  <h3 className="font-semibold text-sm text-[#5C4A32] uppercase tracking-wide mb-4 flex items-center gap-2"><User className="w-4 h-4" />Leistungsempfänger (LE)</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Abweichend vom AG?</label>
                      <div className="flex gap-3">
                        {[{v:'nein',l:'Nein – identisch mit AG'},{v:'ja',l:'Ja – eigene Person'}].map(o => (
                          <button key={o.v} type="button" onClick={() => setVertragVars({...vertragVars, le_abweichend: o.v})}
                            className={`flex-1 py-1.5 rounded-md border text-sm font-medium transition-colors ${vertragVars.le_abweichend===o.v?'bg-[#5C4A32] text-white border-[#5C4A32]':'border-gray-300 text-gray-700 hover:border-[#5C4A32]'}`}>{o.l}</button>
                        ))}
                      </div>
                    </div>
                    {vertragVars.le_abweichend === 'ja' && (
                      <>
                        <div className="grid grid-cols-3 gap-3">
                          <div><label className="text-xs text-gray-600 block mb-1">Anrede</label>
                            <select value={vertragVars.le_anrede} onChange={e => setVertragVars({...vertragVars, le_anrede: e.target.value})} className={sel2}>
                              <option value="">–</option><option>Herr</option><option>Frau</option><option>Familie</option>
                            </select></div>
                          <div><label className="text-xs text-gray-600 block mb-1">Vorname LE</label><input type="text" value={vertragVars.le_vorname} onChange={e => setVertragVars({...vertragVars, le_vorname: e.target.value})} className={inp2} /></div>
                          <div><label className="text-xs text-gray-600 block mb-1">Nachname LE</label><input type="text" value={vertragVars.le_nachname} onChange={e => setVertragVars({...vertragVars, le_nachname: e.target.value})} className={inp2} /></div>
                        </div>
                        <div><label className="text-xs text-gray-600 block mb-1">Straße + Nr. (Einsatzort)</label><input type="text" value={vertragVars.le_street} onChange={e => setVertragVars({...vertragVars, le_street: e.target.value})} className={inp2} /></div>
                        <div className="grid grid-cols-3 gap-3">
                          <div><label className="text-xs text-gray-600 block mb-1">PLZ</label><input type="text" value={vertragVars.le_zip} onChange={e => setVertragVars({...vertragVars, le_zip: e.target.value})} className={inp2} /></div>
                          <div className="col-span-2"><label className="text-xs text-gray-600 block mb-1">Ort</label><input type="text" value={vertragVars.le_city} onChange={e => setVertragVars({...vertragVars, le_city: e.target.value})} className={inp2} /></div>
                        </div>
                      </>
                    )}
                  </div>
                </Card>

                {/* Vertragsbedingungen */}
                <Card className="p-5">
                  <h3 className="font-semibold text-sm text-[#5C4A32] uppercase tracking-wide mb-4 flex items-center gap-2"><Calendar className="w-4 h-4" />Vertragsbedingungen</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Vertragsbeginn <span className="text-red-400">*</span></label>
                      <input type="date" value={vertragVars.vertrags_beginn} onChange={e => setVertragVars({...vertragVars, vertrags_beginn: e.target.value})} className={inp2} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 block mb-2">Vertragsdauer</label>
                      <div className="flex gap-3">
                        {[{v:'unbegrenzt',l:'Auf unbestimmte Zeit'},{v:'datum',l:'Bis zu einem Datum'}].map(o => (
                          <button key={o.v} type="button" onClick={() => setVertragVars({...vertragVars, vertrags_dauer_typ: o.v})}
                            className={`flex-1 py-1.5 rounded-md border text-sm font-medium transition-colors ${vertragVars.vertrags_dauer_typ===o.v?'bg-[#5C4A32] text-white border-[#5C4A32]':'border-gray-300 text-gray-700 hover:border-[#5C4A32]'}`}>{o.l}</button>
                        ))}
                      </div>
                      {vertragVars.vertrags_dauer_typ === 'datum' && (
                        <div className="mt-2">
                          <label className="text-xs text-gray-600 block mb-1">Vertragsende <span className="text-red-400">*</span></label>
                          <input type="date" value={vertragVars.vertrags_ende} onChange={e => setVertragVars({...vertragVars, vertrags_ende: e.target.value})} className={inp2} />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Vergütung */}
                <Card className="p-5">
                  <h3 className="font-semibold text-sm text-[#5C4A32] uppercase tracking-wide mb-4 flex items-center gap-2"><Euro className="w-4 h-4" />Vergütung (§4)</h3>
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Bruttopreis aus Kalkulation</p>
                        <p className="font-semibold text-gray-800">{vertragVars._bruttoGesamt > 0 ? vertragVars._bruttoGesamt.toLocaleString('de-DE') + ' €/Monat' : <span className="text-gray-400 italic">Kein Preis hinterlegt</span>}</p>
                      </div>
                      {vertragVars._bruttoGesamt > 0 && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Auto-Tagessatz (÷ 30)</p>
                          <p className="font-semibold text-[#5C4A32]">{(vertragVars._bruttoGesamt/30).toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2})} €/Tag</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Tagessatz manuell überschreiben <span className="text-gray-400">(leer = auto)</span></label>
                      <div className="relative">
                        <input type="number" step="0.01" value={vertragVars.tagessatz_override} onChange={e => setVertragVars({...vertragVars, tagessatz_override: e.target.value})} className={`${inp2} pr-10`} />
                        <span className="absolute right-3 top-2 text-sm text-gray-400">€</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">Im Vertrag: <strong>{tagessatzFmt}/Tag</strong></p>
                    </div>
                  </div>
                </Card>

                {/* Unterzeichnung */}
                <Card className="p-5">
                  <h3 className="font-semibold text-sm text-[#5C4A32] uppercase tracking-wide mb-4 flex items-center gap-2"><MapPin className="w-4 h-4" />Unterzeichnung</h3>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Ort der Unterzeichnung <span className="text-red-400">*</span></label>
                    <input type="text" placeholder="z.B. München" value={vertragVars.ort_unterzeichnung} onChange={e => setVertragVars({...vertragVars, ort_unterzeichnung: e.target.value})} className={inp2} />
                  </div>
                </Card>

                {/* Save + weiter */}
                <div className="flex gap-3 pb-6">
                  <Button onClick={handleSaveVars} disabled={vertragSaving} className="flex-1 bg-[#5C4A32] hover:bg-[#4A3A28] text-white flex items-center gap-2">
                    {vertragSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : vertragSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {vertragSaved ? 'Gespeichert!' : vertragSaving ? 'Speichern…' : 'Speichern'}
                  </Button>
                  <Button variant="outline" onClick={() => setVertragSubTab('vorschau')} className="flex-1 flex items-center gap-2 border-[#5C4A32] text-[#5C4A32]">
                    <Printer className="w-4 h-4" />Zur Vorschau
                  </Button>
                </div>
              </div>
            )}

            {/* SUB-TAB: Vorschau */}
            {vertragSubTab === 'vorschau' && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  {missingFields.length > 0 && (
                    <span className="text-xs text-amber-600 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />{missingFields.join(', ')} fehlen</span>
                  )}
                  <div className="ml-auto flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setVertragSubTab('variablen')} className="text-xs">← Variablen</Button>
                    <Button size="sm" onClick={() => window.print()} className="bg-[#5C4A32] hover:bg-[#4A3A28] text-white text-xs flex items-center gap-1.5">
                      <Printer className="w-3.5 h-3.5" />Als PDF drucken
                    </Button>
                  </div>
                </div>
                <div id="contract-print">
                  <ContractDocument
                    agName={agName} agAdresse={agAdresse} agEmail={vertragVars.ag_email} agTelefon={vertragVars.ag_telefon}
                    leAbweichend={!!leAbweichend} leName={leName} leAdresse={leAdresse} leAnrede={vertragVars.le_anrede}
                    vertragsBeginn={vertragsBeginnFmt} vertragsDauer={vertragsDauerFmt}
                    tagessatzFmt={tagessatzFmt} ortUnterzeichnung={vertragVars.ort_unterzeichnung} today={today}
                  />
                </div>
              </div>
            )}

            {/* SUB-TAB: Versand */}
            {vertragSubTab === 'versand' && (
              <div className="max-w-2xl space-y-4 pb-6">
                {sendResult && (
                  <div className={`rounded-lg p-4 flex items-start gap-3 ${sendResult.success?'bg-green-50 border border-green-200':'bg-red-50 border border-red-200'}`}>
                    {sendResult.success ? <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
                    <div>
                      <p className={`text-sm font-medium ${sendResult.success?'text-green-800':'text-red-800'}`}>{sendResult.success?'Vertrag erfolgreich versendet!':'Fehler beim Versand'}</p>
                      {sendResult.error && <p className="text-xs text-red-700 mt-0.5">{sendResult.error}</p>}
                      {sendResult.success && <p className="text-xs text-green-700 mt-0.5">Vertrag wurde an {lead.email} gesendet.</p>}
                    </div>
                  </div>
                )}
                {missingFields.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">{missingFields.join(' · ')} — Platzhalter bleiben leer.</p>
                  </div>
                )}
                <Card className="p-5">
                  <h3 className="font-semibold text-sm text-[#5C4A32] uppercase tracking-wide mb-3 flex items-center gap-2"><Send className="w-4 h-4" />Empfänger</h3>
                  <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                    <div className="w-9 h-9 rounded-full bg-[#5C4A32] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {(lead.vorname || lead.email || '?')[0].toUpperCase()}
                    </div>
                    <div><p className="text-sm font-medium text-gray-800">{agName || lead.email}</p><p className="text-xs text-gray-500">{lead.email}</p></div>
                  </div>
                </Card>
                <Card className="p-5">
                  <h3 className="font-semibold text-sm text-[#5C4A32] uppercase tracking-wide mb-3 flex items-center gap-2"><FileText className="w-4 h-4" />E-Mail-Inhalt</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p className="text-gray-500">Die E-Mail wird automatisch generiert mit:</p>
                    <ul className="list-none space-y-1.5 mt-2">
                      {[
                        `Tagessatz: ${tagessatzFmt || 'Gemäß Vertrag § 4'}`,
                        'Fahrtkosten: 125 € je Strecke',
                        'Kost & Logis: Frei für die Betreuungsperson',
                        'Feiertage: Doppelter Tagessatz (§ 4.8)',
                        'Sommermonate Juli & August: +200 €/Monat (§ 4.9)',
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[#B5A184] mt-0.5">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
                <Button onClick={handleSendVertrag} disabled={isSendingVertrag}
                  className="w-full bg-[#5C4A32] hover:bg-[#4A3A28] text-white flex items-center justify-center gap-2 py-3">
                  {isSendingVertrag ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {isSendingVertrag ? 'Wird gesendet…' : `Vertrag an ${lead.email} senden`}
                </Button>
              </div>
            )}

            {/* Print styles */}
            <style>{`
              @media print {
                body * { visibility: hidden; }
                #contract-print, #contract-print * { visibility: visible; }
                #contract-print { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
                body { margin: 0; background: white; }
              }
            `}</style>
          </div>
        );
      })()}

    </div>
  );
}
