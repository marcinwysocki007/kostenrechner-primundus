export const ALL_STATUSES = [
  { value: 'info_requested',        label: 'Info angefordert',       color: 'bg-yellow-100 text-yellow-800',   dot: 'bg-yellow-400' },
  { value: 'angebot_requested',     label: 'Angebot angefordert',    color: 'bg-orange-100 text-orange-800',   dot: 'bg-orange-400' },
  { value: 'angebot_gesendet',      label: 'Angebot gesendet',       color: 'bg-blue-100 text-blue-800',       dot: 'bg-blue-400' },
  { value: 'in_beratung',           label: 'In Beratung',            color: 'bg-purple-100 text-purple-800',   dot: 'bg-purple-400' },
  { value: 'vertrag_gesendet',      label: 'Vertrag gesendet',       color: 'bg-indigo-100 text-indigo-800',   dot: 'bg-indigo-400' },
  { value: 'vertrag_abgeschlossen', label: 'Vertrag abgeschlossen',  color: 'bg-green-100 text-green-800',     dot: 'bg-green-500' },
  { value: 'in_betreuung',          label: 'In Betreuung',           color: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
  { value: 'follow_up',             label: 'Follow-up',              color: 'bg-cyan-100 text-cyan-800',       dot: 'bg-cyan-400' },
  { value: 'nicht_interessiert',    label: 'Nicht interessiert',     color: 'bg-gray-200 text-gray-500',       dot: 'bg-gray-400' },
] as const;

export function getStatusMeta(status: string) {
  return ALL_STATUSES.find(s => s.value === status) ?? {
    value: status, label: status, color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-300',
  };
}
