import { Activity, Boxes, ClipboardList, Package, Trash2 } from 'lucide-react';

import type { DashboardSummary } from '@/lib/db/queries/lavorazioni';

type SummaryBarProps = {
  summary: DashboardSummary;
};

const formatKg = (value: number) => `${value.toLocaleString('it-IT', { maximumFractionDigits: 1 })} kg`;

export function SummaryBar({ summary }: SummaryBarProps) {
  const kpiItems = [
    { label: 'Linee attive', value: summary.lineeAttive.toLocaleString('it-IT'), icon: Activity },
    { label: 'Lavorazioni aperte', value: summary.lavorazioniAperte.toLocaleString('it-IT'), icon: ClipboardList },
    { label: 'Pedane oggi', value: summary.pedaneOggi.toLocaleString('it-IT'), icon: Package },
    { label: 'Colli oggi', value: summary.colliOggi.toLocaleString('it-IT'), icon: Boxes },
    { label: 'Scarto oggi', value: formatKg(summary.scartoOggiKg), icon: Trash2 }
  ];

  return (
    <div className="sticky top-16 z-20 rounded-xl bg-gradient-to-r from-primary to-sky-600 p-4 text-white shadow-lg">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-5 md:gap-0">
        {kpiItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={`flex items-center gap-3 px-3 ${index < kpiItems.length - 1 ? 'md:border-r md:border-white/20' : ''}`}>
              <Icon className="h-4 w-4" />
              <p className="text-sm">
                {item.label}: <strong>{item.value}</strong>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
