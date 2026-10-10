import { accueilPortail } from "@hilaac/db";
import { AvancementProjet } from "@/components/avancement-projet";
import { BadgeStatut } from "@/components/badge-statut";
import { Section, Vide } from "@/components/section";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAppDb } from "@/lib/db";
import { formaterDateCourte } from "@/lib/format";
import {
  LIBELLE_RESEAU,
  LIBELLE_STATUT_DEMANDE,
  LIBELLE_TYPE_DEMANDE,
} from "@/lib/libelles";
import { requireEspace } from "@/lib/session";

export const metadata = { title: "Accueil — HILAAC · Portail client" };

export default async function AccueilPortail() {
  const utilisateur = await requireEspace("client");
  // Le client est enfermé dans son entité : aucun paramètre d'URL n'entre dans le périmètre.
  const accueil = await getAppDb().withTenant(
    { utilisateurId: utilisateur.id, entiteId: utilisateur.entiteId },
    accueilPortail,
  );
  if (!accueil) throw new Error("Entité du compte client introuvable.");

  const { entite, demandes, aValider, projet } = accueil;
  const nombreAValider =
    aValider.demandes.length + aValider.publications.length;

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="size-4 rounded-full"
          style={{ backgroundColor: entite.couleurMarque }}
        />
        <h1 className="text-2xl font-semibold">{entite.nom}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Section titre={`En attente de votre validation (${nombreAValider})`}>
          {nombreAValider === 0 ? (
            <Vide>Rien n&apos;attend votre validation.</Vide>
          ) : (
            <ul className="grid gap-3 text-sm">
              {aValider.demandes.map((d) => (
                <li key={d.id}>
                  <p className="font-medium">{d.titre}</p>
                  <p className="text-muted-foreground">
                    Demande · {LIBELLE_TYPE_DEMANDE[d.type]} · échéance{" "}
                    {formaterDateCourte(d.echeance)}
                  </p>
                </li>
              ))}
              {aValider.publications.map((p) => (
                <li key={p.id}>
                  <p className="font-medium">{p.contenu}</p>
                  <p className="text-muted-foreground">
                    Publication {LIBELLE_RESEAU[p.reseau]} · prévue le{" "}
                    {formaterDateCourte(p.programmeeLe)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>
        <Section titre="Projet en cours">
          <AvancementProjet projet={projet} couleur={entite.couleurMarque} />
        </Section>
      </div>

      <Section titre={`Vos demandes (${demandes.length})`}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Demande</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Déposée le</TableHead>
              <TableHead>Échéance</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {demandes.map((d) => (
              <TableRow key={d.id}>
                <TableCell>
                  <span className="font-medium">{d.titre}</span>
                  {d.auteur && (
                    <span className="block text-muted-foreground">
                      par {d.auteur}
                    </span>
                  )}
                </TableCell>
                <TableCell>{LIBELLE_TYPE_DEMANDE[d.type]}</TableCell>
                <TableCell>{formaterDateCourte(d.creeLe)}</TableCell>
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
      </Section>
    </div>
  );
}
