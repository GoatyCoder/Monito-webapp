import { Button } from '@/components/common/button';

export default function HomePage() {
  return (
    <section className="space-y-4">
      {/* Intro pagina home placeholder. */}
      <h1 className="text-3xl font-bold">Monito Webapp</h1>
      <p className="text-secondary">Skeleton iniziale senza logica business.</p>

      {/* Navigazione principale con componente Button riutilizzabile. */}
      <nav className="flex flex-wrap gap-3">
        <Button asChild href="/dashboard" variant="primary">
          Cruscotto
        </Button>
        <Button asChild href="/report" variant="secondary">
          Report
        </Button>
        <Button asChild href="/anagrafiche" variant="secondary">
          Anagrafiche
        </Button>
      </nav>
    </section>
  );
}
