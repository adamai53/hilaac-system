import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomePage() {
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
        <CardContent className="text-muted-foreground">
          État des services :{" "}
          <a
            className="text-foreground underline underline-offset-4"
            href="/api/health"
          >
            /api/health
          </a>
        </CardContent>
      </Card>
    </main>
  );
}
