/*
  Tipi dominio minimi (placeholder) coerenti con docs/Schema.md.
  Nessuna logica applicativa in questa fase.
*/

export type UserRole = 'admin' | 'operatore' | 'viewer';

export type EntityAuditFields = {
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
};

export type SoftDeletable = {
  isActive: boolean;
  deletedAt: string | null;
  deletedBy: string | null;
};

export type ProdottoGrezzo = EntityAuditFields &
  SoftDeletable & {
    id: string;
    nome: string;
    descrizione: string | null;
  };

export type Varieta = EntityAuditFields &
  SoftDeletable & {
    id: string;
    nome: string;
    descrizione: string | null;
    prodottoGrezzoId: string;
  };

export type Articolo = EntityAuditFields &
  SoftDeletable & {
    id: string;
    nome: string;
    descrizione: string | null;
    pesoPerCollo: number;
    pesoVariabile: boolean;
    vincoloProdottoGrezzoId: string | null;
    vincoloVarietaId: string | null;
  };

export type ImballaggioSecondario = EntityAuditFields &
  SoftDeletable & {
    id: string;
    nome: string;
    descrizione: string | null;
    taraKg: number | null;
    lunghezzaCm: number | null;
    larghezzaCm: number | null;
    altezzaCm: number | null;
  };

export type Linea = EntityAuditFields & {
  id: string;
  nome: string;
  descrizione: string | null;
  isActive: boolean;
  ordine: number | null;
};

export type SiglaLotto = EntityAuditFields & {
  id: string;
  codice: string;
  produttore: string;
  prodottoGrezzoId: string;
  varietaId: string;
  campo: string | null;
};

export type LottoIngresso = EntityAuditFields & {
  id: string;
  codice: string;
  siglaLottoId: string;
  dataIngresso: string;
  doy: number;
};

export type Lavorazione = EntityAuditFields & {
  id: string;
  lineaId: string;
  lottoIngressoId: string;
  articoloId: string;
  stato: 'aperta' | 'chiusa';
};

export type Pedana = EntityAuditFields & {
  id: string;
  codicePedana: string;
  lavorazioneId: string;
  numeroColli: number;
  pesoTotale: number;
};

export type Scarto = EntityAuditFields & {
  id: string;
  lottoIngressoId: string;
  colli: number | null;
  pesoKg: number | null;
};

export type AuditLog = {
  id: string;
  eventAt: string;
  actorId: string;
  actorName: string;
  tableName: string;
  recordId: string;
  action: 'insert' | 'update' | 'soft_delete' | 'restore' | 'open' | 'close' | 'reopen';
  fieldName: string | null;
  oldValue: unknown;
  newValue: unknown;
  reason: string | null;
};
