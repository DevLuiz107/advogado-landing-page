/**
 * script.js — Ricardo Advocacia
 * Dev Luiz
 *
 * Módulos:
 *  1. Canvas de rachaduras (CrackSystem)
 *  2. Navbar: scroll-shadow + mobile menu
 *  3. Scroll reveal (IntersectionObserver)
 *  4. GSAP: animação de entrada do hero
 *  5. Formulário: validação client-side
 *
 * ──────────────────────────────────────────────────────────
 * PRÓXIMAS PARTES:
 *
 * PARTE 2 — Backend de agendamento:
 *   - POST /api/agendar → Node.js + Express
 *   - Salvar em SQLite3 (better-sqlite3)
 *   - Resposta com JSON { id, status }
 *
 * PARTE 3 — Notificação WhatsApp:
 *   - Após inserção no banco, disparar WA
 *   - Decisão pendente: Z-API vs Evolution API vs Baileys
 *   - Mensagem template: nome, área, data preferida
 *
 * PARTE 4 — Painel de agendamentos (admin):
 *   - Listagem de consultas com filtro por data/área
 *   - Marcar como atendido / cancelado
 *   - Proteger com JWT (já temos a arquitetura)
 *
 * O QUE MAIS PODE SER ADICIONADO:
 *   - Seção de depoimentos (cuidado com Provimento 205/2021:
 *     não pode usar testemunhos de clientes nominalmente)
 *   - FAQ accordion (dúvidas jurídicas genéricas)
 *   - Blog / artigos (SEO local em Alfenas, MG)
 *   - Schema.org LocalBusiness (rich snippet no Google)
 *   - Google Analytics / Meta Pixel
 *   - Cookie consent (LGPD)
 * ──────────────────────────────────────────────────────────
 */

/* ─── 1. Canvas de rachaduras ─────────────────────────── */
CrackSystem.init({
  canvasId:      'cracks-canvas',
  crackColor:    '#C9A84C',
  bgColor:       '#0D1008',
  fadeAlpha:     0.042,
  maxDepth:      4,
  spawnInterval: 40,
  minSpeed:      0.007,
  maxSpeed:      0.020,
  minLen:        55,
  maxLen:        170,
});

/* ─── 2. Navbar ───────────────────────────────────────── */
const navbar    = document.getElementById('navbar');
const toggle    = document.querySelector('.nav__toggle');
const mobileNav = document.getElementById('nav-menu-mobile');

// Sombra ao rolar
window.addEventListener('scroll', () => {
  navbar.style.boxShadow = window.scrollY > 10
    ? '0 2px 24px rgba(0,0,0,0.45)'
    : 'none';
}, { passive: true });

// Mobile menu
toggle?.addEventListener('click', () => {
  const open = toggle.classList.toggle('is-open');
  toggle.setAttribute('aria-expanded', open);
  mobileNav.classList.toggle('is-open', open);
  mobileNav.setAttribute('aria-hidden', !open);
});

// Fecha menu ao clicar em link
mobileNav?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    toggle.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    mobileNav.classList.remove('is-open');
    mobileNav.setAttribute('aria-hidden', 'true');
  });
});

/* ─── 3. Scroll reveal ────────────────────────────────── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('[data-reveal]').forEach(el => {
  revealObserver.observe(el);
});

/* ─── 4. GSAP — Hero ──────────────────────────────────── */
if (typeof gsap !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);

  const heroTl = gsap.timeline({ delay: 0.2 });

  heroTl
    .from('.hero__eyebrow', { opacity: 0, y: 14, duration: 0.6, ease: 'power3.out' })
    .from('.hero__title',   { opacity: 0, y: 22, duration: 0.75, ease: 'power3.out' }, '-=0.3')
    .from('.hero__sub',     { opacity: 0, y: 14, duration: 0.6,  ease: 'power3.out' }, '-=0.4')
    .from('.hero__actions', { opacity: 0, y: 10, duration: 0.5,  ease: 'power3.out' }, '-=0.35')
    .from('.hero__badge',   { opacity: 0, x: 10, duration: 0.5,  ease: 'power3.out' }, '-=0.2')
    .from('.hero__sideline',{ scaleY: 0, transformOrigin: 'top', duration: 0.8, ease: 'power3.out' }, '-=0.6');

  // Parallax leve no hero ao rolar
  gsap.to('#cracks-canvas', {
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

/* ─── 5. Formulário — validação client-side ───────────── */
const submitBtn = document.getElementById('form-submit');

submitBtn?.addEventListener('click', () => {
  const nome     = document.getElementById('nome').value.trim();
  const telefone = document.getElementById('telefone').value.trim();
  const area     = document.getElementById('area').value;

  // Limpa erros anteriores
  document.querySelectorAll('.form__error').forEach(e => e.remove());
  document.querySelectorAll('.form__input--error').forEach(e => {
    e.classList.remove('form__input--error');
  });

  let valid = true;

  if (!nome) {
    valid = false;
    showError('nome', 'Informe seu nome.');
  }

  // Validação simples de telefone BR
  const telDigits = telefone.replace(/\D/g, '');
  if (!telefone || telDigits.length < 10) {
    valid = false;
    showError('telefone', 'Informe um WhatsApp válido.');
  }

  if (!area) {
    valid = false;
    showError('area', 'Selecione a área de interesse.');
  }

  if (!valid) return;

  // Estado de loading
  submitBtn.disabled = true;
  submitBtn.textContent = 'Enviando…';

  /*
   * TODO Parte 2: substituir o setTimeout abaixo por:
   *
   * fetch('/api/agendar', {
   *   method: 'POST',
   *   headers: { 'Content-Type': 'application/json' },
   *   body: JSON.stringify({ nome, telefone, area, mensagem }),
   * })
   * .then(res => res.json())
   * .then(data => { ... mostrar sucesso ... })
   * .catch(() => { ... mostrar erro ... });
   */
  setTimeout(() => {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Solicitação enviada ✓';
    submitBtn.style.background = '#2a7a3b';
    submitBtn.style.borderColor = '#2a7a3b';

    setTimeout(() => {
      submitBtn.textContent = 'Enviar solicitação';
      submitBtn.style.background = '';
      submitBtn.style.borderColor = '';
    }, 4000);
  }, 1200);
});

function showError(fieldId, msg) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.classList.add('form__input--error');

  const err = document.createElement('span');
  err.className = 'form__error';
  err.textContent = msg;
  err.style.cssText = 'font-size:.68rem;color:#e05c5c;margin-top:2px;';
  field.parentNode.appendChild(err);
}