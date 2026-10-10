import { accueilEquipe } from "@hilaac/db";
import { BadgeStatut } from "@/components/badge-statut";
import { Section, Vide } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { getAppDb } from "@/lib/db";
import { formaterDateCourte } from "@/lib/format";
import {
  LIBELLE_EQUIPE,
  LIBELLE_STATUT_JALON,
  LIBELLE_STATUT_TACHE,
  LIBELLE_TYPE_DEMANDE,
  LIBELLE_URGENCE,
} from "@/lib/libelles";
import { entiteSelectionnee } from "@/lib/selection-entite";
import { requireEspace } from "@/lib/session";

export const metadata = { title: "Accueil — HILAAC · Équipe" };

type Tache = Awaited<ReturnType<typeof accueilEquipe>>["tachesDuJour"][number];

function ListeTaches({ taches, vide }: { taches: Tache[]; vide: string }) {
  if (taches.length === 0) return <Vide>{vide}</Vide>;
  return (
    <ul className="grid gap-3 text-sm">
      {taches.map((t) => (
        <li
          key={t.id}
          className="flex flex-wrap items-center justify-between gap-2"
        >
          <div>
            <p className="font-medium">{t.titre}</p>
            <p className="text-muted-foreground">
              {t.entite}
              {t.projet ? ` · ${t.projet}` : ""} · {LIBELLE_EQUIPE[t.equipe]} ·
              échéance {formaterDateCourte(t.echeance)}
            </p>
          </div>
          <BadgeStatut statut={t.statut} libelles={LIBELLE_STATUT_TACHE} />
        </li>
      ))}
    </ul>
  );
}

export default async function AccueilEquipe() {
  const utilisateur = await requireEspace("equipe");
  const entiteId = await entiteSelectionnee();
  const accueil = await getAppDb().withTenant(
    { utilisateurId: utilisateur.id, entiteId },
    (tx) => accueilEquipe(tx, utilisateur.id),
  );

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">
        Bonjour {utilisateur.nom.split(" ")[0]}
      </h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Section titre={`Mes tâches du jour (${accueil.tachesDuJour.length})`}>
          <ListeTaches
            taches={accueil.tachesDuJour}
            vide="Aucune tâche à échéance aujourd'hui."
          />
        </Section>
        <Section titre={`Mes retards (${accueil.retards.length})`}>
          <ListeTaches
            taches={accueil.retards}
            vide="Aucune tâche en retard."
          />
        </Section>
        <Section
          titre={`Demandes à qualifier (${accueil.demandesAQualifier.length})`}
        >
          {accueil.demandesAQualifier.length === 0 ? (
            <Vide>Aucune demande en attente de qualification.</Vide>
          ) : (
            <ul className="grid gap-3 text-sm">
              {accueil.demandesAQualifier.map((d) => (
                <li
                  key={d.id}
                  className="flex flex-wrap items-center justify-between gap-2"
                >
                  <div>
                    <p className="font-medium">{d.titre}</p>
                    <p className="text-muted-foreground">
                      {d.entite} · {LIBELLE_TYPE_DEMANDE[d.type]}
                      {d.auteur ? ` · par ${d.auteur}` : ""}
                    </p>
                  </div>
                  <Badge
                    variant={
                      d.urgence === "haute" || d.urgence === "critique"
                        ? "destructive"
                        : "outline"
                    }
                  >
                    {LIBELLE_URGENCE[d.urgence]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Section>
        <Section titre={`Jalons à risque (${accueil.jalonsARisque.length})`}>
          {accueil.jalonsARisque.length === 0 ? (
            <Vide>Aucun jalon à risque.</Vide>
          ) : (
            <ul className="grid gap-3 text-sm">
              {accueil.jalonsARisque.map((j) => (
                <li
                  key={j.id}
                  className="flex flex-wrap items-center justify-between gap-2"
                >
                  <div>
                    <p className="font-medium">{j.titre}</p>
                    <p className="text-muted-foreground">
                      {j.entite} · {j.projet} · échéance{" "}
                      {formaterDateCourte(j.echeance)} · {j.tachesOuvertes}{" "}
                      tâche{j.tachesOuvertes > 1 ? "s" : ""} ouverte
                      {j.tachesOuvertes > 1 ? "s" : ""}
                    </p>
                  </div>
                  <BadgeStatut
                    statut={j.statut}
                    libelles={LIBELLE_STATUT_JALON}
                  />
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
