/* ---------- Diaporama (hero slideshow) ---------- */
(function(){
  const track = document.getElementById('slideshowTrack');
  if(!track) return;
  const slides = Array.from(track.querySelectorAll('.slide'));
  const dotsWrap = document.getElementById('slideDots');
  const prevBtn = document.getElementById('slidePrev');
  const nextBtn = document.getElementById('slideNext');
  const toggleBtn = document.getElementById('slideToggle');
  let current = 0;
  let timer = null;
  let playing = true;
  const INTERVAL = 4500;

  slides.forEach((_, i)=>{
    const dot = document.createElement('button');
    dot.setAttribute('role','tab');
    dot.setAttribute('aria-label', `Aller à la photo ${i+1}`);
    if(i === 0) dot.classList.add('active');
    dot.addEventListener('click', ()=> goTo(i));
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.children);

  function restartImageAnimation(slide){
    const img = slide.querySelector('img');
    img.style.animation = 'none';
    // eslint-disable-next-line no-unused-expressions
    img.offsetHeight;
    img.style.animation = '';
  }

  function goTo(index){
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
    restartImageAnimation(slides[current]);
  }

  function next(){ goTo(current + 1); }
  function prev(){ goTo(current - 1); }

  function startAutoplay(){
    clearInterval(timer);
    timer = setInterval(next, INTERVAL);
  }
  function stopAutoplay(){ clearInterval(timer); }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  nextBtn.addEventListener('click', ()=>{ next(); startAutoplay(); });
  prevBtn.addEventListener('click', ()=>{ prev(); startAutoplay(); });

  toggleBtn.addEventListener('click', ()=>{
    playing = !playing;
    toggleBtn.innerHTML = playing ? '&#10073;&#10073;' : '&#9654;';
    toggleBtn.setAttribute('aria-label', playing ? 'Mettre le diaporama en pause' : 'Relancer le diaporama');
    if(playing){ startAutoplay(); } else { stopAutoplay(); }
  });

  track.addEventListener('mouseenter', stopAutoplay);
  track.addEventListener('mouseleave', ()=>{ if(playing) startAutoplay(); });

  if(!prefersReducedMotion){
    startAutoplay();
  } else {
    playing = false;
    toggleBtn.innerHTML = '&#9654;';
    toggleBtn.setAttribute('aria-label', 'Relancer le diaporama');
  }
})();

document.querySelectorAll('.domaine-tab').forEach(tab=>{
  tab.addEventListener('click', ()=>{
    const current = document.querySelector('.domaine-panel.active');
    document.querySelectorAll('.domaine-tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    const next = document.getElementById(tab.dataset.panel);
    if(current && current !== next){
      current.classList.add('fading');
      setTimeout(()=>{
        current.classList.remove('active','fading');
        next.classList.add('active');
      }, 180);
    } else {
      next.classList.add('active');
    }
  });
});

/* Header shrinks on scroll */
const siteHeader = document.querySelector('header');
window.addEventListener('scroll', ()=>{
  siteHeader.classList.toggle('scrolled', window.scrollY > 12);
}, {passive:true});

/* Scroll-reveal for content blocks */
const revealTargets = document.querySelectorAll(
  '.card, .axis, .impact-card, .transp-item, .org-box, .cta-band, .form-card, .domaine-tabs, .domaine-panel.active, .gallery-item'
);
revealTargets.forEach((el,i)=>{
  el.classList.add('reveal','reveal-stagger');
  el.style.setProperty('--i', i % 6);
});
const revealObserver = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    }
  });
},{threshold:0.15});
revealTargets.forEach(el=>revealObserver.observe(el));

/* Active nav link tied to visible section */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('nav.links a[href^="#"]');
const navObserver = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    const link = document.querySelector('nav.links a[href="#'+entry.target.id+'"]');
    if(!link) return;
    if(entry.isIntersecting){
      navLinks.forEach(l=>l.classList.remove('active'));
      link.classList.add('active');
    }
  });
},{rootMargin:'-45% 0px -45% 0px'});
sections.forEach(s=>navObserver.observe(s));

/* Gallery lightbox */
const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCap = document.getElementById('lightboxCap');
let currentIdx = 0;

function openLightbox(idx){
  currentIdx = idx;
  const item = galleryItems[currentIdx];
  lightboxImg.src = item.querySelector('img').src;
  lightboxCap.textContent = item.querySelector('img').alt;
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.getElementById('lightboxClose').focus();
}
function closeLightbox(){
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
}
function showDelta(delta){
  currentIdx = (currentIdx + delta + galleryItems.length) % galleryItems.length;
  const item = galleryItems[currentIdx];
  lightboxImg.src = item.querySelector('img').src;
  lightboxCap.textContent = item.querySelector('img').alt;
}
galleryItems.forEach((item,i)=> item.addEventListener('click', ()=>openLightbox(i)));
document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
document.getElementById('lightboxPrev').addEventListener('click', ()=>showDelta(-1));
document.getElementById('lightboxNext').addEventListener('click', ()=>showDelta(1));
lightbox.addEventListener('click', (e)=>{ if(e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (e)=>{
  if(!lightbox.classList.contains('open')) return;
  if(e.key === 'Escape') closeLightbox();
  if(e.key === 'ArrowRight') showDelta(1);
  if(e.key === 'ArrowLeft') showDelta(-1);
});
const hamburgerBtn = document.querySelector('.hamburger');
const siteNav = document.getElementById('siteNav');
hamburgerBtn.addEventListener('click', ()=>{
  const isOpen = siteNav.classList.contains('mobile-open');
  siteNav.classList.toggle('mobile-open', !isOpen);
  hamburgerBtn.setAttribute('aria-expanded', String(!isOpen));
  hamburgerBtn.setAttribute('aria-label', isOpen ? 'Ouvrir le menu' : 'Fermer le menu');
});
siteNav.querySelectorAll('a').forEach(link=>{
  link.addEventListener('click', ()=>{
    siteNav.classList.remove('mobile-open');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    hamburgerBtn.setAttribute('aria-label', 'Ouvrir le menu');
  });
});
window.addEventListener('resize', ()=>{
  if(window.innerWidth > 920){
    siteNav.classList.remove('mobile-open');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    hamburgerBtn.setAttribute('aria-label', 'Ouvrir le menu');
  }
});

/* ---------- RIB modal ---------- */
const ribModal = document.getElementById('ribModal');
const showRibBtn = document.getElementById('showRibBtn');
const ribModalClose = document.getElementById('ribModalClose');
function openRibModal(){
  ribModal.classList.add('open');
  ribModal.setAttribute('aria-hidden', 'false');
  ribModalClose.focus();
}
function closeRibModal(){
  ribModal.classList.remove('open');
  ribModal.setAttribute('aria-hidden', 'true');
}
showRibBtn?.addEventListener('click', openRibModal);
ribModalClose?.addEventListener('click', closeRibModal);
ribModal?.addEventListener('click', (e)=>{ if(e.target === ribModal) closeRibModal(); });
document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape' && ribModal?.classList.contains('open')) closeRibModal(); });

/* ---------- Membership form submission (Supabase) ---------- */
const membershipForm = document.getElementById('membershipForm');
const membershipStatus = document.getElementById('membershipStatus');
const membershipSubmit = document.getElementById('membershipSubmit');

function setFieldError(field, hasError){
  field.classList.toggle('field-error', hasError);
}

function validateMembershipForm(){
  let valid = true;
  const requiredFields = membershipForm.querySelectorAll('[required]');
  requiredFields.forEach(field=>{
    const empty = field.type === 'checkbox' ? !field.checked : !field.value.trim();
    setFieldError(field, empty);
    if(empty) valid = false;
  });
  const emailField = document.getElementById('mEmail');
  if(emailField.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value)){
    setFieldError(emailField, true);
    valid = false;
  }
  return valid;
}

function showMembershipStatus(type, message){
  membershipStatus.textContent = message;
  membershipStatus.className = 'form-status show ' + type;
}

if(membershipForm){
  membershipForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    membershipStatus.className = 'form-status';

    if(!validateMembershipForm()){
      showMembershipStatus('error', 'Merci de compléter les champs requis et d\'accepter les Statuts et le Règlement Intérieur.');
      return;
    }

    if(!supabaseClient){
      showMembershipStatus('error', 'Le formulaire n\'est pas encore connecté. Contactez l\'administrateur du site.');
      return;
    }

    membershipSubmit.disabled = true;
    membershipSubmit.classList.add('loading');

    const payload = {
      nom: document.getElementById('mNom').value.trim(),
      prenom: document.getElementById('mPrenom').value.trim(),
      telephone: document.getElementById('mTel').value.trim(),
      email: document.getElementById('mEmail').value.trim(),
      ville: document.getElementById('mVille').value.trim(),
      profession: document.getElementById('mProfession').value.trim(),
      categorie: document.getElementById('mCategorie').value,
      motivation: document.getElementById('mMotivation').value.trim()
    };

    const { error } = await supabaseClient.from('membership_applications').insert(payload);

    if(error){
      showMembershipStatus('error', 'Une erreur est survenue. Merci de réessayer ou de nous contacter directement.');
    } else {
      showMembershipStatus('success', 'Votre demande a bien été envoyée. Nous reviendrons vers vous rapidement.');
      membershipForm.reset();
    }

    membershipSubmit.disabled = false;
    membershipSubmit.classList.remove('loading');
  });
}