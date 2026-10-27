// Capítulo 5: el árbitro. El error estadístico (Gehrels) y el sistemático: cada fuente cambia un supuesto, se recalcula la tasa
// y las diferencias se suman en cuadratura, cada una a su lado. Primero en el universo de juego, después con el presupuesto de la tesis.
(() => {
  const M = Misiones, u = M.util, F = Fisica, U = Universo, P = Poblacion, V2 = Vista2, J = window.Juego, C4 = window.Cap4;
  const $ = (s, r = document) => r.querySelector(s);
  const S1 = window.SUDARE1, T = window.TESIS, f2 = u.f2, marca = u.marca, CL = V2.CL, CLASES = V2.CLASES;
  const ZB = [[0.15, 0.45], [0.45, 0.75]];
  const binDe = z => ZB.findIndex(([a, b]) => z >= a && z < b);
  const COLF = { '1': '#ffb84d', '2a': '#b48cff', '4': '#ff6b6b', '5': '#5ad1ff', '6a': '#6ee7a0', '7': '#f0a6ff', '10': '#e8ecf8' };
  const nombreFuente = id => { const n = (T.sistematico.fuentes[id] || {}).nombre || id; return Lg(n, FUENTES_EN[id] || n); };
  // la tabla de reglas tardías viene en castellano de data/tesis.js: si una celda cambia y no está aquí, sale en castellano
  const POSTHOC_EN = {
    'regla': 'rule', 'fecha': 'date', 'resultado que la motivó': 'result that motivated it', 'efecto': 'effect',
    'corte de la eficiencia en el m50': 'efficiency cut at the m50',
    'con la ec. 1 literal el tiempo de control salía 1.4–4.4 veces el de SUDARE I (bitácora 2026-10-19-ct-ec3-sudare)':
      'with eq. 1 taken literally, the control time came out 1.4–4.4 times that of SUDARE I (log 2026-10-19-ct-ec3-sudare)',
    'sube la tasa. En la primera etapa de la auditoría, posteriores (b), plantillas: Ia 0.27 → 0.28, 0.44 → 0.46, 0.35 → 0.37, 0.35 → 0.44, CC 0.92 → 1.00, 0.89 → 1.08':
      'raises the rate. In the first stage of the audit, later seasons (b), templates: Ia 0.27 → 0.28, 0.44 → 0.46, 0.35 → 0.37, 0.35 → 0.44, CC 0.92 → 1.00, 0.89 → 1.08',
    'los 32 sn fuera de las listas de enero': 'the 32 sn outside the January lists',
    'pedido 2026-10-14, registrado 2026-10-16': 'requested 2026-10-14, recorded 2026-10-16',
    'la CC 0.15–0.35 de las posteriores casi se duplicaba al pasar de las listas de enero a la base web':
      'the CC 0.15–0.35 of the later seasons almost doubled when going from the January lists to the web database',
    'posteriores, plantillas: CC 1.97 → 1.44 y 2.24 → 1.65, Ia casi igual': 'later seasons, templates: CC 1.97 → 1.44 and 2.24 → 1.65, Ia almost unchanged',
    'z del bin de las posteriores = z_map': 'bin z of the later seasons = z_map',
    'con el z de las listas la Ia 0.05–0.15 de las posteriores daba 0.81 (bitácora 2026-10-20-tasas-final-sudare)':
      'with the z from the lists, the Ia 0.05–0.15 of the later seasons gave 0.81 (log 2026-10-20-tasas-final-sudare)',
    'esa Ia 0.81 → 0.20': 'that Ia 0.81 → 0.20',
    'z de host de catálogo y sus controles 1 a 3': 'catalogue host z and its checks 1 to 3',
    'exceso de Ia de 0.15–0.35 sobre los tipos de SUDARE I en las SNe sin host. Los controles se fijaron después de la primera tasa con 63 z de catálogo':
      'excess of Ia at 0.15–0.35 over the SUDARE I types in the SNe without a host. The checks were fixed after the first rate with 63 catalogue z',
    'combinada: Ia 0.33 → 0.32, 0.55 → 0.45, 0.44 → 0.46, 0.60 → 0.70, CC 1.30 → 1.34, 1.96 → 1.74':
      'combined: Ia 0.33 → 0.32, 0.55 → 0.45, 0.44 → 0.46, 0.60 → 0.70, CC 1.30 → 1.34, 1.96 → 1.74',
    'limpieza de AGN con catálogos': 'AGN cleaning with catalogues',
    'CC 0.05–0.15 sobre la literatura y candidatos de varias temporadas (bitácora 2026-10-25-ndet-sudare)':
      'CC 0.05–0.15 above the literature and candidates in several seasons (log 2026-10-25-ndet-sudare)',
    'combinada: Ia igual, CC 1.34 → 1.22 y 1.74 → 1.63': 'combined: Ia unchanged, CC 1.34 → 1.22 and 1.74 → 1.63',
    'z_map en las SNe de SUDARE I sin host (y z de host más allá de la grilla)': 'z_map for the SUDARE I SNe without a host (and host z beyond the grid)',
    'con la tasa ya calculada: la Ia 0.05–0.15 combinada sobre el máximo de la literatura (0.32 contra 0.26) y el zSN de las sin host sesgado bajo':
      'with the rate already computed: the combined Ia 0.05–0.15 above the literature maximum (0.32 against 0.26) and the zSN of those without a host biased low',
    'combinada: Ia 0.32 → 0.28, 0.45 → 0.46, 0.46 → 0.43, 0.70 → 0.72, CC 1.22 → 1.15, 1.63 → 1.58':
      'combined: Ia 0.32 → 0.28, 0.45 → 0.46, 0.46 → 0.43, 0.70 → 0.72, CC 1.22 → 1.15, 1.63 → 1.58',
    'fuente 8 del sistemático con nuestros residuos': 'systematic source 8 with our residuals',
    'Mauricio vio demasiado grande la barra de la Ia 0.05–0.15 (+82 %)': 'Mauricio found the Ia 0.05–0.15 bar too large (+82 %)',
    'sistemático total Ia 0.05–0.15 +82 → +33 %, CC 0.05–0.15 +42 → +36 %. Desde la auditoría la fuente 8 es una variante del modelo de error del z':
      'total systematic Ia 0.05–0.15 +82 → +33 %, CC 0.05–0.15 +42 → +36 %. Since the audit, source 8 is a variant of the z error model',
    'prior P1(z) en vez del P1 global': 'P1(z) prior instead of the global P1',
    '2026-10-25 (auditoría, segunda etapa)': '2026-10-25 (audit, second stage)',
    'con el P1 global la Ia 0.05–0.15 daba 0.40 (máximo de la literatura 0.26) y las dos CC quedaban bajo el mínimo':
      'with the global P1, the Ia 0.05–0.15 gave 0.40 (literature maximum 0.26) and both CC fell below the minimum',
    'combinada, con todo lo demás de la tercera ronda: Ia 0.38 → 0.25, 0.56 → 0.51, 0.44 → 0.46, 0.60 → 0.62, CC 0.99 → 1.25, 1.22 → 1.48':
      'combined, with everything else from the third round: Ia 0.38 → 0.25, 0.56 → 0.51, 0.44 → 0.46, 0.60 → 0.62, CC 0.99 → 1.25, 1.22 → 1.48',
    'regla de varias temporadas': 'multi-season rule',
    '2026-10-25 (auditoría, segunda etapa, y k = 2 con falsos en la tercera ronda)': '2026-10-25 (audit, second stage, and k = 2 with false candidates in the third round)',
    'la CC 0.05–0.15 sobre la literatura y candidatos con detecciones en varias temporadas, vistos al limpiar los AGN (bitácora 2026-10-25-ndet-sudare)':
      'the CC 0.05–0.15 above the literature and candidates with detections in several seasons, seen while cleaning the AGN (log 2026-10-25-ndet-sudare)',
    'combinada: con k = 1 sin falsos (segunda etapa) Ia 0.49 → 0.46 en 0.15–0.35, CC 1.18 → 1.03 y 1.39 → 1.35. Con k = 2 y falsos (tercera ronda) Ia 0.25 → 0.25, 0.50 → 0.51, 0.46 → 0.46, 0.62 → 0.62, CC 1.22 → 1.25, 1.48 → 1.48':
      'combined: with k = 1 without false candidates (second stage) Ia 0.49 → 0.46 at 0.15–0.35, CC 1.18 → 1.03 and 1.39 → 1.35. With k = 2 and false candidates (third round) Ia 0.25 → 0.25, 0.50 → 0.51, 0.46 → 0.46, 0.62 → 0.62, CC 1.22 → 1.25, 1.48 → 1.48',
    'regla R2 de AGN (toda coincidencia B o C fuera, la exposición por 1 − e_SN)': 'AGN rule R2 (every class B or C match removed, the exposure times 1 − e_SN)',
    '2026-10-25 noche (diagnóstico de las IIn)': '2026-10-25 night (diagnosis of the IIn)',
    'las IIn como sumidero: el 16 % del N de IIn coincide con un AGN de clase B o C, contra 8–10 % en las otras clases (Fisher p 0.02). La regla y e_SN (Ia seguras, 6 de 85) se fijaron antes de ver su efecto en la tasa':
      'the IIn as a sink: 16 % of the IIn N coincides with a class B or C AGN, against 8–10 % in the other classes (Fisher p 0.02). The rule and e_SN (secure Ia, 6 of 85) were fixed before seeing their effect on the rate',
    'combinada: Ia 0.25 → 0.23, 0.51 → 0.49, 0.46 → 0.47, 0.62 → 0.62, CC 1.25 → 1.08, 1.48 → 1.40':
      'combined: Ia 0.25 → 0.23, 0.51 → 0.49, 0.46 → 0.47, 0.62 → 0.62, CC 1.25 → 1.08, 1.48 → 1.40',
  };
  const posthocEn = v => Lg(v, POSTHOC_EN[v] || v);

  // Error de Gehrels a 1σ sobre N, llevado a la tasa.
  const stat = (r, N) => { const g = F.gehrels(N); return N > 0 ? [r * (1 - g.lo / N), r * (g.hi / N - 1)] : [0, r]; };

  // ---------- 5.1 el árbitro, en el universo de juego ----------
  function arbitro(m, fin) {
    const c = u.cont(), rand = U.rng(Date.now() % 1e9), eSN = T.e_sn.valor;
    let vida = 100, base = null, lista = [], tentado = false, posthoc = { aplicada: false, declarada: false };
    const presupuesto = ZB.map(() => ({})); // fuente -> {mas, menos}
    const cacheA = new Map();
    c.innerHTML = `
      <div class="panel contrato"><h3>${Lg('El árbitro', 'The referee')}</h3>
        <p>${Lg(`Tu tasa tiene dos errores. El estadístico sale de contar pocas supernovas (Gehrels). El sistemático sale de tus supuestos:
          cada vez que el cálculo necesita algo que no se mide bien, eliges un valor. El árbitro cambia cada supuesto por una alternativa razonable,
          recalcula y te muestra cuánto se mueve la tasa. Si se mueve fuera de tu barra, esa fuente faltaba en tu presupuesto.`,
          `Your rate has two errors. The statistical one comes from counting few supernovae (Gehrels). The systematic one comes from your assumptions:
          every time the calculation needs something that is not measured well, you choose a value. The referee swaps each assumption for a reasonable alternative,
          recalculates and shows you how much the rate moves. If it moves outside your bar, that source was missing from your budget.`)}</p></div>
      <div class="credibilidad"><span>${Lg('Credibilidad', 'Credibility')}</span><div class="barra"><i id="vida" style="width:100%"></i></div><span class="dato" id="nvida">100</span></div>
      <p class="fila"><button class="primario" id="empezar">${Lg('Calcular mi tasa (dos temporadas de SUDARE I)', 'Compute my rate (two SUDARE I seasons)')}</button><span class="dato" id="prog"></span></p>
      <canvas class="vista alto" id="arena"></canvas>
      <div class="leyenda"><span><i style="background:#ffd166"></i>${Lg('tu tasa', 'your rate')}</span><span><i style="background:#ffb84d"></i>${Lg('barra estadística', 'statistical bar')}</span>
        <span><i style="background:#ff6b6b"></i>${Lg('escudo: barra total (estadística y sistemática en cuadratura)', 'shield: total bar (statistical and systematic in quadrature)')}</span><span><i style="background:#b48cff"></i>${Lg('verdad (al final)', 'truth (at the end)')}</span></div>
      <div id="relato"></div>
      <p class="fila" id="acciones" hidden><button class="primario" id="atacar">${Lg('Que ataque el árbitro', 'Let the referee attack')}</button>
        <button class="tentacion" id="tentar">${Lg('Ajustar a la literatura ✨', 'Fit to the literature ✨')}</button>${marca}</p>
      <canvas class="vista" id="cuad" style="height:260px" hidden></canvas>
      <p class="tenue pie" id="pieCuad" hidden>${Lg(`Cada cuadrado es una fuente, de lado Δ (lo que mueve la tasa). El cuadrado rojo tiene la misma área que todos juntos:
        su lado es el error sistemático, √(Σ Δ²). Una fuente grande pesa mucho más que varias chicas.`,
        `Each square is a source, with side Δ (how much it moves the rate). The red square has the same area as all of them together:
        its side is the systematic error, √(Σ Δ²). One large source weighs much more than several small ones.`)}</p>
      <div id="post"></div>
      <div id="fin"></div>`;
    const golpe = d => {
      vida = Math.max(0, vida - d); $('#vida', c).style.width = `${vida}%`; $('#nvida', c).textContent = vida;
      c.classList.remove('golpe'); void c.offsetWidth; c.classList.add('golpe'); u.sonar('campana');
    };

    // exposición de las Ia por bin con un supuesto cambiado; la misma semilla en todas para que la diferencia sea el supuesto y no el ruido
    function expo(op = {}) {
      const k = JSON.stringify(op);
      if (cacheA.has(k)) return cacheA.get(k);
      const minDet = P.BUSQUEDA.minDet;
      if (op.ndet) P.BUSQUEDA.minDet = op.ndet;
      const A = P.exposicion({ campos: S1.campos, clase: 'Ia', nSim: 1500, rand: U.rng(4242), bins: ZB, corte: op.corte ?? 0, dlf: op.dlf ?? 0, polvo: op.polvo ?? 1 }).A;
      P.BUSQUEDA.minDet = minDet;
      cacheA.set(k, A);
      return A;
    }
    function contar(op = {}) {
      const wpsn = op.wpsn ?? T.reglas.peso_psn, ndet = op.ndet ?? 4, N = ZB.map(() => 0);
      for (const x of lista) {
        if (x.o.det.length < ndet || (op.r2 && x.coincide)) continue;
        const b = binDe(x.z); if (b < 0) continue;
        const pr = op.prior === 'P0' ? x.pri.P0 : op.prior === 'global' ? x.pri.global : x.pri.P1z;
        const q = C4.conPriorL(x.L, pr); if (!q) continue;
        N[b] += (x.psn ? wpsn : 1) * q.Ia;
      }
      return N;
    }
    const NREP = 2; // dos temporadas del mismo survey: la exposición cuenta dos veces
    const tasaDe = (N, A, fA = 1) => N.map((n, i) => 1e4 * n / (NREP * A[i] * fA));
    function totalSys(i) {
      const fs = Object.values(presupuesto[i]);
      return [Math.sqrt(fs.reduce((a, f) => a + f.menos ** 2, 0)), Math.sqrt(fs.reduce((a, f) => a + f.mas ** 2, 0))];
    }
    // la escena: el combate en la sala y la cuadratura en áreas, cada cuadro
    const arena = Escenas.Combate($('#arena', c)), cuad = Escenas.Cuadratura($('#cuad', c));
    let verVerdad = false;
    u.animar(dt => { arena.dibujar(dt); if (!$('#cuad', c).hidden) cuad.dibujar(dt); return true; });
    function dibujar() {
      arena.poner({ r: base.r, st: base.st, sys: ZB.map((_, i) => totalSys(i)), verdad: base.verdad, mostrarVerdad: verVerdad, etiquetas: ZB.map(b => `Ia, z ${b[0]}-${b[1]}`) });
    }
    const ponerCuadrados = () => cuad.poner(ZB.map((b, i) => ({ titulo: `z ${b[0]}-${b[1]}`,
      fuentes: Object.entries(presupuesto[i]).map(([id, v]) => ({ id, d: Math.max(v.mas, v.menos), color: COLF[id] })) })));

    $('#empezar', c).onclick = () => {
      $('#empezar', c).disabled = true; $('#prog', c).textContent = Lg('observando y clasificando…', 'observing and classifying…');
      C4.conPrior(rand, pr => {
        const tasas = J.tasasJuego(rand), sl = CLASES.reduce((a, k) => a + J.LI[k], 0), P0 = Object.fromEntries(CLASES.map(k => [k, J.LI[k] / sl]));
        const minDet = P.BUSQUEDA.minDet; P.BUSQUEDA.minDet = 3; // guardo también las de 3 detecciones, para el ataque del corte
        const sel = Array.from({ length: NREP }, () => C4.candidatos(rand, { tasas }).lista).flat();
        const agn = Array.from({ length: 10 }, (_, i) => C4.impostor(rand, S1.campos[i % 3], i % 3)).filter(x => x.o.det.length >= 3);
        P.BUSQUEDA.minDet = minDet;
        const todos = [...sel, ...agn].filter(x => binDe(x.sn.z) >= 0);
        J.enPedazos(todos.length, 4, i => {
          const { sn, o } = todos[i];
          lista.push({ z: sn.z, o, agn: !!sn.agn, psn: o.det.length <= 6 && rand() < 0.5, coincide: sn.agn || rand() < eSN,
            L: P.logVeros(o, sn.z), pri: { P1z: pr.en(sn.z), global: pr.global, P0 } });
        }, f => { const pc = (100 * f).toFixed(0); $('#prog', c).textContent = Lg(`clasificando ${pc} %`, `classifying ${pc} %`); }, () => {
          $('#prog', c).textContent = Lg('simulando la exposición…', 'simulating the exposure…');
          setTimeout(() => {
            const N = contar(), A = expo(), r = tasaDe(N, A);
            base = { N, A, r, st: r.map((x, i) => stat(x, N[i])), verdad: tasas.Ia };
            $('#prog', c).textContent = '';
            dibujar();
            $('#relato', c).innerHTML = `<div class="panel"><p>${Lg(`N de Ia por bin: ${N.map(f2).join(' y ')} (suma de probabilidades con P1(z), las PSN a ${T.reglas.peso_psn}).
              La barra ámbar es Gehrels a 1σ sobre ese N: con pocas supernovas es asimétrica, más larga hacia arriba.`,
              `Ia N per bin: ${N.map(f2).join(' and ')} (sum of probabilities with P1(z), PSN weighted ${T.reglas.peso_psn}).
              The amber bar is Gehrels at 1σ on that N: with few supernovae it is asymmetric, longer upwards.`)}</p></div>`;
            $('#acciones', c).hidden = false; $('#cuad', c).hidden = false; $('#pieCuad', c).hidden = false;
            ponerCuadrados();
            u.hablar([['examinador2', Lg('Muy bonita la barra. Pero solo cuenta el azar de contar pocas. ¿Y tus supuestos? Déjeme probarlos uno por uno.',
              'Very nice bar. But it only covers the chance of counting few. What about your assumptions? Let me test them one by one.')]]);
          }, 20);
        });
      });
    };

    // los ataques: fuente, qué cambia y cómo recalcular (N, A o los dos, siempre con la misma regla en reales y simuladas)
    const ATAQUES = [
      { id: '1', que: Lg('el peso de las PSN', 'the PSN weight'), toca: 'N', texto: Lg('Las supernovas probables pesan 0.5. ¿Y si todas fueran SNe (peso 1) o ninguna (peso 0)?', 'Probable supernovae weigh 0.5. What if all were SNe (weight 1) or none (weight 0)?'),
        alts: [[Lg('peso 0', 'weight 0'), () => tasaDe(contar({ wpsn: 0 }), base.A)], [Lg('peso 1', 'weight 1'), () => tasaDe(contar({ wpsn: 1 }), base.A)]] },
      { id: '2a', que: Lg('el prior de clase', 'the class prior'), toca: 'N', texto: Lg('Usaste P1(z). ¿Y con P0 (solo las tasas relativas) o con el P1 global?', 'You used P1(z). What about P0 (only the relative rates) or the global P1?'),
        alts: [['P0', () => tasaDe(contar({ prior: 'P0' }), base.A)], [Lg('P1 global', 'global P1'), () => tasaDe(contar({ prior: 'global' }), base.A)]] },
      { id: '4', que: Lg('el polvo del host', 'the host dust'), toca: 'A', texto: Lg('Tu simulación supone un polvo. ¿Y si hubiera la mitad, o 1.5 veces?', 'Your simulation assumes some dust. What if there were half as much, or 1.5 times as much?'),
        alts: [[Lg('polvo × 0.5', 'dust × 0.5'), () => tasaDe(base.N, expo({ polvo: 0.5 }))], [Lg('polvo × 1.5', 'dust × 1.5'), () => tasaDe(base.N, expo({ polvo: 1.5 }))]] },
      { id: '5', que: Lg('la función de luminosidad', 'the luminosity function'), toca: 'A', texto: Lg('¿Y si las Ia fueran 0.2 mag más brillantes, o más débiles, de lo que supones?', 'What if the Ia were 0.2 mag brighter, or fainter, than you assume?'),
        alts: [['LF − 0.2 mag', () => tasaDe(base.N, expo({ dlf: -0.2 }))], ['LF + 0.2 mag', () => tasaDe(base.N, expo({ dlf: 0.2 }))]] },
      { id: '6a', que: Lg('el corte de la eficiencia', 'the efficiency cut'), toca: 'A', texto: Lg('Cortaste la eficiencia en el m50. ¿Y si el corte estuviera 0.3 o 0.5 mag más débil?', 'You cut the efficiency at the m50. What if the cut were 0.3 or 0.5 mag fainter?'),
        alts: [['m50 + 0.3', () => tasaDe(base.N, expo({ corte: 0.3 }))], ['m50 + 0.5', () => tasaDe(base.N, expo({ corte: 0.5 }))]] },
      { id: '7', que: Lg('el corte de detecciones', 'the detection cut'), toca: 'N y A', texto: Lg('Pides 4 detecciones. ¿Y con 3, o con 5? El cambio va igual en las reales y en las simuladas.', 'You ask for 4 detections. What about 3, or 5? The change applies equally to the real and the simulated ones.'),
        alts: [['n_det ≥ 3', () => tasaDe(contar({ ndet: 3 }), expo({ ndet: 3 }))], ['n_det ≥ 5', () => tasaDe(contar({ ndet: 5 }), expo({ ndet: 5 }))]],
        trampa: () => tasaDe(contar({ ndet: 5 }), base.A) },
    ];
    let ia = 0;
    $('#atacar', c).onclick = () => {
      const at = ATAQUES[ia];
      if (!at) return;
      $('#atacar', c).disabled = true; $('#relato', c).innerHTML = `<div class="panel"><p>${Lg('El árbitro ataca', 'The referee attacks')}: <b>${at.que}</b>. ${at.texto} <span class="tenue">${Lg('calculando…', 'computing…')}</span></p></div>`;
      setTimeout(() => {
        const alts = at.alts.map(([n, fn]) => [n, fn()]);
        const fant = [], filas = [];
        let fuera = 0;
        ZB.forEach((_, i) => {
          const r0 = base.r[i], sy = totalSys(i), lo = Math.hypot(base.st[i][0], sy[0]), hi = Math.hypot(base.st[i][1], sy[1]);
          let mas = 0, menos = 0;
          alts.forEach(([n, rs], k) => {
            const d = rs[i] - r0, out = d > hi || -d > lo;
            if (out) fuera++;
            if (d > 0) mas = Math.max(mas, d); else menos = Math.max(menos, -d); // cada alternativa va a su lado, sin simetrizar
            fant.push({ i, k, r: rs[i], color: COLF[at.id], fuera: out });
          });
          presupuesto[i][at.id] = { mas, menos };
          filas.push(`<tr><td>z ${ZB[i][0]}-${ZB[i][1]}</td><td>${f2(r0)}</td>${alts.map(([, rs]) => `<td>${f2(rs[i])}</td>`).join('')}<td>+${f2(mas)} / −${f2(menos)}</td></tr>`);
        });
        const nuevo = presupuesto.map(p => ({ ...p })); ZB.forEach((_, i) => { delete presupuesto[i][at.id]; }); // el escudo crece recién después del golpe
        const fueraAlt = alts.map(([, rs]) => rs.map((ra, i) => { const sy = totalSys(i), d = ra - base.r[i]; return d > Math.hypot(base.st[i][1], sy[1]) || -d > Math.hypot(base.st[i][0], sy[0]); }));
        let trampa = '';
        if (at.trampa) {
          const rt = at.trampa();
          trampa = `<p>${Lg(`Si cambias el corte solo en las reales (5 detecciones) y dejas la exposición con 4, la tasa sale ${rt.map(f2).join(' y ')}:
            cuenta menos supernovas con la misma exposición. Por eso la regla va igual en las dos. Es la selección simétrica.`,
            `If you change the cut only in the real SNe (5 detections) and leave the exposure at 4, the rate comes out ${rt.map(f2).join(' and ')}:
            it counts fewer supernovae with the same exposure. That is why the rule applies equally to both. It is the symmetric selection.`)}</p>`;
        }
        $('#relato', c).innerHTML = `<div class="panel"><p>${Lg(`El árbitro ataca: <b>${at.que}</b> (fuente ${at.id} de la tesis: ${nombreFuente(at.id)}). ${at.texto}`,
          `The referee attacks: <b>${at.que}</b> (thesis source ${at.id}: ${nombreFuente(at.id)}). ${at.texto}`)}</p>
          <table class="tabla"><tr><th>bin</th><th>${Lg('tu tasa', 'your rate')}</th>${alts.map(([n]) => `<th>${n}</th>`).join('')}<th>${Lg('al presupuesto', 'to the budget')}</th></tr>${filas.join('')}</table>
          <p>${fuera ? Lg(`${fuera} de las alternativas cayó fuera de tu escudo (punto rojo): esa fuente faltaba. Pierdes credibilidad y la fuente entra al presupuesto.`,
              `${fuera} of the alternatives fell outside your shield (red dot): that source was missing. You lose credibility and the source enters the budget.`)
            : Lg('Todas las alternativas caen dentro de tu escudo: el ataque no pasa, pero la fuente igual entra al presupuesto con su efecto medido, y el escudo crece.',
              'All the alternatives fall inside your shield: the attack does not get through, but the source still enters the budget with its measured effect, and the shield grows.')}</p>${trampa}</div>`;
        // el ataque vuela, empuja la tasa a sus alternativas y, si alguna sale del escudo, el golpe pasa; después el escudo crece
        arena.atacar({ id: at.id, nombre: at.que, color: COLF[at.id], alts: alts.map(([, rs]) => rs), fuera: ZB.map((_, i) => fueraAlt.some(f => f[i])), fueraAlt,
          alHacer: () => { if (fuera) golpe(8); },
          alTerminar: () => {
            ZB.forEach((_, i) => { presupuesto[i][at.id] = nuevo[i][at.id]; });
            dibujar(); ponerCuadrados();
            ia++;
            $('#atacar', c).disabled = false;
            if (ia >= ATAQUES.length) { $('#atacar', c).hidden = true; momentoPostHoc(); }
          } });
      }, 30);
    };

    $('#tentar', c).onclick = () => {
      tentado = true; golpe(vida);
      $('#acciones', c).hidden = true;
      $('#fin', c).innerHTML = `<div class="panel veredicto mal"><h3>${Lg('El árbitro gana', 'The referee wins')}</h3>
        <p>${Lg(`Ajustar a la literatura es elegir por parecido con la tasa publicada. Es justo lo que la regla 0 de la tesis prohíbe: cada elección se decide
          con un observable de los datos o con la validación en ZTF, nunca por parecido con SUDARE I o con la literatura.
          La literatura es una alarma: si tu tasa cae fuera de su rango, buscas la causa y la declaras, pero no cambias de variante por eso.`,
          `Fitting to the literature means choosing by resemblance to the published rate. That is exactly what rule 0 of the thesis forbids: every choice is decided
          with an observable from the data or with the ZTF validation, never by resemblance to SUDARE I or to the literature.
          The literature is an alarm: if your rate falls outside its range, you look for the cause and declare it, but you do not switch variants because of it.`)}</p>
        <p><button class="primario" id="otra">${Lg('Intentarlo de nuevo', 'Try again')}</button></p></div>`;
      // sin marcar: la misión queda pendiente hasta ganarla
      $('#otra', c).onclick = () => u.pantalla(arbitro, m, fin);
      u.hablar([['examinador2', Lg('Ajustó a la literatura. Entonces su tasa no mide nada: repite lo que ya sabíamos.', 'You fitted to the literature. Then your rate measures nothing: it repeats what we already knew.')]]);
    };

    function momentoPostHoc() {
      $('#post', c).innerHTML = `<div class="panel"><h3>${Lg('Leo encontró algo', 'Leo found something')}</h3>
        <p>${Lg(`Mirando tus candidatos, después de ver tu tasa, Leo encontró fuentes que varían en todas las noches sin subir ni bajar como una supernova: núcleos activos.
          Hay una limpieza correcta (la regla R2 de la tesis): sacar todo candidato que coincide con un AGN o una fuente X, y multiplicar la exposición por 1 − e_SN,
          porque la regla también saca supernovas verdaderas que caen encima por azar.`,
          `Looking at your candidates, after seeing your rate, Leo found sources that vary on every night without rising and falling like a supernova: active nuclei.
          There is a correct cleaning (rule R2 of the thesis): remove every candidate that coincides with an AGN or an X-ray source, and multiply the exposure by 1 − e_SN,
          because the rule also removes true supernovae that happen to fall on top of one by chance.`)}</p>
        <p class="fila"><button id="limpiar">${Lg('Aplicar la limpieza de AGN', 'Apply the AGN cleaning')}</button></p>
        <label class="fila" id="lblDeclarar" hidden><input type="checkbox" id="declarar"> ${Lg('Declararla con fecha: regla adoptada después de ver la tasa, con su efecto', 'Declare it with a date: rule adopted after seeing the rate, with its effect')}</label>
        <p class="fila"><button class="primario" id="presentar">${Lg('Presentar el resultado', 'Present the result')}</button></p></div>`;
      u.hablar([['operador', Lg('Ojo, encontré AGN entre tus candidatos. La limpieza es legítima, pero la estás decidiendo después de ver tu tasa.', 'Careful, I found AGN among your candidates. The cleaning is legitimate, but you are deciding it after seeing your rate.')]]);
      $('#limpiar', c).onclick = () => {
        posthoc.aplicada = true; $('#limpiar', c).disabled = true; $('#lblDeclarar', c).hidden = false;
        const N = contar({ r2: true }), r = tasaDe(N, base.A, 1 - eSN);
        const dr = r.map((x, i) => x - base.r[i]);
        base.N = N; base.r = r; base.st = r.map((x, i) => stat(x, N[i]));
        dibujar();
        const ef = dr.map((d, i) => `z ${ZB[i][0]}-${ZB[i][1]} ${d >= 0 ? '+' : ''}${f2(d)}`).join(', ');
        $('#post', c).querySelector('h3').insertAdjacentHTML('afterend', `<p>${Lg('Efecto de la limpieza', 'Effect of the cleaning')}: ${ef}.</p>`);
      };
      $('#declarar', c).onchange = e => { posthoc.declarada = e.target.checked; };
      $('#presentar', c).onclick = presentar;
    }
    function presentar() {
      if (tentado) return;
      $('#presentar', c).disabled = true; $('#acciones', c).hidden = true;
      const critico = posthoc.aplicada && !posthoc.declarada;
      if (critico) golpe(60);
      const dentro = ZB.map((_, i) => { const sy = totalSys(i), d = base.verdad - base.r[i]; return d >= 0 ? d <= Math.hypot(base.st[i][1], sy[1]) : -d <= Math.hypot(base.st[i][0], sy[0]); });
      const gana = !critico;
      verVerdad = true; dibujar();
      const nf = Object.keys(presupuesto[0]).length, nd = dentro.filter(Boolean).length;
      $('#fin', c).innerHTML = `<div class="panel veredicto ${gana ? 'ok' : 'mal'}"><h3>${gana ? Lg('Resultado aceptado', 'Result accepted') : Lg('Golpe crítico', 'Critical hit')}</h3>
        ${critico ? Lg('<p>Aplicaste una regla después de ver tu tasa y no lo dijiste. Aunque la regla sea correcta, quien lee no puede saber cuánto de tu resultado viene de elegir mirando. La tesis declara cada una con su fecha, lo que la motivó y su efecto.</p>',
            '<p>You applied a rule after seeing your rate and did not say so. Even if the rule is correct, the reader cannot know how much of your result comes from choosing while looking. The thesis declares each one with its date, what motivated it and its effect.</p>')
          : `<p>${Lg(`Tu presupuesto tiene ${nf} fuentes.`, `Your budget has ${nf} source${nf === 1 ? '' : 's'}.`)} ${posthoc.aplicada ? Lg('La limpieza de AGN quedó declarada como regla adoptada después de ver la tasa.', 'The AGN cleaning was declared as a rule adopted after seeing the rate.')
            : Lg('No aplicaste la limpieza: también es honesto, y la diferencia iría como fuente del sistemático.', 'You did not apply the cleaning: that is honest too, and the difference would go in as a systematic source.')}</p>`}
        <p>${Lg(`La verdad ${marca} cae ${dentro.every(Boolean) ? 'dentro de tu barra total en los dos bines' : `dentro de tu barra total en ${nd} de 2 bines`}.
          Credibilidad final: ${vida}.`,
          `The truth ${marca} falls ${dentro.every(Boolean) ? 'inside your total bar in both bins' : `inside your total bar in ${nd} of 2 bins`}.
          Final credibility: ${vida}.`)}</p>
        <p><button class="primario" id="volver">${Lg('Volver al observatorio', 'Back to the observatory')}</button>${gana ? '' : ` <button id="otra">${Lg('Intentarlo de nuevo', 'Try again')}</button>`}</p></div>`;
      if (gana) { u.desbloquear(m.ensena); u.marcar(m.id, true); } // un golpe crítico deja la misión pendiente
      u.sonar(gana ? 'fanfarria' : 'campana');
      $('#volver', c).onclick = () => fin({ gana });
      if (!gana) $('#otra', c).onclick = () => u.pantalla(arbitro, m, fin);
      u.hablar(gana ? [['examinador2', Lg('Bien. Cada supuesto medido, cada regla tardía con su fecha. Eso se puede defender.', 'Good. Every assumption measured, every late rule with its date. That can be defended.')]]
        : [['examinador2', Lg('La regla puede ser buena, pero si no la declara, no le puedo creer el número.', 'The rule may be good, but if you do not declare it, I cannot believe your number.')]]);
    }
  }

  // ---------- 5.2 el presupuesto de la tesis ----------
  function presupuestoTesis(m, fin) {
    const c = u.cont(), cols = T.sistematico.por_columna;
    let sel = 0, vistas = new Set();
    c.innerHTML = `
      <div class="panel contrato"><h3>${Lg('El presupuesto de error de la tesis', 'The thesis error budget')}</h3>
        <p>${Lg(`Cada fuente reemplaza un supuesto por una alternativa razonable y recalcula la tasa con todo lo demás fijo. Si hay alternativas a los dos lados,
          cada una va a su lado. Una sola alternativa va solo al lado donde cae, sin simetrizar. El total de cada lado es la suma en cuadratura.`,
          `Each source replaces an assumption with a reasonable alternative and recalculates the rate with everything else fixed. If there are alternatives on both sides,
          each one goes to its own side. A single alternative goes only to the side where it falls, without symmetrising. The total on each side is the sum in quadrature.`)}</p></div>
      <p class="fila" id="bines">${cols.map((col, i) => `<button data-i="${i}">${col.columna}${col.no_usar ? Lg(' (no es resultado)', ' (not a result)') : ''}</button>`).join('')}</p>
      <canvas class="vista" id="tornado"></canvas>
      <canvas class="vista" id="cuad" style="height:270px"></canvas>
      <p class="tenue pie">${Lg(`Cada cuadrado es una fuente, de lado Δ, y aparecen de a uno. El rojo crece hasta tener la misma área que todos juntos: su lado es el total.
        Abajo, la suma lineal (ámbar) contra la cuadratura (rojo): la cuadratura siempre queda más corta, y la manda la fuente más grande.`,
        `Each square is a source, with side Δ, and they appear one at a time. The red one grows until it has the same area as all of them together: its side is the total.
        Below, the linear sum (amber) against the quadrature (red): the quadrature always comes out shorter, and the largest source dominates it.`)}</p>
      <div id="lectura"></div>
      <div id="libro"></div>
      <div id="fin"></div>`;
    const cuad52 = Escenas.Cuadratura($('#cuad', c));
    u.animar(dt => { cuad52.dibujar(dt); return true; });
    function mostrar() {
      const col = cols[sel], fs = Object.entries(col.fuentes).filter(([, v]) => v.en_total).map(([id, v]) => ({ id, ...v }))
        .sort((a, b) => Math.max(b.mas, b.menos) - Math.max(a.mas, a.menos));
      const info = Object.entries(col.fuentes).filter(([, v]) => !v.en_total);
      // tornado: cada fuente con su barra a la izquierda (−) y a la derecha (+)
      const { g, w, h } = Vista.h.lienzo($('#tornado', c));
      V2.fondo(g, w, h);
      const angosto = w < 520, mi = angosto ? w * 0.34 : Math.min(260, w * 0.42), filas = fs.length + 2, alto = (h - 40) / filas, cx = mi + (w - mi - 20) / 2;
      const mx = Math.max(...fs.map(f => Math.max(f.mas, f.menos)), col.total.mas, col.total.menos, col.stat[0], col.stat[1]) * 1.05;
      const esc = (w - mi - 30) / 2 / mx;
      V2.texto(g, `${col.columna}: ${Lg('tasa', 'rate')} ${f2(col.r)}${angosto ? '' : Lg(' · cada fuente mueve la tasa hacia abajo (izquierda) o hacia arriba (derecha)', ' · each source moves the rate down (left) or up (right)')}`, 10, 16, { tam: 12, color: '#e8ecf8' });
      g.strokeStyle = 'rgba(232,236,248,0.4)'; g.beginPath(); g.moveTo(cx, 26); g.lineTo(cx, h - 10); g.stroke();
      const fila = (y, nombre, menos, mas, color, grueso) => {
        V2.texto(g, nombre, mi - 8, y + alto / 2 + 4, { tam: 11, alin: 'right', color: grueso ? '#e8ecf8' : '#aab3d0' });
        g.fillStyle = color; g.fillRect(cx - menos * esc, y + 3, menos * esc, alto - 6); g.fillRect(cx, y + 3, mas * esc, alto - 6);
        if (menos > 0.004) V2.texto(g, `−${f2(menos)}`, cx - menos * esc - 4, y + alto / 2 + 4, { tam: 10, alin: 'right' });
        if (mas > 0.004) V2.texto(g, `+${f2(mas)}`, cx + mas * esc + 4, y + alto / 2 + 4, { tam: 10 });
      };
      fs.forEach((f, k) => fila(28 + k * alto, `${f.id} ${T.sistematico.fuentes[f.id] ? nombreFuente(f.id).split(' (')[0] : ''}`.slice(0, angosto ? 15 : 40), f.menos, f.mas, 'rgba(255,107,107,0.75)'));
      fila(28 + fs.length * alto, angosto ? Lg('sistemático', 'systematic') : Lg('total sistemático (cuadratura)', 'total systematic (quadrature)'), col.total.menos, col.total.mas, '#ff6b6b', true);
      fila(28 + (fs.length + 1) * alto, angosto ? Lg('estadístico', 'statistical') : Lg('estadístico (Gehrels 1σ)', 'statistical (Gehrels 1σ)'), col.stat[0], col.stat[1], '#ffb84d', true);
      // los cuadrados de la cuadratura, lado abajo y lado arriba
      cuad52.poner([
        { titulo: Lg('hacia abajo (−)', 'downwards (−)'), fuentes: fs.map(f => ({ id: f.id, d: f.menos, color: 'rgba(255,107,107,0.85)' })) },
        { titulo: Lg('hacia arriba (+)', 'upwards (+)'), fuentes: fs.map(f => ({ id: f.id, d: f.mas, color: 'rgba(255,184,77,0.85)' })) }]);
      const dom = [...fs].sort((a, b) => b.menos - a.menos)[0], domMas = [...fs].sort((a, b) => b.mas - a.mas)[0];
      const tot = `−${f2(col.total.menos)} / +${f2(col.total.mas)}`, est = `−${f2(col.stat[0])} / +${f2(col.stat[1])}`;
      const infoTxt = info.map(([id]) => `${id} (${nombreFuente(id)})`).join(', ');
      $('#lectura', c).innerHTML = `<div class="panel"><p>${Lg(`La fuente que más empuja hacia abajo es <b>${dom.id}</b> (${nombreFuente(dom.id)}): −${f2(dom.menos)}.
        Hacia arriba, <b>${domMas.id}</b> (${nombreFuente(domMas.id)}): +${f2(domMas.mas)}.`,
        `The source that pushes the rate down the most is <b>${dom.id}</b> (${nombreFuente(dom.id)}): −${f2(dom.menos)}.
        Upwards, <b>${domMas.id}</b> (${nombreFuente(domMas.id)}): +${f2(domMas.mas)}.`)}</p>
        <p>${Lg(`Total: ${tot}, contra el estadístico ${est}.`, `Total: ${tot}, against the statistical ${est}.`)}
          ${col.total.menos + col.total.mas > col.stat[0] + col.stat[1] ? Lg('Aquí manda el sistemático.', 'Here the systematic dominates.') : Lg('Aquí manda el estadístico: hay pocas supernovas.', 'Here the statistical dominates: there are few supernovae.')}</p>
        ${info.length ? `<p class="tenue">${Lg(`Van aparte, como información y sin entrar al total: ${infoTxt}.`, `Listed apart, as information and without entering the total: ${infoTxt}.`)}</p>` : ''}
        ${col.no_usar ? `<p class="tenue">${Lg('Este bin se calcula pero no es resultado de la tesis.', 'This bin is computed but is not a result of the thesis.')}</p>` : ''}</div>`;
      vistas.add(sel);
      if (vistas.has(0) && vistas.size >= 2) libro();
    }
    c.querySelectorAll('#bines button').forEach(b => b.onclick = () => { sel = +b.dataset.i; mostrar(); });
    mostrar();
    function libro() {
      if ($('#volver', c)) return;
      const md5 = T.generado.textos['reglas_tasa_sudare.md'].slice(0, 8);
      $('#libro', c).innerHTML = `<div class="panel"><h3>${Lg('El libro de las reglas tardías', 'The book of late rules')}</h3>
        <p>${Lg(`Estas reglas se adoptaron con la tasa ya calculada, después de ver un resultado que no calzaba. Cada una tiene su justificación propia,
          pero el orden importa para leer los números: la tesis las declara con su fecha, lo que la motivó y su efecto.`,
          `These rules were adopted with the rate already computed, after seeing a result that did not fit. Each one has its own justification,
          but the order matters for reading the numbers: the thesis declares them with their date, what motivated them and their effect.`)}</p>
        <table class="tabla libro"><tr>${Object.keys(T.posthoc[0]).map(k => `<th>${posthocEn(k)}</th>`).join('')}</tr>
          ${T.posthoc.map(f => `<tr>${Object.values(f).map(v => `<td>${posthocEn(v)}</td>`).join('')}</tr>`).join('')}</table>
        <p class="tenue">${Lg(`Leído de docs/reglas_tasa_sudare.md, sección 7 (md5 ${md5}).`, `Read from docs/reglas_tasa_sudare.md, section 7 (md5 ${md5}).`)}</p>
        <p><button class="primario" id="volver">${Lg('Volver al observatorio', 'Back to the observatory')}</button></p></div>`;
      u.desbloquear(m.ensena); u.marcar(m.id, true); u.sonar('fanfarria');
      $('#volver', c).onclick = () => fin({ gana: true });
      const c0 = cols[0], d0 = Object.entries(c0.fuentes).filter(([, v]) => v.en_total).sort((x, y) => y[1].menos - x[1].menos)[0];
      const zc0 = c0.columna.slice(3), sm0 = f2(c0.total.menos), dm0 = f2(d0[1].menos), n0 = f2(T.principal.bins[0].N, 1);
      u.hablar([['examinadora1', Lg(`Su bin de Ia ${zc0} tiene la barra sistemática más grande hacia abajo, −${sm0}. ¿Qué la domina?`,
          `Your Ia bin ${zc0} has the largest downward systematic bar, −${sm0}. What dominates it?`)],
        ['yo', Lg(`La fuente ${d0[0]}, ${nombreFuente(d0[0])}: −${dm0}. Con ${n0} Ia en ese bin, cualquier supuesto que mueva una fracción de supernova pesa mucho.`,
          `Source ${d0[0]}, ${nombreFuente(d0[0])}: −${dm0}. With ${n0} Ia in that bin, any assumption that moves a fraction of a supernova weighs a lot.`)]]);
    }
  }

  M.registrar('arbitro', arbitro);
  M.registrar('presupuesto', presupuestoTesis);
  M.agregar([
    { id: '5.1', cap: 5, titulo: Lg('El árbitro', 'The referee'), tipo: 'arbitro', donde: 'atril', ensena: ['sistematicos'],
      contrato: [
        ['directora', Lg('Ya tienes una tasa. Ahora hay que defenderla. En la sala del comité hay un árbitro que va a atacar cada uno de tus supuestos.',
          'You have a rate. Now you have to defend it. In the committee room there is a referee who will attack each one of your assumptions.')],
        ['directora', Lg('Una advertencia: en el atril hay un botón dorado para ajustar a la literatura. No lo toques.',
          'A warning: at the lectern there is a golden button to fit to the literature. Do not touch it.')],
      ],
      examinador2: [['examinador2', Lg('Párese en el atril y muéstreme su tasa. Después vemos cuánto aguanta.', 'Step up to the lectern and show me your rate. Then we will see how much it can take.')]] },
    { id: '5.2', cap: 5, titulo: Lg('El presupuesto de la tesis', 'The thesis budget'), tipo: 'presupuesto', donde: 'atril', ensena: [],
      contrato: [['directora', Lg('Ahora el de verdad: el presupuesto de error de la tesis, fuente por fuente y bin por bin. Míralo en el atril.',
        'Now the real one: the thesis error budget, source by source and bin by bin. Look at it at the lectern.')]] },
  ]);
})();
