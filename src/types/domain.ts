/*
  Tipi dominio minimi (placeholder) coerenti con docs/Schema.md.
  Nessuna logica applicativa in questa fase.
*/

export type UserRole = 'admin' | 'operatore' | 'viewer';

export type Linea = {
  id: string;
  nome: string;
  attiva: boolean;
  ordine: number | null;
};

export type Lavorazione = {
  id: string;
  lineaId: string;
  lottoIngressoId: string;
  articoloId: string;
  stato: 'aperta' | 'chiusa';
};

export type Pedana = {
  id: string;
  codicePedana: string;
  lavorazioneId: string;
  numeroColli: number;
  pesoTotale: number;
};

export type Scarto = {
  id: string;
  lottoIngressoId: string;
  colli: number | null;
  pesoKg: number | null;
};
