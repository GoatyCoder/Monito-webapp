import { Activity, Boxes, ClipboardList, Package, Trash2 } from 'lucide-react';

const KpiItems = [
  { label: 'Linee attive', value: '0', icon: Activity },
  { label: 'Lavorazioni aperte', value: '0', icon: ClipboardList },
  { label: 'Pedane oggi', value: '0', icon: Package },
  { label: 'Colli oggi', value: '0', icon: Boxes },
  { label: 'Scarto oggi', value: '0 kg', icon: Trash2 }
];

export function SummaryBar() {
  return (
    <div className="sticky top-16 rounded-lg bg-primary p-4 text-white">
      {/* KPI con icone e separatori per una lettura più rapida del riepilogo. */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-5 md:gap-0">
        {KpiItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={`flex items-center gap-3 px-3 ${index < KpiItems.length - 1 ? 'md:border-r md:border-white/20' : ''}`}>
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
