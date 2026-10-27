// La población de supernovas y el survey SUDARE en el universo de juego (caps. 2 a 5).
// Curvas: la biblioteca de plantillas de SUDARE de la tesis (data/plantillas.js), en r de OmegaCAM. Modelo de observación de
// la simulación de la tesis (pipeline78/runcfg.py, sudare_v78): búsqueda con la ec. 1 de SUDARE I y corte en el m50,
// detección en maglim − 0.4275, S/N = 3 × 10^(0.4 (maglim − m)), selección con al menos 4 detecciones.
// Sin DOM: corre en el navegador (global Poblacion) y en node (pruebas).
const Poblacion = (() => {
  const F = typeof Fisica !== 'undefined' ? Fisica : require('./fisica.js');
  const U = typeof Universo !== 'undefined' ? Universo : require('./universo.js');
  const CLASES = ['Ia', 'II', 'Ibc', 'IIn'];
  const BUSQUEDA = { DE_max: 0.95, beta: 4, umbral: 0.4275, snrK: 3, piso: 0.02, previa: 365, minDet: 4 };
  const ZMAX = { Ia: 0.85, II: 0.65, Ibc: 0.75, IIn: 0.85 };
  const MEZCLA_II = { II: 0.8, IIb: 0.2 }; // reglas 4.5: II : IIb 8 : 2

  // ---------- la biblioteca ----------
  const b64 = s => (typeof Buffer !== 'undefined' ? Uint8Array.from(Buffer.from(s, 'base64'))
    : Uint8Array.from(atob(s), c => c.charCodeAt(0)));
  function cargar(datos) {
    const nF = datos.fases.length;
    const plantillas = datos.plantillas.map((p, i) => {
      const dm = b64(p.dm), subida = datos.z.map((_, k) => { // días observados de la explosión al pico, en cada nodo de z
        for (let j = 0; j < nF; j++) if (dm[k * nF + j] !== 255) return -datos.fases[j];
        return null;
      });
      return { ...p, i, dm, subida, claseTasa: p.clase === 'IIb' ? 'II' : p.clase };
    });
    const porClase = Object.fromEntries(CLASES.map(c => [c, plantillas.filter(p => p.claseTasa === c)]));
    return (LIB = { ...datos, plantillas, porClase, nF, f0: datos.fases[0], df: datos.fases[1] - datos.fases[0] });
  }
  let LIB = null; // la última cargada; en el navegador, data/plantillas.js
  const lib = () => LIB || cargar(window.PLANTILLAS);

  function nodos(L, z) {
    const zs = L.z;
    if (z <= zs[0]) return [0, 0, 0];
    if (z >= zs[zs.length - 1]) return [zs.length - 1, zs.length - 1, 0];
    let k = 1; while (zs[k] < z) k++;
    return [k - 1, k, (z - zs[k - 1]) / (zs[k] - zs[k - 1])];
  }
  function enNodo(L, p, k, fase) {
    if (p.pico[k] === null) return Infinity;
    const x = (fase - L.f0) / L.df, j = Math.floor(x);
    if (j < 0 || j >= L.nF - 1) return Infinity;
    const a = p.dm[k * L.nF + j], b = p.dm[k * L.nF + j + 1];
    if (a === 255 || b === 255) return Infinity;
    return p.pico[k] + L.paso * (a + (b - a) * (x - j));
  }
  // Magnitud en r sin distancia ni polvo del host, a una fase observada desde el pico (días) y un z.
  function magSinDistancia(p, z, fase, L = lib()) {
    const [k0, k1, u] = nodos(L, z), m0 = enNodo(L, p, k0, fase), m1 = enNodo(L, p, k1, fase);
    if (!Number.isFinite(m0)) return u > 0.5 ? m1 : Infinity;
    if (!Number.isFinite(m1)) return u < 0.5 ? m0 : Infinity;
    return m0 + (m1 - m0) * u;
  }
  const interpNodo = (L, arr, z) => {
    const [k0, k1, u] = nodos(L, z), a = arr[k0], b = arr[k1];
    return a === null ? b : b === null ? a : a + (b - a) * u;
  };
  const subida = (p, z, L = lib()) => interpNodo(L, p.subida, z) ?? 20 * (1 + z);
  const arefE = (p, E, L = lib()) => { // A_ref(E): para las IIn la LF se impone después del polvo
    const e = L.ebv; let k = 1; while (k < e.length - 1 && e[k] < E) k++;
    return p.aref[k - 1] + (p.aref[k] - p.aref[k - 1]) * (E - e[k - 1]) / (e[k] - e[k - 1]);
  };

  // Magnitud observada de una supernova en un instante (MJD).
  function mag(sn, t, L = lib()) {
    const p = sn.p, tPico = sn.tPico ?? (sn.tPico = sn.tExp + subida(p, sn.z, L));
    const m = magSinDistancia(p, sn.z, t - tPico, L);
    if (!Number.isFinite(m)) return Infinity;
    const polvo = sn.E ? sn.E * (interpNodo(L, p.polvo, sn.z) ?? 2.5) - (p.clase === 'IIn' ? arefE(p, sn.E, L) : 0) : 0;
    return m + (sn.mu ?? (sn.mu = F.mu(sn.z))) + (sn.M - p.Mref) + polvo; // μ(z) se guarda en la SN: es lo caro
  }

  // ---------- el survey ----------
  // eq:methods:proj:sudare_de, con el corte de la regla 1: cero para una SN más débil que m50 + corte
  function eficiencia(m, m50, { corte = 0 } = {}) {
    if (corte !== null && m > m50 + corte) return 0;
    return BUSQUEDA.DE_max * (Math.atan(BUSQUEDA.beta * (m50 - m)) / Math.PI + 0.5);
  }
  const snr = (m, maglim) => BUSQUEDA.snrK * 10 ** (0.4 * (maglim - m));
  const sigmaMag = (m, maglim) => Math.max(2.5 / Math.LN10 / snr(m, maglim), BUSQUEDA.piso);
  const gauss = rand => Math.sqrt(-2 * Math.log(rand() || 1e-12)) * Math.cos(2 * Math.PI * rand());

  function observar(sn, campo, { rand, corte = 0, L = lib() }) {
    const det = [];
    let encontrada = false, hallazgo = null;
    for (const e of campo.epocas) {
      const m = mag(sn, e.mjd, L);
      if (!Number.isFinite(m) || m > e.maglim + 1.5) continue;
      const s = sigmaMag(m, e.maglim), mo = m + s * gauss(rand);
      if (mo < e.maglim - BUSQUEDA.umbral) {
        det.push({ t: e.mjd, m: mo, s, mlim: e.maglim, m50: e.m50, mv: m });
        if (!encontrada && rand() < eficiencia(m, e.m50, { corte })) { encontrada = true; hallazgo = det[det.length - 1]; }
      }
    }
    const seleccionada = encontrada && det.length >= BUSQUEDA.minDet;
    return { det, encontrada, seleccionada, hallazgo, pico: det.length ? Math.min(...det.map(d => d.m)) : Infinity };
  }

  // ---------- el universo de juego ----------
  const ventana = campo => [campo.epocas[0].mjd - BUSQUEDA.previa, campo.epocas[campo.epocas.length - 1].mjd];
  const ZMIN = 0.01;
  function sortearZ(zmax, rand) {
    const t = U.tablaNz(zmax);
    for (;;) {
      const u = rand() * t.integral; let lo = 0, hi = t.cdf.length - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (t.cdf[m] < u) lo = m; else hi = m; }
      const z = t.zs[lo] + (u - t.cdf[lo]) / (t.cdf[hi] - t.cdf[lo] || 1) * (t.zs[hi] - t.zs[lo]);
      if (z >= ZMIN) return z;
    }
  }
  function integralN(zmax) { const t = U.tablaNz(zmax), i0 = t.zs.findIndex(z => z >= ZMIN); return t.integral - t.cdf[i0]; }
  function sortearPlantilla(clase, rand, L = lib(), mezcla = MEZCLA_II) {
    let lista = L.porClase[clase];
    if (clase === 'II') { const sub = rand() < mezcla.II ? 'II' : 'IIb'; lista = lista.filter(p => p.clase === sub); }
    return lista[Math.floor(rand() * lista.length)];
  }
  function sortearM(p, rand, dlf = 0) {
    const [m, s, mn, mx] = p.lf;
    for (let k = 0; k < 50; k++) { const M = m + dlf + s * gauss(rand); if (M >= mn && M <= mx) return M; }
    return m + dlf;
  }
  function sortearE(p, rand, escala = 1, L = lib()) {
    let u = rand(), k = 0;
    while (k < p.ebv_prior.length - 1 && u > p.ebv_prior[k]) { u -= p.ebv_prior[k]; k++; }
    return L.ebv[k] * escala;
  }
  function nuevaSN(clase, campoIdx, campo, rand, { zmax = ZMAX, dlf = 0, polvo = 1, L = lib() } = {}, k = 0) {
    const [t0, t1] = ventana(campo), p = sortearPlantilla(clase, rand, L);
    return { clase, campo: campoIdx, k, p, z: sortearZ(zmax[clase], rand), tExp: t0 + rand() * (t1 - t0),
      M: sortearM(p, rand, dlf), E: sortearE(p, rand, polvo, L), x: rand(), y: rand() };
  }
  // Explosiones de un universo con tasas verdaderas por clase (10⁻⁴ yr⁻¹ Mpc⁻³), sobre los campos dados.
  function crearUniverso({ campos, tasas, rand, zmax = ZMAX, dlf = 0, polvo = 1, L = lib() }) {
    const sne = [];
    campos.forEach((campo, ci) => {
      const [t0, t1] = ventana(campo), om = F.deg2ASr(campo.area_deg2);
      for (const [clase, r] of Object.entries(tasas)) {
        const lam = r * 1e-4 * om * integralN(zmax[clase]) * (t1 - t0) / 365.25, n = U.poisson(rand, lam);
        for (let i = 0; i < n; i++) sne.push(nuevaSN(clase, ci, campo, rand, { zmax, dlf, polvo, L }, sne.length));
      }
    });
    return { sne, tasas };
  }

  // Exposición por simulación (eq:methods:rates:ct): fracción encontrada y seleccionada de SNe simuladas, binada por z.
  function exposicion({ campos, clase, nSim, rand, bins, corte = 0, zmax = ZMAX, dlf = 0, polvo = 1, L = lib(), guardar = 0 }) {
    const A = bins.map(() => 0), muestra = [];
    let nSel = 0;
    campos.forEach((campo, ci) => {
      const [t0, t1] = ventana(campo), fac = F.deg2ASr(campo.area_deg2) * (t1 - t0) / 365.25 * integralN(zmax[clase]) / nSim;
      for (let i = 0; i < nSim; i++) {
        const sn = nuevaSN(clase, ci, campo, rand, { zmax, dlf, polvo, L }, i), o = observar(sn, campo, { rand, corte, L });
        if (o.seleccionada) {
          nSel++;
          const b = bins.findIndex(([z1, z2]) => sn.z >= z1 && sn.z < z2);
          if (b >= 0) A[b] += fac;
        }
        if (muestra.length < guardar) muestra.push({ z: sn.z, M: sn.M, sel: o.seleccionada, pico: o.pico });
      }
    });
    return { A, nSel, muestra };
  }

  // ---------- el clasificador de plantillas (didáctico, universo de juego) ----------
  // Para cada plantilla: barrido del instante del pico; la diferencia de brillo M − M_ref se ajusta en forma analítica con la
  // LF de la plantilla como prior. Verosimilitud de la clase = promedio sobre sus plantillas. P(c) ∝ prior(c) × L(c).
  function verosimilitudPlantilla(p, det, z, L) {
    const mu = F.mu(z), [lfm, lfs] = p.lf, t1 = det[0].t, t2 = det[det.length - 1].t;
    let mejor = -Infinity, suma = 0, n = 0;
    for (let tp = t1 - 40 * (1 + z); tp <= t2 + 25; tp += 3) {
      let sw = 0, swr = 0, fuera = 0;
      const res = det.map(d => {
        const l = magSinDistancia(p, z, d.t - tp, L), w = 1 / (d.s * d.s + 0.05 * 0.05);
        if (!Number.isFinite(l)) { fuera++; return null; }
        const r = d.m - (l + mu); sw += w; swr += w * r;
        return [r, w];
      });
      if (fuera > det.length / 2) continue;
      const wp = 1 / (lfs * lfs), d0 = lfm - p.Mref;
      const delta = (swr + wp * d0) / (sw + wp);
      let chi2 = wp * (delta - d0) ** 2 + 16 * fuera;
      for (const x of res) if (x) chi2 += x[1] * (x[0] - delta) ** 2;
      const ll = -chi2 / 2;
      if (ll > mejor) mejor = ll;
      suma += Math.exp(ll + 700); n++;
    }
    return { mejor, logL: n ? Math.log(suma / n) - 700 : -Infinity };
  }
  function logVeros(o, z, L = lib(), clases = CLASES) { // log L de cada clase: promedio de sus plantillas
    const det = [...o.det].sort((a, b) => a.t - b.t), logL = {};
    for (const c of clases) {
      const ls = L.porClase[c].map(p => verosimilitudPlantilla(p, det, z, L).logL).filter(Number.isFinite);
      const mx = Math.max(...ls);
      logL[c] = ls.length ? mx + Math.log(ls.reduce((s, l) => s + Math.exp(l - mx), 0) / ls.length) : -Infinity;
    }
    return logL;
  }
  function clasificar(o, { z, prior, L = lib(), clases = CLASES }) {
    const logL = logVeros(o, z, L, clases);
    const lp = clases.map(c => logL[c] + Math.log(prior[c] || 1e-12)), mx = Math.max(...lp);
    if (!Number.isFinite(mx)) return Object.fromEntries(clases.map(c => [c, NaN])); // ninguna plantilla calza: sin clasificar
    const ws = lp.map(l => Math.exp(l - mx)), s = ws.reduce((a, b) => a + b, 0);
    return Object.fromEntries(clases.map((c, i) => [c, ws[i] / s]));
  }
  // z del ajuste de las plantillas cuando no hay z de host: el máximo de la verosimilitud total (con el prior de clase y el
  // volumen n(z) como prior de z), en una grilla de z.
  function zMapa(o, { prior, L = lib(), zs = null }) {
    const grilla = zs || Array.from({ length: 31 }, (_, i) => 0.05 + 0.025 * i);
    let mejor = null;
    for (const z of grilla) {
      const logL = logVeros(o, z, L), t = U.tablaNz(0.85);
      const nz = F.dVdz(z) / (1 + z);
      const vals = CLASES.map(c => logL[c] + Math.log(prior[c] || 1e-12)), mx = Math.max(...vals);
      if (!Number.isFinite(mx)) continue;
      const lp = mx + Math.log(vals.reduce((s, v) => s + Math.exp(v - mx), 0)) + Math.log(nz);
      if (!mejor || lp > mejor.lp) mejor = { z, lp };
    }
    return mejor ? mejor.z : null;
  }
  // La mejor plantilla de una clase (para dibujarla sobre la curva).
  function mejorPlantilla(o, clase, z, L = lib()) {
    const det = [...o.det].sort((a, b) => a.t - b.t);
    let mejor = null;
    for (const p of L.porClase[clase]) {
      const mu = F.mu(z), [lfm, lfs] = p.lf;
      for (let tp = det[0].t - 40 * (1 + z); tp <= det[det.length - 1].t + 25; tp += 2) {
        let sw = 0, swr = 0, ok = 0;
        for (const d of det) { const l = magSinDistancia(p, z, d.t - tp, L); if (!Number.isFinite(l)) continue; const w = 1 / (d.s * d.s + 0.0025); sw += w; swr += w * (d.m - l - mu); ok++; }
        if (ok < det.length / 2) continue;
        const wp = 1 / (lfs * lfs), delta = (swr + wp * (lfm - p.Mref)) / (sw + wp);
        let chi2 = wp * (delta - (lfm - p.Mref)) ** 2;
        for (const d of det) { const l = magSinDistancia(p, z, d.t - tp, L); chi2 += Number.isFinite(l) ? (d.m - l - mu - delta) ** 2 / (d.s * d.s + 0.0025) : 16; }
        if (!mejor || chi2 < mejor.chi2) mejor = { p, tp, delta, chi2 };
      }
    }
    return mejor;
  }

  return { CLASES, BUSQUEDA, ZMAX, cargar, lib, magSinDistancia, subida, mag, eficiencia, snr, sigmaMag, observar, ventana,
    crearUniverso, exposicion, nuevaSN, sortearZ, integralN, clasificar, zMapa, logVeros, mejorPlantilla, verosimilitudPlantilla,
    usar: L => { LIB = L; } };
})();

if (typeof module !== 'undefined') module.exports = Poblacion;
