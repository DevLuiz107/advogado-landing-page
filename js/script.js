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

/* ─── 5. Formulário ───────────────────────────────────── */
/**
 * Exibe mensagem de erro abaixo de um campo.
 * Usa classe CSS — não injeta estilo inline.
 */
function showError(fieldId, msg) {
  const field = document.getElementById(fieldId);
  if (!field) return;

  field.classList.add('form__input--error');

  const err = document.createElement('span');
  err.className = 'form__error';
  err.setAttribute('role', 'alert');
  err.textContent = msg;

  // Evita duplicar erros
  const existing = field.parentNode.querySelector('.form__error');
  if (!existing) field.parentNode.appendChild(err);
}

/**
 * Remove todos os erros de validação do formulário.
 */
function clearErrors(form) {
  form.querySelectorAll('.form__error').forEach(el => el.remove());
  form.querySelectorAll('.form__input--error').forEach(el => {
    el.classList.remove('form__input--error');
  });
}

/**
 * Valida o formulário e retorna um objeto com os dados
 * ou null se houver erros.
 */
function validateForm(form) {
  clearErrors(form);

  const nome        = form.querySelector('#nome')?.value.trim() ?? '';
  const email       = form.querySelector('#email')?.value.trim() ?? '';
  const telefone    = form.querySelector('#telefone')?.value.trim() ?? '';
  const area        = form.querySelector('#area')?.value ?? '';
  const mensagem    = form.querySelector('#mensagem')?.value.trim() ?? '';
  const consentimento = form.querySelector('#lgpd_consent')?.checked ?? false;

  let valid = true;

  if (!nome) {
    showError('nome', 'Informe seu nome.');
    valid = false;
  }

  const telDigits = telefone.replace(/\D/g, '');
  if (telDigits.length < 10) {
    showError('telefone', 'Informe um WhatsApp válido (com DDD).');
    valid = false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    showError('email', 'Informe um e-mail válido.');
    valid = false;
  }

  if (!area) {
    showError('area', 'Selecione a área de interesse.');
    valid = false;
  }

  if (!mensagem) {
    showError('mensagem', 'Descreva brevemente seu caso.');
    valid = false;
  }

  if (!consentimento) {
    showError('lgpd_consent', 'Aceite a Política de Privacidade para continuar.');
    valid = false;
  }

  if (!valid) return null;

  return { nome, email, telefone, area, mensagem };
}

/**
 * Monta a mensagem de WhatsApp e abre o link wa.me.
 */
function enviarWhatsApp({ nome, email, telefone, area, mensagem }) {
  // TODO Parte 3: substituir pelo número real do advogado
  const NUMERO_ADVOGADO = '5535998739745';

  const texto = [
    '*NOVA SOLICITAÇÃO DE CONSULTA*',
    '',
    `👤 *Nome:* ${nome}`,
    `📧 *E-mail:* ${email}`,
    `📱 *Telefone:* ${telefone || 'Não informado'}`,
    `⚖️ *Área:* ${area || 'Não informada'}`,
    '',
    '📝 *Descrição do caso:*',
    mensagem,
    '',
    '---',
    'Mensagem enviada pelo site Ricardo Advocacia.',
  ].join('\n');

  const url = `https://wa.me/${NUMERO_ADVOGADO}?text=${encodeURIComponent(texto)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Define o estado visual do botão de envio.
 * @param {HTMLElement} btn
 * @param {'idle'|'loading'|'success'|'error'} state
 */
function setSubmitState(btn, state) {
  const labels = {
    idle:    'Enviar solicitação',
    loading: 'Enviando…',
    success: 'Solicitação enviada ✓',
    error:   'Erro ao enviar — tente novamente',
  };

  btn.disabled = state === 'loading';
  btn.textContent = labels[state];
  btn.dataset.state = state; // use CSS [data-state="success"] para colorir
}

/* ─── Ponto de entrada único do formulário ─────────────── */
const leadForm  = document.getElementById('lead-capture');
const submitBtn = document.getElementById('form-submit');

if (leadForm && submitBtn) {
  leadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const dados = validateForm(leadForm);
    if (!dados) return; // erros já exibidos

    setSubmitState(submitBtn, 'loading');

    try {
      /*
       * TODO Parte 2: trocar o bloco abaixo por:
       *
       * const res  = await fetch('/api/agendar', {
       *   method:  'POST',
       *   headers: { 'Content-Type': 'application/json' },
       *   body:    JSON.stringify(dados),
       * });
       *
       * if (!res.ok) throw new Error(`HTTP ${res.status}`);
       *
       * const { id } = await res.json();
       * console.info('Agendamento criado:', id);
       */

      // Simulação temporária até o backend existir
      await new Promise(resolve => setTimeout(resolve, 1000));

      enviarWhatsApp(dados);
      setSubmitState(submitBtn, 'success');

      setTimeout(() => setSubmitState(submitBtn, 'idle'), 5000);

    } catch (err) {
      console.error('Erro no envio:', err);
      setSubmitState(submitBtn, 'error');
      setTimeout(() => setSubmitState(submitBtn, 'idle'), 5000);
    }
  });
}