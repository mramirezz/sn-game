// Las misiones de los capítulos 0 y 1 como instrumentos del observatorio. Cada instrumento se abre en un panel
// encima del escenario; el diálogo de los personajes queda sobre el panel, así los números no se tapan.
const Misiones = (() => {
  const F = Fisica, U = Universo;
  const $ = (s, raiz = document) => raiz.querySelector(s);

  const COLOR = { encontrada: '#6ee7a0', debil: '#7f8bb3', nublado: '#b48cff', hueco: '#ff6b6b', fuera: '#5ad1ff', verdad: '#b48cff', ambar: '#ffb84d', cian: '#5ad1ff' };
  const MOTIVOS = [
    ['encontrada', 'encontradas'],
    ['debil', 'muy débiles: nunca sobre tu límite'],
    ['fuera', 'fuera de la temporada: visibles solo antes de la primera noche o después de la última'],
    ['hueco', 'en un hueco de la cadencia: visibles solo entre dos noches observadas'],
    ['nublado', 'nubladas: visibles solo en noches nubladas'],
  ];
  const LARGO = 180, P_NUBE = 0.3;

  // ---------- progreso ----------
  const CLAVE = 'juego-tasas-v1';
  const nuevo = () => ({ desbloqueados: [], misiones: {}, ciencia: 0, ejemplos: {}, contratos: {} });
  function cargar() {
    try {
      const s = JSON.parse(localStorage.getItem(CLAVE));
      if (s && Array.isArray(s.desbloqueados)) return { ...nuevo(), ...s };
    } catch (e) { /* navegador privado o datos rotos: parte de cero */ }
    return nuevo();
  }
  let E = cargar();
  const avisos = []; // lado.js se entera de cada cambio (ciencia, objetivo)
  function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(E)); } catch (e) { /* sin almacenamiento: el progreso dura la sesión */ }
    avisos.forEach(f => f());
  }
  const tiene = id => E.desbloqueados.includes(id);
  const hayProgreso = () => E.desbloqueados.length > 0 || Object.keys(E.misiones).length > 0 || Object.keys(E.contratos).length > 0;
  function reiniciar() { E = nuevo(); guardar(); }
  function desbloquear(ids) {
    const nuevos = ids.filter(id => !tiene(id));
    E.desbloqueados.push(...nuevos);
    guardar();
    return nuevos;
  }
  function marcar(id, ganada) {
    if (ganada && E.misiones[id] !== 'ganada') { E.misiones[id] = 'ganada'; E.ciencia += 10; }
    else if (!E.misiones[id]) E.misiones[id] = 'jugada';
    guardar();
  }

  // ---------- formato ----------
  const f2 = (x, d = 2) => Number.isFinite(x) ? x.toFixed(d) : '∞';
  function sci(x, d = 2) {
    if (!Number.isFinite(x) || x === 0) return { tex: String(x), txt: String(x) };
    const k = Math.floor(Math.log10(Math.abs(x))), m = (x / 10 ** k).toFixed(d);
    const sup = String(k).replace(/./g, c => '⁰¹²³⁴⁵⁶⁷⁸⁹'['0123456789'.indexOf(c)] || '⁻');
    return { tex: `${m}\\times10^{${k}}`, txt: `${m} × 10${sup}` };
  }
  const tex = (el, s) => katex.render(s, el, { displayMode: true, throwOnError: false });
  const marca = '<span class="juego-marca">universo de juego</span>';
  const enlaceCuaderno = id => `<a href="#" data-pagina="${id}">ver en el cuaderno</a>`;
  const mediana = xs => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[s.length >> 1] : NaN; };

  // ---------- misiones (diseño, sección 6, cap. 0 y 1) ----------
  // contrato: lo que dice la directora al darla. abre: lo que se dice al abrir el instrumento.
  const MISIONES = [
    { id: '0.1', cap: 0, titulo: 'Una galaxia', tipo: 'galaxia', donde: 'telescopio', ensena: ['tasa'],
      contrato: [
        ['directora', 'Llegaste. Soy Inés, la directora del observatorio.'],
        ['directora', 'Aquí medimos cuántas supernovas explotan por año en el universo. Eso se llama una tasa.'],
        ['directora', 'Todo lo que se puede tocar tiene una marca. La flecha dorada es lo que toca ahora, lo dorado es importante, lo blanco es opcional y lo que ya viste queda gris.'],
        ['directora', 'Partamos por algo chico: una galaxia como la nuestra. Sube a la cúpula y mírala con el telescopio.'],
        ['directora', 'Corre el tiempo, cuenta cuántas explotan y cuántos años miraste.'],
      ],
      abre: [['operador', 'Te hablo por radio desde la sala. Ahí está tu galaxia.'], ['operador', 'Mantén apretado el botón y adelanto el tiempo: 15 años por segundo. Las supernovas duran poquito, mira bien.']] },
    { id: '0.2', cap: 0, titulo: 'Un cubo de universo', tipo: 'cubo', donde: 'consolas', ensena: ['tasa'],
      contrato: [
        ['directora', 'Una galaxia sola no te dice nada del universo. Necesitas un pedazo de universo: un cubo de 100 Mpc de lado, con miles de galaxias.'],
        ['directora', 'Un telescopio no ve cubos: ve el cielo, plano. Pero si a cada galaxia le mides su distancia, su z, el cielo se vuelve un mapa en 3D.'],
        ['directora', 'Leo tiene ese mapa en las consolas. Cuenta las Ia de un año en el cubo: la tasa por volumen es la que comparan todos los surveys.'],
      ],
      abre: [['operador', 'Primero lo ves como lo ve el telescopio: un pedazo de cielo. Mira cómo cada galaxia se va a su distancia.'],
        ['operador', 'Eso es el cubo: un millón de Mpc³ de universo. Arrástralo para girarlo, corre un año y cuenta.']] },
    { id: '0.3', cap: 0, titulo: 'Repite el universo', tipo: 'repetir', donde: 'consolas', ensena: ['poisson'],
      contrato: [
        ['directora', 'Mismo cubo, mismas leyes, seis semanas de observación. Repite el universo y mira cuánto cambia lo que cuentas.'],
        ['directora', 'Esa variación es el error estadístico. Ningún survey baja de ahí sin contar más supernovas.'],
        ['directora', 'Leo tiene un simulador en las consolas.'],
      ],
      abre: [['operador', 'El simulador repite el mismo cubo cuantas veces quieras: mismas leyes, otra suerte.']] },
    { id: '1.1', cap: 1, titulo: 'Primera temporada', tipo: 'survey', donde: 'consolas', tel: 'chico', zmax: 0.3, tasa: [0.18, 0.35],
      fijo: { campos: 2, tExp: 30, cadencia: 3 }, ensena: ['tiempo_control', 'volumen'],
      contrato: [
        ['directora', 'Ahora un survey de verdad. Te asigné el telescopio chico por 180 noches: dos campos, 30 segundos, cada 3 noches.'],
        ['directora', 'Mide la tasa de Ia hasta z = 0.3. Cuenta lo que encuentres y divide por el tiempo y el volumen.'],
        ['directora', 'La temporada se lanza desde las consolas. Después vemos qué tan bien te fue.'],
      ],
      abre: [['operador', 'Este es el taller del survey. En esta misión el diseño viene fijo: mira la ola y lanza la temporada.']] },
    { id: '1.2', cap: 1, titulo: 'Diseña tu survey', tipo: 'survey', donde: 'consolas', tel: 'chico', zmax: 0.3, tasa: [0.18, 0.35],
      errorMax: 0.30, ensena: [],
      contrato: [
        ['directora', 'Ahora el diseño es tuyo: cuántos campos, cuánto expones y cada cuánto vuelves. Tienes 40 horas.'],
        ['directora', 'El contrato pide un error estadístico menor a 30 %. Piensa qué te da más supernovas: más cielo, más profundidad o más noches.'],
      ],
      abre: [['operador', 'Mueve las perillas. Si te pasas de las horas, no te dejo lanzar.']] },
    { id: '1.3', cap: 1, titulo: 'Telescopio grande', tipo: 'survey', donde: 'consolas', tel: 'grande', zmax: 0.8, tasa: [0.30, 0.55],
      ensena: ['dilatacion'],
      contrato: [
        ['directora', 'Conseguimos tiempo en el telescopio grande: campos de 1 grado cuadrado, pero llega a magnitud 24.'],
        ['directora', 'Mide la tasa de Ia hasta z = 0.8. Usa tu tiempo de control como siempre.'],
      ],
      abre: [['operador', 'El grande ve mucho más lejos. Fíjate en la ola a z alto.']] },
    { id: '1.4', cap: 1, titulo: 'El reloj de allá', tipo: 'survey', donde: 'consolas', tel: 'grande', zmax: 0.8, tasa: [0.30, 0.55],
      errorMax: 0.30, ensena: [],
      contrato: [
        ['directora', 'Mismo telescopio, misma pregunta. Ahora sabes del (1+z).'],
        ['directora', 'Muéstrale al árbitro que tu tasa aguanta, con error menor a 30 %.'],
      ],
      abre: [['operador', 'Último survey del capítulo. Cuando termines, en la niebla puedes lanzar simuladas.']] },
  ];
  const mision = id => MISIONES.find(m => m.id === id);
  // La misión en curso es la primera que no se ha jugado.
  const actual = () => MISIONES.find(m => !E.misiones[m.id]) || null;

  // ---------- el panel del instrumento ----------
  let anim = null, alCerrar = null;
  const panel = () => $('#instrumento'), cont = () => $('#instrumento .contenido');
  const abierto = () => !panel().hidden || !$('#cuaderno').hidden;
  function abrir(titulo, cuandoCierre) {
    panel().hidden = false;
    panel().querySelector('.titulo').textContent = titulo;
    alCerrar = cuandoCierre;
    document.body.classList.add('con-panel');
    return cont();
  }
  function cerrar(res = null) {
    if (anim) { cancelAnimationFrame(anim); anim = null; }
    panel().hidden = true;
    cont().innerHTML = '';
    document.body.classList.toggle('con-panel', !$('#cuaderno').hidden);
    const f = alCerrar; alCerrar = null;
    if (f) f(res);
  }
  function pantalla(fn, ...args) {
    if (anim) { cancelAnimationFrame(anim); anim = null; }
    cont().scrollTop = 0;
    fn(...args);
    enlazar();
  }
  // Los enlaces al cuaderno abren su página encima del instrumento, sin perder la misión.
  function enlazar() {
    cont().querySelectorAll('[data-pagina]').forEach(a => a.onclick = ev => { ev.preventDefault(); cuaderno(a.dataset.pagina); });
  }
  const api = { hablar: (lineas, fin) => fin && fin(), sonido: {} };
  const hablar = (lineas, fin) => api.hablar(lineas, fin);
  const sonar = n => api.sonido[n] && api.sonido[n]();

  // ---------- 0.1 una galaxia: el telescopio ----------
  function galaxia(m, fin) {
    const c = cont();
    c.innerHTML = `
      <canvas class="vista" id="ojo"></canvas>
      <p class="tenue pie">Cada destello es una supernova. La regla de abajo son los años que llevas mirando: cada marca ámbar, una supernova.</p>
      <div class="fila marcador"><span class="dato">Años: <b id="T" style="color:var(--cian)">0</b></span><span class="dato">Supernovas: <b id="N">0</b></span>${marca}</div>
      <p class="fila"><button class="primario grande" id="adelantar">Mantén apretado: adelantar el tiempo</button>
        <button id="cuentaBtn" hidden>Hacer la cuenta</button></p>
      <div id="cuenta" class="cuenta"></div>
      <div id="fin"></div>`;
    const vista = Vista.Galaxia($('#ojo', c)), rand = U.rng(Date.now() % 1e9);
    const tasa = 0.02; // 2 por siglo, universo de juego
    let T = 0, N = 0, corriendo = false, listo = false, explosiones = [], marcas = [], t = 0, ultimo = null;
    const dibujar = ts => {
      const dt = ultimo === null ? 0 : Math.min(0.05, (ts - ultimo) / 1000);
      ultimo = ts; t += dt;
      if (corriendo) {
        const dT = 15 * dt; T += dT;
        const k = U.poisson(rand, tasa * dT);
        for (let i = 0; i < k; i++) { explosiones.push({ i: Math.floor(rand() * vista.n), t0: t }); marcas.push(T); N++; sonar('explosion'); }
      }
      explosiones = explosiones.filter(e => t - e.t0 < 1.6);
      vista.dibujar(t, { T, explosiones: explosiones.map(e => ({ i: e.i, a: (t - e.t0) / 1.6 })), marcas });
      // la cuenta se hace con los años que se ven en pantalla, para que salga igual en una calculadora
      $('#T', c).textContent = Math.round(T); $('#N', c).textContent = N;
      anim = requestAnimationFrame(dibujar);
    };
    anim = requestAnimationFrame(dibujar);
    const btn = $('#adelantar', c);
    btn.addEventListener('pointerdown', e => { e.preventDefault(); corriendo = true; });
    const parar = () => {
      if (!corriendo) return;
      corriendo = false;
      if (Math.round(T) >= 200 && !listo) {
        listo = true; $('#cuentaBtn', c).hidden = false;
        hablar([['operador', `Llevas ${N} supernovas en ${Math.round(T)} años. Puedes seguir mirando, o hacemos la cuenta.`]]);
      }
    };
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => btn.addEventListener(ev, parar));
    $('#cuentaBtn', c).onclick = () => {
      const Nn = N, Tn = Math.round(T), porSiglo = 100 * Nn / Tn;
      btn.disabled = true; $('#cuentaBtn', c).hidden = true;
      const el = $('#cuenta', c);
      el.innerHTML = [`N = <b>${Nn}</b> supernovas`, `T = <b class="cT">${Tn}</b> años`, `N / T = <b>${Nn}</b> ÷ <b class="cT">${Tn}</b>`, `= <b>${(Nn / Tn).toFixed(4)}</b> por año`,
        `× 100 años = <b>${porSiglo.toFixed(1)}</b> por siglo`].map(l => `<div>${l}</div>`).join('');
      // La cuenta queda en pantalla mientras hablan.
      [...el.children].forEach((d, k) => setTimeout(() => { d.classList.add('si'); sonar('blip'); }, 400 + k * 800));
      setTimeout(() => hablar([
        ['operador', `Tu tasa: ${porSiglo.toFixed(1)} supernovas por siglo.`],
        ['directora', 'Te escuché por la radio. La tasa verdadera de esta galaxia, la que puse en el universo del juego, es 2 por siglo.'],
        ['directora', porSiglo.toFixed(1) === '2.0' ? 'Te salió justo. Fue suerte: las explosiones caen al azar.'
          : 'No te salió exacto, y no es un error tuyo: las explosiones caen al azar. Si repites, sale otro número.'],
        ['directora', 'Eso es una tasa: cuántas pasaron, dividido por el tiempo que miraste. En la Vía Láctea son unas pocas por siglo, y el polvo esconde la mayoría.'],
        ['directora', 'Por eso nadie mide tasas mirando una galaxia: hay que mirar miles a la vez. Baja a verme cuando quieras.'],
      ], () => {
        E.ejemplos.tasa = `en tu galaxia contaste ${Nn} supernovas en ${Tn} años: ${Nn} / ${Tn} = ${(Nn / Tn).toFixed(4)} por año, ${porSiglo.toFixed(1)} por siglo. La verdadera era 2 por siglo (universo de juego).`;
        const nuevos = desbloquear(m.ensena); marcar(m.id, true); sonar('fanfarria');
        $('#fin', c).innerHTML = `<div class="panel premio">Misión 0.1 lista. +10 ciencia.
          ${nuevos.length ? `<br>Nueva página en tu cuaderno: <b>La tasa</b>, ${enlaceCuaderno('tasa')}.` : ''}
          <p><button class="primario" id="volver">Volver al observatorio</button></p></div>`;
        enlazar();
        $('#volver', c).onclick = () => fin({ gana: true });
      }), 400 + 5 * 800 + 600);
    };
  }

  // ---------- 0.2 un cubo de universo ----------
  function cubo(m, fin) {
    const c = cont(), rand = U.rng(Date.now() % 1e9);
    const tasa = 0.15 + 0.25 * rand(); // 10^-4 yr^-1 Mpc^-3, universo de juego
    const V = 1e6, porAno = tasa * 1e-4 * V;
    let T = 0, N = 0, corriendo = false, terminado = false, ultimo = null, explosiones = [], marcas = [], t = 0, ecPrevia = '';
    c.innerHTML = `
      <canvas class="vista alto" id="cv"></canvas>
      <p class="tenue pie">El mapa en 3D de un cubo de universo de 100 Mpc por lado. Parte como lo ve el telescopio, un pedazo de cielo plano;
        la distancia de cada galaxia le da la profundidad. Cada destello es una supernova Ia. La regla de abajo es el año que observas. Arrástralo para girarlo.</p>
      <div class="fila"><button class="primario" id="play">Observar un año</button>
        <span class="dato">Días: <b id="T" style="color:var(--cian)">0</b></span><span class="dato">Ia: <b id="N">0</b></span>${marca}</div>
      <div class="ecuacion" id="ec"></div>
      <div id="fin"></div>`;
    const vista = Vista.Cubo($('#cv', c), 9);
    const ecuacion = () => {
      const r = T > 0 ? N / (T / 365.25) / V / 1e-4 : 0;
      const txt = String.raw`r = \frac{\textcolor{#ffb84d}{N}}{\textcolor{#5ad1ff}{T}\,\textcolor{#6ee7a0}{V}} = \frac{\textcolor{#ffb84d}{${N}}}{\textcolor{#5ad1ff}{${f2(T / 365.25)}\,\mathrm{yr}}\times \textcolor{#6ee7a0}{10^{6}\,\mathrm{Mpc^3}}} = ${f2(r)}\times10^{-4}\,\mathrm{yr^{-1}\,Mpc^{-3}}`;
      if (txt !== ecPrevia) { tex($('#ec', c), txt); ecPrevia = txt; }
    };
    const tick = ts => {
      const seg = ultimo === null ? 0 : Math.min(0.05, (ts - ultimo) / 1000);
      ultimo = ts; t += seg;
      if (corriendo && !terminado) {
        const dt = 30 * seg; // 30 días por segundo: un año en ~12 s
        T = Math.min(365, T + dt);
        const k = U.poisson(rand, porAno * dt / 365.25);
        for (let i = 0; i < k; i++) { explosiones.push({ i: Math.floor(rand() * vista.n), t0: t }); marcas.push(T); sonar('blip'); }
        N += k;
        if (T >= 365) terminar();
      }
      explosiones = explosiones.filter(e => t - e.t0 < 1.4);
      // del cielo al mapa: 2 s plano, como lo ve el telescopio, y después cada galaxia se va a su distancia
      const prof = t < 2 ? 0 : Math.min(1, (t - 2) / 3), suave = prof * prof * (3 - 2 * prof);
      const rotulo = t < 2 ? 'lo que ve el telescopio: un pedazo de cielo, sin profundidad' : t < 5.5 ? 'con la distancia (el z) de cada galaxia, el cielo se vuelve un mapa en 3D' : '';
      vista.dibujar(seg, { T, explosiones: explosiones.map(e => ({ i: e.i, a: (t - e.t0) / 1.4 })), marcas, prof: suave, rotulo });
      $('#T', c).textContent = T.toFixed(0); $('#N', c).textContent = N;
      ecuacion();
      anim = requestAnimationFrame(tick);
    };
    anim = requestAnimationFrame(tick);
    $('#play', c).onclick = () => {
      if (terminado) return;
      corriendo = !corriendo;
      $('#play', c).textContent = corriendo ? 'Pausa' : 'Observar un año';
    };
    function terminar() {
      terminado = true; corriendo = false; $('#play', c).disabled = true;
      const r = N / V / 1e-4;
      E.ejemplos.tasa = `en un cubo de 10⁶ Mpc³ contaste ${N} Ia en un año: r = ${f2(r)} × 10⁻⁴ yr⁻¹ Mpc⁻³. La verdadera era ${f2(tasa)} × 10⁻⁴ (universo de juego).`;
      desbloquear(m.ensena); marcar(m.id, true); sonar('fanfarria');
      $('#fin', c).innerHTML = `<div class="panel">
        <p>Tu tasa: <b>${f2(r)} × 10⁻⁴</b> yr⁻¹ Mpc⁻³. La verdadera: <b>${f2(tasa)} × 10⁻⁴</b> ${marca}.</p>
        <p>Aunque viste todas las que explotaron, tu tasa no tiene por qué ser la verdadera: las explosiones caen al azar, y en un año salieron ${N} cuando el promedio es ${f2(porAno, 1)}.</p>
        <p class="tenue">Fíjate en el tamaño del número: 10⁻⁴ por año por Mpc³. Hay que mirar un millón de Mpc³ para ver unas decenas de Ia por año.</p>
        <p><button class="primario" id="volver">Volver al observatorio</button></p></div>`;
      $('#volver', c).onclick = () => fin({ gana: true });
      hablar([['directora', 'Esa diferencia con la verdadera no es un error tuyo. Es el ruido de contar. Baja y te muestro cuánto pesa.']]);
    }
  }

  // ---------- 0.3 repite el universo ----------
  function repetir(m, fin) {
    const c = cont(), rand = U.rng(Date.now() % 1e9);
    const tasa = 0.2 + 0.1 * rand(), V = 1e6, T = 42 / 365.25, lam = tasa * 1e-4 * V * T, kRate = 1 / (V * T) / 1e-4;
    const cuentas = [], dichos = new Set();
    let cubre = 0, revelada = false, t = 0, ultimo = null;
    c.innerHTML = `
      <canvas class="vista alto" id="rep"></canvas>
      <p class="tenue pie">El mismo cubo, las mismas leyes, seis semanas de observación. Cada universo que observas cae como un bloque
        en la columna de lo que contaste. A la derecha aparece su tasa con su barra de error.</p>
      <div class="fila"><button class="primario" id="uno">Observar 1 universo</button><button id="diez" hidden>Observar 10</button>
        <button id="cien" hidden>Observar 100</button><span class="dato">Universos: <b id="n">0</b></span>${marca}</div>
      <div id="ultimo" class="panel tenue">Observa un universo.</div>
      <div id="fin"></div>`;
    const vista = Vista.Repetir($('#rep', c));
    const tick = ts => {
      const dt = ultimo === null ? 0 : Math.min(0.05, (ts - ultimo) / 1000);
      ultimo = ts; t += dt;
      vista.dibujar(t, { cuentas, lam, kRate, revelada, poisson: cuentas.length >= 10, gehrels: F.gehrels });
      anim = requestAnimationFrame(tick);
    };
    anim = requestAnimationFrame(tick);
    const observar = n => {
      const desde = cuentas.length;
      for (let i = 0; i < n; i++) {
        const k = U.poisson(rand, lam), g = F.gehrels(k);
        if (lam >= g.lo && lam <= g.hi) cubre++;
        cuentas.push(k);
      }
      vista.agregar(desde, cuentas.length, t);
      sonar('blip');
      const k0 = cuentas[cuentas.length - 1], g = F.gehrels(k0), nU = cuentas.length;
      const media = cuentas.reduce((a, b) => a + b, 0) / nU;
      $('#n', c).textContent = nU;
      $('#ultimo', c).innerHTML = `<p>Último universo: contaste <b>${k0}</b> Ia en seis semanas. Su tasa es <b>${f2(k0 * kRate)}</b> × 10⁻⁴ yr⁻¹ Mpc⁻³,
        con barra de Gehrels a 1σ de <b>${f2(g.lo * kRate)}</b> a <b>${f2(g.hi * kRate)}</b>: −${f2((k0 - g.lo) * kRate)} hacia abajo y +${f2((g.hi - k0) * kRate)} hacia arriba.</p>
        ${nU > 1 ? `<p>En tus ${nU} universos contaste entre <b>${Math.min(...cuentas)}</b> y <b>${Math.max(...cuentas)}</b>, en promedio <b>${f2(media)}</b>.</p>` : ''}`;
      if (desde === 0) E.ejemplos.poisson = `con N = ${cuentas[0]}, el intervalo de Gehrels a 1σ fue [${f2(F.gehrels(cuentas[0]).lo)}, ${f2(F.gehrels(cuentas[0]).hi)}] supernovas, que divididas por la exposición dan [${f2(F.gehrels(cuentas[0]).lo * kRate)}, ${f2(F.gehrels(cuentas[0]).hi * kRate)}] × 10⁻⁴.`;
      // lo que dicen los personajes en cada hito, una sola vez (si saltas varios hitos de una, se dicen juntos)
      const lineas = [], hito = (clave, ls) => { if (!dichos.has(clave)) { dichos.add(clave); lineas.push(...ls); } };
      hito('1', [['operador', `Contaste ${k0}. A la derecha está tu tasa con su barra de error. Mira los números: la barra es más larga hacia arriba que hacia abajo.`],
        ['operador', 'Ahora repite el mismo universo. Mismas leyes, otra suerte: fíjate si sale el mismo número.']]);
      if (nU >= 3) { $('#diez', c).hidden = false;
        hito('3', [['directora', 'Cada universo da otro N, aunque las leyes son las mismas. Esa dispersión es el ruido de Poisson.'],
          ['directora', 'Ningún survey se libra de él: solo se achica contando más supernovas. Observa de a 10.']]); }
      if (nU >= 10) { $('#cien', c).hidden = false;
        hito('10', [['operador', 'Los puntos cian son lo que predice la distribución de Poisson con la media verdadera. Tus bloques se le van pareciendo.']]); }
      if (nU >= 20) {
        revelada = true;
        hito('20', [['directora', `Ahora te muestro la verdad: la línea violeta. La media era ${f2(lam)} Ia en seis semanas.`],
          ['directora', 'A la derecha, las barras verdes contienen la verdad y las rojas no. Cuenta cuántas son verdes.'],
          ['directora', 'Misión cumplida: abajo te dejé la cuenta. Puedes seguir observando todo lo que quieras, o volver al observatorio.']]);
        if (!$('#volver', c)) cerrarla(); // se aprueba al llegar a 20 universos: salir ya no la deja a medias
        $('#cob', c).innerHTML = `En <b>${(100 * cubre / nU).toFixed(0)} %</b> de tus ${nU} universos, la barra de 1σ contiene la verdad.
          Con N grande una barra de 1σ la contiene el 68 % de las veces. Con N chico la de Gehrels es conservadora: como N solo toma valores enteros,
          aquí cubre cerca del 80 %, y baja hacia 68 % a medida que N crece. Aun así, una de cada cinco veces la verdad queda afuera.
          Por eso el árbitro de este juego acepta tu tasa si la verdad cae dentro de 2σ.`;
      }
      if (lineasDespues.length) { lineas.push(...lineasDespues); lineasDespues.length = 0; }
      if (lineas.length) hablar(lineas);
    };
    const lineasDespues = [];
    $('#uno', c).onclick = () => observar(1);
    $('#diez', c).onclick = () => observar(10);
    $('#cien', c).onclick = () => observar(100);
    function cerrarla() {
      const nuevos = desbloquear(m.ensena); marcar(m.id, true); sonar('fanfarria');
      $('#fin', c).innerHTML = `<div class="panel"><p id="cob"></p></div><div class="panel premio">Misión 0.3 lista. +10 ciencia.
        ${nuevos.length ? `<br>Nueva página: <b>Error estadístico</b>, ${enlaceCuaderno('poisson')}.` : ''}
        <p><button class="primario" id="volver">Volver al observatorio</button></p></div>`;
      enlazar();
      $('#volver', c).onclick = () => fin({ gana: true });
      setTimeout(() => $('#fin', c).scrollIntoView({ block: 'end', behavior: 'smooth' }), 400);
      lineasDespues.push(['operador', 'Ahora viene lo difícil: en un survey de verdad no ves todas las que explotan. La directora te tiene el capítulo 1.']);
    }
  }

  // ---------- capítulo 1: el survey ----------
  // La curva de luz observada a un z, el límite y la ventana visible.
  function dibujarOla(canvas, z, ml, M = -19.3) {
    const ctx = Plot.preparar(canvas), ts = [];
    for (let t = 0.5; t <= 300; t += 1) ts.push(t);
    const ms = ts.map(t => F.magObs(t, z, M));
    const pico = Math.min(...ms.filter(Number.isFinite));
    const T0 = Plot.ejes(ctx, { x0: 0, x1: 300, y0: Math.min(pico, ml) - 1, y1: Math.max(pico, ml) + 3, invertirY: true,
      xlabel: 'días del observador desde la explosión', ylabel: 'magnitud observada' });
    const w = F.ventanaVisible(z, M, ml);
    if (w) Plot.banda(ctx, T0, w[0], w[1], 'rgba(110,231,160,0.15)');
    Plot.linea(ctx, T0, ts, ms, COLOR.ambar);
    Plot.hline(ctx, T0, ml, COLOR.cian, `tu límite ${f2(ml)}`);
    return w;
  }

  function taller(m, fin) {
    const c = cont(), tel = U.TELESCOPIOS[m.tel], maxCampos = m.tel === 'grande' ? 4 : 8;
    const d = { ...(m.fijo || { campos: 2, tExp: tel.tRef, cadencia: 3 }) };
    const tDeSlider = v => Math.round(10 * 90 ** (v / 100)), sliderDeT = t => 100 * Math.log(t / 10) / Math.log(90);
    c.innerHTML = `
      <div class="panel contrato"><h3>Contrato ${m.id}: ${m.titulo}</h3><p class="dato">${tel.nombre}: campos de <b>${tel.campoDeg2} deg²</b>,
        límite de <b>${tel.mRef}</b> mag en ${tel.tRef} s, <b>${tel.horas} h</b> para una temporada de ${LARGO} noches.
        Meta: la tasa de Ia hasta z = ${m.zmax}.${m.errorMax ? ` Error estadístico menor a ${m.errorMax * 100} %.` : ''}</p></div>
      <div class="grilla2">
        <div class="panel">
          <h3>${tel.nombre}</h3>
          <label class="control"><span>Campos</span><input type="range" id="campos" min="1" max="${maxCampos}" step="1"><output id="o-campos"></output></label>
          <label class="control"><span>Exposición</span><input type="range" id="texp" min="0" max="100" step="1"><output id="o-texp"></output></label>
          <label class="control"><span>Cadencia</span><input type="range" id="cad" min="1" max="10" step="1"><output id="o-cad"></output></label>
          ${m.fijo ? '<p class="tenue">En esta misión el diseño viene fijo.</p>' : ''}
          <p class="dato">Límite por noche: <b id="mlim"></b> mag</p>
          <p class="dato">Área: <b id="area"></b> deg² · Noches: <b id="nn"></b> · Horas: <b id="horas"></b> de ${tel.horas}</p>
          <p class="tenue">Exponer 4 veces más te da 0.75 mag más de profundidad: Δm = 1.25 log₁₀(t₂/t₁).
            Hay ${Math.round(P_NUBE * 100)} % de noches nubladas ${marca}.</p>
          <p id="aviso" class="aviso"></p>
          <p><button class="primario" id="lanzar">Lanzar la temporada</button></p>
        </div>
        <div class="panel">
          <h3>La ola: cuánto tiempo se ve una Ia</h3>
          <label class="control"><span>z</span><input type="range" id="z" min="0.01" max="${m.zmax}" step="0.01" value="${(m.zmax / 3).toFixed(2)}"><output id="o-z"></output></label>
          <canvas class="grafico" id="ola"></canvas>
          <p class="dato" id="vent"></p>
        </div>
      </div>`;
    const campos = $('#campos', c), texp = $('#texp', c), cad = $('#cad', c), zr = $('#z', c);
    campos.value = d.campos; texp.value = sliderDeT(d.tExp); cad.value = d.cadencia;
    if (m.fijo) [campos, texp, cad].forEach(i => i.disabled = true);
    const actualizar = () => {
      if (!m.fijo) { d.campos = +campos.value; d.tExp = tDeSlider(+texp.value); d.cadencia = +cad.value; }
      const ml = U.mlim(tel, d.tExp), horas = U.costoHoras(tel, { ...d, largo: LARGO }), z = +zr.value;
      $('#o-campos', c).textContent = d.campos; $('#o-texp', c).textContent = `${d.tExp} s`; $('#o-cad', c).textContent = `${d.cadencia} d`;
      $('#o-z', c).textContent = f2(z);
      $('#mlim', c).textContent = f2(ml); $('#area', c).textContent = d.campos * tel.campoDeg2;
      $('#nn', c).textContent = U.nNoches(d.cadencia, LARGO); $('#horas', c).textContent = f2(horas, 1);
      const pasa = horas > tel.horas;
      $('#lanzar', c).disabled = pasa;
      $('#aviso', c).textContent = pasa ? `Te pasas del presupuesto por ${f2(horas - tel.horas, 1)} h: menos campos, menos exposición o menos noches.` : '';
      const w = dibujarOla($('#ola', c), z, ml);
      $('#vent', c).innerHTML = w ? `A z = ${f2(z)} la Ia está sobre tu límite <b>${f2(w[1] - w[0], 0)} días</b> (del día ${f2(w[0], 0)} al ${f2(w[1], 0)} desde la explosión).`
        : `A z = ${f2(z)} la Ia nunca supera tu límite: ninguna noche la puede ver.`;
    };
    [campos, texp, cad, zr].forEach(i => i.oninput = actualizar);
    actualizar();
    $('#lanzar', c).onclick = () => {
      const seed = Math.floor(Math.random() * 1e9), rand = U.rng(seed);
      const tasa = m.tasa[0] + (m.tasa[1] - m.tasa[0]) * rand();
      const area = d.campos * tel.campoDeg2;
      let uni;
      try { uni = U.crearUniverso({ seed, tasa, zmax: m.zmax, areaDeg2: area, largo: LARGO }); }
      catch (e) { $('#aviso', c).textContent = 'Ese universo es demasiado grande para simularlo. Usa menos campos.'; return; }
      const noches = U.noches({ largo: LARGO, cadencia: d.cadencia, pNube: P_NUBE, rand: U.rng(seed + 1) });
      const ml = U.mlim(tel, d.tExp), obs = U.observar(uni, noches, ml);
      const base = { noches, mlim: ml, areaDeg2: area, zmax: m.zmax, largo: LARGO, previa: uni.previa, M: -19.3 };
      pantalla(temporada, { m, d, tel, seed, uni, noches, mlim: ml, obs, N: obs.filter(s => s.motivo === 'encontrada').length, base }, fin);
    };
  }

  function temporada(p, fin) {
    const c = cont();
    c.innerHTML = `
      <h3>Temporada en curso ${marca}</h3>
      <canvas class="vista campo" id="cielo"></canvas>
      <p class="tenue pie">Tus campos de cielo durante la temporada. Cada punto verde es una supernova que tu telescopio detectó esa noche.</p>
      <canvas class="franja" id="franja"></canvas>
      <div class="fila"><span class="dato">Día <b id="dia">0</b> de ${LARGO}</span>
        <span class="dato">Noches observadas: <b id="obsn">0</b></span><span class="dato">Supernovas encontradas: <b id="enc">0</b></span>
        <button id="saltar">Saltar al final</button></div>`;
    const encontradas = p.obs.filter(s => s.motivo === 'encontrada');
    let dia = 0, terminado = false, ultimo = null, vistas = 0;
    const franja = () => {
      const ctx = Plot.preparar($('#franja', c)), x = t => 8 + (ctx.w - 16) * t / LARGO;
      p.noches.forEach(n => { ctx.fillStyle = n.t <= dia ? (n.despejada ? COLOR.ambar : COLOR.nublado) : '#2c3866'; ctx.fillRect(x(n.t) - 1, 14, 3, 30); });
      ctx.fillStyle = '#e8ecf8'; ctx.fillRect(x(dia), 6, 2, 46);
      ctx.font = '11px system-ui'; ctx.fillStyle = '#9aa6c8';
      ctx.fillText('ámbar: noche despejada · violeta: nublada', 8, 62);
    };
    const paso = ts => {
      const seg = ultimo === null ? 0 : Math.min(0.1, (ts - ultimo) / 1000);
      ultimo = ts;
      dia = Math.min(LARGO, dia + LARGO / 14 * seg); // la temporada dura ~14 s
      const noche = p.noches.filter(n => n.t <= dia).pop();
      const reciente = noche && dia - noche.t < p.d.cadencia;
      const sn = encontradas.filter(s => s.det.some(t => t <= dia && dia - t < 4))
        .map(s => ({ x: s.x, y: s.y, color: COLOR.encontrada, brillo: 1 }));
      Vista.campo($('#cielo', c), { semilla: 31, sn, nube: reciente && !noche.despejada, t: dia });
      franja();
      const nEnc = encontradas.filter(s => s.det[0] <= dia).length;
      if (nEnc > vistas) { vistas = nEnc; sonar('blip'); }
      $('#dia', c).textContent = dia.toFixed(0);
      $('#obsn', c).textContent = p.noches.filter(n => n.t <= dia && n.despejada).length;
      $('#enc', c).textContent = nEnc;
      if (dia >= LARGO) return terminar();
      anim = requestAnimationFrame(paso);
    };
    const terminar = () => {
      if (terminado) return;
      terminado = true;
      const b = $('#saltar', c);
      b.textContent = 'Ver resultado'; b.className = 'primario';
      b.onclick = () => pantalla(resultado, p, fin);
    };
    $('#saltar', c).onclick = () => { dia = LARGO - 0.01; };
    anim = requestAnimationFrame(paso);
  }

  // ---------- estimador según lo desbloqueado ----------
  const NIVELES = {
    contar: { nombre: 'Contar', A: b => U.exposicionContar(b), tex: String.raw`r = \frac{N}{T\,V}` },
    tc: { nombre: '+ tiempo de control y volumen', A: b => U.exposicion({ ...b, dilatacion: false }),
      tex: String.raw`r = \frac{N}{\Omega \sum_z \mathrm{CT}(z)\,\frac{\mathrm{d}V}{\mathrm{d}z}\,\Delta z}` },
    tcz: { nombre: '+ (1+z)', A: b => U.exposicion({ ...b, dilatacion: true }),
      tex: String.raw`r = \frac{N}{\Omega \sum_z \mathrm{CT}(z)\,\frac{1}{1+z}\frac{\mathrm{d}V}{\mathrm{d}z}\,\Delta z}` },
  };
  const nivelActual = () => !tiene('tiempo_control') ? 'contar' : !tiene('dilatacion') ? 'tc' : 'tcz';

  function resultado(p, fin) {
    const c = cont();
    p.nivel = nivelActual();
    p.A = NIVELES[p.nivel].A(p.base);
    p.est = U.estimar(p.N, p.A);
    const { r, lo, hi } = p.est, A = sci(p.A);
    p.errRel = p.N > 0 ? (hi - lo) / 2 / r : Infinity;
    c.innerHTML = `
      <p>Encontraste <b>${p.N}</b> supernovas ${marca}. Tu ecuación tiene los términos que has desbloqueado:</p>
      <div class="ecuacion" id="ec"></div>
      <p class="dato">Tu tasa: <b>${f2(r)}</b> × 10⁻⁴ yr⁻¹ Mpc⁻³, con intervalo de Gehrels a 1σ <b>[${f2(lo)}, ${f2(hi)}]</b>.
        ${p.m.errorMax ? `Error relativo ${Number.isFinite(p.errRel) ? (100 * p.errRel).toFixed(0) + ' %' : 'infinito'}, el contrato pide menos de ${p.m.errorMax * 100} %.` : ''}</p>
      <p class="tenue">Todavía no sabes cuál era la tasa verdadera. Nadie lo sabe en un survey real. Aquí sí se puede mirar.</p>
      <p><button class="primario" id="niebla">Levantar la niebla</button></p>`;
    const V = sci(F.volumen(0, p.m.zmax, F.deg2ASr(p.base.areaDeg2)));
    tex($('#ec', c), p.nivel === 'contar'
      ? String.raw`${NIVELES.contar.tex} = \frac{${p.N}}{${f2(LARGO / 365.25)}\,\mathrm{yr}\times ${V.tex}\,\mathrm{Mpc^3}} = ${f2(r)}\times10^{-4}\,\mathrm{yr^{-1}\,Mpc^{-3}}`
      : String.raw`${NIVELES[p.nivel].tex} = \frac{N}{A} = \frac{${p.N}}{${A.tex}\,\mathrm{yr\,Mpc^3}} = ${f2(r)}\times10^{-4}\,\mathrm{yr^{-1}\,Mpc^{-3}}`);
    $('#niebla', c).onclick = () => pantalla(niebla, p, fin);
  }

  // Una recta con la barra del jugador y, si se pide, la verdad.
  function dibujarRecta(canvas, est, verdad) {
    const ctx = Plot.preparar(canvas), x1 = Math.max(est.hi, verdad ?? 0) * 1.25 + 0.05;
    const T0 = Plot.ejes(ctx, { x0: 0, x1, y0: 0, y1: 1, xlabel: 'tasa [10⁻⁴ yr⁻¹ Mpc⁻³]', margen: { i: 12, d: 12, s: 8, a: 34 }, sinY: true });
    const y = T0.py(0.5), s = (est.hi - est.r);
    ctx.fillStyle = 'rgba(255,184,77,0.18)'; ctx.fillRect(T0.px(Math.max(0, est.r - 2 * (est.r - est.lo))), y - 14, T0.px(est.r + 2 * s) - T0.px(Math.max(0, est.r - 2 * (est.r - est.lo))), 28);
    ctx.strokeStyle = COLOR.ambar; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(T0.px(est.lo), y); ctx.lineTo(T0.px(est.hi), y); ctx.stroke();
    ctx.fillStyle = COLOR.ambar; ctx.beginPath(); ctx.arc(T0.px(est.r), y, 6, 0, 7); ctx.fill();
    if (verdad !== undefined) Plot.vline(ctx, T0, verdad, COLOR.verdad, 'verdadera');
  }

  const LECCIONES = {
    tiempo_control: p => `Tu tasa se calculó con toda la temporada y todo el volumen hasta z = ${p.m.zmax}.
      Pero mira el embudo: las supernovas lejanas nunca superaron tu límite (grises), y las que fueron visibles fuera de la temporada, en un hueco o en noches nubladas no se vieron.
      El <b>tiempo de control</b> (control time) cuenta solo el tiempo en que cada capa de z era visible para ti, noche por noche, y el <b>volumen</b> entra capa por capa.
      Mira los tres paneles de abajo: ahí está cómo se calcula.`,
    volumen: () => '',
    dilatacion: p => {
      const zm = mediana(p.obs.filter(s => s.motivo === 'encontrada').map(s => s.z));
      return `A tu ecuación le falta el reloj. ${Number.isFinite(zm) ? `La mitad de tus supernovas está más allá de z = ${f2(zm)}:` : 'Lejos,'} un año tuyo es menos tiempo allá.
      Explotan menos supernovas por año tuyo que por año de ellas, así que sin corregir la tasa sale baja.
      Dividir por <b>(1+z)</b> pasa tu exposición al reloj de las supernovas. Mira la nueva fila de la tabla.`;
    },
  };

  function niebla(p, fin) {
    const c = cont(), verdad = p.uni.tasa;
    const { r, lo, hi } = p.est;
    const dentro = verdad >= r ? verdad - r <= 2 * (hi - r) : r - verdad <= 2 * (r - lo);
    const contratoOk = !p.m.errorMax || p.errRel <= p.m.errorMax;
    const gana = dentro && contratoOk;
    const veredicto = !dentro
      ? ['mal', `Rechazado. La tasa verdadera (${f2(verdad)}) cae fuera de tus 2σ.`]
      : !contratoOk ? ['medio', `Tu tasa aguanta, pero no te renuevan el telescopio: error de ${Number.isFinite(p.errRel) ? (100 * p.errRel).toFixed(0) : '∞'} % y el contrato pedía ${p.m.errorMax * 100} %.`]
      : ['ok', `Aceptado. La tasa verdadera (${f2(verdad)}) cae dentro de tus 2σ.`];
    const yaGanada = E.misiones[p.m.id] === 'ganada';
    marcar(p.m.id, gana);
    if (gana && !yaGanada && p.m.errorMax) { E.ciencia += 5; guardar(); }
    // Diagnóstico: si falló y el término siguiente que no tiene lo habría salvado, se lo enseña aquí mismo.
    const ensenar = [...p.m.ensena], proximo = ['tiempo_control', 'dilatacion'].find(id => !tiene(id));
    if (!dentro && proximo && !ensenar.includes(proximo)) {
      const e2 = U.estimar(p.N, NIVELES[proximo === 'tiempo_control' ? 'tc' : 'tcz'].A(p.base));
      if (verdad >= e2.r ? verdad - e2.r <= 2 * (e2.hi - e2.r) : e2.r - verdad <= 2 * (e2.r - e2.lo))
        ensenar.push(proximo, ...(proximo === 'tiempo_control' ? ['volumen'] : []));
    }
    const nuevos = desbloquear(ensenar);
    const lecciones = nuevos.filter(id => LECCIONES[id] && LECCIONES[id](p));

    // ejemplos para el cuaderno
    const A = sci(p.A);
    if (p.nivel !== 'contar') E.ejemplos.tiempo_control = `con ${p.N} supernovas y A = ${A.txt} yr Mpc³, tu tasa fue ${f2(r)} × 10⁻⁴ (verdadera ${f2(verdad)}, universo de juego).`;
    if (p.nivel === 'tcz' || nuevos.includes('dilatacion')) {
      const sin = NIVELES.tc.A(p.base), con = NIVELES.tcz.A(p.base);
      E.ejemplos.dilatacion = `en tu temporada hasta z = ${p.m.zmax}, A sin (1+z) era ${sci(sin).txt} y con (1+z) ${sci(con).txt} yr Mpc³: un factor ${f2(sin / con)}.`;
    }
    guardar();

    const cuenta = Object.fromEntries(MOTIVOS.map(([k]) => [k, p.obs.filter(s => s.motivo === k).length]));
    const total = p.obs.length;
    const nivelesVisibles = ['contar', ...(tiene('tiempo_control') ? ['tc'] : []), ...(tiene('dilatacion') ? ['tcz'] : [])];
    const filasNivel = Object.entries(NIVELES).filter(([k]) => nivelesVisibles.includes(k)).map(([k, n]) => {
      const e = U.estimar(p.N, n.A(p.base));
      return `<tr${k === p.nivel ? ' style="color:var(--ambar)"' : ''}><td>${n.nombre}${k === p.nivel ? ' (tu ecuación)' : ''}</td><td>${f2(e.r)}</td><td>${f2(e.r / verdad)}</td></tr>`;
    }).join('');
    const zEnc = p.obs.filter(s => s.motivo === 'encontrada').map(s => s.z);
    const zIni = Number.isFinite(mediana(zEnc)) ? mediana(zEnc) : p.m.zmax / 4;

    c.innerHTML = `
      <div class="veredicto ${veredicto[0]}">${veredicto[1]}</div>
      <canvas class="franja" id="recta" style="height:90px;margin-top:1rem"></canvas>
      <p class="tenue">La barra gruesa es tu 1σ y la zona clara tus 2σ. La línea violeta es la verdad ${marca}.</p>
      ${lecciones.map(id => `<div class="panel leccion"><span class="quien">DIRECTORA</span><div><p>${LECCIONES[id](p)}</p>
        <p>Nueva página en tu cuaderno, ${enlaceCuaderno(id)}.</p></div></div>`).join('')}
      ${!dentro && !lecciones.length ? `<div class="panel leccion"><span class="quien">DIRECTORA</span><div><p>Mira la tabla.
        Si la fila de tu ecuación queda cerca de 1, fue mala suerte: con 2σ, una de cada veinte temporadas falla por azar. Juega otra vez.
        Si queda lejos de 1, a tu ecuación le falta un término que todavía no tienes.</p></div></div>` : ''}
      <div class="grilla2">
        <div class="panel"><h3>Todas las que explotaron: ${total}</h3>
          ${MOTIVOS.map(([k, n]) => `<div class="dato" style="margin:.35rem 0"><i style="display:inline-block;width:${Math.max(2, 100 * cuenta[k] / Math.max(1, total)) * 2.2}px;height:.8em;background:${COLOR[k]};margin-right:.5em"></i><b>${cuenta[k]}</b> ${n}</div>`).join('')}
        </div>
        <div class="panel"><h3>La tasa con cada ecuación</h3>
          <table class="tabla"><tr><th>ecuación</th><th>tasa</th><th>sobre la verdadera</th></tr>${filasNivel}</table>
          <p class="tenue">Verdadera: ${f2(verdad)} × 10⁻⁴. Hay una fila por cada término que tienes: muestra qué habría dado tu temporada con cada versión de la ecuación.</p></div>
      </div>
      <div class="grilla2">
        <div><h3>El campo con todas</h3><canvas class="vista campo" id="mapa"></canvas>
          <div class="leyenda">${MOTIVOS.map(([k, n]) => `<span><i style="background:${COLOR[k]}"></i>${n.split(':')[0]}</span>`).join('')}</div></div>
        <div><h3>En qué z estaban</h3><canvas class="grafico" id="histz"></canvas>
          <div class="leyenda"><span><i style="background:#3a4a80"></i>todas</span><span><i style="background:${COLOR.encontrada}"></i>encontradas</span></div></div>
      </div>
      <h3>Cómo se calcula el tiempo de control</h3>
      <label class="control"><span>z</span><input type="range" id="z" min="0.01" max="${p.m.zmax}" step="0.005" value="${zIni.toFixed(3)}"><output id="o-z"></output></label>
      <div class="grilla3">
        <div><h3>1. La ola</h3><canvas class="grafico" id="ola"></canvas><p class="tenue" id="t-ola"></p></div>
        <div><h3>2. El calendario</h3><canvas class="grafico" id="cal"></canvas><p class="tenue" id="t-cal"></p></div>
        <div><h3>3. El volumen</h3><canvas class="grafico" id="vol"></canvas>
          <div class="leyenda"><span><i style="background:${COLOR.ambar}"></i>CT(z)</span><span><i style="background:${COLOR.cian}"></i>volumen por capa${tiene('dilatacion') ? ' / (1+z)' : ''}</span><span><i style="background:${COLOR.encontrada}"></i>su producto</span></div>
          <p class="tenue">El producto es dónde esperas encontrar supernovas. Su área total es la exposición A.</p></div>
      </div>
      <div class="panel" id="mc">
        <h3>Experta: lanzar simuladas</h3>
        <p>La tesis no suma tiempos de control a mano: lanza supernovas falsas sobre el registro de noches y cuenta qué fracción encuentra (eq:methods:rates:ct).
          Prueba con tu temporada: 20 000 simuladas con z sorteado de n(z) y explosión al azar en la ventana.</p>
        <p>${tiene('dilatacion') ? '<button id="lanzarmc">Lanzar 20 000 simuladas</button>' : '<span class="tenue">Se abre cuando tengas el (1+z), porque la fórmula de la tesis lo usa.</span>'}</p>
        <canvas class="grafico" id="mccv" style="display:none"></canvas><p id="mctxt" class="dato"></p>
      </div>
      <p><button class="primario" id="volver">Volver al observatorio</button> <button id="otra">Jugar otra vez esta misión</button></p>`;

    dibujarRecta($('#recta', c), p.est, verdad);
    Vista.campo($('#mapa', c), { semilla: 31, sn: p.obs.map(s => ({ x: s.x, y: s.y, color: COLOR[s.motivo], brillo: s.motivo === 'encontrada' ? 1 : 0.5 })) });

    // histograma en z
    {
      const ctx = Plot.preparar($('#histz', c)), nb = 20, bordes = [...Array(nb + 1)].map((_, k) => p.m.zmax * k / nb);
      const h = arr => bordes.slice(0, -1).map((a, k) => arr.filter(z => z >= a && z < bordes[k + 1]).length);
      const todas = h(p.obs.map(s => s.z)), enc = h(zEnc);
      const T0 = Plot.ejes(ctx, { x0: 0, x1: p.m.zmax, y0: 0, y1: Math.max(1, ...todas) * 1.1, xlabel: 'z', ylabel: 'supernovas' });
      Plot.barras(ctx, T0, bordes, todas, '#3a4a80'); Plot.barras(ctx, T0, bordes, enc, COLOR.encontrada);
    }

    // los tres paneles del tiempo de control
    const zs = [...Array(100)].map((_, k) => (k + 0.5) * p.m.zmax / 100);
    const ct = zs.map(z => U.tiempoControl(z, -19.3, p.noches, p.mlim, LARGO, p.uni.previa));
    const nz = zs.map(z => F.dVdz(z) / (tiene('dilatacion') ? 1 + z : 1));
    const prod = zs.map((_, k) => ct[k] * nz[k]);
    const norm = a => { const mx = Math.max(...a) || 1; return a.map(v => v / mx); };
    const paneles = () => {
      const z = +$('#z', c).value;
      $('#o-z', c).textContent = f2(z, 3);
      const w = dibujarOla($('#ola', c), z, p.mlim);
      $('#t-ola', c).textContent = w ? `Visible ${f2(w[1] - w[0], 0)} días del observador desde el día ${f2(w[0], 0)} después de explotar.` : 'A este z nunca supera tu límite.';
      // calendario
      const ctx = Plot.preparar($('#cal', c)), iv = U.intervalosControl(z, -19.3, p.noches, p.mlim, LARGO, p.uni.previa);
      const T0 = Plot.ejes(ctx, { x0: -p.uni.previa, x1: LARGO, y0: 0, y1: 1, xlabel: 'fecha de explosión [día de la temporada]', ylabel: '' });
      if (w) p.noches.filter(n => n.despejada).forEach((n, k, arr) => {
        const a = Math.max(n.t - w[1], -p.uni.previa), b = Math.min(n.t - w[0], LARGO), y = 0.62 + 0.3 * k / arr.length;
        Plot.linea(ctx, T0, [a, b], [y, y], 'rgba(255,184,77,0.6)', 1);
      });
      iv.forEach(([a, b]) => Plot.linea(ctx, T0, [a, b], [0.5, 0.5], COLOR.ambar, 6));
      const cerca = p.obs.filter(s => Math.abs(s.z - z) < p.m.zmax / 40);
      cerca.forEach((s, k) => Plot.puntos(ctx, T0, [s.tExp], [0.12 + 0.28 * ((k * 0.618) % 1)], COLOR[s.motivo], 3));
      const ctz = iv.reduce((s, [a, b]) => s + b - a, 0);
      $('#t-cal', c).innerHTML = `Cada línea fina es lo que cubre una noche despejada: las fechas de explosión que esa noche habría visto.
        La línea gruesa es su unión: <b>CT(z) = ${f2(ctz, 0)} días</b>. Los puntos son las supernovas reales cerca de este z, por color de motivo.`;
      // volumen
      const cv = Plot.preparar($('#vol', c));
      const T1 = Plot.ejes(cv, { x0: 0, x1: p.m.zmax, y0: 0, y1: 1.1, xlabel: 'z', ylabel: 'normalizado' });
      Plot.linea(cv, T1, zs, norm(ct), COLOR.ambar); Plot.linea(cv, T1, zs, norm(nz), COLOR.cian); Plot.linea(cv, T1, zs, norm(prod), COLOR.encontrada, 3);
      Plot.vline(cv, T1, z, '#e8ecf8');
    };
    $('#z', c).oninput = paneles;
    paneles();

    // simuladas
    if ($('#lanzarmc', c)) $('#lanzarmc', c).onclick = () => {
      $('#lanzarmc', c).disabled = true; $('#mctxt', c).textContent = 'Simulando…';
      setTimeout(() => {
        const mc = U.exposicionMC({ ...p.base, rand: U.rng(p.seed + 2), nSim: 20000 });
        const an = U.exposicion({ ...p.base, dilatacion: true });
        const cvs = $('#mccv', c); cvs.style.display = 'block';
        const muestra = mc.sims.slice(0, 2000);
        let k = 0;
        const dib = () => {
          k = Math.min(muestra.length, k + 40);
          const ctx = Plot.preparar(cvs);
          const T0 = Plot.ejes(ctx, { x0: -p.uni.previa, x1: LARGO, y0: 0, y1: p.m.zmax, xlabel: 'fecha de explosión', ylabel: 'z' });
          const vis = muestra.slice(0, k);
          Plot.puntos(ctx, T0, vis.filter(s => !s.encontrada).map(s => s.tExp), vis.filter(s => !s.encontrada).map(s => s.z), 'rgba(127,139,179,0.5)', 1.5);
          Plot.puntos(ctx, T0, vis.filter(s => s.encontrada).map(s => s.tExp), vis.filter(s => s.encontrada).map(s => s.z), COLOR.encontrada, 1.8);
          if (k < muestra.length) anim = requestAnimationFrame(dib); else terminarMC();
        };
        const terminarMC = () => {
          $('#mctxt', c).innerHTML = `Encontradas <b>${mc.nSel}</b> de ${mc.nSim} (se dibujan 2000). Exposición por simulación:
            <b>${sci(mc.A).txt}</b> ± ${sci(mc.errA).txt} yr Mpc³. Sumando tiempos de control con (1+z): <b>${sci(an).txt}</b>.
            Cociente ${f2(mc.A / an, 3)}. Son la misma cantidad medida de dos formas.`;
          E.ejemplos.montecarlo = `de ${mc.nSim} simuladas encontraste ${mc.nSel}; A por simulación ${sci(mc.A).txt} contra ${sci(an).txt} yr Mpc³ sumando tiempos de control (cociente ${f2(mc.A / an, 3)}).`;
          const n = desbloquear(['montecarlo']);
          if (n.length) $('#mctxt', c).innerHTML += ` <br>Nueva página: <b>Exposición por simulación</b>, ${enlaceCuaderno('montecarlo')}.`;
          guardar(); enlazar();
        };
        dib();
      }, 30);
    };

    $('#otra', c).onclick = () => pantalla(taller, p.m, fin);
    $('#volver', c).onclick = () => fin({ gana });
    sonar(gana ? 'fanfarria' : 'campana');
    hablar([['directora', gana ? 'Se levantó la niebla y tu tasa aguanta. Mira el embudo: ahí está todo lo que no viste.'
      : lecciones.length ? 'Se levantó la niebla. Tu tasa no aguantó, pero ahora sabes por qué: te dejé una página nueva en el cuaderno.'
      : 'Se levantó la niebla. Mira la tabla antes de culpar a la suerte.']]);
  }

  // ---------- el cuaderno, en su propio panel (puede ir encima de un instrumento) ----------
  function cuaderno(ancla) {
    const p = $('#cuaderno'), c = $('#cuaderno .contenido');
    p.hidden = false; document.body.classList.add('con-panel');
    Cuaderno.render(c, E.desbloqueados, E.ejemplos);
    c.insertAdjacentHTML('beforeend', `<p class="no-imprimir" style="margin-top:2rem"><button id="borrar">Borrar progreso</button></p>`);
    const b = $('#borrar', c);
    b.onclick = () => {
      if (!b.dataset.seguro) { b.dataset.seguro = 1; b.textContent = 'Toca de nuevo para borrar todo'; return; }
      E = nuevo(); guardar(); location.reload();
    };
    c.scrollTop = 0;
    if (ancla && $(`#pag-${ancla}`, c)) $(`#pag-${ancla}`, c).scrollIntoView();
  }
  function cerrarCuaderno() {
    $('#cuaderno').hidden = true;
    document.body.classList.toggle('con-panel', !panel().hidden);
  }

  // ---------- tipos de supernova en números romanos ----------
  // En letra sin serifas "Ia" se lee "la": cada tipo (Ia, Ib/c, II, IIn, IIb...) va en una letra con serifas,
  // como un número romano. Solo cuenta si no hay otra letra pegada, así "Inés" no se toca.
  const TIPO = /(?<![A-Za-zÀ-ÿ0-9])(II(?:n|b|P|L)?|I(?:a|b\/c|bc|b|c)?)(?![A-Za-zÀ-ÿ0-9])/g;
  const escapar = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const conTipos = s => escapar(s).replace(TIPO, '<span class="tipo">$1</span>');
  function marcarTexto(t) {
    const s = t.nodeValue;
    if (!t.parentElement || t.parentElement.closest('.katex, .tipo') || !s.match(TIPO)) return;
    const frag = document.createDocumentFragment();
    let i = 0;
    s.replace(TIPO, (m, g, off) => {
      frag.append(s.slice(i, off));
      const sp = document.createElement('span'); sp.className = 'tipo'; sp.textContent = m; frag.append(sp);
      i = off + m.length;
    });
    frag.append(s.slice(i));
    t.replaceWith(frag);
  }
  function marcarTipos(raiz) {
    if (raiz.nodeType === Node.TEXT_NODE) return marcarTexto(raiz);
    if (raiz.nodeType !== Node.ELEMENT_NODE) return;
    const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT), ts = [];
    while (w.nextNode()) ts.push(w.currentNode);
    ts.forEach(marcarTexto);
  }
  // Todo lo que se escribe en los paneles pasa por aquí, también lo que cambia después (resultados, cuentas).
  const vigia = new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(marcarTipos)));
  ['#instrumento .contenido', '#cuaderno .contenido'].forEach(sel => vigia.observe($(sel), { childList: true, subtree: true }));

  // ---------- abrir la misión en curso ----------
  const PANTALLAS = { galaxia, cubo, repetir, survey: taller };
  // Los capítulos siguientes (js/misiones2.js) agregan sus misiones e instrumentos con estas dos funciones.
  const registrar = (tipo, fn) => { PANTALLAS[tipo] = fn; };
  const agregar = lista => { MISIONES.push(...lista); guardar(); };
  // Un bucle de animación que se corta solo al cerrar el panel o cambiar de pantalla. fn devuelve false para parar.
  function animar(fn) {
    let ultimo = null;
    const paso = ts => {
      const dt = ultimo === null ? 0 : Math.min(0.05, (ts - ultimo) / 1000);
      ultimo = ts;
      if (fn(dt, ts) !== false) anim = requestAnimationFrame(paso);
    };
    anim = requestAnimationFrame(paso);
  }
  const util = { cont, pantalla, enlazar, hablar, sonar, tex, marca, enlaceCuaderno, f2, sci, desbloquear, marcar, guardar, tiene, animar,
    cuaderno: id => cuaderno(id), COLOR };
  function jugar(m, alTerminar) {
    abrir(`${m.id} ${m.titulo}`, alTerminar);
    pantalla(PANTALLAS[m.tipo], m, res => cerrar(res));
    if (m.abre) hablar(m.abre);
  }
  // el ✕ del panel abandona la misión sin resultado
  function salir() { cerrar(null); }

  return {
    get E() { return E; }, MISIONES, mision, actual, tiene, guardar, avisos, api, jugar, salir, abierto,
    cuaderno, cerrarCuaderno, conTipos, hayProgreso, reiniciar, registrar, agregar, util,
  };
})();
