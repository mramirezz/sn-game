// Capítulo 6: de dónde vienen. La IMF reparte una generación de estrellas por masa, las masivas explotan como CC en pocas decenas de
// millones de años y una fracción de las enanas blancas gotea como Ia con la DTD τ^β. Muchas generaciones siguiendo ψ(z) dan la tasa de
// Ia como convolución, y K y β se ajustan a las tasas medidas.
(() => {
  const M = Misiones, u = M.util, U = Universo, V2 = Vista2, CO = Cosmos;
  const $ = (s, r = document) => r.querySelector(s);
  const T = window.TESIS, N = T.numeros, f2 = u.f2, marca = u.marca, CL = V2.CL;
  const BETA_TESIS = N['sfh.paso3.todas+nuestras.MF17.beta'], NM_TESIS = N['sfh.paso3.todas+nuestras.MF17.N_M'] * 1e-3;
  const T0 = CO.edad(0);
  // vida en la secuencia principal (Gyr), ajuste de libro de texto en log m: aproximación del juego
  const vida = m => { const L = Math.log10(m); return 10 ** (10 - 3.6 * L + 1.0 * L * L) / 1e9; };
  const SFH = { MF17: { psi: CO.psiMF17, nombre: 'MF17 (Kroupa)' }, MD14: { psi: z => T.sfh.imf.psi_kroupa_sobre_salpeter * CO.psiMD14(z), nombre: Lg('MD14 llevada a Kroupa', 'MD14 converted to Kroupa') } };
  const zTicks = [0, 0.5, 1, 2, 3, 5];

  // ---------- 6.1 el vivero: una generación de estrellas ----------
  function vivero(m, fin) {
    const c = u.cont(), rand = U.rng(Date.now() % 1e9);
    let imfN = 'kroupa', beta = BETA_TESIS, logt = 6, jugando = false, llegoFin = false, cambioImf = false;
    c.innerHTML = `
      <div class="panel contrato"><h3>${Lg('El vivero', 'The nursery')}</h3>
        <p>${Lg(`Una nube forma de golpe una generación de estrellas. La IMF dice cuántas nacen de cada masa: muchísimas chicas y muy pocas masivas.
          Las de 8 a 40 M☉ viven poco y explotan como CC. Las de 3 a 8 M☉ terminan como enanas blancas, y una fracción de unos pocos por ciento
          de ellas termina como Ia, goteando durante miles de millones de años.`, `A cloud forms a whole generation of stars at once. The IMF says how many are born at each mass: a huge number of small ones and very few massive ones.
          Stars of 8 to 40 M☉ live briefly and explode as CC. Those of 3 to 8 M☉ end as white dwarfs, and a fraction of a few per cent
          of them end as Ia, dripping out over billions of years.`)}</p>
        <div class="ecuacion" id="ecK"></div><p class="etiqueta">${Lg('K_CC: sec:results:sfh (sin etiqueta propia)', 'K_CC: sec:results:sfh (no label of its own)')}</p></div>
      <p class="fila"><button id="kroupa" class="primario">${Lg('IMF de Kroupa', 'Kroupa IMF')}</button><button id="salpeter">${Lg('IMF de Salpeter', 'Salpeter IMF')}</button>
        <button class="primario" id="play">${Lg('▶ Que pase el tiempo', '▶ Let time pass')}</button><span class="dato">${Lg('edad de la generación:', 'age of the generation:')} <b id="edad">1 Myr</b></span></p>
      <label class="control"><span>${Lg('β de la DTD', 'DTD β')}</span><input type="range" id="beta" min="-2" max="-0.3" step="0.01" value="${beta}"><output id="ob"></output></label>
      <canvas class="vista alto" id="gen"></canvas>
      <canvas class="grafico tira" id="tl"></canvas>
      <div class="leyenda"><span><i style="background:#5ad1ff"></i>${Lg('CC acumuladas', 'cumulative CC')}</span><span><i style="background:#ffd166"></i>${Lg('Ia acumuladas', 'cumulative Ia')}</span><span><i style="background:#e8ecf8"></i>${Lg('enanas blancas', 'white dwarfs')}</span></div>
      <div id="cuentas"></div>
      <div id="fin"></div>`;
    u.tex($('#ecK', c), String.raw`K_\mathrm{CC} \,=\, \frac{\int_{8}^{40} \phi(m)\,\mathrm{d}m}{\int_{0.1}^{100} m\,\phi(m)\,\mathrm{d}m}, \qquad f(\tau) \,\propto\, \tau^{\beta} \;\;(\tau > 40\,\mathrm{Myr})`);
    // la muestra de estrellas para dibujar: masas sorteadas de la IMF en número (pdf por log m ∝ m φ(m)). Se ordenan por masa:
    // x es su masa (escala log) e y es al azar, así la densidad de puntos a lo ancho es la IMF misma.
    function estrellas(imf) {
      const lm = Array.from({ length: 301 }, (_, i) => -1 + 3 * i / 300), pdf = lm.map(l => 10 ** l * imf(10 ** l)), cdf = [0];
      for (let i = 1; i < lm.length; i++) cdf.push(cdf[i - 1] + (pdf[i] + pdf[i - 1]) / 2);
      const tot = cdf[cdf.length - 1];
      return Array.from({ length: 1600 }, () => {
        const q = rand() * tot; let i = cdf.findIndex(v => v >= q); i = Math.max(1, i);
        const mm = 10 ** (lm[i - 1] + (lm[i] - lm[i - 1]) * (q - cdf[i - 1]) / Math.max(1e-12, cdf[i] - cdf[i - 1]));
        return { m: mm, y: rand(), vida: vida(mm) };
      });
    }
    let pobl = estrellas(CO.IMF[imfN]);
    const destellos = [], nebulosas = [], LT1 = Math.log10(T0 * 1e9);
    let tPrev = 10 ** logt / 1e9;
    // la masa que se apaga a la edad t (Gyr): la inversa de vida(m), la rama de m < 63 M☉ donde el ajuste baja
    const mTo = t => { const d = 12.96 - 4 * (10 - Math.log10(t * 1e9)); return d < 0 ? Infinity : 10 ** ((3.6 - Math.sqrt(d)) / 2); };
    const fm = m => (m < 10 ? m.toFixed(1) : m.toFixed(0));
    function cuentas() {
      const imf = CO.IMF[imfN], kcc = CO.kcc(imf), n38 = CO.kcc(imf, 3, 8), nombreT = imfN === 'kroupa' ? 'Kroupa' : 'Salpeter';
      return { kcc, n38, nIa: NM_TESIS, frac: NM_TESIS / n38, tesis: T.sfh.imf[nombreT] };
    }
    const fracCC = t => { const imf = CO.IMF[imfN], tot = CO.kcc(imf); // de las 8 a 40, cuántas ya murieron a la edad t
      const mMin = Math.max(8, [...Array(200)].map((_, i) => 8 * 5 ** (i / 199)).find(mm => vida(mm) <= t) || 41);
      return mMin > 40 ? 0 : CO.kcc(imf, mMin, 40) / tot; };
    const fracIa = t => { if (t <= CO.TAU_MIN) return 0; const b1 = beta + 1, F = x => (Math.abs(b1) < 1e-9 ? Math.log(x) : x ** b1 / b1); return (F(Math.min(t, T0)) - F(CO.TAU_MIN)) / (F(T0) - F(CO.TAU_MIN)); };
    function dibujar(dt) {
      const t = 10 ** logt / 1e9, edadTxt = t < 0.9995 ? `${(t * 1e3).toFixed(0)} Myr` : `${t.toFixed(2)} Gyr`;
      $('#edad', c).textContent = edadTxt;
      // ---- la generación ordenada por masa ----
      const { g, w, h } = Vista.h.lienzo($('#gen', c)), chico = w < 480, H_ = Vista.h;
      const yA = h - 66, y0 = chico ? 60 : 54, y1 = yA - 12, xm = m => 16 + (w - 32) * (Math.log10(m) + 1) / 3, ym = s => y0 + s.y * (y1 - y0);
      const fondo = g.createLinearGradient(0, 0, 0, h); fondo.addColorStop(0, '#080c1e'); fondo.addColorStop(1, '#02030a');
      g.fillStyle = fondo; g.fillRect(0, 0, w, h);
      // franjas del destino de cada masa
      for (const [a, b, rgb] of [[3, 8, '255,209,102'], [8, 40, '90,209,255']]) { g.fillStyle = `rgba(${rgb},0.07)`; g.fillRect(xm(a), y0 - 6, xm(b) - xm(a), y1 - y0 + 12); }
      // a la derecha del frente ya murieron todas
      const mf = mTo(t), xf = mf <= 100 ? xm(Math.max(0.1, mf)) : null;
      if (xf !== null) { g.fillStyle = 'rgba(0,0,0,0.38)'; g.fillRect(xf, y0 - 6, w - 16 - xf, y1 - y0 + 12); }
      // las de 3 a 8 M☉ que mueren en este paso sueltan su envoltura y quedan como enana blanca
      if (t > tPrev) for (const s of pobl) if (s.vida > tPrev && s.vida <= t && s.m >= 3 && s.m < 8) nebulosas.push({ s, v: 0 });
      tPrev = t;
      g.globalCompositeOperation = 'lighter';
      for (const s of pobl) if (t < s.vida && s.m > 3) H_.luz(g, xm(s.m), ym(s), 5 + 3 * Math.min(6, Math.sqrt(s.m)), s.m > 8 ? '110,180,255' : '210,225,255', 0.32);
      g.globalCompositeOperation = 'source-over';
      for (const s of pobl) {
        const x = xm(s.m), y = ym(s);
        if (t < s.vida) {
          g.fillStyle = s.m > 8 ? '#9fd8ff' : s.m > 3 ? '#e6f0ff' : s.m > 1 ? '#fff2c4' : '#ffb07a'; g.globalAlpha = s.m > 1 ? 1 : 0.6;
          g.beginPath(); g.arc(x, y, Math.min(6, 0.8 + 1.4 * s.m ** 0.42), 0, 7); g.fill(); g.globalAlpha = 1;
        } else if (s.m < 8) { // enana blanca; con anillo si viene de 3 a 8 M☉: puede terminar como Ia
          g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, y, 1.5, 0, 7); g.fill();
          if (s.m >= 3) { g.strokeStyle = 'rgba(255,209,102,0.55)'; g.lineWidth = 1; g.beginPath(); g.arc(x, y, 3.3, 0, 7); g.stroke(); }
        } else { g.fillStyle = '#4a5578'; g.beginPath(); g.arc(x, y, 1.3, 0, 7); g.fill(); }
      }
      for (const n of nebulosas) { n.v += dt; const a = Math.max(0, 1 - n.v / 1.2); g.strokeStyle = `rgba(200,230,255,${0.55 * a})`; g.lineWidth = 1; g.beginPath(); g.arc(xm(n.s.m), ym(n.s), 3 + 12 * n.v, 0, 7); g.stroke(); }
      while (nebulosas.length && nebulosas[0].v > 1.2) nebulosas.shift();
      // destellos: CC (azul) en la masa que muere ahora, Ia (amarillo) en las enanas blancas
      g.globalCompositeOperation = 'lighter';
      for (const d of destellos) {
        d.v += dt; const a = Math.min(1, d.v / 0.9), b = 1 - a, rgb = d.tipo === 'CC' ? '90,200,255' : '255,209,102', x = xm(d.m), y = ym(d);
        H_.luz(g, x, y, (12 + 38 * Math.sqrt(a)) * d.k, rgb, 0.9 * b); H_.luz(g, x, y, (3 + 6 * b) * d.k, '255,255,255', b);
        g.strokeStyle = `rgba(${rgb},${0.8 * b})`; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, (5 + 26 * a) * d.k, 0, 7); g.stroke();
      }
      g.globalCompositeOperation = 'source-over';
      while (destellos.length && destellos[0].v > 0.9) destellos.shift();
      // el frente: la masa que se apaga ahora
      if (xf !== null) {
        g.strokeStyle = 'rgba(232,236,248,0.85)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(xf, y0 - 8); g.lineTo(xf, yA); g.stroke();
        const txt = Lg(`se apagan hoy: las de ${fm(mf)} M☉`, `dying now: stars of ${fm(mf)} M☉`), wt = 7 * txt.length;
        V2.texto(g, txt, Math.max(16 + wt / 2, Math.min(w - 16 - wt / 2, xf)), y0 - 12, { tam: 11, alin: 'center', color: '#e8ecf8' });
      }
      // eje de masas y el destino de cada tramo
      g.strokeStyle = 'rgba(160,175,210,0.55)'; g.lineWidth = 1; g.beginPath(); g.moveTo(xm(0.1), yA); g.lineTo(xm(100), yA); g.stroke();
      for (const m of [0.1, 0.3, 1, 3, 8, 40, 100]) {
        g.beginPath(); g.moveTo(xm(m), yA); g.lineTo(xm(m), yA + 4); g.stroke();
        if (chico && m === 100) continue; // en el teléfono el 100 choca con el 40: la unidad va al comienzo
        V2.texto(g, m === 100 ? '100 M☉' : chico && m === 0.1 ? '0.1 M☉' : String(m), xm(m), yA + 15, { tam: 10, alin: m === 100 ? 'right' : m === 0.1 ? 'left' : 'center' });
      }
      const tramo = (a, b, col, y) => { g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); g.moveTo(xm(a) + 2, y); g.lineTo(xm(b) - 2, y); g.stroke(); };
      tramo(3, 8, '#ffd166', yA + 23); tramo(8, 40, '#5ad1ff', yA + 23); tramo(40, 100, 'rgba(160,175,210,0.5)', yA + 23);
      V2.texto(g, Lg('8–40 M☉ → CC', '8–40 M☉ → CC'), xm(18), yA + 37, { tam: 11, alin: 'center', color: '#5ad1ff' });
      V2.texto(g, chico ? Lg('3–8 M☉ → enana blanca → Ia', '3–8 M☉ → white dwarf → Ia') : Lg('3–8 M☉ → enana blanca → unas pocas % son Ia', '3–8 M☉ → white dwarf → a few per cent end as Ia'),
        xm(5), yA + 53, { tam: 11, alin: 'center', color: '#ffd166' });
      if (!chico) V2.texto(g, Lg('> 40 M☉: fuera de K_CC', '> 40 M☉: outside K_CC'), xm(100), yA + 53, { tam: 10, alin: 'right' });
      // arriba: qué se ve, la edad y cuánto ya explotó
      V2.texto(g, chico ? Lg(`IMF de ${imfN === 'kroupa' ? 'Kroupa' : 'Salpeter'} · ${pobl.length} estrellas`, `${imfN === 'kroupa' ? 'Kroupa' : 'Salpeter'} IMF · ${pobl.length} stars`)
        : Lg(`IMF de ${imfN === 'kroupa' ? 'Kroupa' : 'Salpeter'} · ${pobl.length} estrellas de una generación, ordenadas por masa`, `${imfN === 'kroupa' ? 'Kroupa' : 'Salpeter'} IMF · ${pobl.length} stars of one generation, sorted by mass`), 16, 18, { tam: 12, color: '#e8ecf8' });
      V2.texto(g, `${Lg('edad', 'age')} ${edadTxt}`, w - 16, 19, { tam: 15, alin: 'right', color: '#ffb84d' });
      const pCC = (100 * fracCC(t)).toFixed(0), pIa = (100 * fracIa(t)).toFixed(0);
      V2.texto(g, Lg(`CC explotadas: ${pCC} %`, `CC exploded: ${pCC} %`), 16, 37, { tam: 11, color: '#5ad1ff' });
      V2.texto(g, Lg(`Ia explotadas: ${pIa} %`, `Ia exploded: ${pIa} %`), chico ? w - 16 : 190, 37, { tam: 11, color: '#ffd166', alin: chico ? 'right' : 'left' });

      // ---- la línea de tiempo: lo que ya explotó de la generación; se puede arrastrar ----
      const tl = H_.lienzo($('#tl', c)), G = tl.g, W = tl.w, H = tl.h, mt = { i: 16, d: 16, s: 24, a: 22 };
      V2.fondo(G, W, H);
      const px = lt => mt.i + (W - mt.i - mt.d) * (lt - 6) / (LT1 - 6), py = f => H - mt.a - (H - mt.s - mt.a) * f, xP = px(logt);
      G.strokeStyle = 'rgba(160,175,210,0.18)'; G.setLineDash([2, 4]); G.beginPath(); G.moveTo(px(6), py(1)); G.lineTo(px(LT1), py(1)); G.stroke(); G.setLineDash([]);
      V2.texto(G, '100 %', px(6), py(1) - 4, { tam: 9 });
      for (const [fn, rgb] of [[fracCC, '90,209,255'], [fracIa, '255,209,102']]) {
        const linea = () => { G.beginPath(); for (let lt = 6; lt <= LT1 + 1e-9; lt += 0.02) { const x = px(lt), y = py(fn(10 ** lt / 1e9)); lt === 6 ? G.moveTo(x, y) : G.lineTo(x, y); } };
        const area = () => { linea(); G.lineTo(px(LT1), py(0)); G.lineTo(px(6), py(0)); G.closePath(); };
        area(); G.fillStyle = `rgba(${rgb},0.05)`; G.fill(); linea(); G.strokeStyle = `rgba(${rgb},0.3)`; G.lineWidth = 1.5; G.stroke(); // lo que falta
        G.save(); G.beginPath(); G.rect(0, 0, xP, H); G.clip(); // lo ya vivido
        area(); G.fillStyle = `rgba(${rgb},0.25)`; G.fill(); linea(); G.strokeStyle = `rgb(${rgb})`; G.lineWidth = 2.5; G.stroke(); G.restore();
      }
      G.strokeStyle = 'rgba(160,175,210,0.5)'; G.lineWidth = 1; G.beginPath(); G.moveTo(px(6), py(0)); G.lineTo(px(LT1), py(0)); G.stroke();
      for (const [lt, n] of [[6, '1 Myr'], [7, '10 Myr'], [8, '100 Myr'], [9, '1 Gyr'], [10, '10 Gyr']]) V2.texto(G, n, px(lt), H - 6, { tam: 10, alin: lt === 6 ? 'left' : 'center' });
      G.strokeStyle = 'rgba(255,209,102,0.5)'; G.setLineDash([3, 4]); G.beginPath(); G.moveTo(px(7.602), py(1)); G.lineTo(px(7.602), py(0)); G.stroke(); G.setLineDash([]);
      V2.texto(G, Lg('40 Myr: empiezan las Ia', '40 Myr: the Ia begin'), px(7.602) + 4, mt.s - 9, { tam: 10, color: '#ffd166' });
      if (W >= 480) V2.texto(G, Lg('arrastra para mover el tiempo ↔', 'drag to move time ↔'), W - mt.d, mt.s - 9, { tam: 10, alin: 'right', color: 'rgba(210,220,240,0.6)' });
      G.globalCompositeOperation = 'lighter'; H_.luz(G, xP, py(0.5), 30, '255,184,77', 0.22); G.globalCompositeOperation = 'source-over';
      G.strokeStyle = '#ffb84d'; G.lineWidth = 2; G.beginPath(); G.moveTo(xP, py(1) - 4); G.lineTo(xP, py(0)); G.stroke();
      G.fillStyle = '#ffb84d'; G.beginPath(); G.arc(xP, py(0), 5, 0, 7); G.fill();
    }
    function textoCuentas() {
      const k = cuentas();
      $('#cuentas', c).innerHTML = `<div class="panel"><table class="tabla"><tr><th>${Lg('por cada 1000 M☉ formadas', 'per 1000 M☉ formed')}</th><th>${Lg('en el juego', 'in the game')}</th><th>${Lg('tesis', 'thesis')}</th></tr>
        <tr><td>${Lg('CC (estrellas de 8 a 40 M☉)', 'CC (stars of 8 to 40 M☉)')}</td><td>${f2(1e3 * k.kcc, 1)}</td><td>${f2(1e3 * k.tesis.K_CC_8_40, 1)}</td></tr>
        <tr><td>${Lg('estrellas de 3 a 8 M☉ (futuras enanas blancas)', 'stars of 3 to 8 M☉ (future white dwarfs)')}</td><td>${f2(1e3 * k.n38, 1)}</td><td>${f2(1e3 * k.tesis.N_3_8, 1)}</td></tr>
        <tr><td>${Lg('Ia (N/M★ medido, MF17 y Kroupa)', 'Ia (measured N/M★, MF17 and Kroupa)')}</td><td colspan="2">${Lg(`${f2(1e3 * k.nIa, 2)}: el ${f2(100 * k.frac, 1)} % de las de 3 a 8 M☉ termina como Ia`, `${f2(1e3 * k.nIa, 2)}: ${f2(100 * k.frac, 1)} % of the 3 to 8 M☉ stars end as Ia`)}</td></tr></table>
        <p class="tenue">${Lg(`K_CC y las de 3 a 8 M☉ salen de integrar la IMF, igual que en la tesis. N/M★ es el ajuste de la tesis a todas las tasas de Ia
          (${N['sfh.paso3.todas+nuestras.MF17.n']} medidas de ${N['sfh.paso3.todas+nuestras.MF17.n_obras']} trabajos). Las vidas de las estrellas son una aproximación ${marca}.`, `K_CC and the 3 to 8 M☉ stars come from integrating the IMF, as in the thesis. N/M★ is the thesis fit to all the Ia rates
          (${N['sfh.paso3.todas+nuestras.MF17.n']} measurements from ${N['sfh.paso3.todas+nuestras.MF17.n_obras']} works). The stellar lifetimes are an approximation ${marca}.`)}</p></div>`;
    }
    textoCuentas();
    const elegir = n => { imfN = n; cambioImf = true; pobl = estrellas(CO.IMF[n]); $('#kroupa', c).classList.toggle('primario', n === 'kroupa'); $('#salpeter', c).classList.toggle('primario', n === 'salpeter'); textoCuentas(); };
    $('#kroupa', c).onclick = () => elegir('kroupa'); $('#salpeter', c).onclick = () => elegir('salpeter');
    $('#beta', c).oninput = e => { beta = +e.target.value; $('#ob', c).textContent = beta.toFixed(2); };
    $('#ob', c).textContent = beta.toFixed(2);
    $('#play', c).onclick = () => { if (logt >= Math.log10(T0 * 1e9) - 0.01) logt = 6; jugando = !jugando; $('#play', c).textContent = jugando ? Lg('❚❚ Pausa', '❚❚ Pause') : Lg('▶ Que pase el tiempo', '▶ Let time pass'); };
    const tlc = $('#tl', c);
    const arrastrar = e => {
      const r = tlc.getBoundingClientRect();
      logt = Math.max(6, Math.min(LT1, 6 + (LT1 - 6) * (e.clientX - r.left - 16) / Math.max(1, r.width - 32)));
      if (jugando) { jugando = false; $('#play', c).textContent = Lg('▶ Que pase el tiempo', '▶ Let time pass'); }
      if (logt >= LT1 - 0.01 && !llegoFin) { llegoFin = true; terminar(); }
    };
    tlc.addEventListener('pointerdown', e => { tlc.setPointerCapture(e.pointerId); arrastrar(e); });
    tlc.addEventListener('pointermove', e => { if (e.buttons) arrastrar(e); });
    u.animar((dt, ts) => {
      if (jugando) {
        const t1 = 10 ** logt / 1e9, lt2 = Math.min(Math.log10(T0 * 1e9), logt + dt * 0.33), t2 = 10 ** lt2 / 1e9;
        // eventos por cada 1e5 M☉: las CC y las Ia que caen en este paso, dibujados como destellos
        const nCC = 1e5 * CO.kcc(CO.IMF[imfN]) * (fracCC(t2) - fracCC(t1)), nIa = 1e5 * NM_TESIS * (fracIa(t2) - fracIa(t1));
        for (const [n, tipo] of [[nCC, 'CC'], [nIa, 'Ia']]) {
          let k = Math.floor(n / 25) + (rand() < (n / 25) % 1 ? 1 : 0); // un destello cada 25 eventos
          while (k-- > 0) {
            if (tipo === 'CC') destellos.push({ tipo, m: Math.min(40, Math.max(8, mTo(t2) * (1 + 0.12 * (rand() - 0.5)))), y: rand(), v: 0, k: 1 });
            else { const wd = pobl.filter(s => s.m >= 3 && s.m < 8 && s.vida <= t2), s = wd.length ? wd[Math.floor(rand() * wd.length)] : { m: 3 + 5 * rand(), y: rand() }; destellos.push({ tipo, m: s.m, y: s.y, v: 0, k: 0.8 }); }
          }
        }
        logt = lt2;
        if (logt >= Math.log10(T0 * 1e9) - 0.01) { jugando = false; $('#play', c).textContent = Lg('▶ Otra vez', '▶ Again'); if (!llegoFin) { llegoFin = true; terminar(); } }
      }
      dibujar(dt);
      return true;
    });
    function terminar() {
      $('#fin', c).innerHTML = `<div class="panel"><p>${Lg(`Las CC salen todas en los primeros ~40 Myr: su tasa sigue a la formación estelar del momento, r_CC = K_CC ψ.
        Las Ia gotean durante toda la edad del universo, con f(τ) ∝ τ^β. Con β cerca de −1, hay tantas Ia entre 0.1 y 1 Gyr como entre 1 y 10 Gyr.
        Cambia β y mira cómo la curva amarilla se carga hacia los retardos cortos (β más negativo) o largos.`, `All the CC go off in the first ~40 Myr: their rate follows the star formation of the moment, r_CC = K_CC ψ.
        The Ia drip out over the whole age of the universe, with f(τ) ∝ τ^β. With β near −1, there are as many Ia between 0.1 and 1 Gyr as between 1 and 10 Gyr.
        Change β and watch the yellow curve shift towards short delay times (more negative β) or long ones.`)}</p>
        <p class="tenue">${Lg(`Cada destello es 25 explosiones de una generación de 10⁵ M☉ ${marca}. Los azules salen en la masa que se apaga en ese momento y los amarillos en las enanas blancas que vienen de 3 a 8 M☉.`, `Each flash is 25 explosions from a generation of 10⁵ M☉ ${marca}. The blue ones appear at the mass that is dying at that moment, the yellow ones on the white dwarfs that come from 3 to 8 M☉.`)}</p>
        <p><button class="primario" id="volver">${Lg('Volver al observatorio', 'Back to the observatory')}</button></p></div>`;
      u.desbloquear(m.ensena); u.marcar(m.id, true); u.sonar('fanfarria');
      $('#volver', c).onclick = () => fin({ gana: true });
      u.hablar([['directora', cambioImf ? Lg('Con Salpeter hay menos masivas por masa formada: menos CC por M☉. Por eso la IMF y la SFH van siempre emparejadas.',
          'With Salpeter there are fewer massive stars per mass formed: fewer CC per M☉. That is why the IMF and the SFH always go together.')
        : Lg('Prueba también con la IMF de Salpeter: cambia cuántas CC salen por cada M☉ formada.', 'Try the Salpeter IMF too: it changes how many CC come out per M☉ formed.')]]);
    }
  }

  // ---------- 6.2 la línea del tiempo cósmica ----------
  function linea(m, fin) {
    const c = u.cont();
    let z = 0.25, beta = BETA_TESIS, sfh = 'MF17', vioZ = false, vioB = false;
    c.innerHTML = `
      <div class="panel contrato"><h3>${Lg('Muchas generaciones', 'Many generations')}</h3>
        <p>${Lg(`El universo forma estrellas todo el tiempo, más rápido hace unos 10 mil millones de años (z ≈ 2) que hoy: es la historia de formación estelar ψ.
          La tasa de Ia que mides a un z es la suma de los goteos de todas las generaciones anteriores: una convolución.`, `The universe forms stars all the time, faster about 10 billion years ago (z ≈ 2) than today: this is the star-formation history ψ.
          The Ia rate you measure at a given z is the sum of the drips from all earlier generations: a convolution.`)}</p>
        <div class="ecuacion" id="ecR"></div><p class="etiqueta">eq:intro:rate_Ia</p></div>
      <p class="fila"><button id="MF17" class="primario">${Lg('SFH de Madau y Fragos 2017', 'SFH of Madau and Fragos 2017')}</button><button id="MD14">${Lg('SFH de Madau y Dickinson 2014', 'SFH of Madau and Dickinson 2014')}</button></p>
      <label class="control"><span>${Lg('z que miras', 'z you look at')}</span><input type="range" id="z" min="0.02" max="1.5" step="0.01" value="${z}"><output id="oz"></output></label>
      <label class="control"><span>${Lg('β de la DTD', 'DTD β')}</span><input type="range" id="beta" min="-2" max="-0.3" step="0.01" value="${beta}"><output id="ob"></output></label>
      <canvas class="vista" id="cosmo"></canvas>
      <p class="tenue pie">${Lg(`Verde: la formación estelar de cada época, generación tras generación. Cada gota amarilla es una Ia: sale de la generación
        que la formó y cae en el frasco de "ahora". Salen más gotas de donde el aporte ψ(t′) f(t − t′) es mayor (sombra amarilla), y las brillantes
        vienen de generaciones de menos de 1.7 Gyr. El nivel del frasco es la tasa de Ia a ese z.`, `Green: the star formation of each epoch, generation after generation. Each yellow droplet is an Ia: it leaves the generation
        that formed it and falls into the "now" jar. More droplets leave where the contribution ψ(t′) f(t − t′) is larger (yellow shading), and the bright ones
        come from generations younger than 1.7 Gyr. The jar level is the Ia rate at that z.`)}</p>
      <canvas class="grafico" id="edades" style="height:96px"></canvas>
      <canvas class="grafico" id="rz"></canvas>
      <div class="leyenda"><span><i style="background:#ffd166"></i>${Lg('Ia: modelo y tasas de la tesis', 'Ia: model and thesis rates')}</span><span><i style="background:#f0605d"></i>${Lg('CC: K_CC ψ y tasas de la tesis', 'CC: K_CC ψ and thesis rates')}</span></div>
      <div id="lectura"></div><div id="fin"></div>`;
    u.tex($('#ecR', c), String.raw`r_\text{Ia}(t) = K_\text{Ia} \int_{\tau_i}^{\min(t,\tau_x)} f_\text{Ia}(\tau)\, \mathrm{SFR}(t-\tau)\, \mathrm{d}\tau, \qquad r_\text{CC} = K_\text{CC}\,\psi`);
    const kcc = T.sfh.imf.Kroupa.K_CC_8_40;
    // cada gota es una Ia: sale de una generación (su altura en la curva verde) y cae en el frasco de "ahora". Salen más gotas de
    // donde el aporte ψ(t') f(t − t') es mayor, y caen más por segundo cuando la tasa de ese z es más alta.
    let cache = null, acumG = 0;
    const gotasC = [];
    function pintarCosmo(dt) {
      if (!cache) return;
      const { g, w, h } = Vista.h.lienzo($('#cosmo', c)); V2.fondo(g, w, h);
      const { t, ts, psis, pmax, ap, amax, cum, nivel } = cache;
      const mg = { i: 44, d: 14, s: 26, a: 30 }, px = tt => mg.i + (w - mg.i - mg.d) * tt / T0, py = v => h - mg.a - (h - mg.s - mg.a) * v / pmax;
      g.fillStyle = 'rgba(110,231,160,0.25)'; g.beginPath(); g.moveTo(px(ts[0]), py(0)); ts.forEach((tt, i) => g.lineTo(px(tt), py(psis[i]))); g.lineTo(px(ts[ts.length - 1]), py(0)); g.fill();
      g.strokeStyle = '#6ee7a0'; g.lineWidth = 2; g.beginPath(); ts.forEach((tt, i) => (i ? g.lineTo(px(tt), py(psis[i])) : g.moveTo(px(tt), py(psis[i])))); g.stroke();
      ts.forEach((tt, i) => { if (!ap[i]) return; const joven = t - tt < 1.7; g.fillStyle = joven ? 'rgba(255,209,102,0.55)' : 'rgba(255,209,102,0.25)';
        g.fillRect(px(tt), py(0.9 * pmax * ap[i] / amax), Math.max(1, px(ts[1]) - px(ts[0]) + 0.5), py(0) - py(0.9 * pmax * ap[i] / amax)); });
      // el frasco de "ahora": su nivel es la tasa de Ia a este z (relativa a su máximo)
      const xf = px(t), fw = 22, fh = (h - mg.s - mg.a) * 0.45, yb = h - mg.a;
      g.fillStyle = 'rgba(255,209,102,0.75)'; g.fillRect(xf - fw / 2, yb - fh * nivel, fw, fh * nivel);
      g.strokeStyle = '#e8ecf8'; g.lineWidth = 1.5; g.strokeRect(xf - fw / 2, yb - fh, fw, fh);
      g.strokeStyle = 'rgba(232,236,248,0.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(xf, mg.s); g.lineTo(xf, yb - fh); g.stroke();
      V2.texto(g, Lg(`z = ${z.toFixed(2)}: ahora`, `z = ${z.toFixed(2)}: now`), xf - 6, mg.s + 12, { tam: 11, alin: 'right', color: '#e8ecf8' });
      V2.texto(g, Lg('tasa de Ia', 'Ia rate'), xf - fw / 2 - 4, yb - fh - 4, { tam: 10, alin: 'right', color: '#ffd166' });
      // gotas nuevas
      acumG += dt * 28 * Math.max(0.15, nivel);
      const tot = cum[cum.length - 1] || 0;
      while (acumG >= 1 && tot > 0) { acumG -= 1; const q = Math.random() * tot; let i = cum.findIndex(v => v >= q); if (i < 0) i = cum.length - 1;
        gotasC.push({ x0: px(ts[i]), y0: py(psis[i]), joven: t - ts[i] < 1.7, u: 0, v: 0.45 + 0.3 * Math.random() }); }
      g.globalCompositeOperation = 'lighter';
      for (const d of gotasC) {
        d.u += dt * d.v; const u2 = Math.min(1, d.u), m2 = 1 - u2, cx = (d.x0 + xf) / 2, cy = Math.min(d.y0, mg.s + 10) - 20;
        const x = m2 * m2 * d.x0 + 2 * m2 * u2 * cx + u2 * u2 * xf, y = m2 * m2 * d.y0 + 2 * m2 * u2 * cy + u2 * u2 * (yb - fh * nivel);
        Vista.h.luz(g, x, y, d.joven ? 7 : 5, '255,209,102', d.joven ? 0.95 : 0.55);
      }
      g.globalCompositeOperation = 'source-over';
      for (let k = gotasC.length - 1; k >= 0; k--) if (gotasC[k].u >= 1) gotasC.splice(k, 1);
      g.strokeStyle = 'rgba(160,175,210,0.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(mg.i, h - mg.a); g.lineTo(w - mg.d, h - mg.a); g.stroke();
      for (let tt = 0; tt <= T0; tt += 2) V2.texto(g, `${tt}`, px(tt), h - mg.a + 14, { tam: 10, alin: 'center' });
      V2.texto(g, Lg('edad del universo (Gyr)', 'age of the universe (Gyr)'), (mg.i + w - mg.d) / 2, h - 2, { tam: 11, alin: 'center' });
      for (const zz of zTicks) V2.texto(g, `z ${zz}`, px(CO.edad(zz)), 14, { tam: 10, alin: 'center', color: '#8a93b8' });
    }
    u.animar(dt => { pintarCosmo(dt); return true; });
    function dibujar() {
      const psi = SFH[sfh].psi, t = CO.edad(z), f = CO.dtd(beta);
      // lo que no cambia de cuadro en cuadro: ψ, el aporte de cada generación y su acumulada (para sortear de dónde sale cada gota)
      const ts = Array.from({ length: 300 }, (_, i) => 0.05 + (T0 - 0.05) * i / 299), psis = ts.map(tt => psi(CO.zDeEdad(tt)));
      const ap = ts.map(tt => (tt < t - CO.TAU_MIN ? psi(CO.zDeEdad(tt)) * f(t - tt) : 0)), cum = []; ap.reduce((a, v, i) => (cum[i] = a + v), 0);
      const rz = zz => CO.tasaIa(zz, { psi, beta, K: NM_TESIS, n: 120 }), rMax = Math.max(...[0.05, 0.5, 1, 1.5, 2, 2.5].map(rz));
      cache = { t, ts, psis, pmax: Math.max(...psis), ap, amax: Math.max(...ap) || 1, cum, nivel: rz(z) / rMax };
      gotasC.length = 0;
      // de qué edad son las Ia que explotan ahora: una barra apilada por rangos de edad de su generación
      { const cortes = [0.1, 0.5, 1.7, 5, T0], fr = cortes.map(tm => (tm >= t ? 1 : CO.fraccionJoven(z, { psi, beta }, tm)));
        const eb = Vista.h.lienzo($('#edades', c)), G = eb.g, W = eb.w, H = eb.h; V2.fondo(G, W, H);
        const nombres = Lg(['< 0.1 Gyr', '0.1 a 0.5', '0.5 a 1.7', '1.7 a 5', '> 5 Gyr'], ['< 0.1 Gyr', '0.1 to 0.5', '0.5 to 1.7', '1.7 to 5', '> 5 Gyr']), alfa = [1, 0.8, 0.6, 0.4, 0.25];
        V2.texto(G, Lg(`las Ia que explotan a z = ${z.toFixed(2)}, según la edad de su generación`, `Ia exploding at z = ${z.toFixed(2)}, by the age of their generation`), 8, 14, { tam: 11, color: '#e8ecf8' });
        let x = 8; const ancho = W - 16;
        fr.forEach((f, i) => { const d = f - (i ? fr[i - 1] : 0), wd = ancho * d; if (wd <= 0) return;
          G.fillStyle = `rgba(255,209,102,${alfa[i]})`; G.fillRect(x, 24, wd - 1, 30);
          if (wd > 50) { V2.texto(G, `${(100 * d).toFixed(0)} %`, x + wd / 2, 44, { tam: 12, alin: 'center', color: '#03040b' }); V2.texto(G, nombres[i], x + wd / 2, 70, { tam: 10, alin: 'center' }); }
          x += wd; }); }
      // r(z) con las tasas de la tesis
      const ctx = Plot.preparar($('#rz', c)), TT = Plot.ejes(ctx, { x0: 0, x1: 1.5, y0: 0, y1: 2.6, xlabel: 'z', ylabel: Lg('tasa (10⁻⁴ yr⁻¹ Mpc⁻³)', 'rate (10⁻⁴ yr⁻¹ Mpc⁻³)') });
      const zs = Array.from({ length: 60 }, (_, i) => 0.01 + 1.49 * i / 59);
      Plot.linea(ctx, TT, zs, zs.map(zz => 1e4 * CO.tasaIa(zz, { psi, beta, K: NM_TESIS, n: 160 })), CL.Ia, 2.5);
      Plot.linea(ctx, TT, zs, zs.map(zz => 1e4 * kcc * psi(zz)), CL.II, 2.5);
      for (const b of T.principal.bins.filter(b => !(b.tipo === 'CC' && b.z2 > 0.5))) {
        const zc = (b.z1 + b.z2) / 2, col = b.tipo === 'Ia' ? CL.Ia : CL.II;
        Plot.linea(ctx, TT, [zc, zc], [b.r_lo, b.r_hi], col, 2); Plot.puntos(ctx, TT, [zc], [b.r], col, 4);
      }
      Plot.vline(ctx, TT, z, 'rgba(232,236,248,0.6)');
      const fj = CO.fraccionJoven(z, { psi, beta }, 1.7);
      $('#lectura', c).innerHTML = `<div class="panel"><p>${Lg(`A z = ${z.toFixed(2)}, el ${(100 * fj).toFixed(0)} % de las Ia viene de generaciones de menos de 1.7 Gyr.
        Las CC, en cambio, son de la generación de ahora: su curva es ψ escalada por K_CC = ${f2(1e2 * kcc, 2)} × 10⁻² por M☉ (Kroupa).`, `At z = ${z.toFixed(2)}, ${(100 * fj).toFixed(0)} % of the Ia come from generations younger than 1.7 Gyr.
        The CC, instead, belong to the current generation: their curve is ψ scaled by K_CC = ${f2(1e2 * kcc, 2)} × 10⁻² per M☉ (Kroupa).`)}</p>
        <p class="tenue">${Lg(`La curva de Ia usa el N/M★ de la tesis (${f2(1e3 * NM_TESIS, 2)} × 10⁻³ M☉⁻¹, ajuste a todas las tasas con MF17). Los puntos son las tasas de SUDARE de la tesis,
          con su barra estadística.`, `The Ia curve uses the thesis N/M★ (${f2(1e3 * NM_TESIS, 2)} × 10⁻³ M☉⁻¹, fit to all the rates with MF17). The points are the thesis SUDARE rates,
          with their statistical error bars.`)}</p></div>`;
      if (vioZ && vioB && !$('#volver', c)) terminar();
    }
    const elegir = n => { sfh = n; $('#MF17', c).classList.toggle('primario', n === 'MF17'); $('#MD14', c).classList.toggle('primario', n === 'MD14'); dibujar(); };
    $('#MF17', c).onclick = () => elegir('MF17'); $('#MD14', c).onclick = () => elegir('MD14');
    $('#z', c).oninput = e => { z = +e.target.value; $('#oz', c).textContent = z.toFixed(2); if (z > 1) vioZ = true; dibujar(); };
    $('#beta', c).oninput = e => { beta = +e.target.value; $('#ob', c).textContent = beta.toFixed(2); vioB = true; dibujar(); };
    $('#oz', c).textContent = z.toFixed(2); $('#ob', c).textContent = beta.toFixed(2);
    dibujar();
    u.hablar([['directora', Lg('Lleva el z hasta más allá de 1 y mueve β: mira de qué generaciones vienen las Ia en cada caso.', 'Take z beyond 1 and move β: see which generations the Ia come from in each case.')]]);
    function terminar() {
      $('#fin', c).innerHTML = `<div class="panel"><p>${Lg(`Con β más negativo las Ia vienen de generaciones más jóvenes y su tasa sigue más de cerca a ψ.
        Con β más plano, el goteo de las viejas pesa más y la tasa sube más lento con z. Eso es lo que miden las tasas a distintos z.`, `With a more negative β the Ia come from younger generations and their rate follows ψ more closely.
        With a flatter β, the drip from the old generations weighs more and the rate rises more slowly with z. That is what rates at different z measure.`)}</p>
        <p><button class="primario" id="volver">${Lg('Volver al observatorio', 'Back to the observatory')}</button></p></div>`;
      u.desbloquear(m.ensena); u.marcar(m.id, true); u.sonar('fanfarria');
      $('#volver', c).onclick = () => fin({ gana: true });
    }
  }

  // ---------- 6.3 los controles: ajustar K y β ----------
  // Las tasas de la literatura del ajuste de la tesis (todas + nuestras), con las limpiezas que declara: escala de Perrett por las 91bg,
  // errores de Perley de 95 % a 1σ y un sistemático asignado (la mediana) a quien no publica uno. Es una versión simplificada.
  function datosIa() {
    const L = T.sfh.limpieza, set = T.sfh.conjunto_ia, fr = T.sfh.sist_asignado.Ia;
    const enSet = new Set(set.map(([l, z]) => `${l}|${z}`));
    const lit = T.lit_ia.filter(r => enSet.has(`${r.label}|${r.z}`) && !r.limit).map(r => {
      const esc = (L.escala_91bg || {})[r.label] || 1, k95 = (L.errores_95_a_1sigma || []).includes(r.label) ? 1 / 1.96 : 1;
      const sinSist = !r.sys_lo && !r.sys_hi && !(L.error_total.Ia || []).includes(r.label), fs = r.z < 0.1 ? fr['mediana_z<0.1'] : fr['mediana_z>=0.1'];
      const sl = sinSist ? fs * r.rate : r.sys_lo, sh = sinSist ? fs * r.rate : r.sys_hi;
      return { z: r.z, r: r.rate * esc, lo: esc * Math.hypot(k95 * r.stat_lo, sl), hi: esc * Math.hypot(k95 * r.stat_hi, sh), label: r.label };
    });
    const nuestras = T.sfh.puntos_sudare.map(p => ({ z: (p.z1 + p.z2) / 2, r: p.r, lo: Math.hypot(p.st[0], p.sy[0]), hi: Math.hypot(p.st[1], p.sy[1]), label: 'SUDARE (tesis)', nuestra: true }));
    return { lit, nuestras };
  }
  // K̂ con errores asimétricos: el lado del error es el que mira al modelo (dos pasadas)
  function ajustar(datos, modelo) {
    const mz = datos.map(d => modelo(d.z));
    let K = 1, chi2 = 0;
    for (let it = 0; it < 3; it++) {
      let sxy = 0, sxx = 0;
      datos.forEach((d, i) => { const s = it === 0 ? (d.lo + d.hi) / 2 : (K * mz[i] > d.r ? d.hi : d.lo); sxy += d.r * mz[i] / s ** 2; sxx += mz[i] ** 2 / s ** 2; });
      K = sxy / sxx;
    }
    chi2 = datos.reduce((a, d, i) => { const s = K * mz[i] > d.r ? d.hi : d.lo; return a + ((d.r - K * mz[i]) / s) ** 2; }, 0);
    return { K, chi2 };
  }
  function ajuste(m, fin) {
    const c = u.cont(), { lit, nuestras } = datosIa();
    let beta = -0.5, sfh = 'MF17', conLit = false, perfiles = {}, tocados = new Set();
    c.innerHTML = `
      <div class="panel contrato"><h3>${Lg('Los controles de la fábrica', 'The factory controls')}</h3>
        <p>${Lg(`Mueve β y elige la SFH. Para cada elección, K sale analítico, K̂ = Σ r m / σ² / Σ m² / σ², y el χ² dice qué tan bien pasa el modelo por las tasas medidas.
          Primero solo con las cuatro tasas de Ia de SUDARE. Después con toda la literatura.`, `Move β and choose the SFH. For each choice, K comes out analytically, K̂ = Σ r m / σ² / Σ m² / σ², and the χ² says how well the model passes through the measured rates.
          First with only the four SUDARE Ia rates. Then with all the literature.`)}</p></div>
      <p class="fila"><button id="MF17" class="primario">MF17</button><button id="MD14">${Lg('MD14 (a Kroupa)', 'MD14 (to Kroupa)')}</button>
        <button id="soloS" class="primario">${Lg('Solo SUDARE', 'SUDARE only')}</button><button id="conL">${Lg('SUDARE y literatura', 'SUDARE and literature')}</button></p>
      <label class="control"><span>${Lg('β de la DTD', 'DTD β')}</span><input type="range" id="beta" min="-2" max="-0.3" step="0.01" value="${beta}"><output id="ob"></output></label>
      <div class="fila"><span class="dato">K̂ = <b id="k"></b> × 10⁻³ M☉⁻¹</span><span class="dato">χ² = <b id="chi"></b></span><span class="dato" id="nd"></span></div>
      <canvas class="vista" id="fit"></canvas>
      <canvas class="grafico" id="perfil"></canvas>
      <p class="tenue pie">${Lg(`Cada medida está unida al modelo por un resorte: verde si está a menos de 1σ, ámbar entre 1 y 2σ, rojo más allá.
        El χ² es la suma de lo que se estira cada resorte, medido en su error, al cuadrado. Mueve β y mira cuándo quedan más sueltos.`, `Each measurement is tied to the model by a spring: green if it is within 1σ, amber between 1 and 2σ, red beyond.
        The χ² is the sum of how far each spring stretches, measured in its error, squared. Move β and see when they hang looser.`)}</p>
      <p class="tenue pie">${Lg(`Abajo: Δχ² contra β. Línea continua, el juego con estos mismos datos. Punteada, la tesis. El punto es tu β.
        Donde la curva sube 1 sobre su mínimo queda el intervalo de 1σ.`, `Below: Δχ² against β. Solid line, the game with these same data. Dashed, the thesis. The dot is your β.
        Where the curve rises 1 above its minimum lies the 1σ interval.`)}</p>
      <div id="lectura"></div><div id="cc"></div><div id="fin"></div>`;
    const datos = () => (conLit ? [...lit, ...nuestras] : nuestras);
    // r en 10⁻⁴ yr⁻¹ Mpc⁻³ = 1e4 × K × conv; con el modelo escalado así, K̂ es directamente K en M☉⁻¹
    const conv = (b, s) => zz => 1e4 * CO.tasaIa(zz, { psi: SFH[s].psi, beta: b, K: 1, n: 120 });
    function perfil(s, cl) {
      const k = `${s}|${cl}`;
      if (perfiles[k]) return perfiles[k];
      const d = cl ? [...lit, ...nuestras] : nuestras, bs = Array.from({ length: 35 }, (_, i) => -2 + 0.05 * i);
      const ch = bs.map(b => ajustar(d, conv(b, s)).chi2), mn = Math.min(...ch);
      return (perfiles[k] = bs.map((b, i) => [b, ch[i] - mn]));
    }
    function dibujar() {
      const d = datos(), r = ajustar(d, conv(beta, sfh));
      $('#k', c).textContent = f2(1e3 * r.K, 2); $('#chi', c).textContent = Lg(`${f2(r.chi2, 1)} con ${d.length - 2} grados de libertad`, `${f2(r.chi2, 1)} with ${d.length - 2} degrees of freedom`);
      $('#nd', c).textContent = Lg(`${d.length} tasas`, `${d.length} rates`);
      const ctx = Plot.preparar($('#fit', c)), x1 = conLit ? 2.0 : 0.85, TT = Plot.ejes(ctx, { x0: 0, x1, y0: 0, y1: conLit ? 2.2 : 1.3, xlabel: 'z', ylabel: Lg('tasa de Ia (10⁻⁴ yr⁻¹ Mpc⁻³)', 'Ia rate (10⁻⁴ yr⁻¹ Mpc⁻³)') });
      for (const p of d) { const col = p.nuestra ? CL.Ia : '#8a93b8'; Plot.linea(ctx, TT, [p.z, p.z], [p.r - p.lo, p.r + p.hi], col, p.nuestra ? 2.5 : 1); Plot.puntos(ctx, TT, [p.z], [p.r], col, p.nuestra ? 5 : 3); }
      const zs = Array.from({ length: 50 }, (_, i) => 0.01 + (x1 - 0.01) * i / 49), mf = conv(beta, sfh);
      Plot.linea(ctx, TT, zs, zs.map(zz => r.K * mf(zz)), '#6ee7a0', 3);
      // los resortes: cada medida tira del modelo con un resorte; estirado en unidades de su error, su cuadrado suma al χ²
      for (const q of d) {
        const mv = r.K * mf(q.z), sg = mv > q.r ? q.hi : q.lo, k2 = ((q.r - mv) / sg) ** 2, x = TT.px(q.z), ya = TT.py(q.r), yb = TT.py(mv);
        const col = k2 < 1 ? '110,231,160' : k2 < 4 ? '255,184,77' : '255,107,107', n = 8, a = Math.min(5, 2 + Math.abs(yb - ya) / 20);
        ctx.strokeStyle = `rgba(${col},0.9)`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, ya);
        for (let i = 1; i < n; i++) ctx.lineTo(x + (i % 2 ? a : -a), ya + (yb - ya) * i / n);
        ctx.lineTo(x, yb); ctx.stroke();
      }
      // perfiles de Δχ²
      const pj = perfil(sfh, conLit), pt = conLit ? T.sfh.lit_pl.MF17.perfil : T.sfh.sudare_pl.perfil;
      const mnT = Math.min(...pt.map(x => x[1])), ymx = 8;
      const c2 = Plot.preparar($('#perfil', c)), T2 = Plot.ejes(c2, { x0: -2, x1: -0.3, y0: 0, y1: ymx, xlabel: 'β', ylabel: 'Δχ²' });
      Plot.linea(c2, T2, pj.map(x => x[0]), pj.map(x => Math.min(ymx, x[1])), '#6ee7a0', 2.5);
      if (sfh === 'MF17') Plot.linea(c2, T2, pt.map(x => x[0]), pt.map(x => Math.min(ymx, x[1] - mnT)), '#e8ecf8', 2, [6, 4]);
      Plot.hline(c2, T2, 1, 'rgba(255,184,77,0.6)', 'Δχ² = 1');
      const yb = pj.reduce((a, x) => (Math.abs(x[0] - beta) < Math.abs(a[0] - beta) ? x : a))[1];
      Plot.puntos(c2, T2, [beta], [Math.min(ymx, yb)], '#ffd166', 6);
      leer();
    }
    function leer() {
      const nm = sf => N[`sfh.paso3.todas+nuestras.${sf}.N_M`], bt = sf => N[`sfh.paso3.todas+nuestras.${sf}.beta`];
      $('#lectura', c).innerHTML = conLit
        ? `<div class="panel"><p>${Lg(`Con la literatura, β queda acotado. La tesis (MF17): β = ${bt('MF17')} +${N['sfh.paso3.todas+nuestras.MF17.beta_mas']} −${N['sfh.paso3.todas+nuestras.MF17.beta_menos']},
            N/M★ = ${nm('MF17')} × 10⁻³ M☉⁻¹, χ² ${N['sfh.paso3.todas+nuestras.MF17.chi2']} con ${N['sfh.paso3.todas+nuestras.MF17.dof']} grados de libertad.`, `With the literature, β is constrained. The thesis (MF17): β = ${bt('MF17')} +${N['sfh.paso3.todas+nuestras.MF17.beta_mas']} −${N['sfh.paso3.todas+nuestras.MF17.beta_menos']},
            N/M★ = ${nm('MF17')} × 10⁻³ M☉⁻¹, χ² ${N['sfh.paso3.todas+nuestras.MF17.chi2']} with ${N['sfh.paso3.todas+nuestras.MF17.dof']} degrees of freedom.`)}</p>
            <p>${Lg('Cambiar la SFH mueve N/M★', 'Changing the SFH moves N/M★')} (${['H22_K', 'MF17', 'MD14_K', 'K21_K'].filter(sf => nm(sf)).map(sf => `${sf.replace('_K', '')} ${nm(sf)}`).join(', ')}) ${Lg('y casi no mueve β', 'and barely moves β')}
            (${['H22_K', 'MF17', 'MD14_K', 'K21_K'].filter(sf => bt(sf)).map(sf => bt(sf)).join(', ')}).</p>
            <p>${Lg('Los modelos de Greggio, contra el mejor (Δχ², MF17):', 'The Greggio models against the best one (Δχ², MF17):')} ${Object.entries(T.sfh.dchi2_greggio).map(([k, v]) => `${k} ${f2(v, 1)}`).join(', ')}.
            ${Lg('Los de doble degenerada ancha (DDW) quedan desfavorecidos.', 'The wide double-degenerate ones (DDW) are disfavoured.')}</p>
            <p class="tenue">${Lg('Tu χ² es el del juego: los errores de la literatura van simplificados (estadístico y sistemático en cuadratura, sin covarianzas). Los números de arriba son los de la tesis.', 'Your χ² is the game one: the literature errors are simplified (statistical and systematic in quadrature, no covariances). The numbers above are the thesis ones.')}</p></div>`
        : `<div class="panel"><p>${Lg(`Con solo cuatro puntos hasta z = 0.75, la curva de Δχ² es casi plana: β no queda acotado.
            La tesis encuentra lo mismo: β libre = ${N['sfh.paso2.beta_libre']}, ${N['sfh.paso2.beta_libre_acotado'] ? 'acotado' : 'sin cota'}. Con β fijo por modelo,
            K de SD-Ch = ${N['sfh.paso2.sudare_t11_fina.SD-Ch.K']} ± ${N['sfh.paso2.sudare_t11_fina.SD-Ch.sK_est']} (est.) +${N['sfh.paso2.sudare_t11_fina.SD-Ch.sK_sist_mas']} −${N['sfh.paso2.sudare_t11_fina.SD-Ch.sK_sist_menos']} (sist.) × 10⁻³.`, `With only four points up to z = 0.75, the Δχ² curve is almost flat: β is not constrained.
            The thesis finds the same: free β = ${N['sfh.paso2.beta_libre']}, ${N['sfh.paso2.beta_libre_acotado'] ? 'constrained' : 'unconstrained'}. With β fixed per model,
            K for SD-Ch = ${N['sfh.paso2.sudare_t11_fina.SD-Ch.K']} ± ${N['sfh.paso2.sudare_t11_fina.SD-Ch.sK_est']} (stat.) +${N['sfh.paso2.sudare_t11_fina.SD-Ch.sK_sist_mas']} −${N['sfh.paso2.sudare_t11_fina.SD-Ch.sK_sist_menos']} (sys.) × 10⁻³.`)}</p></div>`;
    }
    const tocar = k => { tocados.add(k); if (tocados.has('beta') && tocados.has('lit') && !$('#ccPanel', c)) expertaCC(); };
    $('#MF17', c).onclick = () => { sfh = 'MF17'; $('#MF17', c).classList.add('primario'); $('#MD14', c).classList.remove('primario'); dibujar(); };
    $('#MD14', c).onclick = () => { sfh = 'MD14'; $('#MD14', c).classList.add('primario'); $('#MF17', c).classList.remove('primario'); dibujar(); };
    $('#soloS', c).onclick = () => { conLit = false; $('#soloS', c).classList.add('primario'); $('#conL', c).classList.remove('primario'); dibujar(); };
    $('#conL', c).onclick = () => { conLit = true; $('#conL', c).classList.add('primario'); $('#soloS', c).classList.remove('primario'); dibujar(); tocar('lit'); };
    $('#beta', c).oninput = e => { beta = +e.target.value; $('#ob', c).textContent = beta.toFixed(2); dibujar(); tocar('beta'); };
    $('#ob', c).textContent = beta.toFixed(2);
    dibujar();
    function expertaCC() {
      const cc = T.principal.bins.filter(b => b.tipo === 'CC' && b.z2 < 0.5), kcc = T.sfh.imf.Kroupa.K_CC_8_40;
      let fK = 1, fo = 0;
      $('#cc', c).innerHTML = `<div class="panel" id="ccPanel"><h3>${Lg('Experta: las CC y dos perillas', 'Expert: the CC and two knobs')}</h3>
        <p>${Lg('La tasa CC predicha es K_CC ψ. Pero una parte de las CC se pierde detrás del polvo de sus galaxias (las ocultas). Mueve las dos perillas.', 'The predicted CC rate is K_CC ψ. But some of the CC are lost behind the dust of their galaxies (the hidden ones). Move the two knobs.')}</p>
        <label class="control"><span>${Lg('K_CC (× el de la IMF)', 'K_CC (× the IMF value)')}</span><input type="range" id="fK" min="0.5" max="1.3" step="0.01" value="1"><output id="ofK">1.00</output></label>
        <label class="control"><span>${Lg('fracción oculta', 'hidden fraction')}</span><input type="range" id="fo" min="0" max="0.5" step="0.01" value="0"><output id="ofo">0.00</output></label>
        <canvas class="grafico" id="ccg"></canvas>
        <p id="ccl"></p>
        <p><button class="primario" id="volver">${Lg('Volver al observatorio', 'Back to the observatory')}</button></p></div>`;
      const dib = () => {
        const ctx = Plot.preparar($('#ccg', c)), TT = Plot.ejes(ctx, { x0: 0, x1: 0.5, y0: 0, y1: 2.6, xlabel: 'z', ylabel: Lg('tasa CC (10⁻⁴ yr⁻¹ Mpc⁻³)', 'CC rate (10⁻⁴ yr⁻¹ Mpc⁻³)') });
        const zs = Array.from({ length: 30 }, (_, i) => 0.01 + 0.49 * i / 29);
        Plot.linea(ctx, TT, zs, zs.map(zz => 1e4 * kcc * CO.psiMF17(zz)), 'rgba(240,96,93,0.4)', 2, [5, 4]);
        Plot.linea(ctx, TT, zs, zs.map(zz => 1e4 * fK * kcc * (1 - fo) * CO.psiMF17(zz)), CL.II, 3);
        for (const b of cc) { const zc = (b.z1 + b.z2) / 2; Plot.linea(ctx, TT, [zc, zc], [b.r_lo, b.r_hi], '#e8ecf8', 2); Plot.puntos(ctx, TT, [zc], [b.r], '#e8ecf8', 5); }
        $('#ccl', c).innerHTML = Lg(`El producto es lo que cuenta: K_CC × (1 − f_oculta) = ${f2(fK * (1 - fo), 2)}. Muchas combinaciones dan la misma curva.
          Las tasas CC miden el producto K_CC ψ (1 − f), no cada factor. En la tesis, con MF17 y Kroupa, lo medido sobre lo predicho es
          ${T.sfh.cc.MF17_Kroupa.cociente.map(x => f2(x)).join(' y ')}, y con la fracción de ocultas de Mattila et al. (2012), ${T.sfh.cc.MF17_Kroupa_ocultas.cociente.map(x => f2(x)).join(' y ')}.`, `The product is what counts: K_CC × (1 − f_hidden) = ${f2(fK * (1 - fo), 2)}. Many combinations give the same curve.
          CC rates measure the product K_CC ψ (1 − f), not each factor. In the thesis, with MF17 and Kroupa, measured over predicted is
          ${T.sfh.cc.MF17_Kroupa.cociente.map(x => f2(x)).join(' and ')}, and with the hidden fraction of Mattila et al. (2012), ${T.sfh.cc.MF17_Kroupa_ocultas.cociente.map(x => f2(x)).join(' and ')}.`);
      };
      $('#fK', c).oninput = e => { fK = +e.target.value; $('#ofK', c).textContent = fK.toFixed(2); dib(); };
      $('#fo', c).oninput = e => { fo = +e.target.value; $('#ofo', c).textContent = fo.toFixed(2); dib(); };
      dib();
      u.desbloquear(m.ensena); u.marcar(m.id, true); u.sonar('fanfarria');
      $('#volver', c).onclick = () => fin({ gana: true });
      u.hablar([['examinador3', Lg('Entonces, con solo SUDARE, ¿qué puede decir de β?', 'So, with SUDARE alone, what can you say about β?')], ['yo', Lg('Que no lo acota: cuatro bines hasta z 0.75 no bastan. Con la literatura sí, y K depende de la SFH que elija.', 'That it does not constrain it: four bins up to z 0.75 are not enough. With the literature it does, and K depends on the SFH I choose.')]]);
    }
  }

  M.registrar('vivero', vivero);
  M.registrar('linea', linea);
  M.registrar('ajuste', ajuste);
  M.agregar([
    { id: '6.1', cap: 6, titulo: Lg('El vivero', 'The nursery'), tipo: 'vivero', donde: 'cielo', ensena: ['imf'],
      contrato: [['directora', Lg('Ya mides tasas. Ahora la pregunta de fondo: ¿de dónde vienen las supernovas? Sube a la cúpula y mira el cielo: ahí está la fábrica cósmica.', 'You already measure rates. Now the deep question: where do supernovae come from? Go up to the dome and look at the sky: the cosmic factory is there.')]] },
    { id: '6.2', cap: 6, titulo: Lg('Muchas generaciones', 'Many generations'), tipo: 'linea', donde: 'cielo', ensena: ['sfh'],
      contrato: [['directora', Lg('Una generación no basta. El universo forma estrellas todo el tiempo. Mira desde la cúpula cómo se suman sus goteos.', 'One generation is not enough. The universe forms stars all the time. Watch from the dome how their drips add up.')]] },
    { id: '6.3', cap: 6, titulo: Lg('Los controles de la fábrica', 'The factory controls'), tipo: 'ajuste', donde: 'cielo', ensena: ['dtd'],
      contrato: [['directora', Lg('Ahora ajusta: mueve β, cambia la SFH y mira el χ². Primero con tus tasas solas, después con toda la literatura.', 'Now fit: move β, change the SFH and watch the χ². First with your rates alone, then with all the literature.')]],
      examinador3: [['examinador3', Lg('Cuando ajuste la DTD, vuelva. Le voy a preguntar qué acotan sus tasas y qué no.', 'Come back once you have fitted the DTD. I will ask you what your rates constrain and what they do not.')]] },
  ]);
})();
