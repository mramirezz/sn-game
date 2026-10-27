// Capítulos 2 a 7: sus misiones se agregan a las de misiones.js y sus instrumentos se registran ahí.
// Universo de juego: población con las plantillas de la tesis y el survey SUDARE I publicado (js/poblacion.js).
(() => {
  const M = Misiones, u = M.util, F = Fisica, U = Universo, P = Poblacion, V2 = Vista2;
  const $ = (s, r = document) => r.querySelector(s);
  const CL = V2.CL, CLASES = V2.CLASES;
  const S1 = window.SUDARE1, T = window.TESIS;
  const f2 = u.f2, marca = u.marca;
  const leyenda = () => `<div class="leyenda">${CLASES.map(c => `<span><i style="background:${CL[c]}"></i>${c}</span>`).join('')}</div>`;
  // Fracciones volumétricas de Li et al. (2011b), las que usa la tesis (prior_fisico_bts.json): Ia, Ibc y II del total, y la
  // fracción de IIn dentro de las II. El universo de juego sortea solo la normalización.
  const LIt = T.bts.tasas_relativas.Li2011b_total, LIn = T.bts.tasas_relativas.Li2011b_dentro_II.IIn / 100;
  const LI = { Ia: LIt.Ia, II: LIt.II * (1 - LIn), Ibc: LIt.Ibc, IIn: LIt.II * LIn }, LI_CC = LIt.II + LIt.Ibc;
  function tasasJuego(rand) {
    const ia = 0.3 + 0.2 * rand(); // del orden de las tasas medidas a z 0.3-0.6
    return Object.fromEntries(CLASES.map(k => [k, ia * LI[k] / LI.Ia]));
  }
  const ZMAX_TODAS = { Ia: 0.8, II: 0.8, Ibc: 0.8, IIn: 0.8 };
  const m50Mediano = () => { const xs = S1.campos.flatMap(c => c.epocas.map(e => e.m50)).sort((a, b) => a - b); return xs[xs.length >> 1]; };
  // Corre una función pesada en pedazos para que el panel no se congele; avisa el progreso.
  function enPedazos(n, paso, fn, alAvanzar, alTerminar) {
    let i = 0;
    const tick = () => {
      if (!Misiones.abierto()) return; // se salió del instrumento a medio cálculo: no escribir en un panel que ya no está
      const fin = Math.min(n, i + paso);
      for (; i < fin; i++) fn(i);
      alAvanzar && alAvanzar(i / n);
      if (i < n) setTimeout(tick, 0); else alTerminar && alTerminar();
    };
    setTimeout(tick, 0);
  }

  // ================= capítulo 2: no todas son iguales =================
  // 2.1 Dos tortas y el sesgo de Malmquist
  function poblacion(m, fin) {
    const c = u.cont(), rand = U.rng(Date.now() % 1e9), tasas = tasasJuego(rand);
    c.innerHTML = `
      <canvas class="vista alto" id="cono21"></canvas>
      <p class="tenue pie">${Lg(`El cono de tu survey (tú en la punta, más lejos más z). Cada supernova destella al explotar: queda del color de su clase si la encontraste,
        gris si no. Los anillos punteados son la frontera de cada clase: hasta ahí llega una supernova típica de esa clase con el límite del survey.`,
        `The cone of your survey (you at the tip, further out means higher z). Each supernova flashes when it explodes. It keeps the colour of its class if you found it,
        grey if not. The dotted rings are the frontier of each class: a typical supernova of that class is seen out to there with the survey limit.`)}</p>
      <label class="control"><span>${Lg('límite del survey', 'survey limit')}</span><input type="range" id="mlim21" min="21" max="25.5" step="0.1" value="23.4"><output id="omlim21"></output></label>
      <p class="dato" id="vol21"></p>
      <div class="fila"><button class="primario" id="correr">${Lg('Correr la temporada', 'Run the season')}</button><span class="dato">${Lg('Día', 'Day')} <b id="dia" style="color:var(--cian)">–</b></span>${marca}</div>
      <canvas class="vista" id="tortas"></canvas>
      <p class="tenue pie">${Lg(`Izquierda: todas las que explotaron en los tres campos de SUDARE I hasta z = 0.8. Derecha: las que encontraste.
        Mismo universo, misma temporada.`, `Left: all the ones that exploded in the three SUDARE I fields up to z = 0.8. Right: the ones you found.
        Same universe, same season.`)}</p>
      <canvas class="vista" id="mz"></canvas>
      <p class="tenue pie">${Lg(`Cada punto es una supernova: su magnitud absoluta en el pico (M) contra su distancia (z). Gris: no la viste.
        Color: la encontraste. La línea es lo más débil que alcanzas a cada z con el m50 típico de SUDARE I.`,
        `Each point is a supernova: its absolute magnitude at peak (M) against its distance (z). Grey: you did not see it.
        Colour: you found it. The line is the faintest you reach at each z with the typical SUDARE I m50.`)}</p>
      ${leyenda()}
      <div id="fin"></div>`;
    const uni = P.crearUniverso({ campos: S1.campos, tasas, rand, zmax: ZMAX_TODAS });
    const obs = uni.sne.map(sn => ({ sn, o: P.observar(sn, S1.campos[sn.campo], { rand, corte: 0 }) }));
    const t0 = Math.min(...S1.campos.map(cp => P.ventana(cp)[0])), t1 = Math.max(...S1.campos.map(cp => P.ventana(cp)[1]));
    // el instante de cada campo se lleva a una línea común: el día desde el inicio de la ventana de su campo
    const dia0 = sn => P.ventana(S1.campos[sn.campo])[0];
    let dia = -1, corriendo = false;
    const largo = Math.max(...S1.campos.map(cp => P.ventana(cp)[1] - P.ventana(cp)[0]));
    const mlim = m50Mediano();
    const dibujar = () => {
      const A = {}, B = {}, puntos = [];
      for (const { sn, o } of obs) {
        if (sn.tExp - dia0(sn) > dia) continue;
        A[sn.clase] = (A[sn.clase] || 0) + 1;
        const enc = o.seleccionada && o.det[0].t - dia0(sn) <= dia;
        if (enc) B[sn.clase] = (B[sn.clase] || 0) + 1;
        puntos.push({ z: sn.z, M: sn.M + (sn.E ? sn.E * 2.5 : 0), clase: sn.clase, enc });
      }
      V2.tortas($('#tortas', c), { A, B });
      V2.malmquist($('#mz', c), { puntos, mlim });
      $('#dia', c).textContent = dia < 0 ? '–' : Math.round(dia);
    };
    dia = largo; dibujar(); dia = -1; dibujar();
    // el cono: las supernovas aparecen el día que explotan; las fronteras de cada clase dependen del límite
    const cono = Escenas.Cono($('#cono21', c), { zmax: 0.8 }), dirs = obs.map(() => cono.direccion(rand));
    const zFrontera = (cl, ml) => { // hasta qué z una supernova típica de la clase (su LF media, en el pico) es más brillante que el límite
      const ps = P.lib().porClase[cl];
      const pico = (q, z) => { const m0 = P.magSinDistancia(q, z, 0); return (Number.isFinite(m0) ? m0 : 30) + (q.lf[0] - q.Mref); };
      for (let z = 0.01; z <= 0.8; z += 0.01) { const mp = ps.reduce((a, q) => a + pico(q, z), 0) / ps.length; if (!(mp + F.mu(z) < ml)) return z; }
      return 0.8;
    };
    let fronteras = {};
    const ponerLimite = () => {
      const ml = +$('#mlim21', c).value; $('#omlim21', c).textContent = ml.toFixed(1);
      fronteras = Object.fromEntries(CLASES.map(cl => [cl, zFrontera(cl, ml)]));
      const vol = cl => F.dc(fronteras[cl]) ** 3, rel = vol('Ia') / Math.max(1, vol('II'));
      $('#vol21', c).innerHTML = Lg(`Con límite ${ml.toFixed(1)}: una Ia típica se ve hasta z ≈ ${f2(fronteras.Ia)} y una II típica hasta z ≈ ${f2(fronteras.II)}.
        El volumen donde ves a la Ia es <b>${rel.toFixed(0)} veces</b> el de la II.`,
        `With limit ${ml.toFixed(1)}: a typical Ia is seen out to z ≈ ${f2(fronteras.Ia)} and a typical II out to z ≈ ${f2(fronteras.II)}.
        The volume where you see the Ia is <b>${rel.toFixed(0)} times</b> that of the II.`);
    };
    $('#mlim21', c).value = mlim.toFixed(1); // parte en el m50 típico de SUDARE I
    $('#mlim21', c).oninput = ponerLimite; ponerLimite();
    u.animar(dt => {
      const ps = obs.map((x, i) => {
        const dt0 = dia - (x.sn.tExp - dia0(x.sn));
        if (dt0 < 0) return null;
        const enc = x.o.seleccionada && x.o.det[0].t - dia0(x.sn) <= dia;
        return { z: x.sn.z, ...dirs[i], color: CL[x.sn.clase], r: 4, apagada: !enc && dt0 > 25, destello: dt0 < 25 ? dt0 / 25 : null, enc };
      }).filter(Boolean);
      const capas = CLASES.map(cl => ({ z: fronteras[cl], color: CL[cl], guiones: [5, 4], ancho: 1.6 }));
      cono.dibujar(dt, { puntos: ps, capas, textos: [{ t: dia < 0 ? Lg('aprieta Correr la temporada', 'press Run the season') : Lg(`día ${Math.round(dia)} · explotaron ${ps.length} · encontraste ${ps.filter(q => q.enc).length}`, `day ${Math.round(dia)} · exploded ${ps.length} · found ${ps.filter(q => q.enc).length}`), color: '#e8ecf8' }] });
      if (!corriendo) return true;
      dia = Math.min(largo, dia + largo / 12 * dt);
      dibujar();
      if (dia >= largo) { corriendo = false; terminar(); }
      return true;
    });
    $('#correr', c).onclick = () => { if (dia >= largo) return; corriendo = !corriendo; dia = Math.max(dia, 0); $('#correr', c).textContent = corriendo ? Lg('Pausa', 'Pause') : Lg('Seguir', 'Resume'); };
    function terminar() {
      $('#correr', c).disabled = true;
      const nA = CLASES.map(k => obs.filter(x => x.sn.clase === k).length), nB = CLASES.map(k => obs.filter(x => x.sn.clase === k && x.o.seleccionada).length);
      const lf = k => { const ps = P.lib().porClase[k]; return ps.reduce((s, p) => s + p.lf[0], 0) / ps.length; };
      const dM = lf('II') - lf('Ia'), factor = 10 ** (0.6 * dM);
      $('#fin', c).innerHTML = `<div class="panel">
        <table class="tabla"><tr>${Lg('<th>clase</th><th>explotaron</th><th>encontraste</th><th>fracción encontrada</th>', '<th>class</th><th>exploded</th><th>found</th><th>fraction found</th>')}</tr>
          ${CLASES.map((k, i) => `<tr><td style="color:${CL[k]}">${k}</td><td>${nA[i]}</td><td>${nB[i]}</td><td>${nA[i] ? (100 * nB[i] / nA[i]).toFixed(0) : 0} %</td></tr>`).join('')}</table>
        <p>${Lg(`Por qué: una supernova de magnitud M se ve hasta la distancia donde su brillo aparente cae al límite. El volumen que alcanzas crece como el cubo
          de esa distancia, así que el número que encuentras va como`, `Why: a supernova of magnitude M is seen out to the distance where its apparent brightness drops to the limit. The volume you reach grows as the cube
          of that distance, so the number you find goes as`)}</p>
        <div class="ecuacion" id="ecM"></div>
        <p>${Lg(`Con las funciones de luminosidad de la tesis, una Ia promedio es ${f2(dM, 1)} mag más brillante que una II promedio:
          la ves en un volumen ${factor.toFixed(0)} veces más grande. Eso es el sesgo de Malmquist (Malmquist bias).`,
          `With the luminosity functions of the thesis, an average Ia is ${f2(dM, 1)} mag brighter than an average II,
          so you see it in a volume ${factor.toFixed(0)} times larger. That is the Malmquist bias.`)}</p>
        <p class="tenue">${Lg(`Las fracciones de la izquierda son las volumétricas de Li et al. (2011b) que usa la tesis:
          ${LIt.Ia} % Ia, ${LIt.Ibc} % Ibc y ${LIt.II} % II, con ${T.bts.tasas_relativas.Li2011b_dentro_II.IIn} % de IIn dentro de las II.`,
          `The fractions on the left are the volumetric ones of Li et al. (2011b) used in the thesis:
          ${LIt.Ia} % Ia, ${LIt.Ibc} % Ibc and ${LIt.II} % II, with ${T.bts.tasas_relativas.Li2011b_dentro_II.IIn} % IIn within the II.`)}</p>
        <p><button class="primario" id="volver">${Lg('Volver al observatorio', 'Back to the observatory')}</button></p></div>`;
      u.tex($('#ecM', c), String.raw`N \;\propto\; V_\mathrm{max} \;\propto\; d_\mathrm{max}^{\,3} \;\propto\; 10^{\,0.6\,(m_\mathrm{lim} - M)}`);
      u.desbloquear(m.ensena); u.marcar(m.id, true); u.sonar('fanfarria');
      $('#volver', c).onclick = () => fin({ gana: true });
      u.hablar([
        ['directora', Lg('Mira las tortas. En el universo las II son mayoría, pero tú encontraste sobre todo Ia.', 'Look at the pies. In the universe the II are the majority, but you found mostly Ia.')],
        ['directora', Lg('No es que haya más Ia: es que son más brillantes y las ves mucho más lejos. Cada clase tiene su función de luminosidad (luminosity function).', 'It is not that there are more Ia. They are brighter, so you see them much further away. Each class has its own luminosity function.')],
        ['directora', Lg('Por eso el tiempo de control se calcula clase por clase, y dentro de cada clase, subtipo por subtipo: cada uno con su brillo y su curva.', 'That is why the control time is computed class by class, and within each class, subtype by subtype, each with its own brightness and light curve.')],
      ]);
    }
  }

  // 2.2 La K-corrección: el filtro ve otro color
  function magAB(E, z, iesp) { // magnitud sintética (sin constantes) del espectro corrido al rojo z, en el filtro r
    const { onda, filtro } = E, fl = E.espectros[iesp].flujo, d = onda[1] - onda[0];
    let num = 0, den = 0;
    for (let i = 0; i < filtro.onda.length - 1; i++) {
      const l = (filtro.onda[i] + filtro.onda[i + 1]) / 2, dl = filtro.onda[i + 1] - filtro.onda[i], S = (filtro.resp[i] + filtro.resp[i + 1]) / 2;
      const lr = l / (1 + z), k = (lr - onda[0]) / d, j = Math.floor(k);
      if (j < 0 || j >= onda.length - 1) return null;
      const fr = fl[j] + (fl[j + 1] - fl[j]) * (k - j);
      num += fr / (1 + z) * S * l * dl; den += S / l * dl;
    }
    return -2.5 * Math.log10(num / den);
  }
  function kcorr(m, fin) {
    const c = u.cont(), E = window.ESPECTRO;
    let z = 0, iesp = 0, maxZ = 0, listo = false, jugando = false;
    c.innerHTML = `
      <canvas class="vista" id="esp"></canvas>
      <p class="tenue pie">${Lg(`El espectro de ${E.sn} (una Ia de la biblioteca de la tesis) visto a distintas distancias. El filtro r del telescopio no se mueve:
        al alejar la supernova, su luz llega corrida al rojo y el filtro ve otra parte del espectro.`,
        `The spectrum of ${E.sn} (an Ia from the thesis library) seen at different distances. The telescope's r filter does not move.
        As the supernova moves away, its light arrives redshifted and the filter sees another part of the spectrum.`)}</p>
      <label class="control"><span>z</span><input type="range" id="z" min="0" max="0.75" step="0.01" value="0"><output id="oz">0.00</output></label>
      <div class="fila"><button id="jugar">${Lg('▶ Alejar sola', '▶ Let it recede')}</button>${E.espectros.map((e, i) => `<button data-f="${i}">${Lg('fase', 'phase')} ${e.fase >= 0 ? '+' : ''}${e.fase} d</button>`).join('')}</div>
      <div class="grilla2">
        <div><h3>${Lg('K(z): cuánto cambia la magnitud por ver otro color', 'K(z): how much the magnitude changes by seeing another colour')}</h3><canvas class="grafico" id="kz"></canvas></div>
        <div><h3>${Lg('La curva de luz en r a tres z (biblioteca de la tesis)', 'The light curve in r at three z (thesis library)')}</h3><canvas class="grafico" id="cl"></canvas></div>
      </div>
      <div class="ecuacion" id="ecK"></div>
      <div id="fin"></div>`;
    u.tex($('#ecK', c), Lg(String.raw`m_r \;=\; M_r \;+\; \mu(z) \;+\; K_r(z), \qquad K_r(z) \;=\; m_r^{\,\mathrm{espectro\ corrido}}(z) \;-\; m_r^{\,\mathrm{reposo}}`,
      String.raw`m_r \;=\; M_r \;+\; \mu(z) \;+\; K_r(z), \qquad K_r(z) \;=\; m_r^{\,\mathrm{shifted\ spectrum}}(z) \;-\; m_r^{\,\mathrm{rest}}`));
    const dibujar = () => {
      V2.kcorr($('#esp', c), { onda: E.onda, flujo: E.espectros[iesp].flujo, filtro: E.filtro, z, fase: E.espectros[iesp].fase });
      const ctx = Plot.preparar($('#kz', c)), zs = [], ks = [];
      for (let x = 0; x <= 0.75; x += 0.01) { const a = magAB(E, x, iesp), b = magAB(E, 0, iesp); if (a !== null) { zs.push(x); ks.push(a - b); } }
      const T0 = Plot.ejes(ctx, { x0: 0, x1: 0.75, y0: Math.min(-0.5, ...ks) - 0.1, y1: Math.max(0.5, ...ks) + 0.1, xlabel: 'z', ylabel: 'K [mag]', invertirY: true });
      Plot.linea(ctx, T0, zs, ks, '#ffb84d', 2.5);
      Plot.vline(ctx, T0, z, '#e8ecf8', `z = ${z.toFixed(2)}`);
      const p = P.lib().plantillas.find(q => q.sn === E.sn) || P.lib().porClase.Ia[0];
      const ctx2 = Plot.preparar($('#cl', c)), fases = []; for (let f = -20; f <= 120; f += 1) fases.push(f);
      const curvas = [[0.05, '#5ad1ff'], [0.3, '#ffb84d'], [0.6, '#ff6b6b']].map(([zz, col]) => {
        const ms = fases.map(f => P.magSinDistancia(p, zz, f)), mn = Math.min(...ms.filter(Number.isFinite));
        return [zz, col, ms.map(x => Number.isFinite(x) ? x - mn : NaN)];
      });
      const T1 = Plot.ejes(ctx2, { x0: -20, x1: 120, y0: -0.2, y1: 4, xlabel: Lg('días del observador desde el pico', 'observer days from peak'), ylabel: Lg('mag bajo el pico', 'mag below peak'), invertirY: true });
      for (const [zz, col, ms] of curvas) { Plot.linea(ctx2, T1, fases.filter((_, i) => Number.isFinite(ms[i])), ms.filter(Number.isFinite), col, 2); }
      $('#oz', c).textContent = z.toFixed(2);
      if (z > maxZ) maxZ = z;
      if (maxZ >= 0.5 && !listo) { listo = true; cerrarla(); }
    };
    $('#z', c).oninput = e => { z = +e.target.value; jugando = false; dibujar(); };
    c.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { iesp = +b.dataset.f; dibujar(); });
    $('#jugar', c).onclick = () => { jugando = !jugando; if (z >= 0.74) z = 0; };
    u.animar(dt => { if (jugando) { z = Math.min(0.75, z + 0.12 * dt); $('#z', c).value = z; dibujar(); if (z >= 0.75) jugando = false; } return true; });
    dibujar();
    function cerrarla() {
      $('#fin', c).innerHTML = `<div class="panel">
        <p>${Lg(`Fíjate en las curvas: a z alto la curva se estira (el (1+z) del capítulo 1) y además cambia de forma, porque el filtro r ve el azul de la supernova,
          que se apaga más rápido. Eso es la K-corrección (K-correction): la diferencia entre medir en la misma banda en reposo y en la que llega.`,
          `Look at the curves. At high z the curve stretches (the (1+z) of chapter 1) and it also changes shape, because the r filter sees the blue of the supernova,
          which fades faster. That is the K-correction: the difference between measuring the same band at rest and the band that arrives.`)}</p>
        <p>${Lg(`La tesis no usa tablas de K-corrección: como sus plantillas son series de espectros, calcula la magnitud que vería el filtro a cada z
          con fotometría sintética exacta. Es lo que acabas de ver.`, `The thesis does not use K-correction tables. Its templates are series of spectra, so it computes the magnitude the filter would see at each z
          with exact synthetic photometry. That is what you just saw.`)}</p>
        <p><button class="primario" id="volver">${Lg('Volver al observatorio', 'Back to the observatory')}</button></p></div>`;
      u.desbloquear(m.ensena); u.marcar(m.id, true); u.sonar('fanfarria'); // aprobada al llegar aquí: salir ya no la deja a medias
      $('#volver', c).onclick = () => fin({ gana: true });
      u.hablar([['operador', Lg('A z 0.5 el filtro r ya está mirando el azul de la supernova. Por eso las lejanas se ven más débiles de lo que diría solo la distancia.', 'At z 0.5 the r filter is already looking at the blue of the supernova. That is why distant ones look fainter than distance alone would say.')]]);
    }
  }

  // 2.3 El taller del modelo y la puerta de realismo
  const MEDIDAS = [
    ['pico', Lg('magnitud del pico detectado', 'detected peak magnitude'), d => d.pico, 'mag'],
    ['Mabs', Lg('magnitud absoluta del pico detectado', 'absolute magnitude of the detected peak'), d => d.Mabs, 'mag'],
    ['ndet', Lg('número de detecciones', 'number of detections'), d => d.ndet, ''],
    ['dur', Lg('días entre la primera y la última detección', 'days between the first and the last detection'), d => d.dur, 'd'],
  ];
  const mediana = xs => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[s.length >> 1] : NaN; };
  const resumen = (o, z) => ({ pico: o.pico, Mabs: o.pico - F.mu(z), ndet: o.det.length, dur: o.det.length ? o.det[o.det.length - 1].t - o.det[0].t : 0 });
  function modelo(m, fin) {
    const c = u.cont(), rand = U.rng(Date.now() % 1e9);
    const signo = () => (rand() < 0.5 ? -1 : 1);
    const verdad = { tasas: tasasJuego(rand), dlf: { Ia: signo() * (0.15 + 0.25 * rand()), CC: signo() * (0.4 + 0.5 * rand()) }, polvo: 0.6 + 1.2 * rand() };
    let experta = false;
    c.innerHTML = `
      <div class="panel contrato"><h3>${Lg('El taller del modelo', 'The model workshop')}</h3>
        <p>${Lg(`Para calcular el tiempo de control simulas supernovas. Pero ¿con qué población? Si tu modelo es más brillante que el universo,
          crees que ves más lejos de lo que ves y tu tasa sale baja. Ajusta tu modelo hasta que lo simulado se parezca a lo real: esa es la puerta de realismo.`,
          `To compute the control time you simulate supernovae. But with which population? If your model is brighter than the universe,
          you think you see further than you do and your rate comes out low. Tune your model until the simulated looks like the real: that is the realism gate.`)}</p></div>
      <div class="grilla2">
        <div class="panel"><h3>${Lg('Tu modelo', 'Your model')}</h3>
          <label class="control"><span>${Lg('LF de las Ia', 'Ia LF')}</span><input type="range" id="dIa" min="-0.6" max="0.6" step="0.05" value="0"><output id="oIa"></output></label>
          <label class="control"><span>${Lg('LF de las CC', 'CC LF')}</span><input type="range" id="dCC" min="-1" max="1" step="0.05" value="0"><output id="oCC"></output></label>
          <label class="control"><span>${Lg('Polvo del host', 'Host dust')}</span><input type="range" id="pol" min="0.3" max="2.5" step="0.05" value="1"><output id="oP"></output></label>
          <p class="tenue">${Lg('Las LF se corren en magnitudes respecto de las de la tesis (negativo = más brillante). El polvo multiplica el E(B−V) de la tesis.',
            'The LFs shift in magnitudes relative to those of the thesis (negative = brighter). The dust multiplies the E(B−V) of the thesis.')}</p>
          <p class="fila"><button class="primario" id="simular">${Lg('Simular con mi modelo', 'Simulate with my model')}</button><span class="dato" id="prog"></span></p>
          <p class="fila"><button id="tasa" disabled>${Lg('Calcular la tasa con este modelo', 'Compute the rate with this model')}</button></p>
        </div>
        <div class="panel"><h3>${Lg('La puerta de realismo', 'The realism gate')}</h3><div id="puerta" class="tenue">${Lg('Primero simula.', 'Simulate first.')}</div></div>
      </div>
      <canvas class="vista" id="balanzas"></canvas>
      <p class="tenue pie">${Lg(`Cada balanza pesa una medida de las supernovas encontradas: lo real (ámbar) contra tu modelo (cian). Verde: la diferencia cabe en el umbral.
        Mueve tu modelo y vuelve a simular hasta que todas queden verdes.`, `Each balance weighs one measure of the supernovae found: the real ones (amber) against your model (cyan). Green: the difference fits within the threshold.
        Move your model and simulate again until all of them are green.`)}</p>
      <div class="grilla3" id="hists"></div>
      <div id="fin"></div>`;
    // la temporada real: el universo escondido, observado una vez
    const reales = [];
    const generarReales = () => {
      reales.length = 0;
      const uni = P.crearUniverso({ campos: S1.campos, tasas: verdad.tasas, rand, polvo: verdad.polvo });
      for (const sn of uni.sne) {
        sn.M += sn.clase === 'Ia' ? verdad.dlf.Ia : verdad.dlf.CC;
        const o = P.observar(sn, S1.campos[sn.campo], { rand, corte: 0 });
        if (o.seleccionada) reales.push({ clase: sn.clase, z: sn.z, ...resumen(o, sn.z) });
      }
      if (experta) { // una población débil que nunca se ve: no cambia lo detectado, sí la tasa verdadera de CC
        verdad.invisibles = 0.3 * (verdad.tasas.II + verdad.tasas.Ibc + verdad.tasas.IIn);
      }
    };
    generarReales();
    const mod = () => ({ Ia: +$('#dIa', c).value, CC: +$('#dCC', c).value, polvo: +$('#pol', c).value });
    const salidas = () => { const x = mod(); $('#oIa', c).textContent = `${x.Ia >= 0 ? '+' : ''}${x.Ia.toFixed(2)}`; $('#oCC', c).textContent = `${x.CC >= 0 ? '+' : ''}${x.CC.toFixed(2)}`; $('#oP', c).textContent = `× ${x.polvo.toFixed(2)}`; };
    ['dIa', 'dCC', 'pol'].forEach(id => $('#' + id, c).oninput = salidas); salidas();
    let simuladas = null, expo = null, pasa = false;
    const balanzas = Escenas.Balanzas($('#balanzas', c));
    u.animar(dt => { balanzas.dibujar(dt); return true; });
    $('#simular', c).onclick = () => {
      const x = mod(), sims = [], A = { Ia: 0, CC: 0 }, n = 900;
      $('#simular', c).disabled = true;
      const trabajos = [];
      S1.campos.forEach((cp, ci) => CLASES.forEach(k => trabajos.push([cp, ci, k])));
      const facs = {};
      enPedazos(trabajos.length * n, 300, i => {
        const [cp, ci, k] = trabajos[Math.floor(i / n)], [t0, t1] = P.ventana(cp);
        const sn = P.nuevaSN(k, ci, cp, rand, { dlf: k === 'Ia' ? x.Ia : x.CC, polvo: x.polvo });
        const o = P.observar(sn, cp, { rand, corte: 0 });
        const fac = F.deg2ASr(cp.area_deg2) * (t1 - t0) / 365.25 * P.integralN(P.ZMAX[k]) / n;
        if (o.seleccionada) {
          sims.push({ clase: k, w: LI[k] * fac, ...resumen(o, sn.z) });
          if (sn.z >= 0.15 && sn.z < 0.55) A[k === 'Ia' ? 'Ia' : 'CC'] += fac * (k === 'Ia' ? 1 : LI[k] / LI_CC);
        }
      }, f => { $('#prog', c).textContent = Lg(`simulando ${(100 * f).toFixed(0)} %`, `simulating ${(100 * f).toFixed(0)} %`); }, () => {
        simuladas = sims; expo = A; $('#prog', c).textContent = ''; $('#simular', c).disabled = false; $('#tasa', c).disabled = false;
        puerta();
      });
    };
    function puerta() {
      // cada medida: mediana real contra mediana simulada (pesada por la tasa de su clase), con los umbrales de la tesis
      const medW = (xs, f) => { const s = xs.map(d => [f(d), d.w]).filter(v => Number.isFinite(v[0])).sort((a, b) => a[0] - b[0]); const tot = s.reduce((a, v) => a + v[1], 0); let acc = 0; for (const v of s) { acc += v[1]; if (acc >= tot / 2) return v[0]; } return NaN; };
      const grupo = (g, d) => (g === 'Ia' ? d.clase === 'Ia' : d.clase !== 'Ia');
      const filas = ['Ia', 'CC'].flatMap(g => MEDIDAS.map(([k, nom, f, un]) => {
        const r = mediana(reales.filter(d => grupo(g, d)).map(f)), s = medW(simuladas.filter(d => grupo(g, d)), f);
        const ok = k === 'pico' || k === 'Mabs' ? Math.abs(r - s) <= 0.5 : (Math.max(r, s) / Math.max(1e-9, Math.min(r, s))) <= 2;
        return { k, nom: `${g}: ${nom}`, r, s, un, ok };
      }));
      pasa = filas.every(x => x.ok);
      const CORTO = { pico: Lg('pico (mag)', 'peak (mag)'), Mabs: Lg('M del pico', 'peak M'), ndet: Lg('detecciones', 'detections'), dur: Lg('duración (d)', 'duration (d)') };
      balanzas.poner(filas.map(x => ({ nom: `${x.nom.split(':')[0]}: ${CORTO[x.k]}`, r: x.r, s: x.s, ok: x.ok, dif: x.k === 'pico' || x.k === 'Mabs' ? (x.s - x.r) / 0.5 : Math.log(Math.max(1e-9, x.s) / Math.max(1e-9, x.r)) / Math.log(2) })));
      $('#puerta', c).innerHTML = `<table class="tabla"><tr><th></th><th>real</th><th>${Lg('tu modelo', 'your model')}</th><th></th></tr>
        ${filas.map(x => `<tr><td>${x.nom} (${Lg('mediana', 'median')})</td><td>${f2(x.r, 1)} ${x.un}</td><td>${f2(x.s, 1)} ${x.un}</td><td>${x.ok ? '✅' : '❌'}</td></tr>`).join('')}</table>
        <p class="${pasa ? '' : 'aviso'}">${pasa ? Lg('Tu modelo pasa la puerta de realismo.', 'Your model passes the realism gate.') : Lg('Tu modelo no se parece a lo real: muévelo.', 'Your model does not look like the real data. Move it.')}
          ${Lg('Umbrales de la tesis: 0.5 mag en el pico, factor 2 en lo demás.', 'Thesis thresholds: 0.5 mag on the peak, a factor of 2 on the rest.')}</p>`;
      // histogramas real contra modelo
      $('#hists', c).innerHTML = MEDIDAS.map(([k, nom]) => `<div><h3>${nom}</h3><canvas class="grafico" id="h-${k}"></canvas></div>`).join('');
      for (const [k, , f] of MEDIDAS) {
        const rs = reales.map(f).filter(Number.isFinite), ss = simuladas.map(d => [f(d), d.w]).filter(v => Number.isFinite(v[0]));
        const lo = Math.min(...rs, ...ss.map(v => v[0])), hi = Math.max(...rs, ...ss.map(v => v[0])), nb = 14, ancho = (hi - lo) / nb || 1;
        const hr = Array(nb).fill(0), hs = Array(nb).fill(0);
        rs.forEach(v => hr[Math.min(nb - 1, Math.floor((v - lo) / ancho))]++);
        const tw = ss.reduce((a, v) => a + v[1], 0) || 1;
        ss.forEach(v => { hs[Math.min(nb - 1, Math.floor((v[0] - lo) / ancho))] += v[1] / tw * rs.length; });
        const ctx = Plot.preparar($(`#h-${k}`, c)), bordes = [...Array(nb + 1)].map((_, i) => lo + i * ancho);
        const T0 = Plot.ejes(ctx, { x0: lo, x1: hi, y0: 0, y1: Math.max(1, ...hr, ...hs) * 1.15, xlabel: '', ylabel: 'SNe' });
        Plot.barras(ctx, T0, bordes, hr, 'rgba(255,184,77,0.75)');
        Plot.linea(ctx, T0, bordes.slice(0, -1).map((b, i) => b + ancho / 2), hs, '#5ad1ff', 2.5);
      }
      $('#hists', c).insertAdjacentHTML('beforeend', `<div class="leyenda" style="grid-column:1/-1"><span><i style="background:#ffb84d"></i>${Lg('reales', 'real')}</span><span><i style="background:#5ad1ff"></i>${Lg('tu modelo', 'your model')}</span></div>`);
    }
    $('#tasa', c).onclick = () => {
      const nIa = reales.filter(d => d.clase === 'Ia' && d.z >= 0.15 && d.z < 0.55).length, nCC = reales.filter(d => d.clase !== 'Ia' && d.z >= 0.15 && d.z < 0.55).length;
      const rIa = 1e4 * nIa / expo.Ia, rCC = 1e4 * nCC / expo.CC, gIa = F.gehrels(nIa), gCC = F.gehrels(nCC);
      const vIa = verdad.tasas.Ia, vCC = verdad.tasas.II + verdad.tasas.Ibc + verdad.tasas.IIn + (verdad.invisibles || 0);
      // la verdad dentro de ~2σ: la barra de Gehrels a 1σ, alargada al doble hacia cada lado
      const dentro = (A, g, n, v) => { const r = 1e4 * n / A, lo = 1e4 * g.lo / A, hi = 1e4 * g.hi / A; return v >= r - 2 * (r - lo) && v <= r + 2 * (hi - r); };
      const okIa = dentro(expo.Ia, gIa, nIa, vIa), okCC = dentro(expo.CC, gCC, nCC, vCC);
      $('#fin', c).innerHTML = `<div class="panel">
        <h3>${Lg('La tasa entre z 0.15 y 0.55 con tu modelo', 'The rate between z 0.15 and 0.55 with your model')}</h3>
        <table class="tabla"><tr><th></th><th>N</th><th>${Lg('tu tasa', 'your rate')}</th><th>${Lg('verdadera', 'true')}</th><th></th></tr>
          <tr><td style="color:${CL.Ia}">Ia</td><td>${nIa}</td><td>${f2(rIa)}</td><td>${f2(vIa)}</td><td>${okIa ? '✅' : '❌'}</td></tr>
          <tr><td style="color:${CL.II}">CC</td><td>${nCC}</td><td>${f2(rCC)}</td><td>${f2(vCC)}</td><td>${okCC ? '✅' : '❌'}</td></tr></table>
        <p class="tenue">${Lg('En', 'In')} 10⁻⁴ yr⁻¹ Mpc⁻³ ${marca}. ${pasa ? Lg('Tu modelo pasó la puerta de realismo.', 'Your model passed the realism gate.') : Lg('Tu modelo no pasó la puerta de realismo.', 'Your model did not pass the realism gate.')}</p>
        <p><button class="primario" id="volver">${Lg('Volver al observatorio', 'Back to the observatory')}</button> ${experta ? '' : `<button id="experta">${Lg('Experta: la población invisible', 'Expert: the invisible population')}</button>`}</p></div>`;
      const gana = pasa && okIa;
      u.desbloquear(m.ensena); u.marcar(m.id, gana); u.sonar(gana ? 'fanfarria' : 'campana');
      $('#volver', c).onclick = () => fin({ gana });
      if ($('#experta', c)) $('#experta', c).onclick = () => {
        experta = true; generarReales(); simuladas = null; $('#tasa', c).disabled = true; $('#puerta', c).innerHTML = Lg('Simula otra vez.', 'Simulate again.'); $('#hists', c).innerHTML = ''; $('#fin', c).innerHTML = '';
        u.hablar([['directora', Lg('Ahora el universo tiene algo más: una población de supernovas tan débiles que nunca se detectan. Ajusta tu modelo otra vez y mira la puerta y la tasa de CC.', 'Now the universe has something more: a population of supernovae so faint that they are never detected. Tune your model again and watch the gate and the CC rate.')]]);
      };
      u.hablar(experta ? [
        ['directora', Lg('Tu modelo pasa la puerta igual que antes, pero la CC verdadera era más alta: había un 30 % de CC que nunca se ve.', 'Your model passes the gate just as before, but the true CC rate was higher. There was an extra 30 % of CC that is never seen.')],
        ['directora', Lg('Lo que los datos no ven no lo puede corregir ninguna puerta. Es un supuesto, y los supuestos se declaran como error sistemático.', 'No gate can correct what the data do not see. It is an assumption, and assumptions are declared as a systematic error.')],
      ] : pasa ? [
        ['directora', Lg('Tu modelo se parece a lo real en lo que se puede ver, y por eso tu tiempo de control está bien calibrado.', 'Your model looks like the real data in what can be seen, so your control time is well calibrated.')],
        ['directora', Lg('La tesis hace lo mismo: elige su LF y su polvo comparando lo simulado con lo detectado en ZTF, antes de mirar la tasa.', 'The thesis does the same. It chooses its LF and its dust by comparing the simulated with what ZTF detected, before looking at the rate.')],
      ] : [
        ['directora', Lg('Si tu modelo no se parece a lo detectado, tu tiempo de control está mal calibrado y la tasa se sesga. Mira cuál medida falló y muévelo.', 'If your model does not look like what was detected, your control time is badly calibrated and the rate is biased. See which measure failed and move it.')],
      ]);
    };
  }

  window.Juego = { tasasJuego, LI, LI_CC, enPedazos, ZMAX_TODAS }; // compartido con los capítulos 3 a 7

  // ================= las misiones del capítulo 2 =================
  M.registrar('poblacion', poblacion);
  M.registrar('kcorr', kcorr);
  M.registrar('modelo', modelo);
  M.agregar([
    { id: '2.1', cap: 2, titulo: Lg('No todas son iguales', 'Not all are alike'), tipo: 'poblacion', donde: 'consolas', ensena: ['lf', 'subtipos'],
      contrato: [
        ['directora', Lg('Hasta ahora todas tus supernovas eran Ia iguales. El universo real tiene Ia, II, Ibc e IIn, cada una con su brillo y su curva.', 'Until now all your supernovae were identical Ia. The real universe has Ia, II, Ibc and IIn, each with its own brightness and light curve.')],
        ['directora', Lg('Desde ahora trabajas con la biblioteca de la tesis: las 82 series espectrales congeladas, observadas como las vio SUDARE I.', 'From now on you work with the thesis library: the 82 frozen spectral time series, observed as SUDARE I saw them.')],
        ['directora', Lg('Corre una temporada en las consolas y compara lo que explotó con lo que encuentras.', 'Run a season at the consoles and compare what exploded with what you find.')],
      ],
      abre: [['operador', Lg('Estos son los tres campos de SUDARE I, con sus noches y su profundidad publicadas. Dale a correr.', 'These are the three SUDARE I fields, with their published nights and depth. Hit run.')]] },
    { id: '2.2', cap: 2, titulo: Lg('El filtro ve otro color', 'The filter sees another colour'), tipo: 'kcorr', donde: 'consolas', ensena: ['kcorr'],
      contrato: [
        ['directora', Lg('Una supernova lejana no solo se ve más débil. El telescopio mide con el mismo filtro, pero su luz llega corrida al rojo.', 'A distant supernova does not just look fainter. The telescope measures with the same filter, but its light arrives redshifted.')],
        ['directora', Lg('Ve a las consolas, toma un espectro de la biblioteca y aléjalo hasta z 0.5 por lo menos.', 'Go to the consoles, take a spectrum from the library and move it out to z 0.5 at least.')],
      ],
      abre: [['operador', Lg('Mueve la barra de z, o deja que se aleje sola. Mira qué parte del espectro cae en el filtro r.', 'Move the z slider, or let it recede on its own. Watch which part of the spectrum falls in the r filter.')]] },
    { id: '2.3', cap: 2, titulo: Lg('El taller del modelo', 'The model workshop'), tipo: 'modelo', donde: 'consolas', ensena: ['polvo'],
      contrato: [
        ['directora', Lg('El tiempo de control depende de la población que simulas: su brillo, su polvo y su mezcla.', 'The control time depends on the population you simulate: its brightness, its dust and its mix.')],
        ['directora', Lg('En las consolas está el taller del modelo. Ajusta el tuyo hasta que lo simulado se parezca a lo detectado, y después calcula la tasa.', 'The model workshop is at the consoles. Tune yours until the simulated looks like the detected, and then compute the rate.')],
      ],
      abre: [['operador', Lg('Mueve las perillas y simula. La puerta de realismo te dice si tu modelo se parece a lo real.', 'Turn the knobs and simulate. The realism gate tells you whether your model looks like the real data.')]] },
  ]);
})();
