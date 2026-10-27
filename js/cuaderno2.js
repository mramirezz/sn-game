// Páginas del cuaderno de los capítulos 2 a 7. Las ecuaciones son las de la tesis con su etiqueta; los números de la tesis salen
// de data/tesis.js y data/plantillas.js en el momento de mostrar la página, nunca escritos a mano.
(() => {
  const T = window.TESIS, PL = window.PLANTILLAS, N = T.numeros;
  const f2 = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : '–');
  const fuenteTesis = () => `Números leídos de ${Object.entries(T.generado.entradas).map(([k, v]) => `${k} (${[v.fecha, v.codigo_git && `commit ${v.codigo_git.slice(0, 7)}`].filter(Boolean).join(', ')})`).join(', ')}.`;

  function tablaLF() {
    const g = {};
    for (const p of PL.plantillas) {
      const k = `${p.clase}|${p.subtipo}`;
      (g[k] = g[k] || { clase: p.clase, sub: p.subtipo, m: [], s: [], n: 0 }).n++;
      g[k].m.push(p.lf[0]); g[k].s.push(p.lf[1]);
    }
    const prom = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
    return `<table class="tabla"><tr><th>clase</th><th>subtipo</th><th>plantillas</th><th>M medio de la LF</th><th>σ</th></tr>
      ${Object.values(g).map(x => `<tr><td>${x.clase}</td><td>${x.sub}</td><td>${x.n}</td><td>${f2(prom(x.m))}</td><td>${f2(prom(x.s))}</td></tr>`).join('')}</table>
      <p class="tenue">De la biblioteca de plantillas de SUDARE de la tesis (${PL.generado.biblioteca}). En las Ia, la media es la relación de Phillips con el
      Δm15 de cada plantilla, por eso se promedia.</p>`;
  }

  Cuaderno.agregar([
    {
      id: 'lf', titulo: 'Función de luminosidad', ingles: 'luminosity function',
      ecuacion: String.raw`P(M_\mathrm{pico}) \;=\; \mathcal{N}\!\left(\bar M_s,\; \sigma_s\right)`,
      etiqueta: 'una gaussiana por subtipo s, en su banda de referencia de reposo (sec:methods:proj:sampling; sin etiqueta propia)',
      texto: [
        'Las supernovas de una misma clase no tienen todas el mismo brillo: su magnitud absoluta en el pico sigue una distribución, la función de luminosidad.',
        'Pesa en la tasa por el sesgo de Malmquist: el volumen en que ves una supernova crece como 10^(0.6 (m_lim − M)). Una clase más brillante se ve en mucho más volumen, y las detectadas sobrerrepresentan a las brillantes.',
        'Para el tiempo de control lo que importa es la LF verdadera, no la de las detectadas. La tesis la toma de muestras volumétricas de la literatura, una por clase o subtipo, emparejada con su polvo (los pares aprobados de la proyección), y la valida comparando lo simulado con lo detectado en ZTF.',
      ],
      extra: tablaLF,
      fuente: 'Tesis: cap. 4, sec:methods:proj:sampling. Reglas de la tasa de SUDARE, 4.5.',
    },
    {
      id: 'subtipos', titulo: 'Mezcla de subtipos', ingles: 'subtype mix',
      ecuacion: String.raw`\mathrm{CT}_\text{SN}(z) = \sum_{\text{SN}_i} \sum_{E_{B-V}}\, f_{\text{SN}_i}\, g_{E_{B-V}}\, \mathrm{CT}_{\text{SN}_i, E_{B-V}}(z)`,
      etiqueta: 'eq:intro:controltime',
      texto: [
        'El tiempo de control de una clase es el promedio del de cada subtipo, pesado por su fracción f, y de cada valor del polvo del host, pesado por su probabilidad g.',
        'Por eso importa saber cuántas IIP, IIL o IIb hay entre las II: una IIP tiene una meseta larga y se ve mucho tiempo, una IIL cae rápido.',
        () => `En el método vigente (paso 4) la mezcla es la de las simulaciones de la tesis, con las clases II : IIb en ${Object.entries(T.reglas.mezcla_clase.II).map(([k, v]) => `${k} ${v}`).join(' : ')}. La mezcla de SUDARE I y la variación de ±50 % de los subtipos cortos y largos son la fuente 3 del error sistemático.`,
      ],
      fuente: 'Tesis: cap. 1, sec:intro:rates (ec. de SUDARE I). Reglas de la tasa de SUDARE, 4.5. docs/sistematicos_sudare.md, fuente 3.',
    },
    {
      id: 'kcorr', titulo: 'K-corrección', ingles: 'K-correction',
      ecuacion: String.raw`m_r \;=\; M_r \;+\; \mu(z) \;+\; K_r(z)`,
      etiqueta: 'definición (sin etiqueta propia en la tesis)',
      texto: [
        'El telescopio mide siempre con el mismo filtro, pero la luz de una supernova lejana llega corrida al rojo: el filtro r ve, en reposo, una parte más azul del espectro. La diferencia de magnitud por eso es la K-corrección.',
        'Además la curva se estira por el (1+z) y cambia de forma, porque el azul se apaga más rápido que el rojo.',
        'La tesis no usa tablas de K-corrección: sus plantillas son series de espectros, así que la magnitud que ve el filtro a cada z sale de fotometría sintética exacta. La K-corrección viene incluida en cada curva simulada.',
      ],
      fuente: 'Tesis: cap. 4, proyección (sec:methods:proj:*); el clasificador de plantillas usa la misma fotometría sintética.',
    },
    {
      id: 'polvo', titulo: 'Polvo del host', ingles: 'host-galaxy extinction',
      ecuacion: String.raw`P(E(B-V)_\mathrm{host}) \;=\; f_0\,\bigl|\mathcal{N}(0, \sigma_0)\bigr| \,+\, (1 - f_0)\, \frac{R_V}{\tau}\, \exp\!\left(-\frac{E(B-V)_\mathrm{host}\,R_V}{\tau}\right)`,
      etiqueta: 'eq:methods:proj:Pebmv',
      texto: [
        'El polvo de la galaxia donde explota la supernova la oscurece y la enrojece. Una fracción f0 casi sin polvo (una gaussiana angosta) y el resto con una cola exponencial.',
        'Más polvo en el modelo significa supernovas más débiles: menos tiempo de control y una tasa más alta. Por eso el polvo, como la LF, se fija con lo que se ve (la puerta de realismo) y no con la tasa.',
        'En el método vigente las II van sin polvo del host, con su LF observada, y las IIn con la LF impuesta después del polvo. Escalar el polvo por 0.5 y 1.5 es la fuente 4 del sistemático.',
      ],
      fuente: 'Tesis: cap. 4, sec:methods:proj:reddening y sec:methods:proj:sampling. docs/sistematicos_sudare.md, fuente 4.',
    },
    {
      id: 'eficiencia', titulo: 'Eficiencia de búsqueda', ingles: 'search efficiency',
      ecuacion: String.raw`\mathrm{DE}(m) \,=\, \mathrm{DE}_\mathrm{max} \left[\frac{\arctan\{\beta\,(m_{50} - m)\}}{\pi} + \frac{1}{2}\right]`,
      etiqueta: 'eq:methods:proj:sudare_de (ec. 1 de SUDARE I)',
      texto: [
        'Detectar no es encontrar. Una noche detecta la supernova si está sobre su límite. La búsqueda de SUDARE (restar imágenes y mirar candidatos) la encuentra con una probabilidad que cae alrededor del m50 de esa noche: la magnitud en que se encuentra la mitad.',
        () => `En la simulación de la tesis la búsqueda corre solo en las noches con detección, con DE_max ${window.SUDARE1.busqueda.DE_max} y una pendiente de ${window.SUDARE1.busqueda.beta} (en SUDARE I esa pendiente se llama β, igual que la de la DTD del capítulo 6, pero no tienen nada que ver). La detección en la curva es en el límite menos ${window.SUDARE1.busqueda.umbral_det} mag, el umbral de S/N 3 medido en la fotometría real.`,
        'La cola del arcotangente sigue más allá del m50: tomada al pie de la letra, encuentra supernovas que en la práctica no se encuentran. La tesis corta la eficiencia en el m50 (paso 1) y lo respalda con un observable propio: cuántas reales pican más débil que el m50.',
        () => `Con la receta de SUDARE I y el corte, la exposición de las Ia sale ${T.paso1.bins.filter(b => b.tipo === 'Ia').map(b => f2(b.E0)).join(', ')} veces la de su Tabla 5 por bin. Con la ec. 1 literal, ${T.paso1.bins.filter(b => b.tipo === 'Ia').map(b => f2(b.literal, 1)).join(', ')}.`,
      ],
      fuente: 'Tesis: cap. 5, sec:methods:proj:sudare. Reglas de la tasa de SUDARE, paso 1. ct_ec3/escalera.json.',
    },
    {
      id: 'simetria', titulo: 'Selección simétrica', ingles: 'symmetric selection',
      ecuacion: String.raw`r \;=\; \frac{N_S}{A_S}, \qquad S = \text{la misma regla en reales y simuladas}`,
      etiqueta: 'regla de la tesis (reglas de la tasa, 4.4 y 4.5)',
      texto: [
        'Todo lo que se le hace a una supernova real para contarla (cuántas detecciones pide, qué limpieza la saca) se le hace igual a las simuladas que miden la exposición. Si no, N y A cuentan cosas distintas y la tasa se sesga.',
        'La tesis lo aplica en cada regla: al menos 4 detecciones con S/N ≥ 3 en ambas; la regla de varias temporadas también en las simuladas, con las detecciones falsas que tienen las curvas reales inyectadas; y la limpieza de AGN, que también saca supernovas verdaderas, con la exposición multiplicada por 1 − e_SN.',
        'La selección de SUDARE I no era simétrica (las reales pedían cinco mediciones, las simuladas una detección): por eso va solo en los pasos 2 y 3.',
      ],
      fuente: 'Reglas de la tasa de SUDARE, 4.3 a 4.5.',
    },
    {
      id: 'clasificador', titulo: 'Clasificador de plantillas', ingles: 'template classifier',
      ecuacion: String.raw`P_c \,=\, \frac{\pi_c\,\mathcal{Z}_c}{\sum_{c'} \pi_{c'}\,\mathcal{Z}_{c'}}, \qquad N_c \,=\, \sum_i w_i\, P_{i,c}`,
      etiqueta: 'eq:methods:classify:pclass y eq:methods:rates:count',
      texto: [
        'Cada plantilla j de la biblioteca predice la curva del candidato: m = L_j(z, E, t − T_max) + μ(z) + Δm, con el polvo E, la distancia μ(z) y el desplazamiento Δm de su brillo (eq:methods:classify:model).',
        'La evidencia Z_c de una clase suma, sobre sus plantillas, la verosimilitud integrada sobre z, polvo, brillo y fecha del máximo, con los priors de la proyección: el clasificador y las simulaciones describen la misma población (eq:methods:classify:evidence).',
        'El ajuste es en flujo, con el error fotométrico más un error de modelo proporcional al flujo del modelo, elegido en la validación de ZTF, que representa la diversidad de las supernovas reales más allá de las plantillas (eq:methods:classify:var).',
        'La probabilidad de la clase multiplica la evidencia por el prior π_c. Las evidencias no dependen de π_c, así que cambiar el prior no pide un ajuste nuevo.',
        'Para contar no se toma la clase más probable: N_c suma las probabilidades, con peso w = 1, y 0.5 para las supernovas probables (PSN). Así la duda de cada clasificación queda en el conteo.',
      ],
      fuente: 'Tesis: cap. 4, sec:methods:classify; cap. 5, sec:methods:rates:count.',
    },
    {
      id: 'prior', titulo: 'Prior de clase P1(z)', ingles: 'class prior',
      ecuacion: String.raw`P_1:\; \pi_c \,\propto\, \sum_{s \in c} f_s\, g_s(z)\, V_s \qquad P_0:\; \pi_c \,\propto\, f_c\, g_c(z)`,
      etiqueta: 'sec:methods:rates:conv (sin etiqueta propia)',
      texto: [
        'P1 es la fracción de cada tipo entre los candidatos que el survey detecta: la fracción local del subtipo, la evolución de su tasa y su volumen efectivo. P0 es la fracción entre las que explotan a ese z.',
        'Por Bayes, con el z conocido la evidencia ya contiene el volumen, y P1 lo cuenta dos veces: la deducción pide P0. La regla escrita antes era empírica y la decidió el BTS de ZTF.',
        () => `En el BTS, S = |1 − q_Ia| + |1 − q_CC| bajó de ${f2(T.bts.regla.S_balanceado, 3)} (prior plano) a ${f2(T.bts.regla.S_P1, 3)} con P1. P0 dio ${f2(T.bts.regla.P0_informativo.S_P0, 3)}. Se adoptó P1.`,
        () => `SUDARE cubre z de 0.05 a 0.75 y la fracción de Ia entre los detectados crece con z. El P1 global (${Object.entries(T.reglas.prior_P1_global).map(([k, v]) => `${k} ${f2(v, 3)}`).join(', ')}) infla las Ia en los bines bajos. Las tasas usan P1(z), el P1 del bin fino de z que contiene al candidato.`,
        'P1(z) no se pudo validar en el BTS, cuyo rango de z es angosto. P0(z) y las sensibilidades de P1 escritas en el protocolo van al error sistemático (fuente 2a).',
      ],
      fuente: 'Tesis: cap. 5, sec:methods:rates:conv y sec:results:bts. prior_fisico_bts.json.',
    },
    {
      id: 'errorz', titulo: 'Error del z y migración', ingles: 'redshift error and bin migration',
      ecuacion: String.raw`A_c(z_1, z_2) \,\propto\, \frac{1}{n_\mathrm{sim}} \sum_{i \in \mathrm{found}} \omega_i\, p_i(z_1, z_2)`,
      etiqueta: 'eq:methods:rates:ct (la parte de la suma)',
      texto: [
        'Una supernova entra al bin de su z, y el error de ese z la mueve de bin. Como el volumen crece con z, el error manda más supernovas de z alto a z bajo que al revés.',
        'Por eso la exposición se bina por el z observado: cada simulada encontrada recibe la probabilidad p_i de que su z observado caiga en cada bin, con el modelo de error de una real de su grupo (Ia o CC) y su parte.',
        () => { const f = T.reglas.migracion_fracciones; return `Una real tiene un z espectroscópico del host (sin error), uno fotométrico (con el error de los photo-z reales) o no tiene host (el error del ajuste, medido en simuladas clasificadas sin el z de su host). En SUDARE I las fracciones son ${['espec', 'fot', 'sin_host'].map(k => f2(f['sudare_I|Ia'][k])).join(', ')} en las Ia y ${['espec', 'fot', 'sin_host'].map(k => f2(f['sudare_I|CC'][k])).join(', ')} en las CC.`; },
        'El z de las sin host sale del mismo ajuste de plantillas que da su tipo. Tiende a salir bajo, y el que ajustó el equipo de SUDARE más.',
      ],
      fuente: 'Tesis: cap. 5, sec:methods:rates:z.',
    },
    {
      id: 'completitud', titulo: 'Completitud y limpieza', ingles: 'completeness and cleaning',
      ecuacion: String.raw`C_c(z_1, z_2) \,=\, \frac{\sum_{i \in \mathrm{selected}} w_i}{\sum_{i \in \mathrm{classified}} w_i}`,
      etiqueta: 'eq:methods:rates:completeness',
      texto: [
        'Una seleccionada que el clasificador no puede clasificar se corrige en su bin con C, suponiendo que tiene la mezcla de tipos de las clasificadas. En SUDARE I el clasificador de plantillas clasifica todas, y C solo se aparta de 1 en las temporadas posteriores.',
        () => `La limpieza de AGN (regla R2) saca todo candidato que coincide con un AGN o una fuente de rayos X. Una SN verdadera también puede caer encima por azar: e_SN = ${f2(T.e_sn.valor, 3)} (${T.e_sn.k} de ${T.e_sn.n} Ia seguras), y toda la exposición se multiplica por 1 − e_SN para que la limpieza sea simétrica.`,
        () => `Las IIn coinciden más con AGN (${(100 * T.agn_por_clase.IIn).toFixed(0)} %) que las Ia (${(100 * T.agn_por_clase.Ia).toFixed(0)} %): un núcleo activo varía lento y el clasificador lo manda a la clase de curvas largas.`,
        () => `Las PSN pesan ${T.reglas.peso_psn}. En las temporadas posteriores la fracción medida de PSN que son SNe respalda ese peso, y su rango va al sistemático (fuente 1).`,
      ],
      fuente: 'Tesis: cap. 5, sec:methods:rates:count y la limpieza de AGN. diag_iin.json.',
    },
    {
      id: 'sistematicos', titulo: 'Error sistemático', ingles: 'systematic error budget',
      ecuacion: String.raw`\sigma_\pm \,=\, \sqrt{\sum_s \left(\Delta r_{s,\pm}\right)^2}, \qquad \Delta r_s = r(\text{supuesto alternativo}) - r`,
      etiqueta: 'sec:methods:rates:syst (sin etiqueta propia)',
      texto: [
        'El error estadístico sale de contar pocas supernovas: Gehrels (1986) a 1σ sobre el N total del bin. Con pocas es asimétrico, más largo hacia arriba.',
        'El sistemático sale de los supuestos. Cada fuente reemplaza un supuesto por una alternativa razonable y recalcula la tasa con todo lo demás fijo. Si hay alternativas a los dos lados, cada una va a su lado. Una sola alternativa va solo al lado donde cae, sin simetrizar. Cada lado se suma en cuadratura.',
        'Las alternativas del tiempo de control no piden simular de nuevo: cada supernova simulada se repesa con la probabilidad exacta de cumplir el supuesto alternativo.',
        () => { const c0 = T.sistematico.por_columna[0], d = Object.entries(c0.fuentes).filter(([, v]) => v.en_total).sort((x, y) => y[1].menos - x[1].menos)[0]; return `En la Ia ${c0.columna.slice(3)} el total es −${f2(c0.total.menos)} / +${f2(c0.total.mas)}, y la fuente que más pesa hacia abajo es la ${d[0]} (${T.sistematico.fuentes[d[0]].nombre}), con −${f2(d[1].menos)}.`; },
        'La literatura es una alarma, no una meta (regla 0): si una tasa cae fuera de su rango se busca la causa y se declara, pero no se cambia de variante por eso. Las reglas adoptadas después de ver un resultado se declaran con su fecha y su efecto.',
      ],
      fuente: 'Tesis: cap. 5, sec:methods:rates:syst y el apéndice sec:appendix:sudare:variants. Reglas de la tasa de SUDARE, 0, 4.6 y 7.',
    },
    {
      id: 'imf', titulo: 'IMF y K_CC', ingles: 'initial mass function',
      ecuacion: String.raw`K_\mathrm{CC} \,=\, \frac{\int_{8}^{40} \phi(m)\,\mathrm{d}m}{\int_{0.1}^{100} m\,\phi(m)\,\mathrm{d}m}`,
      etiqueta: 'sec:results:sfh (sin etiqueta propia)',
      texto: [
        'La IMF φ(m) dice cuántas estrellas nacen de cada masa. K_CC es el número de estrellas de 8 a 40 M☉, las que explotan como CC, por cada M☉ formada.',
        () => `Con Kroupa, K_CC = ${f2(1e2 * T.sfh.imf.Kroupa.K_CC_8_40, 2)} × 10⁻² M☉⁻¹, y con Salpeter ${f2(1e2 * T.sfh.imf.Salpeter.K_CC_8_40, 2)} × 10⁻². Las de 3 a 8 M☉, las progenitoras posibles de las Ia, son ${f2(1e2 * T.sfh.imf.Kroupa.N_3_8, 2)} × 10⁻² por M☉ con Kroupa.`,
        'La IMF y la SFH van emparejadas: una SFH medida con una IMF se convierte a otra con un factor fijo (Salpeter a Kroupa, × ' + f2(T.sfh.imf.psi_kroupa_sobre_salpeter, 3) + ').',
      ],
      fuente: 'Tesis: cap. 5, sec:results:sfh. ajuste.json (imf).',
    },
    {
      id: 'sfh', titulo: 'Historia de formación estelar', ingles: 'cosmic star-formation history',
      ecuacion: String.raw`\psi_\mathrm{MF17}(z) \,=\, 0.01\, \frac{(1+z)^{2.6}}{1+\left[(1+z)/3.2\right]^{6.2}}\; M_\odot\,\mathrm{yr}^{-1}\,\mathrm{Mpc}^{-3}`,
      etiqueta: 'eq:results:sfh:mf17 (y eq:methods:rates:md14 para MD14)',
      texto: [
        'ψ(z) es la masa en estrellas que forma el universo por año y por Mpc³. Sube desde hoy hasta un máximo cerca de z ≈ 2 y cae a z más alto.',
        'Las CC siguen a ψ del momento, porque sus progenitoras viven menos de ~40 Myr: r_CC = K_CC ψ. Si una parte de las CC queda oculta por polvo, lo medido es K_CC ψ (1 − f_oculta).',
        () => `En la tesis, con MF17 y Kroupa, lo medido sobre lo predicho en las CC de SUDARE es ${T.sfh.cc.MF17_Kroupa.cociente.map(x => f2(x)).join(' y ')}, y con la fracción de ocultas ${T.sfh.cc.MF17_Kroupa_ocultas.cociente.map(x => f2(x)).join(' y ')}.`,
      ],
      fuente: 'Tesis: cap. 5, sec:results:sfh y sec:methods:rates.',
    },
    {
      id: 'dtd', titulo: 'Distribución de retardos (DTD)', ingles: 'delay-time distribution',
      ecuacion: String.raw`r_\text{Ia}(t) = K_\text{Ia} \int_{\tau_i}^{\min(t,\tau_x)} f_\text{Ia}(\tau)\, \mathrm{SFR}(t-\tau)\, \mathrm{d}\tau`,
      etiqueta: 'eq:intro:rate_Ia',
      texto: [
        'Una Ia explota un retardo τ después de que se formó su estrella. f(τ) dice cómo se reparten esos retardos. La tasa a un tiempo t es la suma de los goteos de todas las generaciones anteriores.',
        'Con una ley de potencias f ∝ τ^β desde 40 Myr, K se resuelve analítico para cada β: K̂ = Σ r m / σ² / Σ m² / σ², y el χ² dice qué tan bien pasa el modelo.',
        () => `Con las cuatro tasas de SUDARE, β no queda acotado (β libre ${N['sfh.paso2.beta_libre']}). Con toda la literatura (${N['sfh.paso3.todas+nuestras.MF17.n']} tasas, MF17): β = ${N['sfh.paso3.todas+nuestras.MF17.beta']} +${N['sfh.paso3.todas+nuestras.MF17.beta_mas']} −${N['sfh.paso3.todas+nuestras.MF17.beta_menos']} y N/M★ = ${N['sfh.paso3.todas+nuestras.MF17.N_M']} × 10⁻³ M☉⁻¹.`,
        'La SFH elegida mueve N/M★ y casi no mueve β. Entre los modelos de Greggio, los de doble degenerada ancha quedan desfavorecidos.',
      ],
      fuente: 'Tesis: cap. 1, sec:intro:rates; cap. 5, sec:results:sfh. ajuste.json y numeros_tasas_final.json.',
    },
  ]);
  window.CuadernoFuenteTesis = fuenteTesis;
})();
