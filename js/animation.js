const texts = [
  "Advocacia Empresarial",
  "Direito Tributário",
  "Planejamento Patrimonial"
];

const el = document.getElementById("typed-output");

const SPEED_TYPE  = 60;   // ms por caractere ao digitar
const SPEED_ERASE = 35;   // ms por caractere ao apagar (mais rápido = natural)
const PAUSE_AFTER = 1800; // pausa com texto completo
const PAUSE_NEXT  = 400;  // pausa antes do próximo texto

let idx = 0, pos = 0, erasing = false;

function tick() {
  const current = texts[idx];

  if (!erasing) {
    el.textContent = current.slice(0, ++pos);
    if (pos === current.length) { erasing = true; setTimeout(tick, PAUSE_AFTER); return; }
    setTimeout(tick, SPEED_TYPE);
  } else {
    el.textContent = current.slice(0, --pos);
    if (pos === 0) { erasing = false; idx = (idx + 1) % texts.length; setTimeout(tick, PAUSE_NEXT); return; }
    setTimeout(tick, SPEED_ERASE);
  }
}

tick();