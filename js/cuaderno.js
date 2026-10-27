// El cuaderno: una página por nodo desbloqueado, con la ecuación de la tesis y los números de tu partida.
const Cuaderno = (() => {
  const PAGINAS = [
    {
      id: 'tasa', titulo: Lg('La tasa', 'The rate'), ingles: 'volumetric rate',
      ecuacion: String.raw`r = \frac{N}{T\,V}`,
      etiqueta: Lg('sin ecuación numerada en la tesis: es la definición del texto de sec:intro:rates. Su forma con tiempo de control es eq:intro:ratez',
        'no numbered equation in the thesis: it is the definition given in the text of sec:intro:rates. Its control-time form is eq:intro:ratez'),
      texto: [
        Lg('Una tasa volumétrica cuenta cuántas supernovas explotan por unidad de tiempo y por unidad de volumen de universo.',
          'A volumetric rate counts how many supernovae explode per unit time and per unit volume of the universe.'),
        Lg('N es el número de supernovas, T el tiempo y V el volumen comóvil (comoving volume), el volumen que no crece con la expansión.',
          'N is the number of supernovae, T the time and V the comoving volume, the volume that does not grow with the expansion.'),
        Lg('El tiempo es el de la supernova, en su reposo (rest-frame). Hasta z ~ 0.05 da casi lo mismo, pero lejos importa: lo ves en el capítulo 1.',
          'The time is that of the supernova, in its rest frame. Up to z ~ 0.05 it makes almost no difference, but far away it matters: you see it in chapter 1.'),
        Lg('La unidad de la tesis es 10⁻⁴ yr⁻¹ Mpc⁻³. Con una tasa de Ia de 0.25 × 10⁻⁴ (un valor del universo de juego, del orden de las medidas locales), en un cubo de 100 Mpc de lado (10⁶ Mpc³) explotan 25 Ia por año.',
          'The thesis unit is 10⁻⁴ yr⁻¹ Mpc⁻³. With an Ia rate of 0.25 × 10⁻⁴ (a value of the game universe, of the order of the local measurements), 25 Ia explode per year in a cube 100 Mpc on a side (10⁶ Mpc³).'),
        Lg('Esta ecuación supone que viste todas las que explotaron. Eso nunca pasa, y el resto del juego trata de eso.',
          'This equation assumes you saw every one that exploded. That never happens, and the rest of the game is about that.'),
      ],
      fuente: Lg('Tesis: sec:intro:rates, primer párrafo. Unidad: cap. 5, sec:methods:rates:ct.',
        'Thesis: sec:intro:rates, first paragraph. Unit: chap. 5, sec:methods:rates:ct.'),
    },
    {
      id: 'poisson', titulo: Lg('Error estadístico', 'Statistical error'), ingles: 'Poisson noise, Gehrels intervals',
      ecuacion: String.raw`\lambda_\mathrm{hi} \simeq N + \sqrt{N + \tfrac{3}{4}} + 1, \qquad \lambda_\mathrm{lo} \simeq N\left(1 - \frac{1}{9N} - \frac{1}{3\sqrt{N}}\right)^{3}`,
      etiqueta: Lg('Gehrels (1986), ec. 9 y 14, a 1σ', 'Gehrels (1986), eqs. 9 and 14, at 1σ'),
      texto: [
        Lg('Las explosiones son independientes y al azar. Si repites el mismo universo, N cambia de una vez a otra: sigue una distribución de Poisson.',
          'The explosions are independent and random. If you repeat the same universe, N changes from one time to the next: it follows a Poisson distribution.'),
        Lg('Con N grande, el error es √N. Con N chico la barra es asimétrica: con N = 3, el intervalo a 1σ va de 1.37 a 5.92, no de 1.27 a 4.73.',
          'With large N, the error is √N. With small N the bar is asymmetric: with N = 3, the 1σ interval goes from 1.37 to 5.92, not from 1.27 to 4.73.'),
        Lg('Con N chico la barra de Gehrels es conservadora: como N solo toma valores enteros, contiene la verdad más del 68 % de las veces (cerca del 80 % con medias de 2 a 4). Con N grande vuelve al 68 %.',
          'With small N the Gehrels bar is conservative: since N only takes integer values, it contains the truth more than 68 % of the time (close to 80 % for means from 2 to 4). With large N it goes back to 68 %.'),
        Lg('Gehrels (1986) da esas cotas. La tesis usa su intervalo a 1σ sobre el N total de cada bin, y lo divide por la exposición igual que N.',
          'Gehrels (1986) gives those limits. The thesis uses his 1σ interval on the total N of each bin, and divides it by the exposure just like N.'),
        Lg('Con N = 0 la tasa medida es 0, pero la cota superior no: con 1σ es 1.84 supernovas dividido por la exposición.',
          'With N = 0 the measured rate is 0, but the upper limit is not: at 1σ it is 1.84 supernovae divided by the exposure.'),
      ],
      fuente: Lg('Tesis: cap. 5, sec:methods:rates:ct, el párrafo que sigue a la ecuación de la exposición.',
        'Thesis: chap. 5, sec:methods:rates:ct, the paragraph that follows the exposure equation.'),
    },
    {
      id: 'tiempo_control', titulo: Lg('Tiempo de control', 'Control time'), ingles: 'control time',
      ecuacion: String.raw`r_\text{SN}(z) = \frac{(1+z)}{V(z)} \frac{N_\text{SN}(z)}{\mathrm{CT}_\text{SN}(z)}, \qquad \mathrm{CT}_\text{SN}(z) = \sum_{\text{SN}_i} \sum_{E_{B-V}}\, f_{\text{SN}_i}\, g_{E_{B-V}}\, \mathrm{CT}_{\text{SN}_i, E_{B-V}}(z)`,
      etiqueta: Lg('eq:intro:ratez y eq:intro:controltime', 'eq:intro:ratez and eq:intro:controltime'),
      texto: [
        Lg('El tiempo de control (control time) de una observación es el tiempo durante el cual una supernova a un z dado habría estado sobre el límite de esa observación.',
          'The control time of an observation is the time during which a supernova at a given z would have been above the limit of that observation.'),
        Lg('Míralo al revés: cada noche despejada "cubre" un rango de fechas de explosión, las que dejan a la supernova visible esa noche. El tiempo de control total, CT(z), es el largo de la unión de esos rangos, sin contar dos veces lo que se traslapa.',
          'Look at it the other way round: each clear night "covers" a range of explosion dates, those that leave the supernova visible that night. The total control time, CT(z), is the length of the union of those ranges, without counting the overlaps twice.'),
        Lg('CT depende de z: más lejos la supernova se ve más débil, su ventana visible se achica, y desde cierto z vale cero. Por eso el volumen no se toma entero: cada capa de z entra con su propio CT. Eso es V(z) en la ecuación.',
          'CT depends on z: farther away the supernova looks fainter, its visible window shrinks, and beyond a certain z it is zero. That is why the volume is not taken whole: each z shell enters with its own CT. That is V(z) in the equation.'),
        Lg('La segunda ecuación suma sobre subtipos (f) y sobre polvo del host (g): en el capítulo 1 hay un solo tipo sin polvo y la suma tiene un término. Eso cambia en el capítulo 2.',
          'The second equation sums over subtypes (f) and over host dust (g): in chapter 1 there is a single type without dust and the sum has one term. That changes in chapter 2.'),
        Lg('Lo que nunca puede entrar a un tiempo de control: las noches nubladas, los huecos de la cadencia y lo que pasa antes de la primera noche o después de la última. Por eso se calcula con el registro real de noches.',
          'What can never enter a control time: cloudy nights, the gaps in the cadence and whatever happens before the first night or after the last one. That is why it is computed with the real log of nights.'),
      ],
      fuente: Lg('Tesis: sec:intro:rates, párrafo "Control-time formulation" (Zwicky 1942, van den Bergh 1991, Cappellaro et al. 1999 y SUDARE I).',
        'Thesis: sec:intro:rates, paragraph "Control-time formulation" (Zwicky 1942, van den Bergh 1991, Cappellaro et al. 1999 and SUDARE I).'),
    },
    {
      id: 'dilatacion', titulo: Lg('El factor (1+z)', 'The (1+z) factor'), ingles: 'cosmological time dilation',
      ecuacion: String.raw`n(z) \,=\, \frac{1}{1+z}\,\frac{\mathrm{d}V_c}{\mathrm{d}z}, \qquad \frac{\mathrm{d}V_c}{\mathrm{d}z} \,\propto\, \frac{D_C^2(z)}{E(z)}, \qquad E(z) \,=\, \sqrt{\Omega_m(1+z)^3 + \Omega_\Lambda}`,
      etiqueta: 'eq:methods:proj:wz',
      texto: [
        Lg('El survey mide el tiempo con su reloj, el del observador. Un intervalo Δt del survey corresponde a Δt/(1+z) en el reposo de la supernova.',
          "The survey measures time with its own clock, the observer's. An interval Δt of the survey corresponds to Δt/(1+z) in the rest frame of the supernova."),
        Lg('Por eso, a z = 0.5, en un año del survey solo pasan 8 meses allá: explotan 1.5 veces menos supernovas por año del observador que por año en reposo.',
          'That is why, at z = 0.5, only 8 months pass over there during one survey year: 1.5 times fewer supernovae explode per observer year than per rest-frame year.'),
        Lg('El mismo efecto estira la curva de luz por (1+z): su ventana visible dura más vista desde acá. El tiempo de control ya lo incluye.',
          'The same effect stretches the light curve by (1+z): its visible window lasts longer seen from here. The control time already includes it.'),
        Lg('n(z) es la distribución en z de las supernovas que explotan durante un tiempo fijo del observador con tasa constante: el volumen por capa, dividido por (1+z).',
          'n(z) is the z distribution of the supernovae that explode during a fixed observer time at a constant rate: the volume per shell, divided by (1+z).'),
        Lg('Si te olvidas del 1/(1+z), la exposición sale grande y la tasa chica. A z ~ 0.5 el error es de un tercio.',
          'If you forget the 1/(1+z), the exposure comes out too large and the rate too small. At z ~ 0.5 the error is one third.'),
      ],
      fuente: Lg('Tesis: cap. 4, sec:methods:proj:sampling. La cosmología es plana con H₀ = 70 y Ω_m = 0.3.',
        'Thesis: chap. 4, sec:methods:proj:sampling. The cosmology is flat with H₀ = 70 and Ω_m = 0.3.'),
    },
    {
      id: 'volumen', titulo: Lg('Volumen comóvil', 'Comoving volume'), ingles: 'comoving volume',
      ecuacion: String.raw`V \,=\, \Omega \int_{z_\mathrm{min}}^{z_\mathrm{max}} \frac{1}{1+z}\,\frac{\mathrm{d}V_c}{\mathrm{d}z\,\mathrm{d}\Omega}\,\mathrm{d}z`,
      etiqueta: Lg('el corchete de eq:methods:rates:ct', 'the bracket in eq:methods:rates:ct'),
      texto: [
        Lg('Una tasa es por unidad de volumen: cuántas explotan por año en cada Mpc³. El volumen que mira un survey es su área en el cielo, Ω (en estereorradianes), por la profundidad entre z_min y z_max.',
          'A rate is per unit volume: how many explode per year in each Mpc³. The volume a survey looks at is its area on the sky, Ω (in steradians), times the depth between z_min and z_max.'),
        Lg('Se usa el volumen comóvil, el que se expande con el universo, para que una misma densidad de galaxias dé el mismo número por Mpc³ a cualquier z. A z bajo crece como z³: un bin lejano tiene mucho más volumen que uno cercano.',
          'The comoving volume is used, the one that expands with the universe, so that the same density of galaxies gives the same number per Mpc³ at any z. At low z it grows as z³: a distant bin has much more volume than a nearby one.'),
        Lg('El 1/(1+z) es la dilatación del tiempo: un año en el observador es 1/(1+z) años en la galaxia, así que en el mismo tiempo de observación explotan menos supernovas lejanas por año del observador.',
          'The 1/(1+z) is time dilation: one year for the observer is 1/(1+z) years in the galaxy, so in the same observing time fewer distant supernovae explode per observer year.'),
      ],
      fuente: Lg('Tesis: cap. 5, sec:methods:rates:ct.', 'Thesis: chap. 5, sec:methods:rates:ct.'),
    },
    {
      id: 'montecarlo', titulo: Lg('Exposición por simulación', 'Exposure by simulation'), ingles: 'Monte Carlo efficiency',
      ecuacion: String.raw`A_c(z_1, z_2) \,=\, \sum_f \Omega_f\, \frac{T_f}{365.25\,\mathrm{d}} \left[\int_{z_\mathrm{min}}^{z_{\mathrm{max},c}} \frac{1}{1+z}\,\frac{\mathrm{d}V_c}{\mathrm{d}z\,\mathrm{d}\Omega}\,\mathrm{d}z\right] \frac{1}{n_{\mathrm{sim},f}} \sum_{i \in \mathrm{found}_f} \omega_i\, p_i(z_1, z_2), \qquad r_c = \frac{N_c\, C_c}{A_c}`,
      etiqueta: Lg('eq:methods:rates:ct y eq:methods:rates:rate', 'eq:methods:rates:ct and eq:methods:rates:rate'),
      texto: [
        Lg('En vez de sumar tiempos de control, la tesis los mide con una simulación: lanza supernovas falsas sobre el registro de observación del survey y cuenta cuántas encuentra.',
          'Instead of adding up control times, the thesis measures them with a simulation: it throws fake supernovae onto the observing log of the survey and counts how many it finds.'),
        Lg('Cada simulada recibe un z sorteado de n(z) y una fecha de explosión uniforme en la ventana T_f del campo. Así, la fracción encontrada n_sel/n_sim, multiplicada por el volumen y el tiempo, es directamente la exposición A.',
          'Each simulated supernova gets a z drawn from n(z) and an explosion date uniform in the window T_f of the field. So the fraction found, n_sel/n_sim, multiplied by the volume and the time, is directly the exposure A.'),
        Lg('Es la misma cantidad que la suma de tiempos de control: lo compruebas en la niebla con el botón de las simuladas.',
          'It is the same quantity as the sum of control times: you check it in the fog with the button for the simulated supernovae.'),
        Lg('La ventaja: lo que el survey le hace a una supernova real para encontrarla y seleccionarla (ruido, eficiencia de búsqueda, cortes de selección) se le hace también a las simuladas. La suma corre sobre las simuladas encontradas y seleccionadas: ω_i es su peso (subtipo, polvo, corte en m50) y p_i la probabilidad de que su z observado caiga en el bin (capítulo 4). La tesis proyecta cientos de miles de supernovas sobre el registro de SUDARE.',
          'The advantage: whatever the survey does to a real supernova to find it and select it (noise, search efficiency, selection cuts) is also done to the simulated ones. The sum runs over the simulated supernovae that are found and selected: ω_i is their weight (subtype, dust, cut at m50) and p_i the probability that their observed z falls in the bin (chapter 4). The thesis projects hundreds of thousands of supernovae onto the SUDARE log.'),
        Lg('La clasificación no entra en A: entra en N, que es una suma de probabilidades de tipo (capítulo 4).',
          'Classification does not enter A: it enters N, which is a sum of type probabilities (chapter 4).'),
        Lg('C es el factor de completitud, mayor o igual a 1: multiplica N para corregir por las seleccionadas que el clasificador no puede clasificar (capítulo 4). En SUDARE I el clasificador de plantillas las clasifica todas.',
          'C is the completeness factor, greater than or equal to 1: it multiplies N to correct for the selected supernovae that the classifier cannot classify (chapter 4). In SUDARE I the template classifier classifies all of them.'),
        Lg('Además, toda la exposición se multiplica por 1 − e_SN, donde e_SN es la fracción de supernovas verdaderas que saca la limpieza de AGN (capítulo 4).',
          'In addition, the whole exposure is multiplied by 1 − e_SN, where e_SN is the fraction of true supernovae that the AGN cleaning removes (chapter 4).'),
      ],
      fuente: Lg('Tesis: cap. 5, sec:methods:rates:ct.',
        'Thesis: chap. 5, sec:methods:rates:ct.'),
    },
  ];

  // El árbol de instrumentos (diseño, sección 5.2): cada nodo es un término o una herramienta de la cadena de la tasa.
  const ARBOL = [
    ['tasa', Lg('Contar', 'Counting')], ['tiempo_control', Lg('Tiempo de control', 'Control time')], ['volumen', Lg('Volumen', 'Volume')], ['dilatacion', '(1+z)'],
    ['eficiencia', Lg('Eficiencia de búsqueda', 'Search efficiency')], ['montecarlo', Lg('Simulación Monte Carlo', 'Monte Carlo simulation')], ['lf', Lg('Función de luminosidad', 'Luminosity function')],
    ['polvo', Lg('Polvo', 'Dust')], ['subtipos', Lg('Subtipos', 'Subtypes')], ['kcorr', Lg('K-corrección', 'K-correction')], ['simetria', Lg('Selección simétrica', 'Symmetric selection')],
    ['clasificador', Lg('Clasificador', 'Classifier')], ['prior', 'Prior P1(z)'], ['errorz', Lg('Error del z', 'Redshift error')], ['completitud', Lg('Completitud', 'Completeness')],
    ['poisson', 'Gehrels'], ['sistematicos', Lg('Sistemáticos', 'Systematics')], ['imf', 'IMF'], ['sfh', 'SFH'], ['dtd', 'DTD'],
  ];
  const agregar = lista => PAGINAS.push(...lista);
  const valor = x => (typeof x === 'function' ? x() : x);
  // la glosa en inglés va entre paréntesis, salvo que el título ya la diga (pasa con los títulos en inglés)
  const glosa = p => (p.titulo.toLowerCase().includes(p.ingles.toLowerCase()) ? '' : ` <span class="tenue">(${p.ingles})</span>`);
  function render(contenedor, desbloqueados, ejemplos = {}) {
    const paginas = PAGINAS.filter(p => desbloqueados.includes(p.id));
    contenedor.innerHTML = `
      <h1>${Lg('Cuaderno', 'Notebook')}</h1>
      <p class="tenue no-imprimir">${Lg(`Una página por cada término que desbloqueas, todas en orden. Toca un término para ir a su página;
        los que tienen candado se desbloquean jugando. Al final del juego tiene el cálculo completo de la tasa de la tesis.`,
        `One page for each term you unlock, all in order. Tap a term to go to its page.
        The locked ones unlock as you play. By the end of the game it holds the full calculation of the thesis rate.`)}</p>
      <div class="arbol no-imprimir">${ARBOL.map(([id, n]) => desbloqueados.includes(id) && PAGINAS.some(p => p.id === id)
        ? `<button class="nodo si" data-ir="${id}">${n}</button>` : `<span class="nodo">🔒 ${n}</span>`).join('')}</div>
      <p class="no-imprimir"><button id="imprimir">${Lg('Imprimir cuaderno', 'Print notebook')}</button></p>
      ${paginas.length ? '' : `<p>${Lg('Todavía no hay páginas. Juega la misión 0.1.', 'No pages yet. Play mission 0.1.')}</p>`}
      ${paginas.map(p => `
        <article class="pagina" id="pag-${p.id}">
          <h2>${p.titulo}${glosa(p)}</h2>
          <div class="ecuacion" data-tex="${encodeURIComponent(p.ecuacion)}"></div>
          <p class="etiqueta">${p.etiqueta}</p>
          ${valor(p.texto).map(t => `<p>${valor(t)}</p>`).join('')}
          ${p.extra ? p.extra() : ''}
          ${ejemplos[p.id] ? `<p class="ejemplo"><b>${Lg('Tu partida:', 'Your game:')}</b> ${ejemplos[p.id]}</p>` : ''}
          <p class="tenue">${p.fuente}</p>
          <p class="no-imprimir"><a href="#" data-arriba="1">${Lg('↑ volver al índice', '↑ back to the index')}</a></p>
        </article>`).join('')}`;
    contenedor.querySelectorAll('[data-ir]').forEach(b => b.onclick = () => { const pg = contenedor.querySelector(`#pag-${b.dataset.ir}`); if (pg) pg.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    contenedor.querySelectorAll('[data-arriba]').forEach(a => a.onclick = ev => { ev.preventDefault(); contenedor.scrollTo({ top: 0, behavior: 'smooth' }); });
    contenedor.querySelectorAll('[data-tex]').forEach(el =>
      katex.render(decodeURIComponent(el.dataset.tex), el, { displayMode: true, throwOnError: false }));
    const b = contenedor.querySelector('#imprimir');
    if (b) b.onclick = () => window.print();
  }

  return { PAGINAS, ARBOL, agregar, render };
})();
