// ─── Como usar em app.js / server.js ─────────────────────────────────────────

const express = require("express");
const { securityHeaders, forceHTTPS } = require("./security-headers");

const app = express();

// Trust proxy se estiver atrás de Nginx, Heroku, Railway, etc.
// Necessário para req.secure funcionar corretamente.
app.set("trust proxy", 1);

// 1. Redireciona HTTP → HTTPS (se necessário — veja comentário no arquivo)
app.use(forceHTTPS);

// 2. Aplica todos os security headers
app.use(securityHeaders);

// ... resto das suas rotas

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});

// ─── Como testar ──────────────────────────────────────────────────────────────
//
// 1. Suba seu servidor em produção (com HTTPS ativo)
// 2. Acesse: https://securityheaders.com/?q=SEU_DOMINIO
// 3. Resultado esperado: A+
//
// Teste local (sem HTTPS):
//   curl -I http://localhost:3000
//   → Verifique os headers na resposta
//
// ─── O que pode derrubar sua nota ─────────────────────────────────────────────
//
// ❌ CSP com 'unsafe-inline' ou 'unsafe-eval'     → derruba para B ou C
// ❌ Falta de Permissions-Policy                   → derruba para B
// ❌ Falta de Referrer-Policy                      → penaliza
// ❌ HSTS sem includeSubDomains                    → penaliza
// ❌ Header X-Powered-By exposto                   → informação desnecessária
// ❌ HTTP sem redirect para HTTPS                  → falha imediata