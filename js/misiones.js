// Las misiones de los capítulos 0 y 1 como instrumentos del observatorio. Cada instrumento se abre en un panel
// encima del escenario; el diálogo de los personajes queda sobre el panel, así los números no se tapan.
const Misiones = (() => {
  const F = Fisica, U = Universo;
  const $ = (s, raiz = document) => raiz.querySelector(s);

  const COLOR = { encontrada: '#6ee7a0', debil: '#7f8bb3', nublado: '#b48cff', hueco: '#ff6b6b', fuera: '#5ad1ff', verdad: '#b48cff', ambar: '#ffb84d', cian: '#5ad1ff' };
  const MOTIVOS = [
    ['encontrada', Lg('encontradas', 'found')],
    ['debil', Lg('muy débiles: nunca sobre tu límite', 'too faint: never above your limit')],
    ['fuera', Lg('fuera de la temporada: visibles solo antes de la primera noche o después de la última', 'outside the season: visible only before the first night or after the last')],
    ['hueco', Lg('en un hueco de la cadencia: visibles solo entre dos noches observadas', 'in a cadence gap: visible only between two observed nights')],
    ['nublado', Lg('nubladas: visibles solo en noches nubladas', 'clouded out: visible only on cloudy nights')],
  ];
  const sne = n => Lg('supernovas', n === 1 ? 'supernova' : 'supernovae'); // el plural inglés depende de n
  const TEL_EN = { chico: 'Small telescope', grande: 'Large telescope' }; // el nombre viene en castellano de universo.js
  const LARGO = 180, P_NUBE = 0.3;

  // ---------- progreso ----------
  const CLAVE = 'juego-tasas-v1';
  const nuevo = () => ({ desbloqueados: [], misiones: {}, ciencia: 0, ejemplos: {}, contratos: {} });
  function cargar() {
    try {
      const s = JSON.parse(localStorage.getItem(CLAVE));
      if (s && Array.isArray(s.desbloqueados)) {
        const e = { ...nuevo(), ...s };
        if (e.misiones['0.1'] && !e.desbloqueados.includes('contar')) e.desbloqueados.unshift('contar');
        if (e.ejemplos.tasa && !e.ejemplos.contar && /galaxia|galaxy/.test(e.ejemplos.tasa)) { e.ejemplos.contar = e.ejemplos.tasa; delete e.ejemplos.tasa; }
        return e;
      }
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
  const marca = `<span class="juego-marca">${Lg('universo de juego', 'game universe')}</span>`;
  const enlaceCuaderno = id => `<a href="#" data-pagina="${id}">${Lg('ver en el cuaderno', 'see in the notebook')}</a>`;
  const mediana = xs => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[s.length >> 1] : NaN; };

  // ---------- misiones (diseño, sección 6, cap. 0 y 1) ----------
  // contrato: lo que dice la directora al darla. abre: lo que se dice al abrir el instrumento.
  const MISIONES = [
    { id: '0.1', cap: 0, titulo: Lg('Una galaxia', 'One galaxy'), tipo: 'galaxia', donde: 'telescopio', ensena: ['contar'],
      contrato: [
        ['directora', Lg('Llegaste. Soy Inés, la directora del observatorio.', 'You made it. I am Inés, the director of the observatory.')],
        ['directora', Lg('Aquí medimos cuántas supernovas explotan por año en el universo. Eso se llama una tasa.', 'Here we measure how many supernovae explode per year in the universe. That is called a rate.')],
        // solo en castellano: el nombre del juego está en inglés
        ...(IDIOMA === 'es' ? [['directora', 'En inglés se dice rate. Por eso el juego se llama SN Rates: las tasas de supernovas.']] : []),
        ['directora', Lg('Todo lo que se puede tocar tiene una marca. La flecha dorada es lo que toca ahora, lo dorado es importante, lo blanco es opcional y lo que ya viste queda gris.', 'Everything you can touch has a marker. The golden arrow shows what comes next. Gold is important, white is optional, and what you have already seen turns grey.')],
        ['directora', Lg('Partamos por algo chico: una galaxia como la nuestra. Sube a la cúpula y mírala con el telescopio.', "Let's start small: a galaxy like ours. Go up to the dome and look at it through the telescope.")],
        ['directora', Lg('Corre el tiempo, cuenta cuántas explotan y cuántos años miraste.', 'Run the clock, count how many explode and how many years you watched.')],
      ],
      abre: [['operador', Lg('Te hablo por radio desde la sala. Ahí está tu galaxia.', 'I am talking to you by radio from the control room. There is your galaxy.')], ['operador', Lg('Mantén apretado el botón y adelanto el tiempo: 15 años por segundo. Las supernovas duran poquito, mira bien.', 'Hold the button down and I fast-forward time: 15 years per second. Supernovae fade fast, so watch closely.')]] },
    { id: '0.2', cap: 0, titulo: Lg('Un cubo de universo', 'A cube of universe'), tipo: 'cubo', donde: 'consolas', ensena: ['tasa'],
      contrato: [
        ['directora', Lg('Una galaxia sola no te dice nada del universo. Necesitas un pedazo de universo: un cubo de 100 Mpc de lado, con miles de galaxias.', 'One galaxy alone tells you nothing about the universe. You need a piece of universe: a cube 100 Mpc on a side, with thousands of galaxies.')],
        ['directora', Lg('Un telescopio no ve cubos: ve el cielo, plano. Pero si a cada galaxia le mides su distancia, su z, el cielo se vuelve un mapa en 3D.', 'A telescope does not see cubes. It sees the sky, flat. But if you measure the distance of each galaxy, its z, the sky becomes a 3D map.')],
        ['directora', Lg('Leo tiene ese mapa en las consolas. Cuenta las Ia de un año en el cubo: la tasa por volumen es la que comparan todos los surveys.', 'Leo has that map at the consoles. Count the Ia in the cube over one year. The rate per volume is the one every survey compares.')],
      ],
      abre: [['operador', Lg('Primero lo ves como lo ve el telescopio: un pedazo de cielo. Mira cómo cada galaxia se va a su distancia.', 'First you see it as the telescope does: a patch of sky. Watch each galaxy move out to its distance.')],
        ['operador', Lg('Eso es el cubo: un millón de Mpc³ de universo. Arrástralo para girarlo, corre un año y cuenta.', 'That is the cube: a million Mpc³ of universe. Drag it to turn it, run one year and count.')]] },
    { id: '0.3', cap: 0, titulo: Lg('Repite el universo', 'Repeat the universe'), tipo: 'repetir', donde: 'consolas', ensena: ['poisson'],
      contrato: [
        ['directora', Lg('Mismo cubo, mismas leyes, seis semanas de observación. Repite el universo y mira cuánto cambia lo que cuentas.', 'Same cube, same laws, six weeks of observing. Repeat the universe and see how much your count changes.')],
        ['directora', Lg('Esa variación es el error estadístico. Ningún survey baja de ahí sin contar más supernovas.', 'That variation is the statistical error. No survey gets below it without counting more supernovae.')],
        ['directora', Lg('Leo tiene un simulador en las consolas.', 'Leo has a simulator at the consoles.')],
      ],
      abre: [['operador', Lg('El simulador repite el mismo cubo cuantas veces quieras: mismas leyes, otra suerte.', 'The simulator repeats the same cube as many times as you like: same laws, different luck.')]] },
    { id: '1.1', cap: 1, titulo: Lg('Primera temporada', 'First season'), tipo: 'survey', donde: 'consolas', tel: 'chico', zmax: 0.3, tasa: [0.18, 0.35],
      fijo: { campos: 2, tExp: 30, cadencia: 3 }, ensena: ['tiempo_control', 'volumen'],
      contrato: [
        ['directora', Lg('Ahora un survey de verdad. Te asigné el telescopio chico por 180 noches: dos campos, 30 segundos, cada 3 noches.', 'Now a real survey. I gave you the small telescope for 180 nights: two fields, 30 seconds, every 3 nights.')],
        ['directora', Lg('Mide la tasa de Ia hasta z = 0.3. Cuenta lo que encuentres y divide por el tiempo y el volumen.', 'Measure the Ia rate up to z = 0.3. Count what you find and divide by the time and the volume.')],
        ['directora', Lg('La temporada se lanza desde las consolas. Después vemos qué tan bien te fue.', 'You launch the season from the consoles. Then we see how well you did.')],
      ],
      abre: [['operador', Lg('Este es el taller del survey. En esta misión el diseño viene fijo: mira la ola y lanza la temporada.', 'This is the survey workshop. In this mission the design is fixed: look at the wave and launch the season.')]] },
    { id: '1.2', cap: 1, titulo: Lg('Diseña tu survey', 'Design your survey'), tipo: 'survey', donde: 'consolas', tel: 'chico', zmax: 0.3, tasa: [0.18, 0.35],
      errorMax: 0.30, ensena: [],
      contrato: [
        ['directora', Lg('Ahora el diseño es tuyo: cuántos campos, cuánto expones y cada cuánto vuelves. Tienes 40 horas.', 'Now the design is yours: how many fields, how long you expose and how often you come back. You have 40 hours.')],
        ['directora', Lg('El contrato pide un error estadístico menor a 30 %. Piensa qué te da más supernovas: más cielo, más profundidad o más noches.', 'The contract asks for a statistical error below 30 %. Think about what gives you more supernovae: more sky, more depth or more nights.')],
      ],
      abre: [['operador', Lg('Mueve las perillas. Si te pasas de las horas, no te dejo lanzar.', 'Turn the knobs. If you go over the hours, I will not let you launch.')]] },
    { id: '1.3', cap: 1, titulo: Lg('Telescopio grande', 'Large telescope'), tipo: 'survey', donde: 'consolas', tel: 'grande', zmax: 0.8, tasa: [0.30, 0.55],
      ensena: ['dilatacion'],
      contrato: [
        ['directora', Lg('Conseguimos tiempo en el telescopio grande: campos de 1 grado cuadrado, pero llega a magnitud 24.', 'We got time on the large telescope: fields of 1 square degree, but it reaches magnitude 24.')],
        ['directora', Lg('Mide la tasa de Ia hasta z = 0.8. Usa tu tiempo de control como siempre.', 'Measure the Ia rate up to z = 0.8. Use your control time as usual.')],
      ],
      abre: [['operador', Lg('El grande ve mucho más lejos. Fíjate en la ola a z alto.', 'The large one sees much farther. Look at the wave at high z.')]] },
    { id: '1.4', cap: 1, titulo: Lg('El reloj de allá', 'The clock out there'), tipo: 'survey', donde: 'consolas', tel: 'grande', zmax: 0.8, tasa: [0.30, 0.55],
      errorMax: 0.30, ensena: [],
      contrato: [
        ['directora', Lg('Mismo telescopio, misma pregunta. Ahora sabes del (1+z).', 'Same telescope, same question. Now you know about the (1+z).')],
        ['directora', Lg('Muéstrale al árbitro que tu tasa aguanta, con error menor a 30 %.', 'Show the referee that your rate holds up, with an error below 30 %.')],
      ],
      abre: [['operador', Lg('Último survey del capítulo. Cuando termines, en la niebla puedes lanzar simuladas.', 'Last survey of the chapter. When you finish, you can launch simulated supernovae in the fog.')]] },
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
      <p class="tenue pie">${Lg('Cada destello es una supernova. La regla de abajo son los años que llevas mirando: cada marca ámbar, una supernova.', 'Each flash is a supernova. The ruler below shows the years you have been watching. Each amber tick is one supernova.')}</p>
      <div class="fila marcador"><span class="dato">${Lg('Años', 'Years')}: <b id="T" style="color:var(--cian)">0</b></span><span class="dato">${Lg('Supernovas', 'Supernovae')}: <b id="N">0</b></span>${marca}</div>
      <p class="fila"><button class="primario grande" id="adelantar">${Lg('Mantén apretado: adelantar el tiempo', 'Hold down: fast-forward time')}</button>
        <button id="cuentaBtn" hidden>${Lg('Hacer la cuenta', 'Do the maths')}</button></p>
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
        hablar([['operador', Lg(`Llevas ${N} supernovas en ${Math.round(T)} años. Puedes seguir mirando, o hacemos la cuenta.`,
          `You have ${N} ${sne(N)} in ${Math.round(T)} years. You can keep watching, or we do the maths.`)]]);
      }
    };
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => btn.addEventListener(ev, parar));
    $('#cuentaBtn', c).onclick = () => {
      const Nn = N, Tn = Math.round(T), porSiglo = 100 * Nn / Tn;
      btn.disabled = true; $('#cuentaBtn', c).hidden = true;
      const el = $('#cuenta', c);
      el.innerHTML = [`N = <b>${Nn}</b> ${sne(Nn)}`, `T = <b class="cT">${Tn}</b> ${Lg('años', 'years')}`, `N / T = <b>${Nn}</b> ÷ <b class="cT">${Tn}</b>`, `= <b>${(Nn / Tn).toFixed(4)}</b> ${Lg('por año', 'per year')}`,
        `× 100 ${Lg('años', 'years')} = <b>${porSiglo.toFixed(1)}</b> ${Lg('por siglo', 'per century')}`].map(l => `<div>${l}</div>`).join('');
      // La cuenta queda en pantalla mientras hablan.
      [...el.children].forEach((d, k) => setTimeout(() => { d.classList.add('si'); sonar('blip'); }, 400 + k * 800));
      setTimeout(() => hablar([
        ['operador', Lg(`Tu tasa: ${porSiglo.toFixed(1)} supernovas por siglo.`, `Your rate: ${porSiglo.toFixed(1)} supernovae per century.`)],
        ['directora', Lg('Te escuché por la radio. La tasa verdadera de esta galaxia, la que puse en el universo del juego, es 2 por siglo.', 'I heard you on the radio. The true rate of this galaxy, the one I put in the game universe, is 2 per century.')],
        ['directora', porSiglo.toFixed(1) === '2.0' ? Lg('Te salió justo. Fue suerte: las explosiones caen al azar.', 'You got it spot on. That was luck: explosions happen at random.')
          : Lg('No te salió exacto, y no es un error tuyo: las explosiones caen al azar. Si repites, sale otro número.', 'It is not exact, and that is not your mistake: explosions happen at random. If you repeat it, you get another number.')],
        ['directora', Lg('Eso es una tasa: cuántas pasaron, dividido por el tiempo que miraste. En la Vía Láctea son unas pocas por siglo, y el polvo esconde la mayoría.', 'That is a rate: how many happened, divided by the time you watched. In the Milky Way it is a few per century, and dust hides most of them.')],
        ['directora', Lg('Por eso nadie mide tasas mirando una galaxia: hay que mirar miles a la vez. Baja a verme cuando quieras.', 'That is why nobody measures rates by watching one galaxy. You have to watch thousands at once. Come down and see me whenever you like.')],
      ], () => {
        E.ejemplos.contar = Lg(`en tu galaxia contaste ${Nn} supernovas en ${Tn} años: ${Nn} / ${Tn} = ${(Nn / Tn).toFixed(4)} por año, ${porSiglo.toFixed(1)} por siglo. La verdadera era 2 por siglo (universo de juego).`,
          `in your galaxy you counted ${Nn} ${sne(Nn)} in ${Tn} years: ${Nn} / ${Tn} = ${(Nn / Tn).toFixed(4)} per year, ${porSiglo.toFixed(1)} per century. The true rate was 2 per century (game universe).`);
        const nuevos = desbloquear(m.ensena); marcar(m.id, true); sonar('fanfarria');
        $('#fin', c).innerHTML = `<div class="panel premio">${Lg('Misión 0.1 lista. +10 ciencia.', 'Mission 0.1 complete. +10 science.')}
          ${nuevos.length ? `<br>${Lg('Nueva página en tu cuaderno: <b>Contar</b>', 'New page in your notebook: <b>Counting</b>')}, ${enlaceCuaderno('contar')}.` : ''}
          <p><button class="primario" id="volver">${Lg('Volver al observatorio', 'Back to the observatory')}</button></p></div>`;
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
      <p class="tenue pie">${Lg(`El mapa en 3D de un cubo de universo de 100 Mpc por lado. Parte como lo ve el telescopio, un pedazo de cielo plano;
        la distancia de cada galaxia le da la profundidad. Cada destello es una supernova Ia. La regla de abajo es el año que observas. Arrástralo para girarlo.`,
        `The 3D map of a cube of universe 100 Mpc on a side. It starts as the telescope sees it, a flat patch of sky.
        The distance of each galaxy gives it depth. Each flash is a Type Ia supernova. The ruler below is the year you observe. Drag it to turn it.`)}</p>
      <div class="fila"><button class="primario" id="play">${Lg('Observar un año', 'Observe one year')}</button>
        <span class="dato">${Lg('Días', 'Days')}: <b id="T" style="color:var(--cian)">0</b></span><span class="dato">Ia: <b id="N">0</b></span>${marca}</div>
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
      const rotulo = t < 2 ? Lg('lo que ve el telescopio: un pedazo de cielo, sin profundidad', 'what the telescope sees: a patch of sky, with no depth')
        : t < 5.5 ? Lg('con la distancia (el z) de cada galaxia, el cielo se vuelve un mapa en 3D', 'with the distance (the z) of each galaxy, the sky becomes a 3D map') : '';
      vista.dibujar(seg, { T, explosiones: explosiones.map(e => ({ i: e.i, a: (t - e.t0) / 1.4 })), marcas, prof: suave, rotulo });
      $('#T', c).textContent = T.toFixed(0); $('#N', c).textContent = N;
      ecuacion();
      anim = requestAnimationFrame(tick);
    };
    anim = requestAnimationFrame(tick);
    $('#play', c).onclick = () => {
      if (terminado) return;
      corriendo = !corriendo;
      $('#play', c).textContent = corriendo ? Lg('Pausa', 'Pause') : Lg('Observar un año', 'Observe one year');
    };
    function terminar() {
      terminado = true; corriendo = false; $('#play', c).disabled = true;
      const r = N / V / 1e-4;
      E.ejemplos.tasa = Lg(`en un cubo de 10⁶ Mpc³ contaste ${N} Ia en un año: r = ${f2(r)} × 10⁻⁴ yr⁻¹ Mpc⁻³. La verdadera era ${f2(tasa)} × 10⁻⁴ (universo de juego).`,
        `in a cube of 10⁶ Mpc³ you counted ${N} Ia in one year: r = ${f2(r)} × 10⁻⁴ yr⁻¹ Mpc⁻³. The true rate was ${f2(tasa)} × 10⁻⁴ (game universe).`);
      const nuevos = desbloquear(m.ensena); marcar(m.id, true); sonar('fanfarria');
      $('#fin', c).innerHTML = `<div class="panel">
        ${nuevos.length ? `<p>${Lg('Nueva página en tu cuaderno: <b>La tasa por volumen</b>', 'New page in your notebook: <b>The rate per volume</b>')}, ${enlaceCuaderno('tasa')}.</p>` : ''}
        <p>${Lg('Tu tasa', 'Your rate')}: <b>${f2(r)} × 10⁻⁴</b> yr⁻¹ Mpc⁻³. ${Lg('La verdadera', 'The true one')}: <b>${f2(tasa)} × 10⁻⁴</b> ${marca}.</p>
        <p>${Lg(`Aunque viste todas las que explotaron, tu tasa no tiene por qué ser la verdadera: las explosiones caen al azar, y en un año salieron ${N} cuando el promedio es ${f2(porAno, 1)}.`,
          `You saw every one that exploded, and still your rate need not be the true one. Explosions happen at random, and in one year you got ${N} when the average is ${f2(porAno, 1)}.`)}</p>
        <p class="tenue">${Lg('Fíjate en el tamaño del número: 10⁻⁴ por año por Mpc³. Hay que mirar un millón de Mpc³ para ver unas decenas de Ia por año.', 'Look at the size of the number: 10⁻⁴ per year per Mpc³. You have to watch a million Mpc³ to see a few tens of Ia per year.')}</p>
        <p><button class="primario" id="volver">${Lg('Volver al observatorio', 'Back to the observatory')}</button></p></div>`;
      enlazar();
      $('#volver', c).onclick = () => fin({ gana: true });
      hablar([['directora', Lg('Esa diferencia con la verdadera no es un error tuyo. Es el ruido de contar. Baja y te muestro cuánto pesa.', 'That difference from the true rate is not your mistake. It is counting noise. Come down and I will show you how much it matters.')]]);
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
      <p class="tenue pie">${Lg(`El mismo cubo, las mismas leyes, seis semanas de observación. Cada universo que observas cae como un bloque
        en la columna de lo que contaste. A la derecha aparece su tasa con su barra de error.`,
        `The same cube, the same laws, six weeks of observing. Each universe you observe drops as a block
        into the column of what you counted. On the right you see its rate with its error bar.`)}</p>
      <p class="tenue pie" id="leyenda"></p>
      <div class="fila"><button class="primario" id="uno">${Lg('Observar 1 universo', 'Observe 1 universe')}</button><button id="diez" hidden>${Lg('Observar 10', 'Observe 10')}</button>
        <button id="cien" hidden>${Lg('Observar 100', 'Observe 100')}</button><span class="dato">${Lg('Universos', 'Universes')}: <b id="n">0</b></span>${marca}</div>
      <div id="ultimo" class="panel tenue">${Lg('Observa un universo.', 'Observe a universe.')}</div>
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
      // la cuenta de la barra del último universo, paso a paso y con sus números
      const tAnos = f2(T, 3), raiz = Math.sqrt(k0), nSobre = k0 ? Lg(` Con N = ${k0} el σ sería √${k0} = ${f2(raiz)}, y N ± σ daría de ${f2(k0 - raiz)} a ${f2(k0 + raiz)}: con tan pocas, Poisson no es simétrica y ese ± queda corto hacia arriba.`,
        ` With N = ${k0} the σ would be √${k0} = ${f2(raiz)}, and N ± σ would give ${f2(k0 - raiz)} to ${f2(k0 + raiz)}: with so few, Poisson is not symmetric and that ± falls short upwards.`) : '';
      $('#ultimo', c).innerHTML = Lg(`<p>Último universo: contaste <b>N = ${k0}</b> Ia en seis semanas (T = ${tAnos} años), dentro del cubo (V = 10⁶ Mpc³).</p>
        <p>Su tasa: N / (T·V) = ${k0} / (${tAnos} × 10⁶) = <b>${f2(k0 * kRate)}</b> × 10⁻⁴ yr⁻¹ Mpc⁻³.</p>
        <p>Su barra (de Gehrels, a 1σ): con N = ${k0}, las medias verdaderas que pudieron darte ese conteo van de <b>${f2(g.lo)}</b> a <b>${f2(g.hi)}</b> Ia.
        Divididas igual por T·V, la barra va de <b>${f2(g.lo * kRate)}</b> a <b>${f2(g.hi * kRate)}</b> × 10⁻⁴.${nSobre}</p>
        ${nU > 1 ? `<p>En tus ${nU} universos contaste entre <b>${Math.min(...cuentas)}</b> y <b>${Math.max(...cuentas)}</b>, en promedio <b>${f2(media)}</b>.</p>` : ''}`,
        `<p>Last universe: you counted <b>N = ${k0}</b> Ia in six weeks (T = ${tAnos} years), inside the cube (V = 10⁶ Mpc³).</p>
        <p>Its rate: N / (T·V) = ${k0} / (${tAnos} × 10⁶) = <b>${f2(k0 * kRate)}</b> × 10⁻⁴ yr⁻¹ Mpc⁻³.</p>
        <p>Its bar (Gehrels, at 1σ): with N = ${k0}, the true means that could have given you that count go from <b>${f2(g.lo)}</b> to <b>${f2(g.hi)}</b> Ia.
        Divided by T·V in the same way, the bar goes from <b>${f2(g.lo * kRate)}</b> to <b>${f2(g.hi * kRate)}</b> × 10⁻⁴.${nSobre}</p>
        ${nU > 1 ? `<p>In your ${nU} universes you counted between <b>${Math.min(...cuentas)}</b> and <b>${Math.max(...cuentas)}</b>, <b>${f2(media)}</b> on average.</p>` : ''}`);
      $('#leyenda', c).innerHTML = nU >= 20
        ? Lg(`Barras de la derecha: <b style="color:#6ee7a0">verde</b>, la barra contiene la media verdadera (la línea violeta); <b style="color:#ff6b6b">roja</b>, no la contiene. Van <b>${cubre}</b> verdes de ${nU} (${(100 * cubre / nU).toFixed(0)} %).`,
          `Bars on the right: <b style="color:#6ee7a0">green</b>, the bar contains the true mean (the violet line). <b style="color:#ff6b6b">Red</b>, it does not. So far <b>${cubre}</b> green out of ${nU} (${(100 * cubre / nU).toFixed(0)} %).`)
        : Lg(`A los 20 universos se revela la media verdadera, y cada barra se pinta de verde si la contiene o de rojo si no.`, `At 20 universes the true mean is revealed, and each bar turns green if it contains it or red if it does not.`);
      if (desde === 0) {
        const g0 = F.gehrels(cuentas[0]);
        E.ejemplos.poisson = Lg(`con N = ${cuentas[0]}, el intervalo de Gehrels a 1σ fue [${f2(g0.lo)}, ${f2(g0.hi)}] supernovas, que divididas por la exposición dan [${f2(g0.lo * kRate)}, ${f2(g0.hi * kRate)}] × 10⁻⁴.`,
          `with N = ${cuentas[0]}, the 1σ Gehrels interval was [${f2(g0.lo)}, ${f2(g0.hi)}] supernovae, which divided by the exposure give [${f2(g0.lo * kRate)}, ${f2(g0.hi * kRate)}] × 10⁻⁴.`);
      }
      // lo que dicen los personajes en cada hito, una sola vez (si saltas varios hitos de una, se dicen juntos)
      const lineas = [], hito = (clave, ls) => { if (!dichos.has(clave)) { dichos.add(clave); lineas.push(...ls); } };
      hito('1', [['operador', Lg(`Contaste ${k0}. A la derecha está tu tasa con su barra de error, y debajo del gráfico te dejo la cuenta de dónde sale. Fíjate: la barra es más larga hacia arriba que hacia abajo.`,
        `You counted ${k0}. On the right is your rate with its error bar, and below the plot I left you the arithmetic of where it comes from. Notice: the bar is longer upwards than downwards.`)],
        ['operador', Lg('Ahora repite el mismo universo. Mismas leyes, otra suerte: fíjate si sale el mismo número.', 'Now repeat the same universe. Same laws, different luck. See whether you get the same number.')]]);
      if (nU >= 3) { $('#diez', c).hidden = false;
        hito('3', [['directora', Lg('Cada universo da otro N, aunque las leyes son las mismas. Esa dispersión es el ruido de Poisson.', 'Each universe gives a different N, even though the laws are the same. That scatter is Poisson noise.')],
          ['directora', Lg('Ningún survey se libra de él: solo se achica contando más supernovas. Observa de a 10.', 'No survey escapes it. It only shrinks if you count more supernovae. Observe 10 at a time.')]]); }
      if (nU >= 10) { $('#cien', c).hidden = false;
        hito('10', [['operador', Lg('Los puntos cian son lo que predice la distribución de Poisson con la media verdadera. Tus bloques se le van pareciendo.', 'The cyan dots are what the Poisson distribution predicts with the true mean. Your blocks are starting to look like it.')]]); }
      if (nU >= 20) {
        revelada = true;
        hito('20', [['directora', Lg(`Ahora te muestro la verdad: la línea violeta. La media era ${f2(lam)} Ia en seis semanas.`, `Now I show you the truth: the violet line. The mean was ${f2(lam)} Ia in six weeks.`)],
          ['directora', Lg('A la derecha, las barras verdes contienen la verdad y las rojas no. Cuenta cuántas son verdes.', 'On the right, the green bars contain the truth and the red ones do not. Count how many are green.')],
          ['directora', Lg('Misión cumplida: abajo te dejé la cuenta. Puedes seguir observando todo lo que quieras, o volver al observatorio.', 'Mission accomplished. I left you the count below. You can keep observing as much as you like, or go back to the observatory.')]]);
        if (!$('#volver', c)) cerrarla(); // se aprueba al llegar a 20 universos: salir ya no la deja a medias
        const pct = (100 * cubre / nU).toFixed(0);
        $('#cob', c).innerHTML = Lg(`En <b>${pct} %</b> de tus ${nU} universos, la barra de 1σ contiene la verdad.
          Con N grande una barra de 1σ la contiene el 68 % de las veces. Con N chico la de Gehrels es conservadora: como N solo toma valores enteros,
          aquí cubre cerca del 80 %, y baja hacia 68 % a medida que N crece. Aun así, una de cada cinco veces la verdad queda afuera.
          Por eso el árbitro de este juego acepta tu tasa si la verdad cae dentro de 2σ.`,
          `In <b>${pct} %</b> of your ${nU} universes, the 1σ bar contains the truth.
          With large N a 1σ bar contains it 68 % of the time. With small N the Gehrels bar is conservative: since N only takes whole values,
          here it covers about 80 %, and it drops towards 68 % as N grows. Even so, one time in five the truth falls outside.
          That is why the referee in this game accepts your rate if the truth falls within 2σ.`);
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
      $('#fin', c).innerHTML = `<div class="panel"><p id="cob"></p></div><div class="panel premio">${Lg('Misión 0.3 lista. +10 ciencia.', 'Mission 0.3 complete. +10 science.')}
        ${nuevos.length ? `<br>${Lg('Nueva página: <b>Error estadístico</b>', 'New page: <b>Statistical error</b>')}, ${enlaceCuaderno('poisson')}.` : ''}
        <p><button class="primario" id="volver">${Lg('Volver al observatorio', 'Back to the observatory')}</button></p></div>`;
      enlazar();
      $('#volver', c).onclick = () => fin({ gana: true });
      setTimeout(() => $('#fin', c).scrollIntoView({ block: 'end', behavior: 'smooth' }), 400);
      lineasDespues.push(['operador', Lg('Ahora viene lo difícil: en un survey de verdad no ves todas las que explotan. La directora te tiene el capítulo 1.', 'Now comes the hard part: in a real survey you do not see every one that explodes. The director has chapter 1 ready for you.')]);
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
      xlabel: Lg('días del observador desde la explosión', 'observer-frame days since explosion'), ylabel: Lg('magnitud observada', 'observed magnitude') });
    const w = F.ventanaVisible(z, M, ml);
    if (w) Plot.banda(ctx, T0, w[0], w[1], 'rgba(110,231,160,0.15)');
    Plot.linea(ctx, T0, ts, ms, COLOR.ambar);
    Plot.hline(ctx, T0, ml, COLOR.cian, `${Lg('tu límite', 'your limit')} ${f2(ml)}`);
    return w;
  }

  function taller(m, fin) {
    const c = cont(), tel = U.TELESCOPIOS[m.tel], maxCampos = m.tel === 'grande' ? 4 : 8;
    const telNombre = Lg(tel.nombre, TEL_EN[m.tel] || tel.nombre);
    const d = { ...(m.fijo || { campos: 2, tExp: tel.tRef, cadencia: 3 }) };
    const tDeSlider = v => Math.round(10 * 90 ** (v / 100)), sliderDeT = t => 100 * Math.log(t / 10) / Math.log(90);
    c.innerHTML = `
      <div class="panel contrato"><h3>${Lg('Contrato', 'Contract')} ${m.id}: ${m.titulo}</h3><p class="dato">${Lg(`${telNombre}: campos de <b>${tel.campoDeg2} deg²</b>,
        límite de <b>${tel.mRef}</b> mag en ${tel.tRef} s, <b>${tel.horas} h</b> para una temporada de ${LARGO} noches.
        Meta: la tasa de Ia hasta z = ${m.zmax}.${m.errorMax ? ` Error estadístico menor a ${m.errorMax * 100} %.` : ''}`,
        `${telNombre}: fields of <b>${tel.campoDeg2} deg²</b>,
        limit of <b>${tel.mRef}</b> mag in ${tel.tRef} s, <b>${tel.horas} h</b> for a season of ${LARGO} nights.
        Goal: the Ia rate up to z = ${m.zmax}.${m.errorMax ? ` Statistical error below ${m.errorMax * 100} %.` : ''}`)}</p></div>
      <div class="grilla2">
        <div class="panel">
          <h3>${telNombre}</h3>
          <label class="control"><span>${Lg('Campos', 'Fields')}</span><input type="range" id="campos" min="1" max="${maxCampos}" step="1"><output id="o-campos"></output></label>
          <label class="control"><span>${Lg('Exposición', 'Exposure')}</span><input type="range" id="texp" min="0" max="100" step="1"><output id="o-texp"></output></label>
          <label class="control"><span>${Lg('Cadencia', 'Cadence')}</span><input type="range" id="cad" min="1" max="10" step="1"><output id="o-cad"></output></label>
          ${m.fijo ? `<p class="tenue">${Lg('En esta misión el diseño viene fijo.', 'In this mission the design is fixed.')}</p>` : ''}
          <p class="dato">${Lg('Límite por noche', 'Limit per night')}: <b id="mlim"></b> mag</p>
          <p class="dato">${Lg('Área', 'Area')}: <b id="area"></b> deg² · ${Lg('Noches', 'Nights')}: <b id="nn"></b> · ${Lg('Horas', 'Hours')}: <b id="horas"></b> ${Lg('de', 'of')} ${tel.horas}</p>
          <p class="tenue">${Lg(`Exponer 4 veces más te da 0.75 mag más de profundidad: Δm = 1.25 log₁₀(t₂/t₁).
            Hay ${Math.round(P_NUBE * 100)} % de noches nubladas`, `Exposing 4 times longer gives you 0.75 mag more depth: Δm = 1.25 log₁₀(t₂/t₁).
            ${Math.round(P_NUBE * 100)} % of the nights are cloudy`)} ${marca}.</p>
          <p id="aviso" class="aviso"></p>
          <p><button class="primario" id="lanzar">${Lg('Lanzar la temporada', 'Launch the season')}</button></p>
        </div>
        <div class="panel">
          <h3>${Lg('La ola: cuánto tiempo se ve una Ia', 'The wave: how long an Ia stays visible')}</h3>
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
      $('#aviso', c).textContent = pasa ? Lg(`Te pasas del presupuesto por ${f2(horas - tel.horas, 1)} h: menos campos, menos exposición o menos noches.`,
        `You are ${f2(horas - tel.horas, 1)} h over budget: fewer fields, less exposure or fewer nights.`) : '';
      const w = dibujarOla($('#ola', c), z, ml);
      $('#vent', c).innerHTML = w ? Lg(`A z = ${f2(z)} la Ia está sobre tu límite <b>${f2(w[1] - w[0], 0)} días</b> (del día ${f2(w[0], 0)} al ${f2(w[1], 0)} desde la explosión).`,
        `At z = ${f2(z)} the Ia stays above your limit for <b>${f2(w[1] - w[0], 0)} days</b> (from day ${f2(w[0], 0)} to day ${f2(w[1], 0)} after explosion).`)
        : Lg(`A z = ${f2(z)} la Ia nunca supera tu límite: ninguna noche la puede ver.`, `At z = ${f2(z)} the Ia never gets above your limit: no night can see it.`);
    };
    [campos, texp, cad, zr].forEach(i => i.oninput = actualizar);
    actualizar();
    $('#lanzar', c).onclick = () => {
      const seed = Math.floor(Math.random() * 1e9), rand = U.rng(seed);
      const tasa = m.tasa[0] + (m.tasa[1] - m.tasa[0]) * rand();
      const area = d.campos * tel.campoDeg2;
      let uni;
      try { uni = U.crearUniverso({ seed, tasa, zmax: m.zmax, areaDeg2: area, largo: LARGO }); }
      catch (e) { $('#aviso', c).textContent = Lg('Ese universo es demasiado grande para simularlo. Usa menos campos.', 'That universe is too big to simulate. Use fewer fields.'); return; }
      const noches = U.noches({ largo: LARGO, cadencia: d.cadencia, pNube: P_NUBE, rand: U.rng(seed + 1) });
      const ml = U.mlim(tel, d.tExp), obs = U.observar(uni, noches, ml);
      const base = { noches, mlim: ml, areaDeg2: area, zmax: m.zmax, largo: LARGO, previa: uni.previa, M: -19.3 };
      pantalla(temporada, { m, d, tel, seed, uni, noches, mlim: ml, obs, N: obs.filter(s => s.motivo === 'encontrada').length, base }, fin);
    };
  }

  function temporada(p, fin) {
    const c = cont();
    c.innerHTML = `
      <h3>${Lg('Temporada en curso', 'Season in progress')} ${marca}</h3>
      <canvas class="vista campo" id="cielo"></canvas>
      <p class="tenue pie">${Lg('Tus campos de cielo durante la temporada. Cada punto verde es una supernova que tu telescopio detectó esa noche.', 'Your sky fields during the season. Each green dot is a supernova your telescope detected that night.')}</p>
      <canvas class="franja" id="franja"></canvas>
      <div class="fila"><span class="dato">${Lg('Día', 'Day')} <b id="dia">0</b> ${Lg('de', 'of')} ${LARGO}</span>
        <span class="dato">${Lg('Noches observadas', 'Nights observed')}: <b id="obsn">0</b></span><span class="dato">${Lg('Supernovas encontradas', 'Supernovae found')}: <b id="enc">0</b></span>
        <button id="saltar">${Lg('Saltar al final', 'Skip to the end')}</button></div>`;
    const encontradas = p.obs.filter(s => s.motivo === 'encontrada');
    let dia = 0, terminado = false, ultimo = null, vistas = 0;
    const franja = () => {
      const ctx = Plot.preparar($('#franja', c)), x = t => 8 + (ctx.w - 16) * t / LARGO;
      p.noches.forEach(n => { ctx.fillStyle = n.t <= dia ? (n.despejada ? COLOR.ambar : COLOR.nublado) : '#2c3866'; ctx.fillRect(x(n.t) - 1, 14, 3, 30); });
      ctx.fillStyle = '#e8ecf8'; ctx.fillRect(x(dia), 6, 2, 46);
      ctx.font = '11px system-ui'; ctx.fillStyle = '#9aa6c8';
      ctx.fillText(Lg('ámbar: noche despejada · violeta: nublada', 'amber: clear night · violet: cloudy'), 8, 62);
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
      b.textContent = Lg('Ver resultado', 'See result'); b.className = 'primario';
      b.onclick = () => pantalla(resultado, p, fin);
    };
    $('#saltar', c).onclick = () => { dia = LARGO - 0.01; };
    anim = requestAnimationFrame(paso);
  }

  // ---------- estimador según lo desbloqueado ----------
  const NIVELES = {
    contar: { nombre: Lg('Contar', 'Counting'), A: b => U.exposicionContar(b), tex: String.raw`r = \frac{N}{T\,V}` },
    tc: { nombre: Lg('+ tiempo de control y volumen', '+ control time and volume'), A: b => U.exposicion({ ...b, dilatacion: false }),
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
      <p>${Lg(`Encontraste <b>${p.N}</b> supernovas ${marca}. Tu ecuación tiene los términos que has desbloqueado:`,
        `You found <b>${p.N}</b> ${sne(p.N)} ${marca}. Your equation has the terms you have unlocked:`)}</p>
      <div class="ecuacion" id="ec"></div>
      <p class="dato">${Lg(`Tu tasa: <b>${f2(r)}</b> × 10⁻⁴ yr⁻¹ Mpc⁻³, con intervalo de Gehrels a 1σ <b>[${f2(lo)}, ${f2(hi)}]</b>.`,
        `Your rate: <b>${f2(r)}</b> × 10⁻⁴ yr⁻¹ Mpc⁻³, with a 1σ Gehrels interval <b>[${f2(lo)}, ${f2(hi)}]</b>.`)}
        ${p.m.errorMax ? Lg(`Error relativo ${Number.isFinite(p.errRel) ? (100 * p.errRel).toFixed(0) + ' %' : 'infinito'}, el contrato pide menos de ${p.m.errorMax * 100} %.`,
          `Relative error ${Number.isFinite(p.errRel) ? (100 * p.errRel).toFixed(0) + ' %' : 'infinite'}, the contract asks for less than ${p.m.errorMax * 100} %.`) : ''}</p>
      <p class="tenue">${Lg('Todavía no sabes cuál era la tasa verdadera. Nadie lo sabe en un survey real. Aquí sí se puede mirar.', 'You do not know the true rate yet. Nobody does in a real survey. Here you can look.')}</p>
      <p><button class="primario" id="niebla">${Lg('Levantar la niebla', 'Lift the fog')}</button></p>`;
    const V = sci(F.volumen(0, p.m.zmax, F.deg2ASr(p.base.areaDeg2)));
    tex($('#ec', c), p.nivel === 'contar'
      ? String.raw`${NIVELES.contar.tex} = \frac{${p.N}}{${f2(LARGO / 365.25)}\,\mathrm{yr}\times ${V.tex}\,\mathrm{Mpc^3}} = ${f2(r)}\times10^{-4}\,\mathrm{yr^{-1}\,Mpc^{-3}}`
      : String.raw`${NIVELES[p.nivel].tex} = \frac{N}{A} = \frac{${p.N}}{${A.tex}\,\mathrm{yr\,Mpc^3}} = ${f2(r)}\times10^{-4}\,\mathrm{yr^{-1}\,Mpc^{-3}}`);
    $('#niebla', c).onclick = () => pantalla(niebla, p, fin);
  }

  // Una recta con la barra del jugador y, si se pide, la verdad.
  function dibujarRecta(canvas, est, verdad) {
    const ctx = Plot.preparar(canvas), x1 = Math.max(est.hi, verdad ?? 0) * 1.25 + 0.05;
    const T0 = Plot.ejes(ctx, { x0: 0, x1, y0: 0, y1: 1, xlabel: `${Lg('tasa', 'rate')} [10⁻⁴ yr⁻¹ Mpc⁻³]`, margen: { i: 12, d: 12, s: 8, a: 34 }, sinY: true });
    const y = T0.py(0.5), s = (est.hi - est.r);
    ctx.fillStyle = 'rgba(255,184,77,0.18)'; ctx.fillRect(T0.px(Math.max(0, est.r - 2 * (est.r - est.lo))), y - 14, T0.px(est.r + 2 * s) - T0.px(Math.max(0, est.r - 2 * (est.r - est.lo))), 28);
    ctx.strokeStyle = COLOR.ambar; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(T0.px(est.lo), y); ctx.lineTo(T0.px(est.hi), y); ctx.stroke();
    ctx.fillStyle = COLOR.ambar; ctx.beginPath(); ctx.arc(T0.px(est.r), y, 6, 0, 7); ctx.fill();
    if (verdad !== undefined) Plot.vline(ctx, T0, verdad, COLOR.verdad, Lg('verdadera', 'true'));
  }

  const LECCIONES = {
    tiempo_control: p => Lg(`Tu tasa se calculó con toda la temporada y todo el volumen hasta z = ${p.m.zmax}.
      Pero mira el embudo: las supernovas lejanas nunca superaron tu límite (grises), y las que fueron visibles fuera de la temporada, en un hueco o en noches nubladas no se vieron.
      El <b>tiempo de control</b> (control time) cuenta solo el tiempo en que cada capa de z era visible para ti, noche por noche, y el <b>volumen</b> entra capa por capa.
      Mira los tres paneles de abajo: ahí está cómo se calcula.`,
      `Your rate used the whole season and the whole volume up to z = ${p.m.zmax}.
      But look at the funnel: the distant supernovae never got above your limit (grey), and those visible only outside the season, in a gap or on cloudy nights were never seen.
      The <b>control time</b> counts only the time when each z shell was visible to you, night by night, and the <b>volume</b> enters shell by shell.
      Look at the three panels below: they show how it is calculated.`),
    volumen: () => '',
    dilatacion: p => {
      const zm = mediana(p.obs.filter(s => s.motivo === 'encontrada').map(s => s.z));
      return Lg(`A tu ecuación le falta el reloj. ${Number.isFinite(zm) ? `La mitad de tus supernovas está más allá de z = ${f2(zm)}:` : 'Lejos,'} un año tuyo es menos tiempo allá.
      Explotan menos supernovas por año tuyo que por año de ellas, así que sin corregir la tasa sale baja.
      Dividir por <b>(1+z)</b> pasa tu exposición al reloj de las supernovas. Mira la nueva fila de la tabla.`,
      `Your equation is missing the clock. ${Number.isFinite(zm) ? `Half of your supernovae are beyond z = ${f2(zm)}, and there` : 'Far away,'} one of your years is less time.
      Fewer supernovae explode per year of yours than per year of theirs, so without the correction the rate comes out low.
      Dividing by <b>(1+z)</b> moves your exposure onto the supernovae's clock. Look at the new row in the table.`);
    },
  };

  function niebla(p, fin) {
    const c = cont(), verdad = p.uni.tasa;
    const { r, lo, hi } = p.est;
    const dentro = verdad >= r ? verdad - r <= 2 * (hi - r) : r - verdad <= 2 * (r - lo);
    const contratoOk = !p.m.errorMax || p.errRel <= p.m.errorMax;
    const gana = dentro && contratoOk;
    const veredicto = !dentro
      ? ['mal', Lg(`Rechazado. La tasa verdadera (${f2(verdad)}) cae fuera de tus 2σ.`, `Rejected. The true rate (${f2(verdad)}) falls outside your 2σ.`)]
      : !contratoOk ? ['medio', Lg(`Tu tasa aguanta, pero no te renuevan el telescopio: error de ${Number.isFinite(p.errRel) ? (100 * p.errRel).toFixed(0) : '∞'} % y el contrato pedía ${p.m.errorMax * 100} %.`,
        `Your rate holds up, but your telescope time is not renewed: the error is ${Number.isFinite(p.errRel) ? (100 * p.errRel).toFixed(0) : '∞'} % and the contract asked for ${p.m.errorMax * 100} %.`)]
      : ['ok', Lg(`Aceptado. La tasa verdadera (${f2(verdad)}) cae dentro de tus 2σ.`, `Accepted. The true rate (${f2(verdad)}) falls within your 2σ.`)];
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
    if (p.nivel !== 'contar') E.ejemplos.tiempo_control = Lg(`con ${p.N} supernovas y A = ${A.txt} yr Mpc³, tu tasa fue ${f2(r)} × 10⁻⁴ (verdadera ${f2(verdad)}, universo de juego).`,
      `with ${p.N} ${sne(p.N)} and A = ${A.txt} yr Mpc³, your rate was ${f2(r)} × 10⁻⁴ (true ${f2(verdad)}, game universe).`);
    if (p.nivel === 'tcz' || nuevos.includes('dilatacion')) {
      const sin = NIVELES.tc.A(p.base), con = NIVELES.tcz.A(p.base);
      E.ejemplos.dilatacion = Lg(`en tu temporada hasta z = ${p.m.zmax}, A sin (1+z) era ${sci(sin).txt} y con (1+z) ${sci(con).txt} yr Mpc³: un factor ${f2(sin / con)}.`,
        `in your season up to z = ${p.m.zmax}, A without (1+z) was ${sci(sin).txt} and with (1+z) ${sci(con).txt} yr Mpc³: a factor of ${f2(sin / con)}.`);
    }
    guardar();

    const cuenta = Object.fromEntries(MOTIVOS.map(([k]) => [k, p.obs.filter(s => s.motivo === k).length]));
    const total = p.obs.length;
    const nivelesVisibles = ['contar', ...(tiene('tiempo_control') ? ['tc'] : []), ...(tiene('dilatacion') ? ['tcz'] : [])];
    const filasNivel = Object.entries(NIVELES).filter(([k]) => nivelesVisibles.includes(k)).map(([k, n]) => {
      const e = U.estimar(p.N, n.A(p.base));
      return `<tr${k === p.nivel ? ' style="color:var(--ambar)"' : ''}><td>${n.nombre}${k === p.nivel ? Lg(' (tu ecuación)', ' (your equation)') : ''}</td><td>${f2(e.r)}</td><td>${f2(e.r / verdad)}</td></tr>`;
    }).join('');
    const zEnc = p.obs.filter(s => s.motivo === 'encontrada').map(s => s.z);
    const zIni = Number.isFinite(mediana(zEnc)) ? mediana(zEnc) : p.m.zmax / 4;

    c.innerHTML = `
      <div class="veredicto ${veredicto[0]}">${veredicto[1]}</div>
      <canvas class="franja" id="recta" style="height:90px;margin-top:1rem"></canvas>
      <p class="tenue">${Lg('La barra gruesa es tu 1σ y la zona clara tus 2σ. La línea violeta es la verdad', 'The thick bar is your 1σ and the light band your 2σ. The violet line is the truth')} ${marca}.</p>
      ${lecciones.map(id => `<div class="panel leccion"><span class="quien">${Lg('DIRECTORA', 'DIRECTOR')}</span><div><p>${LECCIONES[id](p)}</p>
        <p>${Lg('Nueva página en tu cuaderno', 'New page in your notebook')}, ${enlaceCuaderno(id)}.</p></div></div>`).join('')}
      ${!dentro && !lecciones.length ? `<div class="panel leccion"><span class="quien">${Lg('DIRECTORA', 'DIRECTOR')}</span><div><p>${Lg(`Mira la tabla.
        Si la fila de tu ecuación queda cerca de 1, fue mala suerte: con 2σ, una de cada veinte temporadas falla por azar. Juega otra vez.
        Si queda lejos de 1, a tu ecuación le falta un término que todavía no tienes.`, `Look at the table.
        If the row for your equation is close to 1, it was bad luck: with 2σ, one season in twenty fails by chance. Play again.
        If it is far from 1, your equation is missing a term you do not have yet.`)}</p></div></div>` : ''}
      <div class="grilla2">
        <div class="panel"><h3>${Lg('Todas las que explotaron', 'All that exploded')}: ${total}</h3>
          ${MOTIVOS.map(([k, n]) => `<div class="dato" style="margin:.35rem 0"><i style="display:inline-block;width:${Math.max(2, 100 * cuenta[k] / Math.max(1, total)) * 2.2}px;height:.8em;background:${COLOR[k]};margin-right:.5em"></i><b>${cuenta[k]}</b> ${n}</div>`).join('')}
        </div>
        <div class="panel"><h3>${Lg('La tasa con cada ecuación', 'The rate with each equation')}</h3>
          <table class="tabla"><tr><th>${Lg('ecuación', 'equation')}</th><th>${Lg('tasa', 'rate')}</th><th>${Lg('sobre la verdadera', 'over the true rate')}</th></tr>${filasNivel}</table>
          <p class="tenue">${Lg(`Verdadera: ${f2(verdad)} × 10⁻⁴. Hay una fila por cada término que tienes: muestra qué habría dado tu temporada con cada versión de la ecuación.`,
            `True: ${f2(verdad)} × 10⁻⁴. There is one row for each term you have. It shows what your season would have given with each version of the equation.`)}</p></div>
      </div>
      <div class="grilla2">
        <div><h3>${Lg('El campo con todas', 'The field with all of them')}</h3><canvas class="vista campo" id="mapa"></canvas>
          <div class="leyenda">${MOTIVOS.map(([k, n]) => `<span><i style="background:${COLOR[k]}"></i>${n.split(':')[0]}</span>`).join('')}</div></div>
        <div><h3>${Lg('En qué z estaban', 'Which z they were at')}</h3><canvas class="grafico" id="histz"></canvas>
          <div class="leyenda"><span><i style="background:#3a4a80"></i>${Lg('todas', 'all')}</span><span><i style="background:${COLOR.encontrada}"></i>${Lg('encontradas', 'found')}</span></div></div>
      </div>
      <h3>${Lg('Cómo se calcula el tiempo de control', 'How the control time is calculated')}</h3>
      <label class="control"><span>z</span><input type="range" id="z" min="0.01" max="${p.m.zmax}" step="0.005" value="${zIni.toFixed(3)}"><output id="o-z"></output></label>
      <div class="grilla3">
        <div><h3>${Lg('1. La ola', '1. The wave')}</h3><canvas class="grafico" id="ola"></canvas><p class="tenue" id="t-ola"></p></div>
        <div><h3>${Lg('2. El calendario', '2. The calendar')}</h3><canvas class="grafico" id="cal"></canvas><p class="tenue" id="t-cal"></p></div>
        <div><h3>${Lg('3. El volumen', '3. The volume')}</h3><canvas class="grafico" id="vol"></canvas>
          <div class="leyenda"><span><i style="background:${COLOR.ambar}"></i>CT(z)</span><span><i style="background:${COLOR.cian}"></i>${Lg('volumen por capa', 'volume per shell')}${tiene('dilatacion') ? ' / (1+z)' : ''}</span><span><i style="background:${COLOR.encontrada}"></i>${Lg('su producto', 'their product')}</span></div>
          <p class="tenue">${Lg('El producto es dónde esperas encontrar supernovas. Su área total es la exposición A.', 'The product is where you expect to find supernovae. Its total area is the exposure A.')}</p></div>
      </div>
      <div class="panel" id="mc">
        <h3>${Lg('Experta: lanzar simuladas', 'Expert: launch simulated supernovae')}</h3>
        <p>${Lg(`La tesis no suma tiempos de control a mano: lanza supernovas falsas sobre el registro de noches y cuenta qué fracción encuentra (eq:methods:rates:ct).
          Prueba con tu temporada: 20 000 simuladas con z sorteado de n(z) y explosión al azar en la ventana.`,
          `The thesis does not add up control times by hand. It launches fake supernovae over the log of nights and counts what fraction it finds (eq:methods:rates:ct).
          Try it with your season: 20 000 simulated supernovae, with z drawn from n(z) and the explosion at a random time in the window.`)}</p>
        <p>${tiene('dilatacion') ? `<button id="lanzarmc">${Lg('Lanzar 20 000 simuladas', 'Launch 20 000 simulated')}</button>` : `<span class="tenue">${Lg('Se abre cuando tengas el (1+z), porque la fórmula de la tesis lo usa.', 'Opens once you have the (1+z), because the thesis formula uses it.')}</span>`}</p>
        <canvas class="grafico" id="mccv" style="display:none"></canvas><p id="mctxt" class="dato"></p>
      </div>
      <p><button class="primario" id="volver">${Lg('Volver al observatorio', 'Back to the observatory')}</button> <button id="otra">${Lg('Jugar otra vez esta misión', 'Play this mission again')}</button></p>`;

    dibujarRecta($('#recta', c), p.est, verdad);
    Vista.campo($('#mapa', c), { semilla: 31, sn: p.obs.map(s => ({ x: s.x, y: s.y, color: COLOR[s.motivo], brillo: s.motivo === 'encontrada' ? 1 : 0.5 })) });

    // histograma en z
    {
      const ctx = Plot.preparar($('#histz', c)), nb = 20, bordes = [...Array(nb + 1)].map((_, k) => p.m.zmax * k / nb);
      const h = arr => bordes.slice(0, -1).map((a, k) => arr.filter(z => z >= a && z < bordes[k + 1]).length);
      const todas = h(p.obs.map(s => s.z)), enc = h(zEnc);
      const T0 = Plot.ejes(ctx, { x0: 0, x1: p.m.zmax, y0: 0, y1: Math.max(1, ...todas) * 1.1, xlabel: 'z', ylabel: Lg('supernovas', 'supernovae') });
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
      $('#t-ola', c).textContent = w ? Lg(`Visible ${f2(w[1] - w[0], 0)} días del observador desde el día ${f2(w[0], 0)} después de explotar.`,
        `Visible for ${f2(w[1] - w[0], 0)} observer-frame days, from day ${f2(w[0], 0)} after explosion.`) : Lg('A este z nunca supera tu límite.', 'At this z it never gets above your limit.');
      // calendario
      const ctx = Plot.preparar($('#cal', c)), iv = U.intervalosControl(z, -19.3, p.noches, p.mlim, LARGO, p.uni.previa);
      const T0 = Plot.ejes(ctx, { x0: -p.uni.previa, x1: LARGO, y0: 0, y1: 1, xlabel: Lg('fecha de explosión [día de la temporada]', 'explosion date [day of the season]'), ylabel: '' });
      if (w) p.noches.filter(n => n.despejada).forEach((n, k, arr) => {
        const a = Math.max(n.t - w[1], -p.uni.previa), b = Math.min(n.t - w[0], LARGO), y = 0.62 + 0.3 * k / arr.length;
        Plot.linea(ctx, T0, [a, b], [y, y], 'rgba(255,184,77,0.6)', 1);
      });
      iv.forEach(([a, b]) => Plot.linea(ctx, T0, [a, b], [0.5, 0.5], COLOR.ambar, 6));
      const cerca = p.obs.filter(s => Math.abs(s.z - z) < p.m.zmax / 40);
      cerca.forEach((s, k) => Plot.puntos(ctx, T0, [s.tExp], [0.12 + 0.28 * ((k * 0.618) % 1)], COLOR[s.motivo], 3));
      const ctz = iv.reduce((s, [a, b]) => s + b - a, 0);
      $('#t-cal', c).innerHTML = Lg(`Cada línea fina es lo que cubre una noche despejada: las fechas de explosión que esa noche habría visto.
        La línea gruesa es su unión: <b>CT(z) = ${f2(ctz, 0)} días</b>. Los puntos son las supernovas reales cerca de este z, por color de motivo.`,
        `Each thin line is what one clear night covers: the explosion dates that night would have caught.
        The thick line is their union: <b>CT(z) = ${f2(ctz, 0)} days</b>. The dots are the real supernovae near this z, coloured by outcome.`);
      // volumen
      const cv = Plot.preparar($('#vol', c));
      const T1 = Plot.ejes(cv, { x0: 0, x1: p.m.zmax, y0: 0, y1: 1.1, xlabel: 'z', ylabel: Lg('normalizado', 'normalised') });
      Plot.linea(cv, T1, zs, norm(ct), COLOR.ambar); Plot.linea(cv, T1, zs, norm(nz), COLOR.cian); Plot.linea(cv, T1, zs, norm(prod), COLOR.encontrada, 3);
      Plot.vline(cv, T1, z, '#e8ecf8');
    };
    $('#z', c).oninput = paneles;
    paneles();

    // simuladas
    if ($('#lanzarmc', c)) $('#lanzarmc', c).onclick = () => {
      $('#lanzarmc', c).disabled = true; $('#mctxt', c).textContent = Lg('Simulando…', 'Simulating…');
      setTimeout(() => {
        const mc = U.exposicionMC({ ...p.base, rand: U.rng(p.seed + 2), nSim: 20000 });
        const an = U.exposicion({ ...p.base, dilatacion: true });
        const cvs = $('#mccv', c); cvs.style.display = 'block';
        const muestra = mc.sims.slice(0, 2000);
        let k = 0;
        const dib = () => {
          k = Math.min(muestra.length, k + 40);
          const ctx = Plot.preparar(cvs);
          const T0 = Plot.ejes(ctx, { x0: -p.uni.previa, x1: LARGO, y0: 0, y1: p.m.zmax, xlabel: Lg('fecha de explosión', 'explosion date'), ylabel: 'z' });
          const vis = muestra.slice(0, k);
          Plot.puntos(ctx, T0, vis.filter(s => !s.encontrada).map(s => s.tExp), vis.filter(s => !s.encontrada).map(s => s.z), 'rgba(127,139,179,0.5)', 1.5);
          Plot.puntos(ctx, T0, vis.filter(s => s.encontrada).map(s => s.tExp), vis.filter(s => s.encontrada).map(s => s.z), COLOR.encontrada, 1.8);
          if (k < muestra.length) anim = requestAnimationFrame(dib); else terminarMC();
        };
        const terminarMC = () => {
          $('#mctxt', c).innerHTML = Lg(`Encontradas <b>${mc.nSel}</b> de ${mc.nSim} (se dibujan 2000). Exposición por simulación:
            <b>${sci(mc.A).txt}</b> ± ${sci(mc.errA).txt} yr Mpc³. Sumando tiempos de control con (1+z): <b>${sci(an).txt}</b>.
            Cociente ${f2(mc.A / an, 3)}. Son la misma cantidad medida de dos formas.`,
            `Found <b>${mc.nSel}</b> of ${mc.nSim} (2000 are drawn). Exposure by simulation:
            <b>${sci(mc.A).txt}</b> ± ${sci(mc.errA).txt} yr Mpc³. Adding up control times with (1+z): <b>${sci(an).txt}</b>.
            Ratio ${f2(mc.A / an, 3)}. They are the same quantity measured in two ways.`);
          E.ejemplos.montecarlo = Lg(`de ${mc.nSim} simuladas encontraste ${mc.nSel}; A por simulación ${sci(mc.A).txt} contra ${sci(an).txt} yr Mpc³ sumando tiempos de control (cociente ${f2(mc.A / an, 3)}).`,
            `you found ${mc.nSel} of ${mc.nSim} simulated supernovae, and A by simulation was ${sci(mc.A).txt} against ${sci(an).txt} yr Mpc³ from adding up control times (ratio ${f2(mc.A / an, 3)}).`);
          const n = desbloquear(['montecarlo']);
          if (n.length) $('#mctxt', c).innerHTML += ` <br>${Lg('Nueva página: <b>Exposición por simulación</b>', 'New page: <b>Exposure by simulation</b>')}, ${enlaceCuaderno('montecarlo')}.`;
          guardar(); enlazar();
        };
        dib();
      }, 30);
    };

    $('#otra', c).onclick = () => pantalla(taller, p.m, fin);
    $('#volver', c).onclick = () => fin({ gana });
    sonar(gana ? 'fanfarria' : 'campana');
    hablar([['directora', gana ? Lg('Se levantó la niebla y tu tasa aguanta. Mira el embudo: ahí está todo lo que no viste.', 'The fog has lifted and your rate holds up. Look at the funnel: it shows everything you did not see.')
      : lecciones.length ? Lg('Se levantó la niebla. Tu tasa no aguantó, pero ahora sabes por qué: te dejé una página nueva en el cuaderno.', 'The fog has lifted. Your rate did not hold up, but now you know why: I left you a new page in the notebook.')
      : Lg('Se levantó la niebla. Mira la tabla antes de culpar a la suerte.', 'The fog has lifted. Look at the table before you blame luck.')]]);
  }

  // ---------- el cuaderno, en su propio panel (puede ir encima de un instrumento) ----------
  function cuaderno(ancla) {
    const p = $('#cuaderno'), c = $('#cuaderno .contenido');
    p.hidden = false; document.body.classList.add('con-panel');
    Cuaderno.render(c, E.desbloqueados, E.ejemplos);
    c.insertAdjacentHTML('beforeend', `<p class="no-imprimir" style="margin-top:2rem"><button id="borrar">${Lg('Borrar progreso', 'Delete progress')}</button></p>`);
    const b = $('#borrar', c);
    b.onclick = () => {
      if (!b.dataset.seguro) { b.dataset.seguro = 1; b.textContent = Lg('Toca de nuevo para borrar todo', 'Tap again to delete everything'); return; }
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
  // como un número romano. Solo cuenta si no hay otra letra pegada, así "Inés" no se toca. La I sola solo tras
  // "SUDARE": en inglés "I" es el pronombre.
  const TIPO = /(?<![A-Za-zÀ-ÿ0-9])(II(?:n|b|P|L)?|I(?:a|b\/c|bc|b|c)|(?<=SUDARE\s)I)(?![A-Za-zÀ-ÿ0-9])/g;
  const escapar = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const conTipos = s => escapar(s).replace(TIPO, '<span class="tipo">$1</span>');
  function marcarTexto(t) {
    if (!t.parentElement || t.parentElement.closest('.katex, .tipo')) return;
    if (ETIQUETA.test(t.nodeValue)) { // las etiquetas de la tesis, con su número; bajo una ecuación, que se sepa que es de la tesis
      const c = citarTesis(t.nodeValue), sola = t.parentElement.classList.contains('etiqueta') && !t.previousSibling && /^(sec|eq|fig|tab):/.test(t.nodeValue);
      t.nodeValue = sola ? Lg('Tesis, ', 'Thesis, ') + c : c;
    }
    ETIQUETA.lastIndex = 0;
    const s = t.nodeValue;
    if (!s.match(TIPO)) return;
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
