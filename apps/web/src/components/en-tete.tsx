import type { Espace } from "@hilaac/core";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { seDeconnecter } from "@/lib/actions";
import { LIBELLE_ROLE } from "@/lib/libelles";
import type { UtilisateurConnecte } from "@/lib/session";

interface Props {
  espace: Espace;
  titre: string;
  liens: { href: string; libelle: string }[];
  utilisateur: UtilisateurConnecte;
  /** Contenu à droite de la navigation (sélecteur d'entité, mention lecture seule). */
  accessoire?: ReactNode;
}

export function EnTete({
  espace,
  titre,
  liens,
  utilisateur,
  accessoire,
}: Props) {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <span className="font-semibold">{titre}</span>
        <nav className="flex gap-4 text-sm">
          {liens.map((lien) => (
            <Link
              key={lien.href}
              href={lien.href}
              className="text-muted-foreground hover:text-foreground"
            >
              {lien.libelle}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex flex-wrap items-center gap-3 text-sm">
          {accessoire}
          <span>
            {utilisateur.nom}{" "}
            <Badge variant="outline">{LIBELLE_ROLE[utilisateur.role]}</Badge>
          </span>
          <form action={seDeconnecter.bind(null, espace)}>
            <Button type="submit" variant="outline" size="sm">
              Se déconnecter
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
