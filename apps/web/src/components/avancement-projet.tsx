import type { ficheEntite } from "@hilaac/db";
import { BadgeStatut } from "@/components/badge-statut";
import { Vide } from "@/components/section";
import { formaterDateCourte } from "@/lib/format";
import { LIBELLE_STATUT_JALON } from "@/lib/libelles";

type Projet = NonNullable<Awaited<ReturnType<typeof ficheEntite>>>["projet"];

export function AvancementProjet({
  projet,
  couleur,
}: {
  projet: Projet;
  couleur: string;
}) {
  if (!projet) return <Vide>Aucun projet en cours visible.</Vide>;
  const pourcentage =
    projet.taches.total === 0
      ? 0
      : Math.round((projet.taches.terminees / projet.taches.total) * 100);
  return (
    <div className="grid gap-4 text-sm">
      <div>
        <p className="font-medium">{projet.nom}</p>
        <p className="text-muted-foreground">{projet.description}</p>
        <p className="text-muted-foreground">
          Responsable : {projet.responsable ?? "—"} · du{" "}
          {formaterDateCourte(projet.dateDebut)} au{" "}
          {formaterDateCourte(projet.dateFinPrevue)}
        </p>
      </div>
      <div className="grid gap-1">
        <div className="flex justify-between">
          <span>Avancement</span>
          <span>
            {projet.taches.terminees} / {projet.taches.total} tâches ·{" "}
            {pourcentage} %
          </span>
        </div>
        <div
          className="h-2 rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={pourcentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Avancement du projet"
        >
          <div
            className="h-2 rounded-full"
            style={{ width: `${pourcentage}%`, backgroundColor: couleur }}
          />
        </div>
      </div>
      <ol className="grid gap-2">
        {projet.jalons.map((j) => (
          <li key={j.id} className="flex items-center justify-between gap-2">
            <span>
              {j.titre} · {formaterDateCourte(j.echeance)}
            </span>
            <BadgeStatut statut={j.statut} libelles={LIBELLE_STATUT_JALON} />
          </li>
        ))}
      </ol>
    </div>
  );
}
