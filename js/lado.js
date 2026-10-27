// El juego en vista de lado: escenarios, el astrónomo animado, la historia y los objetivos. Las misiones son instrumentos
// del observatorio (js/misiones.js) que se abren encima del escenario.
(() => {
  const W = 672, H = 376; // la mitad de los fondos de 1344 x 752
  const $ = s => document.querySelector(s);
  const cv = $('#mundo'), ctx = cv.getContext('2d');
  cv.width = W; cv.height = H;

  // Horizontal: se ve el escenario entero. Vertical: el escenario ocupa la parte de arriba, la cámara sigue al
  // personaje y el diálogo va abajo. Se puede jugar de las dos formas.
  const cam = { k: 1, ancho: W, x: 0, vertical: false };
  function ajustar() {
    const m = $('#marco'), vista = $('#vista');
    cam.vertical = innerHeight > innerWidth;
    m.classList.toggle('vertical', cam.vertical);
    if (cam.vertical) {
      cam.k = Math.min((innerHeight - 190) / H, innerWidth / 200);
      cam.ancho = Math.min(W, innerWidth / cam.k);
      m.style.width = `${innerWidth}px`; m.style.height = `${innerHeight}px`;
      vista.style.width = `${innerWidth}px`; vista.style.height = `${H * cam.k}px`;
    } else {
      cam.k = Math.min(innerWidth / W, innerHeight / H); cam.ancho = W;
      m.style.width = `${W * cam.k}px`; m.style.height = `${H * cam.k}px`;
      vista.style.width = `${W * cam.k}px`; vista.style.height = `${H * cam.k}px`;
    }
    cv.style.width = `${W * cam.k}px`; cv.style.height = `${H * cam.k}px`;
    m.style.left = `${cam.vertical ? 0 : Math.round((innerWidth - W * cam.k) / 2)}px`; m.style.top = `${cam.vertical ? 0 : Math.round((innerHeight - H * cam.k) / 2)}px`;
  }
  addEventListener('resize', ajustar); ajustar();
  // Al volver de horizontal a vertical el marco todavía mide lo de horizontal, y el navegador del teléfono se alejaba para que
  // cupiera (quedaba todo chico y cortado): minimum-scale=1 se lo impide. Después se reajusta hasta que el tamaño se asienta.
  const vp = document.querySelector('meta[name=viewport]');
  if (vp && !/minimum-scale/.test(vp.content)) vp.content += ', minimum-scale=1';
  function reajustar() { for (const ms of [0, 150, 400, 800, 1500]) setTimeout(ajustar, ms); }
  addEventListener('orientationchange', reajustar);
  if (window.visualViewport) visualViewport.addEventListener('resize', ajustar);
  // el alto del diálogo, para que el panel del instrumento termine justo encima de él
  if (window.ResizeObserver) new ResizeObserver(() => document.documentElement.style.setProperty('--alto-caja', `${$('#caja').offsetHeight}px`)).observe($('#caja'));
  function moverCamara(dt, x) {
    const meta = Math.max(0, Math.min(W - cam.ancho, x - cam.ancho / 2));
    cam.x += (meta - cam.x) * Math.min(1, dt * 6);
    cv.style.left = `${-Math.round(cam.x * cam.k)}px`;
  }

  // ---------- escenarios ----------
  const imagenes = {};
  const ESCENAS = {
    cerro: {
      img: 'assets/fondos/cerro.png', piso: 331, oscuro: 0.18, limites: [20, 650],
      objetos: [
        { id: 'puerta', x: 92, my: 186, tipo: 'salida', a: 'interior', llegar: 40, etiqueta: Lg('Entrar', 'Enter'), importante: true },
        { id: 'via', x: 450, my: 95, texto: [['yo', Lg('La Vía Láctea. En una galaxia como esta explotan unas pocas supernovas por siglo.', 'The Milky Way. In a galaxy like this one, only a few supernovae explode per century.')], ['yo', Lg('Para medir cuántas, hay que mirar muchas galaxias por mucho tiempo.', 'To measure how many, you have to watch many galaxies for a long time.')]] },
        { id: 'cupulas', x: 222, my: 150, tipo: 'salida', a: 'comite', llegar: 70, etiqueta: Lg('Sala del comité', 'Committee room'), desde: 5 }, // aparece en el cap. 5, con el árbitro
        { id: 'volcan', x: 490, my: 182, texto: [['yo', Lg('El aire aquí es seco y quieto. Por eso los observatorios se construyen en el desierto.', 'The air here is dry and still. That is why observatories are built in the desert.')]] },
      ],
    },
    interior: {
      img: 'assets/fondos/interior.png', piso: 302, oscuro: 0.3, limites: [14, 600],
      objetos: [
        { id: 'afuera', x: 22, my: 250, tipo: 'salida', a: 'cerro', llegar: 120, etiqueta: Lg('< Afuera', '< Outside') },
        { id: 'cartas', x: 37, my: 168, texto: [['yo', Lg('Cartas del cielo, con las constelaciones del sur.', 'Sky charts, with the southern constellations.')]] },
        { id: 'ventana', x: 142, my: 150, texto: [['yo', Lg('Una noche despejada. Ninguna nube: buena noche para observar.', 'A clear night. Not a single cloud: a good night for observing.')]] },
        { id: 'directora', x: 232, tipo: 'npc', npc: 'directora', importante: true },
        { id: 'consolas', x: 332, my: 196, importante: true, nombre: Lg('Las consolas', 'The consoles'), texto: [['yo', Lg('Las consolas del survey. Aquí se decide cuánto exponer y cada cuánto volver al mismo pedazo de cielo.', 'The survey consoles. Here you decide how long to expose and how often to come back to the same patch of sky.')]] },
        { id: 'operador', x: 418, tipo: 'npc', npc: 'operador', importante: true },
        { id: 'biblioteca', x: 511, my: 160, importante: true, nombre: Lg('La biblioteca', 'The library'), texto: [['yo', Lg('La biblioteca. Aquí guardo mi cuaderno: cada término de la ecuación de la tasa que entiendo queda escrito, con su ecuación de la tesis.', 'The library. I keep my notebook here: every term of the rate equation that I understand gets written down, with its equation from the thesis.')], ['yo', Lg('Lo importante se anota solo. También lo abro con el botón Cuaderno de arriba.', 'The important things get noted down on their own. I can also open it with the Notebook button at the top.')]] },
        { id: 'escalera', x: 612, my: 150, tipo: 'salida', a: 'cupula', llegar: 70, etiqueta: Lg('▲ Cúpula', '▲ Dome') },
      ],
    },
    comite: {
      img: 'assets/fondos/comite.png', piso: 314, oscuro: 0.22, limites: [24, 470],
      objetos: [
        { id: 'salir', x: 22, my: 250, tipo: 'salida', a: 'cerro', llegar: 222, etiqueta: Lg('< Al cerro', '< To the hill') },
        { id: 'atril', x: 128, my: 238, importante: true, nombre: Lg('El atril', 'The lectern'), texto: [['yo', Lg('El atril de la sala del comité. Aquí se defienden los resultados.', 'The lectern of the committee room. This is where results are defended.')]] },
        { id: 'pizarra', x: 322, my: 165, texto: [['yo', Lg('La pizarra está llena de ecuaciones de tasas. Alguien dibujó una curva de luz con su límite.', 'The blackboard is full of rate equations. Someone drew a light curve with its limit.')]] },
        { id: 'examinadora1', x: 470, tipo: 'npc', npc: 'examinadora1', importante: true },
        { id: 'examinador2', x: 520, tipo: 'npc', npc: 'examinador2', importante: true },
        { id: 'examinador3', x: 570, tipo: 'npc', npc: 'examinador3', importante: true },
      ],
    },
    cupula: {
      img: 'assets/fondos/cupula.png', piso: 308, oscuro: 0.32, limites: [30, 640],
      objetos: [
        { id: 'bajar', x: 55, my: 190, tipo: 'salida', a: 'interior', llegar: 585, etiqueta: Lg('▼ Bajar', '▼ Down') },
        { id: 'panel', x: 115, my: 228, texto: [['yo', Lg('El panel de la cúpula. Gira la cúpula y abre la ranura.', 'The dome panel. It turns the dome and opens the slit.')]] },
        { id: 'telescopio', x: 300, my: 120, pie: 340, importante: true, nombre: Lg('El telescopio', 'The telescope'), texto: [['yo', Lg('El telescopio. Ahora no tengo nada que mirar con él.', 'The telescope. Right now I have nothing to look at with it.')]] },
        { id: 'cielo', x: 440, my: 95, nombre: Lg('El cielo', 'The sky'), texto: [['yo', Lg('Por la ranura se ve la Vía Láctea. Esta noche, el telescopio mira hacia allá.', 'Through the slit you can see the Milky Way. Tonight the telescope points that way.')]] },
      ],
    },
  };
  let escena = 'cerro';
  const vistos = new Set();

  // ---------- personajes ----------
  const LOOKS = {
    yo: { abrigo: '#2b2440', luz: '#4a3e6a', sombra: '#1a1528', pant: '#1c1a26', bota: '#3a2414', piel: '#d9a07a', pelo: '#2a1a10', sombrero: '#1f1a2e', banda: '#8a5a32', bufanda: '#b8452f', linterna: true, nombre: Lg('Tú', 'You') },
    directora: { abrigo: '#6a4a24', luz: '#9a7034', sombra: '#4a3218', pant: '#2a2018', bota: '#2a1a10', piel: '#c98a5e', pelo: '#c9c9d4', moño: true, bufanda: null, nombre: Lg('Directora Inés', 'Director Inés') },
    operador: { abrigo: '#4a3a6a', luz: '#6a5a9a', sombra: '#2e2448', pant: '#22263a', bota: '#1a1a22', piel: '#f0c9a0', pelo: '#15151f', audifonos: true, bufanda: null, nombre: Lg('Leo, el operador', 'Leo, the operator') },
    // el comité (personajes inventados, caps. 5 y 7): tiempo de control, clasificación y SFH
    examinadora1: { abrigo: '#6a1a24', luz: '#8a2a34', sombra: '#4a1018', pant: '#1a1418', bota: '#3a2414', piel: '#6a4030', pelo: '#b8b8c0', nombre: Lg('Dra. Ríos', 'Dr Ríos') },
    examinador2: { abrigo: '#2a4a2a', luz: '#3a6a3a', sombra: '#1a301a', pant: '#4a4a52', bota: '#3a2414', piel: '#c99a7a', pelo: '#15151f', nombre: Lg('Dr. Ferrer', 'Dr Ferrer') },
    examinador3: { abrigo: '#6a4a2a', luz: '#8a6a3a', sombra: '#4a3018', pant: '#3a3a40', bota: '#3a2414', piel: '#e0b090', pelo: '#e8e8ee', nombre: Lg('Dr. Albornoz', 'Dr Albornoz') },
  };
  const NPCS = {
    directora: { x: 232, mira: -1, look: LOOKS.directora, sprite: 'directora', escena: 'interior' },
    operador: { x: 418, mira: -1, look: LOOKS.operador, sprite: 'leo', escena: 'interior' },
    examinadora1: { x: 470, mira: -1, look: LOOKS.examinadora1, sprite: 'examinadora1', escena: 'comite' },
    examinador2: { x: 520, mira: -1, look: LOOKS.examinador2, sprite: 'examinador2', escena: 'comite' },
    examinador3: { x: 570, mira: -1, look: LOOKS.examinador3, sprite: 'examinador3', escena: 'comite' },
  };
  // Sprites generados (miran a la izquierda); meta.js trae su tamaño y el centro de los pies.
  const SPR = {};
  const PROTAS = [['yo_astronomo', 'Astrónomo']];
  for (const k of ['directora', 'leo', 'examinadora1', 'examinador2', 'examinador3', ...PROTAS.map(p => p[0])]) { SPR[k] = new Image(); SPR[k].src = `assets/sprites/${k}.png`; }
  const prota = 0; // Mauricio eligió al astrónomo (2026-10-26)
  // Tu personaje: animaciones dibujadas cuadro a cuadro, sacadas de videos (tools/procesar_animaciones.py).
  // Una máquina de estados las encadena: quieto, arranca, camina, frena y gira. Cada cuadro trae el avance
  // real del video, así los pies nunca patinan. Al cambiar de animación, la pose anterior se desvanece en
  // unos pocos cuadros para que no salte.
  const ATLAS = new Image(); ATLAS.src = 'assets/sprites/astronomo_atlas.png';
  // cuadros por segundo de cada animación: la caminata va un poco más rápida que el video (24 cuadros/s) y el avance
  // por cuadro es el del video, así que la velocidad sube sin que los pies patinen. Arranca, camina y frena son
  // del mismo paso: van al mismo ritmo. Los dos pasos cortos son más lentos en el video: van más rápido.
  const FPS_ANIM = { quieto: 24, arranca: 40, camina: 40, frena: 40, gira: 50, paso: 50 };
  const FPS_APURADO = { arranca: 50, camina: 50, frena: 65, gira: 70 }; // al devolverse: apura el paso, frena y se da vuelta más rápido
  const ani = { nombre: 'quieto', i: 0, t: 0, prev: null, mezcla: 1, pasoMezcla: 0 };
  const largoAnim = n => window.ANIM[n].celdas.length;
  const avanceAnim = n => window.ANIM[n].dx.reduce((a, b) => a + b, 0);
  function poner(nombre, i = 0, cuadrosMezcla = 0) {
    if (cuadrosMezcla) {
      ani.prev = { nombre: ani.nombre, i: Math.min(ani.i, largoAnim(ani.nombre) - 1), mira: yo.mira };
      ani.mezcla = 0; ani.pasoMezcla = 1 / cuadrosMezcla;
    }
    ani.nombre = nombre; ani.i = i;
  }
  function llegar() {
    yo.meta = null; yo.apurado = false;
    const f = yo.alLlegar; yo.alLlegar = null;
    if (f) f();
  }
  // Desde quieto y mirando al destino: no moverse, dar dos pasos cortos o arrancar a caminar, lo que deje más cerca.
  // Devuelve si se movió.
  function partir(R, mezcla) {
    const paso = avanceAnim('paso'), corto = avanceAnim('arranca') + avanceAnim('frena');
    if (Math.abs(R) < paso / 2) return false;
    yo.apurado = false;
    poner(Math.abs(R) < (paso + corto) / 2 ? 'paso' : 'arranca', 0, mezcla);
    return true;
  }
  // Pedir ir a un punto. Si va caminando hacia el otro lado, termina el paso, frena, se da vuelta y vuelve a partir
  // (darse vuelta a media zancada se veía como un salto).
  function pedirIr(destino, alLlegar) {
    yo.alLlegar = alLlegar;
    yo.meta = destino;
    const R = destino - yo.x;
    if (ani.nombre === 'quieto') {
      yo.otraVez = false;
      if (Math.abs(R) >= 12 && Math.sign(R) !== yo.mira) return poner('gira', 0, 3);
      return partir(R, 4) || llegar();
    }
    // la vuelta decide al terminar; caminando hacia adelante, el destino nuevo se usa al cerrar cada ciclo;
    // si queda atrás, o si ya va frenando, se vuelve a decidir al quedar quieto
    if (ani.nombre === 'gira') return;
    const atras = Math.sign(R) !== yo.mira;
    // recién partiendo todavía está de pie (los primeros cuadros calzan con la vuelta): se da vuelta altiro
    if (atras && ani.i < { arranca: 8, paso: 7 }[ani.nombre]) return poner('gira', 0, 3);
    if (atras) yo.apurado = true;
    if (atras || ani.nombre === 'frena' || ani.nombre === 'paso') yo.otraVez = true;
  }
  function finAnimacion() {
    const nombre = ani.nombre;
    if (nombre === 'quieto') { ani.i = 0; return; }
    const sigue = window.ANIM[nombre].sigue;
    if (nombre === 'arranca') {
      // trayecto corto: frena sin dar un ciclo si así queda más cerca del destino
      const R = yo.meta === null ? 0 : (yo.meta - yo.x) * yo.mira;
      if (R - avanceAnim('frena') <= avanceAnim('camina') / 2) return poner(...window.ANIM.arranca.corta, 2);
      return poner(sigue[0], sigue[1]);
    }
    if (nombre === 'camina') {
      // se frena al terminar el ciclo si así queda más cerca del destino que dando otro ciclo;
      // si sigue caminando, el cierre del ciclo se suaviza en 3 cuadros
      const R = yo.meta === null ? 0 : (yo.meta - yo.x) * yo.mira;
      if (R - avanceAnim('frena') <= avanceAnim('camina') / 2) poner('frena', 0); else poner('camina', 0, 3);
      return;
    }
    if (nombre === 'frena' || nombre === 'paso') {
      poner(sigue[0], sigue[1], 3);
      return yo.otraVez ? pedirIr(yo.meta, yo.alLlegar) : llegar();
    }
    if (nombre === 'gira') {
      poner(sigue[0], sigue[1], 2);
      yo.mira = -yo.mira;
      pedirIr(yo.meta ?? yo.x, yo.alLlegar); // ya dado vuelta: parte, da los pasos o llega
    }
  }
  function animar(dt) {
    if (!window.ANIM) return;
    ani.t += dt * ((yo.apurado && FPS_APURADO[ani.nombre]) || FPS_ANIM[ani.nombre]);
    while (ani.t >= 1) {
      ani.t -= 1;
      const A = window.ANIM[ani.nombre];
      yo.x += (A.dx[ani.i] || 0) * yo.mira;
      if (ani.prev) {
        ani.mezcla += ani.pasoMezcla;
        if (ani.mezcla >= 1) ani.prev = null; else ani.prev.i = Math.min(ani.prev.i + 1, largoAnim(ani.prev.nombre) - 1);
      }
      ani.i++;
      if (A.pasos.includes(ani.i)) Sonido.paso();
      if (ani.i >= A.celdas.length) finAnimacion();
    }
  }
  function dibujarAnim(x, y) {
    const M = window.ANIM;
    if (!M || !ATLAS.complete || !ATLAS.naturalWidth) return null;
    const c = M._celda;
    // la segunda mitad de la vuelta son cuadros dados vuelta (espejo): se invierte el sentido de esos cuadros
    const sentido = (nombre, i, mira) => ((mira < 0) !== !!(M[nombre].espejo || [])[Math.min(i, M[nombre].celdas.length - 1)]) ? -1 : 1;
    const cuadro = (nombre, i, mira, alfa) => {
      const k = M[nombre].celdas[Math.min(i, M[nombre].celdas.length - 1)];
      ctx.save(); ctx.globalAlpha = alfa; ctx.translate(Math.round(x), Math.round(y)); if (sentido(nombre, i, mira) < 0) ctx.scale(-1, 1);
      ctx.drawImage(ATLAS, (k % c.cols) * c.w, Math.floor(k / c.cols) * c.h, c.w, c.h, -c.torsoX, -c.pieY, c.w, c.h);
      ctx.restore();
    };
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(x, y, 14, 3, 0, 0, 7); ctx.fill();
    if (ani.prev) cuadro(ani.prev.nombre, ani.prev.i, ani.prev.mira, 1 - ani.mezcla);
    cuadro(ani.nombre, ani.i, yo.mira, 1);
    const A = M[ani.nombre], n = A.llama.length;
    let ll = null;
    for (let k = 0; k < n && !ll; k++) ll = A.llama[(Math.min(ani.i, n - 1) - k + n) % n];
    return ll ? [x + (ll[0] - c.torsoX) * sentido(ani.nombre, ani.i, yo.mira), y - c.pieY + ll[1]] : [x, y - 40];
  }
  function dibujarSprite(nombre, x, y, mira, t) {
    const img = SPR[nombre], m = (window.SPRITES || {})[nombre];
    if (!img || !img.complete || !m) return false;
    const respira = Math.sin(t * 2.2) > 0.6 ? 1 : 0; // un píxel más alto al inspirar
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(x, y, 11, 3, 0, 0, 7); ctx.fill();
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); if (mira > 0) ctx.scale(-1, 1);
    ctx.drawImage(img, -Math.round(m.pie), -m.h - respira, m.w, m.h + respira);
    ctx.restore();
    return true;
  }

  // Dibuja de perfil, mirando a la derecha, con los pies en (0, 0). f es la fase del paso, c cuánto camina (0 a 1).
  function cuerpo(g, L, f, c, t) {
    const linea = (pts, color, ancho) => { g.strokeStyle = color; g.lineWidth = ancho; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach(([x, y], k) => k ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); };
    const rect = (x, y, w, h, color) => { g.fillStyle = color; g.fillRect(x, y, w, h); };
    const respira = 0.6 * Math.sin(t * 2.2) * (1 - c);
    const cadera = -30 - 2 * (1 - Math.abs(Math.sin(f))) * c + respira * 0.3;
    const pierna = fase => {
      const th = 0.5 * Math.sin(fase) * c, tk = 0.9 * Math.max(0, Math.cos(fase)) * c;
      const rod = [Math.sin(th) * 15, cadera + Math.cos(th) * 15];
      const pie = [rod[0] + Math.sin(th - tk) * 15, rod[1] + Math.cos(th - tk) * 15];
      return { rod, pie: [pie[0], Math.min(0, pie[1])] };
    };
    const brazo = (ang, color) => linea([[0, cadera - 23], [Math.sin(ang) * 11, cadera - 23 + Math.cos(ang) * 11], [Math.sin(ang * 1.4) * 20, cadera - 23 + Math.cos(ang * 1.4) * 20]], color, 4);
    // pierna y brazo de atrás, más oscuros
    const pa = pierna(f + Math.PI);
    linea([[0, cadera], pa.rod, pa.pie], L.sombra === '#1a1528' ? '#121018' : L.pant, 5); rect(pa.pie[0] - 2, pa.pie[1] - 3, 8, 3, '#1a120c');
    brazo(-0.45 * Math.sin(f) * c - 0.05, L.sombra);
    // bufanda que flamea hacia atrás
    if (L.bufanda) {
      const pts = [[-1, cadera - 25]];
      for (let k = 1; k <= 6; k++) pts.push([-1 - k * 3 * (0.55 + 0.45 * c), cadera - 25 + k * 0.9 + Math.sin(t * 7 + k) * (0.4 + 1.6 * c)]);
      linea(pts, L.bufanda, 3);
    }
    // abrigo: se abre hacia atrás al caminar
    const vuelo = 3 * c * (0.6 + 0.4 * Math.sin(2 * f));
    g.fillStyle = L.abrigo; g.beginPath();
    g.moveTo(-6, cadera - 25); g.lineTo(6, cadera - 25); g.lineTo(8, cadera - 2); g.lineTo(9 + c, -13); g.lineTo(-11 - vuelo, -12); g.lineTo(-8, cadera - 2); g.closePath(); g.fill();
    g.fillStyle = L.luz; g.fillRect(4, cadera - 24, 2, 34);
    g.fillStyle = L.sombra; g.beginPath(); g.moveTo(-6, cadera - 24); g.lineTo(-3, cadera - 24); g.lineTo(-6, -12); g.lineTo(-11 - vuelo, -12); g.closePath(); g.fill();
    rect(-7, cadera - 2, 15, 2, '#120c0a');
    // pierna de adelante
    const pd = pierna(f);
    linea([[0, cadera + 4], pd.rod, pd.pie], L.pant, 5); rect(pd.pie[0] - 2, pd.pie[1] - 3, 8, 3, L.bota);
    // cabeza
    const cy = cadera - 33 + respira * 0.4;
    g.fillStyle = L.piel; g.beginPath(); g.arc(2, cy, 6, 0, 7); g.fill();
    rect(7, cy + 1, 2, 1, '#a86a4a'); rect(5, cy - 1, 1, 1, '#120c0a');
    g.fillStyle = L.pelo; g.beginPath(); g.arc(0, cy - 1, 6, Math.PI * 0.75, Math.PI * 1.85); g.fill();
    if (L.moño) { g.beginPath(); g.arc(-5, cy - 6, 3.2, 0, 7); g.fill(); }
    if (L.sombrero) { rect(-8, cy - 6, 19, 2, L.sombrero); rect(-4, cy - 13, 11, 7, L.sombrero); rect(-4, cy - 8, 11, 2, L.banda); }
    if (L.audifonos) { g.strokeStyle = '#2a2a3a'; g.lineWidth = 2; g.beginPath(); g.arc(1, cy - 1, 7, Math.PI, 2 * Math.PI); g.stroke(); rect(-1, cy - 2, 3, 5, '#2a2a3a'); rect(2, cy + 4, 5, 1, '#2a2a3a'); }
    // brazo de adelante con la linterna que se balancea
    if (L.linterna) {
      const ab = 0.25 + 0.12 * Math.sin(f) * c;
      const mano = [Math.sin(ab) * 9 + 6, cadera - 23 + 15];
      linea([[1, cadera - 23], [Math.sin(ab) * 9, cadera - 23 + Math.cos(ab) * 9], mano], L.luz, 4);
      const psi = 0.4 * Math.sin(f - 0.9) * c + 0.06 * Math.sin(t * 1.7);
      const lx = mano[0] + Math.sin(psi) * 8, ly = mano[1] + Math.cos(psi) * 8;
      linea([mano, [lx, ly - 3]], '#8a7a5a', 1);
      rect(lx - 3, ly - 3, 6, 8, '#b8944a'); rect(lx - 2, ly - 2, 4, 5, '#ffe8a8'); rect(lx - 3, ly + 5, 6, 1, '#6a5430');
      return [lx, ly];
    }
    brazo(0.4 * Math.sin(f) * c + 0.1, L.abrigo);
    return null;
  }

  const hoja = document.createElement('canvas'); hoja.width = 80; hoja.height = 100;
  const silu = document.createElement('canvas'); silu.width = 80; silu.height = 100;
  function personaje(x, y, L, mira, f, c, t) {
    const h = hoja.getContext('2d'), s = silu.getContext('2d');
    h.clearRect(0, 0, 80, 100);
    h.save(); h.translate(40, 92); if (mira < 0) h.scale(-1, 1);
    const lin = cuerpo(h, L, f, c, t); h.restore();
    s.clearRect(0, 0, 80, 100); s.globalCompositeOperation = 'source-over'; s.drawImage(hoja, 0, 0);
    s.globalCompositeOperation = 'source-in'; s.fillStyle = '#07060c'; s.fillRect(0, 0, 80, 100);
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(x, y, 13, 3, 0, 0, 7); ctx.fill();
    const ox = Math.round(x - 40), oy = Math.round(y - 92);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) ctx.drawImage(silu, ox + dx, oy + dy);
    ctx.drawImage(hoja, ox, oy);
    return lin ? [x + lin[0] * mira, y + lin[1]] : null;
  }

  // ---------- sonido: música con eco y pasos ----------
  const Sonido = (() => {
    let ac = null, salida, rev, eco, on = true, sig = 0, paso = 0;
    try { on = localStorage.getItem('juego-tasas-musica') !== 'no'; } catch (e) { /* nada */ }
    const hz = m => 440 * 2 ** ((m - 69) / 12), NEGRA = 60 / 70, CORCHEA = NEGRA / 2, COMPAS = NEGRA * 4;
    const ACORDES = [[57, 60, 64, 67], [53, 57, 60, 64], [50, 53, 57, 60], [52, 56, 59, 64]];
    const BAJOS = [45, 41, 38, 40];
    const MELODIA = [76, 0, 0, 74, 72, 0, 71, 0, 72, 0, 0, 0, 69, 0, 0, 0, 74, 0, 0, 72, 69, 0, 65, 0, 68, 0, 0, 0, 0, 0, 0, 0];
    function iniciar() {
      if (ac) return;
      ac = new (window.AudioContext || window.webkitAudioContext)();
      salida = ac.createGain(); salida.gain.value = 0.8; salida.connect(ac.destination);
      rev = ac.createConvolver();
      const n = ac.sampleRate * 3, imp = ac.createBuffer(2, n, ac.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const d = imp.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 2.5; }
      rev.buffer = imp; const gr = ac.createGain(); gr.gain.value = 0.6; rev.connect(gr).connect(salida);
      eco = ac.createDelay(2); eco.delayTime.value = CORCHEA * 3;
      const fb = ac.createGain(); fb.gain.value = 0.4; const ge = ac.createGain(); ge.gain.value = 0.3;
      eco.connect(fb).connect(eco); eco.connect(ge).connect(salida);
      setInterval(programar, 25);
    }
    function voz(m, t, dur, { tipo = 'triangle', vol = 0.05, ataque = 0.01, corte = 0, detune = 0, vibrato = 0, aEco = false, aRev = 0.3 }) {
      const o = ac.createOscillator(), env = ac.createGain();
      o.type = tipo; o.frequency.value = hz(m); o.detune.value = detune;
      if (vibrato) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 5; lg.gain.value = vibrato; l.connect(lg).connect(o.detune); l.start(t); l.stop(t + dur + 0.3); }
      let nodo = o;
      if (corte) { const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = corte; o.connect(fl); nodo = fl; }
      env.gain.setValueAtTime(0.0001, t); env.gain.linearRampToValueAtTime(vol, t + ataque);
      env.gain.setValueAtTime(vol, t + Math.max(ataque, dur - 0.2)); env.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.4);
      nodo.connect(env); env.connect(salida);
      const sr = ac.createGain(); sr.gain.value = aRev; env.connect(sr).connect(rev);
      if (aEco) env.connect(eco);
      o.start(t); o.stop(t + dur + 0.5);
    }
    function programar() {
      if (!on) { sig = ac.currentTime + 0.05; return; }
      while (sig < ac.currentTime + 0.15) {
        const k = Math.floor(paso / 8) % 4;
        if (paso % 8 === 0) for (const m of ACORDES[k]) for (const d of [-8, 8]) voz(m, sig, COMPAS, { tipo: 'sawtooth', vol: 0.012, ataque: 0.6, corte: 900, detune: d, aRev: 0.7 });
        if (paso % 8 === 0) voz(BAJOS[k], sig, COMPAS * 0.9, { tipo: 'triangle', vol: 0.14, ataque: 0.05, aRev: 0.2 });
        const mel = MELODIA[paso % 32];
        if (mel) { let d = 1; while (!MELODIA[(paso + d) % 32] && d < 6) d++; voz(mel, sig, CORCHEA * d, { tipo: 'triangle', vol: 0.07, ataque: 0.03, vibrato: 10, aEco: true, aRev: 0.5 }); }
        sig += CORCHEA; paso++;
      }
    }
    function ruido(dur, vol, fc) {
      if (!ac) return;
      const n = Math.floor(ac.sampleRate * dur), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 2;
      const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
      s.buffer = b; fl.type = 'lowpass'; fl.frequency.value = fc; g.gain.value = vol;
      s.connect(fl).connect(g).connect(salida); s.start();
    }
    return {
      iniciar, get on() { return on; },
      alternar() { on = !on; try { localStorage.setItem('juego-tasas-musica', on ? 'si' : 'no'); } catch (e) { /* nada */ } return on; },
      paso: () => ruido(0.06, 0.18, 700),
      explosion: () => { ruido(0.9, 0.45, 2500); if (ac) voz(40, ac.currentTime, 0.5, { tipo: 'sine', vol: 0.25, aRev: 0.4 }); },
      blip: () => { if (ac) voz(84, ac.currentTime, 0.03, { tipo: 'square', vol: 0.015, aRev: 0.1 }); },
      fanfarria: () => { if (ac) [72, 76, 79, 84, 79, 84].forEach((m, k) => voz(m, ac.currentTime + k * 0.11, k === 5 ? 0.6 : 0.12, { tipo: 'square', vol: 0.04, aRev: 0.4 })); },
      campana: () => { if (ac) [79, 84].forEach((m, k) => voz(m, ac.currentTime + k * 0.09, 0.4, { tipo: 'sine', vol: 0.06, aRev: 0.6 })); },
      letra: () => { if (ac) voz(88, ac.currentTime, 0.02, { tipo: 'square', vol: 0.008, aRev: 0 }); },
    };
  })();

  // ---------- diálogo arriba de la pantalla ----------
  const caja = $('#caja'), retrato = $('#retrato').getContext('2d');
  let dialogo = null;
  function decir(lineas, fin) {
    dialogo = { lineas, i: 0, n: 0, fin }; caja.style.display = 'flex'; $('#contador').style.visibility = 'hidden';
    document.body.classList.add('con-dialogo'); linea();
  }
  function linea() {
    const quien = dialogo.lineas[dialogo.i][0], L = LOOKS[quien];
    caja.querySelector('.quien').textContent = L.nombre;
    retrato.setTransform(1, 0, 0, 1, 0, 0); retrato.clearRect(0, 0, 56, 56); retrato.fillStyle = '#120c0a'; retrato.fillRect(0, 0, 56, 56);
    const nom = ({ directora: 'directora', operador: 'leo', yo: PROTAS[prota][0] })[quien] || quien, img = SPR[nom], m = (window.SPRITES || {})[nom];
    if (img && img.complete && m) { retrato.imageSmoothingEnabled = false; const lado = m.h * 0.3; retrato.drawImage(img, m.pie - lado * 0.45, 0, lado, lado, 2, 2, 52, 52); }
    else { retrato.save(); retrato.translate(23, 192); retrato.scale(2.6, 2.6); cuerpo(retrato, L, 0, 0, 0); retrato.restore(); }
    dialogo.n = 0;
  }
  function callar() { // cierra el diálogo sin seguir su historia (al salir de un instrumento a medias)
    if (!dialogo) return;
    dialogo = null; caja.style.display = 'none'; $('#contador').style.visibility = 'visible'; document.body.classList.remove('con-dialogo');
  }
  function avanzar() {
    const txt = dialogo.lineas[dialogo.i][1];
    if (dialogo.n < txt.length) { dialogo.n = txt.length; return; }
    if (++dialogo.i < dialogo.lineas.length) return linea();
    caja.style.display = 'none'; $('#contador').style.visibility = 'visible'; document.body.classList.remove('con-dialogo');
    const fin = dialogo.fin; dialogo = null; if (fin) fin();
  }

  // ---------- el jugador ----------
  const yo = { x: 300, meta: null, mira: 1, alLlegar: null, otraVez: false, apurado: false };
  // ---------- historia: la misión en curso decide qué toca ahora ----------
  const M = Misiones;
  M.api.hablar = (lineas, fin) => decir(lineas, fin);
  M.api.sonido = Sonido;
  const contratada = m => !!M.E.contratos[m.id];
  // A dónde ir ahora: la directora da la misión; después, su instrumento.
  // Dónde se juega cada misión: escena y objeto, y cómo se dice en el objetivo.
  const DONDE = {
    telescopio: ['cupula', 'telescopio', Lg('Usa el telescopio', 'Use the telescope')], consolas: ['interior', 'consolas', Lg('Ve a las consolas', 'Go to the consoles')],
    biblioteca: ['interior', 'biblioteca', Lg('Ve a la biblioteca', 'Go to the library')], cielo: ['cupula', 'cielo', Lg('Mira el cielo desde la cúpula', 'Look at the sky from the dome')],
    atril: ['comite', 'atril', Lg('Ve al atril de la sala del comité', 'Go to the lectern in the committee room')],
  };
  function objetivo() {
    const m = M.actual();
    if (!m || !contratada(m)) return { escena: 'interior', id: 'directora', texto: m ? Lg(`Habla con la directora (misión ${m.id})`, `Talk to the director (mission ${m.id})`) : Lg('Habla con la directora', 'Talk to the director') };
    const [esc, id, txt] = DONDE[m.donde];
    return { escena: esc, id, texto: `${txt} (${Lg('misión', 'mission')} ${m.id})` };
  }
  // Desde otra escena, el objetivo es la salida que acerca a él.
  const CAMINO = {
    cerro: { interior: 'puerta', cupula: 'puerta', comite: 'cupulas' }, interior: { cupula: 'escalera', cerro: 'afuera', comite: 'afuera' },
    cupula: { interior: 'bajar', cerro: 'bajar', comite: 'bajar' }, comite: { cerro: 'salir', interior: 'salir', cupula: 'salir' },
  };
  function esObjetivo(o) {
    const ob = objetivo();
    return ob.escena === escena ? o.id === ob.id : (CAMINO[escena] || {})[ob.escena] === o.id;
  }
  const lineasNPC = {
    directora: () => {
      const m = M.actual();
      if (!m) return [['directora', Lg('Lo terminaste todo: la tasa, su tiempo de control, la población, SUDARE, la clasificación, los errores y de dónde vienen las supernovas.', 'You finished it all: the rate, its control time, the population, SUDARE, the classification, the errors and where supernovae come from.')],
        ['directora', Lg('Tu cuaderno tiene el cálculo completo de la tesis. Puedes volver a la sala del comité cuando quieras a repasar la defensa.', 'Your notebook has the full calculation of the thesis. You can go back to the committee room whenever you like to go over the defence.')]];
      if (!contratada(m)) return m.contrato;
      const ayuda = { telescopio: Lg('El telescopio está arriba, en la cúpula. Sube por la escalera.', 'The telescope is upstairs, in the dome. Take the stairs.'), consolas: Lg('Las consolas están aquí, al lado de Leo.', 'The consoles are here, next to Leo.'),
        biblioteca: Lg('La biblioteca está aquí, a la derecha de Leo.', 'The library is here, to the right of Leo.'), cielo: Lg('Sube a la cúpula y mira el cielo por la ranura.', 'Go up to the dome and look at the sky through the slit.'),
        atril: Lg('La sala del comité está afuera, en el otro edificio del cerro.', 'The committee room is outside, in the other building on the hill.') };
      return [['directora', ayuda[m.donde]]];
    },
    operador: () => {
      const m = M.actual();
      if (m && contratada(m) && m.leo) return m.leo;
      if (m && contratada(m)) return [['operador', m.donde === 'consolas' ? Lg('Las consolas están listas. Tócalas cuando quieras.', 'The consoles are ready. Use them whenever you like.') : Lg('Yo te hablo por radio desde aquí.', 'I will talk to you over the radio from here.')]];
      return [
        ['operador', Lg('Hola. Yo manejo el telescopio y las cámaras.', 'Hi. I run the telescope and the cameras.')],
        ['operador', Lg('El telescopio no ve todo lo que explota: solo lo que es más brillante que su límite, y solo las noches que miramos.', 'The telescope does not see everything that explodes: only what is brighter than its limit, and only on the nights we observe.')],
        ['operador', Lg('De eso se trata el tiempo de control. Ya lo vas a ver.', 'That is what the control time is about. You will see.')],
      ];
    },
  };
  for (const k of ['examinadora1', 'examinador2', 'examinador3']) lineasNPC[k] = () => {
    const m = M.actual();
    return (m && m[k]) || [[k, ({ examinadora1: Lg('Yo pregunto por el tiempo de control: cómo saben cuántas no vieron.', 'I ask about the control time: how do you know how many you did not see?'),
      examinador2: Lg('Yo pregunto por la clasificación: cómo saben qué tipo es cada una sin espectro.', 'I ask about the classification: how do you know the type of each one without a spectrum?'),
      examinador3: Lg('Yo pregunto por la historia de formación estelar: qué nos dicen sus tasas sobre las estrellas.', 'I ask about the star-formation history: what do your rates tell us about the stars?') })[k]]];
  };
  function usar(o) {
    if (o.tipo === 'salida') return cambiar(o.a, o.llegar);
    vistos.add(`${escena}:${o.id}`); actualizarContador();
    Sonido.campana();
    const m = M.actual();
    if (o.tipo === 'npc') {
      NPCS[o.npc].mira = Math.sign(yo.x - NPCS[o.npc].x) || -1;
      const daContrato = o.npc === 'directora' && m && !contratada(m);
      return decir(lineasNPC[o.npc](), daContrato ? () => { M.E.contratos[m.id] = true; M.guardar(); } : null);
    }
    if (m && m.donde === o.id) {
      if (!contratada(m)) { const nom = o.nombre || Lg('Esto', 'This'); return decir([['yo', Lg(`${nom}. Primero debería hablar con la directora.`, `${nom}. I should talk to the director first.`)]]); }
      return M.jugar(m, () => actualizarContador());
    }
    if (o.id === 'biblioteca') return decir(o.texto, () => M.cuaderno());
    decir(o.texto);
  }
  function cambiar(dest, x) {
    $('#negro').style.opacity = 1;
    setTimeout(() => { escena = dest; yo.x = x; yo.meta = null; const [l0, l1] = ESCENAS[dest].limites; yo.mira = x < (l0 + l1) / 2 ? 1 : -1; ani.prev = null; /* entra mirando hacia adentro de la sala, no hacia la puerta */ cam.x = Math.max(0, Math.min(W - cam.ancho, x - cam.ancho / 2)); actualizarContador(); $('#negro').style.opacity = 0; }, 380);
  }
  function actualizarContador() {
    const objs = visibles(ESCENAS[escena]).filter(o => o.tipo !== 'salida');
    const faltan = objs.filter(o => !vistos.has(`${escena}:${o.id}`)).length;
    $('#contador').innerHTML = (faltan ? Lg(`Por ver aquí: <b>${faltan}</b> de ${objs.length}`, `To see here: <b>${faltan}</b> of ${objs.length}`) : Lg('Todo visto aquí ✓', 'All seen here ✓')) + `<span class="meta">▶ ${objetivo().texto}</span>`;
    $('#ciencia').textContent = `${Lg('Ciencia', 'Science')} ${M.E.ciencia}`;
  }
  M.avisos.push(actualizarContador);


  // ---------- pantalla de inicio ----------
  // Continuar (si hay progreso), comenzar o empezar de nuevo, y el cuaderno. Una partida nueva parte con el
  // astrónomo llegando a pie al cerro; mientras llega no se puede tocar nada.
  let empezado = false, llegando = false;
  const cieloTitulo = Vista.Titulo($('#cieloTitulo'));
  function menuTitulo() {
    const m = M.actual(), hay = M.hayProgreso();
    $('#continuar').hidden = !hay;
    $('#tituloCuaderno').hidden = !M.E.desbloqueados.length;
    $('#nueva').textContent = hay ? Lg('Nueva partida', 'New game') : Lg('Comenzar', 'Start');
    $('#tituloEstado').textContent = hay ? (m ? Lg(`Vas en la misión ${m.id}: ${m.titulo}`, `You are on mission ${m.id}: ${m.titulo}`) : Lg('Terminaste el juego: la defensa está aprobada', 'You finished the game: the defence is approved')) : '';
    document.querySelectorAll('#titulo .menu .boton').forEach(b => b.classList.remove('activo'));
    (hay ? $('#continuar') : $('#nueva')).classList.add('activo'); // la opción marcada al entrar
  }
  menuTitulo();
  function empezar(nueva) {
    Sonido.iniciar();
    $('#negro').style.opacity = 1;
    setTimeout(() => {
      $('#titulo').hidden = true; empezado = true;
      if (nueva) {
        escena = 'cerro'; vistos.clear(); yo.x = -30; yo.mira = 1; cam.x = 0; llegando = true;
        const comoSeJuega = matchMedia('(pointer: fine)').matches ? Lg('Camino con las flechas ← → (o tocando donde quiero ir), y miro o hablo con la barra espaciadora o tocando las marcas.', 'I walk with the arrow keys ← → (or by clicking where I want to go), and I look or talk with the space bar or by clicking the marks.')
          : Lg('Camino con ◀ ▶ abajo o tocando donde quiero ir, y miro o hablo tocando las marcas.', 'I walk with ◀ ▶ at the bottom or by tapping where I want to go, and I look or talk by tapping the marks.');
        pedirIr(160, () => { llegando = false; decir([['yo', Lg('El observatorio. Me esperan adentro.', 'The observatory. They are waiting for me inside.')], ['yo', comoSeJuega]]); });
      } else decir([['yo', Lg('De vuelta en el observatorio. La flecha dorada me dice qué toca.', 'Back at the observatory. The golden arrow tells me what comes next.')]]);
      actualizarContador();
      $('#negro').style.opacity = 0;
    }, 400);
  }
  $('#continuar').onclick = () => empezar(false);
  $('#nueva').onclick = () => {
    const b = $('#nueva');
    if (M.hayProgreso() && !b.dataset.seguro) { b.dataset.seguro = 1; b.textContent = Lg('Toca de nuevo: se borra tu progreso', 'Press again: your progress will be erased'); return; }
    if (M.hayProgreso()) M.reiniciar();
    empezar(true);
  };
  $('#tituloCuaderno').onclick = () => { Sonido.iniciar(); M.cuaderno(); };
  // el menú se maneja también con el teclado: flechas para moverse, Enter para elegir
  addEventListener('keydown', ev => {
    if (empezado || $('#titulo').hidden || !['ArrowUp', 'ArrowDown'].includes(ev.key)) return;
    const bs = [...document.querySelectorAll('#titulo .menu button')].filter(b => !b.hidden), i = bs.indexOf(document.activeElement);
    const j = i < 0 ? 0 : (i + (ev.key === 'ArrowDown' ? 1 : -1) + bs.length) % bs.length;
    bs[j].focus(); ev.preventDefault();
  });

  // ---------- entrada ----------
  $('#marco').addEventListener('pointerdown', ev => {
    if (ev.target.closest('button, input, a, label')) return;
    if (!empezado || llegando) return;
    Sonido.iniciar();
    if (dialogo) return avanzar();
    if (M.abierto()) return;
    const rc = cv.getBoundingClientRect();
    const x = (ev.clientX - rc.left) / rc.width * W, y = (ev.clientY - rc.top) / rc.height * H;
    const E = ESCENAS[escena];
    // tocar cerca basta: el personaje entero con margen, o el objeto y su marca; si caben varios, el más cercano
    const k = Math.max(1, 1.6 / cam.k); // en pantallas chicas el margen crece, para que el dedo no tenga que ser preciso
    const dist = o => o.tipo === 'npc'
      ? (Math.abs(x - o.x) < 30 * k && y > E.piso - 120 && y < E.piso + 24 ? Math.abs(x - o.x) : Infinity)
      : (Math.abs(x - o.x) < 42 * k && Math.abs(y - (o.my ?? E.piso - 80)) < 52 * k ? Math.hypot(x - o.x, y - (o.my ?? E.piso - 80)) : Infinity);
    const o = visibles(E).map(q => [q, dist(q)]).filter(([, d]) => d < Infinity).sort((a, b) => a[1] - b[1]).map(([q]) => q)[0];
    const destino = o ? (o.pie ?? (o.tipo === 'npc' ? o.x + (yo.x < o.x ? -40 : 40) : o.x)) : x;
    pedirIr(Math.max(E.limites[0], Math.min(E.limites[1], destino)), o ? () => usar(o) : null);
  });
  // ---------- teclado y mando en pantalla: izquierda, derecha y acción ----------
  // Mantener apretada una dirección camina hacia ese lado; soltar frena. La acción (espacio o Enter) mira o habla con lo más cercano,
  // o sigue el diálogo. En el teléfono no hay botón de acción: se tocan las marcas.
  let dirTecla = 0;
  const libre = () => empezado && !llegando && !M.abierto();
  function mover(dir) {
    if (!libre() || dialogo || dir === dirTecla) { if (!dir) dirTecla = 0; return; }
    dirTecla = dir;
    const E = ESCENAS[escena];
    if (dir) pedirIr(dir > 0 ? E.limites[1] : E.limites[0], null); else frenarYa();
  }
  // Al soltar la flecha se para ya, no al cerrar el ciclo: si recién arrancaba vuelve a quedarse quieto (un toque corto casi no
  // mueve), y si iba caminando frena desde la mitad del frenado (unas 30 unidades en vez de un ciclo más 54).
  function frenarYa() {
    yo.otraVez = false; yo.alLlegar = null; yo.apurado = false;
    if (ani.nombre === 'arranca' && ani.i < 14) { poner('quieto', 0, 4); return llegar(); }
    if (ani.nombre === 'arranca' || ani.nombre === 'camina') { yo.meta = null; return poner('frena', 12, 4); }
    yo.meta = yo.x; // ya va frenando, dando un paso o dándose vuelta: termina eso y se queda
  }
  function accion() {
    if (!libre()) return;
    Sonido.iniciar();
    if (dialogo) return avanzar();
    const E = ESCENAS[escena], par = visibles(E).map(o => [o, Math.abs(o.x - yo.x)]).filter(([, d]) => d < 110).sort((a, b) => a[1] - b[1])[0];
    if (!par) return decir([['yo', Lg('No hay nada aquí. Las marcas doradas y blancas son lo que se puede mirar.', 'There is nothing here. The gold and white marks show what I can look at.')]]);
    const o = par[0], destino = o.pie ?? (o.tipo === 'npc' ? o.x + (yo.x < o.x ? -40 : 40) : o.x);
    pedirIr(Math.max(E.limites[0], Math.min(E.limites[1], destino)), () => usar(o));
  }
  const IZQ = ['ArrowLeft', 'a', 'A'], DER = ['ArrowRight', 'd', 'D'], ACC = [' ', 'Enter', 'e', 'E'];
  addEventListener('keydown', ev => {
    if (!libre() || ev.target.closest && ev.target.closest('input, textarea, select')) return;
    if (IZQ.includes(ev.key)) { ev.preventDefault(); if (!ev.repeat) mover(-1); }
    else if (DER.includes(ev.key)) { ev.preventDefault(); if (!ev.repeat) mover(1); }
    else if (ACC.includes(ev.key) && !(ev.target.closest && ev.target.closest('button'))) { ev.preventDefault(); if (!ev.repeat) accion(); }
  });
  addEventListener('keyup', ev => { if ((IZQ.includes(ev.key) && dirTecla < 0) || (DER.includes(ev.key) && dirTecla > 0)) mover(0); });
  for (const [id, dir] of [['#mIzq', -1], ['#mDer', 1]]) {
    const b = $(id);
    b.addEventListener('pointerdown', ev => { ev.preventDefault(); Sonido.iniciar(); b.setPointerCapture(ev.pointerId); mover(dir); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(n => b.addEventListener(n, () => { if (dirTecla === dir) mover(0); }));
  }
  const bm = $('#musica'); bm.textContent = Sonido.on ? Lg('♪ sí', '♪ on') : Lg('♪ no', '♪ off');
  bm.onclick = () => { Sonido.iniciar(); bm.textContent = Sonido.alternar() ? Lg('♪ sí', '♪ on') : Lg('♪ no', '♪ off'); };
  $('#abrirCuaderno').onclick = () => { Sonido.iniciar(); M.cuaderno(); };
  // jugar en horizontal: en Android se puede pedir pantalla completa y girar; si el navegador no deja, se explica
  // el mismo botón deshace el giro: mientras el juego está girado (pantalla completa) sigue visible y vuelve a vertical
  $('#girar').onclick = async () => {
    Sonido.iniciar();
    if (document.fullscreenElement) { try { screen.orientation.unlock(); } catch (e) { /* nada */ } return document.exitFullscreen().catch(() => {}).finally(reajustar); }
    try { await document.documentElement.requestFullscreen(); await screen.orientation.lock('landscape'); }
    catch (e) { decir([['yo', Lg('Para jugar en horizontal, gira el teléfono (con la rotación automática activada). El juego se acomoda solo.', 'To play in landscape, turn the phone (with auto-rotate on). The game adjusts on its own.')]]); }
  };
  document.addEventListener('fullscreenchange', () => {
    const girado = !!document.fullscreenElement;
    document.body.classList.toggle('girado', girado);
    reajustar();
    $('#girar').title = girado ? Lg('Volver a vertical', 'Back to portrait') : Lg('Jugar en horizontal', 'Play in landscape');
  });
  $('#cerrarCuaderno').onclick = () => M.cerrarCuaderno();
  $('#salirInstrumento').onclick = () => { callar(); M.salir(); };

  // ---------- capa de oscuridad con la luz de la linterna ----------
  const sombra = document.createElement('canvas'); sombra.width = W; sombra.height = H;
  function iluminar(luz, oscuro, t) {
    const s = sombra.getContext('2d');
    s.globalCompositeOperation = 'source-over'; s.clearRect(0, 0, W, H);
    s.fillStyle = `rgba(4,4,14,${oscuro})`; s.fillRect(0, 0, W, H);
    if (luz) {
      const r = 85 + 3 * Math.sin(t * 9) * Math.sin(t * 4);
      const g = s.createRadialGradient(luz[0], luz[1], 4, luz[0], luz[1], r);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      s.globalCompositeOperation = 'destination-out'; s.fillStyle = g; s.fillRect(luz[0] - r, luz[1] - r, 2 * r, 2 * r);
    }
    ctx.drawImage(sombra, 0, 0);
    if (luz) {
      const g = ctx.createRadialGradient(luz[0], luz[1], 2, luz[0], luz[1], 60);
      g.addColorStop(0, 'rgba(255,190,110,0.28)'); g.addColorStop(1, 'rgba(255,190,110,0)');
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(luz[0] - 60, luz[1] - 60, 120, 120); ctx.globalCompositeOperation = 'source-over';
    }
  }

  // los objetos que existen ahora: los que tienen "desde" (un capítulo) aparecen recién cuando la historia llega ahí
  function visibles(E) { const m = M.actual(); return E.objetos.filter(o => !o.desde || !m || m.cap >= o.desde); } // declaración: se puede usar antes de esta línea

  // ---------- marcas de lo que se puede tocar ----------
  function marcas(t) {
    const E = ESCENAS[escena];
    ctx.font = "bold 9px 'Space Mono'"; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    for (const o of visibles(E)) {
      const y = (o.my ?? E.piso - 86) + Math.round(Math.sin(t * 3 + o.x) * 2), x = o.x;
      const meta = esObjetivo(o), p = 0.5 + 0.5 * Math.sin(t * 4 + o.x);
      if (o.tipo === 'salida') {
        const w = ctx.measureText(o.etiqueta).width + 10, xe = Math.max(cam.x + w / 2 + 2, Math.min(cam.x + cam.ancho - w / 2 - 2, x)); // que no se corte en el borde
        ctx.fillStyle = meta ? `rgba(255,184,77,${0.55 + 0.35 * p})` : 'rgba(0,0,0,0.6)'; ctx.fillRect(xe - w / 2, y - 14, w, 14);
        ctx.fillStyle = meta ? '#1a1205' : '#ffb84d'; ctx.fillText(o.etiqueta, xe, y - 2);
        if (meta) flecha(xe, y - 18, t);
        continue;
      }
      if (meta) { // lo que toca ahora: nunca queda gris
        ctx.fillStyle = `rgba(255,184,77,${0.3 + 0.3 * p})`; ctx.beginPath(); ctx.arc(x, y, 12 + 3 * p, 0, 7); ctx.fill();
        ctx.fillStyle = '#ffb84d'; ctx.beginPath(); ctx.moveTo(x, y - 7); ctx.lineTo(x + 6, y); ctx.lineTo(x, y + 7); ctx.lineTo(x - 6, y); ctx.fill();
        ctx.fillStyle = '#2a1500'; ctx.fillRect(x - 1, y - 4, 2, 5); ctx.fillRect(x - 1, y + 2, 2, 2);
        flecha(x, y - 16, t);
        continue;
      }
      const visto = vistos.has(`${escena}:${o.id}`);
      if (visto) { ctx.fillStyle = 'rgba(160,160,170,0.7)'; ctx.fillRect(x - 2, y - 2, 4, 4); continue; }
      if (o.importante) {
        ctx.fillStyle = `rgba(255,184,77,${0.25 + 0.25 * p})`; ctx.beginPath(); ctx.arc(x, y, 10 + 2 * p, 0, 7); ctx.fill();
        ctx.fillStyle = '#ffb84d'; ctx.beginPath(); ctx.moveTo(x, y - 7); ctx.lineTo(x + 6, y); ctx.lineTo(x, y + 7); ctx.lineTo(x - 6, y); ctx.fill();
        ctx.fillStyle = '#2a1500'; ctx.fillRect(x - 1, y - 4, 2, 5); ctx.fillRect(x - 1, y + 2, 2, 2);
      } else {
        ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * p})`;
        ctx.fillRect(x - 1, y - 5, 2, 10); ctx.fillRect(x - 5, y - 1, 10, 2);
        ctx.fillStyle = `rgba(255,255,255,${0.15 + 0.2 * p})`; ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fill();
      }
    }
  }

  // La flecha dorada que rebota sobre lo que toca ahora.
  function flecha(x, y, t) {
    const yy = y - 6 - Math.abs(Math.sin(t * 5)) * 5;
    ctx.fillStyle = '#2a1500'; ctx.beginPath(); ctx.moveTo(x - 7, yy - 1); ctx.lineTo(x + 7, yy - 1); ctx.lineTo(x, yy + 8); ctx.fill();
    ctx.fillStyle = '#ffb84d'; ctx.beginPath(); ctx.moveTo(x - 5, yy); ctx.lineTo(x + 5, yy); ctx.lineTo(x, yy + 6); ctx.fill();
  }

  // En vertical, flechas en el borde si quedan cosas sin ver fuera de la vista.
  function flechas(t) {
    if (cam.ancho >= W) return;
    const E = ESCENAS[escena], falta = o => o.tipo !== 'salida' && !vistos.has(`${escena}:${o.id}`);
    const izq = visibles(E).filter(o => falta(o) && o.x < cam.x).length, der = visibles(E).filter(o => falta(o) && o.x > cam.x + cam.ancho).length;
    const meta = visibles(E).find(esObjetivo), metaIzq = meta && meta.x < cam.x, metaDer = meta && meta.x > cam.x + cam.ancho;
    ctx.font = "bold 9px 'Space Mono'"; ctx.textBaseline = 'middle';
    const y = E.piso - 120 + Math.sin(t * 4) * 2;
    if (izq || metaIzq) { ctx.textAlign = 'left'; ctx.fillStyle = metaIzq ? 'rgba(255,184,77,0.85)' : 'rgba(0,0,0,0.6)'; ctx.fillRect(cam.x + 2, y - 9, 34, 18); ctx.fillStyle = metaIzq ? '#1a1205' : '#ffb84d'; ctx.fillText(metaIzq ? '< !' : `< ${izq}`, cam.x + 6, y); }
    if (der || metaDer) { ctx.textAlign = 'right'; ctx.fillStyle = metaDer ? 'rgba(255,184,77,0.85)' : 'rgba(0,0,0,0.6)'; ctx.fillRect(cam.x + cam.ancho - 36, y - 9, 34, 18); ctx.fillStyle = metaDer ? '#1a1205' : '#ffb84d'; ctx.fillText(metaDer ? '! >' : `${der} >`, cam.x + cam.ancho - 6, y); }
  }

  // ---------- bucle ----------
  let t = 0, ultimo = null;
  function bucle(ts) {
    const dt = ultimo === null ? 0 : Math.min(0.05, (ts - ultimo) / 1000);
    ultimo = ts; t += dt;
    const E = ESCENAS[escena];
    animar(dt);
    // texto del diálogo letra a letra
    if (dialogo) {
      const txt = dialogo.lineas[dialogo.i][1], a = Math.floor(dialogo.n);
      dialogo.n = Math.min(txt.length, dialogo.n + dt * 40);
      if (Math.floor(dialogo.n) !== a && a % 2 === 0) Sonido.letra();
      caja.querySelector('.texto').innerHTML = M.conTipos(txt.slice(0, Math.floor(dialogo.n)));
    }
    // fondo
    const img = imagenes[escena];
    if (img && img.complete) { ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(img, 0, 0, W, H); ctx.imageSmoothingEnabled = false; }
    else { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); }
    // personajes
    for (const n of Object.values(NPCS)) if (n.escena === escena) if (!dibujarSprite(n.sprite, n.x, E.piso, n.mira, t + n.x)) personaje(n.x, E.piso, n.look, n.mira, 0, 0, t + n.x);
    const luz = dibujarAnim(yo.x, E.piso) || personaje(yo.x, E.piso, LOOKS.yo, yo.mira, 0, 0, t);
    iluminar(luz, E.oscuro, t);
    marcas(t);
    flechas(t);
    moverCamara(dt, yo.x);
    if (!empezado) $('#titulo').style.setProperty('--flash', cieloTitulo.dibujar(t).toFixed(3)); // el título brilla con la supernova
    requestAnimationFrame(bucle);
  }
  for (const [k, e] of Object.entries(ESCENAS)) { imagenes[k] = new Image(); imagenes[k].src = e.img; }
  yo.x = 300;
  actualizarContador();
  document.fonts && document.fonts.load("bold 9px 'Space Mono'");
  requestAnimationFrame(bucle);
})();
