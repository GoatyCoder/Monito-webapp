-- Aggiunge campi soft delete mancanti su registry.sigle_lotto
-- Necessario per disattivazione/ripristino da UI anagrafiche
ALTER TABLE registry.sigle_lotto
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id);

-- Allinea eventuali record storici privi di stato attivo
UPDATE registry.sigle_lotto
SET is_active = true
WHERE is_active IS NULL;
