// Páginas del cuaderno de los capítulos 2 a 7. Las ecuaciones son las de la tesis con su etiqueta; los números de la tesis salen
// de data/tesis.js y data/plantillas.js en el momento de mostrar la página, nunca escritos a mano.
(() => {
  const T = window.TESIS, PL = window.PLANTILLAS, N = T.numeros;
  const f2 = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : '–');
  const fuenteTesis = () => {
    const l = Object.entries(T.generado.entradas).map(([k, v]) => `${k} (${[v.fecha, v.codigo_git && `commit ${v.codigo_git.slice(0, 7)}`].filter(Boolean).join(', ')})`).join(', ');
    return Lg(`Números leídos de ${l}.`, `Numbers read from ${l}.`);
  };

  function tablaLF() {
    const g = {};
    for (const p of PL.plantillas) {
      const k = `${p.clase}|${p.subtipo}`;
      (g[k] = g[k] || { clase: p.clase, sub: p.subtipo, m: [], s: [], n: 0 }).n++;
      g[k].m.push(p.lf[0]); g[k].s.push(p.lf[1]);
    }
    const prom = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
    return `<table class="tabla"><tr><th>${Lg('clase', 'class')}</th><th>${Lg('subtipo', 'subtype')}</th><th>${Lg('plantillas', 'templates')}</th><th>${Lg('M medio de la LF', 'mean M of the LF')}</th><th>σ</th></tr>
      ${Object.values(g).map(x => `<tr><td>${x.clase}</td><td>${x.sub}</td><td>${x.n}</td><td>${f2(prom(x.m))}</td><td>${f2(prom(x.s))}</td></tr>`).join('')}</table>
      <p class="tenue">${Lg(`De la biblioteca de plantillas de SUDARE de la tesis (${PL.generado.biblioteca}). En las Ia, la media es la relación de Phillips con el
      Δm15 de cada plantilla, por eso se promedia.`, `From the SUDARE template library of the thesis (${PL.generado.biblioteca}). For the Ia, the mean is the Phillips relation evaluated at the
      Δm15 of each template, which is why it is averaged.`)}</p>`;
  }

  Cuaderno.agregar([
    {
      id: 'lf', titulo: Lg('Función de luminosidad', 'Luminosity function'), ingles: 'luminosity function',
      ecuacion: String.raw`P(M_\mathrm{pico}) \;=\; \mathcal{N}\!\left(\bar M_s,\; \sigma_s\right)`,
      etiqueta: Lg('una gaussiana por subtipo s, en su banda de referencia de reposo (sec:methods:proj:sampling; sin etiqueta propia)',
        'one Gaussian per subtype s, in its rest-frame reference band (sec:methods:proj:sampling, no label of its own)'),
      texto: [
        Lg('Las supernovas de una misma clase no tienen todas el mismo brillo: su magnitud absoluta en el pico sigue una distribución, la función de luminosidad.',
          'Supernovae of the same class do not all have the same brightness: their peak absolute magnitude follows a distribution, the luminosity function.'),
        Lg('Pesa en la tasa por el sesgo de Malmquist: el volumen en que ves una supernova crece como 10^(0.6 (m_lim − M)). Una clase más brillante se ve en mucho más volumen, y las detectadas sobrerrepresentan a las brillantes.',
          'It matters for the rate because of the Malmquist bias: the volume in which you see a supernova grows as 10^(0.6 (m_lim − M)). A brighter class is seen in much more volume, and the detected supernovae over-represent the bright ones.'),
        Lg('Para el tiempo de control lo que importa es la LF verdadera, no la de las detectadas. La tesis la toma de muestras volumétricas de la literatura, una por clase o subtipo, emparejada con su polvo (los pares aprobados de la proyección), y la valida comparando lo simulado con lo detectado en ZTF.',
          'For the control time what matters is the true LF, not that of the detected supernovae. The thesis takes it from volume-limited samples in the literature, one per class or subtype, paired with its dust (the approved pairs of the projection), and validates it by comparing what is simulated with what is detected in ZTF.'),
      ],
      extra: tablaLF,
      fuente: Lg('Tesis: cap. 4, sec:methods:proj:sampling. Reglas de la tasa de SUDARE, 4.5.',
        'Thesis: chap. 4, sec:methods:proj:sampling. SUDARE rate rules, 4.5.'),
    },
    {
      id: 'subtipos', titulo: Lg('Mezcla de subtipos', 'Subtype mix'), ingles: 'subtype mix',
      ecuacion: String.raw`\mathrm{CT}_\text{SN}(z) = \sum_{\text{SN}_i} \sum_{E_{B-V}}\, f_{\text{SN}_i}\, g_{E_{B-V}}\, \mathrm{CT}_{\text{SN}_i, E_{B-V}}(z)`,
      etiqueta: 'eq:intro:controltime',
      texto: [
        Lg('El tiempo de control de una clase es el promedio del de cada subtipo, pesado por su fracción f, y de cada valor del polvo del host, pesado por su probabilidad g.',
          'The control time of a class is the average of that of each subtype, weighted by its fraction f, and of each value of the host dust, weighted by its probability g.'),
        Lg('Por eso importa saber cuántas IIP, IIL o IIb hay entre las II: una IIP tiene una meseta larga y se ve mucho tiempo, una IIL cae rápido.',
          'That is why it matters how many IIP, IIL or IIb there are among the II: an IIP has a long plateau and stays visible for a long time, an IIL declines fast.'),
        () => {
          const m = Object.entries(T.reglas.mezcla_clase.II).map(([k, v]) => `${k} ${v}`).join(' : ');
          return Lg(`En el método vigente (paso 4) la mezcla es la de las simulaciones de la tesis, con las clases II : IIb en ${m}. La mezcla de SUDARE I y la variación de ±50 % de los subtipos cortos y largos son la fuente 3 del error sistemático.`,
            `In the current method (step 4) the mix is that of the thesis simulations, with the II : IIb classes in the ratio ${m}. The SUDARE I mix and the ±50 % variation of the short and long subtypes are source 3 of the systematic error.`);
        },
      ],
      fuente: Lg('Tesis: cap. 1, sec:intro:rates (ec. de SUDARE I). Reglas de la tasa de SUDARE, 4.5. docs/sistematicos_sudare.md, fuente 3.',
        'Thesis: chap. 1, sec:intro:rates (SUDARE I equation). SUDARE rate rules, 4.5. docs/sistematicos_sudare.md, source 3.'),
    },
    {
      id: 'kcorr', titulo: Lg('K-corrección', 'K-correction'), ingles: 'K-correction',
      ecuacion: String.raw`m_r \;=\; M_r \;+\; \mu(z) \;+\; K_r(z)`,
      etiqueta: Lg('definición (sin etiqueta propia en la tesis)', 'definition (no label of its own in the thesis)'),
      texto: [
        Lg('El telescopio mide siempre con el mismo filtro, pero la luz de una supernova lejana llega corrida al rojo: el filtro r ve, en reposo, una parte más azul del espectro. La diferencia de magnitud por eso es la K-corrección.',
          'The telescope always measures with the same filter, but the light of a distant supernova arrives redshifted: the r filter sees, in the rest frame, a bluer part of the spectrum. The magnitude difference this causes is the K-correction.'),
        Lg('Además la curva se estira por el (1+z) y cambia de forma, porque el azul se apaga más rápido que el rojo.',
          'In addition, the light curve is stretched by (1+z) and changes shape, because the blue fades faster than the red.'),
        Lg('La tesis no usa tablas de K-corrección: sus plantillas son series de espectros, así que la magnitud que ve el filtro a cada z sale de fotometría sintética exacta. La K-corrección viene incluida en cada curva simulada.',
          'The thesis does not use K-correction tables: its templates are spectral time series, so the magnitude the filter sees at each z comes from exact synthetic photometry. The K-correction is built into every simulated light curve.'),
      ],
      fuente: Lg('Tesis: cap. 4, proyección (sec:methods:proj:*); el clasificador de plantillas usa la misma fotometría sintética.',
        'Thesis: chap. 4, projection (sec:methods:proj:*). The template classifier uses the same synthetic photometry.'),
    },
    {
      id: 'polvo', titulo: Lg('Polvo del host', 'Host dust'), ingles: 'host-galaxy extinction',
      ecuacion: String.raw`P(E(B-V)_\mathrm{host}) \;=\; f_0\,\bigl|\mathcal{N}(0, \sigma_0)\bigr| \,+\, (1 - f_0)\, \frac{R_V}{\tau}\, \exp\!\left(-\frac{E(B-V)_\mathrm{host}\,R_V}{\tau}\right)`,
      etiqueta: 'eq:methods:proj:Pebmv',
      texto: [
        Lg('El polvo de la galaxia donde explota la supernova la oscurece y la enrojece. Una fracción f0 casi sin polvo (una gaussiana angosta) y el resto con una cola exponencial.',
          'The dust of the galaxy where the supernova explodes dims it and reddens it. A fraction f0 has almost no dust (a narrow Gaussian) and the rest follows an exponential tail.'),
        Lg('Más polvo en el modelo significa supernovas más débiles: menos tiempo de control y una tasa más alta. Por eso el polvo, como la LF, se fija con lo que se ve (la puerta de realismo) y no con la tasa.',
          'More dust in the model means fainter supernovae: less control time and a higher rate. That is why the dust, like the LF, is fixed with what is observed (the realism gate) and not with the rate.'),
        Lg('En el método vigente las II van sin polvo del host, con su LF observada, y las IIn con la LF impuesta después del polvo. Escalar el polvo por 0.5 y 1.5 es la fuente 4 del sistemático.',
          'In the current method the II have no host dust, with their observed LF, and the IIn have their LF imposed after the dust. Scaling the dust by 0.5 and 1.5 is source 4 of the systematic.'),
      ],
      fuente: Lg('Tesis: cap. 4, sec:methods:proj:reddening y sec:methods:proj:sampling. docs/sistematicos_sudare.md, fuente 4.',
        'Thesis: chap. 4, sec:methods:proj:reddening and sec:methods:proj:sampling. docs/sistematicos_sudare.md, source 4.'),
    },
    {
      id: 'eficiencia', titulo: Lg('Eficiencia de búsqueda', 'Search efficiency'), ingles: 'search efficiency',
      ecuacion: String.raw`\mathrm{DE}(m) \,=\, \mathrm{DE}_\mathrm{max} \left[\frac{\arctan\{\beta\,(m_{50} - m)\}}{\pi} + \frac{1}{2}\right]`,
      etiqueta: Lg('eq:methods:proj:sudare_de (ec. 1 de SUDARE I)', 'eq:methods:proj:sudare_de (eq. 1 of SUDARE I)'),
      texto: [
        Lg('Detectar no es encontrar. Una noche detecta la supernova si está sobre su límite. La búsqueda de SUDARE (restar imágenes y mirar candidatos) la encuentra con una probabilidad que cae alrededor del m50 de esa noche: la magnitud en que se encuentra la mitad.',
          'Detecting is not finding. A night detects the supernova if it is above its limit. The SUDARE search (subtracting images and inspecting candidates) finds it with a probability that drops around the m50 of that night: the magnitude at which half of them are found.'),
        () => {
          const B = window.SUDARE1.busqueda;
          return Lg(`En la simulación de la tesis la búsqueda corre solo en las noches con detección, con DE_max ${B.DE_max} y una pendiente de ${B.beta} (en SUDARE I esa pendiente se llama β, igual que la de la DTD del capítulo 6, pero no tienen nada que ver). La detección en la curva es en el límite menos ${B.umbral_det} mag, el umbral de S/N 3 medido en la fotometría real.`,
            `In the thesis simulation the search runs only on the nights with a detection, with DE_max ${B.DE_max} and a slope of ${B.beta} (in SUDARE I that slope is called β, like the DTD slope in chapter 6, but the two have nothing to do with each other). A point on the light curve counts as a detection down to the limit minus ${B.umbral_det} mag, the S/N 3 threshold measured in the real photometry.`);
        },
        Lg('La cola del arcotangente sigue más allá del m50: tomada al pie de la letra, encuentra supernovas que en la práctica no se encuentran. La tesis corta la eficiencia en el m50 (paso 1) y lo respalda con un observable propio: cuántas reales pican más débil que el m50.',
          'The arctangent tail continues beyond m50: taken literally, it finds supernovae that are not found in practice. The thesis cuts the efficiency at m50 (step 1) and backs this with an observable of its own: how many real supernovae peak fainter than m50.'),
        () => {
          const ia = T.paso1.bins.filter(b => b.tipo === 'Ia'), e = ia.map(b => f2(b.E0)).join(', '), l = ia.map(b => f2(b.literal, 1)).join(', ');
          return Lg(`Con la receta de SUDARE I y el corte, la exposición de las Ia sale ${e} veces la de su Tabla 5 por bin. Con la ec. 1 literal, ${l}.`,
            `With the SUDARE I recipe and the cut, the Ia exposure comes out at ${e} times that of its Table 5, bin by bin. With the literal eq. 1, ${l}.`);
        },
      ],
      fuente: Lg('Tesis: cap. 5, sec:methods:proj:sudare. Reglas de la tasa de SUDARE, paso 1. ct_ec3/escalera.json.',
        'Thesis: chap. 5, sec:methods:proj:sudare. SUDARE rate rules, step 1. ct_ec3/escalera.json.'),
    },
    {
      id: 'simetria', titulo: Lg('Selección simétrica', 'Symmetric selection'), ingles: 'symmetric selection',
      ecuacion: Lg(String.raw`r \;=\; \frac{N_S}{A_S}, \qquad S = \text{la misma regla en reales y simuladas}`,
        String.raw`r \;=\; \frac{N_S}{A_S}, \qquad S = \text{the same rule for real and simulated}`),
      etiqueta: Lg('regla de la tesis (reglas de la tasa, 4.4 y 4.5)', 'thesis rule (rate rules, 4.4 and 4.5)'),
      texto: [
        Lg('Todo lo que se le hace a una supernova real para contarla (cuántas detecciones pide, qué limpieza la saca) se le hace igual a las simuladas que miden la exposición. Si no, N y A cuentan cosas distintas y la tasa se sesga.',
          'Everything done to a real supernova to count it (how many detections it needs, which cleaning removes it) is done in the same way to the simulated ones that measure the exposure. Otherwise N and A count different things and the rate is biased.'),
        Lg('La tesis lo aplica en cada regla: al menos 4 detecciones con S/N ≥ 3 en ambas; la regla de varias temporadas también en las simuladas, con las detecciones falsas que tienen las curvas reales inyectadas; y la limpieza de AGN, que también saca supernovas verdaderas, con la exposición multiplicada por 1 − e_SN.',
          'The thesis applies it to every rule. Both need at least 4 detections with S/N ≥ 3. The multi-season rule also applies to the simulated ones, with the false detections of the real light curves injected. The AGN cleaning also removes true supernovae, so the exposure is multiplied by 1 − e_SN.'),
        Lg('La selección de SUDARE I no era simétrica (las reales pedían cinco mediciones, las simuladas una detección): por eso va solo en los pasos 2 y 3.',
          'The SUDARE I selection was not symmetric (the real ones needed five measurements, the simulated ones a single detection): that is why it appears only in steps 2 and 3.'),
      ],
      fuente: Lg('Reglas de la tasa de SUDARE, 4.3 a 4.5.', 'SUDARE rate rules, 4.3 to 4.5.'),
    },
    {
      id: 'clasificador', titulo: Lg('Clasificador de plantillas', 'Template classifier'), ingles: 'template classifier',
      ecuacion: String.raw`P_c \,=\, \frac{\pi_c\,\mathcal{Z}_c}{\sum_{c'} \pi_{c'}\,\mathcal{Z}_{c'}}, \qquad N_c \,=\, \sum_i w_i\, P_{i,c}`,
      etiqueta: Lg('eq:methods:classify:pclass y eq:methods:rates:count', 'eq:methods:classify:pclass and eq:methods:rates:count'),
      texto: [
        Lg('Cada plantilla j de la biblioteca predice la curva del candidato: m = L_j(z, E, t − T_max) + μ(z) + Δm, con el polvo E, la distancia μ(z) y el desplazamiento Δm de su brillo (eq:methods:classify:model).',
          'Each template j in the library predicts the light curve of the candidate: m = L_j(z, E, t − T_max) + μ(z) + Δm, with the dust E, the distance μ(z) and the brightness offset Δm (eq:methods:classify:model).'),
        Lg('La evidencia Z_c de una clase suma, sobre sus plantillas, la verosimilitud integrada sobre z, polvo, brillo y fecha del máximo, con los priors de la proyección: el clasificador y las simulaciones describen la misma población (eq:methods:classify:evidence).',
          'The evidence Z_c of a class sums, over its templates, the likelihood integrated over z, dust, brightness and date of maximum, with the priors of the projection: the classifier and the simulations describe the same population (eq:methods:classify:evidence).'),
        Lg('El ajuste es en flujo, con el error fotométrico más un error de modelo proporcional al flujo del modelo, elegido en la validación de ZTF, que representa la diversidad de las supernovas reales más allá de las plantillas (eq:methods:classify:var).',
          'The fit is done in flux, with the photometric error plus a model error proportional to the model flux, chosen in the ZTF validation, which represents the diversity of real supernovae beyond the templates (eq:methods:classify:var).'),
        Lg('La probabilidad de la clase multiplica la evidencia por el prior π_c. Las evidencias no dependen de π_c, así que cambiar el prior no pide un ajuste nuevo.',
          'The class probability multiplies the evidence by the prior π_c. The evidences do not depend on π_c, so changing the prior does not require a new fit.'),
        Lg('Para contar no se toma la clase más probable: N_c suma las probabilidades, con peso w = 1, y 0.5 para las supernovas probables (PSN). Así la duda de cada clasificación queda en el conteo.',
          'Counting does not take the most probable class: N_c sums the probabilities, with weight w = 1, and 0.5 for the probable supernovae (PSN). This way the uncertainty of each classification stays in the count.'),
      ],
      fuente: Lg('Tesis: cap. 4, sec:methods:classify; cap. 5, sec:methods:rates:count.',
        'Thesis: chap. 4, sec:methods:classify. Chap. 5, sec:methods:rates:count.'),
    },
    {
      id: 'prior', titulo: Lg('Prior de clase P1(z)', 'Class prior P1(z)'), ingles: 'class prior',
      ecuacion: String.raw`P_1:\; \pi_c \,\propto\, \sum_{s \in c} f_s\, g_s(z)\, V_s \qquad P_0:\; \pi_c \,\propto\, f_c\, g_c(z)`,
      etiqueta: Lg('sec:methods:rates:conv (sin etiqueta propia)', 'sec:methods:rates:conv (no label of its own)'),
      texto: [
        Lg('P1 es la fracción de cada tipo entre los candidatos que el survey detecta: la fracción local del subtipo, la evolución de su tasa y su volumen efectivo. P0 es la fracción entre las que explotan a ese z.',
          'P1 is the fraction of each type among the candidates that the survey detects: the local fraction of the subtype, the evolution of its rate and its effective volume. P0 is the fraction among those that explode at that z.'),
        Lg('Por Bayes, con el z conocido la evidencia ya contiene el volumen, y P1 lo cuenta dos veces: la deducción pide P0. La regla escrita antes era empírica y la decidió el BTS de ZTF.',
          'By Bayes, with z known the evidence already contains the volume, and P1 counts it twice: the derivation calls for P0. The rule written in advance was empirical, and the ZTF BTS decided it.'),
        () => {
          const a = f2(T.bts.regla.S_balanceado, 3), b = f2(T.bts.regla.S_P1, 3), c = f2(T.bts.regla.P0_informativo.S_P0, 3);
          return Lg(`En el BTS, S = |1 − q_Ia| + |1 − q_CC| bajó de ${a} (prior plano) a ${b} con P1. P0 dio ${c}. Se adoptó P1.`,
            `In the BTS, S = |1 − q_Ia| + |1 − q_CC| dropped from ${a} (flat prior) to ${b} with P1. P0 gave ${c}. P1 was adopted.`);
        },
        () => {
          const g = Object.entries(T.reglas.prior_P1_global).map(([k, v]) => `${k} ${f2(v, 3)}`).join(', ');
          return Lg(`SUDARE cubre z de 0.05 a 0.75 y la fracción de Ia entre los detectados crece con z. El P1 global (${g}) infla las Ia en los bines bajos. Las tasas usan P1(z), el P1 del bin fino de z que contiene al candidato.`,
            `SUDARE covers z from 0.05 to 0.75, and the Ia fraction among the detected candidates grows with z. The global P1 (${g}) inflates the Ia in the low bins. The rates use P1(z), the P1 of the fine z bin that contains the candidate.`);
        },
        Lg('P1(z) no se pudo validar en el BTS, cuyo rango de z es angosto. P0(z) y las sensibilidades de P1 escritas en el protocolo van al error sistemático (fuente 2a).',
          'P1(z) could not be validated in the BTS, whose z range is narrow. P0(z) and the P1 sensitivities written in the protocol go into the systematic error (source 2a).'),
      ],
      fuente: Lg('Tesis: cap. 5, sec:methods:rates:conv y sec:results:bts. prior_fisico_bts.json.',
        'Thesis: chap. 5, sec:methods:rates:conv and sec:results:bts. prior_fisico_bts.json.'),
    },
    {
      id: 'errorz', titulo: Lg('Error del z y migración', 'Redshift error and bin migration'), ingles: 'redshift error and bin migration',
      ecuacion: String.raw`A_c(z_1, z_2) \,\propto\, \frac{1}{n_\mathrm{sim}} \sum_{i \in \mathrm{found}} \omega_i\, p_i(z_1, z_2)`,
      etiqueta: Lg('eq:methods:rates:ct (la parte de la suma)', 'eq:methods:rates:ct (the sum part)'),
      texto: [
        Lg('Una supernova entra al bin de su z, y el error de ese z la mueve de bin. Como el volumen crece con z, el error manda más supernovas de z alto a z bajo que al revés.',
          'A supernova enters the bin of its z, and the error of that z moves it to another bin. Since the volume grows with z, the error sends more supernovae from high z to low z than the other way round.'),
        Lg('Por eso la exposición se bina por el z observado: cada simulada encontrada recibe la probabilidad p_i de que su z observado caiga en cada bin, con el modelo de error de una real de su grupo (Ia o CC) y su parte.',
          'That is why the exposure is binned by the observed z: each simulated supernova that is found receives the probability p_i that its observed z falls in each bin, with the error model of a real supernova of its group (Ia or CC) and its share.'),
        () => {
          const f = T.reglas.migracion_fracciones, fr = g => ['espec', 'fot', 'sin_host'].map(k => f2(f[g][k])).join(', ');
          const ia = fr('sudare_I|Ia'), cc = fr('sudare_I|CC');
          return Lg(`Una real tiene un z espectroscópico del host (sin error), uno fotométrico (con el error de los photo-z reales) o no tiene host (el error del ajuste, medido en simuladas clasificadas sin el z de su host). En SUDARE I las fracciones son ${ia} en las Ia y ${cc} en las CC.`,
            `A real supernova has a spectroscopic z from its host (no error), a photometric one (with the error of the real photo-z) or no host (the error of the fit, measured on simulated supernovae classified without the z of their host). In SUDARE I the fractions are ${ia} for the Ia and ${cc} for the CC.`);
        },
        Lg('El z de las sin host sale del mismo ajuste de plantillas que da su tipo. Tiende a salir bajo, y el que ajustó el equipo de SUDARE más.',
          'The z of the supernovae without a host comes from the same template fit that gives their type. It tends to come out low, and the one fitted by the SUDARE team even lower.'),
      ],
      fuente: Lg('Tesis: cap. 5, sec:methods:rates:z.', 'Thesis: chap. 5, sec:methods:rates:z.'),
    },
    {
      id: 'completitud', titulo: Lg('Completitud y limpieza', 'Completeness and cleaning'), ingles: 'completeness and cleaning',
      ecuacion: String.raw`C_c(z_1, z_2) \,=\, \frac{\sum_{i \in \mathrm{selected}} w_i}{\sum_{i \in \mathrm{classified}} w_i}`,
      etiqueta: 'eq:methods:rates:completeness',
      texto: [
        Lg('Una seleccionada que el clasificador no puede clasificar se corrige en su bin con C, suponiendo que tiene la mezcla de tipos de las clasificadas. En SUDARE I el clasificador de plantillas clasifica todas, y C solo se aparta de 1 en las temporadas posteriores.',
          'A selected supernova that the classifier cannot classify is corrected for in its bin with C, assuming it has the type mix of the classified ones. In SUDARE I the template classifier classifies all of them, and C departs from 1 only in the later seasons.'),
        () => {
          const e = f2(T.e_sn.valor, 3);
          return Lg(`La limpieza de AGN (regla R2) saca todo candidato que coincide con un AGN o una fuente de rayos X. Una SN verdadera también puede caer encima por azar: e_SN = ${e} (${T.e_sn.k} de ${T.e_sn.n} Ia seguras), y toda la exposición se multiplica por 1 − e_SN para que la limpieza sea simétrica.`,
            `The AGN cleaning (rule R2) removes every candidate that coincides with an AGN or an X-ray source. A true SN can also fall on top of one by chance: e_SN = ${e} (${T.e_sn.k} of ${T.e_sn.n} secure Ia), and the whole exposure is multiplied by 1 − e_SN so that the cleaning is symmetric.`);
        },
        () => {
          const iin = (100 * T.agn_por_clase.IIn).toFixed(0), ia = (100 * T.agn_por_clase.Ia).toFixed(0);
          return Lg(`Las IIn coinciden más con AGN (${iin} %) que las Ia (${ia} %): un núcleo activo varía lento y el clasificador lo manda a la clase de curvas largas.`,
            `The IIn coincide with AGN more often (${iin} %) than the Ia (${ia} %): an active nucleus varies slowly and the classifier sends it to the class with long light curves.`);
        },
        () => Lg(`Las PSN pesan ${T.reglas.peso_psn}. En las temporadas posteriores la fracción medida de PSN que son SNe respalda ese peso, y su rango va al sistemático (fuente 1).`,
          `PSN carry a weight of ${T.reglas.peso_psn}. In the later seasons the measured fraction of PSN that are SNe supports that weight, and its range goes into the systematic (source 1).`),
      ],
      fuente: Lg('Tesis: cap. 5, sec:methods:rates:count y la limpieza de AGN. diag_iin.json.',
        'Thesis: chap. 5, sec:methods:rates:count and the AGN cleaning. diag_iin.json.'),
    },
    {
      id: 'sistematicos', titulo: Lg('Error sistemático', 'Systematic error'), ingles: 'systematic error budget',
      ecuacion: Lg(String.raw`\sigma_\pm \,=\, \sqrt{\sum_s \left(\Delta r_{s,\pm}\right)^2}, \qquad \Delta r_s = r(\text{supuesto alternativo}) - r`,
        String.raw`\sigma_\pm \,=\, \sqrt{\sum_s \left(\Delta r_{s,\pm}\right)^2}, \qquad \Delta r_s = r(\text{alternative assumption}) - r`),
      etiqueta: Lg('sec:methods:rates:syst (sin etiqueta propia)', 'sec:methods:rates:syst (no label of its own)'),
      texto: [
        Lg('El error estadístico sale de contar pocas supernovas: Gehrels (1986) a 1σ sobre el N total del bin. Con pocas es asimétrico, más largo hacia arriba.',
          'The statistical error comes from counting few supernovae: Gehrels (1986) at 1σ on the total N of the bin. With few of them it is asymmetric, longer upwards.'),
        Lg('El sistemático sale de los supuestos. Cada fuente reemplaza un supuesto por una alternativa razonable y recalcula la tasa con todo lo demás fijo. Si hay alternativas a los dos lados, cada una va a su lado. Una sola alternativa va solo al lado donde cae, sin simetrizar. Cada lado se suma en cuadratura.',
          'The systematic comes from the assumptions. Each source replaces an assumption with a reasonable alternative and recomputes the rate with everything else fixed. If there are alternatives on both sides, each goes to its own side. A single alternative goes only to the side where it falls, without symmetrising. Each side is summed in quadrature.'),
        Lg('Las alternativas del tiempo de control no piden simular de nuevo: cada supernova simulada se repesa con la probabilidad exacta de cumplir el supuesto alternativo.',
          'The control-time alternatives do not require a new simulation: each simulated supernova is reweighted with the exact probability of meeting the alternative assumption.'),
        () => {
          const c0 = T.sistematico.por_columna[0], d = Object.entries(c0.fuentes).filter(([, v]) => v.en_total).sort((x, y) => y[1].menos - x[1].menos)[0];
          const nombre = T.sistematico.fuentes[d[0]].nombre;
          return Lg(`En la Ia ${c0.columna.slice(3)} el total es −${f2(c0.total.menos)} / +${f2(c0.total.mas)}, y la fuente que más pesa hacia abajo es la ${d[0]} (${nombre}), con −${f2(d[1].menos)}.`,
            `For the Ia ${c0.columna.slice(3)} bin the total is −${f2(c0.total.menos)} / +${f2(c0.total.mas)}, and the source that weighs most downwards is source ${d[0]} (${FUENTES_EN[d[0]] || nombre}), with −${f2(d[1].menos)}.`);
        },
        Lg('La literatura es una alarma, no una meta (regla 0): si una tasa cae fuera de su rango se busca la causa y se declara, pero no se cambia de variante por eso. Las reglas adoptadas después de ver un resultado se declaran con su fecha y su efecto.',
          'The literature is an alarm, not a target (rule 0): if a rate falls outside its range the cause is sought and declared, but the variant is not changed because of it. Rules adopted after seeing a result are declared with their date and their effect.'),
      ],
      fuente: Lg('Tesis: cap. 5, sec:methods:rates:syst y el apéndice sec:appendix:sudare:variants. Reglas de la tasa de SUDARE, 0, 4.6 y 7.',
        'Thesis: chap. 5, sec:methods:rates:syst and the appendix sec:appendix:sudare:variants. SUDARE rate rules, 0, 4.6 and 7.'),
    },
    {
      id: 'imf', titulo: Lg('IMF y K_CC', 'IMF and K_CC'), ingles: 'initial mass function',
      ecuacion: String.raw`K_\mathrm{CC} \,=\, \frac{\int_{8}^{40} \phi(m)\,\mathrm{d}m}{\int_{0.1}^{100} m\,\phi(m)\,\mathrm{d}m}`,
      etiqueta: Lg('sec:results:sfh (sin etiqueta propia)', 'sec:results:sfh (no label of its own)'),
      texto: [
        Lg('La IMF φ(m) dice cuántas estrellas nacen de cada masa. K_CC es el número de estrellas de 8 a 40 M☉, las que explotan como CC, por cada M☉ formada.',
          'The IMF φ(m) says how many stars are born with each mass. K_CC is the number of stars from 8 to 40 M☉, the ones that explode as CC, per M☉ formed.'),
        () => {
          const k = f2(1e2 * T.sfh.imf.Kroupa.K_CC_8_40, 2), s = f2(1e2 * T.sfh.imf.Salpeter.K_CC_8_40, 2), n = f2(1e2 * T.sfh.imf.Kroupa.N_3_8, 2);
          return Lg(`Con Kroupa, K_CC = ${k} × 10⁻² M☉⁻¹, y con Salpeter ${s} × 10⁻². Las de 3 a 8 M☉, las progenitoras posibles de las Ia, son ${n} × 10⁻² por M☉ con Kroupa.`,
            `With Kroupa, K_CC = ${k} × 10⁻² M☉⁻¹, and with Salpeter ${s} × 10⁻². The stars from 3 to 8 M☉, the possible progenitors of the Ia, are ${n} × 10⁻² per M☉ with Kroupa.`);
        },
        Lg('La IMF y la SFH van emparejadas: una SFH medida con una IMF se convierte a otra con un factor fijo (Salpeter a Kroupa, × ' + f2(T.sfh.imf.psi_kroupa_sobre_salpeter, 3) + ').',
          'The IMF and the SFH go in pairs: an SFH measured with one IMF is converted to another with a fixed factor (Salpeter to Kroupa, × ' + f2(T.sfh.imf.psi_kroupa_sobre_salpeter, 3) + ').'),
      ],
      fuente: Lg('Tesis: cap. 5, sec:results:sfh. ajuste.json (imf).', 'Thesis: chap. 5, sec:results:sfh. ajuste.json (imf).'),
    },
    {
      id: 'sfh', titulo: Lg('Historia de formación estelar', 'Star-formation history'), ingles: 'cosmic star-formation history',
      ecuacion: String.raw`\psi_\mathrm{MF17}(z) \,=\, 0.01\, \frac{(1+z)^{2.6}}{1+\left[(1+z)/3.2\right]^{6.2}}\; M_\odot\,\mathrm{yr}^{-1}\,\mathrm{Mpc}^{-3}`,
      etiqueta: Lg('eq:results:sfh:mf17 (y eq:methods:rates:md14 para MD14)', 'eq:results:sfh:mf17 (and eq:methods:rates:md14 for MD14)'),
      texto: [
        Lg('ψ(z) es la masa en estrellas que forma el universo por año y por Mpc³. Sube desde hoy hasta un máximo cerca de z ≈ 2 y cae a z más alto.',
          'ψ(z) is the mass in stars that the universe forms per year and per Mpc³. It rises from today to a maximum near z ≈ 2 and falls at higher z.'),
        Lg('Las CC siguen a ψ del momento, porque sus progenitoras viven menos de ~40 Myr: r_CC = K_CC ψ. Si una parte de las CC queda oculta por polvo, lo medido es K_CC ψ (1 − f_oculta).',
          'The CC follow the ψ of the moment, because their progenitors live less than ~40 Myr: r_CC = K_CC ψ. If part of the CC is hidden by dust, what is measured is K_CC ψ (1 − f_hidden).'),
        () => {
          const y = Lg(' y ', ' and '), a = T.sfh.cc.MF17_Kroupa.cociente.map(x => f2(x)).join(y), b = T.sfh.cc.MF17_Kroupa_ocultas.cociente.map(x => f2(x)).join(y);
          return Lg(`En la tesis, con MF17 y Kroupa, lo medido sobre lo predicho en las CC de SUDARE es ${a}, y con la fracción de ocultas ${b}.`,
            `In the thesis, with MF17 and Kroupa, the ratio of measured to predicted for the SUDARE CC is ${a}, and with the hidden fraction ${b}.`);
        },
      ],
      fuente: Lg('Tesis: cap. 5, sec:results:sfh y sec:methods:rates.', 'Thesis: chap. 5, sec:results:sfh and sec:methods:rates.'),
    },
    {
      id: 'dtd', titulo: Lg('Distribución de retardos (DTD)', 'Delay-time distribution (DTD)'), ingles: 'delay-time distribution',
      ecuacion: String.raw`r_\text{Ia}(t) = K_\text{Ia} \int_{\tau_i}^{\min(t,\tau_x)} f_\text{Ia}(\tau)\, \mathrm{SFR}(t-\tau)\, \mathrm{d}\tau`,
      etiqueta: 'eq:intro:rate_Ia',
      texto: [
        Lg('Una Ia explota un retardo τ después de que se formó su estrella. f(τ) dice cómo se reparten esos retardos. La tasa a un tiempo t es la suma de los goteos de todas las generaciones anteriores.',
          'An Ia explodes a delay τ after its star formed. f(τ) says how those delays are distributed. The rate at a time t is the sum of the trickles from all earlier generations.'),
        Lg('Con una ley de potencias f ∝ τ^β desde 40 Myr, K se resuelve analítico para cada β: K̂ = Σ r m / σ² / Σ m² / σ², y el χ² dice qué tan bien pasa el modelo.',
          'With a power law f ∝ τ^β from 40 Myr, K is solved analytically for each β: K̂ = Σ r m / σ² / Σ m² / σ², and the χ² says how well the model fits.'),
        () => {
          const p = 'sfh.paso3.todas+nuestras.MF17.';
          return Lg(`Con las cuatro tasas de SUDARE, β no queda acotado (β libre ${N['sfh.paso2.beta_libre']}). Con toda la literatura (${N[p + 'n']} tasas, MF17): β = ${N[p + 'beta']} +${N[p + 'beta_mas']} −${N[p + 'beta_menos']} y N/M★ = ${N[p + 'N_M']} × 10⁻³ M☉⁻¹.`,
            `With the four SUDARE rates, β is not constrained (free β ${N['sfh.paso2.beta_libre']}). With all the literature (${N[p + 'n']} rates, MF17): β = ${N[p + 'beta']} +${N[p + 'beta_mas']} −${N[p + 'beta_menos']} and N/M★ = ${N[p + 'N_M']} × 10⁻³ M☉⁻¹.`);
        },
        Lg('La SFH elegida mueve N/M★ y casi no mueve β. Entre los modelos de Greggio, los de doble degenerada ancha quedan desfavorecidos.',
          'The chosen SFH moves N/M★ and barely moves β. Among the Greggio models, the wide double-degenerate ones are disfavoured.'),
      ],
      fuente: Lg('Tesis: cap. 1, sec:intro:rates; cap. 5, sec:results:sfh. ajuste.json y numeros_tasas_final.json.',
        'Thesis: chap. 1, sec:intro:rates. Chap. 5, sec:results:sfh. ajuste.json and numeros_tasas_final.json.'),
    },
  ]);
  window.CuadernoFuenteTesis = fuenteTesis;
})();
