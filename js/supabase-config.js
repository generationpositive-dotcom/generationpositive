/**
 * Configuration Supabase — Génération Positive
 * Clé "anon" (publique) — sans danger à exposer côté client.
 * La sécurité réelle est assurée par les policies RLS (voir schéma appliqué).
 */
const SUPABASE_URL = 'https://lfzmzobmibrsucfiydas.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxmem16b2JtaWJyc3VjZml5ZGFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyOTMwMjQsImV4cCI6MjEwMzg2OTAyNH0.2Xu1fksBhSTP_NxGdo2i-q5lh_FNRB8ybbtJEc5E1NM';

const supabaseClient = (SUPABASE_URL.startsWith('http'))
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
