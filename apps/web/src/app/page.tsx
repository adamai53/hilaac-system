import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AccueilPublic() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            <h1 className="text-xl font-semibold">HILAAC System</h1>
          </CardTitle>
          <CardDescription>
            Plateforme interne de pilotage digital du groupe.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <Link className="underline underline-offset-4" href="/connexion">
            Espace équipe
          </Link>
          <Link
            className="underline underline-offset-4"
            href="/portail/connexion"
          >
            Portail client
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
