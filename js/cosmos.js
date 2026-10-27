// La fábrica cósmica (cap. 6): historia de formación estelar ψ(z), IMF, K_CC, la DTD de las Ia y la convolución.
// Sin DOM: corre en el navegador (global Cosmos) y en node (pruebas). Cosmología del juego: plana, H0 70, Ωm 0.3.
const Cosmos = (() => {
  const OM = 0.3, OL = 0.7, HUBBLE_GYR = 977.792 / 70; // 1/H0 en Gyr
  const TAU_MIN = 0.04; // Gyr: las Ia empiezan a explotar 40 Myr después de formarse las estrellas

  // SFH en M☉ yr⁻¹ Mpc⁻³. MD14 es con IMF de Salpeter, MF17 con la de Kroupa.
  const psiMD14 = z => 0.015 * (1 + z) ** 2.7 / (1 + ((1 + z) / 2.9) ** 5.6);
  const psiMF17 = z => 0.01 * (1 + z) ** 2.6 / (1 + ((1 + z) / 3.2) ** 6.2);

  // IMF por unidad de masa, sin normalizar (la normalización se cancela en K).
  const IMF = {
    salpeter: m => m ** -2.35,
    kroupa: m => (m < 0.5 ? m ** -1.3 : 0.5 * m ** -2.3),
  };

  // Integral de f entre a y b, por Simpson en log(x): sirve para leyes de potencias que cubren décadas.
  function integralLog(f, a, b, n = 400) {
    const la = Math.log(a), lb = Math.log(b), h = (lb - la) / n;
    let s = 0;
    for (let i = 0; i <= n; i++) {
      const x = Math.exp(la + i * h), w = i === 0 || i === n ? 1 : i % 2 ? 4 : 2;
      s += w * f(x) * x;
    }
    return s * h / 3;
  }

  // Número de CC por masa formada: las de 8 a 40 M☉ entre toda la masa de 0.1 a 100 M☉.
  const kcc = (imf, mMin = 8, mMax = 40) => integralLog(imf, mMin, mMax) / integralLog(m => m * imf(m), 0.1, 100);

  // Tiempo cósmico (Gyr) de un z y su inversa, en ΛCDM plano sin radiación.
  const k = Math.sqrt(OL / OM), a = 2 * HUBBLE_GYR / (3 * Math.sqrt(OL));
  const edad = z => a * Math.asinh(k * (1 + z) ** -1.5);
  const zDeEdad = t => (Math.sinh(t / a) / k) ** (-2 / 3) - 1;

  // DTD f(τ) ∝ τ^β desde 40 Myr, normalizada a 1 entre 40 Myr y la edad del universo (en Gyr⁻¹).
  function dtd(beta) {
    const t0 = edad(0), b1 = beta + 1;
    const norma = Math.abs(b1) < 1e-9 ? Math.log(t0 / TAU_MIN) : (t0 ** b1 - TAU_MIN ** b1) / b1;
    return tau => (tau < TAU_MIN ? 0 : tau ** beta / norma);
  }

  // Tasa de Ia (SNe yr⁻¹ Mpc⁻³): K por la convolución de la SFH con la DTD. K es el número de Ia por masa formada.
  function tasaIa(z, { psi, beta, K = 1, n = 400 }) {
    const t = edad(z), f = dtd(beta);
    if (t <= TAU_MIN) return 0;
    return K * integralLog(tau => psi(zDeEdad(t - tau)) * f(tau), TAU_MIN, t - 1e-6, n);
  }

  // Cuánto de la tasa de Ia a un z viene de estrellas más jóvenes que tauMax (Gyr).
  function fraccionJoven(z, { psi, beta }, tauMax) {
    const t = edad(z), f = dtd(beta), g = tau => psi(zDeEdad(t - tau)) * f(tau);
    return integralLog(g, TAU_MIN, Math.min(tauMax, t - 1e-6)) / integralLog(g, TAU_MIN, t - 1e-6);
  }

  // K analítico de mínimos cuadrados: K̂ = Σ r m / σ² / Σ m² / σ², y su χ². modelo(z) es la tasa con K = 1.
  function ajustarK(datos, modelo) {
    let sxy = 0, sxx = 0;
    const m = datos.map(d => modelo(d.z));
    datos.forEach((d, i) => { sxy += d.r * m[i] / d.s ** 2; sxx += m[i] ** 2 / d.s ** 2; });
    const K = sxy / sxx, sigmaK = 1 / Math.sqrt(sxx);
    const chi2 = datos.reduce((s, d, i) => s + ((d.r - K * m[i]) / d.s) ** 2, 0);
    return { K, sigmaK, chi2, modelo: m };
  }

  return { psiMD14, psiMF17, IMF, kcc, edad, zDeEdad, dtd, tasaIa, fraccionJoven, ajustarK, TAU_MIN };
})();

if (typeof module !== 'undefined') module.exports = Cosmos;
