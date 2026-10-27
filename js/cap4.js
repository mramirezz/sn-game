// Capítulo 4: qué tipo es y a qué distancia. El clasificador de plantillas, el conteo por suma de probabilidades, el prior
// P1(z), el z de los candidatos y la migración entre bines, la limpieza (AGN, PSN, completitud) y la prueba en el BTS de ZTF.
(() => {
  const M = Misiones, u = M.util, F = Fisica, U = Universo, P = Poblacion, V2 = Vista2, J = window.Juego;
  const $ = (s, r = document) => r.querySelector(s);
  const S1 = window.SUDARE1, T = window.TESIS, f2 = u.f2, marca = u.marca, CL = V2.CL, CLASES = V2.CLASES;
  const BINS = [[0.05, 0.15], [0.15, 0.35], [0.35, 0.55], [0.55, 0.75]];
  const PLANO = { Ia: 0.25, II: 0.25, Ibc: 0.25, IIn: 0.25 };
  const argmax = p => CLASES.reduce((a, c) => (p[c] > p[a] ? c : a), CLASES[0]);
  const binDe = z => BINS.findIndex(([a, b]) => z >= a && z < b);
  // P(c) con un prior a partir de las log-verosimilitudes de las clases; null si ninguna plantilla calza
  function conPriorL(L, prior) {
    const lp = CLASES.map(k => L[k] + Math.log(prior[k] || 1e-12)), mx = Math.max(...lp);
    if (!Number.isFinite(mx)) return null;
    const w = lp.map(l => Math.exp(l - mx)), sm = w.reduce((a, b) => a + b, 0);
    return Object.fromEntries(CLASES.map((k, i) => [k, w[i] / sm]));
  }

  // Una temporada de SUDARE I en el universo de juego: las supernovas seleccionadas.
  function candidatos(rand, { tasas = J.tasasJuego(rand), zmax } = {}) {
    const uni = P.crearUniverso({ campos: S1.campos, tasas, rand, zmax });
    const out = [];
    for (const sn of uni.sne) { const o = P.observar(sn, S1.campos[sn.campo], { rand, corte: 0 }); if (o.seleccionada) out.push({ sn, o }); }
    return { lista: out, tasas };
  }
  function modelosDe(o, z) {
    const ts = o.det.map(d => d.t), t0 = Math.min(...ts) - 40, t1 = Math.max(...ts) + 30, mu = F.mu(z);
    return CLASES.map(c => {
      const b = P.mejorPlantilla(o, c, z);
      if (!b) return null;
      const curva = []; for (let t = t0; t <= t1; t += 2) curva.push({ t, m: P.magSinDistancia(b.p, z, t - b.tp) + mu + b.delta });
      return { clase: c, curva, sn: b.p.sn };
    });
  }
  // El prior P1(z) del universo de juego: π_c(z) ∝ R_c × A_c(z) en bines finos (reglas 4.2), con las fracciones de Li.
  function priorP1z(rand, { nSim = 700, bins = Array.from({ length: 8 }, (_, i) => [0.05 + 0.1 * i, 0.15 + 0.1 * i]) } = {}, listo) {
    const A = {}, clases = [...CLASES];
    let k = 0;
    const sig = () => {
      if (k >= clases.length) {
        const pz = bins.map((_, i) => { const w = Object.fromEntries(CLASES.map(c => [c, J.LI[c] * A[c][i]])), s = Object.values(w).reduce((a, b) => a + b, 0) || 1; return Object.fromEntries(CLASES.map(c => [c, w[c] / s])); });
        const tot = Object.fromEntries(CLASES.map(c => [c, J.LI[c] * A[c].reduce((a, b) => a + b, 0)])), st = Object.values(tot).reduce((a, b) => a + b, 0);
        return listo({ bins, pz, global: Object.fromEntries(CLASES.map(c => [c, tot[c] / st])), en: z => pz[Math.max(0, Math.min(bins.length - 1, Math.floor((z - 0.05) / 0.1)))] });
      }
      const c = clases[k++];
      setTimeout(() => { A[c] = P.exposicion({ campos: S1.campos, clase: c, nSim, rand, bins, corte: 0 }).A; sig(); }, 10);
    };
    sig();
  }
  let PRIOR_CACHE = null; // el P1(z) del juego se calcula una vez por sesión
  function conPrior(rand, listo) { if (PRIOR_CACHE) return listo(PRIOR_CACHE); priorP1z(rand, {}, p => { PRIOR_CACHE = p; listo(p); }); }

  // ---------- 4.1 el escritorio de candidatos ----------
  function escritorio(m, fin) {
    const c = u.cont(), rand = U.rng(Date.now() % 1e9);
    const { lista } = candidatos(rand);
    const elegidos = lista.sort(() => rand() - 0.5).slice(0, 10).sort((a, b) => a.sn.z - b.sn.z);
    let k = 0, prob = null, modelos = null, echada = false, gotas = [], barrido = null;
    const N = {}, Nexacto = {}, Nduro = {}, verdad = {};
    c.innerHTML = `
      <canvas class="vista alto" id="cand"></canvas>
      <p class="tenue pie" id="pieCand">${Lg('Las detecciones del candidato (blanco). Cada clase prueba sus plantillas: desliza la fecha del máximo y el brillo hasta calzar.', 'The candidate’s detections (white). Each class tries its templates, sliding the date of maximum and the brightness until they fit.')}</p>
      <div class="fila"><button class="primario" id="echar">${Lg('Echar a los frascos', 'Drop into the jars')}</button><button id="sig" disabled>${Lg('Siguiente candidato', 'Next candidate')}</button>
        <span class="dato">${Lg('Candidato', 'Candidate')} <b id="nk">1</b> ${Lg('de', 'of')} ${elegidos.length}</span>${marca}</div>
      <canvas class="vista" id="fr"></canvas>
      <p class="tenue pie">${Lg('Cada candidato se reparte entre los frascos según sus probabilidades: una SN que es 70 % Ia y 30 % II pone 0.7 en Ia y 0.3 en II.', 'Each candidate is split among the jars by its probabilities. An SN that is 70 per cent Ia and 30 per cent II puts 0.7 in Ia and 0.3 in II.')}</p>
      <div class="ecuacion" id="ecN"></div><p class="etiqueta">eq:methods:rates:count</p>
      <div id="fin"></div>`;
    u.tex($('#ecN', c), String.raw`N_c \,=\, \sum_i w_i\, P_{i,c}`);
    function mostrar() {
      const { sn, o } = elegidos[k];
      $('#nk', c).textContent = k + 1; $('#echar', c).disabled = true; echada = false;
      V2.candidato($('#cand', c), { det: o.det, modelos: [], prob: {}, titulo: Lg(`candidato a z = ${sn.z.toFixed(2)} (z de su host) · clasificando…`, `candidate at z = ${sn.z.toFixed(2)} (z of its host) · classifying…`) });
      setTimeout(() => {
        prob = P.clasificar(o, { z: sn.z, prior: PLANO });
        modelos = modelosDe(o, sn.z);
        barrido = { t: 0, sn, o }; // las plantillas se deslizan hasta su mejor calce, después crecen las barras
      }, 20);
    }
    const escala = elegidos.length; // un frasco lleno = todos los candidatos
    u.animar(dt => {
      if (barrido) {
        const b = barrido; b.t += dt;
        const e = Math.min(1, b.t / 1.6), ee = 1 - (1 - e) ** 3, eb = Math.max(0, Math.min(1, (b.t - 1.6) / 0.8));
        const mov = modelos.map((mo, ci) => mo && { ...mo, curva: mo.curva.map(q => ({ t: q.t + (1 - ee) * (ci % 2 ? 1 : -1) * (35 + 15 * ci), m: q.m + (1 - ee) * (ci - 1.5) * 0.9 })) });
        const pb = Object.fromEntries(CLASES.map(cl => [cl, (prob[cl] || 0) * eb]));
        const fase = e < 1 ? Lg('cada clase busca el mejor calce de sus plantillas', 'each class looks for the best fit among its templates') : eb < 1 ? Lg('mejor calce encontrado: menos residuo (χ²) da más probabilidad', 'best fit found: less residual (χ²) gives more probability') : Lg(`${b.o.det.length} detecciones · probabilidades del clasificador (prior igual para las cuatro)`, `${b.o.det.length} detections · classifier probabilities (equal prior for all four)`);
        V2.candidato($('#cand', c), { det: b.o.det, modelos: mov, prob: pb, resid: e >= 1 ? argmax(prob) : null, titulo: Lg(`candidato a z = ${b.sn.z.toFixed(2)} · ${fase}`, `candidate at z = ${b.sn.z.toFixed(2)} · ${fase}`) });
        if (b.t > 2.4) {
          barrido = null; $('#echar', c).disabled = false;
          const am = argmax(prob);
          $('#pieCand', c).textContent = Lg(`La línea punteada de color va de cada punto a la plantilla más probable (${am}): es lo que no calza. La clase que deja menos residuo, con su brillo y su polvo plausibles, se lleva más probabilidad.`,
            `The coloured dotted line runs from each point to the most probable template (${am}). That is what does not fit. The class that leaves the least residual, with a plausible brightness and dust, gets the most probability.`);
        }
      }
      gotas.forEach(g => { g.y = Math.min(g.yf, g.y + dt * (0.9 + g.v)); g.x += (g.xf - g.x) * Math.min(1, dt * 4); });
      const caidas = gotas.filter(g => g.y >= g.yf);
      for (const g of caidas) N[g.c] = (N[g.c] || 0) + g.peso;
      gotas = gotas.filter(g => g.y < g.yf);
      V2.frascos($('#fr', c), { N, gotas, escala, verdad: k >= elegidos.length ? verdad : null });
      return true;
    });
    $('#echar', c).onclick = () => {
      if (echada || !prob) return;
      echada = true; $('#echar', c).disabled = true; u.sonar('blip');
      for (const cl of CLASES) {
        const nG = Math.round(12 * prob[cl]);
        for (let i = 0; i < nG; i++) gotas.push({ c: cl, x: 0.5 + 0.06 * (rand() - 0.5), y: -0.05 * i, xf: (CLASES.indexOf(cl) + 0.5) / 4, yf: 0.8, v: rand() * 0.3, peso: prob[cl] / nG });
      }
      for (const cl of CLASES) Nexacto[cl] = (Nexacto[cl] || 0) + prob[cl];
      Nduro[argmax(prob)] = (Nduro[argmax(prob)] || 0) + 1;
      verdad[elegidos[k].sn.clase] = (verdad[elegidos[k].sn.clase] || 0) + 1;
      setTimeout(() => { if (k < elegidos.length - 1) $('#sig', c).disabled = false; else terminar(); }, 900);
    };
    $('#sig', c).onclick = () => { $('#sig', c).disabled = true; k++; mostrar(); };
    mostrar();
    function terminar() {
      k = elegidos.length;
      $('#fin', c).innerHTML = `<div class="panel">
        <table class="tabla"><tr><th>${Lg('clase', 'class')}</th><th>${Lg('suma de probabilidades', 'sum of probabilities')}</th><th>${Lg('contando solo la más probable', 'counting only the most probable')}</th><th>${Lg('verdad', 'truth')}</th></tr>
          ${CLASES.map(cl => `<tr><td style="color:${CL[cl]}">${cl}</td><td>${f2(Nexacto[cl] || 0)}</td><td>${Nduro[cl] || 0}</td><td>${verdad[cl] || 0}</td></tr>`).join('')}</table>
        <p>${Lg(`La línea violeta de cada frasco es la verdad ${marca}. Sumar probabilidades guarda la duda: una SN que es 60 % Ia y 40 % IIn pone 0.6 y 0.4,
          y no 1 y 0. Contar solo la más probable bota esa duda. Pero la suma solo es justa si las probabilidades lo son, y eso depende del prior:
          aquí cada clase partió con 25 %, y en el universo no hay tantas IIn como Ia. Es la próxima misión.`,
          `The violet line in each jar is the truth ${marca}. Summing probabilities keeps the doubt. An SN that is 60 per cent Ia and 40 per cent IIn puts 0.6 and 0.4,
          not 1 and 0. Counting only the most probable throws that doubt away. But the sum is only fair if the probabilities are, and that depends on the prior.
          Here every class started at 25 per cent, and the universe does not have as many IIn as Ia. That is the next mission.`)}</p>
        <p><button class="primario" id="volver">${Lg('Volver al observatorio', 'Back to the observatory')}</button></p></div>`;
      u.desbloquear(m.ensena); u.marcar(m.id, true); u.sonar('fanfarria');
      $('#volver', c).onclick = () => fin({ gana: true });
      u.hablar([['operador', Lg('Así cuenta la tesis: N de cada clase es la suma de las probabilidades, con el peso de cada candidato (las PSN pesan la mitad).', 'This is how the thesis counts. The N of each class is the sum of the probabilities, with the weight of each candidate (PSN weigh half).')],
        ['directora', Lg('Fíjate en el prior: le diste la misma probabilidad a cada clase de entrada. Eso no es lo que dice el universo. Es la próxima misión.', 'Look at the prior. You gave every class the same probability from the start. That is not what the universe says. That is the next mission.')]]);
    }
  }

  // ---------- 4.2 el prior P1(z) ----------
  function dibujarPrior(cv, pr) {
    const { g, w, h } = Vista.h.lienzo(cv);
    V2.fondo(g, w, h);
    const m = { i: 40, d: 14, s: 16, a: 32 }, z0 = pr.bins[0][0], z1 = pr.bins[pr.bins.length - 1][1];
    const px = z => m.i + (w - m.i - m.d) * (z - z0) / (z1 - z0), py = f => m.s + (h - m.s - m.a) * (1 - f);
    const zs = pr.bins.map(b => (b[0] + b[1]) / 2);
    let abajo = zs.map(() => 0);
    for (const cl of CLASES) {
      const arriba = abajo.map((a, i) => a + pr.pz[i][cl]);
      g.fillStyle = `rgba(${V2.hex(CL[cl])},0.8)`; g.beginPath();
      zs.forEach((z, i) => (i ? g.lineTo(px(z), py(arriba[i])) : g.moveTo(px(z), py(arriba[i]))));
      for (let i = zs.length - 1; i >= 0; i--) g.lineTo(px(zs[i]), py(abajo[i]));
      g.closePath(); g.fill();
      const k = arriba.map((v, i) => v - abajo[i]).reduce((b, v, i, xs) => (v > xs[b] ? i : b), 0);
      if (arriba[k] - abajo[k] > 0.05) V2.texto(g, cl, px(zs[k]), py((arriba[k] + abajo[k]) / 2) + 4, { tam: 13, alin: 'center', color: '#03040b' });
      abajo = arriba;
    }
    // el P1 global: una sola fracción de Ia para todo z
    g.strokeStyle = '#e8ecf8'; g.setLineDash([6, 4]); g.lineWidth = 2; g.beginPath(); g.moveTo(px(z0), py(pr.global.Ia)); g.lineTo(px(z1), py(pr.global.Ia)); g.stroke(); g.setLineDash([]);
    V2.texto(g, Lg(`P1 global: Ia ${(100 * pr.global.Ia).toFixed(0)} % a todo z`, `global P1: Ia ${(100 * pr.global.Ia).toFixed(0)} % at all z`), px(z0) + 6, py(pr.global.Ia) - 6, { tam: 11, color: '#e8ecf8' });
    g.strokeStyle = 'rgba(160,175,210,0.5)'; g.beginPath(); g.moveTo(m.i, m.s); g.lineTo(m.i, h - m.a); g.lineTo(w - m.d, h - m.a); g.stroke();
    for (let z = 0.1; z <= z1 + 1e-9; z += 0.1) V2.texto(g, z.toFixed(1), px(z), h - m.a + 14, { tam: 10, alin: 'center' });
    for (const f of [0, 0.5, 1]) V2.texto(g, `${(100 * f).toFixed(0)}%`, m.i - 4, py(f) + 3, { tam: 10, alin: 'right' });
    V2.texto(g, Lg('z del candidato', 'candidate z'), (m.i + w - m.d) / 2, h - 6, { tam: 11, alin: 'center' });
  }
  function prior(m, fin) {
    const c = u.cont(), rand = U.rng(Date.now() % 1e9);
    c.innerHTML = `
      <div class="panel contrato"><h3>${Lg('¿Qué tan probable es cada clase antes de mirar la curva?', 'How probable is each class before you look at the curve?')}</h3>
        <p>${Lg(`Entre las supernovas que encuentras, las Ia abundan más lejos: son brillantes y tu survey las ve hasta z alto. Cerca abundan las CC.
          El prior P1 de la tesis es eso: la fracción de cada tipo entre los candidatos que el survey detecta. f es la fracción local del subtipo,
          g la evolución de su tasa y V su volumen efectivo en el survey, medido en la simulación. P1(z) lo calcula en el bin de z del candidato.`,
          `Among the supernovae you find, Ia dominate farther away. They are bright and your survey sees them up to high z. Nearby, CC dominate.
          The thesis prior P1 is exactly that: the fraction of each type among the candidates the survey detects. f is the local fraction of the subtype,
          g the evolution of its rate and V its effective volume in the survey, measured in the simulation. P1(z) computes it in the z bin of the candidate.`)}</p>
        <div class="ecuacion" id="ecP"></div><p class="etiqueta">sec:methods:rates:conv ${Lg('(sin ecuación numerada)', '(no numbered equation)')}</p></div>
      <p class="fila"><button class="primario" id="calc">${Lg('Calcular el P1(z) de mi survey', 'Compute the P1(z) of my survey')}</button><span class="dato" id="prog"></span></p>
      <canvas class="vista alto" id="cono"></canvas>
      <label class="control" id="ctlZ" hidden><span>${Lg('rebanada en z', 'z slice')}</span><input type="range" id="zr" min="0.06" max="0.8" step="0.01" value="0.1"><output id="ozr"></output></label>
      <p class="fila" id="ctlG" hidden><button id="glob">${Lg('Comparar con el P1 global', 'Compare with the global P1')}</button></p>
      <p class="tenue pie">${Lg(`El cono es lo que mira tu survey: tú en la punta, y más lejos más z. Cada luz es una supernova que encontraste, del color de su clase.
        La rebanada muestra con qué mezcla de clases llegan las encontradas a ese z: eso es el P1(z).`,
        `The cone is what your survey looks at. You are at the tip, and farther away means higher z. Each light is a supernova you found, in the colour of its class.
        The slice shows the mix of classes among the ones found at that z. That is the P1(z).`)}</p>
      <canvas class="vista" id="pz"></canvas>
      <div id="demo"></div>
      <div id="tesis"></div>
      <div id="fin"></div>`;
    u.tex($('#ecP', c), String.raw`P_1:\;\; \pi_c \,\propto\, \sum_{s \in c} f_s\, g_s(z)\, V_s`);
    // el cono del survey con las encontradas y la rebanada de z
    const cono = Escenas.Cono($('#cono', c));
    let puntosCono = [], tCono = 0, zr = 0.1, verGlobal = false, prCono = null, vioBajo = false, vioAlto = false;
    u.animar(dt => {
      tCono += dt;
      const ps = puntosCono.filter(q => q.t0 <= tCono).map(q => ({ ...q, destello: tCono - q.t0 < 1 ? tCono - q.t0 : null }));
      const capas = [];
      if (prCono) {
        const fr = verGlobal ? prCono.global : prCono.en(zr), pIa = fr.Ia;
        capas.push({ z: zr, relleno: 'rgba(110,231,160,0.10)', color: '#6ee7a0', ancho: 2, torta: fr, radioTorta: 26,
          etiqueta: Lg(`${verGlobal ? 'P1 global' : 'P1(z)'} en z = ${zr.toFixed(2)}`, `${verGlobal ? 'global P1' : 'P1(z)'} at z = ${zr.toFixed(2)}`), colorEtiqueta: '#e8ecf8' });
        cono.dibujar(dt, { puntos: ps, capas, textos: [{ t: Lg(`encontradas: ${ps.length}`, `found: ${ps.length}`), color: '#ffb84d' },
          { t: Lg(`a z = ${zr.toFixed(2)}, de cada 100 encontradas, ${(100 * pIa).toFixed(0)} son Ia${verGlobal ? ' (P1 global: la misma en todo z)' : ''}`,
            `at z = ${zr.toFixed(2)}, out of every 100 found, ${(100 * pIa).toFixed(0)} are Ia${verGlobal ? ' (global P1: the same at all z)' : ''}`), color: '#e8ecf8' }] });
      } else cono.dibujar(dt, { puntos: ps, textos: [{ t: Lg('el cono de tu survey: aprieta Calcular', 'the cone of your survey: press Compute'), color: '#e8ecf8' }] });
      return true;
    });
    $('#zr', c).oninput = e => { zr = +e.target.value; $('#ozr', c).textContent = zr.toFixed(2); if (zr < 0.2) vioBajo = true; if (zr > 0.5) vioAlto = true;
      if (vioBajo && vioAlto && $('#ctlG', c).hidden) { $('#ctlG', c).hidden = false; u.hablar([['directora', Lg('Viste que la mezcla cambia con z. Ahora compara con un solo prior para todo el survey: el P1 global.', 'You saw that the mix changes with z. Now compare with a single prior for the whole survey: the global P1.')]]); } };
    $('#glob', c).onclick = () => { verGlobal = !verGlobal; $('#glob', c).textContent = verGlobal ? Lg('Volver al P1(z)', 'Back to P1(z)') : Lg('Comparar con el P1 global', 'Compare with the global P1'); };
    $('#ozr', c).textContent = zr.toFixed(2);
    $('#calc', c).onclick = () => {
      $('#calc', c).disabled = true; $('#prog', c).textContent = Lg('simulando la exposición de cada clase…', 'simulating the exposure of each class…');
      conPrior(rand, pr => {
        $('#prog', c).textContent = '';
        dibujarPrior($('#pz', c), pr);
        // una temporada del juego: el N de Ia por bin con cuatro priors, contra la verdad. Las verosimilitudes se calculan una vez:
        // cambiar el prior no pide ajustar de nuevo (como en la tesis).
        const sl = CLASES.reduce((a, k) => a + J.LI[k], 0), P0 = Object.fromEntries(CLASES.map(k => [k, J.LI[k] / sl]));
        const ZB = [[0.05, 0.25], [0.25, 0.45], [0.45, 0.75]], PRI = [['plano', Lg('igual para todas', 'equal for all'), '#8a93b8'], ['P0', 'P0', '#5ad1ff'], ['global', Lg('P1 global', 'global P1'), '#ffb84d'], ['P1z', 'P1(z)', '#6ee7a0']];
        const lista = [0, 1].flatMap(() => candidatos(rand).lista).filter(x => ZB.some(([a, b]) => x.sn.z >= a && x.sn.z < b));
        prCono = pr; tCono = 0;
        puntosCono = lista.map((x, i) => ({ z: x.sn.z, ...cono.direccion(rand), color: CL[x.sn.clase], r: 4, t0: 3 * i / lista.length }));
        $('#ctlZ', c).hidden = false;
        u.hablar([['operador', Lg('Ahí van apareciendo las que encontraste en dos temporadas. Fíjate: cerca hay de todos los colores, lejos casi solo amarillo, las Ia.', 'Here come the ones you found in two seasons. Look: nearby there are all colours, far away almost only yellow, the Ia.')],
          ['directora', Lg('Mueve la rebanada de z, primero cerca y después lejos, y mira cómo cambia la torta.', 'Move the z slice, first near and then far, and watch how the pie changes.')]]);
        const cuenta = ZB.map(() => ({ verdad: 0, plano: 0, P0: 0, global: 0, P1z: 0 }));
        $('#prog', c).textContent = Lg('clasificando dos temporadas…', 'classifying two seasons…');
        J.enPedazos(lista.length, 4, i => {
          const { sn, o } = lista[i], L = P.logVeros(o, sn.z), b = ZB.findIndex(([a, bb]) => sn.z >= a && sn.z < bb), x = cuenta[b];
          if (sn.clase === 'Ia') x.verdad++;
          const pri = { plano: PLANO, P0, global: pr.global, P1z: pr.en(sn.z) };
          for (const [k] of PRI) { const q = conPriorL(L, pri[k]); if (q) x[k] += q.Ia; }
        }, f => { $('#prog', c).textContent = Lg(`clasificando dos temporadas… ${(100 * f).toFixed(0)} %`, `classifying two seasons… ${(100 * f).toFixed(0)} %`); }, () => {
          $('#prog', c).textContent = '';
          const err = k => cuenta.reduce((a, x) => a + Math.abs(x[k] - x.verdad), 0), mejor = PRI.map(([k]) => k).sort((a, b) => err(a) - err(b))[0];
          const nMejor = PRI.find(x => x[0] === mejor)[1];
          $('#demo', c).innerHTML = `<div class="panel"><h3>${Lg('Cuántas Ia cuentas con cada prior (dos temporadas de tu juego)', 'How many Ia you count with each prior (two seasons of your game)')}</h3>
            <canvas class="grafico" id="nIa"></canvas>
            <div class="leyenda">${PRI.map(([, n, col]) => `<span><i style="background:${col}"></i>${n}</span>`).join('')}<span><i style="background:#b48cff"></i>${Lg('verdad', 'truth')}</span></div>
            <p>${Lg(`Mismas curvas, mismas verosimilitudes, solo cambia el prior. En tu juego el que más se acerca a la verdad es <b>${nMejor}</b>.`,
              `Same curves, same likelihoods, only the prior changes. In your game the one closest to the truth is <b>${nMejor}</b>.`)}
              ${cuenta.reduce((a, x) => a + x.plano - x.verdad, 0) < 0 ? Lg(`Con el prior plano el clasificador del juego pierde Ia: las débiles y con polvo se le van a las clases de curvas largas.
              Un prior que dice "a este z casi todo lo que encuentras es Ia" recupera parte. La tesis vio algo parecido en el BTS: la evidencia real tiene un sesgo contra las Ia.`,
              `With the flat prior the game classifier loses Ia. The faint and dusty ones slip into the classes with long curves.
              A prior that says "at this z almost everything you find is Ia" recovers some of them. The thesis saw something similar in the BTS: the real evidence is biased against Ia.`) :
              Lg('Esta vez el prior plano no pierde Ia. Repite la misión: con pocas supernovas por bin el resultado salta.', 'This time the flat prior does not lose Ia. Repeat the mission. With few supernovae per bin the result jumps around.')}</p></div>`;
          const ctx = Plot.preparar($('#nIa', c)), ymax = Math.max(...cuenta.flatMap(x => [x.verdad, ...PRI.map(([k]) => x[k])])) * 1.15;
          const T0 = Plot.ejes(ctx, { x0: -0.5, x1: ZB.length - 0.5, y0: 0, y1: ymax, xlabel: Lg('bin de z del candidato', 'candidate z bin'), ylabel: Lg('N de Ia', 'N of Ia'), xticks: ZB.map((b, i) => [i, `${b[0]} - ${b[1]}`]) });
          cuenta.forEach((x, i) => {
            PRI.forEach(([k, , col], j) => Plot.barras(ctx, T0, [i - 0.38 + 0.19 * j, i - 0.38 + 0.19 * (j + 1) - 0.02], [x[k]], col));
            Plot.linea(ctx, T0, [i - 0.45, i + 0.45], [x.verdad, x.verdad], '#b48cff', 3, [6, 4]);
          });
          tesisBts();
        });
        function tesisBts() {
          const co = T.bts.cocientes, nombres = { balanceado: Lg('igual para todas', 'equal for all'), P1: 'P1', P0: Lg('P0 (solo las tasas)', 'P0 (rates only)') };
          const priors = Object.keys(nombres).filter(k => co[k]);
          const re = T.bts.regla, sPl = f2(re.S_balanceado, 3), sP1 = f2(re.S_P1, 3);
          const rGl = f2(((T.sistematico.por_columna[0].fuentes['2a_info'] || {}).alternativas || {}).P1_global?.r), rCen = f2(T.sistematico.por_columna[0].r);
          $('#tesis', c).innerHTML = `<div class="panel"><h3>${Lg('La tesis: cómo se eligió el prior, en el BTS de ZTF', 'The thesis: how the prior was chosen, in the ZTF BTS')}</h3>
            <canvas class="grafico" id="bts"></canvas>
            <p>${Lg(`Antes de mirar la tasa de SUDARE, la tesis comparó en el Bright Transient Survey de ZTF (donde cada SN tiene su espectro) la tasa con tipos
              fotométricos contra la de tipos espectroscópicos. Regla fijada antes de mirar: se adopta P1 si baja S = |1 − q_Ia| + |1 − q_CC| respecto del prior plano, con q el cociente
              fotométrica / espectroscópica. S plano = ${sPl}, S de P1 = ${sP1}: ${re.adopta_P1 ? 'se adopta P1' : 'no se adopta P1'}.`,
              `Before looking at the SUDARE rate, the thesis compared, in the ZTF Bright Transient Survey (where every SN has its spectrum), the rate with photometric
              types against the rate with spectroscopic types. Rule fixed before looking: P1 is adopted if it lowers S = |1 − q_Ia| + |1 − q_CC| relative to the flat prior, with q the
              photometric / spectroscopic ratio. Flat S = ${sPl}, S of P1 = ${sP1}: ${re.adopta_P1 ? 'P1 is adopted' : 'P1 is not adopted'}.`)}</p>
            <p>${Lg(`El BTS cubre un rango angosto de z, así que ahí el prior es uno solo. SUDARE llega hasta z = 0.75, y el P1 global infla las Ia en los bines bajos:
              con él la tasa de Ia a z 0.05-0.15 sale ${rGl} en vez de ${rCen}.
              Por eso las tasas usan P1(z), adoptado después de esa alarma y declarado así en la tesis (sec:methods:rates:conv).`,
              `The BTS covers a narrow z range, so a single prior is enough there. SUDARE reaches z = 0.75, and the global P1 inflates the Ia in the low bins.
              With it the Ia rate at z 0.05-0.15 comes out ${rGl} instead of ${rCen}.
              That is why the rates use P1(z), adopted after that warning and declared as such in the thesis (sec:methods:rates:conv).`)}</p></div>`;
          const ctx = Plot.preparar($('#bts', c)), xs = [];
          const T0 = Plot.ejes(ctx, { x0: -0.6, x1: priors.length * 2 - 0.4, y0: 0, y1: 1.8, xlabel: Lg('prior (Ia amarillo, CC rojo)', 'prior (Ia yellow, CC red)'), ylabel: Lg('R fotométrica / R espectroscópica', 'photometric R / spectroscopic R'), xticks: priors.map((p, i) => [2 * i + 0.5, nombres[p]]) });
          priors.forEach((pn, i) => ['Ia', 'CC'].forEach((cl, j) => {
            const x = 2 * i + j, v = co[pn][cl]; if (!v) return;
            Plot.barras(ctx, T0, [x - 0.35, x + 0.35], [v.cociente], cl === 'Ia' ? CL.Ia : CL.II);
            Plot.linea(ctx, T0, [x, x], v.ic95, '#e8ecf8', 2);
            xs.push(x);
          }));
          Plot.hline(ctx, T0, 1, '#6ee7a0', Lg('1: la fotometría reproduce la espectroscopía', '1: photometry reproduces spectroscopy'));
          experta();
          }
      });
    };
    function experta() {
      const filas = T.sistematico.por_columna.filter(col => !col.no_usar).map(col => {
        const alt = (col.fuentes['2a'] || {}).alternativas || {}, p0 = alt['P0(z)'], gl = ((col.fuentes['2a_info'] || {}).alternativas || {}).P1_global;
        return `<tr><td>${col.columna}</td><td>${f2(col.r)}</td><td>${p0 ? f2(p0.r) : '–'}</td><td>${gl ? f2(gl.r) : '–'}</td></tr>`;
      }).join('');
      $('#fin', c).innerHTML = `<div class="panel"><h3>${Lg('Experta: P1 contra P0', 'Expert: P1 versus P0')}</h3>
        <p>${Lg(`Por Bayes, cuando el z del candidato se conoce su evidencia ya contiene el volumen en que su tipo es visible (por la LF), y P1 cuenta ese volumen
          dos veces: la deducción pide P0, la fracción de cada tipo entre las que explotan a ese z. Pero la regla escrita antes era empírica, y en el BTS
          eligió P1. Sin el z, P1 no baja S y sobreestima las Ia, así que su ganancia probablemente corrige un sesgo de la evidencia contra las Ia
          (Ia débiles que se van a Ibc) y no el volumen. El prior adoptado descansa en esa validación y no en la deducción. P0(z) va al sistemático (fuente 2a).`,
          `By Bayes, when the candidate's z is known its evidence already contains the volume in which its type is visible (through the LF), so P1 counts that volume
          twice. The derivation calls for P0, the fraction of each type among those that explode at that z. But the rule written beforehand was empirical, and in the BTS
          it chose P1. Without the z, P1 does not lower S and overestimates the Ia, so its gain probably corrects a bias of the evidence against Ia
          (faint Ia that slip into Ibc) and not the volume. The adopted prior rests on that validation, not on the derivation. P0(z) goes to the systematics (source 2a).`)}</p>
        <table class="tabla"><tr><th>bin</th><th>${Lg('tasa con P1(z)', 'rate with P1(z)')}</th><th>${Lg('con P0(z)', 'with P0(z)')}</th><th>${Lg('con el P1 global (información)', 'with the global P1 (information)')}</th></tr>${filas}</table>
        <p class="tenue">${window.CuadernoFuenteTesis ? window.CuadernoFuenteTesis() : ''}</p>
        <p><button class="primario" id="volver">${Lg('Volver al observatorio', 'Back to the observatory')}</button></p></div>`;
      u.desbloquear(m.ensena); u.marcar(m.id, true); u.sonar('fanfarria');
      $('#volver', c).onclick = () => fin({ gana: true });
      u.hablar([['directora', Lg('El prior no es un detalle: en los bines cercanos decide cuántas Ia cuentas. Por eso se eligió con una prueba fijada antes, y la alternativa va al sistemático.', 'The prior is not a detail. In the nearby bins it decides how many Ia you count. That is why it was chosen with a test fixed beforehand, and the alternative goes to the systematics.')]]);
    }
  }

  // ---------- 4.3 a qué distancia: el z y la migración entre bines ----------
  function redshift(m, fin) {
    const c = u.cont(), rand = U.rng(Date.now() % 1e9);
    const fr = T.reglas.migracion_fracciones, SIG_FOT = 0.04; // σ del photo-z: universo de juego
    c.innerHTML = `
      <div class="panel contrato"><h3>${Lg('¿A qué distancia está cada candidato?', 'How far away is each candidate?')}</h3>
        <p>${Lg(`Pocas tienen un z espectroscópico del host. La mayoría tiene un z fotométrico del host, con su error, y algunas no tienen host:
          su z sale del mismo ajuste de plantillas que da su tipo. Un z equivocado cambia a la supernova de bin.`,
          `Few have a spectroscopic host z. Most have a photometric host z, with its error, and some have no host.
          Their z comes from the same template fit that gives their type. A wrong z moves the supernova to another bin.`)}</p></div>
      <p class="fila"><button class="primario" id="calc">${Lg('Medir los z de una temporada', 'Measure the z of one season')}</button><button id="mover" hidden>${Lg('Aplicar el error del z', 'Apply the z error')}</button><span class="dato" id="prog"></span></p>
      <canvas class="vista alto" id="conoZ"></canvas>
      <p class="tenue pie">${Lg(`Las paredes del cono son los bordes de los bines de z de la tesis. Cada luz es una supernova en su z verdadero, del color de su
        tipo de z. Al aplicar el error, cada una se corre a su z medido: las que cruzan una pared (anillo blanco) cambian de bin.`,
        `The walls of the cone are the edges of the thesis z bins. Each light is a supernova at its true z, in the colour of its
        kind of z. When you apply the error, each one shifts to its measured z. The ones that cross a wall (white ring) change bin.`)}</p>
      <canvas class="vista" id="mig"></canvas>
      <div class="leyenda"><span><i style="background:#6ee7a0"></i>${Lg('z espectroscópico', 'spectroscopic z')}</span><span><i style="background:#ffb84d"></i>${Lg('z fotométrico', 'photometric z')}</span><span><i style="background:#ff6b6b"></i>${Lg('sin host (z del ajuste)', 'without a host (fitted z)')}</span></div>
      <div id="res"></div>
      <div id="fin"></div>`;
    $('#calc', c).onclick = () => {
      $('#calc', c).disabled = true; $('#prog', c).textContent = Lg('clasificando y ajustando z…', 'classifying and fitting z…');
      conPrior(rand, pr => {
        const { lista, tasas } = candidatos(rand);
        const muestra = lista.slice(0, 90), conZ = [];
        J.enPedazos(muestra.length, 4, i => {
          const { sn, o } = muestra[i], g = sn.clase === 'Ia' ? 'Ia' : 'CC', f = fr[`sudare_I|${g}`];
          const u0 = rand(), tipo = u0 < f.espec ? 'espec' : u0 < f.espec + f.fot ? 'fot' : 'sin_host';
          let zo = sn.z;
          if (tipo === 'fot') zo = Math.max(0.01, sn.z + SIG_FOT * (1 + sn.z) * Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.cos(2 * Math.PI * rand()));
          if (tipo === 'sin_host') zo = P.zMapa(o, { prior: pr.global }) ?? sn.z;
          conZ.push({ sn, o, tipo, zo });
        }, f => { $('#prog', c).textContent = Lg(`ajustando z… ${(100 * f).toFixed(0)} %`, `fitting z… ${(100 * f).toFixed(0)} %`); }, () => { $('#prog', c).textContent = ''; mostrar(conZ, tasas); });
      });
    };
    // el cono con las paredes de los bines: las supernovas se corren de su z verdadero a su z medido
    const conoZ = Escenas.Cono($('#conoZ', c)), COLZ = { espec: '#6ee7a0', fot: '#ffb84d', sin_host: '#ff6b6b' };
    let ptsZ = [], tMov = null;
    const paredes = [0.05, 0.15, 0.35, 0.55, 0.75].map(z => ({ z, color: 'rgba(90,209,255,0.55)', guiones: [4, 4], relleno: 'rgba(90,209,255,0.04)' }));
    u.animar(dt => {
      if (tMov !== null) tMov += dt;
      const e = tMov === null ? 0 : Math.min(1, tMov / 2.2), ee = 1 - (1 - e) ** 3;
      const ps = ptsZ.map(q => { const zz = q.z0 + (q.z1 - q.z0) * ee, cruzo = e >= 1 && binDe(q.z0) !== binDe(q.z1);
        return { z: zz, u: q.u, v: q.v, color: q.color, r: 4, anillo: cruzo ? '#ffffff' : null }; });
      const estelas = e > 0 ? ptsZ.filter(q => Math.abs(q.z1 - q.z0) > 0.01).map(q => ({ de: [q.z0, q.u, q.v], a: [q.z0 + (q.z1 - q.z0) * ee, q.u, q.v], color: q.color })) : [];
      const cambian = ptsZ.filter(q => binDe(q.z0) !== binDe(q.z1)).length;
      const txt = !ptsZ.length ? [{ t: Lg('las paredes: bordes de los bines de z de la tesis', 'the walls: edges of the thesis z bins'), color: '#5ad1ff' }]
        : [{ t: e < 1 ? Lg('cada supernova en su z verdadero', 'each supernova at its true z') : Lg(`${cambian} de ${ptsZ.length} cambiaron de bin (anillo blanco)`, `${cambian} of ${ptsZ.length} changed bin (white ring)`), color: '#e8ecf8' },
          { t: Lg('verde: z espectroscópico · ámbar: z fotométrico · rojo: sin host', 'green: spectroscopic z · amber: photometric z · red: no host'), color: '#aab3d0', tam: 11 }];
      conoZ.dibujar(dt, { puntos: ps, capas: paredes, estelas, textos: txt, tick: [0.15, 0.35, 0.55, 0.75] });
      return true;
    });
    $('#mover', c).onclick = () => { tMov = 0; $('#mover', c).disabled = true; u.sonar('blip'); };
    function mostrar(conZ, tasas) {
      ptsZ = conZ.map(x => ({ z0: x.sn.z, z1: x.zo, ...conoZ.direccion(rand), color: COLZ[x.tipo] }));
      $('#mover', c).hidden = false;
      u.hablar([['operador', Lg('Ahí está la temporada, cada una en su z verdadero. Ahora aprieta "Aplicar el error del z" y mira quién se mueve.', 'There is the season, each one at its true z. Now press "Apply the z error" and watch which ones move.')]]);
      // dispersión z verdadero contra z medido, con los bordes de los bines
      const { g, w, h } = Vista.h.lienzo($('#mig', c));
      V2.fondo(g, w, h);
      const mg = { i: 40, d: 14, s: 14, a: 30 }, zm = 0.8, px = z => mg.i + (w - mg.i - mg.d) * z / zm, py = z => h - mg.a - (h - mg.s - mg.a) * z / zm;
      g.strokeStyle = 'rgba(160,175,210,0.5)'; g.beginPath(); g.moveTo(mg.i, mg.s); g.lineTo(mg.i, h - mg.a); g.lineTo(w - mg.d, h - mg.a); g.stroke();
      g.strokeStyle = 'rgba(232,236,248,0.15)'; g.beginPath(); g.moveTo(px(0), py(0)); g.lineTo(px(zm), py(zm)); g.stroke();
      for (const [a] of BINS.concat([[0.75]])) { g.strokeStyle = 'rgba(90,209,255,0.35)'; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(px(a), mg.s); g.lineTo(px(a), h - mg.a); g.moveTo(mg.i, py(a)); g.lineTo(w - mg.d, py(a)); g.stroke(); g.setLineDash([]); }
      g.fillStyle = 'rgba(110,231,160,0.07)'; // los cuadrados de la diagonal: la SN queda en su bin
      for (const [a, b] of BINS) g.fillRect(px(a), py(b), px(b) - px(a), py(a) - py(b));
      const col = { espec: '#6ee7a0', fot: '#ffb84d', sin_host: '#ff6b6b' };
      for (const x of conZ) {
        const mig = binDe(x.sn.z) !== binDe(x.zo);
        g.fillStyle = col[x.tipo]; g.beginPath(); g.arc(px(x.sn.z), py(x.zo), mig ? 4.5 : 3, 0, 7); g.fill();
        if (mig) { g.strokeStyle = '#e8ecf8'; g.lineWidth = 1; g.beginPath(); g.arc(px(x.sn.z), py(x.zo), 6, 0, 7); g.stroke(); }
      }
      for (let z = 0; z <= zm + 1e-9; z += 0.2) { V2.texto(g, z.toFixed(1), px(z), h - mg.a + 14, { tam: 10, alin: 'center' }); V2.texto(g, z.toFixed(1), mg.i - 5, py(z) + 3, { tam: 10, alin: 'right' }); }
      V2.texto(g, Lg('z verdadero', 'true z'), (mg.i + w - mg.d) / 2, h - 6, { tam: 11, alin: 'center' });
      V2.texto(g, Lg('z con que se bina · dentro de un cuadrado verde la SN queda en su bin · círculo blanco: cambió de bin', 'z used for binning · inside a green square the SN stays in its bin · white circle: changed bin'), mg.i + 6, mg.s + 10, { tam: 11, color: '#e8ecf8' });
      const migran = conZ.filter(x => binDe(x.sn.z) !== binDe(x.zo)).length;
      // sesgo y dispersión de las sin host: el modelo de error que se aplica a las simuladas (modelado hacia adelante)
      const sh = conZ.filter(x => x.tipo === 'sin_host').map(x => (x.zo - x.sn.z) / (1 + x.sn.z));
      const sesgo = sh.length ? sh.reduce((a, b) => a + b, 0) / sh.length : 0, sd = sh.length > 1 ? Math.sqrt(sh.reduce((a, b) => a + (b - sesgo) ** 2, 0) / (sh.length - 1)) : 0.05;
      $('#res', c).innerHTML = `<div class="panel"><p>${Lg(`${migran} de ${conZ.length} candidatos cambiaron de bin. Las sin host de esta temporada: sesgo ${f2(sesgo, 3)} en Δz/(1+z), dispersión ${f2(sd, 3)}.`,
        `${migran} of ${conZ.length} candidates changed bin. The ones without a host this season: bias ${f2(sesgo, 3)} in Δz/(1+z), scatter ${f2(sd, 3)}.`)}</p>
        <p class="fila"><button class="primario" id="expo">${Lg('Calcular la tasa de Ia con la exposición binada de las dos formas', 'Compute the Ia rate with the exposure binned both ways')}</button><span class="dato" id="prog2"></span></p><div id="tabla"></div></div>`;
      $('#expo', c).onclick = () => {
        $('#expo', c).disabled = true; $('#prog2', c).textContent = Lg('simulando…', 'simulating…');
        setTimeout(() => {
          const Av = BINS.map(() => 0), Ao = BINS.map(() => 0), nSim = 2500, g0 = 'Ia', f = fr[`sudare_I|${g0}`];
          S1.campos.forEach((cp, ci) => {
            const [t0, t1] = P.ventana(cp), fac = F.deg2ASr(cp.area_deg2) * (t1 - t0) / 365.25 * P.integralN(P.ZMAX.Ia) / nSim;
            for (let i = 0; i < nSim; i++) {
              const sn = P.nuevaSN('Ia', ci, cp, rand), o = P.observar(sn, cp, { rand, corte: 0 });
              if (!o.seleccionada) continue;
              const u0 = rand(), gz = () => Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.cos(2 * Math.PI * rand());
              const zo = u0 < f.espec ? sn.z : u0 < f.espec + f.fot ? sn.z + SIG_FOT * (1 + sn.z) * gz() : sn.z + (1 + sn.z) * (sesgo + sd * gz());
              const bv = binDe(sn.z), bo = binDe(zo);
              if (bv >= 0) Av[bv] += fac; if (bo >= 0) Ao[bo] += fac;
            }
          });
          const N = BINS.map((_, i) => conZ.filter(x => x.sn.clase === 'Ia' && binDe(x.zo) === i).length);
          const filas = BINS.map((b, i) => `<tr><td>${b[0]}-${b[1]}</td><td>${N[i]}</td><td>${f2(1e4 * N[i] / Av[i])}</td><td>${f2(1e4 * N[i] / Ao[i])}</td><td>${f2(tasas.Ia)}</td></tr>`).join('');
          $('#prog2', c).textContent = '';
          const TIPOZ_EN = { espec: 'spectroscopic', fot: 'photometric', sin_host: 'without a host' };
          const fracs = Object.entries(fr['sudare_I|Ia']).map(([k, v]) => `${Lg(k, TIPOZ_EN[k] || k)} ${f2(v)}`).join(', ');
          const zvIa = T.sistematico.por_columna.filter(col => col.columna.startsWith('Ia')).map(col => `${col.columna.slice(3)}: ${f2(col.r)} → ${f2(((col.fuentes.zv || {}).alternativas || {}).z_verdadero?.r)}`).join(', ');
          $('#tabla', c).innerHTML = `<table class="tabla"><tr><th>${Lg('bin (z medido)', 'bin (measured z)')}</th><th>${Lg('N de Ia', 'N of Ia')}</th><th>${Lg('A binada por el z verdadero', 'A binned by the true z')}</th><th>${Lg('A binada por el z medido', 'A binned by the measured z')}</th><th>${Lg('verdadera', 'true')}</th></tr>${filas}</table>
            <p>${Lg(`Las supernovas reales se binan por su z medido. Si la exposición se bina por el z verdadero, N y A no hablan del mismo bin.
              La tesis bina la exposición por el z observado: a cada simulada le aplica el mismo modelo de error del z que a una real de su grupo (modelado hacia adelante).`,
              `Real supernovae are binned by their measured z. If the exposure is binned by the true z, N and A do not refer to the same bin.
              The thesis bins the exposure by the observed z. Each simulated SN gets the same z error model as a real one of its group (forward modelling).`)}</p>
            <p class="tenue">${Lg(`Fracciones de z espectroscópico, fotométrico y sin host: las medidas en SUDARE I por la tesis (${fracs} en las Ia).
              El error del photo-z, σ = ${SIG_FOT} (1+z), es un valor del juego ${marca}. El sesgo de las sin host sale de tu propio ajuste.`,
              `Fractions with a spectroscopic z, a photometric z and without a host: the ones the thesis measured in SUDARE I (${fracs} for the Ia).
              The photo-z error, σ = ${SIG_FOT} (1+z), is a game value ${marca}. The bias of the ones without a host comes from your own fit.`)}</p>
            <p>${Lg(`En la tesis, binar la exposición por el z verdadero (la columna de información zv del sistemático) da en las Ia
              ${zvIa}.`, `In the thesis, binning the exposure by the true z (the zv information column of the systematics) gives, for the Ia,
              ${zvIa}.`)}</p>
            <p><button class="primario" id="volver">${Lg('Volver al observatorio', 'Back to the observatory')}</button></p>`;
          u.desbloquear(m.ensena); u.marcar(m.id, true); u.sonar('fanfarria');
          $('#volver', c).onclick = () => fin({ gana: true });
          u.hablar([['directora', Lg('El z sin host de las plantillas tiende a salir bajo, y el del equipo de SUDARE más. Por eso la tesis mide ese sesgo con simulaciones y lo lleva a la exposición.', 'For SNe without a host, the template z tends to come out low, and the SUDARE team z even more so. That is why the thesis measures that bias with simulations and carries it into the exposure.')]]);
        }, 30);
      };
    }
  }

  // ---------- 4.4 lo que no es una supernova: AGN, PSN y completitud ----------
  function impostor(rand, cp, ci) { // un núcleo activo variable: detectado en muchas noches, sin subir ni bajar como una SN
    const base = 22 + rand() * 1.2, det = [];
    let m0 = base;
    for (const e of cp.epocas) {
      m0 += 0.12 * (rand() - 0.5);
      const s = P.sigmaMag(m0, e.maglim), mo = m0 + s * (rand() - 0.5) * 2;
      if (mo < e.maglim - P.BUSQUEDA.umbral) det.push({ t: e.mjd, m: mo, s, mlim: e.maglim, m50: e.m50 });
    }
    return { sn: { clase: 'AGN', z: 0.15 + 0.5 * rand(), campo: ci, x: rand(), y: rand(), agn: true }, o: { det, encontrada: det.length > 0, seleccionada: det.length >= 4, pico: Math.min(...det.map(d => d.m)) } };
  }
  function limpieza(m, fin) {
    const c = u.cont(), rand = U.rng(Date.now() % 1e9), eSN = T.e_sn.valor;
    c.innerHTML = `
      <div class="panel contrato"><h3>${Lg('No todo lo que varía es una supernova', 'Not everything that varies is a supernova')}</h3>
        <p>${Lg(`Entre tus candidatos hay núcleos activos de galaxias (AGN) que varían. La regla R2 de la tesis saca todo candidato que coincide con un AGN o una fuente
          de rayos X. Pero una supernova verdadera también puede caer encima de una por azar: la fracción e_SN se mide en las Ia seguras.`,
          `Among your candidates there are variable active galactic nuclei (AGN). Rule R2 of the thesis removes every candidate that matches an AGN or an
          X-ray source. But a real supernova can also land on top of one by chance. The fraction e_SN is measured in the secure Ia.`)}</p></div>
      <p class="fila"><button class="primario" id="calc">${Lg('Clasificar la temporada con sus impostores', 'Classify the season with its impostors')}</button><span class="dato" id="prog"></span></p>
      <canvas class="vista campo" id="mapa"></canvas>
      <div class="leyenda"><span><i style="background:#ffb84d"></i>${Lg('supernova: sube y se apaga una vez', 'supernova: rises and fades once')}</span><span><i style="background:#5ad1ff"></i>${Lg('núcleo activo: titila siempre', 'active nucleus: always flickers')}</span>
        <span><i style="background:#5ad1ff"></i>${Lg('círculo punteado: está en un catálogo de AGN o de rayos X', 'dotted circle: in an AGN or X-ray catalogue')}</span><span><i style="background:#ff6b6b"></i>${Lg('anillo rojo: sale por R2', 'red ring: removed by R2')}</span></div>
      <p class="fila"><button id="cruzar" hidden>${Lg('Cruzar con los catálogos', 'Cross-match with the catalogues')}</button><button id="r2" hidden>${Lg('Aplicar la regla R2', 'Apply rule R2')}</button></p>
      <canvas class="vista" id="frasR2" hidden></canvas>
      <p class="tenue pie" id="pieFras" hidden>${Lg('Los frascos: N de cada clase (suma de probabilidades, con P1(z)). La línea violeta es lo que deberían tener: las supernovas verdaderas.', 'The jars: N of each class (sum of probabilities, with P1(z)). The violet line is what they should hold: the real supernovae.')}</p>
      <div id="res"></div>
      <div id="fin"></div>`;
    $('#calc', c).onclick = () => {
      $('#calc', c).disabled = true;
      conPrior(rand, pr => {
        const { lista, tasas } = candidatos(rand);
        const sne = lista.slice(0, 70).map(x => ({ ...x, coincide: rand() < eSN, psn: x.o.det.length <= 6 && rand() < 0.5 }));
        const agn = Array.from({ length: 12 }, (_, i) => impostor(rand, S1.campos[i % 3], i % 3)).filter(x => x.o.seleccionada).map(x => ({ ...x, coincide: true, psn: rand() < 0.6 }));
        const todos = [...sne, ...agn];
        J.enPedazos(todos.length, 4, i => {
          const x = todos[i];
          x.prob = P.clasificar(x.o, { z: x.sn.z, prior: pr.en(x.sn.z) });
          x.clasificado = Object.values(x.prob).every(Number.isFinite);
        }, f => { $('#prog', c).textContent = Lg(`clasificando ${(100 * f).toFixed(0)} %`, `classifying ${(100 * f).toFixed(0)} %`); }, () => { $('#prog', c).textContent = ''; mostrar(todos, tasas); });
      });
    };
    // el campo vivo: las supernovas suben y se apagan una vez por ciclo, los AGN titilan siempre. Después, el barrido de los
    // catálogos (círculos punteados) y la regla R2 (anillos rojos, y lo que sale se apaga).
    let vivo = null;
    u.animar(dt => {
      if (!vivo) return true;
      const v = vivo; v.t += dt; if (v.barrido !== null) v.barrido = Math.min(1.2, v.barrido + dt * 0.45); if (v.r2 !== null) v.r2 = Math.min(1, v.r2 + dt * 0.7);
      const cv = $('#mapa', c), sn = [];
      for (const x of v.todos) {
        const fuera = v.r2 !== null && x.coincide ? 1 - v.r2 : 1;
        if (fuera <= 0.02) continue;
        let b;
        if (x.sn.agn) b = 0.45 + 0.25 * Math.sin(v.t * 1.7 + x.fase) + 0.12 * Math.sin(v.t * 4.3 + 2 * x.fase);
        else { const q = ((v.t + x.fase * 3) % 7) / 7; b = q < 0.12 ? q / 0.12 : Math.exp(-(q - 0.12) * 5); }
        sn.push({ x: x.sn.x, y: x.sn.y, color: x.sn.agn ? '#5ad1ff' : '#ffb84d', brillo: Math.max(0.05, b) * fuera });
      }
      Vista.campo(cv, { semilla: 41, sn });
      const g = cv.getContext('2d'), cw = cv.clientWidth, ch = cv.clientHeight;
      if (v.barrido !== null) {
        const xb = v.barrido * cw;
        g.strokeStyle = 'rgba(90,209,255,0.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(xb, 0); g.lineTo(xb, ch); g.stroke();
        g.setLineDash([3, 3]); g.lineWidth = 1.5;
        for (const x of v.todos.filter(t => t.coincide && t.sn.x * cw < xb)) { g.strokeStyle = '#5ad1ff'; g.beginPath(); g.arc(x.sn.x * cw, x.sn.y * ch, 9, 0, 7); g.stroke(); }
        g.setLineDash([]);
      }
      if (v.r2 !== null) { g.lineWidth = 2.5; for (const x of v.todos.filter(t => t.coincide)) { g.strokeStyle = `rgba(255,107,107,${1 - 0.6 * v.r2})`; g.beginPath(); g.arc(x.sn.x * cw, x.sn.y * ch, 13, 0, 7); g.stroke(); } }
      g.fillStyle = '#e8ecf8'; g.font = '12px system-ui, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'top';
      const nSale = v.todos.filter(t => t.coincide).length;
      g.fillText(v.r2 !== null ? Lg(`R2: salen ${nSale} (los AGN y las supernovas que caen encima de una fuente)`, `R2: ${nSale} removed (the AGN and the supernovae that land on a source)`)
        : v.barrido !== null ? Lg('cruzando con los catálogos de AGN (Milliquas) y de rayos X…', 'cross-matching with the AGN (Milliquas) and X-ray catalogues…')
        : Lg(`${v.todos.length} candidatos variables. ¿Cuáles son supernovas?`, `${v.todos.length} variable candidates. Which ones are supernovae?`), 8, 6);
      if (!$('#frasR2', c).hidden) {
        const e = v.r2 === null ? 0 : v.r2, N = Object.fromEntries(CLASES.map(k => [k, v.antes[k] + (v.despues[k] - v.antes[k]) * e]));
        V2.frascos($('#frasR2', c), { N, gotas: [], escala: v.escala, verdad: v.verdad });
      }
      return true;
    });
    function mostrar(todos, tasas) {
      todos.forEach(x => { x.fase = rand() * 6.28; });
      const w = x => (x.psn ? T.reglas.peso_psn : 1);
      const contar = lista => { const N = Object.fromEntries(CLASES.map(k => [k, 0])); lista.filter(x => x.clasificado).forEach(x => CLASES.forEach(k => { N[k] += w(x) * x.prob[k]; })); return N; };
      const antes = contar(todos), despues = contar(todos.filter(x => !x.coincide));
      const sel = todos.filter(x => !x.coincide), C = sel.reduce((a, x) => a + w(x), 0) / Math.max(1e-9, sel.filter(x => x.clasificado).reduce((a, x) => a + w(x), 0));
      const verdad = Object.fromEntries(CLASES.map(k => [k, sel.filter(x => !x.sn.agn && x.sn.clase === k).reduce((a, x) => a + w(x), 0)]));
      const deAgn = contar(todos.filter(x => x.sn.agn)), nAgn = todos.filter(x => x.sn.agn).length;
      const destino = [...CLASES].sort((a, b) => deAgn[b] - deAgn[a]);
      vivo = { t: 0, todos, barrido: null, r2: null, antes, despues, verdad, escala: Math.max(...CLASES.map(k => antes[k]), ...CLASES.map(k => verdad[k])) * 1.15 };
      $('#cruzar', c).hidden = false; $('#frasR2', c).hidden = false; $('#pieFras', c).hidden = false;
      u.hablar([['operador', Lg('Mira el campo un rato. Las supernovas suben y se apagan una vez. Los núcleos activos titilan todo el tiempo.', 'Watch the field for a while. Supernovae rise and fade once. Active nuclei flicker all the time.')],
        ['operador', Lg('Pero el clasificador solo ve la curva. Mira los frascos: hay más IIn de las que debería. Cruza con los catálogos.', 'But the classifier only sees the curve. Look at the jars: there are more IIn than there should be. Cross-match with the catalogues.')]]);
      $('#cruzar', c).onclick = () => { vivo.barrido = 0; $('#cruzar', c).disabled = true; setTimeout(() => { $('#r2', c).hidden = false; }, 2600); };
      $('#r2', c).onclick = () => { vivo.r2 = 0; $('#r2', c).disabled = true; u.sonar('blip'); setTimeout(resultado, 1700); };
      function resultado() {
      const dest = destino.filter(k => deAgn[k] > 0.05).map(k => `${k} (${f2(deAgn[k])})`).join(', ');
      const nSnFuera = todos.filter(x => x.coincide && !x.sn.agn).length, nSinCl = sel.filter(x => !x.clasificado).length;
      $('#res', c).innerHTML = `<div class="panel">
        <table class="tabla"><tr><th>${Lg('clase', 'class')}</th><th>${Lg('N con los impostores', 'N with the impostors')}</th><th>${Lg('de eso, aporte de los AGN', 'of that, from the AGN')}</th><th>${Lg('N después de R2', 'N after R2')}</th><th>${Lg('SNe verdaderas que quedan (con el peso de las PSN)', 'real SNe left (with the PSN weight)')}</th></tr>
          ${CLASES.map(k => `<tr><td style="color:${CL[k]}">${k}</td><td>${f2(antes[k])}</td><td>${f2(deAgn[k])}</td><td>${f2(despues[k])}</td><td>${f2(verdad[k])}</td></tr>`).join('')}</table>
        <p>${Lg(`Los ${nAgn} AGN que pasaron la selección se contaron como ${dest || 'nada: ninguno se pudo clasificar'}.
          Un AGN varía lento y sin la forma de una supernova, y el clasificador lo manda a la clase que mejor tolera una curva rara.
          Por eso la tesis los saca por catálogo y no por su curva, y reporta la CC total y no la IIn sola.`,
          `The ${nAgn} AGN that passed the selection ${nAgn === 1 ? 'was' : 'were'} counted as ${dest || 'nothing: none could be classified'}.
          An AGN varies slowly and without the shape of a supernova, and the classifier sends it to the class that best tolerates an odd curve.
          That is why the thesis removes them by catalogue and not by their curve, and reports the total CC and not the IIn alone.`)}</p>
        <p class="tenue">${Lg(`Cuántos AGN hay, su variabilidad y qué candidatos son PSN son valores del juego ${marca}.`, `How many AGN there are, their variability and which candidates are PSN are game values ${marca}.`)}</p>
        <p>${Lg(`R2 también sacó ${nSnFuera} supernovas verdaderas que caían sobre una fuente: por eso toda la exposición se multiplica por
          1 − e_SN = ${f2(1 - eSN, 3)} (e_SN = ${f2(eSN, 3)}, ${T.e_sn.k} de ${T.e_sn.n} Ia seguras de la tesis). Sin ese factor, la limpieza no es simétrica.`,
          `R2 also removed ${nSnFuera} real supernova${nSnFuera === 1 ? '' : 'e'} that fell on a source. That is why the whole exposure is multiplied by
          1 − e_SN = ${f2(1 - eSN, 3)} (e_SN = ${f2(eSN, 3)}, ${T.e_sn.k} of ${T.e_sn.n} secure Ia in the thesis). Without that factor, the cleaning is not symmetric.`)}</p>
        <div class="ecuacion" id="ecC"></div><p class="etiqueta">eq:methods:rates:completeness</p>
        <p>${Lg(`Las PSN (supernovas probables, con menos evidencia) pesan ${T.reglas.peso_psn}. Completitud de esta temporada: C = ${f2(C, 3)}
          (${nSinCl} seleccionadas sin clasificación).`,
          `PSN (probable supernovae, with less evidence) weigh ${T.reglas.peso_psn}. Completeness of this season: C = ${f2(C, 3)}
          (${nSinCl} selected without a classification).`)}</p>
        <p><button class="primario" id="volver">${Lg('Volver al observatorio', 'Back to the observatory')}</button></p></div>`;
      u.tex($('#ecC', c), String.raw`C_c(z_1, z_2) \,=\, \frac{\sum_{i \in \mathrm{selected}} w_i}{\sum_{i \in \mathrm{classified}} w_i}`);
      u.desbloquear(m.ensena); u.marcar(m.id, true); u.sonar('fanfarria');
      $('#volver', c).onclick = () => fin({ gana: true });
      const ag = T.agn_por_clase, pct = x => `${(100 * x).toFixed(0)} %`;
      const pMin = pct(Math.min(ag.Ia, ag.II, ag.Ibc)), pMax = pct(Math.max(ag.Ia, ag.II, ag.Ibc));
      u.hablar([['directora', Lg(`En SUDARE el ${pct(ag.IIn)} de las IIn coincidía con un AGN o una fuente X, contra ${pMin} a ${pMax} en las otras clases. De ahí salió la regla R2.`,
        `In SUDARE ${pct(ag.IIn)} of the IIn matched an AGN or an X-ray source, against ${pMin} to ${pMax} in the other classes. That is where rule R2 came from.`)],
        ['directora', Lg('Y la tesis la fijó, junto con e_SN, antes de ver su efecto en la tasa. Eso hay que poder decirlo en la defensa.', 'And the thesis fixed it, together with e_SN, before seeing its effect on the rate. You must be able to say that at the defence.')]]);
      }
    }
  }

  // ---------- 4.5 cuánto se equivoca: la matriz de confusión ----------
  // Como la figura de la tesis (fig:results:ztf:confmat): fila = clase verdadera, columna = clase asignada, cada fila suma 1.
  // N son los conteos (las matrices finales de la tesis los tienen). El dibujo interpola entre matrices para que se vea el cambio.
  function dibujarMatriz(cv, M, { titulo = '', N = null } = {}) {
    const { g, w, h } = Vista.h.lienzo(cv);
    V2.fondo(g, w, h);
    // en el teléfono el título se parte en líneas (en los ' · ' y en el primer ': ')
    const lineas = w < 560 ? titulo.replace(': ', ':\n').split(/\n| · /) : [titulo], dy = 15 * (lineas.length - 1);
    const mi = 78, ms = 60 + dy, lado = Math.min((w - mi - 12) / 4, (h - ms - 30) / 4), x0 = Math.max(mi, (w - 4 * lado) / 2), y0 = ms;
    lineas.forEach((l, k) => V2.texto(g, l, w / 2, 16 + 15 * k, { tam: 12, alin: 'center', color: '#e8ecf8' }));
    V2.texto(g, Lg('clase asignada →', 'assigned class →'), x0 + 2 * lado, 36 + dy, { tam: 11, alin: 'center' });
    CLASES.forEach((c, j) => V2.texto(g, c, x0 + (j + 0.5) * lado, y0 - 4, { tam: 13, alin: 'center', color: CL[c] }));
    CLASES.forEach((c, i) => V2.texto(g, c, x0 - 8, y0 + (i + 0.55) * lado, { tam: 13, alin: 'right', color: CL[c] }));
    V2.texto(g, Lg('clase verdadera ↓', 'true class ↓'), x0 - 76, y0 + 4 * lado + 18, { tam: 11 });
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const v = M[i][j], x = x0 + j * lado, y = y0 + i * lado;
      g.fillStyle = i === j ? `rgba(110,231,160,${0.12 + 0.8 * v})` : `rgba(255,107,107,${0.08 + 1.4 * v})`;
      g.fillRect(x + 2, y + 2, lado - 4, lado - 4);
      g.fillStyle = 'rgba(232,236,248,0.25)'; g.fillRect(x + 6, y + lado - 10, (lado - 12) * v, 4); // la fracción de la fila que cae ahí
      V2.texto(g, `${(100 * v).toFixed(0)}%`, x + lado / 2, y + lado / 2 + (N ? 0 : 5), { tam: Math.max(11, lado / 4.5), alin: 'center', color: '#fff' });
      if (N) V2.texto(g, `(${N[i][j]})`, x + lado / 2, y + lado / 2 + 16, { tam: Math.max(9, lado / 7), alin: 'center', color: '#e8ecf8' });
    }
  }
  function confusion(m, fin) {
    const c = u.cont(), rand = U.rng(Date.now() % 1e9), FZ = T.fuga_ztf, CF = T.confusion_final;
    const iz = CLASES.map(k => FZ.clases.indexOf(k)), ic = CLASES.map(k => CF.clases.indexOf(k)); // por si el orden de la tesis cambia
    const M0 = CLASES.map(() => CLASES.map(() => 0));
    let mostrada = M0.map(f => f.slice()), meta = M0, N = null, titulo = '';
    const SIS = [['plantillas_4c', Lg('Plantillas', 'Templates')], ['red_jerarquica_4c', Lg('Red', 'Network')], ['villar_4c', 'Villar']].filter(([k]) => CF.sistemas[k]);
    c.innerHTML = `
      <div class="panel contrato"><h3>${Lg('¿Cuánto se equivoca el clasificador?', 'How wrong is the classifier?')}</h3>
        <p>${Lg(`En el juego sabes el tipo verdadero de cada supernova simulada: clasifícalas y mira a dónde va a parar cada clase. Fila = lo que era,
          columna = lo que el clasificador dijo, igual que en la figura de la tesis. La diagonal (verde) es acertar.`,
          `In the game you know the true type of every simulated supernova. Classify them and see where each class ends up. Row = what it was,
          column = what the classifier said, as in the thesis figure. The diagonal (green) is a correct call.`)}</p></div>
      <p class="fila"><button class="primario" id="jugar">${Lg('Clasificar 100 supernovas del juego', 'Classify 100 game supernovae')}</button><span class="dato" id="prog"></span></p>
      <p class="fila" id="tesisBtns">${SIS.map(([k, n]) => `<button data-s="${k}" disabled>${Lg('Tesis', 'Thesis')}: ${n}</button>`).join('')}<button id="sis2c" disabled>${Lg('Tesis: la del sistemático 2c', 'Thesis: the 2c systematic')}</button></p>
      <canvas class="vista" id="rio"></canvas>
      <p class="tenue pie">${Lg(`El río: de cada clase verdadera (izquierda) salen gotas que llegan a la clase que dijo el clasificador (derecha).
        El ancho de cada cinta es la fracción. Lo que cruza hacia otra clase es la confusión.`,
        `The river: drops leave each true class (left) and reach the class the classifier said (right).
        The width of each ribbon is the fraction. What crosses to another class is the confusion.`)}</p>
      <canvas class="vista" id="mat"></canvas>
      <div id="lectura"></div>
      <div id="fin"></div>`;
    const rio = Escenas.Flujo($('#rio', c));
    u.animar(dt => {
      let cambia = false;
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const d = meta[i][j] - mostrada[i][j]; if (Math.abs(d) > 1e-4) { mostrada[i][j] += d * Math.min(1, dt * 5); cambia = true; } }
      if (cambia) dibujarMatriz($('#mat', c), mostrada, { titulo, N });
      rio.dibujar(dt, meta === M0 ? null : meta);
      return true;
    });
    dibujarMatriz($('#mat', c), mostrada, { titulo: Lg('todavía vacía', 'still empty') });
    const iI = CLASES.indexOf('II'), iN = CLASES.indexOf('IIn'), iA = CLASES.indexOf('Ia'), iB = CLASES.indexOf('Ibc');
    const leer = (quien, extra = '') => {
      const aN = (100 * meta[iI][iN]).toFixed(0), aB = (100 * meta[iI][iB]).toFixed(0), aA = (100 * meta[iA][iA]).toFixed(0);
      $('#lectura', c).innerHTML = `<div class="panel"><p><b>${quien}.</b> ${Lg(`De cada 100 II verdaderas, ${aN} se cuentan como IIn
        y ${aB} como Ibc. De cada 100 Ia, ${aA} se cuentan como Ia.`, `Out of every 100 true II, ${aN} are counted as IIn
        and ${aB} as Ibc. Out of every 100 Ia, ${aA} are counted as Ia.`)}</p>${extra}</div>`;
    };
    $('#jugar', c).onclick = () => {
      $('#jugar', c).disabled = true;
      conPrior(rand, pr => {
        const { lista } = candidatos(rand, { tasas: { Ia: 1, II: 1, Ibc: 1, IIn: 1 } }); // tasas iguales: cada fila con su muestra
        const muestra = lista.sort(() => rand() - 0.5).slice(0, 100), suma = M0.map(f => f.slice()), nV = Object.fromEntries(CLASES.map(k => [k, 0]));
        titulo = Lg('tu clasificador en el universo de juego (suma de probabilidades, prior P1(z) del juego)', 'your classifier in the game universe (sum of probabilities, game P1(z) prior)'); N = null;
        J.enPedazos(muestra.length, 3, i => {
          const { sn, o } = muestra[i], p = P.clasificar(o, { z: sn.z, prior: pr.en(sn.z) });
          if (!Object.values(p).every(Number.isFinite)) return;
          const f = CLASES.indexOf(sn.clase); nV[sn.clase]++;
          CLASES.forEach((k, j) => { suma[f][j] += p[k]; });
          meta = suma.map((fila, ii) => fila.map(v => v / Math.max(1, nV[CLASES[ii]])));
        }, f => { $('#prog', c).textContent = Lg(`clasificando ${(100 * f).toFixed(0)} %`, `classifying ${(100 * f).toFixed(0)} %`); }, () => {
          $('#prog', c).textContent = `${Object.entries(nV).map(([k, v]) => `${k} ${v}`).join(' · ')}`;
          leer(Lg('En tu juego', 'In your game'));
          c.querySelectorAll('#tesisBtns button').forEach(b => { b.disabled = false; });
        });
      });
    };
    const vistas = new Set();
    c.querySelectorAll('#tesisBtns button[data-s]').forEach(b => b.onclick = () => {
      const S = CF.sistemas[b.dataset.s], nombre = SIS.find(x => x[0] === b.dataset.s)[1];
      const cnt = ic.map(i => ic.map(j => S.confusion[i][j])), filas = cnt.map(f => f.reduce((a, x) => a + x, 0));
      N = cnt; meta = cnt.map((f, i) => f.map(x => x / Math.max(1, filas[i])));
      const ba = `${f2(S.bal_acc)} [${f2(S.bal_acc_ic95[0])}, ${f2(S.bal_acc_ic95[1])}]`;
      titulo = Lg(`tesis, ${nombre}: mitad final de ZTF, ${S.n} SNe · exactitud balanceada ${ba}`, `thesis, ${nombre}: final half of ZTF, ${S.n} SNe · balanced accuracy ${ba}`);
      leer(Lg(`Tesis, clasificador ${nombre}`, `Thesis, ${nombre} classifier`), Lg(`<p>Son las matrices de la figura de la tesis (fig:results:ztf:confmat): la mitad final del holdout de ZTF, cada SN a su clase más probable.
        De ${filas[iI]} II verdaderas, ${cnt[iI][iN]} van a IIn y ${cnt[iI][iB]} a Ibc.</p>`,
        `<p>These are the matrices of the thesis figure (fig:results:ztf:confmat): the final half of the ZTF holdout, each SN assigned to its most probable class.
        Of ${filas[iI]} true II, ${cnt[iI][iN]} go to IIn and ${cnt[iI][iB]} to Ibc.</p>`));
      vistas.add(b.dataset.s); if (vistas.has('plantillas_4c') && vistas.has('2c')) cerrar();
    });
    $('#sis2c', c).onclick = () => {
      N = null; meta = iz.map(t => iz.map(a => FZ.P1z[a][t])); // en la tesis esta va con fila asignada y columna verdadera: se traspone
      titulo = Lg(`tesis, sistemático 2c: plantillas en la mitad de validación de ZTF (${FZ.n} SNe), suma de probabilidades con P1(z)`,
        `thesis, systematic 2c: templates on the ZTF validation half (${FZ.n} SNe), sum of probabilities with P1(z)`);
      leer(Lg('La matriz del sistemático 2c', 'The matrix of systematic 2c'), Lg(`<p>Esta no es la de la figura: es la que usa el error sistemático. Viene de la otra mitad de ZTF (validación; la final nunca se usa para ajustar nada),
        suma las probabilidades en vez de tomar la clase más probable y usa el prior P1(z). Por eso sus números se parecen a los de la figura pero no son iguales.</p>`,
        `<p>This is not the one in the figure. It is the one the systematic error uses. It comes from the other half of ZTF (validation, while the final half is never used to tune anything),
        it sums the probabilities instead of taking the most probable class, and it uses the P1(z) prior. That is why its numbers look like those in the figure but are not the same.</p>`));
      vistas.add('2c'); if (vistas.has('plantillas_4c') && vistas.has('2c')) cerrar();
    };
    function cerrar() {
      if ($('#volver', c)) return;
      const filas = T.sistematico.por_columna.filter(col => !col.no_usar).map(col => {
        const a = (col.fuentes['2c'] || {}).alternativas || {};
        return `<tr><td>${col.columna}</td><td>${f2(col.r)}</td><td>${a.confusion_ztf_val ? f2(a.confusion_ztf_val.r) : '–'}</td><td>${a.fuga_sudare_I ? f2(a.fuga_sudare_I.r) : '–'}</td></tr>`;
      }).join('');
      // las notas vienen en castellano de data/tesis.js; si el script de la tesis las cambia, se ven en castellano
      const NOTAS_EN = {
        'mitad final del holdout de ZTF: fila = clase espectroscópica, columna = clase asignada (fig:results:ztf:confmat)': 'final half of the ZTF holdout: row = spectroscopic class, column = assigned class (fig:results:ztf:confmat)',
        'validación de ZTF: fila asignada, columna verdadera (suma de probabilidades)': 'ZTF validation: assigned row, true column (sum of probabilities)',
      };
      const notaCF = Lg(CF.nota, NOTAS_EN[CF.nota] || CF.nota), notaFZ = Lg(FZ.nota, NOTAS_EN[FZ.nota] || FZ.nota);
      $('#fin', c).innerHTML = `<div class="panel"><h3>${Lg('Qué hace la tesis con la confusión', 'What the thesis does with the confusion')}</h3>
        <p>${Lg(`La tasa central no se corrige con una matriz. La confusión entra como fuente 2c del error sistemático: la tasa se recalcula con la matriz de validación de ZTF,
          y con la fuga a IIn medida en las SNe de SUDARE I con tipo espectroscópico, como cota superior.`,
          `The central rate is not corrected with a matrix. The confusion enters as source 2c of the systematic error. The rate is recomputed with the ZTF validation matrix,
          and with the leakage to IIn measured in the SUDARE I SNe with a spectroscopic type, as an upper bound.`)}</p>
        <table class="tabla"><tr><th>bin</th><th>${Lg('tasa', 'rate')}</th><th>${Lg('con la confusión de ZTF', 'with the ZTF confusion')}</th><th>${Lg('con la fuga de SUDARE I', 'with the SUDARE I leakage')}</th></tr>${filas}</table>
        <p class="tenue">${notaCF}. ${Lg('La del 2c', 'The 2c one')}: ${notaFZ}. ${window.CuadernoFuenteTesis()}</p>
        <p><button class="primario" id="volver">${Lg('Volver al observatorio', 'Back to the observatory')}</button></p></div>`;
      u.desbloquear(m.ensena); u.marcar(m.id, true); u.sonar('fanfarria');
      $('#volver', c).onclick = () => fin({ gana: true });
      u.hablar([['directora', Lg('Por eso la tesis reporta la CC total y no la IIn sola: lo que se pierde entre II e IIn queda dentro de la CC.', 'That is why the thesis reports the total CC and not the IIn alone. What gets mixed up between II and IIn stays inside the CC.')]]);
    }
  }

  window.Cap4 = { candidatos, conPrior, conPriorL, impostor }; // el árbitro (cap. 5) usa la misma temporada y el mismo prior
  M.registrar('escritorio', escritorio);
  M.registrar('prior', prior);
  M.registrar('redshift', redshift);
  M.registrar('limpieza', limpieza);
  M.registrar('confusion', confusion);
  M.agregar([
    { id: '4.1', cap: 4, titulo: Lg('El escritorio de candidatos', 'The candidate desk'), tipo: 'escritorio', donde: 'consolas', ensena: ['clasificador'],
      contrato: [
        ['directora', Lg('Ya encuentras supernovas, pero no sabes qué son: SUDARE casi no tiene espectros. Lo único que tienes es la curva de luz.', 'You already find supernovae, but you do not know what they are. SUDARE has almost no spectra. All you have is the light curve.')],
        ['directora', Lg('En las consolas está el escritorio de candidatos: el clasificador de plantillas de la tesis te da la probabilidad de cada clase. Cuenta con eso.', 'The candidate desk is at the consoles. The thesis template classifier gives you the probability of each class. Use it to count.')],
      ],
      abre: [['operador', Lg('Mira cómo calza cada plantilla sobre los puntos, y echa el candidato a los frascos.', 'Watch how each template fits the points, then drop the candidate into the jars.')]] },
    { id: '4.2', cap: 4, titulo: Lg('El prior P1(z)', 'The P1(z) prior'), tipo: 'prior', donde: 'consolas', ensena: ['prior'],
      contrato: [['directora', Lg('Antes de mirar una curva ya sabes algo: cuántas de cada clase esperas a ese z. Ese es el prior. Calcúlalo para tu survey en las consolas.', 'Before looking at a curve you already know something: how many of each class you expect at that z. That is the prior. Compute it for your survey at the consoles.')]] },
    { id: '4.3', cap: 4, titulo: Lg('A qué distancia', 'How far away'), tipo: 'redshift', donde: 'consolas', ensena: ['errorz'],
      contrato: [['directora', Lg('El z de un candidato no siempre es exacto. Mide los z de una temporada y mira cuántas supernovas cambian de bin.', 'The z of a candidate is not always exact. Measure the z of one season and see how many supernovae change bin.')]] },
    { id: '4.4', cap: 4, titulo: Lg('Lo que no es una supernova', 'What is not a supernova'), tipo: 'limpieza', donde: 'consolas', ensena: ['completitud'],
      contrato: [['directora', Lg('Entre tus candidatos hay impostores: núcleos activos que varían. Límpialos como la tesis, sin romper la simetría.', 'Among your candidates there are impostors: variable active nuclei. Clean them out as the thesis does, without breaking the symmetry.')]] },
    { id: '4.5', cap: 4, titulo: Lg('Cuánto se equivoca', 'How wrong it gets'), tipo: 'confusion', donde: 'consolas', ensena: [],
      contrato: [['directora', Lg('Un clasificador se mide donde sabes la respuesta. En el juego la sabes siempre, y en ZTF la tesis la tuvo por los espectros. Compara las dos.', 'A classifier is tested where you know the answer. In the game you always know it, and in ZTF the thesis had it from the spectra. Compare the two.')]] },
  ]);
})();
