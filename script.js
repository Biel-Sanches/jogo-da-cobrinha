"use strict";

// ===== Elementos =====
const canvas = document.getElementById("jogo");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const overlayEmoji = document.getElementById("overlay-emoji");
const overlayTitulo = document.getElementById("overlay-titulo");
const overlayTexto = document.getElementById("overlay-texto");
const btnJogar = document.getElementById("btn-jogar");
const pontosEl = document.getElementById("pontos");
const recordeEl = document.getElementById("recorde");
const palco = document.getElementById("palco");

// ===== Configuração =====
const CELULAS = 21;
const TAM_CELULA = canvas.width / CELULAS;
const VELOCIDADE_INICIAL = 160; // ms entre movimentos
const VELOCIDADE_MINIMA = 75;
const ACELERACAO = 4; // ms mais rápido a cada fruta
const PONTOS_POR_FRUTA = 10;
const CHAVE_RECORDE = "snake-recorde";

const CORES = {
  tabuleiro: "#0e1629",
  casa: "#111b30",
  fruta: "#f87171",
  brilhoFruta: "rgba(248, 113, 113, 0.35)",
  cabeca: "#38bdf8",
  cauda: "#818cf8",
  olho: "#04121f",
};

// ===== Estado =====
let cobra = [];
let direcao = { x: 1, y: 0 };
let proximaDirecao = { x: 1, y: 0 };
let comida = { x: 0, y: 0 };
let pontos = 0;
let recorde = Number(localStorage.getItem(CHAVE_RECORDE)) || 0;
let velocidade = VELOCIDADE_INICIAL;
let estado = "inicio"; // inicio | jogando | pausado | fim
let timer = null;

recordeEl.textContent = recorde;

// ===== Controle do jogo =====

function resetar() {
  const meio = Math.floor(CELULAS / 2);
  cobra = [
    { x: meio, y: meio },
    { x: meio - 1, y: meio },
    { x: meio - 2, y: meio },
  ];
  direcao = { x: 1, y: 0 };
  proximaDirecao = { x: 1, y: 0 };
  pontos = 0;
  velocidade = VELOCIDADE_INICIAL;
  pontosEl.textContent = pontos;
  sortearComida();
}

function mostrarOverlay(emoji, titulo, texto, rotuloBotao) {
  overlayEmoji.textContent = emoji;
  overlayTitulo.textContent = titulo;
  overlayTexto.innerHTML = texto;
  btnJogar.textContent = rotuloBotao;
  overlay.classList.remove("oculto");
}

function comecar() {
  if (estado === "fim" || estado === "inicio") resetar();
  estado = "jogando";
  overlay.classList.add("oculto");
  agendarTick();
}

function pausar() {
  estado = "pausado";
  clearTimeout(timer);
  mostrarOverlay("⏸️", "Pausado", "Espaço ou o botão para continuar.", "Continuar");
}

function retomar() {
  estado = "jogando";
  overlay.classList.add("oculto");
  agendarTick();
}

function fimDeJogo() {
  estado = "fim";
  clearTimeout(timer);

  let texto = `Você fez <strong>${pontos} pontos</strong> com uma cobra de ${cobra.length} segmentos.`;
  if (pontos > recorde) {
    recorde = pontos;
    localStorage.setItem(CHAVE_RECORDE, recorde);
    recordeEl.textContent = recorde;
    texto += " <strong>Novo recorde! 🏆</strong>";
  }
  mostrarOverlay("💀", "Fim de jogo!", texto, "Jogar de novo");
}

function acaoPrincipal() {
  if (estado === "jogando") pausar();
  else if (estado === "pausado") retomar();
  else comecar();
}

// ===== Loop =====

function agendarTick() {
  timer = setTimeout(() => {
    tick();
    if (estado === "jogando") agendarTick();
  }, velocidade);
}

function tick() {
  direcao = proximaDirecao;
  const cabeca = { x: cobra[0].x + direcao.x, y: cobra[0].y + direcao.y };

  const bateuParede =
    cabeca.x < 0 || cabeca.x >= CELULAS || cabeca.y < 0 || cabeca.y >= CELULAS;
  const bateuEmSi = cobra.some((s) => s.x === cabeca.x && s.y === cabeca.y);
  if (bateuParede || bateuEmSi) {
    fimDeJogo();
    return;
  }

  cobra.unshift(cabeca);

  if (cabeca.x === comida.x && cabeca.y === comida.y) {
    pontos += PONTOS_POR_FRUTA;
    pontosEl.textContent = pontos;
    velocidade = Math.max(VELOCIDADE_MINIMA, velocidade - ACELERACAO);
    sortearComida();
  } else {
    cobra.pop();
  }

  desenhar();
}

function sortearComida() {
  let x, y;
  do {
    x = Math.floor(Math.random() * CELULAS);
    y = Math.floor(Math.random() * CELULAS);
  } while (cobra.some((s) => s.x === x && s.y === y));
  comida = { x, y };
}

// ===== Desenho =====

function mesclarCor(corA, corB, fracao) {
  const a = parseInt(corA.slice(1), 16);
  const b = parseInt(corB.slice( 1), 16);
  const canal = (desloc) => {
    const va = (a >> desloc) & 0xff;
    const vb = (b >> desloc) & 0xff;
    return Math.round(va + (vb - va) * fracao);
  };
  const r = canal(16);
  const g = canal(8);
  const bl = canal(0);
  return `rgb(${r}, ${g}, ${bl})`;
}

function celulaArredondada(x, y, raio) {
  const px = x * TAM_CELULA;
  const py = y * TAM_CELULA;
  const margem = 2;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(px + margem, py + margem, TAM_CELULA - margem * 2, TAM_CELULA - margem * 2, raio);
  } else {
    const w = TAM_CELULA - margem * 2;
    ctx.rect(px + margem, py + margem, w, w);
  }
}

function desenhar() {
  // fundo em xadrez
  for (let y = 0; y < CELULAS; y++) {
    for (let x = 0; x < CELULAS; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? CORES.casa : CORES.tabuleiro;
      ctx.fillRect(x * TAM_CELULA, y * TAM_CELULA, TAM_CELULA, TAM_CELULA);
    }
  }

  // fruta com brilho
  const fx = comida.x * TAM_CELULA + TAM_CELULA / 2;
  const fy = comida.y * TAM_CELULA + TAM_CELULA / 2;
  ctx.fillStyle = CORES.brilhoFruta;
  ctx.beginPath();
  ctx.arc(fx, fy, TAM_CELULA * 0.62, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = CORES.fruta;
  ctx.beginPath();
  ctx.arc(fx, fy, TAM_CELULA * 0.34, 0, Math.PI * 2);
  ctx.fill();

  // corpo (da cauda para a cabeça, para a cabeça ficar por cima)
  for (let i = cobra.length - 1; i >= 1; i--) {
    const fracao = i / Math.max(cobra.length - 1, 1);
    ctx.fillStyle = mesclarCor(CORES.cabeca, CORES.cauda, fracao);
    celulaArredondada(cobra[i].x, cobra[i].y, 6);
    ctx.fill();
  }

  // cabeça com olhos
  ctx.fillStyle = CORES.cabeca;
  celulaArredondada(cobra[0].x, cobra[0].y, 8);
  ctx.fill();

  const centroX = cobra[0].x * TAM_CELULA + TAM_CELULA / 2;
  const centroY = cobra[0].y * TAM_CELULA + TAM_CELULA / 2;
  const deslocOlho = TAM_CELULA * 0.16;
  const olhoX = centroX + direcao.x * deslocOlho;
  const olhoY = centroY + direcao.y * deslocOlho;
  const lateralX = direcao.y !== 0 ? deslocOlho : 0;
  const lateralY = direcao.x !== 0 ? deslocOlho : 0;
  ctx.fillStyle = CORES.olho;
  for (const sinal of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(olhoX + lateralX * sinal, olhoY + lateralY * sinal, TAM_CELULA * 0.09, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ===== Controles =====

const TECLAS = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
};

document.addEventListener("keydown", (evento) => {
  const tecla = evento.key.length === 1 ? evento.key.toLowerCase() : evento.key;

  if (tecla === " ") {
    evento.preventDefault();
    acaoPrincipal();
    return;
  }

  const dir = TECLAS[tecla];
  if (!dir) return;

  evento.preventDefault();
  if (estado !== "jogando") return;
  const ehOposta = dir.x === -direcao.x && dir.y === -direcao.y;
  if (!ehOposta) proximaDirecao = dir;
});

// toque: arrastar para mudar a direção
let toqueAnterior = null;

palco.addEventListener(
  "touchstart",
  (evento) => {
    toqueAnterior = { x: evento.touches[0].clientX, y: evento.touches[0].clientY };
  },
  { passive: true }
);

palco.addEventListener(
  "touchmove",
  (evento) => {
    evento.preventDefault();
    if (!toqueAnterior || estado !== "jogando") return;
    const atual = { x: evento.touches[0].clientX, y: evento.touches[0].clientY };
    const dx = atual.x - toqueAnterior.x;
    const dy = atual.y - toqueAnterior.y;
    const LIMIAR = 24;
    if (Math.abs(dx) < LIMIAR && Math.abs(dy) < LIMIAR) return;

    let dir;
    if (Math.abs(dx) > Math.abs(dy)) dir = { x: Math.sign(dx), y: 0 };
    else dir = { x: 0, y: Math.sign(dy) };

    const ehOposta = dir.x === -direcao.x && dir.y === -direcao.y;
    if (!ehOposta) proximaDirecao = dir;
    toqueAnterior = atual;
  },
  { passive: false }
);

btnJogar.addEventListener("click", () => {
  if (estado === "pausado") retomar();
  else comecar();
});

// ===== Início =====
resetar();
desenhar();
