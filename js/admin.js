/* ============================================================
   Génération Positive — Panneau admin
   Auth, navigation par rôle, CRUD Supabase pour chaque section
   ============================================================ */

let currentProfile = null; // { id, email, full_name, role }

const ROLE_LABELS = {
  super_admin: 'Administrateur global',
  content_editor: 'Éditeur de contenu',
  resource_manager: 'Gestionnaire de ressources'
};

// ---------- Utilitaires ----------
function setStatus(el, message, type) {
  el.textContent = message || '';
  el.className = 'form-status' + (type ? ' ' + type : '');
}
function setLoading(button, loading) {
  button.classList.toggle('loading', loading);
  button.disabled = loading;
}
function escapeHtml(str) {
  return (str || '').toString().replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ---------- Auth ----------
document.addEventListener('DOMContentLoaded', init);

async function init() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    await loadProfileAndEnter(session.user);
  } else {
    showLogin();
  }

  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);

  document.getElementById('adminNav').addEventListener('click', (e) => {
    const btn = e.target.closest('.admin-nav-link');
    if (btn) switchPanel(btn.dataset.panel);
  });

  document.getElementById('announcementForm').addEventListener('submit', handleAnnouncementSubmit);
  document.getElementById('mediaForm').addEventListener('submit', handleMediaSubmit);
  document.getElementById('teamForm').addEventListener('submit', handleTeamSubmit);
  document.getElementById('documentForm').addEventListener('submit', handleDocumentSubmit);

  document.getElementById('mediaType').addEventListener('change', (e) => {
    const isVideo = e.target.value === 'video';
    document.getElementById('mediaFileField').style.display = isVideo ? 'none' : '';
    document.getElementById('mediaUrlField').style.display = isVideo ? '' : 'none';
  });
}

function showLogin() {
  document.getElementById('loginScreen').hidden = false;
  document.getElementById('dashboard').hidden = true;
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('loginSubmit');
  const status = document.getElementById('loginStatus');
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  setLoading(btn, true);
  setStatus(status, '', '');

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  setLoading(btn, false);

  if (error) {
    setStatus(status, "Email ou mot de passe incorrect.", 'error');
    return;
  }
  await loadProfileAndEnter(data.user);
}

async function handleLogout() {
  await supabaseClient.auth.signOut();
  currentProfile = null;
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPassword').value = '';
  showLogin();
}

async function loadProfileAndEnter(user) {
  const { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    setStatus(document.getElementById('loginStatus'),
      "Ce compte n'a pas encore de profil admin associé. Contactez un administrateur global.", 'error');
    await supabaseClient.auth.signOut();
    showLogin();
    return;
  }

  currentProfile = profile;
  enterDashboard();
}

function enterDashboard() {
  document.getElementById('loginScreen').hidden = true;
  document.getElementById('dashboard').hidden = false;

  document.getElementById('currentUserEmail').textContent = currentProfile.email;
  document.getElementById('currentUserRole').textContent = ROLE_LABELS[currentProfile.role] || currentProfile.role;

  // Affiche/masque les liens de nav selon le rôle
  document.querySelectorAll('.admin-nav-link[data-roles]').forEach((btn) => {
    const allowed = btn.dataset.roles.split(',');
    btn.hidden = !allowed.includes(currentProfile.role);
  });

  switchPanel('panel-overview');
  loadOverview();
}

function switchPanel(panelId) {
  document.querySelectorAll('.admin-panel').forEach((p) => p.classList.toggle('active', p.id === panelId));
  document.querySelectorAll('.admin-nav-link').forEach((b) => b.classList.toggle('active', b.dataset.panel === panelId));

  const loaders = {
    'panel-overview': loadOverview,
    'panel-applications': loadApplications,
    'panel-accounts': loadAccounts,
    'panel-announcements': loadAnnouncements,
    'panel-media': loadMedia,
    'panel-team': loadTeam,
    'panel-documents': loadDocuments
  };
  if (loaders[panelId]) loaders[panelId]();
}

// ---------- Tableau de bord ----------
async function loadOverview() {
  const wrap = document.getElementById('overviewCards');
  wrap.innerHTML = '<div class="admin-empty">Chargement…</div>';

  const counts = {};
  const tables = ['membership_applications', 'announcements', 'media', 'documents', 'team_members'];
  for (const t of tables) {
    const { count } = await supabaseClient.from(t).select('*', { count: 'exact', head: true });
    counts[t] = count ?? 0;
  }

  const cards = [
    { label: 'Demandes d\'adhésion', num: counts.membership_applications },
    { label: 'Annonces', num: counts.announcements },
    { label: 'Médias', num: counts.media },
    { label: 'Documents', num: counts.documents },
    { label: 'Membres de l\'équipe', num: counts.team_members }
  ];
  wrap.innerHTML = cards.map(c => `
    <div class="card"><div class="num">${c.num}</div><div class="label">${escapeHtml(c.label)}</div></div>
  `).join('');
}

// ---------- Adhésions ----------
async function loadApplications() {
  const wrap = document.getElementById('applicationsList');
  wrap.innerHTML = '<div class="admin-empty">Chargement…</div>';

  const { data, error } = await supabaseClient
    .from('membership_applications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data || data.length === 0) {
    wrap.innerHTML = '<div class="admin-empty">Aucune demande pour le moment.</div>';
    return;
  }

  wrap.innerHTML = `<table><thead><tr>
    <th>Nom</th><th>Contact</th><th>Message</th><th>Statut</th><th>Date</th><th></th>
  </tr></thead><tbody>${data.map(a => `
    <tr data-id="${a.id}">
      <td>${escapeHtml(a.full_name)}</td>
      <td>${escapeHtml(a.email)}${a.phone ? '<br>' + escapeHtml(a.phone) : ''}</td>
      <td style="max-width:220px;">${escapeHtml((a.message || '').slice(0, 80))}</td>
      <td><span class="status-pill ${a.status}">${a.status}</span></td>
      <td>${fmtDate(a.created_at)}</td>
      <td class="row-actions">
        ${a.status !== 'approved' ? `<button data-action="approve">Approuver</button>` : ''}
        ${a.status !== 'rejected' ? `<button data-action="reject" class="danger">Rejeter</button>` : ''}
      </td>
    </tr>`).join('')}</tbody></table>`;

  wrap.querySelectorAll('button[data-action]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const row = btn.closest('tr');
      const id = row.dataset.id;
      const status = btn.dataset.action === 'approve' ? 'approved' : 'rejected';
      await supabaseClient.from('membership_applications').update({
        status, reviewed_by: currentProfile.id, reviewed_at: new Date().toISOString()
      }).eq('id', id);
      loadApplications();
    });
  });
}

// ---------- Comptes & connexions ----------
async function loadAccounts() {
  const wrap = document.getElementById('accountsList');
  wrap.innerHTML = '<div class="admin-empty">Chargement…</div>';

  const { data, error } = await supabaseClient.rpc('get_admin_connections');

  if (error || !data || data.length === 0) {
    wrap.innerHTML = '<div class="admin-empty">Aucun compte trouvé ou accès insuffisant.</div>';
    return;
  }

  wrap.innerHTML = `<table><thead><tr>
    <th>Nom</th><th>Email</th><th>Rôle</th><th>Dernière connexion</th>
  </tr></thead><tbody>${data.map(u => `
    <tr>
      <td>${escapeHtml(u.full_name)}</td>
      <td>${escapeHtml(u.email)}</td>
      <td>${ROLE_LABELS[u.role] || escapeHtml(u.role)}</td>
      <td>${fmtDate(u.last_sign_in_at)}</td>
    </tr>`).join('')}</tbody></table>`;
}

// ---------- Annonces ----------
async function handleAnnouncementSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const status = document.getElementById('announcementStatus');
  setLoading(btn, true);
  setStatus(status, '', '');

  try {
    const title = document.getElementById('annTitle').value.trim();
    const content = document.getElementById('annBody').value.trim();
    const published = document.getElementById('annPublished').checked;
    const file = document.getElementById('annImage').files[0];

    let imagePath = null;
    if (file) imagePath = await uploadToBucket('media', file, 'announcements');

    const { error } = await supabaseClient.from('announcements').insert({
      title, content, published, created_by: currentProfile.id,
      ...(imagePath ? { image_path: imagePath } : {})
    });
    if (error) throw error;

    setStatus(status, 'Annonce ajoutée.', 'success');
    e.target.reset();
    loadAnnouncements();
  } catch (err) {
    setStatus(status, "Erreur : " + err.message, 'error');
  } finally {
    setLoading(btn, false);
  }
}

async function loadAnnouncements() {
  const wrap = document.getElementById('announcementsList');
  wrap.innerHTML = '<div class="admin-empty">Chargement…</div>';

  const { data, error } = await supabaseClient
    .from('announcements').select('*').order('created_at', { ascending: false });

  if (error || !data || data.length === 0) {
    wrap.innerHTML = '<div class="admin-empty">Aucune annonce pour le moment.</div>';
    return;
  }

  wrap.innerHTML = `<table><thead><tr>
    <th>Titre</th><th>Statut</th><th>Date</th><th></th>
  </tr></thead><tbody>${data.map(a => `
    <tr data-id="${a.id}">
      <td>${escapeHtml(a.title)}</td>
      <td>${a.published ? 'Publié' : 'Brouillon'}</td>
      <td>${fmtDate(a.created_at)}</td>
      <td class="row-actions"><button data-action="delete" class="danger">Supprimer</button></td>
    </tr>`).join('')}</tbody></table>`;

  wrap.querySelectorAll('button[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.closest('tr').dataset.id;
      if (!confirm('Supprimer cette annonce ?')) return;
      await supabaseClient.from('announcements').delete().eq('id', id);
      loadAnnouncements();
    });
  });
}

// ---------- Médias ----------
async function handleMediaSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const status = document.getElementById('mediaStatus');
  setLoading(btn, true);
  setStatus(status, '', '');

  try {
    const mediaType = document.getElementById('mediaType').value;
    const caption = document.getElementById('mediaCaption').value.trim();
    let filePath;

    if (mediaType === 'video') {
      filePath = document.getElementById('mediaUrl').value.trim();
      if (!filePath) throw new Error('Merci de renseigner une URL de vidéo.');
    } else {
      const file = document.getElementById('mediaFile').files[0];
      if (!file) throw new Error('Merci de sélectionner une image.');
      filePath = await uploadToBucket('media', file, 'gallery');
    }

    const { error } = await supabaseClient.from('media').insert({
      media_type: mediaType, file_path: filePath, caption, created_by: currentProfile.id
    });
    if (error) throw error;

    setStatus(status, 'Média ajouté.', 'success');
    e.target.reset();
    loadMedia();
  } catch (err) {
    setStatus(status, "Erreur : " + err.message, 'error');
  } finally {
    setLoading(btn, false);
  }
}

async function loadMedia() {
  const wrap = document.getElementById('mediaList');
  wrap.innerHTML = '<div class="admin-empty">Chargement…</div>';

  const { data, error } = await supabaseClient
    .from('media').select('*').order('created_at', { ascending: false });

  if (error || !data || data.length === 0) {
    wrap.innerHTML = '<div class="admin-empty">Aucun média pour le moment.</div>';
    return;
  }

  wrap.innerHTML = `<table><thead><tr>
    <th>Type</th><th>Légende</th><th>Date</th><th></th>
  </tr></thead><tbody>${data.map(m => `
    <tr data-id="${m.id}">
      <td>${m.media_type === 'video' ? 'Vidéo' : 'Image'}</td>
      <td>${escapeHtml(m.caption || '—')}</td>
      <td>${fmtDate(m.created_at)}</td>
      <td class="row-actions"><button data-action="delete" class="danger">Supprimer</button></td>
    </tr>`).join('')}</tbody></table>`;

  wrap.querySelectorAll('button[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.closest('tr').dataset.id;
      if (!confirm('Supprimer ce média ?')) return;
      await supabaseClient.from('media').delete().eq('id', id);
      loadMedia();
    });
  });
}

// ---------- Équipe / Gouvernance ----------
async function handleTeamSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const status = document.getElementById('teamStatus');
  setLoading(btn, true);
  setStatus(status, '', '');

  try {
    const full_name = document.getElementById('teamName').value.trim();
    const role_title = document.getElementById('teamRole').value.trim();
    const orgUnit = document.getElementById('teamOrgUnit').value.trim();
    const bio = document.getElementById('teamBio').value.trim();
    const file = document.getElementById('teamPhoto').files[0];

    let photo_path = null;
    if (file) photo_path = await uploadToBucket('media', file, 'team');

    const { error } = await supabaseClient.from('team_members').insert({
      full_name, role_title: orgUnit ? `${role_title} — ${orgUnit}` : role_title,
      bio, photo_path, created_by: currentProfile.id
    });
    if (error) throw error;

    setStatus(status, 'Membre ajouté au trombinoscope.', 'success');
    e.target.reset();
    loadTeam();
  } catch (err) {
    setStatus(status, "Erreur : " + err.message, 'error');
  } finally {
    setLoading(btn, false);
  }
}

async function loadTeam() {
  const wrap = document.getElementById('teamList');
  wrap.innerHTML = '<div class="admin-empty">Chargement…</div>';

  const { data, error } = await supabaseClient
    .from('team_members').select('*').order('display_order', { ascending: true });

  if (error || !data || data.length === 0) {
    wrap.innerHTML = '<div class="admin-empty">Aucun membre pour le moment.</div>';
    return;
  }

  wrap.innerHTML = `<table><thead><tr>
    <th>Nom</th><th>Fonction</th><th></th>
  </tr></thead><tbody>${data.map(m => `
    <tr data-id="${m.id}">
      <td>${escapeHtml(m.full_name)}</td>
      <td>${escapeHtml(m.role_title)}</td>
      <td class="row-actions"><button data-action="delete" class="danger">Supprimer</button></td>
    </tr>`).join('')}</tbody></table>`;

  wrap.querySelectorAll('button[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.closest('tr').dataset.id;
      if (!confirm('Retirer ce membre ?')) return;
      await supabaseClient.from('team_members').delete().eq('id', id);
      loadTeam();
    });
  });
}

// ---------- Documents ----------
async function handleDocumentSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const status = document.getElementById('documentStatus');
  setLoading(btn, true);
  setStatus(status, '', '');

  try {
    const title = document.getElementById('docTitle').value.trim();
    const description = document.getElementById('docCategory').value.trim();
    const file = document.getElementById('docFile').files[0];
    if (!file) throw new Error('Merci de sélectionner un fichier.');

    const file_path = await uploadToBucket('documents', file, 'docs');

    const { error } = await supabaseClient.from('documents').insert({
      title, description, file_path, created_by: currentProfile.id
    });
    if (error) throw error;

    setStatus(status, 'Document publié.', 'success');
    e.target.reset();
    loadDocuments();
  } catch (err) {
    setStatus(status, "Erreur : " + err.message, 'error');
  } finally {
    setLoading(btn, false);
  }
}

async function loadDocuments() {
  const wrap = document.getElementById('documentsList');
  wrap.innerHTML = '<div class="admin-empty">Chargement…</div>';

  const { data, error } = await supabaseClient
    .from('documents').select('*').order('created_at', { ascending: false });

  if (error || !data || data.length === 0) {
    wrap.innerHTML = '<div class="admin-empty">Aucun document pour le moment.</div>';
    return;
  }

  wrap.innerHTML = `<table><thead><tr>
    <th>Titre</th><th>Catégorie</th><th>Date</th><th></th>
  </tr></thead><tbody>${data.map(d => `
    <tr data-id="${d.id}">
      <td>${escapeHtml(d.title)}</td>
      <td>${escapeHtml(d.description || '—')}</td>
      <td>${fmtDate(d.created_at)}</td>
      <td class="row-actions"><button data-action="delete" class="danger">Supprimer</button></td>
    </tr>`).join('')}</tbody></table>`;

  wrap.querySelectorAll('button[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.closest('tr').dataset.id;
      if (!confirm('Supprimer ce document ?')) return;
      await supabaseClient.from('documents').delete().eq('id', id);
      loadDocuments();
    });
  });
}

// ---------- Upload générique vers un bucket ----------
async function uploadToBucket(bucket, file, folder) {
  const ext = file.name.split('.').pop();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabaseClient.storage.from(bucket).upload(path, file);
  if (error) throw error;
  const { data } = supabaseClient.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
