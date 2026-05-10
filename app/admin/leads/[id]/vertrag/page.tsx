"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Save, Printer, Send, FileText, User, MapPin, Calendar, Euro, Edit, Check, AlertTriangle } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Tab = 'variablen' | 'vorschau' | 'versand';

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'variablen', label: 'Variablen', icon: Edit },
  { id: 'vorschau',  label: 'Vorschau & Druck', icon: Printer },
  { id: 'versand',   label: 'Versand', icon: Send },
];

export default function VertragPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;
  const [lead, setLead]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('variablen');
  const [vars, setVars]   = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]  = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Versand state
  const [versandBetreff, setVersandBetreff] = useState('');
  const [versandAnschreiben, setVersandAnschreiben] = useState('');
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; error?: string } | null>(null);

  const loadLead = async () => {
    const { data } = await supabase.from('leads').select('*').eq('id', leadId).single();
    if (data) {
      setLead(data);
      // Init vars from lead data
      const kalk = data.kalkulation || {};
      const bruttoGesamt = kalk.bruttopreis ?? kalk.totalGross ?? kalk.gesamtpreis ?? kalk.bruttoGesamt ?? 0;
      const pd = data.patient_data || {};
      setVars({
        // AG
        ag_anrede:   data.anrede_text || data.anrede || '',
        ag_vorname:  data.vorname || '',
        ag_nachname: data.nachname || '',
        ag_street:   data.ag_street || '',
        ag_zip:      data.ag_zip || '',
        ag_city:     data.ag_city || '',
        ag_email:    data.email || '',
        ag_telefon:  data.telefon || '',
        // LE
        le_abweichend: data.patient_vorname || data.patient_nachname || pd.patient_vorname ? 'ja' : 'nein',
        le_anrede:   data.patient_anrede || pd.anrede || '',
        le_vorname:  data.patient_vorname || pd.patient_vorname || '',
        le_nachname: data.patient_nachname || pd.patient_nachname || '',
        le_street:   data.patient_street || pd.strasse || '',
        le_zip:      data.patient_zip || pd.plz || '',
        le_city:     data.patient_city || pd.ort || '',
        // Vertrag
        vertrags_beginn: data.vertrags_beginn || '',
        vertrags_dauer_typ: data.vertrags_ende ? 'datum' : 'unbegrenzt',
        vertrags_ende: data.vertrags_ende || '',
        tagessatz_override: data.tagessatz_override || '',
        ort_unterzeichnung: data.ort_unterzeichnung || '',
        // computed
        _bruttoGesamt: bruttoGesamt,
      });
    }
    setLoading(false);
  };

  useEffect(() => { loadLead(); }, [leadId]);

  const handleSave = async () => {
    if (!vars) return;
    setSaving(true);
    try {
      const update: any = {
        vertrags_beginn:     vars.vertrags_beginn || null,
        vertrags_ende:       vars.vertrags_dauer_typ === 'datum' ? (vars.vertrags_ende || null) : null,
        ort_unterzeichnung:  vars.ort_unterzeichnung || null,
        tagessatz_override:  vars.tagessatz_override ? parseFloat(vars.tagessatz_override) : null,
        ag_street: vars.ag_street || null,
        ag_zip:    vars.ag_zip || null,
        ag_city:   vars.ag_city || null,
        patient_street: vars.le_street || null,
        patient_zip:    vars.le_zip || null,
        patient_city:   vars.le_city || null,
      };
      // Graceful fallback for missing columns
      const { error } = await supabase.from('leads').update(update).eq('id', leadId);
      if (error) {
        // Try without new columns
        const safe: any = {};
        if (!error.message.includes('vertrags_beginn')) safe.vertrags_beginn = update.vertrags_beginn;
        await supabase.from('leads').update(safe).eq('id', leadId);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      await loadLead();
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-500">Lade Vertragsdaten…</div>
  );
  if (!lead || !vars) return (
    <div className="p-8 text-center text-gray-500">Lead nicht gefunden.</div>
  );

  const tagessatz = vars.tagessatz_override
    ? parseFloat(vars.tagessatz_override)
    : vars._bruttoGesamt > 0 ? vars._bruttoGesamt / 30 : 0;

  const tagessatzFmt = tagessatz > 0
    ? tagessatz.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
    : '_______________';

  const vertragsBeginnFmt = vars.vertrags_beginn
    ? new Date(vars.vertrags_beginn).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '_______________';

  const vertragsDauerFmt = vars.vertrags_dauer_typ === 'datum' && vars.vertrags_ende
    ? `bis zum ${new Date(vars.vertrags_ende).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })} befristet`
    : 'auf unbestimmte Zeit';

  const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const agName = [vars.ag_anrede, vars.ag_vorname, vars.ag_nachname].filter(Boolean).join(' ');
  const agAdresse = [vars.ag_street, [vars.ag_zip, vars.ag_city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  const leAbweichend = vars.le_abweichend === 'ja' && (vars.le_vorname || vars.le_nachname);
  const leName = [vars.le_anrede, vars.le_vorname, vars.le_nachname].filter(Boolean).join(' ');
  const leAdresse = [vars.le_street, [vars.le_zip, vars.le_city].filter(Boolean).join(' ')].filter(Boolean).join(', ');

  const missingFields: string[] = [];
  if (!agName.trim()) missingFields.push('AG Name');
  if (!agAdresse.trim()) missingFields.push('AG Anschrift');
  if (!vars.vertrags_beginn) missingFields.push('Vertragsbeginn');
  if (vars.vertrags_dauer_typ === 'datum' && !vars.vertrags_ende) missingFields.push('Vertragsende-Datum');
  if (!tagessatz) missingFields.push('Tagessatz / Preis');
  if (!vars.ort_unterzeichnung) missingFields.push('Ort der Unterzeichnung');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm no-print">
        <button
          onClick={() => router.push(`/admin/leads/${leadId}`)}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück
        </button>
        <div className="h-5 w-px bg-gray-300" />
        <FileText className="w-4 h-4 text-[#5C4A32]" />
        <span className="font-semibold text-gray-800">Dienstleistungsvertrag</span>
        <span className="text-gray-400 text-sm">— {agName || lead.email}</span>
        <div className="ml-auto flex items-center gap-2">
          {missingFields.length > 0 && activeTab !== 'vorschau' && (
            <span className="text-xs text-amber-600 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {missingFields.length} Feld{missingFields.length > 1 ? 'er' : ''} fehlen
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b px-4 no-print">
        <div className="flex gap-0">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#5C4A32] text-[#5C4A32]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab: Variablen */}
      {activeTab === 'variablen' && (
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 no-print">

          {missingFields.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Fehlende Pflichtfelder für den Vertrag</p>
                <p className="text-xs text-amber-700 mt-0.5">{missingFields.join(' · ')}</p>
              </div>
            </div>
          )}

          {/* AG */}
          <Card className="p-5">
            <h3 className="font-semibold text-sm text-[#5C4A32] uppercase tracking-wide mb-4 flex items-center gap-2">
              <User className="w-4 h-4" /> Auftraggeber (AG)
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Anrede</label>
                  <select value={vars.ag_anrede} onChange={e => setVars({...vars, ag_anrede: e.target.value})}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5C4A32] focus:outline-none">
                    <option value="">–</option>
                    <option value="Herr">Herr</option>
                    <option value="Frau">Frau</option>
                    <option value="Familie">Familie</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Vorname</label>
                  <input type="text" value={vars.ag_vorname} onChange={e => setVars({...vars, ag_vorname: e.target.value})}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5C4A32] focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Nachname</label>
                  <input type="text" value={vars.ag_nachname} onChange={e => setVars({...vars, ag_nachname: e.target.value})}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5C4A32] focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Straße + Nr.</label>
                <input type="text" placeholder="z.B. Musterstraße 12" value={vars.ag_street} onChange={e => setVars({...vars, ag_street: e.target.value})}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5C4A32] focus:outline-none" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">PLZ</label>
                  <input type="text" placeholder="12345" value={vars.ag_zip} onChange={e => setVars({...vars, ag_zip: e.target.value})}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5C4A32] focus:outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-600 block mb-1">Ort</label>
                  <input type="text" placeholder="Musterstadt" value={vars.ag_city} onChange={e => setVars({...vars, ag_city: e.target.value})}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5C4A32] focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">E-Mail</label>
                  <input type="email" value={vars.ag_email} onChange={e => setVars({...vars, ag_email: e.target.value})}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5C4A32] focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Telefon</label>
                  <input type="tel" value={vars.ag_telefon} onChange={e => setVars({...vars, ag_telefon: e.target.value})}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5C4A32] focus:outline-none" />
                </div>
              </div>
            </div>
          </Card>

          {/* LE */}
          <Card className="p-5">
            <h3 className="font-semibold text-sm text-[#5C4A32] uppercase tracking-wide mb-4 flex items-center gap-2">
              <User className="w-4 h-4" /> Leistungsempfänger (LE)
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 block mb-1">Abweichend vom AG?</label>
                <div className="flex gap-3">
                  {[{v:'nein', l:'Nein – identisch mit AG'},{v:'ja', l:'Ja – eigene Person'}].map(o => (
                    <button key={o.v} type="button"
                      onClick={() => setVars({...vars, le_abweichend: o.v})}
                      className={`flex-1 py-1.5 rounded-md border text-sm font-medium transition-colors ${vars.le_abweichend === o.v ? 'bg-[#5C4A32] text-white border-[#5C4A32]' : 'border-gray-300 text-gray-700 hover:border-[#5C4A32]'}`}>
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>
              {vars.le_abweichend === 'ja' && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Anrede</label>
                      <select value={vars.le_anrede} onChange={e => setVars({...vars, le_anrede: e.target.value})}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5C4A32] focus:outline-none">
                        <option value="">–</option>
                        <option value="Herr">Herr</option>
                        <option value="Frau">Frau</option>
                        <option value="Familie">Familie</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Vorname LE</label>
                      <input type="text" value={vars.le_vorname} onChange={e => setVars({...vars, le_vorname: e.target.value})}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5C4A32] focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Nachname LE</label>
                      <input type="text" value={vars.le_nachname} onChange={e => setVars({...vars, le_nachname: e.target.value})}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5C4A32] focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Straße + Nr. (Einsatzort)</label>
                    <input type="text" placeholder="z.B. Hauptstraße 5" value={vars.le_street} onChange={e => setVars({...vars, le_street: e.target.value})}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5C4A32] focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">PLZ</label>
                      <input type="text" value={vars.le_zip} onChange={e => setVars({...vars, le_zip: e.target.value})}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5C4A32] focus:outline-none" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-600 block mb-1">Ort</label>
                      <input type="text" value={vars.le_city} onChange={e => setVars({...vars, le_city: e.target.value})}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5C4A32] focus:outline-none" />
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Vertragsbedingungen */}
          <Card className="p-5">
            <h3 className="font-semibold text-sm text-[#5C4A32] uppercase tracking-wide mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Vertragsbedingungen
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 block mb-1">Vertragsbeginn <span className="text-red-400">*</span></label>
                <input type="date" value={vars.vertrags_beginn} onChange={e => setVars({...vars, vertrags_beginn: e.target.value})}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5C4A32] focus:outline-none" />
                <p className="text-xs text-gray-400 mt-0.5">→ §3 Abs. 1</p>
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-2">Vertragsdauer</label>
                <div className="flex gap-3">
                  {[
                    { v: 'unbegrenzt', l: 'Auf unbestimmte Zeit' },
                    { v: 'datum',      l: 'Bis zu einem Datum' },
                  ].map(o => (
                    <button key={o.v} type="button"
                      onClick={() => setVars({...vars, vertrags_dauer_typ: o.v})}
                      className={`flex-1 py-1.5 rounded-md border text-sm font-medium transition-colors ${vars.vertrags_dauer_typ === o.v ? 'bg-[#5C4A32] text-white border-[#5C4A32]' : 'border-gray-300 text-gray-700 hover:border-[#5C4A32]'}`}>
                      {o.l}
                    </button>
                  ))}
                </div>
                {vars.vertrags_dauer_typ === 'datum' && (
                  <div className="mt-2">
                    <label className="text-xs text-gray-600 block mb-1">Vertragsende <span className="text-red-400">*</span></label>
                    <input type="date" value={vars.vertrags_ende} onChange={e => setVars({...vars, vertrags_ende: e.target.value})}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5C4A32] focus:outline-none" />
                    <p className="text-xs text-gray-400 mt-0.5">→ §3 Abs. 1</p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Vergütung */}
          <Card className="p-5">
            <h3 className="font-semibold text-sm text-[#5C4A32] uppercase tracking-wide mb-4 flex items-center gap-2">
              <Euro className="w-4 h-4" /> Vergütung (§4)
            </h3>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Bruttopreis aus Kalkulation</p>
                  <p className="font-semibold text-gray-800">
                    {vars._bruttoGesamt > 0
                      ? vars._bruttoGesamt.toLocaleString('de-DE') + ' €/Monat'
                      : <span className="text-gray-400 italic">Kein Preis hinterlegt</span>}
                  </p>
                </div>
                {vars._bruttoGesamt > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Auto-Tagessatz (÷ 30)</p>
                    <p className="font-semibold text-[#5C4A32]">
                      {(vars._bruttoGesamt / 30).toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €/Tag
                    </p>
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">
                  Tagessatz manuell überschreiben
                  <span className="text-gray-400 ml-1">(leer = automatisch aus Kalkulation)</span>
                </label>
                <div className="relative">
                  <input type="number" step="0.01" placeholder={vars._bruttoGesamt > 0 ? (vars._bruttoGesamt/30).toFixed(2) : '0.00'}
                    value={vars.tagessatz_override} onChange={e => setVars({...vars, tagessatz_override: e.target.value})}
                    className="w-full px-2 py-1.5 pr-10 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5C4A32] focus:outline-none" />
                  <span className="absolute right-3 top-2 text-sm text-gray-400">€</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">→ §4 Abs. 1 · Im Vertrag angezeigt: <strong>{tagessatzFmt}/Tag</strong></p>
              </div>
            </div>
          </Card>

          {/* Unterzeichnung */}
          <Card className="p-5">
            <h3 className="font-semibold text-sm text-[#5C4A32] uppercase tracking-wide mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Unterzeichnung
            </h3>
            <div>
              <label className="text-xs text-gray-600 block mb-1">
                Ort der Unterzeichnung <span className="text-red-400">*</span>
                <span className="text-gray-400 ml-1">(erscheint über der Unterschriftslinie)</span>
              </label>
              <input type="text" placeholder="z.B. München" value={vars.ort_unterzeichnung}
                onChange={e => setVars({...vars, ort_unterzeichnung: e.target.value})}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5C4A32] focus:outline-none" />
            </div>
          </Card>

          {/* Save */}
          <div className="flex gap-3 pb-8">
            <Button onClick={handleSave} disabled={saving}
              className="flex-1 bg-[#5C4A32] hover:bg-[#4A3A28] text-white flex items-center gap-2">
              {saving ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : saved ? (
                <Check className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saved ? 'Gespeichert!' : saving ? 'Speichern…' : 'Variablen speichern'}
            </Button>
            <Button variant="outline" onClick={() => setActiveTab('vorschau')} className="flex-1 flex items-center gap-2 border-[#5C4A32] text-[#5C4A32]">
              <Printer className="w-4 h-4" />
              Weiter zur Vorschau
            </Button>
          </div>
        </div>
      )}

      {/* Tab: Vorschau */}
      {activeTab === 'vorschau' && (
        <div>
          {/* Print bar */}
          <div className="bg-white border-b px-4 py-3 flex items-center gap-3 no-print">
            {missingFields.length > 0 && (
              <div className="flex items-center gap-1.5 text-amber-600 text-xs">
                <AlertTriangle className="w-4 h-4" />
                Fehlende Felder: {missingFields.join(', ')} — bitte im Tab „Variablen" ergänzen
              </div>
            )}
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setActiveTab('variablen')} className="text-xs">
                ← Variablen bearbeiten
              </Button>
              <Button size="sm" onClick={() => window.print()}
                className="bg-[#5C4A32] hover:bg-[#4A3A28] text-white text-xs flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5" />
                Als PDF drucken
              </Button>
            </div>
          </div>

          {/* Contract document */}
          <div ref={printRef} id="contract-print">
            <ContractDocument
              agName={agName}
              agAdresse={agAdresse}
              agEmail={vars.ag_email}
              agTelefon={vars.ag_telefon}
              leAbweichend={!!leAbweichend}
              leName={leName}
              leAdresse={leAdresse}
              vertragsBeginn={vertragsBeginnFmt}
              vertragsDauer={vertragsDauerFmt}
              tagessatzFmt={tagessatzFmt}
              ortUnterzeichnung={vars.ort_unterzeichnung}
              leAnrede={vars.le_anrede}
              today={today}
            />
          </div>
        </div>
      )}

      {/* Tab: Versand */}
      {activeTab === 'versand' && (
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4 no-print">

          {/* Success / Error Banner */}
          {sendResult && (
            <div className={`rounded-lg p-4 flex items-start gap-3 ${sendResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {sendResult.success ? (
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`text-sm font-medium ${sendResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {sendResult.success ? 'Vertrag erfolgreich versendet!' : 'Fehler beim Versand'}
                </p>
                {sendResult.error && <p className="text-xs text-red-700 mt-0.5">{sendResult.error}</p>}
                {sendResult.success && <p className="text-xs text-green-700 mt-0.5">Der Vertrag wurde an {lead.email} gesendet. Der Anhang enthält den vollständigen Dienstleistungsvertrag.</p>}
              </div>
            </div>
          )}

          {/* Fehlende Felder Warnung */}
          {missingFields.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Vertragsfelder unvollständig</p>
                <p className="text-xs text-amber-700 mt-0.5">{missingFields.join(' · ')} — Vertrag trotzdem sendbar, aber Platzhalter bleiben leer.</p>
              </div>
            </div>
          )}

          {/* Empfänger */}
          <Card className="p-5">
            <h3 className="font-semibold text-sm text-[#5C4A32] uppercase tracking-wide mb-3 flex items-center gap-2">
              <Send className="w-4 h-4" /> Empfänger
            </h3>
            <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
              <div className="w-9 h-9 rounded-full bg-[#5C4A32] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                {(lead.vorname || lead.email || '?')[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{agName || lead.email}</p>
                <p className="text-xs text-gray-500">{lead.email}</p>
              </div>
            </div>
          </Card>

          {/* E-Mail konfigurieren */}
          <Card className="p-5">
            <h3 className="font-semibold text-sm text-[#5C4A32] uppercase tracking-wide mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" /> E-Mail-Vorlage
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-600 block mb-1">Betreff</label>
                <input
                  type="text"
                  value={versandBetreff}
                  onChange={e => { setVersandBetreff(e.target.value); setSendResult(null); }}
                  placeholder="Ihr Dienstleistungsvertrag – PRIMUNDUS Deutschland"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5C4A32] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">
                  Anschreiben
                  <span className="text-gray-400 ml-1">(leer = Standardtext)</span>
                </label>
                <textarea
                  rows={6}
                  value={versandAnschreiben}
                  onChange={e => { setVersandAnschreiben(e.target.value); setSendResult(null); setShowEmailPreview(false); }}
                  placeholder={`anbei finden Sie Ihren Dienstleistungsvertrag mit PRIMUNDUS Deutschland zur Durchsicht. Bitte prüfen Sie alle Angaben sorgfältig und senden Sie uns den unterzeichneten Vertrag zurück – per Post, Fax oder eingescannt per E-Mail.\n\nBei Fragen stehen wir Ihnen jederzeit gerne zur Verfügung.`}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5C4A32] focus:outline-none resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">Der vollständige Vertrag wird automatisch als HTML-Datei angehängt.</p>
              </div>
            </div>
          </Card>

          {/* Vorschau-Toggle */}
          <button
            onClick={() => setShowEmailPreview(v => !v)}
            className="w-full py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:border-[#5C4A32] hover:text-[#5C4A32] transition-colors flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            {showEmailPreview ? 'Vorschau schließen' : 'E-Mail-Vorschau anzeigen'}
          </button>

          {/* Email Preview */}
          {showEmailPreview && (
            <Card className="overflow-hidden">
              <div className="bg-gray-100 px-4 py-2 border-b flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <span className="text-xs text-gray-500 ml-2">E-Mail-Vorschau</span>
              </div>
              <EmailPreviewFrame lead={lead} agName={agName} versandBetreff={versandBetreff} versandAnschreiben={versandAnschreiben} vars={vars} tagessatzFmt={tagessatzFmt} vertragsBeginnFmt={vertragsBeginnFmt} vertragsDauerFmt={vertragsDauerFmt} />
            </Card>
          )}

          {/* Send Button */}
          <div className="pb-8">
            <Button
              onClick={async () => {
                setIsSending(true);
                setSendResult(null);
                try {
                  const res = await fetch('/api/vertrag-senden', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      leadId,
                      subject: versandBetreff || undefined,
                      anschreiben: versandAnschreiben || undefined,
                    }),
                  });
                  const data = await res.json();
                  setSendResult({ success: data.success, error: data.emailError || data.error });
                  if (data.success) await loadLead();
                } catch (err) {
                  setSendResult({ success: false, error: String(err) });
                } finally {
                  setIsSending(false);
                }
              }}
              disabled={isSending}
              className="w-full bg-[#5C4A32] hover:bg-[#4A3A28] text-white flex items-center justify-center gap-2 py-3"
            >
              {isSending ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {isSending ? 'Wird gesendet…' : `Vertrag an ${lead.email} senden`}
            </Button>
            <p className="text-xs text-center text-gray-400 mt-2">
              Der Vertrag wird als HTML-Anhang versendet. Kunden können ihn im Browser öffnen und als PDF drucken.
            </p>
          </div>
        </div>
      )}

      {/* Global print styles */}
      <style>{`
        @media print {
          /* Hide everything, then only show the contract */
          body * { visibility: hidden; }
          #contract-print, #contract-print * { visibility: visible; }
          #contract-print { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
          body { margin: 0; background: white; }
        }
      `}</style>
    </div>
  );
}

/* ── Contract Document Component ─────────────────────────────── */
function ContractDocument({
  agName, agAdresse, agEmail, agTelefon,
  leAbweichend, leName, leAdresse, leAnrede,
  vertragsBeginn, vertragsDauer, tagessatzFmt, ortUnterzeichnung, today
}: any) {
  return (
    <>
      <style>{`
        .contract { font-family: 'Times New Roman', Times, serif; font-size: 12pt; color: #1a1a1a; line-height: 1.65; }
        .contract-page { max-width: 210mm; min-height: 297mm; margin: 0 auto; padding: 20mm 24mm 20mm 27mm; background: white; box-shadow: 0 4px 32px rgba(0,0,0,0.12); margin-bottom: 20px; display: flex; flex-direction: column; box-sizing: border-box; }
        @media print {
          .contract-page { box-shadow: none; margin-bottom: 0; padding: 18mm 22mm 18mm 25mm; page-break-after: always; min-height: 297mm; }
          .contract-page:last-child { page-break-after: avoid; }
        }
        .contract-page-spacer { flex: 1; }

        /* Header */
        .contract .header-logo { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 22pt; padding-bottom: 12pt; border-bottom: 2.5px solid #5C4A32; }
        .contract .header-date { font-size: 10pt; color: #7a6a56; text-align: right; line-height: 1.4; }

        /* Title page */
        .contract .title-block { text-align: center; margin: 18pt 0 22pt; }
        .contract h1.doc-title { font-size: 20pt; font-weight: bold; letter-spacing: 1px; margin: 0 0 4pt 0; color: #1a1a1a; }
        .contract .title-rule { border: none; border-top: 1px solid #c8b89a; margin: 8pt auto; width: 60pt; }
        .contract .subtitle { text-align: center; font-size: 12pt; color: #555; margin: 0 0 18pt; }

        /* Party blocks */
        .contract .party-block { border: 1px solid #d4c5af; border-left: 3px solid #5C4A32; background: #faf8f5; padding: 10pt 14pt; margin-bottom: 6pt; border-radius: 0 3pt 3pt 0; }
        .contract .party-label { font-size: 8.5pt; color: #7a6a56; margin-bottom: 4pt; font-style: italic; text-transform: uppercase; letter-spacing: 0.5px; }
        .contract .party-name { font-weight: bold; font-size: 13pt; margin-bottom: 3pt; color: #1a1a1a; }
        .contract .party-detail { font-size: 11pt; color: #444; line-height: 1.45; }
        .contract .party-center { text-align: center; font-size: 11pt; color: #666; margin: 5pt 0; }
        .contract .party-and { text-align: center; font-weight: bold; font-size: 13pt; color: #5C4A32; margin: 8pt 0; letter-spacing: 1px; }

        /* Section headings */
        .contract h2 { font-size: 12pt; font-weight: bold; color: #5C4A32; margin: 18pt 0 6pt 0; padding-bottom: 3pt; border-bottom: 1px solid #e8ddd0; }
        .contract p { margin: 0 0 6pt 0; text-align: justify; }
        .contract ul { margin: 4pt 0 10pt 0; padding: 0 0 0 18pt; list-style: none; }
        .contract li { margin-bottom: 4pt; padding-left: 10pt; position: relative; text-align: left; }
        .contract li::before { content: '▸'; position: absolute; left: 0; color: #5C4A32; font-size: 8pt; top: 2pt; }

        /* Fields & dividers */
        .contract .field-blank { display: inline-block; min-width: 110pt; border-bottom: 1.5px solid #5C4A32; color: #5C4A32; font-style: italic; }
        .contract .divider { border: none; border-top: 1px solid #e0d5c8; margin: 14pt 0; }

        /* Signature */
        .contract .sig-place { font-size: 11pt; color: #444; margin-bottom: 22pt; }
        .contract .sig-row { display: flex; gap: 30pt; margin-top: 28pt; }
        .contract .sig-box { flex: 1; }
        .contract .sig-line { border-top: 1.5px solid #5C4A32; padding-top: 6pt; font-size: 10pt; color: #555; line-height: 1.5; }

        /* Footer */
        .contract .page-footer { display: flex; justify-content: space-between; font-size: 9pt; color: #aaa; border-top: 1px solid #e8ddd0; padding-top: 6pt; margin-top: 0; }

        /* Annexe */
        .contract .annexe-block { text-align: center; margin-bottom: 20pt; padding-bottom: 12pt; border-bottom: 1px solid #e0d5c8; }
        .contract .annexe-title { font-size: 14pt; font-weight: bold; color: #1a1a1a; margin-bottom: 4pt; }
        .contract .annexe-subtitle { font-size: 11pt; color: #666; margin: 0; }
      `}</style>

      <div className="contract">

        {/* PAGE 1 — Deckblatt */}
        <div className="contract-page">
          <div className="header-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/Primundus-Logo_V6.png" alt="Primundus" style={{ height: '42px', objectFit: 'contain' }} />
            <div className="header-date">
              Datum:<br />{today}
            </div>
          </div>

          <div className="title-block">
            <h1 className="doc-title">Dienstleistungsvertrag</h1>
            <hr className="title-rule" />
            <p className="subtitle">geschlossen zwischen den folgenden Vertragsparteien</p>
          </div>

          <div className="party-block">
            <div className="party-label">Auftraggeber (AG)</div>
            <div className="party-name">{agName || <span style={{color:'#bbb', fontWeight:'normal', fontStyle:'italic'}}>Name nicht hinterlegt</span>}</div>
            {agAdresse && <div className="party-detail">{agAdresse}</div>}
            {agEmail && <div className="party-detail">{agEmail}</div>}
            {agTelefon && <div className="party-detail">{agTelefon}</div>}
          </div>
          <p className="party-center">im Folgenden <strong>Auftraggeber (AG)</strong> genannt</p>

          <div className="party-block">
            <div className="party-label">Leistungsempfänger (LE){!leAbweichend && ' — identisch mit AG'}</div>
            {leAbweichend && leName ? (
              <>
                <div className="party-name">{leName}</div>
                {leAdresse && <div className="party-detail">{leAdresse}</div>}
              </>
            ) : (
              <div className="party-detail" style={{color:'#999', fontStyle:'italic', paddingTop:'3pt'}}>
                {agName || 'wie Auftraggeber'}{agAdresse ? `, ${agAdresse}` : ''}
              </div>
            )}
          </div>
          <p className="party-center">im Folgenden <strong>Leistungsempfänger (LE)</strong> genannt</p>

          <p className="party-and">— und —</p>

          <div className="party-block">
            <div className="party-label">Dienstleister (DL)</div>
            <div className="party-name">PRIMUNDUS Deutschland</div>
            <div className="party-detail">VITANAS CARE LTD HOME SK · ul. Poznańska 21/48, 00-685 Warszawa</div>
            <div className="party-detail">NIP: 7011301447 · REGON: 544074862</div>
          </div>
          <p className="party-center">Im Folgenden <strong>Dienstleister (DL oder PRIMUNDUS)</strong> genannt.</p>

          <div className="contract-page-spacer" /><div className="page-footer">
            <span>PRIMUNDUS | www.primundus.de</span>
            <span>Seite 1 von 8</span>
          </div>
        </div>

        {/* PAGE 2 — §1–2 */}
        <div className="contract-page">
          <h2>§ 1 Vertragsgegenstand</h2>
          <p>1. Der DL erbringt zeitlich überwiegend Leistungen im Bereich der hauswirtschaftlichen Versorgung und unterstützt den LE bei der Ausübung alltäglicher Aktivitäten. Zusätzlich erbringt der DL in zeitlich geringerem Umfang Leistungen im Bereich der Grundpflege im Sinne des SGB XI. Eine detaillierte Beschreibung dieser Leistungen erfolgt in Anlage 2 dieses Vertrages, wobei die Art, Dauer und die Häufigkeit der Betreuung von dem jeweiligen Gesundheitszustand des Leistungsempfängers abhängen. Änderungen des Leistungsumfangs werden ausschließlich nach Absprache zwischen AG und DL vorgenommen. Beide Vertragspartner sind sich darüber einig, dass der zeitliche Aufwand der vereinbarten grundpflegerischen Leistungen 50 Prozent der gesamten Leistung nicht überschreiten darf.</p>
          <p>2. Der DL erklärt, dass notwendige medizinische Behandlungspflege nach SGB V (z. B. Injektionen, Wundversorgung, u. a.) sich ausdrücklich nicht im Umfang der Dienstleistungen befindet und nicht im Rahmen dieses Vertrages ausgeführt wird.</p>
          <p>3. Der DL verpflichtet sich, die ihm in Auftrag gegebenen Dienstleistungen mit höchster Sorgfalt sowie durch die volle Anwendung seiner Kenntnisse und Erfahrungen, zu erbringen. Der DL erbringt die Leistung durch seine Betreuungspersonen oder beauftragte Dritte.</p>
          <p>4. Im Fall einer Verhinderung der Betreuungsperson (z. B. wegen einer schwerwiegenden Krankheit oder aus anderem wichtigen Grund) ist der DL berechtigt, die Betreuungsperson schnellstmöglich (in der Regel innerhalb von 3 Tagen) zu wechseln und durch eine andere adäquate Betreuungsperson vertreten zu lassen.</p>
          <p>5. Bei begründetem und nachvollziehbarem Wunsch des AG wird der DL einen Austausch der Betreuungsperson vornehmen. Für die Ausführung wird dem DL ein Zeitraum von mindestens einer Woche gewährt.</p>
          <p>6. Die eingesetzten Betreuungspersonen des DL können nicht durch den AG zu anderen Zwecken eingeteilt oder an andere Leistungsorte verliehen werden.</p>
          <p>7. Mängel und Beschwerden müssen dem DL unverzüglich schriftlich angezeigt werden.</p>
          <p>8. Der DL erbringt seine Dienstleistungen gemäß den Vorschriften der EU am Leistungsort. Beide Vertragsparteien sind sich darüber einig:</p>
          <ul>
            <li>der AG erstellt weder Dienst- noch Freizeitpläne</li>
            <li>der AG übt keinen Einfluss auf Art und Weise der Aufgaben der Betreuungsperson aus</li>
            <li>der AG erteilt keine direkten und bindenden Weisungen und übt kein Direktionsrecht aus</li>
            <li>der AG bindet die Betreuungsperson nicht in eigene Betriebsabläufe ein</li>
          </ul>
          <p>9. Die wöchentliche durchschnittliche Arbeitszeit darf 40 Stunden nicht überschreiten. Außerhalb der Arbeitszeit steht es der Betreuungsperson frei, den Leistungsort zu verlassen.</p>
          <p>10. Der AG stellt der Betreuungsperson die Mitbenutzung eines Telefons für nationale Festnetztelefonate sowie Festnetztelefonate ins Heimatland und Internet zur Verfügung.</p>

          <h2>§ 2 Unterbringung / Verpflegung / Transfer</h2>
          <p>1. Der AG verpflichtet sich, der Betreuungsperson ausreichenden, unentgeltlichen Wohnraum (z. B. ein Zimmer) zur alleinigen, privaten und freiwilligen Nutzung zur Verfügung zu stellen. Der Wohnraum muss ausreichend möbliert, beheizt, verschließbar und hygienisch einwandfrei mit einem Tageslichtfenster versehen sein.</p>
          <p>2. Der AG trägt alle Kosten der Leistungserbringung, Ernährungs- und Lebenshaltungskosten sowie die Kosten für die mit der Betreuung verbundenen Mittel und Geräte.</p>
          <p>3. Der AG verpflichtet sich, am vorher vereinbarten Ankunftstag die Betreuungsperson am nächstgelegenen Ankunftsort auf eigene Kosten abzuholen. Der DL haftet nicht für Verspätungen infolge der Busreisedauer oder persönlicher Angelegenheiten der Betreuungspersonen.</p>

          <div className="contract-page-spacer" /><div className="page-footer">
            <span>PRIMUNDUS | www.primundus.de</span>
            <span>Seite 2 von 8</span>
          </div>
        </div>

        {/* PAGE 3 — §3–4 */}
        <div className="contract-page">
          <h2>§ 3 Vertragsdauer / Vertragskündigung</h2>
          <p>1. Der Vertrag beginnt voraussichtlich am <span className="field-blank">{vertragsBeginn}</span> und wird <span className="field-blank" style={{minWidth: '160pt'}}>{vertragsDauer}</span> geschlossen.</p>
          <p>2. Der AG verlangt vom DL ausdrücklich, dass dieser mit der Leistungserbringung bereits vor Ablauf der Widerrufsfrist gemäß § 8 beginnt.</p>
          <p>3. Der Vertrag kann von beiden Seiten ohne Einhaltung einer Kündigungsfrist gekündigt werden.</p>
          <p>4. Die Kündigung bedarf zu ihrer Wirksamkeit zwingend der Textform (Brief, Fax, E-Mail).</p>
          <p>5. Der Auftraggeber gewährt dem Dienstleister eine Frist von maximal 3 Tagen zur Organisation der Rückreise der Betreuungsperson sowie während dieser Frist weiterhin Unterkunft und Verpflegung.</p>
          <p>6. Die Abwesenheit des LE am Leistungsort bis zu 7 Tagen lässt den Vertragsbestand unberührt. Ab dem 8. Tag ruht der Vertrag kostenlos für den AG bis die Betreuung wieder fortgesetzt wird.</p>
          <p>7. Bei Beschwerden über die Erbringung der vereinbarten Leistungen ist der DL unverzüglich zu informieren. Eine Minderung kann nur erfolgen, wenn der Minderungsgrund innerhalb von 5 Tagen angezeigt wurde und zwischen den Parteien unstrittig ist.</p>

          <h2>§ 4 Vergütung</h2>
          <p>1. Der DL erhält für die vereinbarten Dienstleistungen eine Vergütung von <strong><span className="field-blank">{tagessatzFmt}</span> pro Tag (Tagessatz)</strong> zzgl. Reisekostenvergütung (für den internationalen Flugverkehr nach/von Mallorca). Im Falle einer unvorhersehbaren Verkürzung der Einsatzzeit auf Wunsch des AG wird eine Reisekostenvergütungspauschale von EUR 125,00 berechnet.</p>
          <p>2. Die Vergütung wird berechnet ab dem Tag der Ankunft der Betreuungsperson am Leistungsort.</p>
          <p>3. Beginnt oder endet die Vertragslaufzeit im Laufe eines Monats, erfolgt eine anteilige Berechnung der vereinbarten Vergütung.</p>
          <p>4. Die Rechnungen werden monatlich zum 15. ausgestellt. Der Rechnungsbetrag ist bis spätestens 7 Tage nach Erhalt zu überweisen.</p>
          <p>5. Sollten sich die Betreuungsbedürfnisse der zu betreuenden Person ändern, behält sich der DL das Recht zur Anpassung des Honorars vor.</p>
          <p>6. Im Falle einer Arbeitsunfähigkeit der Betreuungsperson wird für die Zeit der Verhinderung kein Honorar berechnet.</p>
          <p>7. Der Anreisetag und der Abreisetag werden als volle Dienstleistungstage berechnet. Bei einem Personalwechsel wird der volle Tagessatz für beide Betreuungspersonen berechnet.</p>
          <p>8. Nach der aktuellen Gesetzeslage ist auf die Dienstleistungen des DL keine gesetzliche Mehrwertsteuer zu entrichten.</p>
          <p>9. Bei Zahlungsverzug hat der DL das Recht, Dritte mit der Rechnungsabwicklung zu beauftragen und Verzugszinsen in Höhe von 5 Prozent p. a. über dem jeweiligen Basiszinssatz zu berechnen.</p>
          <p>10. Der DL ist berechtigt, bei ausbleibender Zahlung die Betreuungsperson ersatzlos abreisen zu lassen und den Vertrag außerordentlich fristlos zu kündigen.</p>

          <div className="contract-page-spacer" /><div className="page-footer">
            <span>PRIMUNDUS | www.primundus.de</span>
            <span>Seite 3 von 8</span>
          </div>
        </div>

        {/* PAGE 4 — §5–7 */}
        <div className="contract-page">
          <h2>§ 5 Haftung des Dienstleisters</h2>
          <p>1. Der DL erklärt, dass die von ihm beauftragten Betreuungspersonen über eine Haftpflichtversicherung verfügen.</p>
          <p>2. Der Dienstleister haftet für Schäden an Leib, Leben oder Gesundheit nach den gesetzlichen Vorschriften und jeweils bis zu EUR 1.000.000,00 pro Schadenfall. Die Haftung für Schäden und Folgeschäden wird ausgeschlossen, wenn der Schaden in geringen Beschädigungen (bis zu EUR 100,00) besteht, die bei der Verrichtung alltäglicher Haushaltspflichten entstanden sind, oder wenn der Schaden einen normalen Verschleiß der Ausstattung darstellt.</p>
          <p>3. Der DL und die Betreuungspersonen leisten keine medizinische Behandlungspflege im Sinne des SGB V und übernehmen keine Verantwortung für Umstände, die durch Nichteinhaltung ärztlicher Anordnungen durch den AG oder LE entstehen.</p>
          <p>4. Im Falle der Übergabe eines Kraftfahrzeugs an die Betreuungsperson können keine Ansprüche gegenüber dem DL geltend gemacht werden.</p>

          <h2>§ 6 Datenschutz / Vertraulichkeitsvereinbarung</h2>
          <p>1. Beide Parteien verpflichten sich zum Schutz aller personenbezogenen Daten gemäß der EU-DSGVO. Der DL verpflichtet sich zur vertraulichen Behandlung der persönlichen Daten des AG und LE.</p>
          <p>2. Der DL verarbeitet anvertraute personenbezogene Daten nur soweit, als es zur Begründung, Durchführung oder Beendigung dieses Vertrages erforderlich ist.</p>
          <p>3. Der AG verpflichtet sich zur vollen Verschwiegenheit gegenüber Dritten in Bezug auf sämtliche Daten, die im Zusammenhang mit der Erbringung der Dienstleistung erlangt werden.</p>
          <p>4. Der AG und der LE willigen ein, dass die zur Erfüllung des Vertrages notwendigen Daten vom DL erhoben, gespeichert, verarbeitet und an seine Mitarbeiter und Betreuungspersonen weitergegeben werden dürfen.</p>

          <h2>§ 7 Wettbewerbsverbot</h2>
          <p>1. Für die Betreuungspersonen gilt sowohl während der Vertragsdauer als auch bis 12 Monate nach Beendigung ein Konkurrenz- und Wettbewerbsverbot. Es ist nicht gestattet, ein mittelbares oder unmittelbares Rechtsverhältnis zu einer Betreuungsperson des DL zu begründen.</p>
          <p>2. Im Falle einer schuldhaften Annahme eines Auftrages durch eine Betreuungsperson beim AG mit Ausschließung des DL, verpflichtet sich der AG, eine Vertragsstrafe in Höhe von EUR 5.000,00 zu zahlen.</p>

          <div className="contract-page-spacer" /><div className="page-footer">
            <span>PRIMUNDUS | www.primundus.de</span>
            <span>Seite 4 von 8</span>
          </div>
        </div>

        {/* PAGE 5 — §8–10 + Unterschriften */}
        <div className="contract-page">
          <h2>§ 8 Widerrufsrecht</h2>
          <p>1. Dem AG steht das Recht zu, diesen Vertrag ohne Angabe von Gründen innerhalb von 14 Tagen in Textform zu widerrufen. Die Widerrufsfrist beginnt mit Unterzeichnung dieses Vertrages. Widerruf an:</p>
          <p style={{ marginLeft: '15pt' }}>Primundus Deutschland (VITANAS CARE LTD HOME SK), ul. Poznańska 21/48, 00-685 Warszawa</p>
          <p>2. Im Falle eines wirksamen Widerrufs sind die beiderseits empfangenen Leistungen zurückzugewähren. Der AG ist verpflichtet, dem DL Wertersatz zu leisten (z. B. entstandene Reisekosten, pauschal EUR 125,00).</p>
          <p>3. Der AG bestätigt durch Unterzeichnung, dass er ausdrücklich verlangt, dass die Leistungserbringung vor Ablauf der Widerrufsfrist beginnt.</p>

          <h2>§ 9 Einhaltung der gültigen Sozialversicherungspflichten</h2>
          <p>1. Der DL erklärt, dass er alle auszuführenden Tätigkeiten nach den gültigen Gesetzen, insbesondere der EU-Dienstleistungsrichtlinie und dem Arbeitnehmer-Entsendegesetz, rechtmäßig befolgt.</p>
          <p>2. Die Vergütung des Personals richtet sich nach dem deutschen Mindestlohn.</p>
          <p>3. Die von ihm beauftragten Betreuungspersonen sind ordnungsgemäß nach polnischem Sozialversicherungsrecht versichert und mit A1-Bescheinigungen der polnischen Sozialversicherungsanstalt (ZUS) entsandt.</p>

          <h2>§ 10 Schlussbestimmungen</h2>
          <p>1. Änderungen und Ergänzungen bedürfen der Schriftform. 2. Rechnungen und Korrespondenz werden an die E-Mailadresse des AG auf Seite 1 gesendet. 3. Eine E-Mail ist gemäß diesem Vertrag ebenfalls Schriftform. 4. Sollten einzelne Bestimmungen unwirksam sein, gelten die übrigen fort. 5. Der AG bestätigt mit seiner Unterschrift den gesamten Inhalt des Vertrages gelesen zu haben. 6. Mündliche Nebenabreden bestehen nicht. 7. Der Vertrag unterliegt deutschem Recht.</p>

          <hr className="divider" />

          {/* Signature block */}
          <div className="sig-place">
            {ortUnterzeichnung || '________________________'}, den ___________________
          </div>

          <div className="sig-row">
            <div className="sig-box">
              <div className="sig-line">
                Ort, Datum, Unterschrift Auftraggeber<br />
                (bzw. Bevollmächtigter oder gesetzlicher Vertreter)
              </div>
            </div>
            <div className="sig-box">
              <div className="sig-line">
                Ort, Datum, Unterschrift Dienstleister
              </div>
            </div>
          </div>

          <div className="contract-page-spacer" /><div className="page-footer">
            <span>PRIMUNDUS | www.primundus.de</span>
            <span>Seite 5 von 8</span>
          </div>
        </div>

        {/* PAGE 6 — Anlage 1 Datenschutz */}
        <div className="contract-page">
          <div className="annexe-block">
            <p className="annexe-title">Anlage 1 zum Dienstleistungsvertrag</p>
            <p className="annexe-subtitle">Hinweise zum Datenschutz (EU-DSGVO) und Einwilligungserklärung</p>
          </div>

          <p>PRIMUNDUS ist verantwortlich für den Schutz, Sicherheit und Verwaltung Ihrer Daten. Kontakt: <strong>datenschutz@primundus.de</strong></p>
          <p>Die angegebenen personenbezogenen Daten, insbesondere Name, Anschrift, Telefonnummer, Bankdaten, Gesundheitsdaten und familiäre Daten, werden auf Grundlage der geltenden EU-DSGVO ausschließlich zum Zwecke der Durchführung des entstehenden Vertragsverhältnisses erhoben und verarbeitet.</p>
          <p>Ihre Vertragsdaten speichern wir gemäß den gesetzlichen Vorgaben. Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Sperrung, Einschränkung der Verarbeitung, Widerspruch und Datenübertragbarkeit sowie das Recht auf Beschwerde bei einer zuständigen Aufsichtsbehörde.</p>
          <p>Unsere Datenschutzerklärung finden Sie unter www.primundus-mallorca.de.</p>

          <p style={{ marginTop: '14pt', fontWeight: 'bold' }}>Einwilligung zur Datennutzung zu Werbezwecken:</p>
          <p>Ich bin damit einverstanden, dass PRIMUNDUS mir postalisch / per E-Mail / Telefon / Fax Informationen und Angebote zum Zwecke der Eigenwerbung zusendet.</p>

          <div className="sig-row" style={{ marginTop: '40pt' }}>
            <div className="sig-box">
              <div className="sig-line">
                Ort, Datum, Unterschrift Auftraggeber<br />
                (bzw. Bevollmächtigter oder gesetzlicher Vertreter)
              </div>
            </div>
          </div>

          <div className="contract-page-spacer" /><div className="page-footer">
            <span>PRIMUNDUS | www.primundus.de</span>
            <span>Seite 6 von 8</span>
          </div>
        </div>

        {/* PAGE 7 — Anlage 2 Leistungsumfang */}
        <div className="contract-page">
          <div className="annexe-block">
            <p className="annexe-title">Anlage 2 zum Dienstleistungsvertrag</p>
            <p className="annexe-subtitle">Leistungsumfang</p>
          </div>

          <p>Die Vertragspartner vereinbaren, dass folgende Leistungen im Rahmen des abgeschlossenen Dienstleistungsvertrages erbracht werden. Beide Parteien sind sich darüber einig, dass zeitlich überwiegend nur Leistungen im Bereich der hauswirtschaftlichen Versorgung erbracht werden.</p>

          <h2>Hauswirtschaftliche Leistungen (zeitlich überwiegend)</h2>
          <ul>
            <li>Alle notwendigen Maßnahmen zur Aufrechterhaltung einer eigenständigen Haushaltsführung</li>
            <li>Ordnung und Reinigung der vom LE genutzten Zimmer/Räume (Fensterreinigung, Garage, Heizräume und Außengebäude ausgeschlossen)</li>
            <li>Einkaufen</li>
            <li>Spülen des alltäglichen Geschirrs</li>
            <li>Waschen und Wechseln der Wäsche sowie Kleidung</li>
            <li>Zubereitung von Speisen und Getränken</li>
            <li>Pflege von Zimmerpflanzen</li>
            <li>Begleitung bei Spaziergängen</li>
            <li>Versorgung von Haustieren</li>
            <li>Aktivierende Tätigkeiten und Besorgungen (z. B. Begleitung bei Kulturveranstaltungen, Spiele etc.)</li>
          </ul>

          <h2>Grundpflege nach § 14 Abs. 4 Nr. 1–3 SGB XI (zeitlich nicht überwiegend)</h2>
          <ul>
            <li>Körperpflege (z. B. Waschen, Duschen, Baden, Rasieren, Mund- und Zahnpflege, Hautpflege)</li>
            <li>Hilfe bei der Nahrungsaufnahme</li>
            <li>Hilfe bei der Mobilität (z. B. Aufstehen, Zubettgehen, An- und Auskleiden, Treppensteigen)</li>
            <li>Begleitung von Arztbesuchen</li>
          </ul>

          <p><strong>Ausdrücklich ausgenommen:</strong> Leistungen der medizinischen Behandlungspflege nach SGB V.</p>

          <div className="sig-row" style={{ marginTop: '40pt' }}>
            <div className="sig-box">
              <div className="sig-line">
                Ort, Datum, Unterschrift Auftraggeber<br />
                (bzw. Bevollmächtigter oder gesetzlicher Vertreter)
              </div>
            </div>
            <div className="sig-box">
              <div className="sig-line">
                Ort, Datum, Unterschrift Dienstleister
              </div>
            </div>
          </div>

          <div className="contract-page-spacer" /><div className="page-footer">
            <span>PRIMUNDUS | www.primundus.de</span>
            <span>Seite 7 von 8</span>
          </div>
        </div>

      </div>
    </>
  );
}

/* ── Email Preview Component ─────────────────────────────────── */
function EmailPreviewFrame({ lead, agName, versandBetreff, versandAnschreiben, vars, tagessatzFmt, vertragsBeginnFmt, vertragsDauerFmt }: any) {
  // Build inline preview HTML without API call
  const anrede = lead.anrede_text || lead.anrede || '';
  const nachname = lead.nachname || '';
  const vorname = lead.vorname || '';
  let anredeText = 'Guten Tag';
  if (anrede === 'Frau' && nachname) anredeText = `Sehr geehrte Frau ${nachname}`;
  else if (anrede === 'Herr' && nachname) anredeText = `Sehr geehrter Herr ${nachname}`;
  else if (anrede === 'Familie' && nachname) anredeText = `Sehr geehrte Familie ${nachname}`;
  else if (vorname && nachname) anredeText = `Guten Tag ${vorname} ${nachname}`;
  else if (vorname) anredeText = `Guten Tag ${vorname}`;

  const defaultText = `anbei finden Sie Ihren Dienstleistungsvertrag mit PRIMUNDUS Deutschland zur Durchsicht. Bitte prüfen Sie alle Angaben sorgfältig und senden Sie uns den unterzeichneten Vertrag zurück – per Post, Fax oder eingescannt per E-Mail.\n\nBei Fragen stehen wir Ihnen jederzeit gerne zur Verfügung.`;
  const bodyText = versandAnschreiben || defaultText;

  const pd = lead.patient_data || {};
  const leVorname = lead.patient_vorname || pd.patient_vorname || '';
  const leNachname = lead.patient_nachname || pd.patient_nachname || '';
  const leAnrede = lead.patient_anrede || pd.anrede || '';
  const leName = [leAnrede, leVorname, leNachname].filter(Boolean).join(' ');
  const leIsAbweichend = !!(leVorname || leNachname);

  const detailRows = [
    agName ? { label: 'Auftraggeber', val: agName } : null,
    leIsAbweichend && leName ? { label: 'Leistungsempfänger', val: leName } : null,
    vertragsBeginnFmt && vertragsBeginnFmt !== '_______________' ? { label: 'Vertragsbeginn', val: vertragsBeginnFmt } : null,
    vertragsDauerFmt ? { label: 'Vertragsdauer', val: vertragsDauerFmt } : null,
    tagessatzFmt && tagessatzFmt !== '_______________' ? { label: 'Tagessatz (§ 4)', val: `${tagessatzFmt}/Tag` } : null,
  ].filter(Boolean) as { label: string; val: string }[];

  return (
    <div className="bg-[#f0ece6] p-6">
      {/* Email frame */}
      <div className="max-w-[600px] mx-auto bg-white rounded overflow-hidden shadow-md text-sm" style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
        {/* Header */}
        <div className="px-10 py-7" style={{ backgroundColor: '#5C4A32' }}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-white font-bold text-lg tracking-wide">PRIMUNDUS</span>
              <span className="text-[#c8b89a] text-xs ml-2 font-normal">Deutschland</span>
            </div>
            <span className="text-[#c8b89a] text-xs">24h-Pflege und Betreuung</span>
          </div>
        </div>
        {/* Title bar */}
        <div className="px-10 py-3.5" style={{ backgroundColor: '#4a3928' }}>
          <span className="text-[#e8ddd0] text-sm">📄 {versandBetreff || 'Ihr Dienstleistungsvertrag – PRIMUNDUS Deutschland'}</span>
        </div>
        {/* Body */}
        <div className="px-10 py-8">
          <p className="text-base text-gray-800 mb-5">{anredeText},</p>
          <div className="text-[15px] text-gray-600 leading-relaxed mb-6">
            {bodyText.split('\n\n').map((para: string, i: number) => (
              <p key={i} className="mb-4">{para}</p>
            ))}
          </div>
          {detailRows.length > 0 && (
            <div className="rounded-r border border-[#e8ddd0] border-l-4 border-l-[#5C4A32] p-5 mb-6" style={{ backgroundColor: '#faf8f5' }}>
              <p className="text-xs text-[#7a6a56] uppercase tracking-wider font-semibold mb-3">Vertragsdetails</p>
              <table className="w-full text-sm">
                <tbody>
                  {detailRows.map((row, i) => (
                    <tr key={i}>
                      <td className="pr-4 py-1 text-gray-400 whitespace-nowrap">{row.label}</td>
                      <td className="py-1 font-semibold text-gray-800">{row.val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-sm text-gray-500 leading-relaxed">Den vollständigen Vertrag finden Sie im Anhang dieser E-Mail. Bitte drucken Sie ihn aus, unterschreiben ihn und senden Sie ein Exemplar zurück.</p>
        </div>
        {/* CTA */}
        <div className="px-10 pb-7">
          <p className="text-xs text-gray-400 mb-1">Fragen? Wir sind für Sie da:</p>
          <p className="text-sm font-semibold" style={{ color: '#5C4A32' }}>089 200 000 830 · info@primundus.de</p>
        </div>
        {/* Sign-off */}
        <div className="px-10 pb-8 border-t border-gray-100 pt-5">
          <p className="text-sm text-gray-600 mb-1">Mit freundlichen Grüßen</p>
          <p className="text-sm font-semibold text-gray-800">Ihr PRIMUNDUS-Team</p>
        </div>
        {/* Footer */}
        <div className="px-10 py-4 border-t border-[#e8ddd0] text-center" style={{ backgroundColor: '#f7f4f0' }}>
          <p className="text-xs text-gray-400 leading-relaxed">
            PRIMUNDUS Deutschland (VITANAS CARE LTD HOME SK) · ul. Poznańska 21/48, 00-685 Warszawa<br />
            Telefon: 089 200 000 830 · E-Mail: info@primundus.de · www.primundus.de
          </p>
        </div>
      </div>
      {/* Attachment indicator */}
      <div className="max-w-[600px] mx-auto mt-3 flex items-center gap-2 text-xs text-gray-500 px-1">
        <span>📎</span>
        <span>Anhang: <strong>Dienstleistungsvertrag_{lead.nachname || lead.vorname || 'Primundus'}.html</strong></span>
      </div>
    </div>
  );
}
