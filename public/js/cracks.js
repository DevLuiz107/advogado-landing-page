/**
 * cracks.js — Efeito de rachaduras orgânicas no canvas
 * Landing page de advocacia | Dev Luiz
 *
 * USO:
 *   <canvas id="cracks-canvas"></canvas>
 *   <script src="cracks.js"></script>
 *   <script>CrackSystem.init({ canvasId: 'cracks-canvas' })</script>
 */

const CrackSystem = (() => {
  // ─── Estado interno ───────────────────────────────────────────────────────
  let canvas, ctx, W, H, raf;
  let cracks    = [];
  let particles = [];
  let cfg       = {};

  // ─── Utilitários ──────────────────────────────────────────────────────────
  const rand    = (min, max) => Math.random() * (max - min) + min;
  const randInt = (min, max) => Math.floor(rand(min, max));
  const clamp   = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const lerp    = (a, b, t) => a + (b - a) * t;

  // ─── Rachadura ────────────────────────────────────────────────────────────
  /**
   * Uma rachadura é um segmento poligonal que cresce recursivamente
   * a partir de um ponto de origem, bifurcando-se em galhos menores.
   */
  class Crack {
    constructor(x, y, angle, depth = 0) {
      this.x       = x;
      this.y       = y;
      this.angle   = angle;
      this.depth   = depth;
      this.length  = rand(cfg.minLen, cfg.maxLen) * Math.pow(cfg.lenDecay, depth);
      this.speed   = rand(cfg.minSpeed, cfg.maxSpeed);
      this.progress = 0;        // 0 → 1 (quanto da linha já foi desenhado)
      this.alpha   = rand(0.25, 0.7) * Math.pow(0.8, depth);
      this.width   = clamp(rand(0.4, 1.4) - depth * 0.25, 0.2, 1.4);
      this.done    = false;
      this.children = [];
      this.spawned  = false;

      // Jitter orgânico: a linha não é reta — tem micro-desvios
      this.jitter  = rand(0.02, 0.12);

      // Ponto final calculado
      const wobble = rand(-cfg.spread, cfg.spread);
      this.tx = x + Math.cos(angle + wobble) * this.length;
      this.ty = y + Math.sin(angle + wobble) * this.length;

      // Segmentos de path com micro-jitter (calculados na criação)
      this.segments = this._buildSegments();
    }

    _buildSegments() {
      const segs = [];
      const steps = Math.max(4, Math.floor(this.length / 8));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const jx = (i > 0 && i < steps) ? rand(-this.jitter * this.length, this.jitter * this.length) : 0;
        const jy = (i > 0 && i < steps) ? rand(-this.jitter * this.length, this.jitter * this.length) : 0;
        segs.push({
          x: lerp(this.x, this.tx, t) + jx,
          y: lerp(this.y, this.ty, t) + jy,
        });
      }
      return segs;
    }

    update() {
      if (this.done) return;
      this.progress = clamp(this.progress + this.speed, 0, 1);

      // Ao completar 70% do trajeto → bifurca (uma vez)
      if (this.progress >= 0.7 && !this.spawned && this.depth < cfg.maxDepth) {
        this._bifurcate();
        this.spawned = true;
      }

      if (this.progress >= 1) {
        this.done = true;
        // Partículas de poeira na ponta da rachadura
        this._emitDust();
      }
    }

    _bifurcate() {
      const tipX = this.segments[Math.floor(this.progress * (this.segments.length - 1))].x;
      const tipY = this.segments[Math.floor(this.progress * (this.segments.length - 1))].y;

      const branches = randInt(1, 3); // 1 ou 2 galhos
      for (let i = 0; i < branches; i++) {
        const spread = rand(cfg.minBranch, cfg.maxBranch) * (i % 2 === 0 ? 1 : -1);
        const child  = new Crack(tipX, tipY, this.angle + spread, this.depth + 1);
        this.children.push(child);
        cracks.push(child);
      }
    }

    _emitDust() {
      const tip = this.segments[this.segments.length - 1];
      const count = randInt(2, 6);
      for (let i = 0; i < count; i++) {
        particles.push(new DustParticle(tip.x, tip.y, this.alpha));
      }
    }

    draw() {
      if (this.segments.length < 2) return;

      const visibleCount = Math.floor(this.progress * (this.segments.length - 1));
      if (visibleCount < 1) return;

      ctx.save();
      ctx.globalAlpha  = this.alpha;
      ctx.strokeStyle  = cfg.crackColor;
      ctx.lineWidth    = this.width;
      ctx.lineCap      = 'round';
      ctx.lineJoin     = 'round';

      ctx.beginPath();
      ctx.moveTo(this.segments[0].x, this.segments[0].y);
      for (let i = 1; i <= visibleCount; i++) {
        ctx.lineTo(this.segments[i].x, this.segments[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  // ─── Partícula de poeira ──────────────────────────────────────────────────
  class DustParticle {
    constructor(x, y, parentAlpha) {
      this.x    = x + rand(-3, 3);
      this.y    = y + rand(-3, 3);
      this.vx   = rand(-0.4, 0.4);
      this.vy   = rand(-0.8, -0.1);
      this.life = 1;
      this.decay = rand(0.012, 0.025);
      this.size  = rand(0.5, 2);
      this.alpha = parentAlpha * rand(0.3, 0.8);
    }

    update() {
      this.x    += this.vx;
      this.y    += this.vy;
      this.vy   += 0.015; // gravidade leve
      this.life -= this.decay;
    }

    draw() {
      if (this.life <= 0) return;
      ctx.save();
      ctx.globalAlpha = this.alpha * this.life;
      ctx.fillStyle   = cfg.crackColor;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    isDead() { return this.life <= 0; }
  }

  // ─── Spawn de uma nova rachadura de origem ────────────────────────────────
  function spawnRoot() {
    if (cracks.length > cfg.maxCracks) return;

    // Origens preferem as bordas e zonas intersticiais — não o centro
    let x, y;
    const zone = Math.random();
    if (zone < 0.35) {
      // Borda esquerda/direita
      x = Math.random() < 0.5 ? rand(0, W * 0.15) : rand(W * 0.85, W);
      y = rand(0, H);
    } else if (zone < 0.65) {
      // Borda topo/fundo
      x = rand(0, W);
      y = Math.random() < 0.5 ? rand(0, H * 0.2) : rand(H * 0.8, H);
    } else {
      // Interior espalhado
      x = rand(W * 0.1, W * 0.9);
      y = rand(H * 0.1, H * 0.9);
    }

    const angle = rand(0, Math.PI * 2);
    cracks.push(new Crack(x, y, angle, 0));
  }

  // ─── Loop principal ───────────────────────────────────────────────────────
  let spawnTimer = 0;

  function loop() {
    // Limpa com fade — cria rastro fantasma suave
    ctx.fillStyle = cfg.fadeColor;
    ctx.fillRect(0, 0, W, H);

    // Spawn periódico
    spawnTimer++;
    if (spawnTimer >= cfg.spawnInterval) {
      spawnRoot();
      spawnTimer = 0;
    }

    // Update + draw rachaduras
    for (let i = cracks.length - 1; i >= 0; i--) {
      cracks[i].update();
      cracks[i].draw();
      // Remove raízes finalizadas (filhos gerenciam-se via `done`)
      if (cracks[i].done && cracks[i].depth === 0 && cracks[i].children.length === 0) {
        // Mantém por fade — remove quando alpha chega a zero via GC natural
      }
    }

    // Limpa rachaduras antigas (profundidade 0 + todas filhas finalizadas)
    if (cracks.length > cfg.maxCracks * 1.5) {
      cracks = cracks.filter(c => !(c.done && c.depth === 0));
    }

    // Partículas
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      particles[i].draw();
      if (particles[i].isDead()) particles.splice(i, 1);
    }

    raf = requestAnimationFrame(loop);
  }

  // ─── Resize ───────────────────────────────────────────────────────────────
  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  // ─── API pública ──────────────────────────────────────────────────────────
  /**
   * @param {Object} options
   * @param {string}  options.canvasId       — id do elemento <canvas>
   * @param {string}  [options.crackColor]   — cor das rachaduras
   * @param {string}  [options.bgColor]      — cor de fundo do canvas
   * @param {number}  [options.fadeAlpha]    — opacidade do fade por frame (0.01–0.15)
   * @param {number}  [options.maxCracks]    — limite de segmentos simultâneos
   * @param {number}  [options.spawnInterval]— frames entre novos focos
   * @param {number}  [options.maxDepth]     — profundidade máxima de bifurcação
   * @param {number}  [options.minLen]       — comprimento mínimo de um galho raiz
   * @param {number}  [options.maxLen]       — comprimento máximo de um galho raiz
   */
  function init(options = {}) {
    canvas = document.getElementById(options.canvasId || 'cracks-canvas');
    if (!canvas) {
      console.error('[CrackSystem] Canvas não encontrado.');
      return;
    }
    ctx = canvas.getContext('2d');

    // Defaults pensados para fundo escuro (vinho/preto) de advocacia
    cfg = {
      crackColor:    options.crackColor    ?? '#c9a84c',   // dourado envelhecido
      bgColor:       options.bgColor       ?? '#1a0a0f',   // vinho quase preto
      fadeAlpha:     options.fadeAlpha     ?? 0.045,       // rastro longo
      maxCracks:     options.maxCracks     ?? 120,
      spawnInterval: options.spawnInterval ?? 38,          // frames
      maxDepth:      options.maxDepth      ?? 4,
      minLen:        options.minLen        ?? 60,
      maxLen:        options.maxLen        ?? 180,
      lenDecay:      options.lenDecay      ?? 0.62,
      minSpeed:      options.minSpeed      ?? 0.008,
      maxSpeed:      options.maxSpeed      ?? 0.022,
      spread:        options.spread        ?? 0.38,        // desvio angular raiz
      minBranch:     options.minBranch     ?? 0.18,        // desvio angular galho
      maxBranch:     options.maxBranch     ?? 0.65,
    };

    cfg.fadeColor = hexToFade(cfg.bgColor, cfg.fadeAlpha);

    resize();
    window.addEventListener('resize', () => {
      resize();
      // Limpa tudo ao redimensionar
      ctx.fillStyle = cfg.bgColor;
      ctx.fillRect(0, 0, W, H);
    });

    // Preenche fundo inicial
    ctx.fillStyle = cfg.bgColor;
    ctx.fillRect(0, 0, W, H);

    // Semeia rachaduras iniciais para não começar vazio
    const seed = Math.min(8, Math.floor((W * H) / 40000));
    for (let i = 0; i < seed; i++) spawnRoot();

    if (raf) cancelAnimationFrame(raf);
    loop();
  }

  function destroy() {
    if (raf) cancelAnimationFrame(raf);
    cracks    = [];
    particles = [];
  }

  // Converte hex + alpha em rgba string para o fade
  function hexToFade(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  return { init, destroy };
})();