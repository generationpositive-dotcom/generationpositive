/**
 * Configuration Supabase — à compléter après création du projet.
 * Voir SETUP-SUPABASE.md pour les instructions complètes.
 *
 * La clé "anon" (publique) est SANS DANGER à exposer côté client :
 * c'est tout le principe de Supabase. La vraie sécurité est assurée
 * par les policies RLS définies dans supabase-schema.sql. Ne jamais
 * utiliser la clé "service_role" ici ou dans n'importe quel fichier
 * chargé par le navigateur.
 */
const SUPABASE_URL = 'https://yyqonuxescpzahhscviw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5cW9udXhlc2NwemFoaHNjdml3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyOTAyOTQsImV4cCI6MjEwMzg2NjI5NH0.5FcxBaYh1U7BvEymnNznCHtvtQZjGaowRMK91co0ZUc';

const supabaseClient = (SUPABASE_URL.startsWith('http'))
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
