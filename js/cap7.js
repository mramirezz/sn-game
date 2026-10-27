// Capítulo 7: la defensa. El análisis real de SUDARE con los números vigentes de la tesis: los pasos 1 a 4, cada alternativa del
// sistemático como interruptor y los tres examinadores. Todo se lee de data/tesis.js: el juego no recalcula nada.
(() => {
  const M = Misiones, u = M.util, V2 = Vista2;
  const $ = (s, r = document) => r.querySelector(s);
  const T = window.TESIS, N = T.numeros, f2 = u.f2, CL = V2.CL;
  const colDe = b => `${b.tipo} ${b.z1}-${b.z2}`;
  const SIS = Object.fromEntries(T.sistematico.por_columna.map(c => [c.columna, c]));
  const PRINC = T.principal.bins;
  const nombreFuente = id => { const n = (T.sistematico.fuentes[id] || {}).nombre || id; return Lg(n, FUENTES_EN[id] || n); };
  // las alternativas del sistemático son llaves de data/tesis.js: solo se traduce lo que se muestra
  const ALT_EN = { bajo: 'low', alto: 'high', 'largos+50': 'long+50', 'cortos+50': 'short+50', brillantes: 'brighter', debiles: 'fainter',
    'sesgo+': 'bias+', 'sesgo-': 'bias-', II_Ibc_centrados: 'II_Ibc_centred', catastroficos: 'catastrophic', regla_anterior: 'previous_rule',
    e_SN_por_campo: 'e_SN_per_field', sin_fotometricos: 'no_photometric', juntas: 'merged', prior_sudare_conteo: 'prior_sudare_count',
    sin_regla: 'no_rule', ignored_fuera: 'ignored_removed', 'sin evolucion': 'no evolution', balanceado: 'balanced',
    fuga_sudare_I: 'leakage_sudare_I', z_verdadero: 'z_true' };
  const altNombre = a => Lg(a, ALT_EN[a] || a);
  const UNIDADES_EN = { 'tasa en 10⁻⁴ yr⁻¹ Mpc⁻³ (H0 = 70), A en yr Mpc³': 'rate in 10⁻⁴ yr⁻¹ Mpc⁻³ (H0 = 70), A in yr Mpc³' };
  const PASOS = [
    { id: 1, titulo: Lg('Paso 1: reproducir su tiempo de control', 'Step 1: reproduce their control time'),
      texto: Lg('Con la receta de SUDARE I y nuestras simulaciones, la exposición tiene que salir igual a la de su Tabla 5 (N / r publicada). Si no sale, el método no está entendido.',
        'With the SUDARE I recipe and our simulations, the exposure has to come out equal to the one in their Table 5 (N / published r). If it does not, the method is not understood.') },
    { id: 2, titulo: Lg('Paso 2: nuestros clasificadores con su tiempo de control', 'Step 2: our classifiers with their control time'),
      texto: Lg('Las mismas SNe de SUDARE I, clasificadas por nuestro clasificador de plantillas, con la exposición de su Tabla 5. Valida el clasificador.',
        'The same SUDARE I SNe, classified by our template classifier, with the exposure from their Table 5. It validates the classifier.') },
    { id: 3, titulo: Lg('Paso 3: las mismas 117 con nuestro tiempo de control', 'Step 3: the same 117 with our control time'),
      texto: Lg('Las 117 SNe seleccionadas como SUDARE I, ahora con nuestra exposición (nuestra física y el corte en m50). Valida la exposición.',
        'The 117 SNe selected as in SUDARE I, now with our exposure (our physics and the cut at m50). It validates the exposure.') },
    { id: 4, titulo: Lg('Paso 4: la tasa propia', 'Step 4: our own rate'),
      texto: Lg('Todas las temporadas, la selección (b) simétrica, P1(z), la limpieza de AGN y el modelado hacia adelante del z. Es la tasa que va a los ajustes de SFH y DTD.',
        'All seasons, the symmetric selection (b), P1(z), the AGN cleaning and the forward modelling of z. It is the rate that goes into the SFH and DTD fits.') },
  ];

  // las tasas de un paso en las columnas de SUDARE I: [{columna, tipo, z, r, lo, hi}]
  function tasasPaso(k) {
    if (k === 4) return PRINC.map(b => ({ columna: colDe(b), tipo: b.tipo, z1: b.z1, z2: b.z2, r: b.r, lo: b.r - b.r_lo, hi: b.r_hi - b.r, no_usar: (SIS[colDe(b)] || {}).no_usar }));
    const pre = `paso${k}.sudare_t11_fina.`;
    return Object.keys(N).filter(x => x.startsWith(pre) && x.endsWith('.r')).map(x => {
      const col = x.slice(pre.length, -2), [tipo, zz] = col.split('_'), [z1, z2] = zz.split('-').map(Number), b = pre + col;
      return { columna: `${tipo} ${z1}-${z2}`, tipo, z1, z2, r: N[`${b}.r`], lo: N[`${b}.stat_menos`], hi: N[`${b}.stat_mas`], frente: N[`${b}.frente_tabla5`] };
    });
  }
  const pub = col => { const k = col.replace(' ', '_'); return N[`tabla5.${k}.r`] != null ? { r: N[`tabla5.${k}.r`], stat: N[`tabla5.${k}.stat`], sist: N[`tabla5.${k}.sist`] } : null; };

  function defensa(m, fin) {
    const c = u.cont();
    let paso = 4, fuente = null, alt = null, respondidas = new Set();
    c.innerHTML = `
      <div class="panel contrato"><h3>${Lg('La defensa', 'The defence')}</h3>
        <p>${Lg(`Este es el análisis real de la tesis, con sus números vigentes. Recorre los cuatro pasos, prende y apaga las alternativas del error sistemático
          y responde a los tres examinadores: cada uno te lleva a la evidencia.`,
          `This is the real analysis of the thesis, with its current numbers. Go through the four steps, switch the alternatives of the systematic error on and off,
          and answer the three examiners: each one takes you to the evidence.`)}</p></div>
      <p class="fila" id="pasos">${PASOS.map(p => `<button data-p="${p.id}" ${p.id === 4 ? 'class="primario"' : ''}>${Lg('Paso', 'Step')} ${p.id}</button>`).join('')}</p>
      <div id="textoPaso"></div>
      <canvas class="vista alto" id="g"></canvas>
      <div class="leyenda" id="ley"></div>
      <div id="interruptores"></div>
      <div id="tabla"></div>
      <div class="panel"><h3>${Lg('El comité', 'The committee')}</h3><p class="fila" id="examinadores">
        <button data-e="examinadora1">${Lg('Dra. Ríos: tiempo de control', 'Dr Ríos: control time')}</button><button data-e="examinador2">${Lg('Dr. Ferrer: clasificación', 'Dr Ferrer: classification')}</button><button data-e="examinador3">${Lg('Dr. Albornoz: SFH', 'Dr Albornoz: SFH')}</button></p>
        <div id="evidencia"></div></div>
      <div id="fin"></div>`;

    // todo se dibuja con tiza en la pizarra de la sala del comité; el examinador que pregunta tiene su globo
    const pizarra = Escenas.Pizarra($('#g', c));
    let habla = null, tHabla = 0;
    u.animar(dt => {
      if (habla && (tHabla += dt) > 9) habla = null;
      pizarra.dibujar(dt, { pintar: (g, r) => (paso === 1 ? pintarPaso1(g, r) : pintarTasas(g, r)), habla });
      return true;
    });
    const decir = (quien, texto) => { habla = { quien, texto }; tHabla = 0; };
    function pintarTasas(g, [X, Y, W, Hh]) {
      const ts = tasasPaso(paso).filter(t => t.tipo === 'Ia' || t.tipo === 'CC');
      const paneles = [['Ia', 1.4], ['CC', 3.2]], ancho = W / 2, f = Math.max(9, Math.min(11, W / 50));
      paneles.forEach(([tipo, ymax], k) => {
        const x0 = X + k * ancho + 30, x1 = X + (k + 1) * ancho - 8, y0 = Y + 16, y1 = Y + Hh - 22;
        const px = z => x0 + (x1 - x0) * z / 0.8, py = r => y1 - (y1 - y0) * Math.min(r, ymax) / ymax;
        g.strokeStyle = 'rgba(232,236,248,0.55)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0, y1); g.lineTo(x1, y1); g.stroke();
        for (let z = 0; z <= 0.8 + 1e-9; z += 0.4) V2.texto(g, z.toFixed(1), px(z), y1 + 12, { tam: f, alin: 'center', color: 'rgba(232,236,248,0.8)' });
        for (let r = 0; r <= ymax + 1e-9; r += tipo === 'Ia' ? 0.4 : 1) V2.texto(g, r.toFixed(1), x0 - 4, py(r) + 4, { tam: f, alin: 'right', color: 'rgba(232,236,248,0.8)' });
        V2.texto(g, `${tipo}${paso === 4 ? '' : ' (SUDARE I)'}`, x0 + 6, y0 + 4, { tam: f + 2, color: tipo === 'Ia' ? CL.Ia : CL.II });
        for (const t of ts.filter(q => q.tipo === tipo)) {
          const zc = (t.z1 + t.z2) / 2;
          const lit = paso === 4 && !t.no_usar && T.literatura[t.columna];
          if (lit && lit.n) { g.fillStyle = 'rgba(200,210,230,0.14)'; g.fillRect(px(t.z1), py(lit.max), px(t.z2) - px(t.z1), py(lit.min) - py(lit.max));
            for (const q of lit.puntos) { g.fillStyle = 'rgba(200,210,230,0.7)'; g.beginPath(); g.arc(px(q.z), py(q.rate), 2, 0, 7); g.fill(); } }
          const pb = pub(t.columna);
          if (pb) { const lo = Math.hypot(pb.stat[0], pb.sist[0]), hi = Math.hypot(pb.stat[1], pb.sist[1]), xp = px(zc) + 8;
            g.strokeStyle = '#f4f4f4'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(xp, py(pb.r - lo)); g.lineTo(xp, py(pb.r + hi)); g.stroke(); g.strokeRect(xp - 3.5, py(pb.r) - 3.5, 7, 7); }
          const xs = px(zc) - 3, sis = SIS[t.columna];
          g.globalAlpha = t.no_usar ? 0.35 : 1;
          if (paso === 4 && sis) { const lo = Math.hypot(t.lo, sis.total.menos), hi = Math.hypot(t.hi, sis.total.mas);
            g.strokeStyle = 'rgba(255,107,107,0.6)'; g.lineWidth = 6; g.beginPath(); g.moveTo(xs, py(t.r - lo)); g.lineTo(xs, py(t.r + hi)); g.stroke(); }
          g.strokeStyle = '#ffb84d'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(xs, py(t.r - t.lo)); g.lineTo(xs, py(t.r + t.hi)); g.stroke();
          g.fillStyle = tipo === 'Ia' ? CL.Ia : CL.II; g.beginPath(); g.arc(xs, py(t.r), 4.5, 0, 7); g.fill();
          g.globalAlpha = 1;
          if (paso === 4 && fuente && alt && sis && sis.fuentes[fuente] && sis.fuentes[fuente].alternativas[alt]) {
            const ra = sis.fuentes[fuente].alternativas[alt].r, xa = xs - 12;
            g.strokeStyle = '#ff6b6b'; g.setLineDash([3, 3]); g.lineWidth = 1.5; g.beginPath(); g.moveTo(xs - 4, py(t.r)); g.lineTo(xa, py(ra)); g.stroke(); g.setLineDash([]);
            g.fillStyle = '#ff6b6b'; g.beginPath(); g.arc(xa, py(ra), 4, 0, 7); g.fill();
          }
        }
      });
    }
    function pintarPaso1(g, [X, Y, W, Hh]) {
      const bins = T.paso1.bins, ymax = 4.8, x0 = X + 28, x1 = X + W - 6, y0 = Y + 10, y1 = Y + Hh - 30, f = Math.max(8, Math.min(10, W / 60));
      const py = v => y1 - (y1 - y0) * v / ymax, bw = (x1 - x0) / bins.length;
      g.strokeStyle = 'rgba(232,236,248,0.55)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0, y1); g.lineTo(x1, y1); g.stroke();
      for (let v = 0; v <= 4; v += 1) V2.texto(g, `${v}`, x0 - 4, py(v) + 3, { tam: f, alin: 'right', color: 'rgba(232,236,248,0.8)' });
      bins.forEach((b, i) => {
        const xc = x0 + (i + 0.5) * bw;
        g.fillStyle = 'rgba(255,107,107,0.75)'; g.fillRect(xc - bw * 0.36, py(b.literal), bw * 0.34, y1 - py(b.literal));
        g.fillStyle = 'rgba(110,231,160,0.85)'; g.fillRect(xc + bw * 0.02, py(b.E0), bw * 0.34, y1 - py(b.E0));
        V2.texto(g, b.tipo, xc, y1 + 11, { tam: f + 1, alin: 'center', color: '#f4f4f4' }); V2.texto(g, `${b.z1}-${b.z2}`, xc, y1 + 22, { tam: f - 1, alin: 'center', color: 'rgba(232,236,248,0.75)' });
      });
      g.strokeStyle = '#f4f4f4'; g.setLineDash([5, 4]); g.beginPath(); g.moveTo(x0, py(1)); g.lineTo(x1, py(1)); g.stroke(); g.setLineDash([]);
      V2.texto(g, Lg('1: reproduce su Tabla 5', '1: reproduces their Table 5'), x1, py(1) - 4, { tam: f, alin: 'right', color: '#f4f4f4' });
    }
    function dibujar() {
      $('#ley', c).innerHTML = paso === 1 ? `<span><i style="background:#ff6b6b"></i>${Lg('su ec. 1 al pie de la letra', 'their eq. 1 to the letter')}</span><span><i style="background:#6ee7a0"></i>${Lg('su receta con el corte en m50', 'their recipe with the cut at m50')}</span>`
        : `<span><i style="background:${CL.Ia}"></i>${Lg('nuestra (barra estadística)', 'ours (statistical bar)')}</span>${paso === 4 ? `<span><i style="background:#ff6b6b"></i>${Lg('total con el sistemático', 'total with the systematic')}</span><span><i style="background:#c8d2e6"></i>${Lg('literatura (banda: su rango)', 'literature (band: its range)')}</span>` : ''}
        <span><i style="background:#f4f4f4"></i>${Lg('SUDARE I publicada (Tabla 5)', 'SUDARE I published (Table 5)')}</span>${fuente && alt ? `<span><i style="background:#ff6b6b"></i>${Lg('alternativa', 'alternative')}: ${altNombre(alt)}</span>` : ''}`;
    }
    function mostrarPaso() {
      const P = PASOS.find(p => p.id === paso);
      c.querySelectorAll('#pasos button').forEach(b => b.classList.toggle('primario', +b.dataset.p === paso));
      let extra = '';
      if (paso === 1) { const B = T.paso1.bins, iabc = B.filter(b => b.tipo !== 'IIn'), ia = B.filter(b => b.tipo === 'Ia');
        const l0 = f2(Math.min(...iabc.map(b => b.literal))), l1 = f2(Math.max(...iabc.map(b => b.literal))), e0 = f2(Math.min(...ia.map(b => b.E0))), e1 = f2(Math.max(...ia.map(b => b.E0)));
        const resto = B.filter(b => b.tipo !== 'Ia').map(b => `${b.tipo} ${b.z1}-${b.z2} ${f2(b.E0)}`).join(', '), o = k => N[`paso1.observable.sudare_I.${k}`];
        extra = `<p>${Lg(`Con la ec. 1 al pie de la letra, la exposición de las Ia, II e Ibc sale ${l0} a ${l1} veces la de SUDARE I.
        Con el corte en m50, la de las Ia sale ${e0} a ${e1}, y ${resto}.
        El corte se respalda además con un observable propio: en SUDARE I, ${o('reales_bajo_m50')} de ${o('n_con_m50')} reales pican más débil que el m50,
        contra ${o('esperado_con_corte')} esperadas con el corte y ${o('esperado_sin_corte')} sin él.`,
        `With eq. 1 to the letter, the exposure of the Ia, II and Ibc comes out ${l0} to ${l1} times that of SUDARE I.
        With the cut at m50, the Ia exposure comes out ${e0} to ${e1}, and ${resto}.
        The cut is also backed by an observable of our own: in SUDARE I, ${o('reales_bajo_m50')} of ${o('n_con_m50')} real SNe peak fainter than the m50,
        against ${o('esperado_con_corte')} expected with the cut and ${o('esperado_sin_corte')} without it.`)}</p>`; }
      if (paso === 2 || paso === 3) { const ts = tasasPaso(paso), mal = ts.filter(t => t.frente === 'fuera');
        const frente = ts.map(t => `${t.columna} ${t.frente === 'stat' ? Lg('dentro del estadístico', 'within the statistical') : t.frente === 'total' ? Lg('dentro del error total', 'within the total error') : Lg('fuera', 'outside')}`).join(', ');
        const malCol = mal.map(t => t.columna).join(', '), cocA = mal.map(t => `${t.columna} ${N[`pasos23.cociente_A.${t.columna.replace(' ', '_')}`] ?? '–'}`).join(', ');
        extra = `<p>${Lg('Frente a la Tabla 5', 'Against Table 5')}: ${frente}.</p>
          ${paso === 3 ? `<p>${mal.length ? Lg(`Quedan fuera ${malCol}: ahí nuestra exposición difiere de la suya (cociente de A: ${cocA}).`,
            `${malCol} remain${mal.length === 1 ? 's' : ''} outside: there our exposure differs from theirs (ratio of A: ${cocA}).`) : ''}</p>` : ''}`; }
      if (paso === 4) extra = `<p>${Lg(`La literatura es una alarma: la banda gris es su rango en cada bin. Si un valor central cae fuera se busca la causa y se declara, sin cambiar de variante por eso.
        La CC 0.35-0.75 se calcula pero no es resultado (la simulación de las II llega a z 0.65).`,
        `The literature is an alarm: the grey band is its range in each bin. If a central value falls outside, the cause is looked for and declared, without switching variants because of it.
        The CC 0.35-0.75 is computed but is not a result (the II simulation reaches z 0.65).`)}</p>`;
      $('#textoPaso', c).innerHTML = `<div class="panel"><h3>${P.titulo}</h3><p>${P.texto}</p>${extra}</div>`;
      $('#interruptores', c).hidden = paso !== 4; $('#tabla', c).hidden = paso !== 4;
      dibujar();
    }
    function interruptores() {
      const ids = Object.keys(T.sistematico.fuentes).filter(id => Object.keys(T.sistematico.fuentes[id].alternativas).length);
      $('#interruptores', c).innerHTML = `<div class="panel"><h3>${Lg('Interruptores del sistemático', 'Systematic switches')}</h3>
        <p class="tenue">${Lg('Cada alternativa ya está calculada en la tesis: prenderla muestra la tasa que daría (punto rojo). Las que no entran al total van marcadas.',
          'Each alternative is already computed in the thesis: switching it on shows the rate it would give (red dot). Those that do not enter the total are marked.')}</p>
        <label class="fila">${Lg('Fuente', 'Source')} <select id="fuente"><option value="">${Lg('ninguna', 'none')}</option>${ids.map(id => `<option value="${id}">${id}: ${nombreFuente(id)}${T.sistematico.fuentes[id].en_total ? '' : Lg(' (información)', ' (information)')}</option>`).join('')}</select></label>
        <p class="fila" id="alts"></p><div id="deltas"></div></div>`;
      $('#fuente', c).onchange = e => elegirFuente(e.target.value);
    }
    function elegirFuente(id, a = null) {
      fuente = id || null; alt = null;
      $('#fuente', c).value = id || '';
      const alts = fuente ? T.sistematico.fuentes[fuente].alternativas : [];
      $('#alts', c).innerHTML = alts.map(x => `<button data-a="${x}">${altNombre(x)}</button>`).join('');
      c.querySelectorAll('#alts button').forEach(b => b.onclick = () => elegirAlt(b.dataset.a));
      if (a) elegirAlt(a); else { $('#deltas', c).innerHTML = ''; dibujar(); }
    }
    function elegirAlt(a) {
      alt = a;
      c.querySelectorAll('#alts button').forEach(b => b.classList.toggle('primario', b.dataset.a === a));
      $('#deltas', c).innerHTML = `<table class="tabla"><tr><th>bin</th><th>${Lg('tasa', 'rate')}</th><th>${Lg('con', 'with')} ${altNombre(a)}</th><th>Δ</th></tr>${T.sistematico.por_columna.map(col => {
        const x = ((col.fuentes[fuente] || {}).alternativas || {})[a];
        return x ? `<tr${col.no_usar ? ' class="tenue"' : ''}><td>${col.columna}</td><td>${f2(col.r)}</td><td>${f2(x.r)}</td><td>${x.dr >= 0 ? '+' : ''}${f2(x.dr)}</td></tr>` : '';
      }).join('')}</table>`;
      dibujar();
    }
    function tabla() {
      const fuenteTesis = window.CuadernoFuenteTesis();
      $('#tabla', c).innerHTML = `<div class="panel"><h3>${Lg('Las tasas de la tesis', 'The thesis rates')}</h3>
        <table class="tabla"><tr><th>bin</th><th>${Lg('N (con C)', 'N (with C)')}</th><th>A (10⁵ yr Mpc³)</th><th>C</th><th>${Lg('tasa', 'rate')}</th><th>${Lg('estadístico', 'statistical')}</th><th>${Lg('sistemático', 'systematic')}</th></tr>
        ${PRINC.map(b => { const s = SIS[colDe(b)]; return `<tr${s && s.no_usar ? ' class="tenue"' : ''}><td>${colDe(b)}</td><td>${f2(b.N_corr ?? b.N, 1)}</td><td>${b.A ? f2(b.A / 1e5, 2) : Lg('por tipo', 'per type')}</td>
          <td>${b.completitud ? f2(b.completitud, 2) : '–'}</td><td><b>${f2(b.r)}</b></td><td>−${f2(b.r - b.r_lo)} +${f2(b.r_hi - b.r)}</td><td>${s ? `−${f2(s.total.menos)} +${f2(s.total.mas)}` : '–'}</td></tr>`; }).join('')}</table>
        <p class="tenue">${Lg(`${T.unidades}. N es la suma de probabilidades ya multiplicada por la completitud C, como en la tesis (r = N C / A). Combinada (SUDARE I y temporadas posteriores), selección (b), clasificador de plantillas. ${fuenteTesis}`,
          `${UNIDADES_EN[T.unidades] || T.unidades}. N is the sum of probabilities already multiplied by the completeness C, as in the thesis (r = N C / A). Combined (SUDARE I and later seasons), selection (b), template classifier. ${fuenteTesis}`)}</p></div>`;
    }

    // los tres examinadores: cada uno plantea un escenario y el juego lleva a la evidencia
    const ESCENARIOS = {
      examinadora1: () => {
        paso = 4; mostrarPaso(); elegirFuente('6b', 'm50+0.38');
        const ob = T.observable_m50.partes.posterior, fila = (g, z1) => (ob[g] || []).find(x => x.z1 === z1);
        const ia = fila('Ia', 0.15), cc = fila('CC', 0.15);
        const preg1 = Lg('¿Y si el m50 de sus temporadas posteriores está corrido 0.38 mag? Ese número lo supusieron, no lo midieron.',
          'What if the m50 of your later seasons is off by 0.38 mag? You assumed that number, you did not measure it.');
        decir('examinadora1', preg1);
        u.hablar([['examinadora1', preg1],
          ['yo', Lg('Por eso es una fuente del sistemático, la 6b: está prendida en el gráfico. Y tenemos un observable propio que la vigila.',
            'That is why it is a systematic source, 6b: it is switched on in the plot. And we have an observable of our own that keeps watch on it.')]]);
        const ev1 = (q, de, sim) => `${q.n_bajo} ${de} ${q.n_real} (${sim} ${f2(q.sims_corte)}, p = ${f2(q.p_corte, 3)})`;
        $('#evidencia', c).innerHTML = `<div class="panel"><p>${Lg(`<b>Evidencia.</b> En las posteriores, cuántas reales pican más débil que el m50 supuesto, contra las simuladas con el corte:
          Ia 0.15-0.35 ${ev1(ia, 'de', 'simuladas')}. CC 0.15-0.35 ${ev1(cc, 'de', 'simuladas')}.
          Más reales bajo el m50 de lo esperado: el m50 supuesto podría ser demasiado brillante. Por eso ±0.38 mag entra al sistemático.`,
          `<b>Evidence.</b> In the later seasons, how many real SNe peak fainter than the assumed m50, against the simulated ones with the cut:
          Ia 0.15-0.35 ${ev1(ia, 'of', 'simulated')}. CC 0.15-0.35 ${ev1(cc, 'of', 'simulated')}.
          More real SNe fainter than the m50 than expected: the assumed m50 could be too bright. That is why ±0.38 mag enters the systematic.`)}</p></div>`;
      },
      examinador2: () => {
        paso = 4; mostrarPaso(); elegirFuente('2c', 'fuga_sudare_I');
        const preg2 = Lg('Su clasificador manda supernovas a IIn. ¿Cuánto cambia la tasa si la fuga real es la que midieron en SUDARE I?',
          'Your classifier sends supernovae to IIn. How much does the rate change if the real leakage is the one measured in SUDARE I?');
        decir('examinador2', preg2);
        u.hablar([['examinador2', preg2],
          ['yo', Lg('Está prendida: es la segunda alternativa de la tipificación, declarada como cota superior. Y por la fuga reportamos la CC total, no la IIn sola.',
            'It is switched on: it is the second alternative of the typing, declared as an upper bound. And because of the leakage we report the total CC, not the IIn alone.')]]);
        const fz = T.fuga_ztf, iIIn = fz.clases.indexOf('IIn'), iII = fz.clases.indexOf('II');
        const cf = T.confusion_final, pl = cf.sistemas.plantillas_4c.confusion, jII = cf.clases.indexOf('II'), jIIn = cf.clases.indexOf('IIn');
        const aII = pl[jII][jIIn], nII = pl[jII].reduce((a, x) => a + x, 0), k100 = (100 * fz.P1z[iIIn][iII]).toFixed(0);
        const pIIn = (100 * T.agn_por_clase.IIn).toFixed(0), pIa = (100 * T.agn_por_clase.Ia).toFixed(0), esn = f2(T.e_sn.valor, 3);
        $('#evidencia', c).innerHTML = `<div class="panel"><p>${Lg(`<b>Evidencia.</b> En la mitad final de ZTF, el clasificador de plantillas manda ${aII} de ${nII} II a IIn.
          En la matriz del sistemático 2c (validación, ${fz.n} SNe, P1(z)), de cada 100 II verdaderas ${k100} se cuentan como IIn. En SUDARE, el ${pIIn} % del N de IIn coincidía con un AGN o una fuente X,
          contra ${pIa} % en las Ia: de ahí la regla R2, fijada antes de ver su efecto, con e_SN = ${esn}.`,
          `<b>Evidence.</b> In the final ZTF half, the template classifier sends ${aII} of ${nII} II to IIn.
          In the matrix of systematic 2c (validation, ${fz.n} SNe, P1(z)), out of every 100 true II, ${k100} are counted as IIn. In SUDARE, ${pIIn} % of the IIn N coincided with an AGN or an X-ray source,
          against ${pIa} % in the Ia: hence rule R2, fixed before seeing its effect, with e_SN = ${esn}.`)}</p></div>`;
      },
      examinador3: () => {
        paso = 4; mostrarPaso(); elegirFuente(null);
        const preg3 = Lg('¿Qué aprendemos de las estrellas con sus tasas?', 'What do we learn about the stars from your rates?');
        const b3 = N['sfh.paso3.todas+nuestras.MF17.beta'];
        decir('examinador3', preg3);
        u.hablar([['examinador3', preg3],
          ['yo', Lg(`Solas, no acotan la forma de la DTD. Con la literatura, β = ${b3}, y K depende de la SFH que se elija.`,
            `On their own, they do not constrain the shape of the DTD. With the literature, β = ${b3}, and K depends on the chosen SFH.`)]]);
        const n = k => N[k], sd = 'sfh.paso2.sudare_t11_fina.SD-Ch.', mf = 'sfh.paso3.todas+nuestras.MF17.';
        const acot = n('sfh.paso2.beta_libre_acotado'), cc = (q, y) => q.cociente.map(x => f2(x)).join(y);
        $('#evidencia', c).innerHTML = `<div class="panel"><p>${Lg(`<b>Evidencia.</b> Con las cuatro tasas de Ia de SUDARE, β libre = ${n('sfh.paso2.beta_libre')} ${acot ? '' : 'sin cota'}.
          K de SD-Ch = ${n(sd + 'K')} ± ${n(sd + 'sK_est')} (est.) +${n(sd + 'sK_sist_mas')} −${n(sd + 'sK_sist_menos')} (sist.) × 10⁻³ M☉⁻¹.
          Con la literatura (MF17): β = ${n(mf + 'beta')} +${n(mf + 'beta_mas')} −${n(mf + 'beta_menos')}, N/M★ = ${n(mf + 'N_M')} × 10⁻³.
          Las CC: lo medido sobre K_CC ψ (MF17, Kroupa) es ${cc(T.sfh.cc.MF17_Kroupa, ' y ')}, y con las ocultas ${cc(T.sfh.cc.MF17_Kroupa_ocultas, ' y ')}.`,
          `<b>Evidence.</b> With the four SUDARE Ia rates, free β = ${n('sfh.paso2.beta_libre')} ${acot ? '' : 'unconstrained'}.
          K of SD-Ch = ${n(sd + 'K')} ± ${n(sd + 'sK_est')} (stat.) +${n(sd + 'sK_sist_mas')} −${n(sd + 'sK_sist_menos')} (syst.) × 10⁻³ M☉⁻¹.
          With the literature (MF17): β = ${n(mf + 'beta')} +${n(mf + 'beta_mas')} −${n(mf + 'beta_menos')}, N/M★ = ${n(mf + 'N_M')} × 10⁻³.
          The CC: measured over K_CC ψ (MF17, Kroupa) is ${cc(T.sfh.cc.MF17_Kroupa, ' and ')}, and with the hidden ones ${cc(T.sfh.cc.MF17_Kroupa_ocultas, ' and ')}.`)}</p></div>`;
      },
    };
    c.querySelectorAll('#examinadores button').forEach(b => b.onclick = () => {
      ESCENARIOS[b.dataset.e](); respondidas.add(b.dataset.e); b.classList.add('primario');
      if (respondidas.size === 3 && !$('#volver', c)) setTimeout(terminar, 400);
    });
    c.querySelectorAll('#pasos button').forEach(b => b.onclick = () => { paso = +b.dataset.p; mostrarPaso(); });
    interruptores(); tabla(); mostrarPaso();
    function terminar() {
      $('#fin', c).innerHTML = `<div class="panel veredicto ok"><h3>${Lg('Defensa aprobada', 'Defence passed')}</h3>
        <p>${Lg(`Contaste (N), mediste lo que no viste (A), sabes qué tipo es cada una sin espectro, defendiste cada supuesto con su efecto medido
          y llevaste las tasas hasta las estrellas que las producen. Ese es el capítulo de tasas de la tesis.`,
          `You counted (N), you measured what you did not see (A), you know the type of each one without a spectrum, you defended each assumption with its measured effect
          and you took the rates all the way to the stars that produce them. That is the rates chapter of the thesis.`)}</p>
        <p><button class="primario" id="volver">${Lg('Volver al observatorio', 'Back to the observatory')}</button></p></div>`;
      u.marcar(m.id, true); u.sonar('fanfarria');
      $('#volver', c).onclick = () => fin({ gana: true });
      u.hablar([['examinadora1', Lg('Por mi parte, conforme.', 'For my part, I approve.')], ['examinador2', Lg('Conforme.', 'I approve.')], ['examinador3', Lg('Conforme. Felicitaciones.', 'I approve. Congratulations.')]]);
    }
  }

  M.registrar('defensa', defensa);
  M.agregar([
    { id: '7.1', cap: 7, titulo: Lg('La defensa', 'The defence'), tipo: 'defensa', donde: 'atril', ensena: [],
      contrato: [['directora', Lg('Llegó el día. El comité te espera en la sala. En el atril están los números de verdad de la tesis: recórrelos y responde.',
        'The day has come. The committee is waiting for you in the room. At the lectern are the real numbers of the thesis: go through them and answer.')]],
      examinadora1: [['examinadora1', Lg('Pase al atril cuando esté listo. Yo le voy a preguntar por el tiempo de control.', 'Step up to the lectern when you are ready. I will ask you about the control time.')]],
      examinador2: [['examinador2', Lg('Yo, por la clasificación. Prepárese.', 'And I, about the classification. Get ready.')]],
      examinador3: [['examinador3', Lg('Y yo por las estrellas. Pase al atril.', 'And I, about the stars. Step up to the lectern.')]] },
  ]);
})();
