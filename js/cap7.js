// Capítulo 7: la defensa. El análisis real de SUDARE con los números vigentes de la tesis: los pasos 1 a 4, cada alternativa del
// sistemático como interruptor y los tres examinadores. Todo se lee de data/tesis.js: el juego no recalcula nada.
(() => {
  const M = Misiones, u = M.util, V2 = Vista2;
  const $ = (s, r = document) => r.querySelector(s);
  const T = window.TESIS, N = T.numeros, f2 = u.f2, CL = V2.CL;
  const colDe = b => `${b.tipo} ${b.z1}-${b.z2}`;
  const SIS = Object.fromEntries(T.sistematico.por_columna.map(c => [c.columna, c]));
  const PRINC = T.principal.bins;
  const nombreFuente = id => (T.sistematico.fuentes[id] || {}).nombre || id;
  const PASOS = [
    { id: 1, titulo: 'Paso 1: reproducir su tiempo de control', texto: 'Con la receta de SUDARE I y nuestras simulaciones, la exposición tiene que salir igual a la de su Tabla 5 (N / r publicada). Si no sale, el método no está entendido.' },
    { id: 2, titulo: 'Paso 2: nuestros clasificadores con su tiempo de control', texto: 'Las mismas SNe de SUDARE I, clasificadas por nuestro clasificador de plantillas, con la exposición de su Tabla 5. Valida el clasificador.' },
    { id: 3, titulo: 'Paso 3: las mismas 117 con nuestro tiempo de control', texto: 'Las 117 SNe seleccionadas como SUDARE I, ahora con nuestra exposición (nuestra física y el corte en m50). Valida la exposición.' },
    { id: 4, titulo: 'Paso 4: la tasa propia', texto: 'Todas las temporadas, la selección (b) simétrica, P1(z), la limpieza de AGN y el modelado hacia adelante del z. Es la tasa que va a los ajustes de SFH y DTD.' },
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
      <div class="panel contrato"><h3>La defensa</h3>
        <p>Este es el análisis real de la tesis, con sus números vigentes. Recorre los cuatro pasos, prende y apaga las alternativas del error sistemático
          y responde a los tres examinadores: cada uno te lleva a la evidencia.</p></div>
      <p class="fila" id="pasos">${PASOS.map(p => `<button data-p="${p.id}" ${p.id === 4 ? 'class="primario"' : ''}>Paso ${p.id}</button>`).join('')}</p>
      <div id="textoPaso"></div>
      <canvas class="vista alto" id="g"></canvas>
      <div class="leyenda" id="ley"></div>
      <div id="interruptores"></div>
      <div id="tabla"></div>
      <div class="panel"><h3>El comité</h3><p class="fila" id="examinadores">
        <button data-e="examinadora1">Dra. Ríos: tiempo de control</button><button data-e="examinador2">Dr. Ferrer: clasificación</button><button data-e="examinador3">Dr. Albornoz: SFH</button></p>
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
      V2.texto(g, '1: reproduce su Tabla 5', x1, py(1) - 4, { tam: f, alin: 'right', color: '#f4f4f4' });
    }
    function dibujar() {
      $('#ley', c).innerHTML = paso === 1 ? '<span><i style="background:#ff6b6b"></i>su ec. 1 al pie de la letra</span><span><i style="background:#6ee7a0"></i>su receta con el corte en m50</span>'
        : `<span><i style="background:${CL.Ia}"></i>nuestra (barra estadística)</span>${paso === 4 ? '<span><i style="background:#ff6b6b"></i>total con el sistemático</span><span><i style="background:#c8d2e6"></i>literatura (banda: su rango)</span>' : ''}
        <span><i style="background:#f4f4f4"></i>SUDARE I publicada (Tabla 5)</span>${fuente && alt ? `<span><i style="background:#ff6b6b"></i>alternativa: ${alt}</span>` : ''}`;
    }
    function mostrarPaso() {
      const P = PASOS.find(p => p.id === paso);
      c.querySelectorAll('#pasos button').forEach(b => b.classList.toggle('primario', +b.dataset.p === paso));
      let extra = '';
      if (paso === 1) { const B = T.paso1.bins, iabc = B.filter(b => b.tipo !== 'IIn'), ia = B.filter(b => b.tipo === 'Ia');
        extra = `<p>Con la ec. 1 al pie de la letra, la exposición de las Ia, II e Ibc sale ${f2(Math.min(...iabc.map(b => b.literal)))} a ${f2(Math.max(...iabc.map(b => b.literal)))} veces la de SUDARE I.
        Con el corte en m50, la de las Ia sale ${f2(Math.min(...ia.map(b => b.E0)))} a ${f2(Math.max(...ia.map(b => b.E0)))}, y ${B.filter(b => b.tipo !== 'Ia').map(b => `${b.tipo} ${b.z1}-${b.z2} ${f2(b.E0)}`).join(', ')}.
        El corte se respalda además con un observable propio: en SUDARE I, ${N['paso1.observable.sudare_I.reales_bajo_m50']} de ${N['paso1.observable.sudare_I.n_con_m50']} reales pican más débil que el m50,
        contra ${N['paso1.observable.sudare_I.esperado_con_corte']} esperadas con el corte y ${N['paso1.observable.sudare_I.esperado_sin_corte']} sin él.</p>`; }
      if (paso === 2 || paso === 3) { const ts = tasasPaso(paso), mal = ts.filter(t => t.frente === 'fuera');
        extra = `<p>Frente a la Tabla 5: ${ts.map(t => `${t.columna} ${t.frente === 'stat' ? 'dentro del estadístico' : t.frente === 'total' ? 'dentro del error total' : 'fuera'}`).join(', ')}.</p>
          ${paso === 3 ? `<p>${mal.length ? `Quedan fuera ${mal.map(t => t.columna).join(', ')}: ahí nuestra exposición difiere de la suya (cociente de A: ${mal.map(t => `${t.columna} ${N[`pasos23.cociente_A.${t.columna.replace(' ', '_')}`] ?? '–'}`).join(', ')}).` : ''}</p>` : ''}`; }
      if (paso === 4) extra = `<p>La literatura es una alarma: la banda gris es su rango en cada bin. Si un valor central cae fuera se busca la causa y se declara, sin cambiar de variante por eso.
        La CC 0.35-0.75 se calcula pero no es resultado (la simulación de las II llega a z 0.65).</p>`;
      $('#textoPaso', c).innerHTML = `<div class="panel"><h3>${P.titulo}</h3><p>${P.texto}</p>${extra}</div>`;
      $('#interruptores', c).hidden = paso !== 4; $('#tabla', c).hidden = paso !== 4;
      dibujar();
    }
    function interruptores() {
      const ids = Object.keys(T.sistematico.fuentes).filter(id => Object.keys(T.sistematico.fuentes[id].alternativas).length);
      $('#interruptores', c).innerHTML = `<div class="panel"><h3>Interruptores del sistemático</h3>
        <p class="tenue">Cada alternativa ya está calculada en la tesis: prenderla muestra la tasa que daría (punto rojo). Las que no entran al total van marcadas.</p>
        <label class="fila">Fuente <select id="fuente"><option value="">ninguna</option>${ids.map(id => `<option value="${id}">${id}: ${nombreFuente(id)}${T.sistematico.fuentes[id].en_total ? '' : ' (información)'}</option>`).join('')}</select></label>
        <p class="fila" id="alts"></p><div id="deltas"></div></div>`;
      $('#fuente', c).onchange = e => elegirFuente(e.target.value);
    }
    function elegirFuente(id, a = null) {
      fuente = id || null; alt = null;
      $('#fuente', c).value = id || '';
      const alts = fuente ? T.sistematico.fuentes[fuente].alternativas : [];
      $('#alts', c).innerHTML = alts.map(x => `<button data-a="${x}">${x}</button>`).join('');
      c.querySelectorAll('#alts button').forEach(b => b.onclick = () => elegirAlt(b.dataset.a));
      if (a) elegirAlt(a); else { $('#deltas', c).innerHTML = ''; dibujar(); }
    }
    function elegirAlt(a) {
      alt = a;
      c.querySelectorAll('#alts button').forEach(b => b.classList.toggle('primario', b.dataset.a === a));
      $('#deltas', c).innerHTML = `<table class="tabla"><tr><th>bin</th><th>tasa</th><th>con ${a}</th><th>Δ</th></tr>${T.sistematico.por_columna.map(col => {
        const x = ((col.fuentes[fuente] || {}).alternativas || {})[a];
        return x ? `<tr${col.no_usar ? ' class="tenue"' : ''}><td>${col.columna}</td><td>${f2(col.r)}</td><td>${f2(x.r)}</td><td>${x.dr >= 0 ? '+' : ''}${f2(x.dr)}</td></tr>` : '';
      }).join('')}</table>`;
      dibujar();
    }
    function tabla() {
      $('#tabla', c).innerHTML = `<div class="panel"><h3>Las tasas de la tesis</h3>
        <table class="tabla"><tr><th>bin</th><th>N (con C)</th><th>A (10⁵ yr Mpc³)</th><th>C</th><th>tasa</th><th>estadístico</th><th>sistemático</th></tr>
        ${PRINC.map(b => { const s = SIS[colDe(b)]; return `<tr${s && s.no_usar ? ' class="tenue"' : ''}><td>${colDe(b)}</td><td>${f2(b.N_corr ?? b.N, 1)}</td><td>${b.A ? f2(b.A / 1e5, 2) : 'por tipo'}</td>
          <td>${b.completitud ? f2(b.completitud, 2) : '–'}</td><td><b>${f2(b.r)}</b></td><td>−${f2(b.r - b.r_lo)} +${f2(b.r_hi - b.r)}</td><td>${s ? `−${f2(s.total.menos)} +${f2(s.total.mas)}` : '–'}</td></tr>`; }).join('')}</table>
        <p class="tenue">${T.unidades}. N es la suma de probabilidades ya multiplicada por la completitud C, como en la tesis (r = N C / A). Combinada (SUDARE I y temporadas posteriores), selección (b), clasificador de plantillas. ${window.CuadernoFuenteTesis()}</p></div>`;
    }

    // los tres examinadores: cada uno plantea un escenario y el juego lleva a la evidencia
    const ESCENARIOS = {
      examinadora1: () => {
        paso = 4; mostrarPaso(); elegirFuente('6b', 'm50+0.38');
        const ob = T.observable_m50.partes.posterior, fila = (g, z1) => (ob[g] || []).find(x => x.z1 === z1);
        const ia = fila('Ia', 0.15), cc = fila('CC', 0.15);
        decir('examinadora1', '¿Y si el m50 de sus temporadas posteriores está corrido 0.38 mag? Ese número lo supusieron, no lo midieron.');
        u.hablar([['examinadora1', '¿Y si el m50 de sus temporadas posteriores está corrido 0.38 mag? Ese número lo supusieron, no lo midieron.'],
          ['yo', 'Por eso es una fuente del sistemático, la 6b: está prendida en el gráfico. Y tenemos un observable propio que la vigila.']]);
        $('#evidencia', c).innerHTML = `<div class="panel"><p><b>Evidencia.</b> En las posteriores, cuántas reales pican más débil que el m50 supuesto, contra las simuladas con el corte:
          Ia 0.15-0.35 ${ia.n_bajo} de ${ia.n_real} (simuladas ${f2(ia.sims_corte)}, p = ${f2(ia.p_corte, 3)}). CC 0.15-0.35 ${cc.n_bajo} de ${cc.n_real} (simuladas ${f2(cc.sims_corte)}, p = ${f2(cc.p_corte, 3)}).
          Más reales bajo el m50 de lo esperado: el m50 supuesto podría ser demasiado brillante. Por eso ±0.38 mag entra al sistemático.</p></div>`;
      },
      examinador2: () => {
        paso = 4; mostrarPaso(); elegirFuente('2c', 'fuga_sudare_I');
        decir('examinador2', 'Su clasificador manda supernovas a IIn. ¿Cuánto cambia la tasa si la fuga real es la que midieron en SUDARE I?');
        u.hablar([['examinador2', 'Su clasificador manda supernovas a IIn. ¿Cuánto cambia la tasa si la fuga real es la que midieron en SUDARE I?'],
          ['yo', 'Está prendida: es la segunda alternativa de la tipificación, declarada como cota superior. Y por la fuga reportamos la CC total, no la IIn sola.']]);
        const fz = T.fuga_ztf, iIIn = fz.clases.indexOf('IIn'), iII = fz.clases.indexOf('II');
        const cf = T.confusion_final, pl = cf.sistemas.plantillas_4c.confusion, jII = cf.clases.indexOf('II'), jIIn = cf.clases.indexOf('IIn');
        $('#evidencia', c).innerHTML = `<div class="panel"><p><b>Evidencia.</b> En la mitad final de ZTF, el clasificador de plantillas manda ${pl[jII][jIIn]} de ${pl[jII].reduce((a, x) => a + x, 0)} II a IIn.
          En la matriz del sistemático 2c (validación, ${fz.n} SNe, P1(z)), de cada 100 II verdaderas ${(100 * fz.P1z[iIIn][iII]).toFixed(0)} se cuentan como IIn. En SUDARE, el ${(100 * T.agn_por_clase.IIn).toFixed(0)} % del N de IIn coincidía con un AGN o una fuente X,
          contra ${(100 * T.agn_por_clase.Ia).toFixed(0)} % en las Ia: de ahí la regla R2, fijada antes de ver su efecto, con e_SN = ${f2(T.e_sn.valor, 3)}.</p></div>`;
      },
      examinador3: () => {
        paso = 4; mostrarPaso(); elegirFuente(null);
        decir('examinador3', '¿Qué aprendemos de las estrellas con sus tasas?');
        u.hablar([['examinador3', '¿Qué aprendemos de las estrellas con sus tasas?'],
          ['yo', `Solas, no acotan la forma de la DTD. Con la literatura, β = ${N['sfh.paso3.todas+nuestras.MF17.beta']}, y K depende de la SFH que se elija.`]]);
        $('#evidencia', c).innerHTML = `<div class="panel"><p><b>Evidencia.</b> Con las cuatro tasas de Ia de SUDARE, β libre = ${N['sfh.paso2.beta_libre']} ${N['sfh.paso2.beta_libre_acotado'] ? '' : 'sin cota'}.
          K de SD-Ch = ${N['sfh.paso2.sudare_t11_fina.SD-Ch.K']} ± ${N['sfh.paso2.sudare_t11_fina.SD-Ch.sK_est']} (est.) +${N['sfh.paso2.sudare_t11_fina.SD-Ch.sK_sist_mas']} −${N['sfh.paso2.sudare_t11_fina.SD-Ch.sK_sist_menos']} (sist.) × 10⁻³ M☉⁻¹.
          Con la literatura (MF17): β = ${N['sfh.paso3.todas+nuestras.MF17.beta']} +${N['sfh.paso3.todas+nuestras.MF17.beta_mas']} −${N['sfh.paso3.todas+nuestras.MF17.beta_menos']}, N/M★ = ${N['sfh.paso3.todas+nuestras.MF17.N_M']} × 10⁻³.
          Las CC: lo medido sobre K_CC ψ (MF17, Kroupa) es ${T.sfh.cc.MF17_Kroupa.cociente.map(x => f2(x)).join(' y ')}, y con las ocultas ${T.sfh.cc.MF17_Kroupa_ocultas.cociente.map(x => f2(x)).join(' y ')}.</p></div>`;
      },
    };
    c.querySelectorAll('#examinadores button').forEach(b => b.onclick = () => {
      ESCENARIOS[b.dataset.e](); respondidas.add(b.dataset.e); b.classList.add('primario');
      if (respondidas.size === 3 && !$('#volver', c)) setTimeout(terminar, 400);
    });
    c.querySelectorAll('#pasos button').forEach(b => b.onclick = () => { paso = +b.dataset.p; mostrarPaso(); });
    interruptores(); tabla(); mostrarPaso();
    function terminar() {
      $('#fin', c).innerHTML = `<div class="panel veredicto ok"><h3>Defensa aprobada</h3>
        <p>Contaste (N), mediste lo que no viste (A), sabes qué tipo es cada una sin espectro, defendiste cada supuesto con su efecto medido
          y llevaste las tasas hasta las estrellas que las producen. Ese es el capítulo de tasas de la tesis.</p>
        <p><button class="primario" id="volver">Volver al observatorio</button></p></div>`;
      u.marcar(m.id, true); u.sonar('fanfarria');
      $('#volver', c).onclick = () => fin({ gana: true });
      u.hablar([['examinadora1', 'Por mi parte, conforme.'], ['examinador2', 'Conforme.'], ['examinador3', 'Conforme. Felicitaciones.']]);
    }
  }

  M.registrar('defensa', defensa);
  M.agregar([
    { id: '7.1', cap: 7, titulo: 'La defensa', tipo: 'defensa', donde: 'atril', ensena: [],
      contrato: [['directora', 'Llegó el día. El comité te espera en la sala. En el atril están los números de verdad de la tesis: recórrelos y responde.']],
      examinadora1: [['examinadora1', 'Pase al atril cuando esté listo. Yo le voy a preguntar por el tiempo de control.']],
      examinador2: [['examinador2', 'Yo, por la clasificación. Prepárese.']],
      examinador3: [['examinador3', 'Y yo por las estrellas. Pase al atril.']] },
  ]);
})();
