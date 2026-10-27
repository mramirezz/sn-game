// Capítulo 5: el árbitro. El error estadístico (Gehrels) y el sistemático: cada fuente cambia un supuesto, se recalcula la tasa
// y las diferencias se suman en cuadratura, cada una a su lado. Primero en el universo de juego, después con el presupuesto de la tesis.
(() => {
  const M = Misiones, u = M.util, F = Fisica, U = Universo, P = Poblacion, V2 = Vista2, J = window.Juego, C4 = window.Cap4;
  const $ = (s, r = document) => r.querySelector(s);
  const S1 = window.SUDARE1, T = window.TESIS, f2 = u.f2, marca = u.marca, CL = V2.CL, CLASES = V2.CLASES;
  const ZB = [[0.15, 0.45], [0.45, 0.75]];
  const binDe = z => ZB.findIndex(([a, b]) => z >= a && z < b);
  const COLF = { '1': '#ffb84d', '2a': '#b48cff', '4': '#ff6b6b', '5': '#5ad1ff', '6a': '#6ee7a0', '7': '#f0a6ff', '10': '#e8ecf8' };
  const nombreFuente = id => (T.sistematico.fuentes[id] || {}).nombre || id;

  // Error de Gehrels a 1σ sobre N, llevado a la tasa.
  const stat = (r, N) => { const g = F.gehrels(N); return N > 0 ? [r * (1 - g.lo / N), r * (g.hi / N - 1)] : [0, r]; };

  // ---------- 5.1 el árbitro, en el universo de juego ----------
  function arbitro(m, fin) {
    const c = u.cont(), rand = U.rng(Date.now() % 1e9), eSN = T.e_sn.valor;
    let vida = 100, base = null, lista = [], tentado = false, posthoc = { aplicada: false, declarada: false };
    const presupuesto = ZB.map(() => ({})); // fuente -> {mas, menos}
    const cacheA = new Map();
    c.innerHTML = `
      <div class="panel contrato"><h3>El árbitro</h3>
        <p>Tu tasa tiene dos errores. El estadístico sale de contar pocas supernovas (Gehrels). El sistemático sale de tus supuestos:
          cada vez que el cálculo necesita algo que no se mide bien, eliges un valor. El árbitro cambia cada supuesto por una alternativa razonable,
          recalcula y te muestra cuánto se mueve la tasa. Si se mueve fuera de tu barra, esa fuente faltaba en tu presupuesto.</p></div>
      <div class="credibilidad"><span>Credibilidad</span><div class="barra"><i id="vida" style="width:100%"></i></div><span class="dato" id="nvida">100</span></div>
      <p class="fila"><button class="primario" id="empezar">Calcular mi tasa (dos temporadas de SUDARE I)</button><span class="dato" id="prog"></span></p>
      <canvas class="vista alto" id="arena"></canvas>
      <div class="leyenda"><span><i style="background:#ffd166"></i>tu tasa</span><span><i style="background:#ffb84d"></i>barra estadística</span>
        <span><i style="background:#ff6b6b"></i>escudo: barra total (estadística y sistemática en cuadratura)</span><span><i style="background:#b48cff"></i>verdad (al final)</span></div>
      <div id="relato"></div>
      <p class="fila" id="acciones" hidden><button class="primario" id="atacar">Que ataque el árbitro</button>
        <button class="tentacion" id="tentar">Ajustar a la literatura ✨</button>${marca}</p>
      <canvas class="vista" id="cuad" style="height:260px" hidden></canvas>
      <p class="tenue pie" id="pieCuad" hidden>Cada cuadrado es una fuente, de lado Δ (lo que mueve la tasa). El cuadrado rojo tiene la misma área que todos juntos:
        su lado es el error sistemático, √(Σ Δ²). Una fuente grande pesa mucho más que varias chicas.</p>
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
      $('#empezar', c).disabled = true; $('#prog', c).textContent = 'observando y clasificando…';
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
        }, f => { $('#prog', c).textContent = `clasificando ${(100 * f).toFixed(0)} %`; }, () => {
          $('#prog', c).textContent = 'simulando la exposición…';
          setTimeout(() => {
            const N = contar(), A = expo(), r = tasaDe(N, A);
            base = { N, A, r, st: r.map((x, i) => stat(x, N[i])), verdad: tasas.Ia };
            $('#prog', c).textContent = '';
            dibujar();
            $('#relato', c).innerHTML = `<div class="panel"><p>N de Ia por bin: ${N.map(f2).join(' y ')} (suma de probabilidades con P1(z), las PSN a ${T.reglas.peso_psn}).
              La barra ámbar es Gehrels a 1σ sobre ese N: con pocas supernovas es asimétrica, más larga hacia arriba.</p></div>`;
            $('#acciones', c).hidden = false; $('#cuad', c).hidden = false; $('#pieCuad', c).hidden = false;
            ponerCuadrados();
            u.hablar([['examinador2', 'Muy bonita la barra. Pero solo cuenta el azar de contar pocas. ¿Y tus supuestos? Déjeme probarlos uno por uno.']]);
          }, 20);
        });
      });
    };

    // los ataques: fuente, qué cambia y cómo recalcular (N, A o los dos, siempre con la misma regla en reales y simuladas)
    const ATAQUES = [
      { id: '1', que: 'el peso de las PSN', toca: 'N', texto: 'Las supernovas probables pesan 0.5. ¿Y si todas fueran SNe (peso 1) o ninguna (peso 0)?',
        alts: [['peso 0', () => tasaDe(contar({ wpsn: 0 }), base.A)], ['peso 1', () => tasaDe(contar({ wpsn: 1 }), base.A)]] },
      { id: '2a', que: 'el prior de clase', toca: 'N', texto: 'Usaste P1(z). ¿Y con P0 (solo las tasas relativas) o con el P1 global?',
        alts: [['P0', () => tasaDe(contar({ prior: 'P0' }), base.A)], ['P1 global', () => tasaDe(contar({ prior: 'global' }), base.A)]] },
      { id: '4', que: 'el polvo del host', toca: 'A', texto: 'Tu simulación supone un polvo. ¿Y si hubiera la mitad, o 1.5 veces?',
        alts: [['polvo × 0.5', () => tasaDe(base.N, expo({ polvo: 0.5 }))], ['polvo × 1.5', () => tasaDe(base.N, expo({ polvo: 1.5 }))]] },
      { id: '5', que: 'la función de luminosidad', toca: 'A', texto: '¿Y si las Ia fueran 0.2 mag más brillantes, o más débiles, de lo que supones?',
        alts: [['LF − 0.2 mag', () => tasaDe(base.N, expo({ dlf: -0.2 }))], ['LF + 0.2 mag', () => tasaDe(base.N, expo({ dlf: 0.2 }))]] },
      { id: '6a', que: 'el corte de la eficiencia', toca: 'A', texto: 'Cortaste la eficiencia en el m50. ¿Y si el corte estuviera 0.3 o 0.5 mag más débil?',
        alts: [['m50 + 0.3', () => tasaDe(base.N, expo({ corte: 0.3 }))], ['m50 + 0.5', () => tasaDe(base.N, expo({ corte: 0.5 }))]] },
      { id: '7', que: 'el corte de detecciones', toca: 'N y A', texto: 'Pides 4 detecciones. ¿Y con 3, o con 5? El cambio va igual en las reales y en las simuladas.',
        alts: [['n_det ≥ 3', () => tasaDe(contar({ ndet: 3 }), expo({ ndet: 3 }))], ['n_det ≥ 5', () => tasaDe(contar({ ndet: 5 }), expo({ ndet: 5 }))]],
        trampa: () => tasaDe(contar({ ndet: 5 }), base.A) },
    ];
    let ia = 0;
    $('#atacar', c).onclick = () => {
      const at = ATAQUES[ia];
      if (!at) return;
      $('#atacar', c).disabled = true; $('#relato', c).innerHTML = `<div class="panel"><p>El árbitro ataca: <b>${at.que}</b>. ${at.texto} <span class="tenue">calculando…</span></p></div>`;
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
          trampa = `<p>Si cambias el corte solo en las reales (5 detecciones) y dejas la exposición con 4, la tasa sale ${rt.map(f2).join(' y ')}:
            cuenta menos supernovas con la misma exposición. Por eso la regla va igual en las dos. Es la selección simétrica.</p>`;
        }
        $('#relato', c).innerHTML = `<div class="panel"><p>El árbitro ataca: <b>${at.que}</b> (fuente ${at.id} de la tesis: ${nombreFuente(at.id)}). ${at.texto}</p>
          <table class="tabla"><tr><th>bin</th><th>tu tasa</th>${alts.map(([n]) => `<th>${n}</th>`).join('')}<th>al presupuesto</th></tr>${filas.join('')}</table>
          <p>${fuera ? `${fuera} de las alternativas cayó fuera de tu escudo (punto rojo): esa fuente faltaba. Pierdes credibilidad y la fuente entra al presupuesto.`
            : 'Todas las alternativas caen dentro de tu escudo: el ataque no pasa, pero la fuente igual entra al presupuesto con su efecto medido, y el escudo crece.'}</p>${trampa}</div>`;
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
      $('#fin', c).innerHTML = `<div class="panel veredicto mal"><h3>El árbitro gana</h3>
        <p>Ajustar a la literatura es elegir por parecido con la tasa publicada. Es justo lo que la regla 0 de la tesis prohíbe: cada elección se decide
          con un observable de los datos o con la validación en ZTF, nunca por parecido con SUDARE I o con la literatura.
          La literatura es una alarma: si tu tasa cae fuera de su rango, buscas la causa y la declaras, pero no cambias de variante por eso.</p>
        <p><button class="primario" id="otra">Intentarlo de nuevo</button></p></div>`;
      // sin marcar: la misión queda pendiente hasta ganarla
      $('#otra', c).onclick = () => u.pantalla(arbitro, m, fin);
      u.hablar([['examinador2', 'Ajustó a la literatura. Entonces su tasa no mide nada: repite lo que ya sabíamos.']]);
    };

    function momentoPostHoc() {
      $('#post', c).innerHTML = `<div class="panel"><h3>Leo encontró algo</h3>
        <p>Mirando tus candidatos, después de ver tu tasa, Leo encontró fuentes que varían en todas las noches sin subir ni bajar como una supernova: núcleos activos.
          Hay una limpieza correcta (la regla R2 de la tesis): sacar todo candidato que coincide con un AGN o una fuente X, y multiplicar la exposición por 1 − e_SN,
          porque la regla también saca supernovas verdaderas que caen encima por azar.</p>
        <p class="fila"><button id="limpiar">Aplicar la limpieza de AGN</button></p>
        <label class="fila" id="lblDeclarar" hidden><input type="checkbox" id="declarar"> Declararla con fecha: regla adoptada después de ver la tasa, con su efecto</label>
        <p class="fila"><button class="primario" id="presentar">Presentar el resultado</button></p></div>`;
      u.hablar([['operador', 'Ojo, encontré AGN entre tus candidatos. La limpieza es legítima, pero la estás decidiendo después de ver tu tasa.']]);
      $('#limpiar', c).onclick = () => {
        posthoc.aplicada = true; $('#limpiar', c).disabled = true; $('#lblDeclarar', c).hidden = false;
        const N = contar({ r2: true }), r = tasaDe(N, base.A, 1 - eSN);
        const dr = r.map((x, i) => x - base.r[i]);
        base.N = N; base.r = r; base.st = r.map((x, i) => stat(x, N[i]));
        dibujar();
        $('#post', c).querySelector('h3').insertAdjacentHTML('afterend', `<p>Efecto de la limpieza: ${dr.map((d, i) => `z ${ZB[i][0]}-${ZB[i][1]} ${d >= 0 ? '+' : ''}${f2(d)}`).join(', ')}.</p>`);
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
      $('#fin', c).innerHTML = `<div class="panel veredicto ${gana ? 'ok' : 'mal'}"><h3>${gana ? 'Resultado aceptado' : 'Golpe crítico'}</h3>
        ${critico ? '<p>Aplicaste una regla después de ver tu tasa y no lo dijiste. Aunque la regla sea correcta, quien lee no puede saber cuánto de tu resultado viene de elegir mirando. La tesis declara cada una con su fecha, lo que la motivó y su efecto.</p>'
          : `<p>Tu presupuesto tiene ${Object.keys(presupuesto[0]).length} fuentes. ${posthoc.aplicada ? 'La limpieza de AGN quedó declarada como regla adoptada después de ver la tasa.' : 'No aplicaste la limpieza: también es honesto, y la diferencia iría como fuente del sistemático.'}</p>`}
        <p>La verdad ${marca} cae ${dentro.every(Boolean) ? 'dentro de tu barra total en los dos bines' : `dentro de tu barra total en ${dentro.filter(Boolean).length} de 2 bines`}.
          Credibilidad final: ${vida}.</p>
        <p><button class="primario" id="volver">Volver al observatorio</button>${gana ? '' : ' <button id="otra">Intentarlo de nuevo</button>'}</p></div>`;
      if (gana) { u.desbloquear(m.ensena); u.marcar(m.id, true); } // un golpe crítico deja la misión pendiente
      u.sonar(gana ? 'fanfarria' : 'campana');
      $('#volver', c).onclick = () => fin({ gana });
      if (!gana) $('#otra', c).onclick = () => u.pantalla(arbitro, m, fin);
      u.hablar(gana ? [['examinador2', 'Bien. Cada supuesto medido, cada regla tardía con su fecha. Eso se puede defender.']]
        : [['examinador2', 'La regla puede ser buena, pero si no la declara, no le puedo creer el número.']]);
    }
  }

  // ---------- 5.2 el presupuesto de la tesis ----------
  function presupuestoTesis(m, fin) {
    const c = u.cont(), cols = T.sistematico.por_columna;
    let sel = 0, vistas = new Set();
    c.innerHTML = `
      <div class="panel contrato"><h3>El presupuesto de error de la tesis</h3>
        <p>Cada fuente reemplaza un supuesto por una alternativa razonable y recalcula la tasa con todo lo demás fijo. Si hay alternativas a los dos lados,
          cada una va a su lado. Una sola alternativa va solo al lado donde cae, sin simetrizar. El total de cada lado es la suma en cuadratura.</p></div>
      <p class="fila" id="bines">${cols.map((col, i) => `<button data-i="${i}">${col.columna}${col.no_usar ? ' (no es resultado)' : ''}</button>`).join('')}</p>
      <canvas class="vista" id="tornado"></canvas>
      <canvas class="vista" id="cuad" style="height:270px"></canvas>
      <p class="tenue pie">Cada cuadrado es una fuente, de lado Δ, y aparecen de a uno. El rojo crece hasta tener la misma área que todos juntos: su lado es el total.
        Abajo, la suma lineal (ámbar) contra la cuadratura (rojo): la cuadratura siempre queda más corta, y la manda la fuente más grande.</p>
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
      V2.texto(g, angosto ? `${col.columna}: tasa ${f2(col.r)}` : `${col.columna}: tasa ${f2(col.r)} · cada fuente mueve la tasa hacia abajo (izquierda) o hacia arriba (derecha)`, 10, 16, { tam: 12, color: '#e8ecf8' });
      g.strokeStyle = 'rgba(232,236,248,0.4)'; g.beginPath(); g.moveTo(cx, 26); g.lineTo(cx, h - 10); g.stroke();
      const fila = (y, nombre, menos, mas, color, grueso) => {
        V2.texto(g, nombre, mi - 8, y + alto / 2 + 4, { tam: 11, alin: 'right', color: grueso ? '#e8ecf8' : '#aab3d0' });
        g.fillStyle = color; g.fillRect(cx - menos * esc, y + 3, menos * esc, alto - 6); g.fillRect(cx, y + 3, mas * esc, alto - 6);
        if (menos > 0.004) V2.texto(g, `−${f2(menos)}`, cx - menos * esc - 4, y + alto / 2 + 4, { tam: 10, alin: 'right' });
        if (mas > 0.004) V2.texto(g, `+${f2(mas)}`, cx + mas * esc + 4, y + alto / 2 + 4, { tam: 10 });
      };
      fs.forEach((f, k) => fila(28 + k * alto, `${f.id} ${(T.sistematico.fuentes[f.id] || {}).nombre?.split(' (')[0] || ''}`.slice(0, angosto ? 15 : 40), f.menos, f.mas, 'rgba(255,107,107,0.75)'));
      fila(28 + fs.length * alto, angosto ? 'sistemático' : 'total sistemático (cuadratura)', col.total.menos, col.total.mas, '#ff6b6b', true);
      fila(28 + (fs.length + 1) * alto, angosto ? 'estadístico' : 'estadístico (Gehrels 1σ)', col.stat[0], col.stat[1], '#ffb84d', true);
      // los cuadrados de la cuadratura, lado abajo y lado arriba
      cuad52.poner([
        { titulo: 'hacia abajo (−)', fuentes: fs.map(f => ({ id: f.id, d: f.menos, color: 'rgba(255,107,107,0.85)' })) },
        { titulo: 'hacia arriba (+)', fuentes: fs.map(f => ({ id: f.id, d: f.mas, color: 'rgba(255,184,77,0.85)' })) }]);
      const dom = [...fs].sort((a, b) => b.menos - a.menos)[0], domMas = [...fs].sort((a, b) => b.mas - a.mas)[0];
      $('#lectura', c).innerHTML = `<div class="panel"><p>La fuente que más empuja hacia abajo es <b>${dom.id}</b> (${nombreFuente(dom.id)}): −${f2(dom.menos)}.
        Hacia arriba, <b>${domMas.id}</b> (${nombreFuente(domMas.id)}): +${f2(domMas.mas)}.</p>
        <p>Total: −${f2(col.total.menos)} / +${f2(col.total.mas)}, contra el estadístico −${f2(col.stat[0])} / +${f2(col.stat[1])}.
          ${col.total.menos + col.total.mas > col.stat[0] + col.stat[1] ? 'Aquí manda el sistemático.' : 'Aquí manda el estadístico: hay pocas supernovas.'}</p>
        ${info.length ? `<p class="tenue">Van aparte, como información y sin entrar al total: ${info.map(([id]) => `${id} (${nombreFuente(id)})`).join(', ')}.</p>` : ''}
        ${col.no_usar ? '<p class="tenue">Este bin se calcula pero no es resultado de la tesis.</p>' : ''}</div>`;
      vistas.add(sel);
      if (vistas.has(0) && vistas.size >= 2) libro();
    }
    c.querySelectorAll('#bines button').forEach(b => b.onclick = () => { sel = +b.dataset.i; mostrar(); });
    mostrar();
    function libro() {
      if ($('#volver', c)) return;
      $('#libro', c).innerHTML = `<div class="panel"><h3>El libro de las reglas tardías</h3>
        <p>Estas reglas se adoptaron con la tasa ya calculada, después de ver un resultado que no calzaba. Cada una tiene su justificación propia,
          pero el orden importa para leer los números: la tesis las declara con su fecha, lo que la motivó y su efecto.</p>
        <table class="tabla libro"><tr>${Object.keys(T.posthoc[0]).map(k => `<th>${k}</th>`).join('')}</tr>
          ${T.posthoc.map(f => `<tr>${Object.values(f).map(v => `<td>${v}</td>`).join('')}</tr>`).join('')}</table>
        <p class="tenue">Leído de docs/reglas_tasa_sudare.md, sección 7 (md5 ${T.generado.textos['reglas_tasa_sudare.md'].slice(0, 8)}).</p>
        <p><button class="primario" id="volver">Volver al observatorio</button></p></div>`;
      u.desbloquear(m.ensena); u.marcar(m.id, true); u.sonar('fanfarria');
      $('#volver', c).onclick = () => fin({ gana: true });
      const c0 = cols[0], d0 = Object.entries(c0.fuentes).filter(([, v]) => v.en_total).sort((x, y) => y[1].menos - x[1].menos)[0];
      u.hablar([['examinadora1', `Su bin de Ia ${c0.columna.slice(3)} tiene la barra sistemática más grande hacia abajo, −${f2(c0.total.menos)}. ¿Qué la domina?`],
        ['yo', `La fuente ${d0[0]}, ${nombreFuente(d0[0])}: −${f2(d0[1].menos)}. Con ${f2(T.principal.bins[0].N, 1)} Ia en ese bin, cualquier supuesto que mueva una fracción de supernova pesa mucho.`]]);
    }
  }

  M.registrar('arbitro', arbitro);
  M.registrar('presupuesto', presupuestoTesis);
  M.agregar([
    { id: '5.1', cap: 5, titulo: 'El árbitro', tipo: 'arbitro', donde: 'atril', ensena: ['sistematicos'],
      contrato: [
        ['directora', 'Ya tienes una tasa. Ahora hay que defenderla. En la sala del comité hay un árbitro que va a atacar cada uno de tus supuestos.'],
        ['directora', 'Una advertencia: en el atril hay un botón dorado para ajustar a la literatura. No lo toques.'],
      ],
      examinador2: [['examinador2', 'Párese en el atril y muéstreme su tasa. Después vemos cuánto aguanta.']] },
    { id: '5.2', cap: 5, titulo: 'El presupuesto de la tesis', tipo: 'presupuesto', donde: 'atril', ensena: [],
      contrato: [['directora', 'Ahora el de verdad: el presupuesto de error de la tesis, fuente por fuente y bin por bin. Míralo en el atril.']] },
  ]);
})();
