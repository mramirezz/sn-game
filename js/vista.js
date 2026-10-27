// Las vistas de los instrumentos: el ocular del telescopio, el cubo de universo y el campo del survey.
// Se dibujan a la resolución de la pantalla, con brillo aditivo. Colores con significado, iguales en la ecuación:
// N (las supernovas) en ámbar, T (el tiempo) en cian y V (el volumen) en verde.
const Vista = (() => {
  const U = Universo;
  const C = { N: '#ffb84d', T: '#5ad1ff', V: '#6ee7a0' };

  // Ajusta el canvas a su tamaño en pantalla (solo si cambió) y deja el contexto en píxeles CSS.
  function lienzo(cv) {
    const dpr = Math.min(2, window.devicePixelRatio || 1), r = cv.getBoundingClientRect();
    const w = Math.max(10, Math.round(r.width)), h = Math.max(10, Math.round(r.height));
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { g, w, h, dpr };
  }
  // Un punto de luz difusa (se suma a lo de abajo).
  function luz(g, x, y, r, rgb, a) {
    if (a <= 0.003 || r <= 0) return;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(0.35, `rgba(${rgb},${a * 0.35})`); gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  // Una supernova: destello blanco, halo ámbar, anillo que se expande y rayos en cruz. a va de 0 (recién) a 1 (apagada).
  function supernova(g, x, y, a, k = 1) {
    const b = 1 - a;
    g.globalCompositeOperation = 'lighter';
    luz(g, x, y, (10 + 34 * Math.sqrt(a)) * k, '255,190,110', 0.9 * b);
    luz(g, x, y, (3 + 6 * b) * k, '255,255,255', b);
    g.strokeStyle = `rgba(255,184,77,${0.85 * b})`; g.lineWidth = 1.5;
    g.beginPath(); g.arc(x, y, (5 + 30 * a) * k, 0, 7); g.stroke();
    const L = (8 + 22 * b) * k;
    g.strokeStyle = `rgba(255,240,210,${0.75 * b})`; g.lineWidth = 1;
    g.beginPath(); g.moveTo(x - L, y); g.lineTo(x + L, y); g.moveTo(x, y - L); g.lineTo(x, y + L); g.stroke();
    g.globalCompositeOperation = 'source-over';
  }
  // Escribe en el canvas con los tipos de supernova (Ia, II...) en letra con serifas, como en el resto del juego.
  const TIPO = /(?<![A-Za-zÀ-ÿ0-9])(II(?:n|b|P|L)?|I(?:a|b\/c|bc|b|c)|(?<=SUDARE\s)I)(?![A-Za-zÀ-ÿ0-9])/; // la I sola solo tras SUDARE: en inglés es el pronombre
  function escribir(g, txt, x, y, tam = 12, alin = 'left') {
    const trozos = txt.split(new RegExp(TIPO.source, 'g')).map((t, i) => ({ t, serif: i % 2 === 1 }));
    const fuente = tr => `${tam}px ${tr.serif ? "'Noto Serif', Georgia, serif" : 'system-ui, sans-serif'}`;
    const ancho = trozos.reduce((s, tr) => { g.font = fuente(tr); return s + g.measureText(tr.t).width; }, 0);
    let px = alin === 'right' ? x - ancho : alin === 'center' ? x - ancho / 2 : x;
    g.textAlign = 'left';
    for (const tr of trozos) { g.font = fuente(tr); g.fillText(tr.t, px, y); px += g.measureText(tr.t).width; }
  }
  function cieloDeFondo(rand, n) {
    return [...Array(n)].map(() => ({ x: rand(), y: rand(), a: 0.15 + 0.6 * rand() ** 3, r: rand() < 0.05 ? 1.2 : 0.7 }));
  }
  function pintarFondo(g, w, h, estrellas, tono = ['#060a1c', '#02030a']) {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, tono[0]); gr.addColorStop(1, tono[1]);
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (const s of estrellas) { g.fillStyle = `rgba(220,230,255,${s.a})`; g.fillRect(s.x * w, s.y * h, s.r, s.r); }
  }
  // Una regla de tiempo: barra que se llena, marcas cada cierto tramo y una marca ámbar por supernova.
  function regla(g, x0, x1, y, { T, Tmax, paso, unidad, marcas }) {
    const px = t => x0 + (x1 - x0) * Math.min(1, t / Tmax);
    g.fillStyle = 'rgba(90,209,255,0.15)'; g.fillRect(x0, y - 4, x1 - x0, 8);
    g.fillStyle = C.T; g.fillRect(x0, y - 4, px(T) - x0, 8);
    g.font = '10px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'top'; g.fillStyle = 'rgba(200,215,240,0.8)';
    for (let t = 0; t <= Tmax + 1e-9; t += paso) { g.fillRect(px(t) - 0.5, y + 5, 1, 4); g.fillText(`${Math.round(t)}${unidad}`, px(t), y + 10); }
    for (const t of marcas) { g.fillStyle = C.N; g.fillRect(px(t) - 1, y - 11, 2, 7); }
  }

  // ---------- 0.1: una galaxia en el ocular ----------
  function Galaxia(cv) {
    const r = U.rng(23), estrellas = [], fondo = cieloDeFondo(U.rng(5), 220);
    for (let k = 0; k < 2600; k++) {
      const brazo = r() < 0.5 ? 0 : Math.PI, th = r() * 2.7 * Math.PI, rad = 0.05 * Math.exp(0.34 * th);
      const d = (r() - 0.5) * (0.03 + rad * 0.25), joven = rad > 0.2 && r() < 0.5;
      estrellas.push({ rad: rad + d, ang: th + brazo + (r() - 0.5) * 0.3, a: 0.25 + 0.6 * r(),
        rgb: rad < 0.16 ? '255,226,170' : joven ? '150,190,255' : '220,215,255', s: r() < 0.04 ? 1.8 : 1 });
    }
    for (let k = 0; k < 40; k++) { // regiones de formación estelar, rosadas, en los brazos
      const brazo = r() < 0.5 ? 0 : Math.PI, th = 1.5 + r() * 5.5, rad = 0.05 * Math.exp(0.34 * th);
      estrellas.push({ rad, ang: th + brazo, a: 0.5, rgb: '255,120,170', s: 2.2, hii: true });
    }
    const geo = (w, h) => ({ cx: w / 2, cy: h * 0.44, R: Math.min(w * 0.46, h * 0.42) });
    const pos = (s, w, h, t) => {
      const { cx, cy, R } = geo(w, h), a = s.ang + t * 0.004, x = Math.cos(a) * s.rad, y = Math.sin(a) * s.rad * 0.5;
      const inc = -0.4; // el disco inclinado
      return [cx + R * 1.05 * (x * Math.cos(inc) - y * Math.sin(inc)), cy + R * 1.05 * (x * Math.sin(inc) + y * Math.cos(inc))];
    };
    function dibujar(t, { T, explosiones, marcas }) {
      const { g, w, h } = lienzo(cv), { cx, cy, R } = geo(w, h);
      pintarFondo(g, w, h, fondo);
      g.globalCompositeOperation = 'lighter';
      // el disco y el bulbo como luz difusa
      g.save(); g.translate(cx, cy); g.rotate(-0.4); g.scale(1, 0.5);
      luz(g, 0, 0, R * 1.0, '120,140,230', 0.35); luz(g, 0, 0, R * 0.4, '255,215,160', 0.6); luz(g, 0, 0, R * 0.13, '255,240,210', 0.95);
      g.restore();
      for (const s of estrellas) {
        const [x, y] = pos(s, w, h, t);
        if (s.hii) luz(g, x, y, 3 * s.s, s.rgb, 0.35);
        else { g.fillStyle = `rgba(${s.rgb},${Math.min(1, 1.3 * s.a) * (0.85 + 0.15 * Math.sin(t * 3 + s.ang * 40))})`; g.fillRect(x - 0.6, y - 0.6, 1.3 * s.s, 1.3 * s.s); }
      }
      g.globalCompositeOperation = 'source-over';
      for (const e of explosiones) { const [x, y] = pos(estrellas[e.i], w, h, t); supernova(g, x, y, e.a, Math.max(0.8, R / 160)); }
      // el ocular: todo lo de afuera del círculo es negro, con un borde de bronce
      g.fillStyle = '#000'; g.beginPath(); g.rect(0, 0, w, h); g.moveTo(cx + R, cy); g.arc(cx, cy, R, 0, 2 * Math.PI, true); g.fill('evenodd');
      const vi = g.createRadialGradient(cx, cy, R * 0.75, cx, cy, R);
      vi.addColorStop(0, 'rgba(0,0,0,0)'); vi.addColorStop(1, 'rgba(0,0,0,0.65)');
      g.fillStyle = vi; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
      g.strokeStyle = '#8a6a3a'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, R + 1.5, 0, 7); g.stroke();
      // la regla de los años, con una marca por supernova
      const Tmax = Math.max(300, Math.ceil(T / 100 + 0.4) * 100);
      regla(g, w * 0.08, w * 0.92, h - 26, { T, Tmax, paso: 100, unidad: Lg(' a', ' yr'), marcas });
      g.textAlign = 'left'; g.textBaseline = 'top'; g.font = '12px system-ui, sans-serif';
      g.fillStyle = C.N; g.fillText(`N = ${marcas.length} ${Lg('supernovas', marcas.length === 1 ? 'supernova' : 'supernovae')}`, 10, 10);
      g.textAlign = 'right'; g.fillStyle = C.T; g.fillText(`T = ${Math.round(T)} ${Lg('años', 'years')}`, w - 10, 10);
    }
    return { dibujar, n: estrellas.length };
  }

  // ---------- 0.2: un cubo de universo ----------
  function Cubo(cv, semilla = 9) {
    const r = U.rng(semilla), gal = [], fondo = cieloDeFondo(U.rng(semilla + 1), 160);
    for (let k = 0; k < 650; k++) {
      // galaxias agrupadas en filamentos suaves: centro al azar más un desvío
      const x = r() * 2 - 1, y = r() * 2 - 1, z = r() * 2 - 1;
      gal.push({ x, y, z, tam: 0.6 + 2.2 * r() ** 3, ang: r() * Math.PI, el: 0.35 + 0.6 * r(), rgb: r() < 0.35 ? '255,225,180' : '170,195,255' });
    }
    let yaw = 0.7, pitch = -0.38, arrastre = null;
    cv.style.touchAction = 'pan-y';
    cv.addEventListener('pointerdown', e => { arrastre = { x: e.clientX, y: e.clientY, yaw, pitch }; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', e => {
      if (!arrastre) return;
      yaw = arrastre.yaw + (e.clientX - arrastre.x) * 0.01;
      pitch = Math.max(-1.2, Math.min(1.2, arrastre.pitch + (e.clientY - arrastre.y) * 0.006));
    });
    ['pointerup', 'pointercancel'].forEach(ev => cv.addEventListener(ev, () => { arrastre = null; }));
    const VERT = [-1, 1].flatMap(x => [-1, 1].flatMap(y => [-1, 1].map(z => [x, y, z])));
    const ARISTAS = [];
    VERT.forEach((a, i) => VERT.forEach((b, j) => { if (j > i && a.filter((v, k) => v !== b[k]).length === 1) ARISTAS.push([i, j]); }));
    // prof: de 0 (el cielo como lo ve el telescopio, sin profundidad) a 1 (el mapa en 3D, con la distancia de cada galaxia)
    function dibujar(dt, { T, explosiones, marcas, prof = 1, rotulo = '' }) {
      if (!arrastre) yaw += dt * 0.15;
      if (prof < 1 && !arrastre) { yaw = 0.7 * prof; pitch = -0.38 * prof; } // el cielo de frente, como por el telescopio; el cubo gira a medida que aparece la profundidad
      const { g, w, h } = lienzo(cv), alto = h - 44, cx = w / 2, cy = alto * 0.52, f = Math.min(w, alto) * 0.95, D = 4.2; // abajo queda la regla del tiempo
      const cy0 = Math.cos(yaw), sy0 = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      const proy = ([x, y, z]) => {
        const x1 = x * cy0 + z * sy0, z1 = -x * sy0 + z * cy0;
        const y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp + D;
        return [cx + f * x1 / z2, cy + f * y2 / z2, z2, f / z2];
      };
      pintarFondo(g, w, h, fondo);
      const P = VERT.map(proy);
      // caras traseras primero, translúcidas
      const CARAS = [[0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5]];
      CARAS.map(c => ({ c, z: c.reduce((s, i) => s + P[i][2], 0) / 4 })).sort((a, b) => b.z - a.z).forEach(({ c, z }) => {
        g.fillStyle = `rgba(110,231,160,${z > D ? 0.025 : 0.05})`;
        g.beginPath(); c.forEach((i, k) => k ? g.lineTo(P[i][0], P[i][1]) : g.moveTo(P[i][0], P[i][1])); g.closePath(); g.fill();
      });
      const atras = ([i, j]) => (P[i][2] + P[j][2]) / 2 > D + 0.25;
      g.lineWidth = 1; g.setLineDash([4, 4]); g.strokeStyle = 'rgba(110,231,160,0.25)';
      ARISTAS.filter(atras).forEach(([i, j]) => { g.beginPath(); g.moveTo(P[i][0], P[i][1]); g.lineTo(P[j][0], P[j][1]); g.stroke(); });
      g.setLineDash([]);
      // galaxias, de la más lejana a la más cercana
      const vis = gal.map((s, i) => { const p = proy([s.x, s.y, s.z * prof]); return { s, i, p }; }).sort((a, b) => b.p[2] - a.p[2]);
      g.globalCompositeOperation = 'lighter';
      for (const { s, p } of vis) {
        const k = p[3] / (f / D), a = Math.min(1, 0.35 + 0.65 * (D + 1 - p[2]) / 2);
        g.save(); g.translate(p[0], p[1]); g.rotate(s.ang); g.scale(1, s.el);
        luz(g, 0, 0, 3.5 * s.tam * k, s.rgb, 0.55 * a); g.restore();
      }
      g.globalCompositeOperation = 'source-over';
      // aristas delanteras, verdes con brillo: el volumen V
      g.save(); g.shadowColor = C.V; g.shadowBlur = 8; g.strokeStyle = C.V; g.lineWidth = 1.6;
      ARISTAS.filter(a => !atras(a)).forEach(([i, j]) => { g.beginPath(); g.moveTo(P[i][0], P[i][1]); g.lineTo(P[j][0], P[j][1]); g.stroke(); });
      g.restore();
      for (const e of explosiones) { const s = gal[e.i], p = proy([s.x, s.y, s.z * prof]); supernova(g, p[0], p[1], e.a, 0.6 + 0.6 * p[3] / (f / D)); }
      // el rótulo achica la letra si no cabe a lo ancho (teléfono)
      if (rotulo) { g.font = '13px system-ui, sans-serif'; const tam = Math.max(9, Math.min(13, Math.floor(13 * (w - 24) / g.measureText(rotulo).width))); g.font = `${tam}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'bottom'; g.fillStyle = 'rgba(3,4,11,0.75)';
        const an = g.measureText(rotulo).width + 16; g.fillRect(cx - an / 2, alto - 26, an, 22); g.fillStyle = '#e8ecf8'; g.fillText(rotulo, cx, alto - 9); }
      // las tres medidas del cubo, en las aristas más cercanas que bajan, van a lo ancho y a lo hondo
      const cerca = VERT.map((v, i) => i).sort((a, b) => P[a][2] - P[b][2])[0];
      g.font = '11px system-ui, sans-serif'; g.fillStyle = C.V; g.textAlign = 'center'; g.textBaseline = 'middle';
      ARISTAS.filter(([i, j]) => i === cerca || j === cerca).forEach(([i, j]) => {
        const mx = (P[i][0] + P[j][0]) / 2, my = (P[i][1] + P[j][1]) / 2, dx = mx - cx, dy = my - cy, n = Math.hypot(dx, dy) || 1;
        g.fillText('100 Mpc', mx + dx / n * 22, my + dy / n * 14);
      });
      g.textAlign = 'left'; g.textBaseline = 'top'; g.font = '12px system-ui, sans-serif';
      g.fillStyle = C.V; g.fillText('V = (100 Mpc)³ = 10⁶ Mpc³', 10, 10);
      g.fillStyle = C.N; escribir(g, `N = ${marcas.length} Ia`, w - 10, 10, 12, 'right');
      regla(g, w * 0.08, w * 0.92, h - 26, { T, Tmax: 365, paso: 73, unidad: ' d', marcas });
      g.textAlign = 'left'; g.textBaseline = 'bottom'; g.fillStyle = C.T; g.fillText(`T = ${Math.round(T)} ${Lg('días', 'days')}`, w * 0.08, h - 34);
    }
    return { dibujar, n: gal.length };
  }

  // ---------- 0.3: repetir el universo ----------
  // Izquierda: cada universo observado cae como una ficha en la columna de su N (el histograma se arma solo).
  // Derecha: la tasa de cada universo con su barra de Gehrels a 1σ, la más nueva arriba. Al revelar la verdad,
  // las barras que la contienen se ponen verdes y las que no, rojas.
  function Repetir(cv) {
    const fichas = []; // { i: índice del universo, t0: cuándo empieza a caer }
    const CAIDA = 0.55;
    function agregar(desde, hasta, t) {
      const n = hasta - desde, paso = n > 1 ? Math.min(0.09, 1.6 / n) : 0;
      for (let i = desde; i < hasta; i++) fichas.push({ i, t0: t + (i - desde) * paso });
    }
    function dibujar(t, { cuentas, lam, kRate, revelada, poisson, gehrels }) {
      const { g, w, h } = lienzo(cv);
      pintarFondo(g, w, h, [], ['#070b1a', '#03040b']);
      const vertical = w < 520;
      const A = vertical ? { x0: 40, x1: w - 12, y0: 26, y1: h * 0.5 - 26 } : { x0: 42, x1: w * 0.55 - 12, y0: 30, y1: h - 36 };
      const B = vertical ? { x0: 12, x1: w - 12, y0: h * 0.5 + 22, y1: h - 30 } : { x0: w * 0.55 + 14, x1: w - 14, y0: 30, y1: h - 36 };
      const cae = new Map(fichas.filter(f => t < f.t0 + CAIDA).map(f => [f.i, f]));
      const nmax = Math.max(12, ...cuentas) + 1, cw = (A.x1 - A.x0) / (nmax + 1), xk = k => A.x0 + (k + 0.5) * cw;
      const hist = Array(nmax + 1).fill(0);
      cuentas.forEach((k, i) => { if (!cae.has(i)) hist[k]++; });
      const fact = k => { let f = 1; for (let i = 2; i <= k; i++) f *= i; return f; };
      const pmf = hist.map((_, k) => cuentas.length * Math.exp(-lam) * lam ** k / fact(k));
      const hmax = Math.max(4, ...hist, ...(poisson ? pmf : [0])) * 1.15, yv = v => A.y1 - (A.y1 - A.y0) * v / hmax;
      // ejes del histograma
      g.strokeStyle = 'rgba(160,175,210,0.5)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(A.x0, A.y0); g.lineTo(A.x0, A.y1); g.lineTo(A.x1, A.y1); g.stroke();
      g.fillStyle = 'rgba(200,215,240,0.85)'; g.font = '10px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'top';
      for (let k = 0; k <= nmax; k += nmax > 16 ? 2 : 1) g.fillText(k, xk(k), A.y1 + 4);
      g.fillStyle = C.N; escribir(g, Lg('N: cuántas Ia contaste en un universo', 'N: how many Ia you counted in one universe'), (A.x0 + A.x1) / 2, A.y1 + 17, 11, 'center');
      g.save(); g.translate(12, (A.y0 + A.y1) / 2); g.rotate(-Math.PI / 2); g.fillStyle = 'rgba(200,215,240,0.85)'; g.textAlign = 'center'; g.fillText(Lg('universos', 'universes'), 0, 0); g.restore();
      // barras: una fila de fichas apiladas, para que se vea que cada universo es un bloque
      const fh = (A.y1 - A.y0) / hmax;
      hist.forEach((n, k) => {
        for (let j = 0; j < n; j++) {
          g.fillStyle = j % 2 ? 'rgba(255,184,77,0.85)' : 'rgba(255,200,110,0.95)';
          g.fillRect(xk(k) - cw * 0.38, A.y1 - (j + 1) * fh + 0.5, cw * 0.76, Math.max(1, fh - 1));
        }
      });
      if (poisson) { // lo que predice Poisson con la media verdadera
        g.fillStyle = C.T;
        pmf.forEach((v, k) => { g.beginPath(); g.arc(xk(k), yv(v), 3, 0, 7); g.fill(); });
        g.textAlign = 'right'; g.textBaseline = 'top'; g.font = '10px system-ui, sans-serif'; g.fillText(Lg('• lo que predice Poisson', '• what Poisson predicts'), A.x1, A.y0 - 16);
      }
      if (revelada) {
        const x = A.x0 + (lam + 0.5) * cw;
        g.strokeStyle = '#b48cff'; g.setLineDash([5, 4]); g.lineWidth = 2; g.beginPath(); g.moveTo(x, A.y0); g.lineTo(x, A.y1); g.stroke(); g.setLineDash([]);
        g.fillStyle = '#b48cff'; g.textAlign = 'left'; g.textBaseline = 'top'; g.font = '11px system-ui, sans-serif';
        g.fillText(`${Lg('media verdadera', 'true mean')} λ = ${lam.toFixed(2)}`, Math.min(x + 4, A.x1 - 130), A.y0);
      }
      // fichas cayendo: un cubito con su N
      for (const f of cae.values()) {
        const k = cuentas[f.i], u = Math.max(0, Math.min(1, (t - f.t0) / CAIDA)), ypos = A.y0 - 6 + (yv(hist[k] + 0.5) - A.y0 + 6) * u * u;
        if (t < f.t0) continue;
        g.fillStyle = '#ffe2a8'; g.fillRect(xk(k) - cw * 0.38, ypos - fh / 2, cw * 0.76, Math.max(2, fh - 1));
        if (fichas.length < 30) { g.fillStyle = '#1a1205'; g.font = '10px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(k, xk(k), ypos); }
      }
      // derecha: la tasa de cada universo con su barra de error (las últimas 20)
      const filas = cuentas.map((k, i) => ({ k, i })).filter(f => !cae.has(f.i)).slice(-20).reverse();
      const verdad = lam * kRate;
      const xmax = Math.max(verdad * 2.2, ...filas.map(f => gehrels(f.k).hi * kRate)) * 1.05;
      const xr = v => B.x0 + (B.x1 - B.x0) * v / xmax, fhB = (B.y1 - B.y0) / 20;
      g.strokeStyle = 'rgba(160,175,210,0.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(B.x0, B.y1); g.lineTo(B.x1, B.y1); g.stroke();
      g.fillStyle = 'rgba(200,215,240,0.85)'; g.font = '10px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'top';
      const pasoX = xmax > 2 ? 0.5 : xmax > 1 ? 0.25 : 0.1;
      for (let v = 0; v <= xmax; v += pasoX) g.fillText(v.toFixed(2), xr(v), B.y1 + 4);
      g.fillText(`${Lg('tasa de cada universo', 'rate of each universe')} [10⁻⁴ yr⁻¹ Mpc⁻³]`, (B.x0 + B.x1) / 2, B.y1 + 17);
      g.textBaseline = 'bottom'; g.fillText(Lg('la más nueva arriba, con su barra de 1σ', 'newest on top, with its 1σ bar'), (B.x0 + B.x1) / 2, B.y0 - 4);
      let dentro = 0;
      filas.forEach((f, r) => {
        const { lo, hi } = gehrels(f.k), y = B.y0 + (r + 0.5) * fhB, contiene = lam >= lo && lam <= hi;
        if (contiene) dentro++;
        g.strokeStyle = revelada ? (contiene ? '#6ee7a0' : '#ff6b6b') : C.N; g.lineWidth = 2;
        g.beginPath(); g.moveTo(xr(lo * kRate), y); g.lineTo(xr(hi * kRate), y); g.stroke();
        g.fillStyle = g.strokeStyle; g.beginPath(); g.arc(xr(f.k * kRate), y, 3, 0, 7); g.fill();
        if (r === 0 && cuentas.length <= 3) { // la asimetría de la barra, con números
          g.font = '10px system-ui, sans-serif'; g.textBaseline = 'middle'; g.fillStyle = '#e8ecf8';
          g.textAlign = 'right'; g.fillText(`−${((f.k - lo) * kRate).toFixed(2)}`, xr(lo * kRate) - 4, y);
          g.textAlign = 'left'; g.fillText(`+${((hi - f.k) * kRate).toFixed(2)}`, xr(hi * kRate) + 4, y);
        }
      });
      if (revelada) {
        g.strokeStyle = '#b48cff'; g.setLineDash([5, 4]); g.lineWidth = 2; g.beginPath(); g.moveTo(xr(verdad), B.y0); g.lineTo(xr(verdad), B.y1); g.stroke(); g.setLineDash([]);
        g.fillStyle = '#b48cff'; g.font = '11px system-ui, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'top';
        g.fillText(Lg('verdadera', 'true'), Math.min(xr(verdad) + 4, B.x1 - 60), B.y0);
      }
      return { dentro, filas: filas.length };
    }
    return { agregar, dibujar };
  }

  // ---------- la pantalla de inicio ----------
  // El cerro de noche con un paneo lento, estrellas que titilan, estrellas fugaces y, cada tanto, una supernova que ilumina
  // todo. En el camino, el astrónomo con su linterna mira el cielo. dibujar(t) devuelve el destello (0 a 1) para el título.
  function Titulo(cv) {
    const r = U.rng(42), est = [...Array(220)].map(() => ({ x: r(), y: r() * 0.55, a: 0.2 + 0.8 * r() ** 2, f: r() * 6.3, s: r() < 0.08 ? 2 : 1.2 }));
    const fondo = new Image(); fondo.src = 'assets/fondos/cerro.png';
    const atlas = new Image(); atlas.src = 'assets/sprites/astronomo_atlas.png';
    let prox = 2.5, sn = null, fugaz = null, proxF = 4;
    const SN = { x: 1010, y: 150 }; // dónde explota, en píxeles de la imagen del cerro (en la Vía Láctea)
    const XA_H = 1080, XA_V = 430; // dónde está el astrónomo en el camino (horizontal y vertical)
    function dibujar(t) {
      const { g, w, h } = lienzo(cv);
      g.fillStyle = '#02030a'; g.fillRect(0, 0, w, h);
      // el fondo: cubre la pantalla y se pasea despacio de lado a lado
      let a = (x, y) => [x, y], k = 1;
      if (fondo.complete && fondo.naturalWidth) {
        const iw = 1344, ih = 752; k = Math.max(w / iw, h / ih) * 1.12;
        // el paneo se mueve alrededor del astrónomo, para que siempre se vea (en vertical cabe poco del cerro)
        const sobra = iw * k - w, xa = (h > w ? XA_V : XA_H) * k, centro = Math.max(-sobra, Math.min(0, (h > w ? 0.62 : 0.74) * w - xa));
        const amp = Math.min(0.12 * w, centro + sobra, -centro), dx = centro + amp * Math.sin(t * 0.05), dy = (h - ih * k) * 0.55;
        a = (x, y) => [dx + x * k, dy + y * k];
        g.drawImage(fondo, dx, dy, iw * k, ih * k);
      }
      // la supernova: un destello que crece, ilumina el cielo y se apaga
      if (t > prox) { sn = { t0: t }; prox = t + 9 + 5 * r(); }
      let flash = 0;
      if (sn) { const u = (t - sn.t0) / 3.2; if (u >= 1) sn = null; else flash = u < 0.12 ? u / 0.12 : Math.exp(-(u - 0.12) * 4); }
      g.fillStyle = `rgba(2,3,10,${0.42 - 0.18 * flash})`; g.fillRect(0, 0, w, h); // la noche, que se aclara con el destello
      // estrellas que titilan
      for (const e of est) { g.fillStyle = `rgba(230,236,255,${e.a * (0.4 + 0.6 * Math.sin(t * 1.5 + e.f) ** 2)})`; g.fillRect(e.x * w, e.y * h, e.s, e.s); }
      // una estrella fugaz de vez en cuando
      if (t > proxF) { fugaz = { x: 0.15 + 0.6 * r(), y: 0.05 + 0.2 * r(), t0: t, ang: 0.35 + 0.3 * r() }; proxF = t + 5 + 6 * r(); }
      if (fugaz) { const u = (t - fugaz.t0) / 0.9; if (u >= 1) fugaz = null; else {
        const x0 = fugaz.x * w + u * w * 0.25 * Math.cos(fugaz.ang), y0 = fugaz.y * h + u * w * 0.25 * Math.sin(fugaz.ang), L = 70 * (1 - u);
        const gr = g.createLinearGradient(x0, y0, x0 - L * Math.cos(fugaz.ang), y0 - L * Math.sin(fugaz.ang)); gr.addColorStop(0, `rgba(255,255,255,${0.9 * (1 - u)})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.strokeStyle = gr; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 - L * Math.cos(fugaz.ang), y0 - L * Math.sin(fugaz.ang)); g.stroke(); } }
      if (sn) { const [x, y] = a(SN.x, SN.y); const u = (t - sn.t0) / 3.2;
        g.globalCompositeOperation = 'lighter'; luz(g, x, y, Math.max(w, h) * 0.45, '255,190,120', 0.25 * flash); g.globalCompositeOperation = 'source-over';
        supernova(g, x, y, u, Math.max(1.4, k * 2.2)); }
      // el astrónomo en el camino, quieto, mirando el cielo con su linterna
      const M = window.ANIM;
      if (M && atlas.complete && atlas.naturalWidth) {
        const c = M._celda, Q = M.quieto, i = Math.floor(t * 12) % Q.celdas.length, cel = Q.celdas[i], [px, py] = a(h > w ? XA_V : XA_H, 664), ks = k * 2;
        g.save(); g.translate(px, py); g.scale(ks, ks); g.imageSmoothingEnabled = false;
        g.fillStyle = 'rgba(0,0,0,0.45)'; g.beginPath(); g.ellipse(0, 0, 14, 3, 0, 0, 7); g.fill();
        g.drawImage(atlas, (cel % c.cols) * c.w, Math.floor(cel / c.cols) * c.h, c.w, c.h, -c.torsoX, -c.pieY, c.w, c.h);
        g.restore();
        const ll = Q.llama[i];
        if (ll) { const lx = px + (ll[0] - c.torsoX) * ks, ly = py + (ll[1] - c.pieY) * ks; g.globalCompositeOperation = 'lighter'; luz(g, lx, ly, 70 * ks / 2, '255,190,110', 0.55 + 0.08 * Math.sin(t * 9)); g.globalCompositeOperation = 'source-over'; }
      }
      return flash;
    }
    return { dibujar };
  }

  // ---------- el campo del survey (temporada y niebla) ----------
  const fondos = new Map();
  function fondoCampo(semilla, cv, w, h, dpr) {
    const key = `${semilla}:${cv.width}x${cv.height}`;
    if (fondos.has(key)) return fondos.get(key);
    const b = document.createElement('canvas'); b.width = cv.width; b.height = cv.height;
    const g = b.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const r = U.rng(semilla);
    pintarFondo(g, w, h, cieloDeFondo(r, 260), ['#04060f', '#02030a']);
    g.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 90; k++) { // galaxias del campo: manchas elípticas, unas pocas grandes
      const x = r() * w, y = r() * h, tam = 2 + 9 * r() ** 4;
      g.save(); g.translate(x, y); g.rotate(r() * Math.PI); g.scale(1, 0.3 + 0.6 * r());
      luz(g, 0, 0, tam * 2.2, r() < 0.4 ? '255,220,170' : '160,185,255', 0.5); luz(g, 0, 0, tam * 0.5, '255,250,235', 0.6);
      g.restore();
    }
    if (fondos.size > 8) fondos.clear();
    fondos.set(key, b);
    return b;
  }
  const RGB = c => { const n = parseInt(c.slice(1), 16); return `${n >> 16},${(n >> 8) & 255},${n & 255}`; };
  function campo(cv, { semilla = 77, sn = [], nube = false, t = 0 } = {}) {
    const { g, w, h, dpr } = lienzo(cv);
    g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(fondoCampo(semilla, cv, w, h, dpr), 0, 0); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.globalCompositeOperation = 'lighter';
    for (const s of sn) {
      const x = s.x * w, y = s.y * h, b = s.brillo ?? 1, rgb = RGB(s.color || '#6ee7a0');
      luz(g, x, y, 12 * b + 3, rgb, 0.8 * b); luz(g, x, y, 3, '255,255,255', 0.9 * b);
    }
    g.globalCompositeOperation = 'source-over';
    for (const s of sn) { g.fillStyle = s.color || '#6ee7a0'; g.globalAlpha = 0.5 + 0.5 * (s.brillo ?? 1); g.beginPath(); g.arc(s.x * w, s.y * h, 2.2, 0, 7); g.fill(); }
    g.globalAlpha = 1;
    if (nube) { // noche nublada: nubes que tapan el campo
      const r = U.rng(Math.floor(t * 2) + 3);
      for (let k = 0; k < 9; k++) {
        const x = r() * w, y = r() * h;
        g.save(); g.translate(x, y); g.scale(2.2, 1);
        const gr = g.createRadialGradient(0, 0, 0, 0, 0, h * 0.25);
        gr.addColorStop(0, 'rgba(150,160,190,0.55)'); gr.addColorStop(1, 'rgba(150,160,190,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(0, 0, h * 0.25, 0, 7); g.fill(); g.restore();
      }
    }
  }

  return { Galaxia, Cubo, Repetir, Titulo, campo, escribir, C, h: { lienzo, luz, supernova, regla, pintarFondo, cieloDeFondo, escribir } };
})();
