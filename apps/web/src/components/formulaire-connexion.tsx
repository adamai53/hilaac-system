"use client";

import type { Espace } from "@hilaac/core";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { seConnecter, type EtatConnexion } from "@/lib/actions";

const ETAT_INITIAL: EtatConnexion = { erreur: null };

export function FormulaireConnexion({ espace }: { espace: Espace }) {
  const [etat, action, enCours] = useActionState(
    seConnecter.bind(null, espace),
    ETAT_INITIAL,
  );
  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="motDePasse">Mot de passe</Label>
        <Input
          id="motDePasse"
          name="motDePasse"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {etat.erreur && (
        <p role="alert" className="text-sm text-destructive">
          {etat.erreur}
        </p>
      )}
      <Button type="submit" disabled={enCours}>
        {enCours ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}
