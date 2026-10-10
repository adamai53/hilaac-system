import type { ReactNode } from "react";
import { EnTete } from "@/components/en-tete";
import { Badge } from "@/components/ui/badge";
import { requireEspace } from "@/lib/session";

export default async function LayoutPortail({
  children,
}: {
  children: ReactNode;
}) {
  const utilisateur = await requireEspace("client");
  return (
    <div className="min-h-dvh bg-muted/30">
      <EnTete
        espace="client"
        titre="HILAAC · Portail client"
        liens={[
          { href: "/portail", libelle: "Accueil" },
          { href: "/portail/performance", libelle: "Performance" },
        ]}
        utilisateur={utilisateur}
        accessoire={
          utilisateur.role === "lecteur_client" ? (
            <Badge variant="secondary">Lecture seule</Badge>
          ) : null
        }
      />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
