// El cuaderno: una página por nodo desbloqueado, con la ecuación de la tesis y los números de tu partida.
const Cuaderno = (() => {
  const PAGINAS = [
    {
      id: 'tasa', titulo: 'La tasa', ingles: 'volumetric rate',
      ecuacion: String.raw`r = \frac{N}{T\,V}`,
      etiqueta: 'sin ecuación numerada en la tesis: es la definición del texto de sec:intro:rates. Su forma con tiempo de control es eq:intro:ratez',
      texto: [
        'Una tasa volumétrica cuenta cuántas supernovas explotan por unidad de tiempo y por unidad de volumen de universo.',
        'N es el número de supernovas, T el tiempo y V el volumen comóvil (comoving volume), el volumen que no crece con la expansión.',
        'El tiempo es el de la supernova, en su reposo (rest-frame). Hasta z ~ 0.05 da casi lo mismo, pero lejos importa: lo ves en el capítulo 1.',
        'La unidad de la tesis es 10⁻⁴ yr⁻¹ Mpc⁻³. Con una tasa de Ia de 0.25 × 10⁻⁴ (un valor del universo de juego, del orden de las medidas locales), en un cubo de 100 Mpc de lado (10⁶ Mpc³) explotan 25 Ia por año.',
        'Esta ecuación supone que viste todas las que explotaron. Eso nunca pasa, y el resto del juego trata de eso.',
      ],
      fuente: 'Tesis: sec:intro:rates, primer párrafo. Unidad: cap. 5, sec:methods:rates:ct.',
    },
    {
      id: 'poisson', titulo: 'Error estadístico', ingles: 'Poisson noise, Gehrels intervals',
      ecuacion: String.raw`\lambda_\mathrm{hi} \simeq N + \sqrt{N + \tfrac{3}{4}} + 1, \qquad \lambda_\mathrm{lo} \simeq N\left(1 - \frac{1}{9N} - \frac{1}{3\sqrt{N}}\right)^{3}`,
      etiqueta: 'Gehrels (1986), ec. 9 y 14, a 1σ',
      texto: [
        'Las explosiones son independientes y al azar. Si repites el mismo universo, N cambia de una vez a otra: sigue una distribución de Poisson.',
        'Con N grande, el error es √N. Con N chico la barra es asimétrica: con N = 3, el intervalo a 1σ va de 1.37 a 5.92, no de 1.27 a 4.73.',
        'Con N chico la barra de Gehrels es conservadora: como N solo toma valores enteros, contiene la verdad más del 68 % de las veces (cerca del 80 % con medias de 2 a 4). Con N grande vuelve al 68 %.',
        'Gehrels (1986) da esas cotas. La tesis usa su intervalo a 1σ sobre el N total de cada bin, y lo divide por la exposición igual que N.',
        'Con N = 0 la tasa medida es 0, pero la cota superior no: con 1σ es 1.84 supernovas dividido por la exposición.',
      ],
      fuente: 'Tesis: cap. 5, sec:methods:rates:ct, el párrafo que sigue a la ecuación de la exposición. Reglas de la tasa de SUDARE, 4.6.',
    },
    {
      id: 'tiempo_control', titulo: 'Tiempo de control', ingles: 'control time',
      ecuacion: String.raw`r_\text{SN}(z) = \frac{(1+z)}{V(z)} \frac{N_\text{SN}(z)}{\mathrm{CT}_\text{SN}(z)}, \qquad \mathrm{CT}_\text{SN}(z) = \sum_{\text{SN}_i} \sum_{E_{B-V}}\, f_{\text{SN}_i}\, g_{E_{B-V}}\, \mathrm{CT}_{\text{SN}_i, E_{B-V}}(z)`,
      etiqueta: 'eq:intro:ratez y eq:intro:controltime',
      texto: [
        'El tiempo de control (control time) de una observación es el tiempo durante el cual una supernova a un z dado habría estado sobre el límite de esa observación.',
        'Míralo al revés: cada noche despejada "cubre" un rango de fechas de explosión, las que dejan a la supernova visible esa noche. El tiempo de control total, CT(z), es el largo de la unión de esos rangos, sin contar dos veces lo que se traslapa.',
        'CT depende de z: más lejos la supernova se ve más débil, su ventana visible se achica, y desde cierto z vale cero. Por eso el volumen no se toma entero: cada capa de z entra con su propio CT. Eso es V(z) en la ecuación.',
        'La segunda ecuación suma sobre subtipos (f) y sobre polvo del host (g): en el capítulo 1 hay un solo tipo sin polvo y la suma tiene un término. Eso cambia en el capítulo 2.',
        'Lo que nunca puede entrar a un tiempo de control: las noches nubladas, los huecos de la cadencia y lo que pasa antes de la primera noche o después de la última. Por eso se calcula con el registro real de noches.',
      ],
      fuente: 'Tesis: sec:intro:rates, párrafo "Control-time formulation" (Zwicky 1942, van den Bergh 1991, Cappellaro et al. 1999 y SUDARE I).',
    },
    {
      id: 'dilatacion', titulo: 'El factor (1+z)', ingles: 'cosmological time dilation',
      ecuacion: String.raw`n(z) \,=\, \frac{1}{1+z}\,\frac{\mathrm{d}V_c}{\mathrm{d}z}, \qquad \frac{\mathrm{d}V_c}{\mathrm{d}z} \,\propto\, \frac{D_C^2(z)}{E(z)}, \qquad E(z) \,=\, \sqrt{\Omega_m(1+z)^3 + \Omega_\Lambda}`,
      etiqueta: 'eq:methods:proj:wz',
      texto: [
        'El survey mide el tiempo con su reloj, el del observador. Un intervalo Δt del survey corresponde a Δt/(1+z) en el reposo de la supernova.',
        'Por eso, a z = 0.5, en un año del survey solo pasan 8 meses allá: explotan 1.5 veces menos supernovas por año del observador que por año en reposo.',
        'El mismo efecto estira la curva de luz por (1+z): su ventana visible dura más vista desde acá. El tiempo de control ya lo incluye.',
        'n(z) es la distribución en z de las supernovas que explotan durante un tiempo fijo del observador con tasa constante: el volumen por capa, dividido por (1+z).',
        'Si te olvidas del 1/(1+z), la exposición sale grande y la tasa chica. A z ~ 0.5 el error es de un tercio.',
      ],
      fuente: 'Tesis: cap. 4, sec:methods:proj:sampling. La cosmología es plana con H₀ = 70 y Ω_m = 0.3.',
    },
    {
      id: 'volumen', titulo: 'Volumen comóvil', ingles: 'comoving volume',
      ecuacion: String.raw`V \,=\, \Omega \int_{z_\mathrm{min}}^{z_\mathrm{max}} \frac{1}{1+z}\,\frac{\mathrm{d}V_c}{\mathrm{d}z\,\mathrm{d}\Omega}\,\mathrm{d}z`,
      etiqueta: 'el corchete de eq:methods:rates:ct',
      texto: [
        'Una tasa es por unidad de volumen: cuántas explotan por año en cada Mpc³. El volumen que mira un survey es su área en el cielo, Ω (en estereorradianes), por la profundidad entre z_min y z_max.',
        'Se usa el volumen comóvil, el que se expande con el universo, para que una misma densidad de galaxias dé el mismo número por Mpc³ a cualquier z. A z bajo crece como z³: un bin lejano tiene mucho más volumen que uno cercano.',
        'El 1/(1+z) es la dilatación del tiempo: un año en el observador es 1/(1+z) años en la galaxia, así que en el mismo tiempo de observación explotan menos supernovas lejanas por año del observador.',
      ],
      fuente: 'Tesis: cap. 5, sec:methods:rates:ct.',
    },
    {
      id: 'montecarlo', titulo: 'Exposición por simulación', ingles: 'Monte Carlo efficiency',
      ecuacion: String.raw`A_c(z_1, z_2) \,=\, \sum_f \Omega_f\, \frac{T_f}{365.25\,\mathrm{d}} \left[\int_{z_\mathrm{min}}^{z_{\mathrm{max},c}} \frac{1}{1+z}\,\frac{\mathrm{d}V_c}{\mathrm{d}z\,\mathrm{d}\Omega}\,\mathrm{d}z\right] \frac{1}{n_{\mathrm{sim},f}} \sum_{i \in \mathrm{found}_f} \omega_i\, p_i(z_1, z_2), \qquad r_c = \frac{N_c\, C_c}{A_c}`,
      etiqueta: 'eq:methods:rates:ct y eq:methods:rates:rate',
      texto: [
        'En vez de sumar tiempos de control, la tesis los mide con una simulación: lanza supernovas falsas sobre el registro de observación del survey y cuenta cuántas encuentra.',
        'Cada simulada recibe un z sorteado de n(z) y una fecha de explosión uniforme en la ventana T_f del campo. Así, la fracción encontrada n_sel/n_sim, multiplicada por el volumen y el tiempo, es directamente la exposición A.',
        'Es la misma cantidad que la suma de tiempos de control: lo compruebas en la niebla con el botón de las simuladas.',
        'La ventaja: lo que el survey le hace a una supernova real para encontrarla y seleccionarla (ruido, eficiencia de búsqueda, cortes de selección) se le hace también a las simuladas. La suma corre sobre las simuladas encontradas y seleccionadas: ω_i es su peso (subtipo, polvo, corte en m50) y p_i la probabilidad de que su z observado caiga en el bin (capítulo 4). La tesis proyecta cientos de miles de supernovas sobre el registro de SUDARE.',
        'La clasificación no entra en A: entra en N, que es una suma de probabilidades de tipo (capítulo 4).',
        'C es el factor de completitud, mayor o igual a 1: multiplica N para corregir por las seleccionadas que el clasificador no puede clasificar (capítulo 4). En SUDARE I el clasificador de plantillas las clasifica todas.',
        'Además, toda la exposición se multiplica por 1 − e_SN, la fracción de supernovas verdaderas que saca la limpieza de AGN (capítulo 4).',
      ],
      fuente: 'Tesis: cap. 5, sec:methods:rates:ct. Reglas de la tasa de SUDARE, 4.5.',
    },
  ];

  // El árbol de instrumentos (diseño, sección 5.2): cada nodo es un término o una herramienta de la cadena de la tasa.
  const ARBOL = [
    ['tasa', 'Contar'], ['tiempo_control', 'Tiempo de control'], ['volumen', 'Volumen'], ['dilatacion', '(1+z)'],
    ['eficiencia', 'Eficiencia de búsqueda'], ['montecarlo', 'Simulación Monte Carlo'], ['lf', 'Función de luminosidad'],
    ['polvo', 'Polvo'], ['subtipos', 'Subtipos'], ['kcorr', 'K-corrección'], ['simetria', 'Selección simétrica'],
    ['clasificador', 'Clasificador'], ['prior', 'Prior P1(z)'], ['errorz', 'Error del z'], ['completitud', 'Completitud'],
    ['poisson', 'Gehrels'], ['sistematicos', 'Sistemáticos'], ['imf', 'IMF'], ['sfh', 'SFH'], ['dtd', 'DTD'],
  ];
  const agregar = lista => PAGINAS.push(...lista);
  const valor = x => (typeof x === 'function' ? x() : x);
  function render(contenedor, desbloqueados, ejemplos = {}) {
    const paginas = PAGINAS.filter(p => desbloqueados.includes(p.id));
    contenedor.innerHTML = `
      <h1>Cuaderno</h1>
      <p class="tenue no-imprimir">Una página por cada término que desbloqueas, todas en orden. Toca un término para ir a su página;
        los que tienen candado se desbloquean jugando. Al final del juego tiene el cálculo completo de la tasa de la tesis.</p>
      <div class="arbol no-imprimir">${ARBOL.map(([id, n]) => desbloqueados.includes(id) && PAGINAS.some(p => p.id === id)
        ? `<button class="nodo si" data-ir="${id}">${n}</button>` : `<span class="nodo">🔒 ${n}</span>`).join('')}</div>
      <p class="no-imprimir"><button id="imprimir">Imprimir cuaderno</button></p>
      ${paginas.length ? '' : '<p>Todavía no hay páginas. Juega la misión 0.1.</p>'}
      ${paginas.map(p => `
        <article class="pagina" id="pag-${p.id}">
          <h2>${p.titulo} <span class="tenue">(${p.ingles})</span></h2>
          <div class="ecuacion" data-tex="${encodeURIComponent(p.ecuacion)}"></div>
          <p class="etiqueta">${p.etiqueta}</p>
          ${valor(p.texto).map(t => `<p>${valor(t)}</p>`).join('')}
          ${p.extra ? p.extra() : ''}
          ${ejemplos[p.id] ? `<p class="ejemplo"><b>Tu partida:</b> ${ejemplos[p.id]}</p>` : ''}
          <p class="tenue">${p.fuente}</p>
          <p class="no-imprimir"><a href="#" data-arriba="1">↑ volver al índice</a></p>
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
