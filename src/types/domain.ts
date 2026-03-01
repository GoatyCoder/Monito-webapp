/*
  Domain placeholder types coerenti con docs/Schema.md.
  Convenzione: identificatori in inglese (PRD: variabili/funzioni in inglese).
*/

export type UserRole = 'admin' | 'operator' | 'viewer';

export type Line = {
  id: string;
  name: string;
  active: boolean;
  order: number | null;
};

export type ProductionRunStatus = 'open' | 'closed';

export type ProductionRun = {
  id: string;
  lineId: string;
  entryLotId: string;
  articleId: string;
  status: ProductionRunStatus;
};

export type Pallet = {
  id: string;
  palletCode: string;
  productionRunId: string;
  caseCount: number;
  totalWeightKg: number;
};

export type Waste = {
  id: string;
  entryLotId: string;
  caseCount: number | null;
  weightKg: number | null;
};
