/**
 * Sistema LGPD Frontend Autocontido
 * Uso: Basta instanciar new LGPDSystem(config) no final do body da sua página.
 */
class LGPDSystem {
    constructor(config = {}) {
        this.storageKey = 'lgpd_consent_status';
        this.trackingScripts = config.trackingScripts || [];
        this.formSelector = config.formSelector || 'form';
        this.checkboxSelector = config.checkboxSelector || 'input[name="lgpd_consent"]';
        
        this.init();
    }

    init() {
        this.injectStyles();
        const consent = this.getConsent();

        if (consent === null) {
            this.renderBanner();
        } else if (consent === 'accepted') {
            this.loadTrackingScripts();
        }

        this.protectForms();
    }

    // 1. Gerencia o Consentimento de Cookies
    getConsent() {
        return localStorage.getItem(this.storageKey);
    }

    setConsent(status) {
        localStorage.setItem(this.storageKey, status);
    }

    renderBanner() {
        const banner = document.createElement('div');
        banner.id = 'lgpd-banner-wrapper';
        banner.innerHTML = `
            <div id="lgpd-banner-box">
                <p>
                    Utilizamos cookies e tecnologias semelhantes para melhorar sua experiência. 
                    Ao continuar, você concorda com nossa <a href="#" target="_blank">Política de Privacidade</a>.
                </p>
                <div class="lgpd-banner-actions">
                    <button id="lgpd-btn-reject">Rejeitar</button>
                    <button id="lgpd-btn-accept">Aceitar</button>
                </div>
            </div>
        `;
        document.body.appendChild(banner);

        document.getElementById('lgpd-btn-accept').addEventListener('click', () => {
            this.setConsent('accepted');
            this.closeBanner();
            this.loadTrackingScripts();
        });

        document.getElementById('lgpd-btn-reject').addEventListener('click', () => {
            this.setConsent('rejected');
            this.closeBanner();
        });
    }

    closeBanner() {
        const banner = document.getElementById('lgpd-banner-wrapper');
        if (banner) banner.style.display = 'none';
    }

    // 2. Controle de Segurança: Carrega scripts (Pixel, GA) APENAS com consentimento
    loadTrackingScripts() {
        this.trackingScripts.forEach(scriptConfig => {
            const script = document.createElement('script');
            script.src = scriptConfig.src;
            script.async = true;
            
            if (scriptConfig.attributes) {
                Object.keys(scriptConfig.attributes).forEach(key => {
                    script.setAttribute(key, scriptConfig.attributes[key]);
                });
            }
            document.head.appendChild(script);
        });
    }

    // 3. Segurança do Formulário: Impede envio sem consentimento explícito
    protectForms() {
        const forms = document.querySelectorAll(this.formSelector);
        
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                const checkbox = form.querySelector(this.checkboxSelector);
                
                // Se a landing page tiver o checkbox, ele DEVE estar marcado
                if (checkbox && !checkbox.checked) {
                    e.preventDefault(); // Trava o envio
                    this.showFormError(form, 'Você precisa aceitar a Política de Privacidade para prosseguir.');
                    return false;
                }
                
                return true;
            });

            // Garante que o checkbox não venha marcado por padrão (Boa prática LGPD)
            const checkbox = form.querySelector(this.checkboxSelector);
            if (checkbox) {
                checkbox.checked = false;
            }
        });
    }

    showFormError(form, message) {
        // Remove erro anterior se existir
        const oldError = document.getElementById('lgpd-form-error');
        if (oldError) oldError.remove();

        const errorDiv = document.createElement('div');
        errorDiv.id = 'lgpd-form-error';
        errorDiv.innerText = message;
        
        form.prepend(errorDiv);

        // Remove o erro após 4 segundos para não poluir a UI
        setTimeout(() => errorDiv.remove(), 4000);
    }

    // 4. Injeta o CSS necessário (Para ser 100% JS)
    injectStyles() {
        if (document.getElementById('lgpd-custom-styles')) return;

        const style = document.createElement('style');
        style.id = 'lgpd-custom-styles';
        style.textContent = `
            #lgpd-banner-wrapper {
                position: fixed;
                bottom: 0;
                left: 0;
                width: 100%;
                background: rgba(0, 0, 0, 0.9);
                z-index: 999999;
                font-family: Arial, sans-serif;
                padding: 20px;
                box-sizing: border-box;
            }
            #lgpd-banner-box {
                max-width: 800px;
                margin: 0 auto;
                display: flex;
                flex-wrap: wrap;
                justify-content: space-between;
                align-items: center;
                color: #fff;
                font-size: 14px;
            }
            #lgpd-banner-box p {
                margin: 0;
                width: 60%;
            }
            #lgpd-banner-box a {
                color: #4CAF50;
                text-decoration: underline;
            }
            .lgpd-banner-actions {
                display: flex;
                gap: 10px;
                width: 35%;
                justify-content: flex-end;
            }
            .lgpd-banner-actions button {
                padding: 10px 20px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
                transition: opacity 0.2s;
            }
            .lgpd-banner-actions button:hover {
                opacity: 0.8;
            }
            #lgpd-btn-reject {
                background: #555;
                color: #fff;
            }
            #lgpd-btn-accept {
                background: #4CAF50;
                color: #fff;
            }
            #lgpd-form-error {
                background: #ffebee;
                color: #c62828;
                padding: 10px;
                border-radius: 4px;
                font-size: 13px;
                margin-bottom: 15px;
                border-left: 4px solid #c62828;
                font-family: Arial, sans-serif;
            }
        `;
        document.head.appendChild(style);
    }
}

// ==========================================================
// COMO USAR NA SUA LANDING PAGE (Configuração de Inicialização)
// ==========================================================

// Aguarde o DOM carregar para instanciar
document.addEventListener("DOMContentLoaded", () => {
    const meuSistemaLGPD = new LGPDSystem({
        
        // 1. Configure aqui os scripts de rastreamento que você usa na página
        // Eles SÓ serão carregados se o usuário clicar em "Aceitar"
        trackingScripts: [
            {
                src: 'https://www.googletagmanager.com/gtag/js?id=SEU_ID_AQUI',
                attributes: { async: true }
            },
            {
                src: 'https://connect.facebook.net/en_US/fbevents.js',
                attributes: { async: true }
            }
            // Adicione quantos scripts precisar (Hotjar, TikTok Pixel, etc)
        ],

        // 2. Seletor do seu formulário de captação de leads
        formSelector: 'form#lead-capture', 
        
        // 3. Seletor EXATO do checkbox de consentimento dentro desse formulário
        checkboxSelector: 'input[name="lgpd_consent"]'
    });
});