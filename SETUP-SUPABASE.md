# Configuration du backend (Supabase) — Génération Positive

Guide pas à pas pour activer le formulaire d'adhésion, le panneau admin et
les 4 comptes hiérarchisés. Tout est gratuit sur le plan Supabase Free.

## 1. Créer le projet Supabase

1. Aller sur https://supabase.com et créer un compte (gratuit).
2. "New Project" — choisir un nom (ex: `generation-positive`), un mot de
   passe de base de données (à conserver précieusement), et une région
   proche (Europe de préférence pour la latence).
3. Attendre 1-2 minutes que le projet soit prêt.

## 2. Exécuter le schéma de base de données

1. Dans le menu de gauche : **SQL Editor** > **New query**.
2. Ouvrir le fichier `supabase-schema.sql` fourni, copier tout son
   contenu, le coller dans l'éditeur.
3. Cliquer sur **Run**. Toutes les tables, rôles, policies de sécurité
   et buckets de stockage sont créés automatiquement.

## 3. Récupérer les clés API

1. Menu **Project Settings** (icône engrenage) > **API**.
2. Copier :
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon public key** (une longue chaîne commençant par `eyJ...`)
3. Ouvrir `js/supabase-config.js` dans le code du site et remplacer :
   ```js
   const SUPABASE_URL = 'REMPLACER_PAR_URL_SUPABASE';
   const SUPABASE_ANON_KEY = 'REMPLACER_PAR_CLE_ANON_SUPABASE';
   ```
   par les vraies valeurs copiées.

   ⚠️ Ne jamais utiliser la clé **service_role** (différente de la clé
   "anon") dans ce fichier ni dans aucun fichier chargé par le
   navigateur — elle donne un accès total sans restriction.

## 4. Créer les 4 comptes admin

Pour chaque personne (2 administrateurs globaux, 1 éditeur de contenu,
1 gestionnaire de ressources) :

1. Menu **Authentication** > **Users** > **Add user** > **Create new user**.
2. Renseigner son email et un mot de passe temporaire (à lui communiquer
   pour qu'elle le change ensuite, ou cocher "Auto Confirm User" et lui
   envoyer un lien de réinitialisation).
3. Copier l'**UID** généré pour cet utilisateur (visible dans la liste).
4. Aller dans **SQL Editor** > **New query**, et exécuter (en adaptant) :
   ```sql
   insert into public.profiles (id, email, full_name, role)
   values (
     'UID_COPIÉ_ICI',
     'email@exemple.com',
     'Nom Complet',
     'super_admin'  -- ou 'content_editor' ou 'resource_manager'
   );
   ```
5. Répéter pour les 4 comptes, avec le bon rôle pour chacun :
   - 2 comptes avec `super_admin`
   - 1 compte avec `content_editor`
   - 1 compte avec `resource_manager`

Chaque personne peut ensuite se connecter sur `admin.html` avec son
email et son mot de passe. Le menu du panneau s'adapte automatiquement
à son rôle.

## 5. Vérifier que tout fonctionne

1. Ouvrir `admin.html`, se connecter avec un compte `super_admin`.
2. Vérifier que "Adhésions", "Comptes & connexions" et toutes les
   sections de contenu sont visibles.
3. Se connecter avec le compte `content_editor` : seules "Annonces",
   "Médias" et "Équipe / Gouvernance" doivent apparaître.
4. Se connecter avec le compte `resource_manager` : seule "Documents"
   doit apparaître.
5. Sur le site public (`index.html`), tester le formulaire d'adhésion
   — la demande doit apparaître dans l'onglet "Adhésions" du compte
   super admin.

## 6. Créer un nouveau compte admin plus tard

Répéter l'étape 4. Il n'y a pas encore de bouton "Créer un admin"
dans le panneau (volontairement, pour éviter d'exposer une clé
sensible côté navigateur) — cette création manuelle via le Dashboard
Supabase reste la méthode recommandée pour un petit nombre de comptes.
Si le besoin grandit, on peut ajouter une fonction serveur sécurisée
(Vercel Function) pour le faire depuis le panneau.

## 7. Notifications email (nouvelles adhésions + nouveaux comptes admin)

Toutes deux envoyées automatiquement vers **demo.jetravelplus@gmail.com**
via Resend, gratuit jusqu'à 3000 emails/mois.

1. Aller sur https://resend.com et créer un compte gratuit.
2. Menu **API Keys** > **Create API Key**. Copier la clé générée
   (commence par `re_...`).
3. Ouvrir `supabase-notifications.sql`, remplacer les **deux**
   occurrences de `REMPLACER_PAR_CLE_RESEND` par cette clé.
4. Dans Supabase : **SQL Editor** > **New query**, coller tout le
   contenu du fichier modifié, cliquer sur **Run**.
5. Tester : soumettre le formulaire d'adhésion du site public — un
   email doit arriver sur demo.jetravelplus@gmail.com en quelques
   secondes.

Pas de domaine à vérifier pour démarrer : l'adresse d'envoi
`onboarding@resend.dev` fournie par Resend fonctionne directement.
Pour envoyer plus tard depuis une adresse @generationpositive.org,
il faudra vérifier ce domaine dans Resend (gratuit aussi, quelques
minutes de configuration DNS).

## 8. Limites du plan gratuit Supabase

- 500 Mo de base de données, 1 Go de stockage fichiers — largement
  suffisant pour une association.
- Le projet se met en pause après 7 jours d'inactivité totale (aucune
  requête). Il suffit de revisiter le Dashboard Supabase pour le
  réactiver — aucune donnée n'est perdue.

## 9. RIB à compléter

Dans `index.html`, section "Faire un don", chercher le bloc
`id="ribModal"` et remplacer les 4 lignes "À compléter" par les
vraies coordonnées bancaires de l'association.
