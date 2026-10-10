import Link from "next/link";

export default function Interdit() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-xl font-semibold">Accès refusé</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Votre compte n&apos;a pas accès à cet espace.
      </p>
      <Link className="text-sm underline underline-offset-4" href="/">
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
