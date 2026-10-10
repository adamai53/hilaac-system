# CLAUDE.md — HILAAC System

Plateforme interne de pilotage digital d'un groupe : demandes clients, gestion de projet,
données Facebook et LinkedIn, analytics web et SEO, supervision WordPress, reporting client.

## Frontières d'architecture (non négociables)

1. **apps/web n'appelle jamais une API externe.** Il lit et écrit en base, et met des jobs en
   file pour le worker. ESLint interdit `fetch` dans `apps/web/src`.
2. **apps/worker est le seul processus autorisé à sortir vers l'extérieur** (API Meta,
   LinkedIn, Google, sites WordPress, SMTP…). Tout appel sortant est un job BullMQ.
3. **Tout accès à la base passe par packages/db.** Aucun SQL, aucun import de `drizzle-orm`,
   `postgres` ou `pg` dans `apps/*` (règle ESLint `no-restricted-imports`). Les requêtes sont
   exposées comme fonctions par `@hilaac/db`.
4. **Aucun secret dans le code ni dans le dépôt.** Les secrets viennent des variables
   d'environnement ; `.env` est ignoré par git, `.env.example` ne contient que des valeurs
   locales factices. Les images Docker ne reçoivent aucune variable à la construction.

5. **Le cloisonnement par entité est appliqué par la base, jamais par le seul code
   applicatif.** Toute lecture métier passe par `withTenant`, sous le rôle `hilaac_app`
   soumis à Row Level Security (voir « Cloisonnement » ci-dessous).

Interdits : Vercel, fonctions serverless, ORM autre que Drizzle, état serveur dans le
navigateur (le navigateur n'est qu'une vue ; la source de vérité est Postgres).

## Cloisonnement (RLS)

**Rôles Postgres** — un rôle par usage, une URL par rôle dans l'environnement :

| Rôle            | Variable              | Usage                                                            |
| --------------- | --------------------- | ---------------------------------------------------------------- |
| `hilaac`        | `DATABASE_URL`        | propriétaire : migrations et seed uniquement                     |
| `hilaac_app`    | `DATABASE_URL_APP`    | requêtes métier de apps/web, soumis à RLS, lecture seule         |
| `hilaac_auth`   | `DATABASE_URL_AUTH`   | Better Auth : `utilisateur`, `session`, `compte`, `verification` |
| `hilaac_worker` | `DATABASE_URL_WORKER` | apps/worker, `BYPASSRLS` ; jamais le rôle applicatif             |
| `hilaac_rls`    | —                     | `NOLOGIN BYPASSRLS`, propriétaire des fonctions de périmètre     |

Les mots de passe ne sont jamais dans les migrations : `db:migrate` les pose à partir des URL.

**Point d'entrée unique** : `withTenant({ utilisateurId, entiteId }, fn)` (`packages/db/src/tenant.ts`)
ouvre une transaction et pose `app.user_id` et `app.tenant_id` (`SET LOCAL`). `entiteId` vaut un
uuid ou `TOUTES_LES_ENTITES`. Un client est toujours appelé avec son `entiteId` de session ;
aucun paramètre d'URL n'entre dans son périmètre.

**Policies** : toute table portant `entite_id` (et `entite`, `utilisateur`) est en `ENABLE` +
`FORCE ROW LEVEL SECURITY`. Les policies appellent `app.entite_autorisee(entite_id)`,
`app.projet_visible(projet_id)` et `app.utilisateur_visible(id)` (`migrations/0002_securite_rls.sql`) :

- admin, direction, lead : toutes les entités ; membre : les entités de `suivi_entite`
  (aucune ligne = rien, fail-closed) ; rôles client : leur `utilisateur.entite_id` seulement.
- un membre ne voit que les projets où il a une ligne `affectation_projet`, plus les tâches
  dont il est responsable.
- un client ne voit que les utilisateurs de son entité et ceux qui y interviennent (auteur,
  responsable, affecté). La colonne `email` n'est accordée qu'à `hilaac_auth`.
- sans contexte posé, aucune ligne n'est visible.

**Ne jamais** rendre une fonction de périmètre propriété d'un rôle soumis à RLS : elle lirait
`suivi_entite` ou `utilisateur` à travers les policies qui l'appellent (récursion, ou zéro ligne
en silence). Le test « pas de récursion » de `isolation.test.ts` échoue dans ce cas.

**Nouvelle table métier** : colonne `entite_id`, clé étrangère composite `(parent_id, entite_id)`
vers son parent (unique `(id, entite_id)` côté parent), RLS + policy dans une migration, droits
`SELECT` pour `hilaac_app` et lecture-écriture pour `hilaac_worker`, et une ligne dans `TABLES_CLOISONNEES` du test
d'isolation.

**À venir (livrable suivant)** : l'assignation d'une tâche devra créer la ligne
`affectation_projet` correspondante, sinon le responsable voit sa tâche sans voir son projet.

## Authentification

Better Auth (e-mail et mot de passe, sessions en base) dans `apps/web/src/lib/auth.ts`, sur la
connexion `hilaac_auth`. Deux surfaces : `/connexion` (équipe → `/app`) et `/portail/connexion`
(clients → `/portail`). Le hook `session.create.before` refuse de créer une session pour un
compte de l'autre famille. Chaque layout **et** chaque page appelle `requireEspace()` : sans
session, redirection vers la connexion ; mauvaise famille, `forbidden()` (HTTP 403).

## Monorepo

| Workspace       | Paquet           | Rôle                                                         |
| --------------- | ---------------- | ------------------------------------------------------------ |
| `apps/web`      | `@hilaac/web`    | Next.js 16 App Router, Tailwind 4, shadcn/ui                 |
| `apps/worker`   | `@hilaac/worker` | Processus Node, BullMQ — seul à sortir vers l'extérieur      |
| `packages/db`   | `@hilaac/db`     | Drizzle ORM : client, schéma, migrations, seed, requêtes     |
| `packages/core` | `@hilaac/core`   | Types et schémas Zod partagés : env, noms de files, payloads |

Dépendances autorisées : `apps/* → packages/*`, `packages/db → packages/core`.
Jamais `packages/* → apps/*`, jamais `apps/web ↔ apps/worker` (ils communiquent par Postgres
et Redis uniquement).

Les paquets `@hilaac/*` exportent leur source TypeScript (`exports: ./src/index.ts`), sans
étape de build : Next.js les transpile (`transpilePackages`), tsdown les embarque dans le
bundle du worker.

## Conventions

- **TypeScript strict** (`tsconfig.base.json`) : `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `verbatimModuleSyntax`. Imports de types avec `import type`.
- **Variables d'environnement** : chaque processus a son schéma Zod dans
  `packages/core/src/env.ts`. Les points d'entrée appellent `parseEnvOrExit` — une variable
  manquante arrête le processus avec un message explicite. Toute nouvelle variable est ajoutée
  au schéma **et** à `.env.example`. Un seul `.env`, à la racine.
- **Files BullMQ** : nom dans `QUEUE_NAMES` et schéma Zod du payload dans
  `packages/core/src/queues.ts`. Le processeur valide le payload avec ce schéma.
- **Base de données** : tables dans `packages/db/src/schema/` exportées par `schema/index.ts`,
  puis `pnpm db:generate` et `pnpm db:migrate`. Ne jamais modifier une migration déjà
  appliquée. Les requêtes vivent dans `packages/db/src/requetes/` et sélectionnent leurs
  colonnes explicitement (`hilaac_app` n'a pas accès à toutes les colonnes de `utilisateur`).
- **Piège Drizzle** : dans une requête à table unique, Drizzle n'écrit pas le nom de table devant
  les colonnes ; une sous-requête corrélée dans `select({ … sql\`(select … where x = ${table.col})\` })`
compare alors la sous-requête avec elle-même, sans erreur. Utiliser une jointure sur une
sous-requête agrégée (`.as("alias")`, alias de colonnes uniques).
- **Seed** : identifiants UUID v5 (`idDemo`), horodatages déterministes, upsert de toutes les
  colonnes ; rejouer `pnpm db:seed` donne exactement le même état. Données entièrement fictives.
- **Journalisation du worker** : pino, JSON en production, `pino-pretty` en développement.
- **UI** : composants shadcn/ui dans `apps/web/src/components/ui` (`pnpm dlx shadcn@4.21.4 add <composant>`
  depuis `apps/web`). Ces fichiers ne sont pas modifiés à la main et échappent aux règles ESLint
  typées ; la CLI peut installer des dépendances manquantes ou inattendues, vérifier
  `package.json` après chaque ajout.
- **Dépendances** : versions exactes (`saveExact: true`). Tout script d'installation natif
  doit être approuvé explicitement (`allowBuilds` dans `pnpm-workspace.yaml`).
- **Réserve ESLint 10** : `eslint-config-next@16.4.0` embarque `eslint-plugin-import@2.32.0`,
  `eslint-plugin-jsx-a11y@6.10.2` et `eslint-plugin-react@7.37.5`, qui ne déclarent pas encore
  ESLint 10 dans leurs peers (`pnpm peers check` le signale). Ils fonctionnent aujourd'hui et
  `pnpm lint` passe, mais une montée de version d'ESLint ou de ces plugins doit être suivie d'un
  `pnpm lint` complet ; en cas de casse, revenir à ESLint 9 plutôt que de désactiver des règles.
- **TypeScript** est figé en 6.0.x : `typescript-eslint@8.71` exige `typescript < 6.1`.
- **Commits** : Conventional Commits (commitlint). Le hook pre-commit lance ESLint et
  Prettier sur les fichiers indexés.
- Pas de code mort, pas de TODO, pas de fonctionnalité non demandée.

## Commandes de vérification

Avant de déclarer une tâche terminée, exécuter :

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm test:e2e   # avec pnpm db:up
```
