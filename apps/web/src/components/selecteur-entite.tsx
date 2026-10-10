"use client";

import { usePathname } from "next/navigation";
import { choisirEntite } from "@/lib/actions";

interface Props {
  entites: { id: string; nom: string }[];
  selection: string;
}

/** Préférence d'affichage envoyée au serveur ; le périmètre réel reste décidé par la base. */
export function SelecteurEntite({ entites, selection }: Props) {
  const retour = usePathname();
  return (
    <form action={choisirEntite}>
      <input type="hidden" name="retour" value={retour} />
      <label className="sr-only" htmlFor="selecteur-entite">
        Entité affichée
      </label>
      <select
        id="selecteur-entite"
        name="entite"
        defaultValue={selection}
        onChange={(evenement) => evenement.currentTarget.form?.requestSubmit()}
        className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
      >
        <option value="toutes">Toutes les entités</option>
        {entites.map((e) => (
          <option key={e.id} value={e.id}>
            {e.nom}
          </option>
        ))}
      </select>
    </form>
  );
}
