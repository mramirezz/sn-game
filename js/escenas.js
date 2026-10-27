// Las escenas animadas de los capítulos 2 a 7: el cono del survey en 3D, el colador de la búsqueda, el ocular de una noche,
// el río de la matriz de confusión, el combate del árbitro, la cuadratura en áreas y la pizarra del comité.
// Mismo lenguaje que las de los capítulos 0 y 1 (js/vista.js): luz aditiva, colores con significado, todo a la resolución de la pantalla.
const Escenas = (() => {
  const V = Vista, H = Vista.h, F = Fisica, U = Universo;
  const CL = { Ia: '#ffd166', II: '#f0605d', Ibc: '#4cc9f0', IIn: '#c77dff' };
  const RGB = c => { const n = parseInt(c.slice(1), 16); return `${n >> 16},${(n >> 8) & 255},${n & 255}`; };
  const fondoEstrellas = (semilla, n) => { const r = U.rng(semilla); return [...Array(n)].map(() => ({ x: r(), y: r(), a: 0.12 + 0.5 * r() ** 3, r: r() < 0.05 ? 1.2 : 0.7 })); };
  const facil = x => 1 - (1 - Math.min(1, Math.max(0, x))) ** 3;

  // imágenes compartidas: sprites y la sala del comité
  const IMG = {};
  const img = src => IMG[src] || (IMG[src] = Object.assign(new Image(), { src }));
  function sprite(g, nombre, x, piso, alto, { espejo = false, cuadro = 0 } = {}) {
    const im = img(`assets/sprites/${nombre}.png`), m = (window.SPRITES || {})[nombre];
    if (!im.complete || !m) return;
    const w = m.w, k = alto / m.h;
    g.save(); g.imageSmoothingEnabled = false; g.translate(x, piso); if (espejo) g.scale(-1, 1);
    g.drawImage(im, cuadro * w, 0, w, m.h, -m.pie * k, -m.h * k, w * k, m.h * k);
    g.restore();
  }
  // Toma un rectángulo de una imagen y lo pinta cubriendo el canvas (como background-size: cover).
  function cubrir(g, im, w, h, [sx, sy, sw, sh]) {
    if (!im.complete) return null;
    const k = Math.max(w / sw, h / sh), dw = sw * k, dh = sh * k, dx = (w - dw) / 2, dy = (h - dh) / 2;
    g.drawImage(im, sx, sy, sw, sh, dx, dy, dw, dh);
    return { k, dx, dy, sx, sy, a: (x, y) => [dx + (x - sx) * k, dy + (y - sy) * k] };
  }
  // arrastrar para girar (como el cubo del capítulo 0)
  function girable(cv, est) {
    let a = null;
    cv.style.touchAction = 'pan-y';
    cv.addEventListener('pointerdown', e => { a = { x: e.clientX, y: e.clientY, yaw: est.yaw, pitch: est.pitch }; est.tocado = true; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', e => {
      if (!a) return;
      est.yaw = a.yaw + (e.clientX - a.x) * 0.01;
      est.pitch = Math.max(-1.1, Math.min(0.6, a.pitch + (e.clientY - a.y) * 0.006));
    });
    ['pointerup', 'pointercancel'].forEach(ev => cv.addEventListener(ev, () => { a = null; }));
    return () => !!a;
  }

  // ============ el cono del survey ============
  // El observador en la punta; el cono se abre hacia z alto y su largo es la distancia comóvil. Cada supernova va en su z,
  // en una dirección al azar dentro del campo (el ángulo del cono está exagerado para que se vea). capas: discos a un z
  // (los bordes de los bines, una frontera de visibilidad, una rebanada con su torta de clases).
  function Cono(cv, { zmax = 0.8, abre = 0.6 } = {}) {
    const est = { yaw: -0.62, pitch: -0.32, tocado: false }, arrastrando = girable(cv, est);
    const fondo = fondoEstrellas(31, 150), Lc = F.dc(zmax);
    let t = 0;
    const s = z => Math.min(1.05, F.dc(Math.max(z, 1e-4)) / Lc);
    const P3 = (z, u = 0, v = 0) => { const k = s(z); return [-1.15 + 2.3 * k, k * abre * v, k * abre * u]; };
    function dibujar(dt, { puntos = [], capas = [], estelas = [], textos = [], tick = [0.2, 0.4, 0.6, 0.8] } = {}) {
      t += dt;
      if (!arrastrando() && !est.tocado) est.yaw = -0.62 + 0.28 * Math.sin(t * 0.22); // vaivén suave mientras nadie lo toca
      const { g, w, h } = H.lienzo(cv);
      H.pintarFondo(g, w, h, fondo, ['#050816', '#02030a']);
      // en el teléfono vertical el cono baja: tú arriba y más z hacia abajo (se proyecta en un marco girado 90°)
      const vertical = h > w * 1.1, Wv = vertical ? h : w, Hv = vertical ? w : h;
      const f = Math.min(1.42 * Wv, 2.3 * Hv), D = 4;
      const cyw = Math.cos(est.yaw), syw = Math.sin(est.yaw), cp = Math.cos(est.pitch), sp = Math.sin(est.pitch);
      const proy = ([x, y, z]) => { const x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw, y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp + D;
        const vx = f * x1 / z2, vy = -f * y2 / z2; return vertical ? [w / 2 - vy, h / 2 + 22 + vx, z2] : [w / 2 + vx, h / 2 + vy, z2]; };
      const anillo = z => { const k = s(z), x = -1.15 + 2.3 * k, r = k * abre; return [...Array(49)].map((_, i) => proy([x, r * Math.cos(i / 48 * 2 * Math.PI), r * Math.sin(i / 48 * 2 * Math.PI)])); };
      const trazo = ps => { g.beginPath(); ps.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); };
      // generatrices y borde: el volumen que mira el survey
      const borde = anillo(zmax), punta = proy([-1.15, 0, 0]);
      g.strokeStyle = 'rgba(110,231,160,0.16)'; g.lineWidth = 1;
      for (let i = 0; i < 48; i += 6) { g.beginPath(); g.moveTo(punta[0], punta[1]); g.lineTo(borde[i][0], borde[i][1]); g.stroke(); }
      // las capas, de la más lejana a la más cercana
      for (const cpa of [...capas].sort((a, b) => b.z - a.z)) {
        const an = anillo(cpa.z);
        if (cpa.relleno) { g.fillStyle = cpa.relleno; trazo(an); g.fill(); }
        g.strokeStyle = cpa.color || 'rgba(110,231,160,0.5)'; g.lineWidth = cpa.ancho || 1.2; g.setLineDash(cpa.guiones || []); trazo(an); g.stroke(); g.setLineDash([]);
        const R = cpa.radioTorta || 24;
        // en vertical la torta va al costado derecho del anillo; en horizontal, arriba
        const top = vertical ? (([x, y]) => [Math.min(w - R - 6, x + R + 10), y + R + 14])(an.reduce((a, b) => (b[0] > a[0] ? b : a))) : an.reduce((a, b) => (b[1] < a[1] ? b : a));
        if (cpa.torta) torta(g, top, cpa.torta, R);
        if (cpa.etiqueta) { g.fillStyle = cpa.colorEtiqueta || cpa.color || '#e8ecf8'; g.textBaseline = 'alphabetic'; V.escribir(g, cpa.etiqueta, Math.min(w - 60, top[0]), top[1] - (cpa.torta ? 2 * R + 22 : 8), 11, 'center'); }
      }
      g.save(); g.shadowColor = '#6ee7a0'; g.shadowBlur = 6; g.strokeStyle = 'rgba(110,231,160,0.85)'; g.lineWidth = 1.5; trazo(borde); g.stroke(); g.restore();
      // las marcas de z, abajo de cada anillo
      g.fillStyle = 'rgba(200,215,240,0.8)';
      for (const z of tick) { const an = anillo(z), bajo = an.reduce((a, b) => (vertical ? b[0] > a[0] : b[1] > a[1]) ? b : a); g.strokeStyle = 'rgba(110,231,160,0.12)'; trazo(an); g.stroke();
        g.font = '10px system-ui, sans-serif'; g.textAlign = vertical ? 'left' : 'center'; g.textBaseline = vertical ? 'middle' : 'top'; g.fillText(`z ${z}`, bajo[0] + (vertical ? 4 : 0), bajo[1] + (vertical ? 0 : 3)); }
      // estelas (una supernova que cambia de z)
      for (const e of estelas) {
        const a = proy(P3(...e.de)), b = proy(P3(...e.a));
        const gr = g.createLinearGradient(a[0], a[1], b[0], b[1]); gr.addColorStop(0, `rgba(${RGB(e.color)},0.05)`); gr.addColorStop(1, `rgba(${RGB(e.color)},0.85)`);
        g.strokeStyle = gr; g.lineWidth = e.ancho || 1.5; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
      }
      // las supernovas, de atrás hacia adelante
      const vis = puntos.map(p => ({ p, q: proy(P3(p.z, p.u, p.v)) })).sort((a, b) => b.q[2] - a.q[2]);
      g.globalCompositeOperation = 'lighter';
      for (const { p, q } of vis) {
        const k = 4.4 / q[2], a = p.a ?? 1;
        if (p.apagada) { g.fillStyle = `rgba(150,160,190,${0.35 * a})`; g.fillRect(q[0] - 1, q[1] - 1, 2, 2); continue; }
        H.luz(g, q[0], q[1], (p.r || 5) * 2.2 * k, RGB(p.color || '#ffd166'), 0.55 * a);
        H.luz(g, q[0], q[1], 1.8 * k, '255,255,255', 0.8 * a);
      }
      g.globalCompositeOperation = 'source-over';
      for (const { p, q } of vis) if (p.anillo) { g.strokeStyle = p.anillo; g.lineWidth = 1.5; g.beginPath(); g.arc(q[0], q[1], 7, 0, 7); g.stroke(); }
      for (const { p, q } of vis) if (p.destello != null) H.supernova(g, q[0], q[1], p.destello, 0.6);
      // el observador
      H.luz(g, punta[0], punta[1], 14, '110,231,160', 0.6);
      g.fillStyle = '#e8ecf8'; g.beginPath(); g.arc(punta[0], punta[1], 3, 0, 7); g.fill();
      g.font = '11px system-ui, sans-serif'; g.textAlign = vertical ? 'left' : 'right'; g.textBaseline = 'middle'; g.fillText('tú (z = 0)', punta[0] + (vertical ? 10 : -8), punta[1]);
      g.textAlign = 'left'; g.textBaseline = 'top';
      textos.forEach((tx, i) => { g.fillStyle = tx.color || '#e8ecf8'; V.escribir(g, tx.t, 10, 10 + 16 * i, tx.tam || 12); });
      if (!est.tocado) { g.fillStyle = 'rgba(200,215,240,0.55)'; g.font = '10px system-ui, sans-serif'; g.textAlign = 'right'; g.textBaseline = 'bottom'; g.fillText('arrastra para girar', w - 8, h - 6); }
    }
    // una dirección al azar dentro del campo (u, v en el disco unidad)
    const direccion = rand => { const r = Math.sqrt(rand()) * 0.95, a = rand() * 2 * Math.PI; return { u: r * Math.cos(a), v: r * Math.sin(a) }; };
    return { dibujar, P3, direccion };
  }
  // una torta de clases (las fracciones de cada clase), con su borde
  function torta(g, [x, y], fr, R) {
    const yc = y - R - 14, ks = Object.keys(fr).filter(k => fr[k] > 0), tot = ks.reduce((a, k) => a + fr[k], 0) || 1;
    let a0 = -Math.PI / 2;
    g.fillStyle = 'rgba(3,4,11,0.75)'; g.beginPath(); g.arc(x, yc, R + 3, 0, 7); g.fill();
    for (const k of ks) { const da = 2 * Math.PI * fr[k] / tot; g.fillStyle = CL[k] || '#888'; g.beginPath(); g.moveTo(x, yc); g.arc(x, yc, R, a0, a0 + da); g.closePath(); g.fill();
      if (da > 0.5) { const am = a0 + da / 2; g.fillStyle = '#03040b'; V.escribir(g, k, x + 0.62 * R * Math.cos(am), yc + 0.62 * R * Math.sin(am) + 4, 10, 'center'); }
      a0 += da; }
  }

  // ============ 3.2 el colador de la búsqueda ============
  // Cada bolita es una supernova en su mejor noche, con su magnitud. Cae sobre el colador, que tiene más agujeros donde
  // la eficiencia DE(m) es alta. Las que pasan son las encontradas; las que no, quedan arriba. Con el corte, más allá del
  // m50 el colador es una pared.
  function Tamiz(cv) {
    const bolas = [], m0 = 19.5, m1 = 26.5;
    let t = 0, prox = 0, corte = 0, m50 = 23.4, fuente = null, pasan = 0, total = 0, debilesPasan = 0;
    const NB = 28, abajo = Array(NB).fill(0), arriba = Array(NB).fill(0);
    function poner({ magnitudes, conCorte, m50: m }) { fuente = magnitudes; corte = conCorte ? 0 : null; m50 = m; bolas.length = 0; abajo.fill(0); arriba.fill(0); pasan = total = debilesPasan = 0; prox = t; }
    function dibujar(dt, { DE }) {
      t += dt;
      const { g, w, h } = H.lienzo(cv);
      H.pintarFondo(g, w, h, [], ['#060a18', '#02030a']);
      const mg = { i: 16, d: 16 }, px = m => mg.i + (w - mg.i - mg.d) * (m - m0) / (m1 - m0), yT = h * 0.46, yB = h - 30;
      // nuevas bolitas
      if (fuente && t > prox && total < fuente.length) {
        const m = fuente[total++]; prox = t + 0.06;
        bolas.push({ m, x: px(m) + (Math.random() - 0.5) * 4, y: -6, vy: 40 + 40 * Math.random(), pasa: Math.random() < DE(m), estado: 'cae' });
      }
      // el colador: la densidad de agujeros es DE(m)
      const celda = 6;
      for (let x = mg.i; x < w - mg.d; x += celda) {
        const m = m0 + (m1 - m0) * (x - mg.i) / (w - mg.i - mg.d), de = DE(m);
        g.fillStyle = de > 0 ? 'rgba(140,120,90,0.85)' : 'rgba(170,90,80,0.95)'; g.fillRect(x, yT - 3, celda, 6);
        if (de > 0) for (let k = 0; k < 3; k++) if (((x / celda + k * 7) % 10) / 10 < de) { g.fillStyle = '#03040b'; g.fillRect(x + 1 + k * 1.5, yT - 2, 1.5, 4); }
      }
      // la curva DE(m) encima del colador
      g.strokeStyle = '#ffb84d'; g.lineWidth = 2; g.beginPath();
      for (let x = mg.i; x <= w - mg.d; x += 2) { const m = m0 + (m1 - m0) * (x - mg.i) / (w - mg.i - mg.d), y = yT - 10 - (yT * 0.45) * DE(m); x === mg.i ? g.moveTo(x, y) : g.lineTo(x, y); }
      g.stroke();
      g.fillStyle = '#ffb84d'; g.font = '11px system-ui, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'bottom'; g.fillText('DE(m): cuántos agujeros tiene el colador', mg.i, yT - 12 - yT * 0.45);
      g.strokeStyle = '#5ad1ff'; g.setLineDash([5, 4]); g.lineWidth = 1.5; g.beginPath(); g.moveTo(px(m50), 4); g.lineTo(px(m50), yB); g.stroke(); g.setLineDash([]);
      g.fillStyle = '#5ad1ff'; g.textAlign = 'center'; g.textBaseline = 'top'; g.fillText('m50', px(m50), 2);
      if (corte !== null) { g.fillStyle = 'rgba(255,107,107,0.9)'; g.textAlign = 'left'; g.fillText('corte: pared', px(m50) + 4, yT + 6); }
      // bolitas
      for (const b of bolas) {
        if (b.estado === 'cae') {
          b.vy += 300 * dt; b.y += b.vy * dt;
          if (b.y >= yT - 3 && b.y < yT + 4) { if (b.pasa) b.estado = 'pasa'; else { b.estado = 'rebota'; b.vy = -60 - 40 * Math.random(); b.vida = 1; } }
        } else if (b.estado === 'pasa') {
          b.vy += 300 * dt; b.y += b.vy * dt;
          const i = Math.min(NB - 1, Math.max(0, Math.floor((b.m - m0) / (m1 - m0) * NB))), tope = yB - 3 * abajo[i];
          if (b.y >= tope) { b.estado = 'fin'; abajo[i]++; pasan++; if (b.m > m50) debilesPasan++; }
        } else if (b.estado === 'rebota') {
          b.vy += 300 * dt; b.y = Math.min(b.y + b.vy * dt, yT - 4); b.vida -= dt * 0.9;
          if (b.vida <= 0) { b.estado = 'fin'; arriba[Math.min(NB - 1, Math.max(0, Math.floor((b.m - m0) / (m1 - m0) * NB)))]++; }
        }
        if (b.estado !== 'fin') { const c = b.estado === 'rebota' ? `rgba(160,170,200,${b.vida})` : b.m > m50 ? '#ff9b9b' : '#ffd166'; g.fillStyle = c; g.beginPath(); g.arc(b.x, b.y, 3, 0, 7); g.fill(); }
      }
      // lo que pasó (abajo) y lo que quedó (encima del colador, gris)
      const ancho = (w - mg.i - mg.d) / NB;
      for (let i = 0; i < NB; i++) {
        const mm = m0 + (i + 0.5) * (m1 - m0) / NB;
        g.fillStyle = mm > m50 ? 'rgba(255,155,155,0.85)' : 'rgba(255,209,102,0.85)'; g.fillRect(mg.i + i * ancho + 1, yB - 3 * abajo[i], ancho - 2, 3 * abajo[i]);
        g.fillStyle = 'rgba(150,160,190,0.45)'; g.fillRect(mg.i + i * ancho + 1, yT - 4 - 1.5 * arriba[i], ancho - 2, 1.5 * arriba[i]);
      }
      g.strokeStyle = 'rgba(160,175,210,0.5)'; g.beginPath(); g.moveTo(mg.i, yB); g.lineTo(w - mg.d, yB); g.stroke();
      g.fillStyle = 'rgba(200,215,240,0.85)'; g.font = '10px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'top';
      for (let m = 20; m <= 26; m++) g.fillText(m, px(m), yB + 3);
      g.fillText('magnitud de la supernova esa noche (más débil →)', w / 2, yB + 15);
      g.textAlign = 'left'; g.fillStyle = '#e8ecf8'; g.font = '12px system-ui, sans-serif';
      g.fillText(`encontradas: ${pasan} de ${total}`, mg.i, yT + 10);
      g.fillStyle = '#ff9b9b'; g.fillText(`más débiles que el m50: ${debilesPasan}`, mg.i, yT + 26);
      return { pasan, total, debilesPasan, listo: fuente && total >= fuente.length && bolas.every(b => b.estado === 'fin') };
    }
    return { poner, dibujar };
  }

  // ============ 3.1 el ocular de una noche ============
  // El campo por el ocular esa noche: el ruido del fondo es el límite de la noche, la supernova brilla según su magnitud.
  // A la derecha, la ruleta de la búsqueda: gira y cae en "encontrada" con probabilidad DE(m).
  function Noche(cv) {
    const rr = U.rng(900), ruido = [...Array(500)].map(() => ({ x: rr() * 2 - 1, y: rr() * 2 - 1, a: rr() }));
    let giro = null;
    function tirar(p, sale) { giro = { p, sale, t: 0, ang: 0, fin: (sale ? 0.5 * p : p + 0.5 * (1 - p)) * 2 * Math.PI + 10 * Math.PI }; }
    function dibujar(dt, { m, maglim, m50, det, buscada, titulo }) {
      const { g, w, h } = H.lienzo(cv);
      H.pintarFondo(g, w, h, [], ['#04060f', '#02030a']);
      const R = Math.min(h * 0.42, w * 0.22), cx = R + 16, cy = h / 2;
      // el campo: el ruido es más fuerte en una noche mala (límite brillante)
      const nivel = Math.max(0.15, Math.min(1, (25.5 - maglim) / 3.5));
      g.save(); g.beginPath(); g.arc(cx, cy, R, 0, 7); g.clip();
      g.fillStyle = '#05070f'; g.fillRect(cx - R, cy - R, 2 * R, 2 * R);
      for (const s of ruido) { g.fillStyle = `rgba(190,200,230,${0.08 + 0.35 * nivel * s.a * Math.random()})`; g.fillRect(cx + s.x * R, cy + s.y * R, 1.6, 1.6); }
      g.globalCompositeOperation = 'lighter';
      H.luz(g, cx - R * 0.25, cy + R * 0.1, R * 0.35, '255,220,170', 0.35); // la galaxia del host
      if (Number.isFinite(m)) { const b = Math.min(1.2, 10 ** (-0.4 * (m - maglim)) * 0.9); H.luz(g, cx - R * 0.12, cy + R * 0.02, R * (0.08 + 0.18 * b), '255,190,110', Math.min(1, b)); H.luz(g, cx - R * 0.12, cy + R * 0.02, 3, '255,255,255', Math.min(1, b)); }
      g.globalCompositeOperation = 'source-over'; g.restore();
      g.strokeStyle = '#8a6a3a'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, R + 1.5, 0, 7); g.stroke();
      if (det) { g.strokeStyle = '#ffb84d'; g.lineWidth = 2; g.beginPath(); g.arc(cx - R * 0.12, cy + R * 0.02, R * 0.2, 0, 7); g.stroke(); }
      // la ruleta
      const rx = Math.min(w - R * 0.75 - 16, cx + R + 40 + R * 0.75), rr = R * 0.75;
      if (buscada) {
        const p = buscada.p;
        g.fillStyle = 'rgba(110,231,160,0.85)'; g.beginPath(); g.moveTo(rx, cy); g.arc(rx, cy, rr, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * p); g.closePath(); g.fill();
        g.fillStyle = 'rgba(255,107,107,0.55)'; g.beginPath(); g.moveTo(rx, cy); g.arc(rx, cy, rr, -Math.PI / 2 + 2 * Math.PI * p, 1.5 * Math.PI); g.closePath(); g.fill();
        if (giro) { giro.t += dt; giro.ang = giro.fin * facil(giro.t / 1.6); }
        const a = -Math.PI / 2 + (giro ? giro.ang : 0);
        g.strokeStyle = '#e8ecf8'; g.lineWidth = 3; g.beginPath(); g.moveTo(rx, cy); g.lineTo(rx + rr * 1.05 * Math.cos(a), cy + rr * 1.05 * Math.sin(a)); g.stroke();
        g.fillStyle = '#e8ecf8'; g.font = '11px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'top';
        g.fillText(`la búsqueda: DE = ${(100 * p).toFixed(0)} %`, rx, cy + rr + 6);
        if (giro && giro.t > 1.6) { g.font = '13px system-ui, sans-serif'; g.fillStyle = giro.sale ? '#6ee7a0' : '#ff9b9b'; g.fillText(giro.sale ? 'encontrada' : 'se le pasó', rx, cy - rr - 22); }
      }
      g.fillStyle = '#e8ecf8'; g.font = '12px system-ui, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'top';
      if (titulo) V.escribir(g, titulo, 8, 6, 12);
      g.font = '11px system-ui, sans-serif'; g.fillStyle = '#5ad1ff';
      g.fillText(`límite de la noche ${maglim.toFixed(1)} · m50 ${m50.toFixed(1)}`, 8, h - 16);
    }
    return { dibujar, tirar };
  }

  // ============ 4.5 el río de la confusión ============
  // A la izquierda la clase verdadera, a la derecha la asignada. De cada clase verdadera salen gotas que van a parar a cada
  // clase asignada en la proporción de la matriz: el ancho de cada cinta es la fracción.
  function Flujo(cv) {
    const gotas = [];
    let Mx = null, acum = [];
    function dibujar(dt, M) {
      const { g, w, h } = H.lienzo(cv);
      H.pintarFondo(g, w, h, [], ['#060a18', '#02030a']);
      const K = ['Ia', 'II', 'Ibc', 'IIn'], x0 = Math.min(90, w * 0.2), x1 = w - Math.min(90, w * 0.2), alto = (h - 50) / 4, y = i => 34 + (i + 0.5) * alto;
      g.fillStyle = '#aab3d0'; g.textBaseline = 'alphabetic'; V.escribir(g, 'clase verdadera', x0, 18, 11, 'right'); V.escribir(g, 'clase asignada', x1, 18, 11, 'left');
      K.forEach((k, i) => { g.fillStyle = CL[k]; V.escribir(g, k, x0 - 12, y(i) + 5, 14, 'right'); V.escribir(g, k, x1 + 12, y(i) + 5, 14, 'left');
        g.fillStyle = `rgba(${RGB(CL[k])},0.25)`; g.fillRect(x0 - 6, y(i) - alto * 0.4, 6, alto * 0.8); g.fillRect(x1, y(i) - alto * 0.4, 6, alto * 0.8); });
      if (!M) return;
      if (Mx !== M) { Mx = M; acum = M.map(f => f.map(() => 0)); }
      // las cintas: el ancho es la fracción de la fila
      for (let i = 0; i < 4; i++) {
        let o = -alto * 0.4;
        for (let j = 0; j < 4; j++) {
          const a = alto * 0.8 * M[i][j]; if (a < 0.4) { continue; }
          const ya = y(i) + o + a / 2, yb = y(j) - alto * 0.4 + alto * 0.8 * (i + 0.5) / 4;
          g.strokeStyle = `rgba(${RGB(CL[K[i]])},${i === j ? 0.32 : 0.22})`; g.lineWidth = Math.max(1, a);
          g.beginPath(); g.moveTo(x0, ya); g.bezierCurveTo((x0 + x1) / 2, ya, (x0 + x1) / 2, yb, x1, yb); g.stroke();
          // nuevas gotas, en proporción a la fracción
          acum[i][j] += dt * 6 * M[i][j];
          while (acum[i][j] >= 1) { acum[i][j] -= 1; gotas.push({ i, j, ya, yb, t: 0, v: 0.35 + 0.15 * Math.random() }); }
          o += a;
        }
      }
      g.globalCompositeOperation = 'lighter';
      for (const d of gotas) {
        d.t += dt * d.v; const u = d.t, m = 1 - u;
        const xb = m ** 3 * x0 + 3 * m * m * u * (x0 + x1) / 2 + 3 * m * u * u * (x0 + x1) / 2 + u ** 3 * x1;
        const yb = m ** 3 * d.ya + 3 * m * m * u * d.ya + 3 * m * u * u * d.yb + u ** 3 * d.yb;
        H.luz(g, xb, yb, 6, RGB(CL[K[d.i]]), 0.9);
      }
      g.globalCompositeOperation = 'source-over';
      for (let k = gotas.length - 1; k >= 0; k--) if (gotas[k].t >= 1) gotas.splice(k, 1);
    }
    return { dibujar };
  }

  // ============ 5.1 el combate del árbitro ============
  // En la sala del comité: tú en el atril, el árbitro en el estrado. En el medio, tu tasa de cada bin con su escudo: la barra
  // estadística (ámbar) y la total (el escudo rojo). Cada ataque es una fuente: vuela, empuja la tasa a sus alternativas y,
  // si alguna cae fuera del escudo, el golpe pasa.
  function Combate(cv) {
    const fondo = img('assets/fondos/comite.png');
    let est = null, ataque = null, sacudida = 0, t = 0;
    const cola = [];
    const poner = e => { est = e; };
    function atacar(a) { cola.push(a); }
    function dibujar(dt) {
      t += dt;
      const { g, w, h } = H.lienzo(cv);
      g.fillStyle = '#05060c'; g.fillRect(0, 0, w, h);
      g.save();
      if (sacudida > 0) { sacudida -= dt; g.translate((Math.random() - 0.5) * 10 * sacudida, (Math.random() - 0.5) * 6 * sacudida); }
      const fx = cubrir(g, fondo, w, h, [120, 120, 1224, 560]);
      g.fillStyle = 'rgba(3,4,11,0.45)'; g.fillRect(0, 0, w, h);
      const piso = h * 0.92, alto = Math.min(h * 0.42, 150);
      sprite(g, 'yo_astronomo', w * 0.1, piso, alto * 1.08);
      sprite(g, 'examinador2', w * 0.9, piso - h * 0.02, alto, { espejo: true });
      if (!est) { g.restore(); return; }
      // los escudos de cada bin
      const n = est.r.length, gx = i => w * (0.36 + 0.28 * (n === 1 ? 0.5 : i / (n - 1))), y0 = h * 0.14, y1 = h * 0.86;
      const ymax = Math.max(...est.r.map((x, i) => x + Math.hypot(est.st[i][1], est.sys[i][1])), est.verdad || 0, ...(ataque ? ataque.alts.flat() : [])) * 1.25;
      const py = v => y1 - (y1 - y0) * v / ymax;
      est.r.forEach((x, i) => {
        const cx = gx(i), lo = Math.hypot(est.st[i][0], est.sys[i][0]), hi = Math.hypot(est.st[i][1], est.sys[i][1]);
        g.strokeStyle = 'rgba(232,236,248,0.25)'; g.lineWidth = 1; g.beginPath(); g.moveTo(cx, y0); g.lineTo(cx, y1); g.stroke();
        // el escudo: la barra total
        const golpeado = ataque && ataque.fase === 'golpe' && ataque.fuera[i];
        g.fillStyle = golpeado ? 'rgba(255,60,60,0.45)' : 'rgba(255,107,107,0.16)';
        g.strokeStyle = golpeado ? '#ff3b3b' : 'rgba(255,107,107,0.9)'; g.lineWidth = 2;
        const ys = py(x + hi), yi = py(x - lo);
        g.beginPath(); g.roundRect ? g.roundRect(cx - 22, ys, 44, yi - ys, 10) : g.rect(cx - 22, ys, 44, yi - ys); g.fill(); g.stroke();
        g.strokeStyle = '#ffb84d'; g.lineWidth = 5; g.beginPath(); g.moveTo(cx, py(x - est.st[i][0])); g.lineTo(cx, py(x + est.st[i][1])); g.stroke();
        H.luz(g, cx, py(x), 16, '255,209,102', 0.8); g.fillStyle = '#ffd166'; g.beginPath(); g.arc(cx, py(x), 5, 0, 7); g.fill();
        g.fillStyle = '#e8ecf8'; g.font = '11px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'top';
        g.textBaseline = 'alphabetic'; V.escribir(g, est.etiquetas[i], cx, y1 + 16, 11, 'center');
        g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillStyle = '#ffd166'; g.fillText(x.toFixed(2), cx - 28, py(x));
        if (est.mostrarVerdad && est.verdad) { g.strokeStyle = '#b48cff'; g.setLineDash([5, 4]); g.lineWidth = 2; g.beginPath(); g.moveTo(cx - 34, py(est.verdad)); g.lineTo(cx + 34, py(est.verdad)); g.stroke(); g.setLineDash([]); }
      });
      // el ataque en curso
      if (!ataque && cola.length) ataque = Object.assign(cola.shift(), { t: 0, fase: 'vuela' });
      if (ataque) {
        ataque.t += dt;
        const a = ataque, ox = w * 0.86, oy = piso - alto * 0.7;
        if (a.fase === 'vuela') {
          const u = facil(a.t / 0.7);
          est.r.forEach((x, i) => { const tx = gx(i), ty = py(x), bx = ox + (tx - ox) * u, by = oy + (ty - oy) * u - Math.sin(u * Math.PI) * h * 0.18;
            H.luz(g, bx, by, 18, RGB(a.color), 0.9); g.fillStyle = '#03040b'; g.font = 'bold 10px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(a.id, bx, by); });
          if (a.t > 0.7) { a.fase = 'golpe'; a.t = 0; if (a.fuera.some(Boolean)) sacudida = 0.5; a.alHacer && a.alHacer(); }
        } else {
          // las alternativas: fantasmas que se separan de la tasa
          const u = facil(a.t / 0.5);
          a.alts.forEach((rs, k) => rs.forEach((ra, i) => { const cx = gx(i) + 34 + 12 * k, y = py(est.r[i] + (ra - est.r[i]) * u);
            g.strokeStyle = a.color; g.setLineDash([3, 3]); g.lineWidth = 1.5; g.beginPath(); g.moveTo(gx(i) + 6, py(est.r[i])); g.lineTo(cx, y); g.stroke(); g.setLineDash([]);
            g.fillStyle = a.fueraAlt[k][i] ? '#ff3b3b' : a.color; g.beginPath(); g.arc(cx, y, 5, 0, 7); g.fill(); }));
          if (a.t > 2.2) { ataque = null; a.alTerminar && a.alTerminar(); }
        }
        if (ataque) { g.fillStyle = '#e8ecf8'; g.font = '12px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'top'; V.escribir(g, `ataque ${a.id}: ${a.nombre}`, w / 2, 6, 12, 'center'); }
      }
      g.restore();
    }
    return { poner, atacar, dibujar, ocupado: () => !!ataque || cola.length > 0 };
  }

  // ============ la cuadratura en áreas ============
  // Cada fuente es un cuadrado de lado Δ que aparece de a uno; el cuadrado rojo crece hasta tener el área de todos juntos.
  // Al lado, la barra de la suma lineal: la cuadratura siempre queda más corta, y la manda la fuente más grande.
  function Cuadratura(cv) {
    let pres = [], t = 0;
    const poner = p => { pres = p.map(x => ({ ...x, fuentes: [...x.fuentes].filter(f => f.d > 0).sort((a, b) => b.d - a.d) })); t = 0; };
    function dibujar(dt) {
      t += dt;
      const { g, w, h } = H.lienzo(cv);
      H.pintarFondo(g, w, h, [], ['#070b1a', '#03040b']);
      if (!pres.length) return;
      const n = pres.length, col = w / n, sep = 4;
      const tot = p => Math.sqrt(p.fuentes.reduce((a, f) => a + f.d * f.d, 0)), suma = p => p.fuentes.reduce((a, f) => a + f.d, 0);
      const maxTot = Math.max(1e-6, ...pres.map(tot)), maxFila = Math.max(1e-6, ...pres.map(p => suma(p) + tot(p)));
      const nMax = Math.max(1, ...pres.map(p => p.fuentes.length));
      const esc = Math.min((h - 82) / maxTot, (col - 50 - sep * nMax) / maxFila);
      pres.forEach((p, k) => {
        const x0 = k * col + 10, base = h - 44, visibles = Math.min(p.fuentes.length, Math.floor(t / 0.3) + 1);
        g.fillStyle = '#e8ecf8'; g.textBaseline = 'alphabetic'; V.escribir(g, p.titulo, x0, 18, 12, 'left');
        let x = x0, area = 0;
        p.fuentes.forEach((f, i) => {
          const lado = Math.max(2, f.d * esc), u = facil((t - 0.3 * i) / 0.3);
          if (i < visibles) area += f.d * f.d * u;
          if (u <= 0) { x += lado + sep; return; }
          g.fillStyle = f.color; g.globalAlpha = 0.85 * u; g.fillRect(x, base - lado * u, lado * u, lado * u); g.globalAlpha = 1;
          if (lado > 15 && u > 0.9) { g.fillStyle = '#03040b'; g.font = '10px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(f.id, x + lado / 2, base - lado / 2); }
          x += lado + sep;
        });
        const L = Math.sqrt(area) * esc, xt = x + 18;
        g.fillStyle = '#e8ecf8'; g.font = '16px system-ui, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText('=', x + 2, base - 6);
        g.fillStyle = 'rgba(255,107,107,0.18)'; g.fillRect(xt, base - L, L, L); g.strokeStyle = '#ff6b6b'; g.lineWidth = 2; g.strokeRect(xt, base - L, L, L);
        // la suma lineal, como comparación
        const sl = suma(p) * esc * Math.min(1, t / (0.3 * p.fuentes.length + 0.3));
        g.fillStyle = 'rgba(255,184,77,0.6)'; g.fillRect(x0, base + 8, Math.min(sl, col - 20), 4);
        g.fillStyle = 'rgba(255,107,107,0.95)'; g.fillRect(x0, base + 14, L, 4);
        g.font = '10px system-ui, sans-serif'; g.fillStyle = '#ffb84d'; g.fillText(`suma lineal ${suma(p).toFixed(2)}`, x0, base + 30);
        g.fillStyle = '#ff6b6b'; g.fillText(`cuadratura √(ΣΔ²) ${Math.sqrt(area).toFixed(2)}`, x0 + Math.min(col * 0.45, 130), base + 30);
      });
    }
    return { poner, dibujar };
  }

  // ============ 7.1 la pizarra del comité ============
  // La sala del comité con la pizarra al centro: el gráfico se dibuja con tiza dentro de la pizarra. Los examinadores en
  // el estrado; el que pregunta tiene un globo con su pregunta.
  const PIZARRA = [412, 172, 476, 312]; // el rectángulo verde de la pizarra en assets/fondos/comite.png (1344 × 752)
  function Pizarra(cv) {
    const fondo = img('assets/fondos/comite.png'), QUIEN = ['examinadora1', 'examinador2', 'examinador3'];
    function dibujar(dt, { pintar, habla }) {
      const { g, w, h } = H.lienzo(cv);
      g.fillStyle = '#05060c'; g.fillRect(0, 0, w, h);
      if (!fondo.complete) return;
      const ancho = w >= 560;
      let board, bancos = [];
      if (ancho) { // la sala completa: la pizarra al centro y el estrado a la derecha
        const fx = cubrir(g, fondo, w, h, [300, 110, 1044, 540]);
        const [bx, by] = fx.a(PIZARRA[0], PIZARRA[1]), [bx2, by2] = fx.a(PIZARRA[0] + PIZARRA[2], PIZARRA[1] + PIZARRA[3]);
        board = [bx, by, bx2 - bx, by2 - by];
        const piso = fx.a(0, 470)[1], alto = piso - fx.a(0, 330)[1];
        bancos = QUIEN.map((k, i) => ({ k, x: fx.a(990 + 100 * i, 0)[0], piso, alto }));
      } else { // el teléfono: la pizarra a lo ancho arriba y los examinadores abajo
        const [sx, sy, sw, sh] = [PIZARRA[0] - 14, PIZARRA[1] - 14, PIZARRA[2] + 28, PIZARRA[3] + 28], k = w / sw, bh = sh * k;
        g.drawImage(fondo, sx, sy, sw, sh, 0, 0, w, bh);
        board = [14 * k, 14 * k, PIZARRA[2] * k, PIZARRA[3] * k];
        g.drawImage(fondo, 860, 300, 484, 200, 0, bh, w, h - bh); // el estrado de madera
        const piso = h - 8, alto = Math.min((h - bh) * 0.8, 120);
        bancos = QUIEN.map((q, i) => ({ k: q, x: w * (0.2 + 0.3 * i), piso, alto }));
      }
      g.fillStyle = 'rgba(14,30,22,0.82)'; g.fillRect(...board); // se borra la pizarra para escribir encima
      pintar && pintar(g, [board[0] + 6, board[1] + 6, board[2] - 12, board[3] - 12]);
      bancos.forEach(b => sprite(g, b.k, b.x, b.piso, b.alto, { espejo: ancho }));
      if (habla) { const b = bancos[QUIEN.indexOf(habla.quien)]; if (b) globo(g, b.x, b.piso - b.alto - 6, habla.texto, Math.min(280, w * (ancho ? 0.3 : 0.75))); }
    }
    return { dibujar };
  }
  function globo(g, x, y, texto, ancho, abajo = false) {
    g.font = '12px system-ui, sans-serif';
    const palabras = texto.split(' '), lineas = [''];
    for (const p of palabras) { const prueba = `${lineas[lineas.length - 1]} ${p}`.trim(); if (g.measureText(prueba).width > ancho - 16 && lineas[lineas.length - 1]) lineas.push(p); else lineas[lineas.length - 1] = prueba; }
    const W = g.canvas.width / (window.devicePixelRatio > 1 ? Math.min(2, window.devicePixelRatio) : 1);
    const alto = 16 * lineas.length + 12, x0 = Math.max(6, Math.min(W - ancho - 6, x - ancho / 2)), y0 = Math.max(4, y - alto);
    g.fillStyle = 'rgba(244,239,226,0.95)'; g.strokeStyle = '#8a6a3a'; g.lineWidth = 2;
    g.beginPath(); g.roundRect ? g.roundRect(x0, y0, ancho, alto, 8) : g.rect(x0, y0, ancho, alto); g.fill(); g.stroke();
    if (!abajo) { g.beginPath(); g.moveTo(x - 6, y0 + alto); g.lineTo(x, y0 + alto + 10); g.lineTo(x + 6, y0 + alto); g.fill(); }
    g.fillStyle = '#1d1d1d'; g.textAlign = 'left'; g.textBaseline = 'top';
    lineas.forEach((l, i) => V.escribir(g, l, x0 + 8, y0 + 6 + 16 * i, 12));
  }

  // ============ 2.3 la puerta de realismo como balanzas ============
  // Una balanza por medida: en un plato lo real (ámbar), en el otro tu modelo (cian). Se inclina hacia lo que pesa más y se
  // pone verde cuando la diferencia cabe en el umbral de la tesis (0.5 mag en el pico, factor 2 en lo demás).
  function Balanzas(cv) {
    let filas = [], ang = [];
    const poner = f => { filas = f; if (ang.length !== f.length) ang = f.map(() => 0); };
    function dibujar(dt) {
      const { g, w, h } = H.lienzo(cv);
      H.pintarFondo(g, w, h, [], ['#070b1a', '#03040b']);
      if (!filas.length) { g.fillStyle = '#aab3d0'; g.font = '12px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('simula tu modelo para pesarlo contra lo real', w / 2, h / 2); return; }
      const n = filas.length, cols = w < 520 ? 2 : 4, filasG = Math.ceil(n / cols), cw = w / cols, ch = h / filasG;
      filas.forEach((f, i) => {
        const cx = (i % cols + 0.5) * cw, cy = (Math.floor(i / cols) + 0.5) * ch + 6, L = Math.min(cw * 0.36, 70);
        const d = Math.max(-1.6, Math.min(1.6, f.dif)), meta = -d * 0.32;
        ang[i] += (meta - ang[i]) * Math.min(1, dt * 4);
        const a = ang[i], col = f.ok ? '#6ee7a0' : '#ff6b6b';
        g.strokeStyle = 'rgba(200,215,240,0.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, cy - 4); g.lineTo(cx, cy + ch * 0.32); g.stroke();
        g.fillStyle = 'rgba(200,215,240,0.6)'; g.beginPath(); g.moveTo(cx - 10, cy + ch * 0.32); g.lineTo(cx + 10, cy + ch * 0.32); g.lineTo(cx, cy + ch * 0.32 - 8); g.fill();
        const xl = cx - L * Math.cos(a), yl = cy - L * Math.sin(a), xr = cx + L * Math.cos(a), yr = cy + L * Math.sin(a);
        g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); g.moveTo(xl, yl); g.lineTo(xr, yr); g.stroke();
        for (const [x, y, c, v] of [[xl, yl, '#ffb84d', f.r], [xr, yr, '#5ad1ff', f.s]]) {
          g.strokeStyle = 'rgba(200,215,240,0.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 12, y + 16); g.moveTo(x, y); g.lineTo(x + 12, y + 16); g.stroke();
          g.fillStyle = c; g.fillRect(x - 15, y + 16, 30, 4);
          g.font = '11px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'top'; g.fillText(Number.isFinite(v) ? v.toFixed(1) : '–', x, y + 23);
        }
        g.fillStyle = '#e8ecf8'; g.textBaseline = 'alphabetic'; V.escribir(g, f.nom, cx, cy - ch * 0.3, 11, 'center');
        g.fillStyle = col; g.font = '14px system-ui, sans-serif'; g.textAlign = 'center'; g.fillText(f.ok ? '✓' : '✗', cx, cy - 10);
      });
      g.font = '10px system-ui, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'bottom';
      g.fillStyle = '#ffb84d'; g.fillText('■ real', 8, h - 4); g.fillStyle = '#5ad1ff'; g.fillText('■ tu modelo', 56, h - 4);
    }
    return { poner, dibujar };
  }

  // ============ 3.3 la receta, a la vista ============
  // Supernovas simuladas de un bin: x = su z dentro del bin, y = su magnitud en el pico. La línea es el m50: las de arriba
  // (más brillantes) se encuentran. Cada ingrediente de la receta mueve los puntos: z al centro los junta en el medio, el brillo
  // propio de la plantilla les quita la dispersión de la LF, sin polvo suben las enrojecidas, y la cola deja encontrar algunas
  // de las de abajo (con la probabilidad de la ec. 1, su transparencia).
  function Receta(cv) {
    let pts = [], z1 = 0, z2 = 1, m50 = 23.4, ec = null, cola = false;
    const poner = ({ puntos, bin, m50: m, DE }) => { z1 = bin[0]; z2 = bin[1]; m50 = m; ec = DE; pts = puntos.map(q => ({ ...q, x: q.z, y: q.m, tx: q.z, ty: q.m })); };
    const receta = (r, objetivo) => { cola = r.cola; pts.forEach((q, i) => { q.tx = objetivo[i].z; q.ty = objetivo[i].m; }); };
    function dibujar(dt) {
      const { g, w, h } = H.lienzo(cv);
      H.pintarFondo(g, w, h, [], ['#070b1a', '#03040b']);
      if (!pts.length) return null;
      const mg = { i: 46, d: 14, s: 30, a: 36 }, y0 = m50 - 3.2, y1 = m50 + 1.8;
      const px = z => mg.i + (w - mg.i - mg.d) * (z - z1) / (z2 - z1), py = m => mg.s + (h - mg.s - mg.a) * (m - y0) / (y1 - y0);
      g.strokeStyle = 'rgba(160,175,210,0.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(mg.i, mg.s); g.lineTo(mg.i, h - mg.a); g.lineTo(w - mg.d, h - mg.a); g.stroke();
      g.fillStyle = 'rgba(200,215,240,0.85)'; g.font = '10px system-ui, sans-serif';
      g.textAlign = 'right'; g.textBaseline = 'middle'; for (let m = Math.ceil(y0); m <= y1; m++) g.fillText(m, mg.i - 5, py(m));
      g.textAlign = 'center'; g.textBaseline = 'top'; for (let k = 0; k <= 4; k++) { const z = z1 + (z2 - z1) * k / 4; g.fillText(z.toFixed(2), px(z), h - mg.a + 4); }
      g.fillText('z de la supernova (dentro del bin)', (mg.i + w - mg.d) / 2, h - mg.a + 18);
      g.save(); g.translate(12, (mg.s + h - mg.a) / 2); g.rotate(-Math.PI / 2); g.fillText('magnitud en el pico (más brillante arriba)', 0, 0); g.restore();
      // la zona de encontradas y el m50
      g.fillStyle = 'rgba(110,231,160,0.06)'; g.fillRect(mg.i, mg.s, w - mg.i - mg.d, py(m50) - mg.s);
      if (cola) { const gr = g.createLinearGradient(0, py(m50), 0, py(m50 + 1)); gr.addColorStop(0, 'rgba(255,184,77,0.18)'); gr.addColorStop(1, 'rgba(255,184,77,0)'); g.fillStyle = gr; g.fillRect(mg.i, py(m50), w - mg.i - mg.d, py(m50 + 1) - py(m50)); }
      g.strokeStyle = '#5ad1ff'; g.setLineDash([6, 4]); g.lineWidth = 1.5; g.beginPath(); g.moveTo(mg.i, py(m50)); g.lineTo(w - mg.d, py(m50)); g.stroke(); g.setLineDash([]);
      g.fillStyle = '#5ad1ff'; g.textAlign = 'right'; g.textBaseline = 'bottom'; g.fillText(cola ? 'm50: con la cola, algunas de abajo también' : 'm50: más débil que esto no se encuentra', w - mg.d, py(m50) - 3);
      let enc = 0;
      g.globalCompositeOperation = 'lighter';
      for (const q of pts) {
        q.x += (q.tx - q.x) * Math.min(1, dt * 3); q.y += (q.ty - q.y) * Math.min(1, dt * 3);
        const p = ec(q.ty, cola), x = px(q.x), y = py(Math.max(y0, Math.min(y1, q.y)));
        enc += p;
        H.luz(g, x, y, 7, p > 0.5 ? '110,231,160' : p > 0 ? '255,184,77' : '150,160,190', 0.25 + 0.65 * Math.max(p, 0.15));
      }
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = '#e8ecf8'; g.font = '12px system-ui, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'top';
      g.fillText(`encontradas (en promedio): ${enc.toFixed(0)} de ${pts.length}: la exposición A es proporcional a esto`, mg.i + 4, 6);
      return enc;
    }
    return { poner, receta, dibujar };
  }

  // ============ 3.3 los diales: A tuya / A del paper, un dial por bin ============
  // Escala logarítmica de 0.25 a 4. La zona verde es tu criterio: se fija antes de comparar (el candado).
  function Diales(cv) {
    let crit = [0.5, 2], fijo = false, q = null, aguja = null, etiquetas = [];
    const poner = e => { if (e.crit) crit = e.crit; if ('fijo' in e) fijo = e.fijo; if (e.q) { q = e.q; if (!aguja) aguja = q.map(() => 1); } if (e.etiquetas) etiquetas = e.etiquetas; };
    function dibujar(dt) {
      const { g, w, h } = H.lienzo(cv);
      H.pintarFondo(g, w, h, [], ['#070b1a', '#03040b']);
      const n = Math.max(1, etiquetas.length), cols = w < 520 ? 2 : n, filas = Math.ceil(n / cols), cw = w / cols, ch = h / filas, R = Math.min(cw * 0.4, ch * 0.62);
      const ang = v => Math.PI + Math.PI * (Math.log2(Math.max(0.25, Math.min(4, v))) + 2) / 4; // 0.25 a la izquierda, 4 a la derecha
      etiquetas.forEach((et, i) => {
        const cx = (i % cols + 0.5) * cw, cy = (Math.floor(i / cols) + 1) * ch - 22;
        g.lineWidth = 10; g.strokeStyle = 'rgba(160,175,210,0.18)'; g.beginPath(); g.arc(cx, cy, R, Math.PI, 2 * Math.PI); g.stroke();
        g.strokeStyle = fijo ? 'rgba(110,231,160,0.85)' : 'rgba(110,231,160,0.4)'; g.beginPath(); g.arc(cx, cy, R, ang(crit[0]), ang(crit[1])); g.stroke();
        g.lineWidth = 1; g.fillStyle = 'rgba(200,215,240,0.8)'; g.font = '9px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        for (const v of [0.25, 0.5, 1, 2, 4]) { const a = ang(v); g.fillText(v, cx + (R + 14) * Math.cos(a), cy + (R + 14) * Math.sin(a)); }
        if (fijo) { // el candado
          const lx = cx + R * Math.cos(ang(Math.sqrt(crit[0] * crit[1]))) * 0.55, ly = cy + R * Math.sin(ang(Math.sqrt(crit[0] * crit[1]))) * 0.55;
          g.strokeStyle = '#6ee7a0'; g.lineWidth = 2; g.beginPath(); g.arc(lx, ly - 4, 4, Math.PI, 0); g.stroke(); g.fillStyle = '#6ee7a0'; g.fillRect(lx - 6, ly - 4, 12, 9);
        }
        if (q && aguja) {
          aguja[i] += (q[i] - aguja[i]) * Math.min(1, dt * 2.5);
          const a = ang(aguja[i]), dentro = q[i] >= crit[0] && q[i] <= crit[1];
          g.strokeStyle = dentro ? '#6ee7a0' : '#ff6b6b'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + R * 0.95 * Math.cos(a), cy + R * 0.95 * Math.sin(a)); g.stroke();
          g.fillStyle = '#e8ecf8'; g.font = '12px system-ui, sans-serif'; g.textBaseline = 'top'; g.fillText(q[i].toFixed(2), cx, cy + 6);
        }
        g.fillStyle = '#e8ecf8'; g.beginPath(); g.arc(cx, cy, 4, 0, 7); g.fill();
        g.textBaseline = 'alphabetic'; V.escribir(g, et, cx, cy - R - 22, 11, 'center');
      });
    }
    return { poner, dibujar };
  }

  return { Cono, Tamiz, Noche, Flujo, Combate, Cuadratura, Pizarra, Balanzas, Receta, Diales, torta, sprite, CL, RGB, facil };
})();
