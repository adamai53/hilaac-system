import { ficheEntite } from "@hilaac/db";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AvancementProjet } from "@/components/avancement-projet";
import { BadgeStatut } from "@/components/badge-statut";
import { GraphiqueSerie } from "@/components/graphique-serie";
import { Section, Vide } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAppDb } from "@/lib/db";
import { formaterDateCourte, formaterNombre } from "@/lib/format";
import {
  LIBELLE_RESEAU,
  LIBELLE_STATUT_DEMANDE,
  LIBELLE_STATUT_PUBLICATION,
  LIBELLE_TYPE_ACTIF,
  LIBELLE_TYPE_DEMANDE,
  LIBELLE_URGENCE,
} from "@/lib/libelles";
import { requireEspace } from "@/lib/session";

export const metadata = { title: "Fiche entité — HILAAC · Équipe" };

export default async function FicheEntite({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const utilisateur = await requireEspace("equipe");
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();

  // L'identifiant de l'URL devient le tenant : hors périmètre, la base ne renvoie rien.
  const fiche = await getAppDb().withTenant(
    { utilisateurId: utilisateur.id, entiteId: id.data },
    (tx) => ficheEntite(tx, id.data),
  );
  if (!fiche) notFound();

  const { entite } = fiche;
  const sessions = fiche.trafic.reduce((somme, jour) => somme + jour.valeur, 0);

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="size-4 rounded-full"
          style={{ backgroundColor: entite.couleurMarque }}
        />
        <h1 className="text-2xl font-semibold">{entite.nom}</h1>
        <Badge variant="outline">{entite.secteur}</Badge>
      </div>

      <Section
        titre={`Trafic du site · 60 jours · ${formaterNombre(sessions)} sessions`}
      >
        {fiche.trafic.length === 0 ? (
          <Vide>Aucune mesure de trafic.</Vide>
        ) : (
          <GraphiqueSerie
            serie={fiche.trafic}
            libelle="Sessions"
            couleur={entite.couleurMarque}
          />
        )}
      </Section>

      <div className="grid gap-6 md:grid-cols-2">
        <Section titre="Projet en cours">
          <AvancementProjet
            projet={fiche.projet}
            couleur={entite.couleurMarque}
          />
        </Section>
        <Section titre={`Actifs (${fiche.actifs.length})`}>
          <ul className="grid gap-2 text-sm">
            {fiche.actifs.map((a) => (
              <li key={a.id} className="flex flex-wrap justify-between gap-2">
                <span>
                  <span className="font-medium">{a.libelle}</span>{" "}
                  <span className="text-muted-foreground">
                    · {a.identifiant}
                  </span>
                </span>
                <span className="text-muted-foreground">
                  {LIBELLE_TYPE_ACTIF[a.type]} · {a.fournisseur}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <Section titre={`Demandes ouvertes (${fiche.demandes.length})`}>
        {fiche.demandes.length === 0 ? (
          <Vide>Aucune demande ouverte.</Vide>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Demande</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Urgence</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fiche.demandes.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.titre}</TableCell>
                  <TableCell>{LIBELLE_TYPE_DEMANDE[d.type]}</TableCell>
                  <TableCell>{LIBELLE_URGENCE[d.urgence]}</TableCell>
                  <TableCell>{formaterDateCourte(d.echeance)}</TableCell>
                  <TableCell>
                    <BadgeStatut
                      statut={d.statut}
                      libelles={LIBELLE_STATUT_DEMANDE}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>

      <Section titre="Dernières publications">
        <ul className="grid gap-3 text-sm">
          {fiche.publications.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2"
            >
              <span>
                <span className="text-muted-foreground">
                  {LIBELLE_RESEAU[p.reseau]} ·{" "}
                  {formaterDateCourte(p.programmeeLe)} ·{" "}
                </span>
                {p.contenu}
              </span>
              <BadgeStatut
                statut={p.statut}
                libelles={LIBELLE_STATUT_PUBLICATION}
              />
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
