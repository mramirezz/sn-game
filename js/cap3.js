// Capítulo 3: SUDARE, reproducir antes de medir. El survey real (registro publicado de SUDARE I), la eficiencia de búsqueda,
// el corte en el m50 y la prueba de reproducción, con el resultado de la tesis al lado.
(() => {
  const M = Misiones, u = M.util, F = Fisica, U = Universo, P = Poblacion, V2 = Vista2;
  const $ = (s, r = document) => r.querySelector(s);
  const S1 = window.SUDARE1, T = window.TESIS, f2 = u.f2, marca = u.marca;
  const BINS_IA = [[0.05, 0.15], [0.15, 0.35], [0.35, 0.55], [0.55, 0.75]];
  const PASO_E0_EN = 'their recipe (own brightness, their subtypes and dust), z at the bin centre'; // inglés de T.paso1.pasos.E0 (data/tesis.js)
  const EC_DE = String.raw`\mathrm{DE}(m) \,=\, \mathrm{DE}_\mathrm{max} \left[\frac{\arctan\{\beta\,(m_{50} - m)\}}{\pi} + \frac{1}{2}\right]`;
  function sortearClase(rand) { const u0 = rand(); return u0 < 0.5 ? 'Ia' : u0 < 0.75 ? 'II' : u0 < 0.9 ? 'Ibc' : 'IIn'; }
  function enPedazos(n, paso, fn, alAvanzar, alTerminar) {
    let i = 0;
    const tick = () => { const fin = Math.min(n, i + paso); for (; i < fin; i++) fn(i); alAvanzar && alAvanzar(i / n); if (i < n) setTimeout(tick, 0); else alTerminar && alTerminar(); };
    setTimeout(tick, 0);
  }

  // ---------- 3.1 el survey de verdad ----------
  function sudare(m, fin) {
    const c = u.cont(), rand = U.rng(Date.now() % 1e9);
    let ci = 0, corte = 0, sn = null, obs = null, curva = [], vistas = 0, listo = false;
    c.innerHTML = `
      <div class="fila">${S1.campos.map((cp, i) => `<button data-c="${i}">${cp.nombre}: ${cp.epocas.length} ${Lg('noches en r', 'nights in r')}</button>`).join('')}</div>
      <canvas class="vista" id="ep"></canvas>
      <p class="tenue pie">${Lg(`Las noches reales de SUDARE I, con el m50 publicado de cada una (celeste: la magnitud en que la búsqueda encuentra la mitad).
        Encima, una supernova del universo de juego: su curva (ámbar), lo que se detectó cada noche y la noche en que la búsqueda la encontró (estrella).`,
        `The real SUDARE I nights, with the published m50 of each one (light blue: the magnitude at which the search finds half).
        On top, a supernova from the game universe: its light curve (amber), what was detected each night and the night the search found it (star).`)}</p>
      <div class="fila"><button class="primario" id="otra">${Lg('Otra supernova', 'Another supernova')}</button><button id="cortar">${Lg('Quitar el corte en el m50', 'Remove the m50 cut')}</button>
        <span class="dato">${Lg('Vistas', 'Seen')}: <b id="nv">0</b></span>${marca}</div>
      <canvas class="vista" id="ocular"></canvas>
      <p class="fila"><button class="primario" id="noche">${Lg('▶ Mirar noche a noche', '▶ Watch night by night')}</button><span class="dato" id="nocheTxt"></span></p>
      <p class="tenue pie">${Lg(`El ocular de cada noche: el grano del fondo es el límite de esa noche (una noche mala tiene más grano). Si la supernova
        se detecta (círculo ámbar), la búsqueda tira su ruleta: verde con la probabilidad DE(m) de encontrarla esa noche.`,
        `The eyepiece of each night: the background grain is that night's limit (a bad night has more grain). If the supernova
        is detected (amber circle), the search spins its roulette: green with probability DE(m) of finding it that night.`)}</p>
      <div class="grilla2">
        <div><h3>${Lg('La eficiencia de búsqueda de una noche', 'The search efficiency of one night')}</h3><canvas class="grafico" id="de"></canvas>
          <label class="control"><span>m50</span><input type="range" id="m50" min="22" max="25" step="0.1" value="23.4"><output id="om50"></output></label></div>
        <div><div class="ecuacion" id="ecDE"></div><p class="etiqueta">eq:methods:proj:sudare_de (${Lg('la ec. 1 de SUDARE I', 'SUDARE I eq. 1')}): DE_max ${S1.busqueda.DE_max}, β ${S1.busqueda.beta}</p>
          <div class="ecuacion" id="ecSN"></div>
          <p class="tenue">${Lg(`Una noche detecta la supernova si es más brillante que su límite menos ${S1.busqueda.umbral_det} mag (S/N ≥ 3). La búsqueda la encuentra con
            la probabilidad DE(m), solo en noches con detección. La tesis corta la eficiencia en el m50: más débil que eso, cero.
            Una supernova se selecciona con al menos ${S1.busqueda.min_det} detecciones.`,
            `A night detects the supernova if it is brighter than that night's limit minus ${S1.busqueda.umbral_det} mag (S/N ≥ 3). The search finds it with
            probability DE(m), only on nights with a detection. The thesis cuts the efficiency at the m50: fainter than that, zero.
            A supernova is selected with at least ${S1.busqueda.min_det} detections.`)}</p></div>
      </div>
      <div id="fin"></div>`;
    u.tex($('#ecDE', c), EC_DE);
    u.tex($('#ecSN', c), String.raw`\mathrm{S/N} = 3\times10^{\,0.4\,(m_\mathrm{lim} - m)}, \qquad \text{${Lg('detección si', 'detection if')} } m < m_\mathrm{lim} - ${S1.busqueda.umbral_det}`);
    const campo = () => S1.campos[ci];
    function nueva() {
      const cp = campo(), clase = sortearClase(rand), ep = cp.epocas;
      sn = P.nuevaSN(clase, ci, cp, rand, { zmax: { Ia: 0.6, II: 0.35, Ibc: 0.4, IIn: 0.6 } });
      sn.tExp = ep[0].mjd - 15 + rand() * (ep[ep.length - 1].mjd - ep[0].mjd); sn.tPico = undefined;
      obs = P.observar(sn, cp, { rand, corte });
      curva = []; for (let t = ep[0].mjd - 20; t <= ep[ep.length - 1].mjd + 20; t += 1.5) curva.push({ t, m: P.mag(sn, t) });
      vistas++; dibujar(); prepararNoches();
      if (vistas >= 4 && !listo) { listo = true; cerrarla(); }
    }
    function dibujar() {
      if (sn) V2.curvaEpocas($('#ep', c), { campo: campo(), curva, obs, sn, corte });
      const m50 = +$('#m50', c).value, ms = []; for (let x = 19; x <= 27.5; x += 0.05) ms.push(x);
      const ctx = Plot.preparar($('#de', c)), T0 = Plot.ejes(ctx, { x0: 19, x1: 27.5, y0: 0, y1: 1, xlabel: Lg('magnitud de la supernova esa noche', 'supernova magnitude that night'), ylabel: Lg('probabilidad de encontrarla', 'probability of finding it') });
      Plot.linea(ctx, T0, ms, ms.map(x => P.eficiencia(x, m50, { corte: null })), 'rgba(255,184,77,0.55)', 2, [5, 4]);
      Plot.linea(ctx, T0, ms, ms.map(x => P.eficiencia(x, m50, { corte: 0 })), '#ffb84d', 2.5);
      Plot.vline(ctx, T0, m50, '#5ad1ff', 'm50');
      $('#om50', c).textContent = m50.toFixed(1); $('#nv', c).textContent = vistas;
    }
    // noche a noche: el ocular muestra la supernova contra el límite, y la ruleta de la búsqueda en las noches con detección
    const ocular = Escenas.Noche($('#ocular', c));
    let noches = [], kn = -1, tNoche = 0, jugandoN = false, yaEncontrada = false;
    function prepararNoches() {
      const ep = campo().epocas;
      noches = ep.map(e => ({ e, m: P.mag(sn, e.mjd), det: obs.det.find(d => d.t === e.mjd) })).filter(n => Number.isFinite(n.m) && n.m < n.e.maglim + 1.2);
      kn = -1; jugandoN = false; yaEncontrada = false; $('#noche', c).textContent = Lg('▶ Mirar noche a noche', '▶ Watch night by night');
      $('#nocheTxt', c).textContent = noches.length ? Lg(`${noches.length} noches en que la supernova está cerca del límite`, `${noches.length} night${noches.length === 1 ? '' : 's'} with the supernova near the limit`)
        : Lg('esta supernova nunca se acerca al límite: prueba otra', 'this supernova never gets near the limit, try another');
    }
    function pasarNoche() {
      kn++;
      if (kn >= noches.length) { jugandoN = false; $('#noche', c).textContent = Lg('▶ Otra vez', '▶ Again'); return; }
      const n = noches[kn];
      if (n.det && !yaEncontrada) { const pp = P.eficiencia(n.m, n.e.m50, { corte }), sale = !!obs.hallazgo && obs.hallazgo.t === n.e.mjd; ocular.tirar(pp, sale); n.buscada = { p: pp }; if (sale) yaEncontrada = true; }
      $('#nocheTxt', c).textContent = Lg(`noche ${kn + 1} de ${noches.length} · MJD ${n.e.mjd.toFixed(0)} · la supernova está en ${n.m.toFixed(1)} mag${n.det ? ' · detectada' : ' · no se detecta'}`,
        `night ${kn + 1} of ${noches.length} · MJD ${n.e.mjd.toFixed(0)} · the supernova is at ${n.m.toFixed(1)} mag${n.det ? ' · detected' : ' · not detected'}`);
    }
    u.animar(dt => {
      if (jugandoN) { tNoche += dt; if (tNoche > 2.1) { tNoche = 0; pasarNoche(); } }
      const n = noches[Math.max(0, kn)];
      if (n) ocular.dibujar(dt, { m: n.m, maglim: n.e.maglim, m50: n.e.m50, det: kn >= 0 && !!n.det, buscada: kn >= 0 ? n.buscada : null,
        titulo: kn < 0 ? Lg(`${sn.clase} a z = ${sn.z.toFixed(2)}: aprieta Mirar noche a noche`, `${sn.clase} at z = ${sn.z.toFixed(2)}: press Watch night by night`)
          : Lg(`noche ${kn + 1}: ${n.det ? 'detectada' : 'bajo el límite'}${yaEncontrada && !n.buscada ? ' · ya encontrada' : ''}`, `night ${kn + 1}: ${n.det ? 'detected' : 'below the limit'}${yaEncontrada && !n.buscada ? ' · already found' : ''}`) });
      return true;
    });
    $('#noche', c).onclick = () => { if (!noches.length) return; if (kn >= noches.length - 1) { kn = -1; yaEncontrada = false; noches.forEach(q => { delete q.buscada; }); } jugandoN = !jugandoN; tNoche = 2.1; $('#noche', c).textContent = jugandoN ? Lg('❚❚ Pausa', '❚❚ Pause') : Lg('▶ Seguir', '▶ Resume'); };
    c.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { ci = +b.dataset.c; nueva(); });
    $('#otra', c).onclick = nueva;
    $('#cortar', c).onclick = () => { corte = corte === null ? 0 : null; $('#cortar', c).textContent = corte === null ? Lg('Poner el corte en el m50', 'Apply the m50 cut') : Lg('Quitar el corte en el m50', 'Remove the m50 cut'); if (sn) { obs = P.observar(sn, campo(), { rand, corte }); dibujar(); prepararNoches(); } };
    $('#m50', c).oninput = dibujar;
    nueva();
    function cerrarla() {
      $('#fin', c).innerHTML = `<div class="panel"><p>${Lg(`Línea punteada: la ec. 1 al pie de la letra. Su cola sigue más allá del m50: busca supernovas que en la práctica no se encuentran.
        La línea llena es la del corte en el m50, la que adoptó la tesis (paso 1). Lo ves en la próxima misión.`,
        `Dashed line: eq. 1 taken literally. Its tail goes on beyond the m50, so it searches for supernovae that in practice are not found.
        The solid line is the one with the m50 cut, adopted by the thesis (step 1). You will see it in the next mission.`)}</p>
        <p><button class="primario" id="volver">${Lg('Volver al observatorio', 'Back to the observatory')}</button></p></div>`;
      u.desbloquear(m.ensena); u.marcar(m.id, true); u.sonar('fanfarria'); // aprobada al llegar aquí: salir ya no la deja a medias
      $('#volver', c).onclick = () => fin({ gana: true });
      u.hablar([['operador', Lg('Fíjate en las noches: no todas llegan igual de hondo. Una supernova débil solo se ve las noches buenas, y la búsqueda la encuentra con suerte.', 'Look at the nights. Not all of them reach the same depth. A faint supernova is only seen on good nights, and the search finds it with luck.')]]);
    }
  }

  // ---------- 3.2 la cola de la eficiencia ----------
  function picoBajoM50(o) { // pico detectado más débil que el m50 de su noche (el observable propio de la tesis)
    if (!o.det.length) return null;
    const d = o.det.reduce((a, b) => (b.m < a.m ? b : a));
    return d.m > d.m50;
  }
  function corteM50(m, fin) {
    const c = u.cont(), rand = U.rng(Date.now() % 1e9);
    c.innerHTML = `
      <div class="panel contrato"><h3>${Lg('¿Hasta dónde busca de verdad la búsqueda?', 'How deep does the search really go?')}</h3>
        <p>${Lg(`La ec. 1 dice que una supernova un poco más débil que el m50 todavía se encuentra a veces. Si eso no pasa en la práctica,
          el tiempo de control sale demasiado largo y la tasa demasiado baja. Calcula las dos cosas y después mira lo que dicen los datos.`,
          `Eq. 1 says that a supernova a bit fainter than the m50 is still found sometimes. If that does not happen in practice,
          the control time comes out too long and the rate too low. Compute both and then look at what the data say.`)}</p></div>
      <canvas class="vista alto" id="tamiz"></canvas>
      <p class="fila"><button class="primario" id="soltarS">${Lg('Soltar supernovas: ec. 1 al pie de la letra', 'Drop supernovae: eq. 1 literally')}</button><button id="soltarC">${Lg('Soltar con el corte en el m50', 'Drop with the m50 cut')}</button></p>
      <p class="tenue pie">${Lg(`El colador de la búsqueda. Cada bolita es una supernova en su mejor noche, con su magnitud: cae y pasa (la búsqueda la encuentra)
        con la probabilidad DE(m), que es la densidad de agujeros. Rojas: las más débiles que el m50. Con el corte, más allá del m50 el colador es una pared.`,
        `The search sieve. Each ball is a supernova on its best night, with its magnitude. It falls and passes (the search finds it)
        with probability DE(m), which is the density of holes. Red: those fainter than the m50. With the cut, beyond the m50 the sieve is a wall.`)}</p>
      <p class="fila"><button class="primario" id="calc">${Lg('Calcular el tiempo de control de las Ia, con y sin corte', 'Compute the Ia control time, with and without the cut')}</button><span class="dato" id="prog"></span></p>
      <div class="grilla2">
        <div><h3>${Lg('Universo de juego: A sin corte / A con corte', 'Game universe: A without cut / A with cut')}</h3><canvas class="grafico" id="cmp"></canvas></div>
        <div><h3>${Lg('La tesis, con la receta de SUDARE I: A / la de su Tabla 5', 'The thesis, with the SUDARE I recipe: A / that of their Table 5')}</h3><canvas class="grafico" id="tes"></canvas>
          <div class="leyenda"><span><i style="background:rgba(255,184,77,0.5)"></i>${Lg('ec. 1 literal', 'eq. 1 literal')}</span><span><i style="background:#ffb84d"></i>${Lg('con el corte en el m50', 'with the m50 cut')}</span></div></div>
      </div>
      <div id="obs"></div>
      <div id="fin"></div>`;
    // el colador: las magnitudes de las supernovas de una temporada en su mejor noche (las que se detectan al menos una vez)
    const tamiz = Escenas.Tamiz($('#tamiz', c)), m50t = (() => { const xs = S1.campos.flatMap(cp => cp.epocas.map(e => e.m50)).sort((a, b) => a - b); return xs[xs.length >> 1]; })();
    let corteT = null, resT = { sin: null, con: null };
    const mags = (() => { const uni = P.crearUniverso({ campos: S1.campos, tasas: { Ia: 0.45, II: 0.95, Ibc: 0.35, IIn: 0.1 }, rand }), xs = [];
      for (const sn of uni.sne) { const o = P.observar(sn, S1.campos[sn.campo], { rand, corte: null }); if (o.det.length) xs.push(Math.min(...o.det.map(d => d.mv))); }
      return xs.sort(() => rand() - 0.5).slice(0, 220); })();
    const soltar = conCorte => { corteT = conCorte ? 0 : null; tamiz.poner({ magnitudes: mags, conCorte, m50: m50t }); };
    $('#soltarS', c).onclick = () => soltar(false);
    $('#soltarC', c).onclick = () => soltar(true);
    u.animar(dt => {
      const r = tamiz.dibujar(dt, { DE: mm => P.eficiencia(mm, m50t, { corte: corteT }) });
      if (r && r.listo) { const k = corteT === null ? 'sin' : 'con'; if (!resT[k]) { resT[k] = r;
        u.hablar(k === 'sin' ? [['operador', Lg(`Sin corte pasaron ${r.debilesPasan} supernovas más débiles que el m50: la cola del arcotangente las deja pasar.`,
          `Without the cut, ${r.debilesPasan} supernova${r.debilesPasan === 1 ? '' : 'e'} fainter than the m50 got through. The tail of the arctangent lets them pass.`)], ['operador', Lg('Ahora suéltalas con el corte.', 'Now drop them with the cut.')]]
          : [['directora', Lg(`Con el corte no pasa ninguna más débil que el m50. La pregunta es cuál de los dos coladores se parece a la búsqueda real: eso lo dice un observable, más abajo.`,
            `With the cut, none fainter than the m50 gets through. The question is which of the two sieves looks like the real search. An observable tells you that, further down.`)]]); } }
      return true;
    });
    // la tesis: paso 1, receta de SUDARE I al pie de la letra, con y sin la cola
    const ia = T.paso1.bins.filter(b => b.tipo === 'Ia');
    {
      const ctx = Plot.preparar($('#tes', c)), xs = ia.map((_, i) => i);
      const T0 = Plot.ejes(ctx, { x0: -0.6, x1: ia.length - 0.4, y0: 0, y1: Math.max(...ia.map(b => b.literal)) * 1.15, xlabel: Lg('bin de z de las Ia: 0.05-0.15, 0.15-0.35, 0.35-0.55, 0.55-0.75', 'Ia z bin: 0.05-0.15, 0.15-0.35, 0.35-0.55, 0.55-0.75'), ylabel: Lg('cociente', 'ratio') });
      Plot.barras(ctx, T0, xs.flatMap(i => [i - 0.4, i]).concat(ia.length - 0.6), xs.flatMap(i => [ia[i].literal, 0]), 'rgba(255,184,77,0.5)');
      Plot.barras(ctx, T0, xs.flatMap(i => [i, i + 0.4]).concat(ia.length - 0.6), xs.flatMap(i => [ia[i].E0, 0]), '#ffb84d');
      Plot.hline(ctx, T0, 1, '#6ee7a0', Lg('reproduce', 'reproduces'));
    }
    $('#calc', c).onclick = () => {
      $('#calc', c).disabled = true;
      const res = {};
      const corridas = [['cola', null], ['corte', 0]];
      let k = 0;
      const sig = () => {
        if (k >= corridas.length) return mostrar(res);
        const [nom, corte] = corridas[k++];
        $('#prog', c).textContent = nom === 'cola' ? Lg('simulando sin corte…', 'simulating without the cut…') : Lg('simulando con corte…', 'simulating with the cut…');
        setTimeout(() => { res[nom] = P.exposicion({ campos: S1.campos, clase: 'Ia', nSim: 2500, rand, bins: BINS_IA, corte }); sig(); }, 20);
      };
      sig();
    };
    function mostrar(res) {
      $('#prog', c).textContent = '';
      const q = BINS_IA.map((_, i) => res.cola.A[i] / res.corte.A[i]);
      const ctx = Plot.preparar($('#cmp', c)), xs = q.map((_, i) => i);
      const T0 = Plot.ejes(ctx, { x0: -0.6, x1: q.length - 0.4, y0: 0, y1: Math.max(2, ...q) * 1.15, xlabel: Lg('bin de z de las Ia (los mismos)', 'Ia z bin (the same ones)'), ylabel: Lg('A sin corte / A con corte', 'A without cut / A with cut') });
      Plot.barras(ctx, T0, xs.flatMap(i => [i - 0.35, i + 0.35]).concat(q.length - 0.6), xs.flatMap(i => [q[i], 0]), '#5ad1ff');
      Plot.hline(ctx, T0, 1, '#6ee7a0', '');
      // el observable: con la verdad del universo de juego (que corta en el m50), ¿qué modelo se parece a lo real?
      const real = [], simC = [], simS = [];
      const uni = P.crearUniverso({ campos: S1.campos, tasas: { Ia: 0.45, II: 0.95, Ibc: 0.35, IIn: 0.1 }, rand });
      for (const sn of uni.sne) { const o = P.observar(sn, S1.campos[sn.campo], { rand, corte: 0 }); if (o.seleccionada) real.push(picoBajoM50(o)); }
      for (const [lista, corte] of [[simC, 0], [simS, null]]) {
        for (let i = 0; i < 3000; i++) {
          const ci = i % 3, cp = S1.campos[ci], sn = P.nuevaSN(['Ia', 'II', 'Ibc', 'IIn'][i % 4], ci, cp, rand), o = P.observar(sn, cp, { rand, corte });
          if (o.seleccionada) lista.push(picoBajoM50(o));
        }
      }
      const frac = xs2 => xs2.filter(Boolean).length / Math.max(1, xs2.length);
      const ob = T.observable_m50.partes;
      const filas = (parte, nom) => Object.entries(ob[parte] || {}).flatMap(([g, bs]) => bs.map(b => `<tr><td>${nom}</td><td>${g} ${b.z1}-${b.z2}</td><td>${b.n_bajo} ${Lg('de', 'of')} ${b.n_real}</td><td>${f2(b.sims_corte)}</td><td>${f2(b.sims_sin_corte)}</td><td>${f2(b.p_corte, 3)}</td></tr>`)).join('');
      $('#obs', c).innerHTML = `<div class="panel"><h3>${Lg('El observable: fracción de encontradas con su pico más débil que el m50 de esa noche', 'The observable: fraction of found supernovae whose peak is fainter than the m50 of that night')}</h3>
        <canvas class="grafico" id="frac" style="height:180px"></canvas>
        <p>${Lg(`En el universo de juego la búsqueda verdadera corta en el m50. Las simuladas con corte se parecen a las reales y las sin corte no:
          sin corte el modelo predice demasiadas supernovas encontradas bajo el m50.`, `In the game universe the true search cuts at the m50. The simulations with the cut look like the real ones and those without it do not.
          Without the cut the model predicts too many supernovae found below the m50.`)}</p>
        <details><summary>${Lg('La tesis: este observable en SUDARE I y en las temporadas posteriores', 'The thesis: this observable in SUDARE I and in the later seasons')}</summary>
          <table class="tabla"><tr>${Lg('<th>parte</th><th>bin</th><th>reales bajo el m50</th><th>sims con corte</th><th>sims sin corte</th><th>p (con corte)</th>',
            '<th>part</th><th>bin</th><th>real below the m50</th><th>sims with cut</th><th>sims without cut</th><th>p (with cut)</th>')}</tr>
          ${filas('sudare_I', 'SUDARE I')}${filas('posterior', Lg('posteriores', 'later seasons'))}</table>
          <p class="tenue">tasas_final.json, observable_r6. ${Lg('En las posteriores el m50 es un supuesto (maglim − 1.30): ahí aparece la tensión que la tesis declara como alarma y como la fuente 6b del sistemático.',
            'In the later seasons the m50 is an assumption (maglim − 1.30). That is where the tension appears that the thesis declares as an alarm and as source 6b of the systematics.')}</p></details></div>`;
      const ctx2 = Plot.preparar($('#frac', c)), vals = [frac(real), frac(simC), frac(simS)];
      const T1 = Plot.ejes(ctx2, { x0: -0.6, x1: 2.6, y0: 0, y1: Math.max(0.2, ...vals) * 1.25, xlabel: Lg('reales (juego) · simuladas con corte · simuladas sin corte', 'real (game) · simulated with cut · simulated without cut'), ylabel: Lg('fracción', 'fraction') });
      Plot.barras(ctx2, T1, [-0.35, 0.35, 0.65, 1.35, 1.65, 2.35], [vals[0], 0, vals[1], 0, vals[2]], '#ffb84d');
      const qa = f2(Math.min(...q), 1), qb = f2(Math.max(...q), 1), la = f2(Math.min(...ia.map(b => b.literal)), 1), lb = f2(Math.max(...ia.map(b => b.literal)), 1);
      const ea = f2(Math.min(...ia.map(b => b.E0))), eb = f2(Math.max(...ia.map(b => b.E0)));
      T.paso1 && ($('#fin', c).innerHTML = `<div class="panel">
        <p>${Lg(`Sin corte, el tiempo de control de las Ia sale ${qa} a ${qb} veces el de con corte en tu universo. En la tesis, con la receta de
          SUDARE I literal, salía ${la} a ${lb} veces el de su Tabla 5; con el corte, ${ea} a ${eb}.`,
          `Without the cut, the Ia control time comes out ${qa} to ${qb} times the one with the cut in your universe. In the thesis, with the SUDARE I recipe
          taken literally, it came out ${la} to ${lb} times that of their Table 5. With the cut, ${ea} to ${eb}.`)}</p>
        <p>${Lg('Por eso la tesis adoptó el corte (paso 1, regla del 2026-10-20), y lo respalda con el observable de arriba, no con la tasa.',
          'That is why the thesis adopted the cut (step 1, rule of 2026-10-20), and it backs it with the observable above, not with the rate.')}</p>
        <p><button class="primario" id="volver">${Lg('Volver al observatorio', 'Back to the observatory')}</button></p></div>`);
      u.desbloquear(m.ensena); u.marcar(m.id, true); u.sonar('fanfarria'); // aprobada al llegar aquí: salir ya no la deja a medias
      $('#volver', c).onclick = () => fin({ gana: true });
      u.hablar([['directora', Lg('La cola del arcotangente parece un detalle, y te cambia el tiempo de control de las lejanas por varias veces.', 'The tail of the arctangent looks like a detail, yet it changes the control time of the distant ones by a factor of several.')],
        ['directora', Lg('Una elección así no se decide por la tasa que da. Se decide con algo que los datos puedan mostrar: aquí, cuántas reales pican más débil que el m50.', 'A choice like this is not decided by the rate it gives. It is decided with something the data can show: here, how many real ones peak fainter than the m50.')]]);
    }
  }

  // ---------- 3.3 reproducir antes de medir ----------
  function exposicionReceta({ clase, bin: [z1, z2], receta, nSim, rand }) {
    const zc = (z1 + z2) / 2, In = P.integralN(z2) - P.integralN(z1);
    let A = 0;
    S1.campos.forEach((cp, ci) => {
      const [t0, t1] = P.ventana(cp);
      let n = 0;
      for (let i = 0; i < nSim; i++) {
        const sn = P.nuevaSN(clase, ci, cp, rand);
        sn.z = receta.zCentro ? zc : z1 + (z2 - z1) * rand(); // repartido uniforme en z dentro del bin (aproximación del juego)
        if (receta.lfFija) sn.M = sn.p.Mref;
        if (!receta.polvo) sn.E = 0;
        sn.mu = undefined; sn.tPico = undefined;
        if (P.observar(sn, cp, { rand, corte: receta.cola ? null : 0 }).seleccionada) n++;
      }
      A += F.deg2ASr(cp.area_deg2) * (t1 - t0) / 365.25 * In * n / nSim;
    });
    return A;
  }
  function reproducir(m, fin) {
    const c = u.cont(), rand = U.rng(Date.now() % 1e9);
    const RECETA_PAPER = { cola: true, lfFija: true, polvo: false, zCentro: true };
    const tasaVerdad = 0.3 + 0.2 * rand();
    let criterio = null;
    c.innerHTML = `
      <div class="panel contrato"><h3>${Lg('El paper publicado (universo de juego)', 'The published paper (game universe)')}</h3><div id="paper" class="tenue">${Lg('Calculando lo que publicó el paper…', 'Computing what the paper published…')}</div></div>
      <div class="grilla2">
        <div class="panel"><h3>${Lg('1. Fija el criterio antes de mirar', '1. Set the criterion before looking')}</h3>
          <p>${Lg('¿Entre qué cocientes A tuya / A del paper dirás que lo reproduces? Se fija antes de comparar, como en la tesis.',
            'Between which ratios of your A / the paper A will you say you reproduce it? It is set before comparing, as in the thesis.')}</p>
          <label class="control"><span>${Lg('mínimo', 'minimum')}</span><input type="range" id="qmin" min="0.3" max="0.95" step="0.05" value="0.5"><output id="oqmin"></output></label>
          <label class="control"><span>${Lg('máximo', 'maximum')}</span><input type="range" id="qmax" min="1.05" max="3" step="0.05" value="2"><output id="oqmax"></output></label>
          <p><button id="fijar">${Lg('Fijar el criterio', 'Set the criterion')}</button></p></div>
        <div class="panel"><h3>${Lg('2. Tu receta para el tiempo de control', '2. Your recipe for the control time')}</h3>
          <label class="control"><span>${Lg('Cola de la ec. 1', 'Tail of eq. 1')}</span><input type="checkbox" id="rcola"></label>
          <label class="control"><span>${Lg('Brillo propio de cada plantilla (sin LF)', 'Own brightness of each template (no LF)')}</span><input type="checkbox" id="rlf"></label>
          <label class="control"><span>${Lg('Polvo del host', 'Host dust')}</span><input type="checkbox" id="rpol" checked></label>
          <label class="control"><span>${Lg('z al centro del bin', 'z at the bin centre')}</span><input type="checkbox" id="rzc"></label>
          <p class="tenue">${Lg('Así viene: tu física, la de la tesis (corte en el m50, LF, polvo y z repartido en el bin).',
            'It starts with your physics, that of the thesis (m50 cut, LF, dust and z spread over the bin).')}</p>
          <p class="fila"><button class="primario" id="comparar" disabled>${Lg('Comparar con el paper', 'Compare with the paper')}</button><span class="dato" id="prog"></span></p></div>
      </div>
      <canvas class="vista alto" id="receta"></canvas>
      <p class="tenue pie">${Lg(`Tu receta a la vista: Ia simuladas del bin z 0.35-0.55 en su pico. Prende y apaga los ingredientes y mira cómo se mueven:
        cuántas quedan sobre el m50 es cuánta exposición te da la receta.`, `Your recipe in view: simulated Ia of the z 0.35-0.55 bin at their peak. Switch the ingredients on and off and watch how they move.
        How many stay above the m50 is how much exposure the recipe gives you.`)} ${marca}</p>
      <canvas class="vista diales" id="diales"></canvas>
      <p class="tenue pie">${Lg('Un dial por bin: A tuya / A del paper, en escala logarítmica. La zona verde es tu criterio; con el candado ya no se mueve.',
        'One dial per bin: your A / the paper A, on a log scale. The green zone is your criterion. Once padlocked it no longer moves.')}</p>
      <div id="res"></div>
      <div id="fin"></div>`;
    // la receta a la vista y los diales
    const escRec = Escenas.Receta($('#receta', c)), diales = Escenas.Diales($('#diales', c));
    const binR = [0.35, 0.55], m50R = (() => { const xs = S1.campos.flatMap(cp => cp.epocas.map(e => e.m50)).sort((a, b) => a - b); return xs[xs.length >> 1]; })();
    const base = Array.from({ length: 220 }, () => { const sn = P.nuevaSN('Ia', 0, S1.campos[0], rand); return { p: sn.p, z: binR[0] + (binR[1] - binR[0]) * rand(), M: sn.M, E: sn.E }; });
    const picoDe = q => { const sn = { p: q.p, z: q.z, M: q.M, E: q.E, tExp: 0 }; return P.mag(sn, P.subida(q.p, q.z)); };
    const objetivo = r => base.map(q => { const z = r.zCentro ? (binR[0] + binR[1]) / 2 : q.z; return { z, m: picoDe({ p: q.p, z, M: r.lfFija ? q.p.Mref : q.M, E: r.polvo ? q.E : 0 }) }; });
    const recetaActual = () => ({ cola: $('#rcola', c).checked, lfFija: $('#rlf', c).checked, polvo: $('#rpol', c).checked, zCentro: $('#rzc', c).checked });
    escRec.poner({ puntos: objetivo(recetaActual()), bin: binR, m50: m50R, DE: (m, cola) => P.eficiencia(m, m50R, { corte: cola ? null : 0 }) });
    ['rcola', 'rlf', 'rpol', 'rzc'].forEach(id => { $('#' + id, c).onchange = () => { const r = recetaActual(); escRec.receta(r, objetivo(r)); }; });
    diales.poner({ etiquetas: BINS_IA.map(b => `Ia, z ${b[0]}-${b[1]}`), crit: [0.5, 2] });
    u.animar(dt => { escRec.dibujar(dt); diales.dibujar(dt); return true; });
    ['qmin', 'qmax'].forEach(id => { const f = () => { $('#o' + id, c).textContent = (+$('#' + id, c).value).toFixed(2); diales.poner({ crit: [+$('#qmin', c).value, +$('#qmax', c).value] }); }; $('#' + id, c).oninput = f; f(); });
    // lo que publicó el paper: N contado y A con su receta
    let paper = null;
    setTimeout(() => {
      const uni = P.crearUniverso({ campos: S1.campos, tasas: { Ia: tasaVerdad }, rand });
      const obs = uni.sne.map(sn => ({ sn, o: P.observar(sn, S1.campos[sn.campo], { rand, corte: null }) }));
      paper = BINS_IA.map(b => {
        const N = obs.filter(x => x.o.seleccionada && x.sn.z >= b[0] && x.sn.z < b[1]).length;
        const A = exposicionReceta({ clase: 'Ia', bin: b, receta: RECETA_PAPER, nSim: 1500, rand });
        return { b, N, A, r: 1e4 * N / A };
      });
      $('#paper', c).innerHTML = `<table class="tabla"><tr><th>${Lg('bin de z', 'z bin')}</th><th>${Lg('N de Ia', 'N of Ia')}</th><th>A [yr Mpc³]</th><th>${Lg('tasa', 'rate')}</th></tr>
        ${paper.map(x => `<tr><td>${x.b[0]}-${x.b[1]}</td><td>${x.N}</td><td>${u.sci(x.A).txt}</td><td>${f2(x.r)}</td></tr>`).join('')}</table>
        <p class="tenue">${Lg('Como en SUDARE I, el paper da N, la tasa y su exposición se lee como A = N / r. Su receta no está en la tabla: hay que leerla en el texto.',
          'As in SUDARE I, the paper gives N and the rate, and its exposure is read as A = N / r. Its recipe is not in the table, you have to read it in the text.')} ${marca}</p>`;
    }, 30);
    $('#fijar', c).onclick = () => {
      criterio = [+$('#qmin', c).value, +$('#qmax', c).value];
      ['qmin', 'qmax', 'fijar'].forEach(id => { $('#' + id, c).disabled = true; });
      $('#fijar', c).textContent = Lg(`Criterio fijado: ${criterio[0].toFixed(2)} a ${criterio[1].toFixed(2)}`, `Criterion set: ${criterio[0].toFixed(2)} to ${criterio[1].toFixed(2)}`);
      diales.poner({ crit: criterio, fijo: true });
      $('#comparar', c).disabled = false;
    };
    let intentos = 0, reprodujo = false;
    $('#comparar', c).onclick = () => {
      if (!paper) return;
      const receta = { cola: $('#rcola', c).checked, lfFija: $('#rlf', c).checked, polvo: $('#rpol', c).checked, zCentro: $('#rzc', c).checked };
      $('#comparar', c).disabled = true; $('#prog', c).textContent = Lg('simulando…', 'simulating…');
      setTimeout(() => {
        const q = paper.map(x => exposicionReceta({ clase: 'Ia', bin: x.b, receta, nSim: 1500, rand }) / x.A);
        intentos++;
        const ok = q.every(v => v >= criterio[0] && v <= criterio[1]);
        const igual = Object.keys(RECETA_PAPER).every(k => receta[k] === RECETA_PAPER[k]);
        if (ok && igual) reprodujo = true;
        $('#prog', c).textContent = ''; $('#comparar', c).disabled = false;
        diales.poner({ q });
        $('#res', c).innerHTML = `<div class="panel"><h3>${Lg(`Intento ${intentos}: A tuya / A del paper`, `Attempt ${intentos}: your A / the paper A`)}</h3>
          <p class="${ok ? '' : 'aviso'}">${ok ? Lg('Todas las agujas dentro de tu criterio.', 'All the needles are within your criterion.') : Lg('Hay agujas fuera de tu criterio (rojas).', 'Some needles are outside your criterion (red).')}
          ${ok && !igual ? Lg('Ojo: lo reproduces con una receta distinta a la del paper; fíjate si no es suerte del ruido.', 'Careful: you reproduce it with a recipe different from the paper. Check that it is not just luck from the noise.') : ''}</p></div>`;
        $('#diales', c).scrollIntoView({ block: 'center', behavior: 'smooth' });
        if (reprodujo) terminar();
        else if (intentos === 1) u.hablar([['directora', Lg('Con tu física no sale lo mismo que el paper, y eso no dice nada malo de ninguno de los dos: son recetas distintas.', 'With your physics you do not get the same as the paper, and that says nothing bad about either of them. They are different recipes.')],
          ['directora', Lg('El paso 1 es reproducir SU método. Lee cómo lo hicieron y prueba su receta: brillo propio, sin polvo, z al centro del bin y la ec. 1 con su cola.', 'Step 1 is to reproduce THEIR method. Read how they did it and try their recipe: own brightness, no dust, z at the bin centre and eq. 1 with its tail.')]]);
      }, 30);
    };
    function terminar() {
      const e0 = T.paso1.bins;
      $('#fin', c).innerHTML = `<div class="panel">
        <p>${Lg('Reprodujiste el paper con su receta, y tu criterio estaba fijado antes de mirar. Recién ahora tiene sentido medir con tu física (el paso 4 de la tesis).',
          'You reproduced the paper with its recipe, and your criterion was set before looking. Only now does it make sense to measure with your physics (step 4 of the thesis).')}</p>
        <h3>${Lg('La tesis, paso 1: la receta de SUDARE I contra su Tabla 5', 'The thesis, step 1: the SUDARE I recipe against their Table 5')}</h3>
        <table class="tabla"><tr><th>${Lg('tipo y bin', 'type and bin')}</th><th>${Lg('A / A de la Tabla 5', 'A / A of Table 5')}</th></tr>${e0.map(b => `<tr><td>${b.tipo} ${b.z1}-${b.z2}</td><td>${f2(b.E0)}</td></tr>`).join('')}</table>
        <p class="tenue">${Lg(`${T.paso1.pasos.E0}. Ia e Ibc se reproducen sin parámetro libre. Las II y las IIn quedan más lejos y la tesis lo declara (escalera.json).`,
          `${PASO_E0_EN}. Ia and Ibc are reproduced with no free parameter. The II and IIn end up further off and the thesis declares it (escalera.json).`)}</p>
        <p><button class="primario" id="volver">${Lg('Volver al observatorio', 'Back to the observatory')}</button> <button id="simetria">${Lg('Experta: la simetría', 'Expert: symmetry')}</button></p></div>`;
      u.desbloquear(m.ensena); u.marcar(m.id, true); u.sonar('fanfarria');
      $('#volver', c).onclick = () => fin({ gana: true });
      $('#simetria', c).onclick = simetria;
    }
    function simetria() {
      // un corte que se aplica solo a las reales: las reales piden 5 detecciones, las simuladas 1 (la selección (a) de SUDARE I)
      const uni = P.crearUniverso({ campos: S1.campos, tasas: { Ia: tasaVerdad }, rand });
      const obs = uni.sne.map(sn => ({ sn, o: P.observar(sn, S1.campos[sn.campo], { rand, corte: 0 }) }));
      const b = [0.35, 0.55], enBin = x => x.sn.z >= b[0] && x.sn.z < b[1];
      const nSim = (minReal, minSim) => {
        const N = obs.filter(x => enBin(x) && x.o.encontrada && x.o.det.length >= minReal).length;
        let n = 0, A = 0;
        S1.campos.forEach((cp, ci) => {
          const [t0, t1] = P.ventana(cp); let k = 0;
          for (let i = 0; i < 1500; i++) { const sn = P.nuevaSN('Ia', ci, cp, rand); sn.z = b[0] + (b[1] - b[0]) * rand(); sn.mu = undefined; sn.tPico = undefined; const o = P.observar(sn, cp, { rand, corte: 0 }); if (o.encontrada && o.det.length >= minSim) k++; }
          A += F.deg2ASr(cp.area_deg2) * (t1 - t0) / 365.25 * (P.integralN(b[1]) - P.integralN(b[0])) * k / 1500;
        });
        return 1e4 * N / A;
      };
      const sim = nSim(4, 4), asim = nSim(5, 1);
      u.desbloquear(['simetria']);
      $('#fin', c).insertAdjacentHTML('beforeend', `<div class="panel"><h3>${Lg('La simetría', 'Symmetry')}</h3>
        <p>${Lg(`Misma temporada, Ia entre z 0.35 y 0.55. Con la misma regla para reales y simuladas (4 detecciones): tasa <b>${f2(sim)}</b>.
          Con un corte solo en las reales (5 detecciones las reales, 1 las simuladas): <b>${f2(asim)}</b>. La verdadera: <b>${f2(tasaVerdad)}</b>`,
          `Same season, Ia between z 0.35 and 0.55. With the same rule for real and simulated ones (4 detections): rate <b>${f2(sim)}</b>.
          With a cut only on the real ones (5 detections for the real, 1 for the simulated): <b>${f2(asim)}</b>. The true one: <b>${f2(tasaVerdad)}</b>`)} ${marca}.</p>
        <p>${Lg(`Todo corte que se le hace a las reales se le tiene que hacer a las simuladas. Si no, la tasa se sesga y el árbitro lo nota.
          La tesis lo cuida en cada regla: la selección, la regla de varias temporadas (con detecciones falsas inyectadas en las simuladas) y la limpieza de AGN (con el factor 1 − e_SN en la exposición).`,
          `Every cut applied to the real ones has to be applied to the simulated ones. Otherwise the rate is biased and the referee notices.
          The thesis takes care of this in every rule: the selection, the multi-season rule (with false detections injected into the simulations) and the AGN cleaning (with the factor 1 − e_SN in the exposure).`)}</p></div>`);
      u.hablar([['directora', Lg('La selección de SUDARE I no era simétrica: las reales pedían cinco mediciones y las simuladas una detección. Por eso la tesis no la usa en el paso 4.', 'The SUDARE I selection was not symmetric. The real ones needed five measurements and the simulated ones a single detection. That is why the thesis does not use it in step 4.')]]);
    }
  }

  M.registrar('sudare', sudare);
  M.registrar('corte_m50', corteM50);
  M.registrar('reproducir', reproducir);
  M.agregar([
    { id: '3.1', cap: 3, titulo: Lg('El survey de verdad', 'The real survey'), tipo: 'sudare', donde: 'biblioteca', ensena: ['eficiencia'],
      contrato: [
        ['directora', Lg('Basta de surveys inventados. En la biblioteca está el archivo de SUDARE I: las noches que observó el VST en tres campos, con lo hondo que llegó cada una.', 'No more invented surveys. The library holds the SUDARE I archive: the nights the VST observed in three fields, with how deep each one reached.')],
        ['directora', Lg('Pon supernovas sobre esas noches y mira cuándo se detectan y cuándo las encuentra la búsqueda.', 'Put supernovae on those nights and see when they are detected and when the search finds them.')],
      ],
      abre: [['operador', Lg('Ese es el registro publicado de SUDARE I. Toca "Otra supernova" las veces que quieras.', 'That is the published SUDARE I log. Press "Another supernova" as many times as you like.')]] },
    { id: '3.2', cap: 3, titulo: Lg('La cola de la eficiencia', 'The efficiency tail'), tipo: 'corte_m50', donde: 'biblioteca', ensena: [],
      contrato: [['directora', Lg('La ec. 1 de SUDARE I tiene una cola larga más allá del m50. Mide cuánto pesa en el tiempo de control y qué dicen los datos.', 'SUDARE I eq. 1 has a long tail beyond the m50. Measure how much it weighs in the control time and what the data say.')]] },
    { id: '3.3', cap: 3, titulo: Lg('Reproducir antes de medir', 'Reproduce before measuring'), tipo: 'reproducir', donde: 'biblioteca', ensena: [],
      contrato: [
        ['directora', Lg('Antes de dar una tasa propia, muestra que entiendes la de ellos. En la biblioteca hay un paper publicado: reprodúcelo.', 'Before giving a rate of your own, show that you understand theirs. There is a published paper in the library. Reproduce it.')],
        ['directora', Lg('Y fija el criterio antes de mirar, como en la tesis. Si lo eliges después, ya no es una prueba.', 'And set the criterion before looking, as in the thesis. If you choose it afterwards, it is no longer a test.')],
      ] },
  ]);
})();
