"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createClient } from '@supabase/supabase-js';
import { Search, Loader2, Mail, Phone, Calendar, ChevronRight, Check } from 'lucide-react';
import { ALL_STATUSES, getStatusMeta } from './statuses';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function StatusDropdown({
  leadId,
  currentStatus,
  onSaved,
}: {
  leadId: string;
  currentStatus: string;
  onSaved: (leadId: string, newStatus: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const meta = getStatusMeta(currentStatus);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = async (e: React.MouseEvent, value: string) => {
    e.stopPropagation();
    if (value === currentStatus) { setOpen(false); return; }
    setSaving(true);
    setOpen(false);
    await supabase.from('leads').update({ status: value }).eq('id', leadId);
    onSaved(leadId, value);
    setSaving(false);
  };

  return (
    <div ref={ref} className="relative inline-block" onClick={e => e.stopPropagation()}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-opacity ${meta.color} ${saving ? 'opacity-50' : 'hover:opacity-80'}`}
        disabled={saving}
      >
        {saving
          ? <Loader2 className="w-3 h-3 animate-spin" />
          : <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${meta.dot}`} />}
        {meta.label}
        <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[190px]">
          {ALL_STATUSES.map(s => (
            <button
              key={s.value}
              onClick={e => handleSelect(e, s.value)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 transition-colors text-left"
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
              <span className={s.value === currentStatus ? 'font-semibold text-gray-900' : 'text-gray-700'}>{s.label}</span>
              {s.value === currentStatus && <Check className="w-3.5 h-3.5 text-[#5C4A32] ml-auto" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<any[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadLeads = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setLeads(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  useEffect(() => {
    let filtered = [...leads];
    if (statusFilter !== 'all') filtered = filtered.filter(l => l.status === statusFilter);
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      filtered = filtered.filter(l =>
        l.email?.toLowerCase().includes(t) ||
        l.vorname?.toLowerCase().includes(t) ||
        l.nachname?.toLowerCase().includes(t) ||
        l.telefon?.includes(t)
      );
    }
    setFilteredLeads(filtered);
  }, [searchTerm, statusFilter, leads]);

  const handleStatusSaved = (leadId: string, newStatus: string) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#5C4A32]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-600 mt-1">{filteredLeads.length} von {leads.length} Interessenten</p>
        </div>
        <Button onClick={loadLeads} variant="outline" size="sm">Aktualisieren</Button>
      </div>

      <Card className="p-6">
        {/* Filter bar */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Name, E-Mail oder Telefon…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                statusFilter === 'all' ? 'bg-[#5C4A32] text-white border-[#5C4A32]' : 'border-gray-300 text-gray-600 hover:border-[#5C4A32]'
              }`}
            >
              Alle ({leads.length})
            </button>
            {ALL_STATUSES.filter(s => s.value !== 'info_requested').map(s => {
              const count = leads.filter(l => l.status === s.value).length;
              if (count === 0 && s.value !== 'vertrag_gesendet') return null;
              return (
                <button
                  key={s.value}
                  onClick={() => setStatusFilter(statusFilter === s.value ? 'all' : s.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                    statusFilter === s.value ? 'bg-[#5C4A32] text-white border-[#5C4A32]' : 'border-gray-300 text-gray-600 hover:border-[#5C4A32]'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === s.value ? 'bg-white' : s.dot}`} />
                  {s.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kontakt</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Eigenanteil</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Erstellt</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">Keine Leads gefunden</td>
                </tr>
              ) : (
                filteredLeads.map(lead => (
                  <tr
                    key={lead.id}
                    onClick={() => router.push(`/admin/leads/${lead.id}`)}
                    className="border-b hover:bg-[#faf8f5] cursor-pointer transition-colors group"
                  >
                    {/* Kontakt */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-semibold bg-[#5C4A32]">
                          {(lead.vorname || lead.email || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {[lead.anrede_text, lead.vorname, lead.nachname].filter(Boolean).join(' ') || 'Unbekannt'}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                            <Mail className="w-3 h-3" />{lead.email}
                          </div>
                          {lead.telefon && (
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <Phone className="w-3 h-3" />{lead.telefon}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <StatusDropdown
                        leadId={lead.id}
                        currentStatus={lead.status}
                        onSaved={handleStatusSaved}
                      />
                    </td>

                    {/* Eigenanteil */}
                    <td className="py-3.5 px-4">
                      {lead.kalkulation?.eigenanteil ? (
                        <span className="font-semibold text-gray-800 text-sm">
                          {Math.round(lead.kalkulation.eigenanteil).toLocaleString('de-DE')} €
                          <span className="text-gray-400 font-normal text-xs">/Mon.</span>
                        </span>
                      ) : (
                        <span className="text-gray-300 text-sm">—</span>
                      )}
                    </td>

                    {/* Datum */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        <div>
                          <div>{new Date(lead.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                          <div className="text-gray-400">{new Date(lead.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr</div>
                        </div>
                      </div>
                    </td>

                    {/* Arrow */}
                    <td className="py-3.5 px-4">
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#5C4A32] transition-colors" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
