import { performancePortail } from "@hilaac/db";
import { GraphiqueSerie } from "@/components/graphique-serie";
import { Section, Vide } from "@/components/section";
import { getAppDb } from "@/lib/db";
import { formaterDateCourte, formaterNombre } from "@/lib/format";
import { LIBELLE_RESEAU } from "@/lib/libelles";
import { requireEspace } from "@/lib/session";

export const metadata = { title: "Performance — HILAAC · Portail client" };

const somme = (serie: { valeur: number }[]) =>
  serie.reduce((total, jour) => total + jour.valeur, 0);

export default async function PerformancePortail() {
  const utilisateur = await requireEspace("client");
  const performance = await getAppDb().withTenant(
    { utilisateurId: utilisateur.id, entiteId: utilisateur.entiteId },
    performancePortail,
  );
  if (!performance) throw new Error("Entité du compte client introuvable.");

  const { entite, trafic, leads, publicationsDuMois } = performance;
  const engagementDuMois = somme(
    publicationsDuMois.map((p) => ({ valeur: p.engagement })),
  );

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Performance · {entite.nom}</h1>

      <Section
        titre={`Trafic du site · 60 jours · ${formaterNombre(somme(trafic))} sessions`}
      >
        <GraphiqueSerie
          serie={trafic}
          libelle="Sessions"
          couleur={entite.couleurMarque}
        />
      </Section>

      <div className="grid gap-6 md:grid-cols-2">
        <Section
          titre={`Leads reçus · 60 jours · ${formaterNombre(somme(leads))}`}
        >
          <GraphiqueSerie
            serie={leads}
            libelle="Leads"
            couleur={entite.couleurMarque}
          />
        </Section>
        <Section
          titre={`Publications du mois (${publicationsDuMois.length}) · ${formaterNombre(engagementDuMois)} interactions`}
        >
          {publicationsDuMois.length === 0 ? (
            <Vide>Aucune publication ce mois-ci.</Vide>
          ) : (
            <ul className="grid gap-3 text-sm">
              {publicationsDuMois.map((p) => (
                <li
                  key={p.id}
                  className="flex items-start justify-between gap-4"
                >
                  <span>
                    <span className="block text-muted-foreground">
                      {LIBELLE_RESEAU[p.reseau]} ·{" "}
                      {formaterDateCourte(p.programmeeLe)}
                    </span>
                    {p.contenu}
                  </span>
                  <span className="shrink-0 font-medium">
                    {formaterNombre(p.engagement)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
