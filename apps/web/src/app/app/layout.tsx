import { listerEntites, TOUTES_LES_ENTITES } from "@hilaac/db";
import type { ReactNode } from "react";
import { EnTete } from "@/components/en-tete";
import { SelecteurEntite } from "@/components/selecteur-entite";
import { getAppDb } from "@/lib/db";
import { entiteSelectionnee } from "@/lib/selection-entite";
import { requireEspace } from "@/lib/session";

export default async function LayoutEquipe({
  children,
}: {
  children: ReactNode;
}) {
  const utilisateur = await requireEspace("equipe");
  const [entites, selection] = await Promise.all([
    getAppDb().withTenant(
      { utilisateurId: utilisateur.id, entiteId: TOUTES_LES_ENTITES },
      listerEntites,
    ),
    entiteSelectionnee(),
  ]);
  return (
    <div className="min-h-dvh bg-muted/30">
      <EnTete
        espace="equipe"
        titre="HILAAC · Équipe"
        liens={[
          { href: "/app", libelle: "Accueil" },
          { href: "/app/entites", libelle: "Entités" },
        ]}
        utilisateur={utilisateur}
        accessoire={<SelecteurEntite entites={entites} selection={selection} />}
      />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
