'use client';

import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

type FilterOption = {
  label: string;
  value: string;
};

type TextFilter = {
  key: string;
  label: string;
  placeholder: string;
  type: 'text';
};

type SelectFilter = {
  key: string;
  label: string;
  type: 'select';
  options: FilterOption[];
};

type RegistryFilterField = TextFilter | SelectFilter;

type RegistryFiltersProps = {
  fields: RegistryFilterField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
};

export function RegistryFilters({ fields, values, onChange }: RegistryFiltersProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      {/* Filtro riutilizzabile per mantenere coerenza tra tutte le sezioni anagrafiche. */}
      <div className="grid gap-3 md:grid-cols-3">
        {fields.map((field) => (
          <label key={field.key} className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">{field.label}</span>
            {field.type === 'text' ? (
              <Input
                value={values[field.key] ?? ''}
                placeholder={field.placeholder}
                onChange={(event) => onChange(field.key, event.target.value)}
              />
            ) : (
              <Select value={values[field.key] ?? ''} onChange={(event) => onChange(field.key, event.target.value)}>
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            )}
          </label>
        ))}
      </div>
    </div>
  );
}

export type { RegistryFilterField, FilterOption };
