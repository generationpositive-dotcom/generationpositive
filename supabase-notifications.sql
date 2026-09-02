-- ============================================================================
-- NOTIFICATIONS EMAIL — Génération Positive
-- ============================================================================
-- À exécuter APRÈS supabase-schema.sql, une fois que tu as ta clé Resend
-- (voir SETUP-SUPABASE.md, section "Notifications email").
--
-- Ce script fait en sorte que Supabase envoie automatiquement un email à
-- demo.jetravelplus@gmail.com :
--   1. Quand quelqu'un soumet le formulaire d'adhésion
--   2. Quand un nouveau compte admin est créé
--
-- Solution 100% gratuite : Resend (3000 emails/mois gratuits) + l'extension
-- pg_net de Supabase (déjà incluse, gratuite) qui permet à la base de données
-- d'appeler une API web directement, sans serveur intermédiaire à héberger.
-- ============================================================================

create extension if not exists pg_net;

-- ----------------------------------------------------------------------------
-- IMPORTANT : remplace REMPLACER_PAR_CLE_RESEND ci-dessous (dans les DEUX
-- fonctions) par ta vraie clé API Resend avant d'exécuter ce script.
-- ----------------------------------------------------------------------------

-- 1. Notification — nouvelle demande d'adhésion
create or replace function public.notify_new_membership_application()
returns trigger
language plpgsql
security definer
as $$
begin
  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer REMPLACER_PAR_CLE_RESEND',
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', 'Génération Positive <onboarding@resend.dev>',
      'to', array['demo.jetravelplus@gmail.com'],
      'subject', 'Nouvelle demande d''adhésion — ' || new.prenom || ' ' || new.nom,
      'html',
        '<h2>Nouvelle demande d''adhésion</h2>' ||
        '<p><strong>Nom :</strong> ' || new.prenom || ' ' || new.nom || '</p>' ||
        '<p><strong>Email :</strong> ' || new.email || '</p>' ||
        '<p><strong>Téléphone :</strong> ' || new.telephone || '</p>' ||
        '<p><strong>Ville :</strong> ' || coalesce(new.ville, '—') || '</p>' ||
        '<p><strong>Profession :</strong> ' || coalesce(new.profession, '—') || '</p>' ||
        '<p><strong>Catégorie souhaitée :</strong> ' || coalesce(new.categorie, '—') || '</p>' ||
        '<p><strong>Motivation :</strong> ' || coalesce(new.motivation, '—') || '</p>' ||
        '<p>Connecte-toi au panneau admin pour approuver ou rejeter cette demande.</p>'
    )
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_new_membership_application on public.membership_applications;
create trigger trg_notify_new_membership_application
after insert on public.membership_applications
for each row execute function public.notify_new_membership_application();

-- 2. Notification — nouveau compte admin créé
create or replace function public.notify_new_admin_account()
returns trigger
language plpgsql
security definer
as $$
begin
  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer REMPLACER_PAR_CLE_RESEND',
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', 'Génération Positive <onboarding@resend.dev>',
      'to', array['demo.jetravelplus@gmail.com'],
      'subject', 'Nouveau compte admin créé — ' || coalesce(new.full_name, new.email),
      'html',
        '<h2>Nouveau compte admin</h2>' ||
        '<p><strong>Nom :</strong> ' || coalesce(new.full_name, '(non renseigné)') || '</p>' ||
        '<p><strong>Email :</strong> ' || new.email || '</p>' ||
        '<p><strong>Rôle :</strong> ' || new.role::text || '</p>'
    )
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_new_admin_account on public.profiles;
create trigger trg_notify_new_admin_account
after insert on public.profiles
for each row execute function public.notify_new_admin_account();

-- ============================================================================
-- Pour changer l'adresse de notification plus tard, remplace
-- 'demo.jetravelplus@gmail.com' dans les DEUX fonctions ci-dessus et
-- ré-exécute ce script (les "create or replace" et "drop trigger if exists"
-- permettent de le relancer sans erreur).
-- ============================================================================
