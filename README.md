# HILAAC System

Plateforme interne de pilotage digital des entités du groupe.

## Prérequis

- Node.js **24.14.1** — version de référence du projet, fixée dans `.nvmrc` et utilisée par
  la CI (`node-version-file: .nvmrc`) et les images Docker. Avec nvm : `nvm use 24.14.1`
  (nvm-windows ne lit pas `.nvmrc` automatiquement, la version doit être passée en argument).
- pnpm **12.10.1** (`npm install -g pnpm@12.10.1`)
- Docker Desktop démarré

## Démarrage

```bash
pnpm install
pnpm local:setup   # crée .env, lance Postgres/Redis/Mailpit, applique les migrations et le seed
pnpm dev           # démarre apps/web (http://localhost:3000) et apps/worker
```

Vérification : `curl http://localhost:3000/api/health` renvoie `200` avec l'état de Postgres et de Redis.

## Comptes de démonstration

Créés par `pnpm db:seed` (idempotent, refusé si `NODE_ENV=production`). Entités, personnes et
chiffres sont **entièrement fictifs**. Mot de passe commun : **`Demo-Hilaac-2026`**.

| Compte                             | Rôle            | Entité             | Se connecter sur                        |
| ---------------------------------- | --------------- | ------------------ | --------------------------------------- |
| `admin@hilaac.test`                | admin           | toutes             | http://localhost:3000/connexion         |
| `direction@hilaac.test`            | direction       | toutes             | http://localhost:3000/connexion         |
| `lead@hilaac.test`                 | lead            | toutes             | http://localhost:3000/connexion         |
| `lea.martin@hilaac.test`           | membre          | suit les trois     | http://localhost:3000/connexion         |
| `omar.said@hilaac.test`            | membre          | suit les trois     | http://localhost:3000/connexion         |
| `referent@kelvane-logistique.test` | referent_client | Kelvane Logistique | http://localhost:3000/portail/connexion |
| `referent@hotels-sablon.test`      | referent_client | Hôtels Sablon      | http://localhost:3000/portail/connexion |
| `lecteur@clinique-orvia.test`      | lecteur_client  | Clinique Orvia     | http://localhost:3000/portail/connexion |

Léa Martin est affectée aux projets Kelvane et Sablon, Omar Saïd au projet Orvia : chacun ne voit
que ses projets (plus, pour Omar, une tâche Kelvane dont il est responsable).

## Services locaux

| Service    | Adresse                                           |
| ---------- | ------------------------------------------------- |
| Web        | http://localhost:3000                             |
| PostgreSQL | `postgres://hilaac:hilaac@localhost:5432/hilaac`  |
| Redis      | `redis://localhost:6379`                          |
| Mailpit    | http://localhost:8025 (SMTP sur `localhost:1025`) |

## Scripts

| Commande           | Rôle                                                      |
| ------------------ | --------------------------------------------------------- |
| `pnpm db:up`       | Démarre les conteneurs de `docker-compose.dev.yml`        |
| `pnpm db:down`     | Arrête les conteneurs (les volumes sont conservés)        |
| `pnpm db:generate` | Génère une migration à partir de `packages/db/src/schema` |
| `pnpm db:migrate`  | Applique les migrations                                   |
| `pnpm db:seed`     | Insère le jeu de démonstration (rejouable)                |
| `pnpm lint`        | ESLint sur tout le monorepo                               |
| `pnpm typecheck`   | Vérification TypeScript de chaque workspace               |
| `pnpm test`        | Vitest, dont l'isolation RLS sur la base locale (`db:up`) |
| `pnpm test:e2e`    | Tests Playwright (Postgres et Redis doivent tourner)      |
| `pnpm build`       | Build de production de web et worker                      |
| `pnpm format`      | Formatage Prettier                                        |

## Images Docker

À construire depuis la racine du dépôt :

```bash
docker build -f apps/web/Dockerfile -t hilaac-web .
docker build -f apps/worker/Dockerfile -t hilaac-worker .
```

Les variables d'environnement sont fournies au lancement du conteneur, jamais à la construction : `DATABASE_URL_APP`, `DATABASE_URL_AUTH`, `REDIS_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` pour web ; `REDIS_URL`, `LOG_LEVEL` pour worker.

## Télémétrie

Next.js et Turborepo envoient une télémétrie anonyme par défaut. La CI et les images la désactivent ; en local :

```bash
pnpm exec next telemetry disable   # depuis apps/web
pnpm exec turbo telemetry disable
```

Architecture et conventions : voir [CLAUDE.md](CLAUDE.md).
