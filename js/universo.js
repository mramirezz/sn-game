// El universo escondido, la temporada de observación y el estimador de la tasa.
// Sin DOM: corre en el navegador (global Universo) y en node (pruebas).
const Universo = (() => {
  const F = typeof Fisica !== 'undefined' ? Fisica : require('./fisica.js');

  const TOPE_SN = 5000;
  // Telescopios del universo de juego.
  const TELESCOPIOS = {
    chico: { nombre: 'Telescopio chico', campoDeg2: 47, mRef: 20.5, tRef: 30, overhead: 15, horas: 40 },
    grande: { nombre: 'Telescopio grande', campoDeg2: 1, mRef: 23.5, tRef: 300, overhead: 60, horas: 60 },
  };

  // mulberry32
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function poisson(rand, lam) {
    if (lam < 30) {
      const L = Math.exp(-lam);
      let k = 0, p = 1;
      do { k++; p *= rand(); } while (p > L);
      return k - 1;
    }
    const g = Math.sqrt(-2 * Math.log(rand() || 1e-12)) * Math.cos(2 * Math.PI * rand());
    return Math.max(0, Math.round(lam + Math.sqrt(lam) * g));
  }

  // Régimen limitado por el fondo: 4 veces el tiempo da 0.75 mag.
  const mlim = (tel, tExp) => tel.mRef + 1.25 * Math.log10(tExp / tel.tRef);
  const nNoches = (cadencia, largo) => Math.floor(largo / cadencia) + 1;
  const costoHoras = (tel, { campos, tExp, cadencia, largo }) =>
    campos * nNoches(cadencia, largo) * (tExp + tel.overhead) / 3600;

  // n(z) = dVdz/(1+z) acumulada, para sortear z y para la integral del volumen.
  const cacheNz = new Map();
  function tablaNz(zmax, n = 400) {
    if (cacheNz.has(zmax)) return cacheNz.get(zmax);
    const zs = [], cdf = [0];
    for (let i = 0; i <= n; i++) zs.push(zmax * i / n);
    const nz = zs.map(z => F.dVdz(z) / (1 + z));
    for (let i = 1; i <= n; i++) cdf.push(cdf[i - 1] + (nz[i] + nz[i - 1]) / 2 * (zs[i] - zs[i - 1]));
    const tabla = { zs, cdf, integral: cdf[n] };
    cacheNz.set(zmax, tabla);
    return tabla;
  }

  function sortearZ(tabla, rand) {
    const u = rand() * tabla.integral, { zs, cdf } = tabla;
    let lo = 0, hi = cdf.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cdf[m] < u) lo = m; else hi = m; }
    const f = (u - cdf[lo]) / (cdf[hi] - cdf[lo] || 1);
    return zs[lo] + f * (zs[hi] - zs[lo]);
  }

  function crearUniverso({ seed, tasa, zmax, areaDeg2, largo, previa = 100, Mpeak = -19.3 }) {
    const rand = rng((seed ^ 0x9E3779B9) >>> 0);
    const tabla = tablaNz(zmax);
    const lam = tasa * 1e-4 * F.deg2ASr(areaDeg2) * tabla.integral * (largo + previa) / 365.25;
    if (lam > TOPE_SN) throw new Error(`Universo con ${Math.round(lam)} SNe esperadas: supera TOPE_SN (${TOPE_SN})`);
    const n = poisson(rand, lam);
    const sn = [];
    for (let i = 0; i < n; i++) {
      sn.push({ z: sortearZ(tabla, rand), tExp: -previa + rand() * (largo + previa), M: Mpeak, x: rand(), y: rand() });
    }
    return { tasa, zmax, areaDeg2, largo, previa, esperadas: lam, sn };
  }

  function noches({ largo, cadencia, pNube, rand }) {
    const out = [];
    for (let i = 0; i < nNoches(cadencia, largo); i++) out.push({ t: i * cadencia, despejada: rand() >= pNube });
    return out;
  }

  function observar(uni, nchs, ml) {
    const t0 = nchs[0].t, t1 = nchs[nchs.length - 1].t;
    return uni.sn.map(sn => {
      const w = F.ventanaVisible(sn.z, sn.M, ml);
      if (!w) return { ...sn, det: [], motivo: 'debil' };
      const a = sn.tExp + w[0], b = sn.tExp + w[1];
      if (b < t0 || a > t1) return { ...sn, det: [], motivo: 'fuera' };
      const prog = nchs.filter(n => n.t >= a && n.t <= b);
      if (!prog.length) return { ...sn, det: [], motivo: 'hueco' };
      const det = prog.filter(n => n.despejada).map(n => n.t);
      return { ...sn, det, motivo: det.length ? 'encontrada' : 'nublado' };
    });
  }

  // Fechas de explosión que alguna noche despejada habría detectado: unión de [t - s2, t - s1].
  function intervalosControl(z, M, nchs, ml, largo, previa) {
    const w = F.ventanaVisible(z, M, ml);
    if (!w) return [];
    const iv = nchs.filter(n => n.despejada)
      .map(n => [Math.max(n.t - w[1], -previa), Math.min(n.t - w[0], largo)])
      .filter(([a, b]) => b > a)
      .sort((p, q) => p[0] - q[0]);
    const unidos = [];
    for (const [a, b] of iv) {
      const u = unidos[unidos.length - 1];
      if (u && a <= u[1]) u[1] = Math.max(u[1], b); else unidos.push([a, b]);
    }
    return unidos;
  }

  const tiempoControl = (z, M, nchs, ml, largo, previa) =>
    intervalosControl(z, M, nchs, ml, largo, previa).reduce((s, [a, b]) => s + b - a, 0);

  // A = Omega Σ CT(z)/365.25 dVdz Δz / (1+z): yr Mpc^3
  function exposicion({ noches: nchs, mlim: ml, areaDeg2, zmax, largo, previa, M = -19.3, dilatacion }) {
    const nb = 200, dz = zmax / nb;
    let s = 0;
    for (let i = 0; i < nb; i++) {
      const z = (i + 0.5) * dz;
      const ct = tiempoControl(z, M, nchs, ml, largo, previa) / 365.25;
      if (ct > 0) s += ct * F.dVdz(z) * dz / (dilatacion ? 1 + z : 1);
    }
    return F.deg2ASr(areaDeg2) * s;
  }

  const exposicionContar = ({ areaDeg2, zmax, largo }) => largo / 365.25 * F.volumen(0, zmax, F.deg2ASr(areaDeg2));

  // eq:methods:rates:ct de la tesis: la fracción encontrada de SNe simuladas.
  function exposicionMC({ rand, nSim, noches: nchs, mlim: ml, areaDeg2, zmax, largo, previa, M = -19.3 }) {
    const tabla = tablaNz(zmax), despejadas = nchs.filter(n => n.despejada).map(n => n.t);
    const sims = [];
    let nSel = 0;
    for (let i = 0; i < nSim; i++) {
      const z = sortearZ(tabla, rand), tExp = -previa + rand() * (largo + previa);
      const w = F.ventanaVisible(z, M, ml);
      const encontrada = !!w && despejadas.some(t => t >= tExp + w[0] && t <= tExp + w[1]);
      if (encontrada) nSel++;
      sims.push({ z, tExp, encontrada });
    }
    const A = F.deg2ASr(areaDeg2) * (largo + previa) / 365.25 * tabla.integral * nSel / nSim;
    const errA = nSel ? A * Math.sqrt((1 - nSel / nSim) / nSel) : 0; // binomial
    return { A, errA, nSim, nSel, sims };
  }

  // Tasa en 10^-4 yr^-1 Mpc^-3 con su intervalo de Gehrels a 1 sigma.
  function estimar(N, A) {
    const g = F.gehrels(N), k = 1 / A / 1e-4;
    return { r: N * k, lo: g.lo * k, hi: g.hi * k };
  }

  return {
    TOPE_SN, TELESCOPIOS, rng, poisson, mlim, nNoches, costoHoras, tablaNz, crearUniverso, noches, observar,
    intervalosControl, tiempoControl, exposicion, exposicionContar, exposicionMC, estimar,
  };
})();

if (typeof module !== 'undefined') module.exports = Universo;
