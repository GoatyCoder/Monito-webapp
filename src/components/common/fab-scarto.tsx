type FabScartoProps = {
  canEdit: boolean;
};

export function FabScarto({ canEdit }: FabScartoProps) {
  if (!canEdit) {
    return null;
  }

  return (
    <button
      type="button"
      className="fixed bottom-4 right-4 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg"
    >
      {/* Pulsante azione rapida per registrazione scarto. */}
      + Registra Scarto
    </button>
  );
}
