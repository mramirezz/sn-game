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
  const SFH = { MF17: { psi: CO.psiMF17, nombre: 'MF17 (Kroupa)' }, MD14: { psi: z => T.sfh.imf.psi_kroupa_sobre_salpeter * CO.psiMD14(z), nombre: 'MD14 llevada a Kroupa' } };
  const zTicks = [0, 0.5, 1, 2, 3, 5];

  // ---------- 6.1 el vivero: una generación de estrellas ----------
  function vivero(m, fin) {
    const c = u.cont(), rand = U.rng(Date.now() % 1e9);
    let imfN = 'kroupa', beta = BETA_TESIS, logt = 6, jugando = false, llegoFin = false, cambioImf = false;
    c.innerHTML = `
      <div class="panel contrato"><h3>El vivero</h3>
        <p>Una nube forma de golpe una generación de estrellas. La IMF dice cuántas nacen de cada masa: muchísimas chicas y muy pocas masivas.
          Las de 8 a 40 M☉ viven poco y explotan como CC. Las de 3 a 8 M☉ terminan como enanas blancas, y una fracción de unos pocos por ciento
          de ellas termina como Ia, goteando durante miles de millones de años.</p>
        <div class="ecuacion" id="ecK"></div><p class="etiqueta">K_CC: sec:results:sfh (sin etiqueta propia)</p></div>
      <p class="fila"><button id="kroupa" class="primario">IMF de Kroupa</button><button id="salpeter">IMF de Salpeter</button>
        <button class="primario" id="play">▶ Que pase el tiempo</button><span class="dato">edad de la generación: <b id="edad">1 Myr</b></span></p>
      <label class="control"><span>β de la DTD</span><input type="range" id="beta" min="-2" max="-0.3" step="0.01" value="${beta}"><output id="ob"></output></label>
      <canvas class="vista" id="gen"></canvas>
      <canvas class="grafico" id="tl"></canvas>
      <div class="leyenda"><span><i style="background:#5ad1ff"></i>CC acumuladas</span><span><i style="background:#ffd166"></i>Ia acumuladas</span><span><i style="background:#e8ecf8"></i>enanas blancas</span></div>
      <div id="cuentas"></div>
      <div id="fin"></div>`;
    u.tex($('#ecK', c), String.raw`K_\mathrm{CC} \,=\, \frac{\int_{8}^{40} \phi(m)\,\mathrm{d}m}{\int_{0.1}^{100} m\,\phi(m)\,\mathrm{d}m}, \qquad f(\tau) \,\propto\, \tau^{\beta} \;\;(\tau > 40\,\mathrm{Myr})`);
    // la muestra de estrellas para dibujar: masas sorteadas de la IMF en número (pdf por log m ∝ m φ(m))
    function estrellas(imf) {
      const lm = Array.from({ length: 301 }, (_, i) => -1 + 3 * i / 300), pdf = lm.map(l => 10 ** l * imf(10 ** l)), cdf = [0];
      for (let i = 1; i < lm.length; i++) cdf.push(cdf[i - 1] + (pdf[i] + pdf[i - 1]) / 2);
      const tot = cdf[cdf.length - 1];
      return Array.from({ length: 1600 }, () => {
        const q = rand() * tot; let i = cdf.findIndex(v => v >= q); i = Math.max(1, i);
        const mm = 10 ** (lm[i - 1] + (lm[i] - lm[i - 1]) * (q - cdf[i - 1]) / Math.max(1e-12, cdf[i] - cdf[i - 1]));
        const r = Math.sqrt(rand()) * 0.42, a = rand() * 2 * Math.PI;
        return { m: mm, x: 0.5 + r * Math.cos(a), y: 0.5 + r * Math.sin(a) * 0.85, vida: vida(mm) };
      });
    }
    let pobl = estrellas(CO.IMF[imfN]);
    const destellos = [];
    function cuentas() {
      const imf = CO.IMF[imfN], kcc = CO.kcc(imf), n38 = CO.kcc(imf, 3, 8), nombreT = imfN === 'kroupa' ? 'Kroupa' : 'Salpeter';
      return { kcc, n38, nIa: NM_TESIS, frac: NM_TESIS / n38, tesis: T.sfh.imf[nombreT] };
    }
    const fracCC = t => { const imf = CO.IMF[imfN], tot = CO.kcc(imf); // de las 8 a 40, cuántas ya murieron a la edad t
      const mMin = Math.max(8, [...Array(200)].map((_, i) => 8 * 5 ** (i / 199)).find(mm => vida(mm) <= t) || 41);
      return mMin > 40 ? 0 : CO.kcc(imf, mMin, 40) / tot; };
    const fracIa = t => { if (t <= CO.TAU_MIN) return 0; const b1 = beta + 1, F = x => (Math.abs(b1) < 1e-9 ? Math.log(x) : x ** b1 / b1); return (F(Math.min(t, T0)) - F(CO.TAU_MIN)) / (F(T0) - F(CO.TAU_MIN)); };
    function dibujar(dt) {
      const t = 10 ** logt / 1e9; // Gyr
      $('#edad', c).textContent = t < 1e-3 * 999 ? `${(t * 1e3).toFixed(0)} Myr` : `${t.toFixed(2)} Gyr`;
      // la generación
      const { g, w, h } = Vista.h.lienzo($('#gen', c));
      g.fillStyle = '#03040b'; g.fillRect(0, 0, w, h);
      for (const s of pobl) {
        const x = s.x * w, y = s.y * h, viva = t < s.vida;
        if (viva) {
          const r = Math.min(7, 0.9 + 1.6 * s.m ** 0.45), col = s.m > 8 ? '#9fd8ff' : s.m > 3 ? '#dfefff' : s.m > 1 ? '#fff2c4' : '#ffb07a';
          g.fillStyle = col; g.globalAlpha = s.m > 3 ? 1 : 0.55; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.globalAlpha = 1;
          if (s.m > 8) { g.strokeStyle = 'rgba(159,216,255,0.35)'; g.beginPath(); g.arc(x, y, r + 3, 0, 7); g.stroke(); }
        } else if (s.m < 8) { // enana blanca; las de 3 a 8 M☉ con anillo: pueden ser Ia
          g.fillStyle = '#e8ecf8'; g.beginPath(); g.arc(x, y, 1.6, 0, 7); g.fill();
          if (s.m >= 3) { g.strokeStyle = 'rgba(255,209,102,0.6)'; g.beginPath(); g.arc(x, y, 3.5, 0, 7); g.stroke(); }
        } else if (s.m <= 40) { g.fillStyle = '#3a4060'; g.beginPath(); g.arc(x, y, 1.4, 0, 7); g.fill(); }
      }
      // destellos: CC (azul) y Ia (amarillo)
      for (const d of destellos) {
        d.v += dt;
        const r = 4 + 40 * d.v, a = Math.max(0, 1 - d.v / 0.8);
        g.strokeStyle = d.tipo === 'CC' ? `rgba(90,209,255,${a})` : `rgba(255,209,102,${a})`; g.lineWidth = 2.5; g.beginPath(); g.arc(d.x * w, d.y * h, r, 0, 7); g.stroke();
        g.fillStyle = d.tipo === 'CC' ? `rgba(200,240,255,${a})` : `rgba(255,240,190,${a})`; g.beginPath(); g.arc(d.x * w, d.y * h, 4, 0, 7); g.fill();
      }
      while (destellos.length && destellos[0].v > 0.8) destellos.shift();
      V2.texto(g, `IMF de ${imfN === 'kroupa' ? 'Kroupa' : 'Salpeter'} · ${pobl.length} estrellas dibujadas de una generación`, 10, 16, { tam: 12, color: '#e8ecf8' });
      // la línea de tiempo: acumuladas por generación
      const tl = Vista.h.lienzo($('#tl', c)), G = tl.g, W = tl.w, H = tl.h, mg = { i: 44, d: 14, s: 14, a: 30 };
      V2.fondo(G, W, H);
      const px = lt => mg.i + (W - mg.i - mg.d) * (lt - 6) / (Math.log10(T0 * 1e9) - 6), py = f => H - mg.a - (H - mg.s - mg.a) * f;
      G.strokeStyle = 'rgba(160,175,210,0.5)'; G.beginPath(); G.moveTo(mg.i, mg.s); G.lineTo(mg.i, H - mg.a); G.lineTo(W - mg.d, H - mg.a); G.stroke();
      for (const [lt, n] of [[6, '1 Myr'], [7, '10 Myr'], [8, '100 Myr'], [9, '1 Gyr'], [10, '10 Gyr']]) V2.texto(G, n, px(lt), H - mg.a + 14, { tam: 10, alin: 'center' });
      V2.texto(G, '100 %', mg.i - 4, py(1) + 4, { tam: 10, alin: 'right' }); V2.texto(G, '0', mg.i - 4, py(0) + 4, { tam: 10, alin: 'right' });
      G.strokeStyle = 'rgba(255,209,102,0.5)'; G.setLineDash([4, 4]); G.beginPath(); G.moveTo(px(7.602), mg.s); G.lineTo(px(7.602), H - mg.a); G.stroke(); G.setLineDash([]);
      V2.texto(G, '40 Myr: empiezan las Ia', px(7.602) + 4, mg.s + 10, { tam: 10, color: '#ffd166' });
      for (const [fn, col] of [[fracCC, '#5ad1ff'], [fracIa, '#ffd166']]) {
        G.strokeStyle = col; G.lineWidth = 2.5; G.beginPath();
        for (let lt = 6; lt <= Math.log10(T0 * 1e9); lt += 0.02) { const f = fn(10 ** lt / 1e9); lt === 6 ? G.moveTo(px(lt), py(f)) : G.lineTo(px(lt), py(f)); }
        G.stroke();
      }
      G.strokeStyle = '#e8ecf8'; G.lineWidth = 1.5; G.beginPath(); G.moveTo(px(logt), mg.s); G.lineTo(px(logt), H - mg.a); G.stroke();
      V2.texto(G, `ya explotó el ${(100 * fracCC(t)).toFixed(0)} % de las CC y el ${(100 * fracIa(t)).toFixed(0)} % de las Ia`, Math.min(px(logt) + 6, W - 230), py(0.55), { tam: 11, color: '#e8ecf8' });
    }
    function textoCuentas() {
      const k = cuentas();
      $('#cuentas', c).innerHTML = `<div class="panel"><table class="tabla"><tr><th>por cada 1000 M☉ formadas</th><th>en el juego</th><th>tesis</th></tr>
        <tr><td>CC (estrellas de 8 a 40 M☉)</td><td>${f2(1e3 * k.kcc, 1)}</td><td>${f2(1e3 * k.tesis.K_CC_8_40, 1)}</td></tr>
        <tr><td>estrellas de 3 a 8 M☉ (futuras enanas blancas)</td><td>${f2(1e3 * k.n38, 1)}</td><td>${f2(1e3 * k.tesis.N_3_8, 1)}</td></tr>
        <tr><td>Ia (N/M★ medido, MF17 y Kroupa)</td><td colspan="2">${f2(1e3 * k.nIa, 2)}: el ${f2(100 * k.frac, 1)} % de las de 3 a 8 M☉ termina como Ia</td></tr></table>
        <p class="tenue">K_CC y las de 3 a 8 M☉ salen de integrar la IMF, igual que en la tesis. N/M★ es el ajuste de la tesis a todas las tasas de Ia
          (${N['sfh.paso3.todas+nuestras.MF17.n']} medidas de ${N['sfh.paso3.todas+nuestras.MF17.n_obras']} trabajos). Las vidas de las estrellas son una aproximación ${marca}.</p></div>`;
    }
    textoCuentas();
    const elegir = n => { imfN = n; cambioImf = true; pobl = estrellas(CO.IMF[n]); $('#kroupa', c).classList.toggle('primario', n === 'kroupa'); $('#salpeter', c).classList.toggle('primario', n === 'salpeter'); textoCuentas(); };
    $('#kroupa', c).onclick = () => elegir('kroupa'); $('#salpeter', c).onclick = () => elegir('salpeter');
    $('#beta', c).oninput = e => { beta = +e.target.value; $('#ob', c).textContent = beta.toFixed(2); };
    $('#ob', c).textContent = beta.toFixed(2);
    $('#play', c).onclick = () => { if (logt >= Math.log10(T0 * 1e9) - 0.01) logt = 6; jugando = !jugando; $('#play', c).textContent = jugando ? '❚❚ Pausa' : '▶ Que pase el tiempo'; };
    u.animar((dt, ts) => {
      if (jugando) {
        const t1 = 10 ** logt / 1e9, lt2 = Math.min(Math.log10(T0 * 1e9), logt + dt * 0.33), t2 = 10 ** lt2 / 1e9;
        // eventos por cada 1e5 M☉: las CC y las Ia que caen en este paso, dibujados como destellos
        const nCC = 1e5 * CO.kcc(CO.IMF[imfN]) * (fracCC(t2) - fracCC(t1)), nIa = 1e5 * NM_TESIS * (fracIa(t2) - fracIa(t1));
        for (const [n, tipo] of [[nCC, 'CC'], [nIa, 'Ia']]) {
          let k = Math.floor(n / 25) + (rand() < (n / 25) % 1 ? 1 : 0); // un destello cada 25 eventos
          while (k-- > 0) { const r = Math.sqrt(rand()) * 0.4, a = rand() * 6.283; destellos.push({ tipo, x: 0.5 + r * Math.cos(a), y: 0.5 + 0.85 * r * Math.sin(a), v: 0 }); }
        }
        logt = lt2;
        if (logt >= Math.log10(T0 * 1e9) - 0.01) { jugando = false; $('#play', c).textContent = '▶ Otra vez'; if (!llegoFin) { llegoFin = true; terminar(); } }
      }
      dibujar(dt);
      return true;
    });
    function terminar() {
      $('#fin', c).innerHTML = `<div class="panel"><p>Las CC salen todas en los primeros ~40 Myr: su tasa sigue a la formación estelar del momento, r_CC = K_CC ψ.
        Las Ia gotean durante toda la edad del universo, con f(τ) ∝ τ^β. Con β cerca de −1, hay tantas Ia entre 0.1 y 1 Gyr como entre 1 y 10 Gyr.
        Cambia β y mira cómo la curva amarilla se carga hacia los retardos cortos (β más negativo) o largos.</p>
        <p class="tenue">Cada destello es 25 explosiones de una generación de 10⁵ M☉ ${marca}.</p>
        <p><button class="primario" id="volver">Volver al observatorio</button></p></div>`;
      u.desbloquear(m.ensena); u.marcar(m.id, true); u.sonar('fanfarria');
      $('#volver', c).onclick = () => fin({ gana: true });
      u.hablar([['directora', cambioImf ? 'Con Salpeter hay menos masivas por masa formada: menos CC por M☉. Por eso la IMF y la SFH van siempre emparejadas.'
        : 'Prueba también con la IMF de Salpeter: cambia cuántas CC salen por cada M☉ formada.']]);
    }
  }

  // ---------- 6.2 la línea del tiempo cósmica ----------
  function linea(m, fin) {
    const c = u.cont();
    let z = 0.25, beta = BETA_TESIS, sfh = 'MF17', vioZ = false, vioB = false;
    c.innerHTML = `
      <div class="panel contrato"><h3>Muchas generaciones</h3>
        <p>El universo forma estrellas todo el tiempo, más rápido hace unos 10 mil millones de años (z ≈ 2) que hoy: es la historia de formación estelar ψ.
          La tasa de Ia que mides a un z es la suma de los goteos de todas las generaciones anteriores: una convolución.</p>
        <div class="ecuacion" id="ecR"></div><p class="etiqueta">eq:intro:rate_Ia</p></div>
      <p class="fila"><button id="MF17" class="primario">SFH de Madau y Fragos 2017</button><button id="MD14">SFH de Madau y Dickinson 2014</button></p>
      <label class="control"><span>z que miras</span><input type="range" id="z" min="0.02" max="1.5" step="0.01" value="${z}"><output id="oz"></output></label>
      <label class="control"><span>β de la DTD</span><input type="range" id="beta" min="-2" max="-0.3" step="0.01" value="${beta}"><output id="ob"></output></label>
      <canvas class="vista" id="cosmo"></canvas>
      <p class="tenue pie">Verde: la formación estelar de cada época, generación tras generación. Cada gota amarilla es una Ia: sale de la generación
        que la formó y cae en el frasco de "ahora". Salen más gotas de donde el aporte ψ(t′) f(t − t′) es mayor (sombra amarilla), y las brillantes
        vienen de generaciones de menos de 1.7 Gyr. El nivel del frasco es la tasa de Ia a ese z.</p>
      <canvas class="grafico" id="edades" style="height:96px"></canvas>
      <canvas class="grafico" id="rz"></canvas>
      <div class="leyenda"><span><i style="background:#ffd166"></i>Ia: modelo y tasas de la tesis</span><span><i style="background:#f0605d"></i>CC: K_CC ψ y tasas de la tesis</span></div>
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
      V2.texto(g, `z = ${z.toFixed(2)}: ahora`, xf - 6, mg.s + 12, { tam: 11, alin: 'right', color: '#e8ecf8' });
      V2.texto(g, 'tasa de Ia', xf - fw / 2 - 4, yb - fh - 4, { tam: 10, alin: 'right', color: '#ffd166' });
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
      V2.texto(g, 'edad del universo (Gyr)', (mg.i + w - mg.d) / 2, h - 2, { tam: 11, alin: 'center' });
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
        const nombres = ['< 0.1 Gyr', '0.1 a 0.5', '0.5 a 1.7', '1.7 a 5', '> 5 Gyr'], alfa = [1, 0.8, 0.6, 0.4, 0.25];
        V2.texto(G, `las Ia que explotan a z = ${z.toFixed(2)}, según la edad de su generación`, 8, 14, { tam: 11, color: '#e8ecf8' });
        let x = 8; const ancho = W - 16;
        fr.forEach((f, i) => { const d = f - (i ? fr[i - 1] : 0), wd = ancho * d; if (wd <= 0) return;
          G.fillStyle = `rgba(255,209,102,${alfa[i]})`; G.fillRect(x, 24, wd - 1, 30);
          if (wd > 50) { V2.texto(G, `${(100 * d).toFixed(0)} %`, x + wd / 2, 44, { tam: 12, alin: 'center', color: '#03040b' }); V2.texto(G, nombres[i], x + wd / 2, 70, { tam: 10, alin: 'center' }); }
          x += wd; }); }
      // r(z) con las tasas de la tesis
      const ctx = Plot.preparar($('#rz', c)), TT = Plot.ejes(ctx, { x0: 0, x1: 1.5, y0: 0, y1: 2.6, xlabel: 'z', ylabel: 'tasa (10⁻⁴ yr⁻¹ Mpc⁻³)' });
      const zs = Array.from({ length: 60 }, (_, i) => 0.01 + 1.49 * i / 59);
      Plot.linea(ctx, TT, zs, zs.map(zz => 1e4 * CO.tasaIa(zz, { psi, beta, K: NM_TESIS, n: 160 })), CL.Ia, 2.5);
      Plot.linea(ctx, TT, zs, zs.map(zz => 1e4 * kcc * psi(zz)), CL.II, 2.5);
      for (const b of T.principal.bins.filter(b => !(b.tipo === 'CC' && b.z2 > 0.5))) {
        const zc = (b.z1 + b.z2) / 2, col = b.tipo === 'Ia' ? CL.Ia : CL.II;
        Plot.linea(ctx, TT, [zc, zc], [b.r_lo, b.r_hi], col, 2); Plot.puntos(ctx, TT, [zc], [b.r], col, 4);
      }
      Plot.vline(ctx, TT, z, 'rgba(232,236,248,0.6)');
      const fj = CO.fraccionJoven(z, { psi, beta }, 1.7);
      $('#lectura', c).innerHTML = `<div class="panel"><p>A z = ${z.toFixed(2)}, el ${(100 * fj).toFixed(0)} % de las Ia viene de generaciones de menos de 1.7 Gyr.
        Las CC, en cambio, son de la generación de ahora: su curva es ψ escalada por K_CC = ${f2(1e2 * kcc, 2)} × 10⁻² por M☉ (Kroupa).</p>
        <p class="tenue">La curva de Ia usa el N/M★ de la tesis (${f2(1e3 * NM_TESIS, 2)} × 10⁻³ M☉⁻¹, ajuste a todas las tasas con MF17). Los puntos son las tasas de SUDARE de la tesis,
          con su barra estadística.</p></div>`;
      if (vioZ && vioB && !$('#volver', c)) terminar();
    }
    const elegir = n => { sfh = n; $('#MF17', c).classList.toggle('primario', n === 'MF17'); $('#MD14', c).classList.toggle('primario', n === 'MD14'); dibujar(); };
    $('#MF17', c).onclick = () => elegir('MF17'); $('#MD14', c).onclick = () => elegir('MD14');
    $('#z', c).oninput = e => { z = +e.target.value; $('#oz', c).textContent = z.toFixed(2); if (z > 1) vioZ = true; dibujar(); };
    $('#beta', c).oninput = e => { beta = +e.target.value; $('#ob', c).textContent = beta.toFixed(2); vioB = true; dibujar(); };
    $('#oz', c).textContent = z.toFixed(2); $('#ob', c).textContent = beta.toFixed(2);
    dibujar();
    u.hablar([['directora', 'Lleva el z hasta más allá de 1 y mueve β: mira de qué generaciones vienen las Ia en cada caso.']]);
    function terminar() {
      $('#fin', c).innerHTML = `<div class="panel"><p>Con β más negativo las Ia vienen de generaciones más jóvenes y su tasa sigue más de cerca a ψ.
        Con β más plano, el goteo de las viejas pesa más y la tasa sube más lento con z. Eso es lo que miden las tasas a distintos z.</p>
        <p><button class="primario" id="volver">Volver al observatorio</button></p></div>`;
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
      <div class="panel contrato"><h3>Los controles de la fábrica</h3>
        <p>Mueve β y elige la SFH. Para cada elección, K sale analítico, K̂ = Σ r m / σ² / Σ m² / σ², y el χ² dice qué tan bien pasa el modelo por las tasas medidas.
          Primero solo con las cuatro tasas de Ia de SUDARE. Después con toda la literatura.</p></div>
      <p class="fila"><button id="MF17" class="primario">MF17</button><button id="MD14">MD14 (a Kroupa)</button>
        <button id="soloS" class="primario">Solo SUDARE</button><button id="conL">SUDARE y literatura</button></p>
      <label class="control"><span>β de la DTD</span><input type="range" id="beta" min="-2" max="-0.3" step="0.01" value="${beta}"><output id="ob"></output></label>
      <div class="fila"><span class="dato">K̂ = <b id="k"></b> × 10⁻³ M☉⁻¹</span><span class="dato">χ² = <b id="chi"></b></span><span class="dato" id="nd"></span></div>
      <canvas class="vista" id="fit"></canvas>
      <canvas class="grafico" id="perfil"></canvas>
      <p class="tenue pie">Cada medida está unida al modelo por un resorte: verde si está a menos de 1σ, ámbar entre 1 y 2σ, rojo más allá.
        El χ² es la suma de lo que se estira cada resorte, medido en su error, al cuadrado. Mueve β y mira cuándo quedan más sueltos.</p>
      <p class="tenue pie">Abajo: Δχ² contra β. Línea continua, el juego con estos mismos datos. Punteada, la tesis. El punto es tu β.
        Donde la curva sube 1 sobre su mínimo queda el intervalo de 1σ.</p>
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
      $('#k', c).textContent = f2(1e3 * r.K, 2); $('#chi', c).textContent = `${f2(r.chi2, 1)} con ${d.length - 2} grados de libertad`;
      $('#nd', c).textContent = `${d.length} tasas`;
      const ctx = Plot.preparar($('#fit', c)), x1 = conLit ? 2.0 : 0.85, TT = Plot.ejes(ctx, { x0: 0, x1, y0: 0, y1: conLit ? 2.2 : 1.3, xlabel: 'z', ylabel: 'tasa de Ia (10⁻⁴ yr⁻¹ Mpc⁻³)' });
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
        ? `<div class="panel"><p>Con la literatura, β queda acotado. La tesis (MF17): β = ${bt('MF17')} +${N['sfh.paso3.todas+nuestras.MF17.beta_mas']} −${N['sfh.paso3.todas+nuestras.MF17.beta_menos']},
            N/M★ = ${nm('MF17')} × 10⁻³ M☉⁻¹, χ² ${N['sfh.paso3.todas+nuestras.MF17.chi2']} con ${N['sfh.paso3.todas+nuestras.MF17.dof']} grados de libertad.</p>
            <p>Cambiar la SFH mueve N/M★ (${['H22_K', 'MF17', 'MD14_K', 'K21_K'].filter(sf => nm(sf)).map(sf => `${sf.replace('_K', '')} ${nm(sf)}`).join(', ')}) y casi no mueve β
            (${['H22_K', 'MF17', 'MD14_K', 'K21_K'].filter(sf => bt(sf)).map(sf => bt(sf)).join(', ')}).</p>
            <p>Los modelos de Greggio, contra el mejor (Δχ², MF17): ${Object.entries(T.sfh.dchi2_greggio).map(([k, v]) => `${k} ${f2(v, 1)}`).join(', ')}.
            Los de doble degenerada ancha (DDW) quedan desfavorecidos.</p>
            <p class="tenue">Tu χ² es el del juego: los errores de la literatura van simplificados (estadístico y sistemático en cuadratura, sin covarianzas). Los números de arriba son los de la tesis.</p></div>`
        : `<div class="panel"><p>Con solo cuatro puntos hasta z = 0.75, la curva de Δχ² es casi plana: β no queda acotado.
            La tesis encuentra lo mismo: β libre = ${N['sfh.paso2.beta_libre']}, ${N['sfh.paso2.beta_libre_acotado'] ? 'acotado' : 'sin cota'}. Con β fijo por modelo,
            K de SD-Ch = ${N['sfh.paso2.sudare_t11_fina.SD-Ch.K']} ± ${N['sfh.paso2.sudare_t11_fina.SD-Ch.sK_est']} (est.) +${N['sfh.paso2.sudare_t11_fina.SD-Ch.sK_sist_mas']} −${N['sfh.paso2.sudare_t11_fina.SD-Ch.sK_sist_menos']} (sist.) × 10⁻³.</p></div>`;
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
      $('#cc', c).innerHTML = `<div class="panel" id="ccPanel"><h3>Experta: las CC y dos perillas</h3>
        <p>La tasa CC predicha es K_CC ψ. Pero una parte de las CC se pierde detrás del polvo de sus galaxias (las ocultas). Mueve las dos perillas.</p>
        <label class="control"><span>K_CC (× el de la IMF)</span><input type="range" id="fK" min="0.5" max="1.3" step="0.01" value="1"><output id="ofK">1.00</output></label>
        <label class="control"><span>fracción oculta</span><input type="range" id="fo" min="0" max="0.5" step="0.01" value="0"><output id="ofo">0.00</output></label>
        <canvas class="grafico" id="ccg"></canvas>
        <p id="ccl"></p>
        <p><button class="primario" id="volver">Volver al observatorio</button></p></div>`;
      const dib = () => {
        const ctx = Plot.preparar($('#ccg', c)), TT = Plot.ejes(ctx, { x0: 0, x1: 0.5, y0: 0, y1: 2.6, xlabel: 'z', ylabel: 'tasa CC (10⁻⁴ yr⁻¹ Mpc⁻³)' });
        const zs = Array.from({ length: 30 }, (_, i) => 0.01 + 0.49 * i / 29);
        Plot.linea(ctx, TT, zs, zs.map(zz => 1e4 * kcc * CO.psiMF17(zz)), 'rgba(240,96,93,0.4)', 2, [5, 4]);
        Plot.linea(ctx, TT, zs, zs.map(zz => 1e4 * fK * kcc * (1 - fo) * CO.psiMF17(zz)), CL.II, 3);
        for (const b of cc) { const zc = (b.z1 + b.z2) / 2; Plot.linea(ctx, TT, [zc, zc], [b.r_lo, b.r_hi], '#e8ecf8', 2); Plot.puntos(ctx, TT, [zc], [b.r], '#e8ecf8', 5); }
        $('#ccl', c).innerHTML = `El producto es lo que cuenta: K_CC × (1 − f_oculta) = ${f2(fK * (1 - fo), 2)}. Muchas combinaciones dan la misma curva.
          Las tasas CC miden el producto K_CC ψ (1 − f), no cada factor. En la tesis, con MF17 y Kroupa, lo medido sobre lo predicho es
          ${T.sfh.cc.MF17_Kroupa.cociente.map(x => f2(x)).join(' y ')}, y con la fracción de ocultas de Mattila et al. (2012), ${T.sfh.cc.MF17_Kroupa_ocultas.cociente.map(x => f2(x)).join(' y ')}.`;
      };
      $('#fK', c).oninput = e => { fK = +e.target.value; $('#ofK', c).textContent = fK.toFixed(2); dib(); };
      $('#fo', c).oninput = e => { fo = +e.target.value; $('#ofo', c).textContent = fo.toFixed(2); dib(); };
      dib();
      u.desbloquear(m.ensena); u.marcar(m.id, true); u.sonar('fanfarria');
      $('#volver', c).onclick = () => fin({ gana: true });
      u.hablar([['examinador3', 'Entonces, con solo SUDARE, ¿qué puede decir de β?'], ['yo', 'Que no lo acota: cuatro bines hasta z 0.75 no bastan. Con la literatura sí, y K depende de la SFH que elija.']]);
    }
  }

  M.registrar('vivero', vivero);
  M.registrar('linea', linea);
  M.registrar('ajuste', ajuste);
  M.agregar([
    { id: '6.1', cap: 6, titulo: 'El vivero', tipo: 'vivero', donde: 'cielo', ensena: ['imf'],
      contrato: [['directora', 'Ya mides tasas. Ahora la pregunta de fondo: ¿de dónde vienen las supernovas? Sube a la cúpula y mira el cielo: ahí está la fábrica cósmica.']] },
    { id: '6.2', cap: 6, titulo: 'Muchas generaciones', tipo: 'linea', donde: 'cielo', ensena: ['sfh'],
      contrato: [['directora', 'Una generación no basta. El universo forma estrellas todo el tiempo. Mira desde la cúpula cómo se suman sus goteos.']] },
    { id: '6.3', cap: 6, titulo: 'Los controles de la fábrica', tipo: 'ajuste', donde: 'cielo', ensena: ['dtd'],
      contrato: [['directora', 'Ahora ajusta: mueve β, cambia la SFH y mira el χ². Primero con tus tasas solas, después con toda la literatura.']],
      examinador3: [['examinador3', 'Cuando ajuste la DTD, vuelva. Le voy a preguntar qué acotan sus tasas y qué no.']] },
  ]);
})();
