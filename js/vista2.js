// Vistas de los capítulos 2 a 7. Usa las herramientas de vista.js (luz, supernovas, reglas) y los mismos colores con
// significado; las clases de supernova tienen su color propio (CL).
const Vista2 = (() => {
  const { lienzo, luz, supernova, escribir } = Vista.h;
  const F = Fisica;
  const CL = { Ia: '#ffd166', II: '#f0605d', Ibc: '#4cc9f0', IIn: '#c77dff' };
  const CLASES = ['Ia', 'II', 'Ibc', 'IIn'];
  const fondo = (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#070b1a'); gr.addColorStop(1, '#03040b'); g.fillStyle = gr; g.fillRect(0, 0, w, h); };
  const texto = (g, t, x, y, { tam = 11, color = 'rgba(210,220,240,0.9)', alin = 'left', base = 'alphabetic' } = {}) => {
    g.fillStyle = color; g.textBaseline = base; escribir(g, t, x, y, tam, alin);
  };

  // ---------- dos tortas: las que explotaron contra las que se encontraron ----------
  function tortas(cv, { A, B, titulos = ['Explotaron', 'Encontraste'] }) {
    const { g, w, h } = lienzo(cv);
    fondo(g, w, h);
    const vertical = w < 480, R = vertical ? Math.min(w * 0.26, h * 0.17) : Math.min(w * 0.15, h * 0.3);
    const centros = vertical ? [[w / 2, h * 0.27], [w / 2, h * 0.75]] : [[w * 0.27, h * 0.5], [w * 0.73, h * 0.5]];
    [A, B].forEach((cuenta, k) => {
      const [cx, cy] = centros[k], tot = CLASES.reduce((s, c) => s + (cuenta[c] || 0), 0);
      let a0 = -Math.PI / 2;
      g.fillStyle = 'rgba(255,255,255,0.05)'; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
      for (const c of CLASES) {
        const f = tot ? (cuenta[c] || 0) / tot : 0, a1 = a0 + f * 2 * Math.PI;
        if (f > 0) {
          g.fillStyle = CL[c]; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, a0, a1); g.closePath(); g.fill();
          if (f > 0.04) {
            const am = (a0 + a1) / 2, rx = cx + Math.cos(am) * R * 1.22, ry = cy + Math.sin(am) * R * 1.22;
            texto(g, `${c} ${(100 * f).toFixed(0)} %`, rx, ry, { tam: 12, color: CL[c], alin: 'center', base: 'middle' });
          }
        }
        a0 = a1;
      }
      g.fillStyle = '#070b1a'; g.beginPath(); g.arc(cx, cy, R * 0.55, 0, 7); g.fill();
      texto(g, `${tot}`, cx, cy - 2, { tam: 18, color: '#e8ecf8', alin: 'center', base: 'middle' });
      texto(g, 'supernovas', cx, cy + 15, { tam: 10, alin: 'center', base: 'middle' });
      texto(g, titulos[k], cx, Math.max(14, cy - R - 42), { tam: 13, color: k ? '#6ee7a0' : '#e8ecf8', alin: 'center', base: 'middle' });
    });
  }

  // ---------- el sesgo de Malmquist: brillo contra distancia, con el límite ----------
  function malmquist(cv, { puntos, mlim, zmax = 0.8, Mlims = [-21.5, -13] }) {
    const { g, w, h } = lienzo(cv);
    fondo(g, w, h);
    const m = { i: 46, d: 14, s: 16, a: 38 }, px = z => m.i + (w - m.i - m.d) * z / zmax, py = M => m.s + (h - m.s - m.a) * (M - Mlims[0]) / (Mlims[1] - Mlims[0]);
    // zona que no se ve: más débil que el límite a cada z
    g.fillStyle = 'rgba(255,107,107,0.08)'; g.beginPath(); g.moveTo(px(0.005), py(Mlims[1]));
    for (let z = 0.005; z <= zmax; z += 0.005) g.lineTo(px(z), py(Math.min(Mlims[1], Math.max(Mlims[0], mlim - F.mu(z)))));
    g.lineTo(px(zmax), py(Mlims[1])); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(160,175,210,0.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(m.i, m.s); g.lineTo(m.i, h - m.a); g.lineTo(w - m.d, h - m.a); g.stroke();
    for (let z = 0; z <= zmax + 1e-9; z += 0.2) texto(g, z.toFixed(1), px(z), h - m.a + 14, { tam: 10, alin: 'center' });
    for (let M = -21; M <= -13; M += 2) texto(g, `${M}`, m.i - 6, py(M) + 3, { tam: 10, alin: 'right' });
    texto(g, 'z (distancia)', (m.i + w - m.d) / 2, h - 6, { tam: 11, alin: 'center' });
    g.save(); g.translate(12, (m.s + h - m.a) / 2); g.rotate(-Math.PI / 2); texto(g, 'M en el pico (más brillante arriba)', 0, 0, { tam: 10, alin: 'center' }); g.restore();
    for (const p of puntos) if (!p.enc) { g.fillStyle = 'rgba(150,160,190,0.35)'; g.fillRect(px(p.z) - 1, py(p.M) - 1, 2, 2); }
    g.globalCompositeOperation = 'lighter';
    for (const p of puntos) if (p.enc) luz(g, px(p.z), py(p.M), 5, hex(CL[p.clase]), 0.9);
    g.globalCompositeOperation = 'source-over';
    for (const p of puntos) if (p.enc) { g.fillStyle = CL[p.clase]; g.beginPath(); g.arc(px(p.z), py(p.M), 2.2, 0, 7); g.fill(); }
    g.strokeStyle = '#e8ecf8'; g.setLineDash([5, 4]); g.lineWidth = 1.5; g.beginPath();
    for (let z = 0.01; z <= zmax; z += 0.005) { const M = mlim - F.mu(z); if (M < Mlims[0]) break; z === 0.01 ? g.moveTo(px(z), py(Math.min(M, Mlims[1]))) : g.lineTo(px(z), py(Math.min(M, Mlims[1]))); }
    g.stroke(); g.setLineDash([]);
    texto(g, 'límite: lo más débil que ves a cada z (sin K-corrección)', w - m.d - 4, m.s + 12, { tam: 10, alin: 'right', color: '#e8ecf8' });
    texto(g, 'zona que no se ve', w - m.d - 4, h - m.a - 8, { tam: 10, alin: 'right', color: '#ff9b9b' });
  }
  const hex = c => { const n = parseInt(c.slice(1), 16); return `${n >> 16},${(n >> 8) & 255},${n & 255}`; };

  // ---------- la K-corrección: el espectro se corre bajo el filtro r ----------
  const colorOnda = l => { // aproximación visual del color de una longitud de onda (Å)
    const x = Math.max(3800, Math.min(7500, l));
    const t = (x - 3800) / 3700, h = 270 - 270 * t;
    return `hsl(${h}, 85%, ${l < 3800 || l > 7500 ? 35 : 62}%)`;
  };
  function kcorr(cv, { onda, flujo, filtro, z, fase }) {
    const { g, w, h } = lienzo(cv);
    fondo(g, w, h);
    const m = { i: 14, d: 14, s: 30, a: 40 }, L0 = 3000, L1 = 10500, px = l => m.i + (w - m.i - m.d) * (l - L0) / (L1 - L0), py = f => h - m.a - (h - m.s - m.a) * f;
    // el filtro r, quieto en el observador
    const rmax = Math.max(...filtro.resp);
    g.fillStyle = 'rgba(90,209,255,0.12)'; g.beginPath(); g.moveTo(px(filtro.onda[0]), py(0));
    filtro.onda.forEach((l, i) => g.lineTo(px(l), py(0.95 * filtro.resp[i] / rmax))); g.lineTo(px(filtro.onda[filtro.onda.length - 1]), py(0)); g.closePath(); g.fill();
    g.strokeStyle = '#5ad1ff'; g.lineWidth = 1.5; g.beginPath(); filtro.onda.forEach((l, i) => i ? g.lineTo(px(l), py(0.95 * filtro.resp[i] / rmax)) : g.moveTo(px(l), py(0.95 * filtro.resp[i] / rmax))); g.stroke();
    texto(g, 'filtro r', px(6300), py(0.95) - 8, { tam: 11, color: '#5ad1ff', alin: 'center' });
    // el espectro corrido al rojo, coloreado por la longitud de onda que llega
    const fmax = Math.max(...flujo);
    for (let i = 1; i < onda.length; i++) {
      const l0 = onda[i - 1] * (1 + z), l1 = onda[i] * (1 + z);
      if (l1 < L0 || l0 > L1) continue;
      g.strokeStyle = colorOnda(l1); g.lineWidth = 2;
      g.beginPath(); g.moveTo(px(l0), py(0.85 * flujo[i - 1] / fmax)); g.lineTo(px(l1), py(0.85 * flujo[i] / fmax)); g.stroke();
    }
    // qué parte del espectro de reposo ve el filtro
    const a = filtro.onda[0] / (1 + z), b = filtro.onda[filtro.onda.length - 1] / (1 + z);
    g.strokeStyle = 'rgba(232,236,248,0.6)'; g.setLineDash([4, 4]); g.lineWidth = 1;
    [filtro.onda[0], filtro.onda[filtro.onda.length - 1]].forEach(l => { g.beginPath(); g.moveTo(px(l), m.s); g.lineTo(px(l), py(0)); g.stroke(); });
    g.setLineDash([]);
    texto(g, `el filtro ve el espectro de reposo entre ${Math.round(a)} y ${Math.round(b)} Å`, w / 2, m.s - 10, { tam: 12, color: '#e8ecf8', alin: 'center' });
    g.strokeStyle = 'rgba(160,175,210,0.5)'; g.beginPath(); g.moveTo(m.i, py(0)); g.lineTo(w - m.d, py(0)); g.stroke();
    for (let l = 3000; l <= 10000; l += 1000) texto(g, `${l}`, px(l), py(0) + 14, { tam: 10, alin: 'center' });
    texto(g, `longitud de onda que llega al telescopio [Å]   ·   z = ${z.toFixed(2)}   ·   fase ${fase >= 0 ? '+' : ''}${fase} d`, w / 2, h - 6, { tam: 11, alin: 'center' });
  }

  // ---------- una supernova sobre las noches de un campo de SUDARE ----------
  // Arriba, las noches del campo: cada barra baja hasta su m50 (más larga = noche más profunda). Abajo, la curva verdadera de la
  // supernova, sus detecciones (llenas), las épocas en que no se detectó (vacías) y la noche en que la búsqueda la encontró (estrella).
  function curvaEpocas(cv, { campo, curva, obs, sn, corte }) {
    const { g, w, h } = lienzo(cv);
    fondo(g, w, h);
    const m = { i: 44, d: 12, s: 22, a: 34 }, ts = campo.epocas.map(e => e.mjd), t0 = Math.min(...ts) - 20, t1 = Math.max(...ts) + 20;
    const mags = [...curva.map(c => c.m).filter(Number.isFinite), ...campo.epocas.map(e => e.m50), ...campo.epocas.map(e => e.maglim)];
    const y0 = Math.min(...mags) - 0.5, y1 = Math.max(...campo.epocas.map(e => e.maglim)) + 0.6;
    const px = t => m.i + (w - m.i - m.d) * (t - t0) / (t1 - t0), py = mg => m.s + (h - m.s - m.a) * (mg - y0) / (y1 - y0);
    g.strokeStyle = 'rgba(160,175,210,0.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(m.i, m.s); g.lineTo(m.i, h - m.a); g.lineTo(w - m.d, h - m.a); g.stroke();
    for (let mg = Math.ceil(y0); mg <= y1; mg += 1) texto(g, `${mg}`, m.i - 6, py(mg) + 3, { tam: 10, alin: 'right' });
    g.save(); g.translate(12, (m.s + h - m.a) / 2); g.rotate(-Math.PI / 2); texto(g, 'magnitud r (más brillante arriba)', 0, 0, { tam: 10, alin: 'center' }); g.restore();
    texto(g, 'días (MJD) de la temporada del campo', (m.i + w - m.d) / 2, h - 6, { tam: 11, alin: 'center' });
    // cada noche: una franja de su límite y su m50
    for (const e of campo.epocas) {
      const x = px(e.mjd);
      g.fillStyle = 'rgba(90,209,255,0.10)'; g.fillRect(x - 2, py(y0), 4, py(e.m50) - py(y0));
      g.fillStyle = '#5ad1ff'; g.fillRect(x - 4, py(e.m50) - 1, 8, 2);
      g.fillStyle = 'rgba(232,236,248,0.35)'; g.fillRect(x - 3, py(e.maglim - 0.4275), 6, 1);
    }
    // la curva verdadera
    g.strokeStyle = 'rgba(255,184,77,0.8)'; g.lineWidth = 2; g.beginPath(); let dentro = false;
    for (const c of curva) { if (!Number.isFinite(c.m) || c.m > y1 + 1) { dentro = false; continue; } dentro ? g.lineTo(px(c.t), py(Math.min(c.m, y1))) : g.moveTo(px(c.t), py(Math.min(c.m, y1))); dentro = true; }
    g.stroke();
    // detecciones y épocas sin detección
    for (const d of obs.det) {
      g.fillStyle = '#ffb84d'; g.beginPath(); g.arc(px(d.t), py(d.m), 3.5, 0, 7); g.fill();
      g.strokeStyle = 'rgba(255,184,77,0.6)'; g.beginPath(); g.moveTo(px(d.t), py(d.m - d.s)); g.lineTo(px(d.t), py(d.m + d.s)); g.stroke();
    }
    if (obs.hallazgo) { const d = obs.hallazgo; g.fillStyle = '#6ee7a0'; estrella(g, px(d.t), py(d.m) - 14, 7); }
    texto(g, `${sn.clase} a z = ${sn.z.toFixed(2)} · ${obs.det.length} detecciones · ${obs.seleccionada ? 'encontrada y seleccionada' : obs.encontrada ? 'encontrada, pero con menos de 4 detecciones' : 'no encontrada'}`,
      m.i + 6, 14, { tam: 11, color: obs.seleccionada ? '#6ee7a0' : '#ff9b9b' });
    texto(g, `celeste: el m50 de cada noche${corte === null ? ' (sin corte: la búsqueda sigue más allá)' : ' (corte: más débil que esto no se busca)'}`, w - m.d, 14, { tam: 10, alin: 'right', color: '#5ad1ff' });
  }
  function estrella(g, x, y, r) {
    g.beginPath();
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; k ? g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    g.closePath(); g.fill();
  }

  // ---------- un candidato: sus detecciones, la mejor plantilla de cada clase y las probabilidades ----------
  function candidato(cv, { det, modelos, prob, titulo, resid = null }) {
    const { g, w, h } = lienzo(cv);
    fondo(g, w, h);
    const barras = w > 480 ? 150 : 0, abajo = barras ? 0 : 84, m = { i: 46, d: 12 + barras, s: 24, a: 34 + abajo }; // en el teléfono, las barras van abajo
    const ts = det.map(d => d.t), t0 = Math.min(...ts) - 40, t1 = Math.max(...ts) + 30;
    const ms = det.map(d => d.m), y0 = Math.min(...ms) - 0.8, y1 = Math.max(...ms) + 1.2;
    const px = t => m.i + (w - m.i - m.d) * (t - t0) / (t1 - t0), py = mg => m.s + (h - m.s - m.a) * (mg - y0) / (y1 - y0);
    g.strokeStyle = 'rgba(160,175,210,0.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(m.i, m.s); g.lineTo(m.i, h - m.a); g.lineTo(w - m.d, h - m.a); g.stroke();
    for (let mg = Math.ceil(y0); mg <= y1; mg++) texto(g, `${mg}`, m.i - 6, py(mg) + 3, { tam: 10, alin: 'right' });
    const tPrim = Math.min(...ts), paso = t1 - t0 > 200 ? 50 : 20;
    for (let d = Math.ceil((t0 - tPrim) / paso) * paso; tPrim + d <= t1; d += paso) {
      g.strokeStyle = 'rgba(160,175,210,0.5)'; g.beginPath(); g.moveTo(px(tPrim + d), h - m.a); g.lineTo(px(tPrim + d), h - m.a + 4); g.stroke();
      texto(g, `${d}`, px(tPrim + d), h - m.a + 14, { tam: 10, alin: 'center' });
    }
    texto(g, 'días desde la primera detección (del observador)', (m.i + w - m.d) / 2, h - m.a + 30, { tam: 11, alin: 'center' });
    g.save(); g.translate(11, (m.s + h - m.a) / 2); g.rotate(-Math.PI / 2); texto(g, 'magnitud r', 0, 0, { tam: 11, alin: 'center' }); g.restore();
    g.save(); g.beginPath(); g.rect(m.i, m.s, w - m.i - m.d, h - m.s - m.a); g.clip();
    for (const mod of modelos) {
      if (!mod) continue;
      g.strokeStyle = CL[mod.clase]; g.globalAlpha = 0.35 + 0.65 * (prob[mod.clase] || 0); g.lineWidth = 2; g.beginPath(); let on = false;
      for (const c of mod.curva) { if (!Number.isFinite(c.m)) { on = false; continue; } on ? g.lineTo(px(c.t), py(c.m)) : g.moveTo(px(c.t), py(c.m)); on = true; }
      g.stroke(); g.globalAlpha = 1;
    }
    g.restore();
    // los residuos contra la plantilla que se indique: lo que no calza, que es lo que pesa en el χ²
    const mr = resid && modelos.find(mo => mo && mo.clase === resid);
    if (mr) {
      const enT = t => { const cs = mr.curva; for (let i = 1; i < cs.length; i++) if (cs[i].t >= t) { const a = cs[i - 1], b = cs[i], f = (t - a.t) / (b.t - a.t); return a.m + f * (b.m - a.m); } return NaN; };
      g.strokeStyle = CL[resid]; g.lineWidth = 1.5; g.setLineDash([2, 2]);
      for (const d of det) { const mm = enT(d.t); if (Number.isFinite(mm)) { g.beginPath(); g.moveTo(px(d.t) + 3, py(d.m)); g.lineTo(px(d.t) + 3, py(mm)); g.stroke(); } }
      g.setLineDash([]);
    }
    for (const d of det) {
      g.strokeStyle = '#e8ecf8'; g.beginPath(); g.moveTo(px(d.t), py(d.m - d.s)); g.lineTo(px(d.t), py(d.m + d.s)); g.stroke();
      g.fillStyle = '#e8ecf8'; g.beginPath(); g.arc(px(d.t), py(d.m), 3, 0, 7); g.fill();
    }
    texto(g, titulo, m.i + 4, 15, { tam: 11, color: '#e8ecf8' });
    if (barras) { // las probabilidades, en barras
      const x0 = w - barras + 18, bw = barras - 30;
      CLASES.forEach((c, i) => {
        const y = m.s + 8 + i * 34, v = prob[c] || 0;
        texto(g, c, x0, y + 10, { tam: 12, color: CL[c] });
        g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(x0 + 34, y, bw - 72, 14);
        g.fillStyle = CL[c]; g.fillRect(x0 + 34, y, (bw - 72) * v, 14);
        texto(g, Number.isFinite(prob[c]) ? (100 * v).toFixed(0) + ' %' : '–', x0 + bw + 4, y + 11, { tam: 11, alin: 'right', color: '#e8ecf8' });
      });
    } else { // abajo, en dos columnas
      const bw = (w - 30) / 2;
      CLASES.forEach((c, i) => {
        const x0 = 10 + (i % 2) * (bw + 10), y = h - abajo + 6 + Math.floor(i / 2) * 30, v = prob[c] || 0;
        texto(g, c, x0, y + 11, { tam: 12, color: CL[c] });
        g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(x0 + 30, y, bw - 72, 14);
        g.fillStyle = CL[c]; g.fillRect(x0 + 30, y, (bw - 72) * v, 14);
        texto(g, Number.isFinite(prob[c]) ? (100 * v).toFixed(0) + ' %' : '–', x0 + bw - 4, y + 11, { tam: 11, alin: 'right', color: '#e8ecf8' });
      });
    }
  }

  // ---------- los frascos del conteo: cada supernova se reparte según sus probabilidades ----------
  function frascos(cv, { N, gotas, escala, verdad }) {
    const { g, w, h } = lienzo(cv);
    fondo(g, w, h);
    const n = CLASES.length, ancho = Math.min(110, w / n - 24), base = h - 34, alto = h - 80;
    CLASES.forEach((c, i) => {
      const cx = (i + 0.5) * w / n, x0 = cx - ancho / 2, nivel = Math.min(1, (N[c] || 0) / escala);
      g.fillStyle = `rgba(${hex(CL[c])},0.75)`; g.fillRect(x0 + 3, base - alto * nivel, ancho - 6, alto * nivel);
      g.fillStyle = `rgba(255,255,255,0.18)`; g.fillRect(x0 + 3, base - alto * nivel, ancho - 6, 2);
      g.strokeStyle = 'rgba(232,236,248,0.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, base - alto - 6); g.lineTo(x0, base); g.lineTo(x0 + ancho, base); g.lineTo(x0 + ancho, base - alto - 6); g.stroke();
      if (verdad) { const yv = base - alto * Math.min(1, (verdad[c] || 0) / escala); g.strokeStyle = '#b48cff'; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(x0 - 6, yv); g.lineTo(x0 + ancho + 6, yv); g.stroke(); g.setLineDash([]); }
      texto(g, c, cx, base + 16, { tam: 13, color: CL[c], alin: 'center' });
      texto(g, `N = ${(N[c] || 0).toFixed(2)}`, cx, base - alto - 12, { tam: 12, color: '#e8ecf8', alin: 'center' });
    });
    for (const d of gotas) { g.fillStyle = CL[d.c]; g.beginPath(); g.arc(d.x * w, d.y * h, 4, 0, 7); g.fill(); }
  }

  return { CL, CLASES, tortas, malmquist, kcorr, curvaEpocas, candidato, frascos, colorOnda, hex, fondo, texto, estrella };
})();
