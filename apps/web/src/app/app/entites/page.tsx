import { listerEntites } from "@hilaac/db";
import Link from "next/link";
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
import { entiteSelectionnee } from "@/lib/selection-entite";
import { requireEspace } from "@/lib/session";

export const metadata = { title: "Entités — HILAAC · Équipe" };

export default async function ListeEntites() {
  const utilisateur = await requireEspace("equipe");
  const entiteId = await entiteSelectionnee();
  const entites = await getAppDb().withTenant(
    { utilisateurId: utilisateur.id, entiteId },
    listerEntites,
  );

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Entités</h1>
      <Section
        titre={`${entites.length} entité${entites.length > 1 ? "s" : ""}`}
      >
        {entites.length === 0 ? (
          <Vide>Aucune entité dans votre périmètre.</Vide>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entité</TableHead>
                <TableHead>Secteur</TableHead>
                <TableHead>Projet en cours</TableHead>
                <TableHead className="text-right">Demandes ouvertes</TableHead>
                <TableHead className="text-right">Actifs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entites.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <Link
                      href={`/app/entites/${e.id}`}
                      className="flex items-center gap-2 font-medium underline-offset-4 hover:underline"
                    >
                      <span
                        aria-hidden
                        className="size-3 rounded-full"
                        style={{ backgroundColor: e.couleurMarque }}
                      />
                      {e.nom}
                    </Link>
                  </TableCell>
                  <TableCell>{e.secteur}</TableCell>
                  <TableCell>{e.projetEnCours ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    {e.demandesOuvertes}
                  </TableCell>
                  <TableCell className="text-right">{e.actifs}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>
    </div>
  );
}
