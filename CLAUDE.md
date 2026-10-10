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

Interdits : Vercel, fonctions serverless, ORM autre que Drizzle, état serveur dans le
navigateur (le navigateur n'est qu'une vue ; la source de vérité est Postgres).

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
  appliquée.
- **Journalisation du worker** : pino, JSON en production, `pino-pretty` en développement.
- **UI** : composants shadcn/ui dans `apps/web/src/components/ui` (`pnpm dlx shadcn@4.21.4 add <composant>`
  depuis `apps/web`).
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
