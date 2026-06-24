/**
 * script.js — Ricardo Advocacia
 * Dev Luiz
 *
 * Módulos:
 *  1. Canvas de rachaduras (CrackSystem)
 *  2. Navbar: scroll-shadow + mobile menu
 *  3. Scroll reveal (IntersectionObserver)
 *  4. GSAP: animação de entrada do hero
 *  5. Formulário: validação unificada + envio WhatsApp
 *
 * ──────────────────────────────────────────────────────────
 

/* ─── 1. Canvas de rachaduras ─────────────────────────── */
if (typeof CrackSystem !== 'undefined') {
  CrackSystem.init({
    canvasId:      'cracks-canvas',
    crackColor:    '#C9A84C',
    bgColor:       '#1a0a0f',
    fadeAlpha:     0.042,
    maxDepth:      4,
    spawnInterval: 40,
    minSpeed:      0.007,
    maxSpeed:      0.020,
    minLen:        55,
    maxLen:        170,
  });
}

/* ─── 2. Navbar ───────────────────────────────────────── */
const navbar    = document.getElementById('navbar');
const toggle    = document.querySelector('.nav__toggle');
const mobileNav = document.getElementById('nav-menu-mobile');

window.addEventListener('scroll', () => {
  if (!navbar) return;
  navbar.style.boxShadow = window.scrollY > 10
    ? '0 2px 24px rgba(0,0,0,0.45)'
    : 'none';
}, { passive: true });

if (toggle && mobileNav) {
  toggle.addEventListener('click', () => {
    const open = toggle.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    mobileNav.classList.toggle('is-open', open);
    mobileNav.setAttribute('aria-hidden', String(!open));
  });

  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      mobileNav.classList.remove('is-open');
      mobileNav.setAttribute('aria-hidden', 'true');
    });
  });
}

/* ─── 3. Scroll reveal ────────────────────────────────── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('[data-reveal]').forEach(el => revealObserver.observe(el));

/* ─── 4. GSAP — Hero ──────────────────────────────────── */
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);

  gsap.timeline({ delay: 0.2 })
    .from('.hero__eyebrow',  { opacity: 0, y: 14, duration: 0.60, ease: 'power3.out' })
    .from('.hero__title',    { opacity: 0, y: 22, duration: 0.75, ease: 'power3.out' }, '-=0.30')
    .from('.hero__sub',      { opacity: 0, y: 14, duration: 0.60, ease: 'power3.out' }, '-=0.40')
    .from('.hero__actions',  { opacity: 0, y: 10, duration: 0.50, ease: 'power3.out' }, '-=0.35')
    .from('.hero__badge',    { opacity: 0, x: 10, duration: 0.50, ease: 'power3.out' }, '-=0.20')
    .from('.hero__sideline', { scaleY: 0, transformOrigin: 'top', duration: 0.80, ease: 'power3.out' }, '-=0.60');

  const cracksCanvas = document.getElementById('cracks-canvas');
  if (cracksCanvas) {
    gsap.to(cracksCanvas, {
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
      },
      y: 60,
      ease: 'none',
    });
  }
}

function showError(fieldId, msg) {

  const field = document.getElementById(fieldId);

  if (!field) return;

  field.classList.add('form__input--error');

  const existing =
    field.parentElement.querySelector('.form__error');

  if (existing) {
    existing.textContent = msg;
    return;
  }

  const error = document.createElement('span');

  error.className = 'form__error';
  error.setAttribute('role', 'alert');
  error.textContent = msg;

  field.parentElement.appendChild(error);
}
