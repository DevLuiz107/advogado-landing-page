document.addEventListener("DOMContentLoaded", () => {

    /* ═══════════════════════════════════════════════════════
       1. MENU MOBILE — Toggle
    ═══════════════════════════════════════════════════════ */
    const toggle  = document.querySelector('.nav__toggle');
    const mobile  = document.querySelector('.nav__mobile');

    if (toggle && mobile) {
        toggle.addEventListener('click', () => {
            const isOpen = toggle.classList.toggle('is-open');
            mobile.classList.toggle('is-open', isOpen);
            toggle.setAttribute('aria-expanded', isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
        });

        mobile.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                toggle.classList.remove('is-open');
                mobile.classList.remove('is-open');
                toggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            });
        });
    }


    /* ═══════════════════════════════════════════════════════
       2. ANIMAÇÕES DE ENTRADA — IntersectionObserver
    ═══════════════════════════════════════════════════════ */
    const revealElements = document.querySelectorAll('[data-reveal]');

    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.12,
            rootMargin: '0px 0px -40px 0px'
        });

        revealElements.forEach(el => revealObserver.observe(el));
    } else {
        revealElements.forEach(el => el.classList.add('is-visible'));
    }


    /* ═══════════════════════════════════════════════════════
       3. BARRA DE PROGRESSO DE LEITURA
    ═══════════════════════════════════════════════════════ */
    const progressFill  = document.getElementById('progress-fill');
    const policyContent = document.querySelector('.policy__content');

    if (progressFill && policyContent) {
        const updateProgress = () => {
            const rect          = policyContent.getBoundingClientRect();
            const contentTop    = rect.top + window.scrollY;
            const contentHeight = rect.height;
            const scrollPos     = window.scrollY + window.innerHeight * 0.4;

            let progress = ((scrollPos - contentTop) / contentHeight) * 100;
            progress = Math.max(0, Math.min(100, progress));

            progressFill.style.height = progress + '%';
        };

        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    updateProgress();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });

        updateProgress();
    }


    /* ═══════════════════════════════════════════════════════
       4. SUMÁRIO — Destaque da seção ativa
    ═══════════════════════════════════════════════════════ */
    const tocLinks = document.querySelectorAll('.toc__link');
    const sections = document.querySelectorAll('.policy__section');

    if (tocLinks.length && sections.length) {
        const highlightToc = () => {
            let currentId  = '';
            const scrollPos = window.scrollY + window.innerHeight * 0.3;

            sections.forEach(section => {
                if (section.offsetTop <= scrollPos) {
                    currentId = section.id;
                }
            });

            tocLinks.forEach(link => {
                const isActive = link.getAttribute('href') === '#' + currentId;
                link.classList.toggle('is-active', isActive);
            });
        };

        let tocTicking = false;
        window.addEventListener('scroll', () => {
            if (!tocTicking) {
                requestAnimationFrame(() => {
                    highlightToc();
                    tocTicking = false;
                });
                tocTicking = true;
            }
        }, { passive: true });

        highlightToc();
    }


    /* ═══════════════════════════════════════════════════════
       5. BOTÃO VOLTAR AO TOPO
    ═══════════════════════════════════════════════════════ */
    const backToTop = document.getElementById('back-to-top');

    if (backToTop) {
        const toggleBackToTop = () => {
            backToTop.classList.toggle('is-visible', window.scrollY > 500);
        };

        let bttTicking = false;
        window.addEventListener('scroll', () => {
            if (!bttTicking) {
                requestAnimationFrame(() => {
                    toggleBackToTop();
                    bttTicking = false;
                });
                bttTicking = true;
            }
        }, { passive: true });

        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        toggleBackToTop();
    }


    /* ═══════════════════════════════════════════════════════
       6. SMOOTH SCROLL — Links âncora do TOC e internos
    ═══════════════════════════════════════════════════════ */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const targetId = anchor.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const offset = 88;
                const top = target.getBoundingClientRect().top + window.scrollY - offset;

                window.scrollTo({ top, behavior: 'smooth' });
                history.pushState(null, '', targetId);
            }
        });
    });


    /* ═══════════════════════════════════════════════════════
       7. COPIAR LINK DA SEÇÃO — Clique no título
    ═══════════════════════════════════════════════════════ */
    document.querySelectorAll('.policy__section-title').forEach(title => {
        title.title = 'Clique para copiar o link desta seção';

        title.addEventListener('click', () => {
            const section = title.closest('.policy__section');
            if (!section || !section.id) return;

            const url = window.location.origin + window.location.pathname + '#' + section.id;

            const onSuccess = () => {
                const original = title.style.color;
                title.style.color = 'var(--gold)';
                setTimeout(() => { title.style.color = original; }, 1200);
            };

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).then(onSuccess).catch(() => {
                    fallbackCopy(url);
                    onSuccess();
                });
            } else {
                fallbackCopy(url);
                onSuccess();
            }
        });

        function fallbackCopy(text) {
            const input    = document.createElement('input');
            input.value    = text;
            input.style.cssText = 'position:fixed;opacity:0';
            document.body.appendChild(input);
            input.select();
            try { document.execCommand('copy'); } catch (e) { /* silencioso */ }
            document.body.removeChild(input);
        }
    });


    /* ═══════════════════════════════════════════════════════
       8. TEMPO DE LEITURA ESTIMADO — Cálculo dinâmico
    ═══════════════════════════════════════════════════════ */
    const readingTimeMeta = document.querySelector('.page-hero__meta-item:last-child');
    if (readingTimeMeta && policyContent) {
        const text         = policyContent.textContent || '';
        const wordsPerMin  = 200;
        const wordCount    = text.trim().split(/\s+/).length;
        const minutes      = Math.ceil(wordCount / wordsPerMin);

        readingTimeMeta.innerHTML = readingTimeMeta.innerHTML.replace(
            /Leitura estimada: .+ minutos/,
            'Leitura estimada: ' + minutes + ' minutos'
        );
    }


    /* ═══════════════════════════════════════════════════════
       9. FECHAR MENU MOBILE AO REDIMENSIONAR
    ═══════════════════════════════════════════════════════ */
    if (toggle && mobile) {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (window.innerWidth > 860) {
                    toggle.classList.remove('is-open');
                    mobile.classList.remove('is-open');
                    toggle.setAttribute('aria-expanded', 'false');
                    document.body.style.overflow = '';
                }
            }, 150);
        });
    }

    console.log("Política de Privacidade — Ribeiro & Associados");
    console.log("Todos os módulos carregados com sucesso.");
});