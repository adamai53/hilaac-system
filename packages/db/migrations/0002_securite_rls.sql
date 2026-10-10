-- Cloisonnement par entité : rôles Postgres, fonctions de périmètre, Row Level Security, droits.
-- Les mots de passe des rôles de connexion ne sont jamais ici : db:migrate les pose depuis l'environnement.

-- ─── Rôles ────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hilaac_app') THEN
    CREATE ROLE hilaac_app;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hilaac_auth') THEN
    CREATE ROLE hilaac_auth;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hilaac_worker') THEN
    CREATE ROLE hilaac_worker;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hilaac_rls') THEN
    CREATE ROLE hilaac_rls;
  END IF;
END
$$;

-- Requêtes métier de apps/web : soumis à RLS.
ALTER ROLE hilaac_app NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
-- Better Auth : tables d'authentification uniquement.
ALTER ROLE hilaac_auth NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
-- apps/worker : seul rôle autorisé à ignorer RLS pour écrire les données collectées.
ALTER ROLE hilaac_worker NOLOGIN NOSUPERUSER BYPASSRLS NOCREATEDB NOCREATEROLE;
-- Propriétaire des fonctions de périmètre : ne se connecte jamais. BYPASSRLS évite que les
-- fonctions appelées par les policies soient elles-mêmes filtrées (récursion ou zéro ligne).
ALTER ROLE hilaac_rls NOLOGIN NOSUPERUSER BYPASSRLS NOCREATEDB NOCREATEROLE;

-- ─── Fonctions de périmètre ───────────────────────────────────────────────────
CREATE SCHEMA app;

-- Contexte posé par withTenant() : SET LOCAL, donc limité à la transaction.
CREATE FUNCTION app.utilisateur_courant() RETURNS uuid
LANGUAGE sql STABLE
SET search_path = pg_catalog
AS $$ SELECT nullif(current_setting('app.user_id', true), '')::uuid $$;

CREATE FUNCTION app.tenant_courant() RETURNS text
LANGUAGE sql STABLE
SET search_path = pg_catalog
AS $$ SELECT nullif(current_setting('app.tenant_id', true), '') $$;

-- Rôle de l'utilisateur courant, NULL sans contexte.
CREATE FUNCTION app.role_courant() RETURNS public.role_utilisateur
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$ SELECT u.role FROM public.utilisateur u WHERE u.id = app.utilisateur_courant() $$;

-- Vrai si l'utilisateur courant peut voir l'entité `cible` dans le tenant courant.
--   admin, direction, lead : toutes les entités
--   membre                 : les entités où il a une ligne suivi_entite (aucune ligne = rien)
--   rôles client           : son entité de rattachement, rien d'autre
-- app.tenant_id ('*' ou un uuid) ne peut que restreindre ce périmètre. Sans contexte : faux.
CREATE FUNCTION app.entite_autorisee(cible uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.utilisateur u
    WHERE u.id = app.utilisateur_courant()
      AND app.tenant_courant() IS NOT NULL
      AND (app.tenant_courant() = '*' OR cible = app.tenant_courant()::uuid)
      AND (
        u.role IN ('admin', 'direction', 'lead')
        OR (u.role = 'membre' AND EXISTS (
          SELECT 1 FROM public.suivi_entite s
          WHERE s.utilisateur_id = u.id AND s.entite_id = cible
        ))
        OR (u.role IN ('referent_client', 'lecteur_client') AND u.entite_id = cible)
      )
  )
$$;

-- Vrai si l'utilisateur courant peut voir le projet : un membre seulement s'il y est affecté.
CREATE FUNCTION app.projet_visible(cible uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.utilisateur u
    WHERE u.id = app.utilisateur_courant()
      AND (
        u.role <> 'membre'
        OR EXISTS (
          SELECT 1 FROM public.affectation_projet a
          WHERE a.projet_id = cible AND a.utilisateur_id = u.id
        )
      )
  )
$$;

-- Annuaire : l'équipe voit l'équipe et les clients de ses entités ; un client ne voit que les
-- utilisateurs de son entité et ceux qui interviennent sur une ligne de son entité.
CREATE FUNCTION app.utilisateur_visible(cible uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.utilisateur u
    WHERE u.id = app.utilisateur_courant()
      AND (
        cible = u.id
        OR (u.role IN ('admin', 'direction', 'lead', 'membre') AND EXISTS (
          SELECT 1 FROM public.utilisateur c
          WHERE c.id = cible AND (c.entite_id IS NULL OR app.entite_autorisee(c.entite_id))
        ))
        OR (u.role IN ('referent_client', 'lecteur_client') AND (
          EXISTS (SELECT 1 FROM public.utilisateur c WHERE c.id = cible AND c.entite_id = u.entite_id)
          OR EXISTS (SELECT 1 FROM public.demande d WHERE d.entite_id = u.entite_id AND d.auteur_id = cible)
          OR EXISTS (SELECT 1 FROM public.projet p WHERE p.entite_id = u.entite_id AND p.responsable_id = cible)
          OR EXISTS (SELECT 1 FROM public.tache t WHERE t.entite_id = u.entite_id AND t.responsable_id = cible)
          OR EXISTS (SELECT 1 FROM public.affectation_projet a WHERE a.entite_id = u.entite_id AND a.utilisateur_id = cible)
        ))
      )
  )
$$;

GRANT USAGE ON SCHEMA app TO hilaac_rls;
GRANT SELECT ON public.utilisateur, public.suivi_entite, public.affectation_projet,
  public.demande, public.projet, public.tache TO hilaac_rls;

ALTER FUNCTION app.utilisateur_courant() OWNER TO hilaac_rls;
ALTER FUNCTION app.tenant_courant() OWNER TO hilaac_rls;
ALTER FUNCTION app.role_courant() OWNER TO hilaac_rls;
ALTER FUNCTION app.entite_autorisee(uuid) OWNER TO hilaac_rls;
ALTER FUNCTION app.projet_visible(uuid) OWNER TO hilaac_rls;
ALTER FUNCTION app.utilisateur_visible(uuid) OWNER TO hilaac_rls;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app FROM PUBLIC;
GRANT USAGE ON SCHEMA app TO hilaac_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app TO hilaac_app;

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE public.entite ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entite FORCE ROW LEVEL SECURITY;
ALTER TABLE public.utilisateur ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utilisateur FORCE ROW LEVEL SECURITY;
ALTER TABLE public.suivi_entite ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suivi_entite FORCE ROW LEVEL SECURITY;
ALTER TABLE public.actif ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actif FORCE ROW LEVEL SECURITY;
ALTER TABLE public.demande ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demande FORCE ROW LEVEL SECURITY;
ALTER TABLE public.projet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projet FORCE ROW LEVEL SECURITY;
ALTER TABLE public.affectation_projet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affectation_projet FORCE ROW LEVEL SECURITY;
ALTER TABLE public.jalon ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jalon FORCE ROW LEVEL SECURITY;
ALTER TABLE public.tache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tache FORCE ROW LEVEL SECURITY;
ALTER TABLE public.tache_dependance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tache_dependance FORCE ROW LEVEL SECURITY;
ALTER TABLE public.publication ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publication FORCE ROW LEVEL SECURITY;
ALTER TABLE public.mesure ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesure FORCE ROW LEVEL SECURITY;
ALTER TABLE public.raw_payload ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_payload FORCE ROW LEVEL SECURITY;
ALTER TABLE public.journal_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_audit FORCE ROW LEVEL SECURITY;

-- Lecture seule pour hilaac_app : aucune policy d'écriture, aucun droit d'écriture.
CREATE POLICY isolation_entite ON public.entite FOR SELECT TO hilaac_app
  USING (app.entite_autorisee(id));
CREATE POLICY isolation_entite ON public.suivi_entite FOR SELECT TO hilaac_app
  USING (app.entite_autorisee(entite_id));
CREATE POLICY isolation_entite ON public.actif FOR SELECT TO hilaac_app
  USING (app.entite_autorisee(entite_id));
CREATE POLICY isolation_entite ON public.demande FOR SELECT TO hilaac_app
  USING (app.entite_autorisee(entite_id));
CREATE POLICY isolation_entite ON public.publication FOR SELECT TO hilaac_app
  USING (app.entite_autorisee(entite_id));
CREATE POLICY isolation_entite ON public.mesure FOR SELECT TO hilaac_app
  USING (app.entite_autorisee(entite_id));
CREATE POLICY isolation_entite ON public.raw_payload FOR SELECT TO hilaac_app
  USING (app.entite_autorisee(entite_id));

CREATE POLICY isolation_projet ON public.projet FOR SELECT TO hilaac_app
  USING (app.entite_autorisee(entite_id) AND app.projet_visible(id));
CREATE POLICY isolation_projet ON public.affectation_projet FOR SELECT TO hilaac_app
  USING (app.entite_autorisee(entite_id) AND app.projet_visible(projet_id));
CREATE POLICY isolation_projet ON public.jalon FOR SELECT TO hilaac_app
  USING (app.entite_autorisee(entite_id) AND app.projet_visible(projet_id));
-- Le responsable d'une tâche la voit même s'il n'est pas affecté au projet.
CREATE POLICY isolation_projet ON public.tache FOR SELECT TO hilaac_app
  USING (
    app.entite_autorisee(entite_id)
    AND (app.projet_visible(projet_id) OR responsable_id = app.utilisateur_courant())
  );
-- Une dépendance est visible si la tâche qui la porte l'est (sous-requête soumise à RLS).
CREATE POLICY isolation_projet ON public.tache_dependance FOR SELECT TO hilaac_app
  USING (
    app.entite_autorisee(entite_id)
    AND EXISTS (SELECT 1 FROM public.tache t WHERE t.id = tache_id)
  );

CREATE POLICY isolation_audit ON public.journal_audit FOR SELECT TO hilaac_app
  USING (
    CASE
      WHEN entite_id IS NULL THEN app.role_courant() IN ('admin', 'direction', 'lead')
      ELSE app.entite_autorisee(entite_id)
    END
  );

CREATE POLICY annuaire ON public.utilisateur FOR SELECT TO hilaac_app
  USING (app.utilisateur_visible(id));
CREATE POLICY auth_complet ON public.utilisateur FOR ALL TO hilaac_auth
  USING (true) WITH CHECK (true);

-- ─── Droits ───────────────────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO hilaac_app, hilaac_auth, hilaac_worker, hilaac_rls;

GRANT SELECT ON public.entite, public.suivi_entite, public.actif, public.demande, public.projet,
  public.affectation_projet, public.jalon, public.tache, public.tache_dependance,
  public.publication, public.mesure, public.raw_payload, public.journal_audit TO hilaac_app;
-- Pas d'email : la colonne reste réservée à hilaac_auth.
GRANT SELECT (id, nom, role) ON public.utilisateur TO hilaac_app;

GRANT SELECT, UPDATE ON public.utilisateur TO hilaac_auth;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session, public.compte, public.verification
  TO hilaac_auth;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.entite, public.suivi_entite, public.actif,
  public.demande, public.projet, public.affectation_projet, public.jalon, public.tache,
  public.tache_dependance, public.publication, public.mesure, public.raw_payload,
  public.journal_audit TO hilaac_worker;
