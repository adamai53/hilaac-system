import { Badge } from "@/components/ui/badge";

const VARIANTE: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  a_qualifier: "outline",
  en_attente_validation: "default",
  en_validation: "default",
  bloquee: "destructive",
  refusee: "destructive",
  echec: "destructive",
  terminee: "secondary",
  atteint: "secondary",
  publiee: "secondary",
};

export function BadgeStatut({
  statut,
  libelles,
}: {
  statut: string;
  libelles: Record<string, string>;
}) {
  return (
    <Badge variant={VARIANTE[statut] ?? "outline"}>
      {libelles[statut] ?? statut}
    </Badge>
  );
}
