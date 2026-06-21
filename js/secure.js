/**
 * LGPDSystem v2.0
 * Sistema de consentimento conforme LGPD / ANPD.
 *
 * CORREÇÕES v2 em relação à versão anterior:
 *  - Consentimento armazenado com metadados (data, versão, categorias aceitas)
 *  - Mecanismo de revogação obrigatório (art. 8º §5º LGPD)
 *  - Expiração automática configurável (padrão: 365 dias)
 *  - Granularidade de categorias (essencial, analytics, marketing)
 *  - Banner removido do DOM ao fechar (não apenas ocultado)
 *  - Link da política de privacidade obrigatório na configuração
 *  - Aviso explícito se scripts de rastreamento externos já estiverem no HTML
 *  - Proteção de formulário mantida (defesa de UX; backend ainda é necessário)
 *
 * IMPORTANTE: A proteção de formulário no frontend é apenas UX.
 * Valide consentimento também no backend antes de gravar qualquer dado.
 *
 * USO:
 *   document.addEventListener("DOMContentLoaded", () => {
 *     new LGPDSystem({ ... });
 *   });
 */

class LGPDSystem {
    constructor(config = {}) {
        this._validateConfig(config);

        this.storageKey      = 'lgpd_consent_v2';
        this.policyVersion   = config.policyVersion   || '1.0';
        this.expirationDays  = config.expirationDays  || 365;
        this.privacyPolicyUrl = config.privacyPolicyUrl;
        this.formSelector    = config.formSelector    || 'form';
        this.checkboxSelector = config.checkboxSelector || 'input[name="lgpd_consent"]';
        this.revokeButtonSelector = config.revokeButtonSelector || null;

        // Categorias de scripts segmentadas
        this.scripts = {
            analytics: config.scripts?.analytics || [],
            marketing: config.scripts?.marketing || [],
        };

        // Callback chamado após qualquer mudança de consentimento
        this.onConsentChange = config.onConsentChange || null;

        this._warnIfExternalScriptsPresent();
        this._injectStyles();
        this._init();
    }

    // ─── VALIDAÇÃO ─────────────────────────────────────────────────────────

    _validateConfig(config) {
        if (!config.privacyPolicyUrl || config.privacyPolicyUrl === '#') {
            console.error(
                '[LGPDSystem] ERRO: "privacyPolicyUrl" é obrigatório e não pode ser "#".\n' +
                'Sem um link válido para a Política de Privacidade, o consentimento não é ' +
                'informado e portanto inválido sob o art. 8º da LGPD.'
            );
        }
    }

    /**
     * Avisa no console se detectar scripts de rastreamento conhecidos já carregados.
     * NÃO consegue bloquear — é apenas um alerta de configuração para o desenvolvedor.
     */
    _warnIfExternalScriptsPresent() {
        const knownTrackers = [
            'googletagmanager.com',
            'google-analytics.com',
            'fbevents.js',
            'hotjar.com',
            'clarity.ms',
            'tiktok.com',
        ];
        const loadedSrcs = Array.from(document.querySelectorAll('script[src]'))
            .map(s => s.src);

        const found = knownTrackers.filter(t => loadedSrcs.some(src => src.includes(t)));
        if (found.length > 0) {
            console.warn(
                '[LGPDSystem] AVISO: Os seguintes scripts de rastreamento parecem estar ' +
                'carregados diretamente no HTML, ignorando o controle de consentimento:\n' +
                found.join('\n') +
                '\nRemova-os do HTML e passe-os via "scripts.analytics" ou "scripts.marketing".'
            );
        }
    }

    // ─── INICIALIZAÇÃO ──────────────────────────────────────────────────────

    _init() {
        const consent = this._getConsent();

        if (!consent || this._isExpired(consent) || consent.policyVersion !== this.policyVersion) {
            // Sem consentimento válido: limpa registro antigo e exibe banner
            this._clearConsent();
            this._renderBanner();
        } else {
            // Consentimento válido: carrega apenas o que foi aceito
            this._loadScriptsForCategories(consent.categories);
        }

        this._protectForms();
        this._bindRevokeButton();
    }

    // ─── PERSISTÊNCIA ───────────────────────────────────────────────────────

    _getConsent() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    /**
     * Armazena consentimento com metadados completos para rastreabilidade.
     * @param {string[]} categories - Ex: ['analytics', 'marketing'] ou []
     */
    _saveConsent(categories) {
        const record = {
            policyVersion: this.policyVersion,
            categories,                          // quais categorias foram aceitas
            timestamp: new Date().toISOString(), // data/hora ISO para auditoria
            expiresAt: this._futureDate(this.expirationDays).toISOString(),
            userAgent: navigator.userAgent,      // contexto técnico mínimo
        };
        localStorage.setItem(this.storageKey, JSON.stringify(record));
        return record;
    }

    _clearConsent() {
        localStorage.removeItem(this.storageKey);
    }

    _isExpired(consent) {
        if (!consent?.expiresAt) return true;
        return new Date() > new Date(consent.expiresAt);
    }

    _futureDate(days) {
        const d = new Date();
        d.setDate(d.getDate() + days);
        return d;
    }

    // ─── BANNER ─────────────────────────────────────────────────────────────

    _renderBanner() {
        if (document.getElementById('lgpd-banner-wrapper')) return;

        const policyLink = this.privacyPolicyUrl
            ? `<a href="${this.privacyPolicyUrl}" target="_blank" rel="noopener noreferrer">Política de Privacidade</a>`
            : '<span style="color:#f87171">⚠ URL da política não configurada</span>';

        const banner = document.createElement('div');
        banner.id = 'lgpd-banner-wrapper';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-modal', 'false');
        banner.setAttribute('aria-label', 'Aviso de cookies e privacidade');
        banner.innerHTML = `
            <div id="lgpd-banner-box">
                <div id="lgpd-banner-text">
                    <p>
                        Utilizamos cookies para melhorar sua experiência. Você pode aceitar todos,
                        escolher categorias ou rejeitar os não essenciais.
                        Veja nossa ${policyLink}.
                    </p>
                    <div id="lgpd-categories">
                        <label class="lgpd-category">
                            <input type="checkbox" disabled checked>
                            <span>Essencial <small>(sempre ativo)</small></span>
                        </label>
                        <label class="lgpd-category">
                            <input type="checkbox" id="lgpd-cat-analytics" checked>
                            <span>Analytics</span>
                        </label>
                        <label class="lgpd-category">
                            <input type="checkbox" id="lgpd-cat-marketing" checked>
                            <span>Marketing</span>
                        </label>
                    </div>
                </div>
                <div class="lgpd-banner-actions">
                    <button id="lgpd-btn-reject">Rejeitar tudo</button>
                    <button id="lgpd-btn-custom">Salvar seleção</button>
                    <button id="lgpd-btn-accept">Aceitar tudo</button>
                </div>
            </div>
        `;
        document.body.appendChild(banner);

        document.getElementById('lgpd-btn-accept').addEventListener('click', () => {
            this._handleConsent(['analytics', 'marketing']);
        });

        document.getElementById('lgpd-btn-custom').addEventListener('click', () => {
            const cats = [];
            if (document.getElementById('lgpd-cat-analytics').checked) cats.push('analytics');
            if (document.getElementById('lgpd-cat-marketing').checked) cats.push('marketing');
            this._handleConsent(cats);
        });

        document.getElementById('lgpd-btn-reject').addEventListener('click', () => {
            this._handleConsent([]);
        });
    }

    _handleConsent(categories) {
        const record = this._saveConsent(categories);
        this._closeBanner();
        this._loadScriptsForCategories(categories);
        if (typeof this.onConsentChange === 'function') {
            this.onConsentChange(record);
        }
    }

    _closeBanner() {
        const banner = document.getElementById('lgpd-banner-wrapper');
        if (banner) banner.remove(); // remove do DOM, não apenas oculta
    }

    // ─── CARREGAMENTO DE SCRIPTS ────────────────────────────────────────────

    /**
     * Carrega scripts apenas das categorias aceitas.
     * Nunca carrega scripts se a categoria não foi aceita.
     */
    _loadScriptsForCategories(categories) {
        categories.forEach(cat => {
            const list = this.scripts[cat];
            if (!Array.isArray(list)) return;
            list.forEach(scriptConfig => {
                if (!scriptConfig.src) return;
                // Evita carregar o mesmo script duas vezes
                if (document.querySelector(`script[src="${scriptConfig.src}"]`)) return;

                const script = document.createElement('script');
                script.src = scriptConfig.src;
                script.async = true;
                if (scriptConfig.attributes) {
                    Object.entries(scriptConfig.attributes).forEach(([k, v]) => {
                        script.setAttribute(k, v);
                    });
                }
                document.head.appendChild(script);
            });
        });
    }

    // ─── REVOGAÇÃO ──────────────────────────────────────────────────────────

    /**
     * Exibe novamente o banner de consentimento para o usuário rever suas escolhas.
     * Chame este método a partir de um link/botão no rodapé do site.
     */
    revokeConsent() {
        this._clearConsent();
        this._renderBanner();
    }

    /**
     * Vincula automaticamente um botão de revogação se o seletor foi configurado.
     * Ex: config.revokeButtonSelector = '#btn-gerenciar-cookies'
     */
    _bindRevokeButton() {
        if (!this.revokeButtonSelector) return;
        const btn = document.querySelector(this.revokeButtonSelector);
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.revokeConsent();
            });
        }
    }

    // ─── PROTEÇÃO DE FORMULÁRIO ─────────────────────────────────────────────

    /**
     * Impede envio de formulário sem checkbox de consentimento marcado.
     * AVISO: Esta proteção é apenas de UX/frontend.
     * O backend deve validar de forma independente antes de persistir dados.
     */
    _protectForms() {
        const forms = document.querySelectorAll(this.formSelector);

        forms.forEach(form => {
            const checkbox = form.querySelector(this.checkboxSelector);
            // Garante que checkbox venha desmarcado por padrão (boa prática LGPD)
            if (checkbox) checkbox.checked = false;

            form.addEventListener('submit', (e) => {
                if (checkbox && !checkbox.checked) {
                    e.preventDefault();
                    e.stopImmediatePropagation(); // impede outros listeners de submit
                    this._showFormError(
                        form,
                        'Você precisa aceitar a Política de Privacidade para prosseguir.'
                    );
                }
            });
        });
    }

    _showFormError(form, message) {
        const existing = document.getElementById('lgpd-form-error');
        if (existing) existing.remove();

        const errorDiv = document.createElement('div');
        errorDiv.id = 'lgpd-form-error';
        errorDiv.setAttribute('role', 'alert'); // acessibilidade: leitores de tela anunciam
        errorDiv.textContent = message; // textContent em vez de innerText (mais seguro)
        form.prepend(errorDiv);

        setTimeout(() => errorDiv.remove(), 5000);
    }

    // ─── ESTILOS ─────────────────────────────────────────────────────────────

    _injectStyles() {
        if (document.getElementById('lgpd-custom-styles')) return;

        const style = document.createElement('style');
        style.id = 'lgpd-custom-styles';
        style.textContent = `
            #lgpd-banner-wrapper {
                position: fixed;
                bottom: 0;
                left: 0;
                width: 100%;
                background: rgba(15, 15, 15, 0.97);
                z-index: 999999;
                font-family: inherit, Arial, sans-serif;
                padding: 20px 24px;
                box-sizing: border-box;
                border-top: 1px solid rgba(255,255,255,0.08);
            }
            #lgpd-banner-box {
                max-width: 960px;
                margin: 0 auto;
                display: flex;
                flex-wrap: wrap;
                gap: 16px;
                justify-content: space-between;
                align-items: flex-start;
                color: #e2e2e2;
                font-size: 14px;
                line-height: 1.5;
            }
            #lgpd-banner-text {
                flex: 1 1 360px;
            }
            #lgpd-banner-box p {
                margin: 0 0 12px;
            }
            #lgpd-banner-box a {
                color: #60a5fa;
                text-decoration: underline;
            }
            #lgpd-categories {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
                margin-top: 4px;
            }
            .lgpd-category {
                display: flex;
                align-items: center;
                gap: 6px;
                cursor: pointer;
                font-size: 13px;
                color: #ccc;
            }
            .lgpd-category input[disabled] {
                opacity: 0.5;
                cursor: not-allowed;
            }
            .lgpd-category small {
                font-size: 11px;
                color: #888;
            }
            .lgpd-banner-actions {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                align-items: center;
                align-self: center;
            }
            .lgpd-banner-actions button {
                padding: 9px 18px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 600;
                transition: opacity 0.15s, transform 0.1s;
                white-space: nowrap;
            }
            .lgpd-banner-actions button:hover {
                opacity: 0.85;
                transform: translateY(-1px);
            }
            .lgpd-banner-actions button:active {
                transform: translateY(0);
            }
            #lgpd-btn-reject {
                background: transparent;
                color: #aaa;
                border: 1px solid #444;
            }
            #lgpd-btn-reject:hover {
                border-color: #888;
                color: #fff;
            }
            #lgpd-btn-custom {
                background: #374151;
                color: #e5e7eb;
            }
            #lgpd-btn-accept {
                background: #2563eb;
                color: #fff;
            }
            #lgpd-form-error {
                background: #fef2f2;
                color: #991b1b;
                padding: 10px 14px;
                border-radius: 6px;
                font-size: 13px;
                margin-bottom: 14px;
                border-left: 4px solid #ef4444;
                font-family: inherit, Arial, sans-serif;
            }
            @media (max-width: 600px) {
                .lgpd-banner-actions {
                    width: 100%;
                    flex-direction: column;
                }
                .lgpd-banner-actions button {
                    width: 100%;
                    text-align: center;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// ==========================================================
// EXEMPLO DE USO
// ==========================================================

document.addEventListener("DOMContentLoaded", () => {
    const lgpd = new LGPDSystem({

        // OBRIGATÓRIO: URL real da sua Política de Privacidade
        privacyPolicyUrl: '/politica-de-privacidade',

        // Versão da política. Mude aqui sempre que alterar o documento.
        // Isso invalida consentimentos anteriores e exibe o banner novamente.
        policyVersion: '1.0',

        // Após quantos dias o consentimento expira (ANPD recomenda reavaliação periódica)
        expirationDays: 365,

        // Scripts segmentados por categoria — só carregam se a categoria for aceita
        scripts: {
            analytics: [
                {
                    src: 'https://www.googletagmanager.com/gtag/js?id=SEU_ID_AQUI',
                }
            ],
            marketing: [
                {
                    src: 'https://connect.facebook.net/en_US/fbevents.js',
                }
            ],
        },

        // Seletor do botão de gerenciamento de cookies no rodapé (para revogação)
        // Ex: <a href="#" id="btn-gerenciar-cookies">Gerenciar cookies</a>
        revokeButtonSelector: '#btn-gerenciar-cookies',

        // Seletor do formulário com checkbox de consentimento
        formSelector: 'form#lead-capture',
        checkboxSelector: 'input[name="lgpd_consent"]',

        // Callback opcional: chamado sempre que o consentimento muda
        // Útil para integrar com GTM dataLayer ou outros sistemas
        onConsentChange: (record) => {
            console.info('[LGPD] Consentimento registrado:', record);
            // Exemplo de integração com GTM:
            // window.dataLayer = window.dataLayer || [];
            // window.dataLayer.push({ event: 'lgpd_consent', ...record });
        },
    });

    // lgpd.revokeConsent() pode ser chamado manualmente a qualquer momento
    // para reabrir o painel de consentimento.
    window.__lgpd = lgpd; // expõe instância para debugging e integração
});