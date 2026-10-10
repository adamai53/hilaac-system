import { espaceDuRole, type Espace } from "@hilaac/core";
import { redirect } from "next/navigation";
import { FormulaireConnexion } from "@/components/formulaire-connexion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { urlAccueil } from "@/lib/auth";
import { sessionCourante } from "@/lib/session";

const TEXTES: Record<Espace, { titre: string; description: string }> = {
  equipe: {
    titre: "Espace équipe",
    description: "Réservé aux équipes du groupe.",
  },
  client: {
    titre: "Portail client",
    description: "Suivez vos demandes, projets et performances.",
  },
};

export async function PageConnexion({ espace }: { espace: Espace }) {
  const utilisateur = await sessionCourante();
  if (utilisateur && espaceDuRole(utilisateur.role) === espace)
    redirect(urlAccueil(espace));
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>
            <h1 className="text-xl font-semibold">{TEXTES[espace].titre}</h1>
          </CardTitle>
          <CardDescription>{TEXTES[espace].description}</CardDescription>
        </CardHeader>
        <CardContent>
          <FormulaireConnexion espace={espace} />
        </CardContent>
      </Card>
    </main>
  );
}
