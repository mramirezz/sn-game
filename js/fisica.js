// Física del juego: cosmología plana (H0 70, Om 0.3), curva de Ia de juego, ventana visible e intervalos de Gehrels.
// Sin DOM: corre en el navegador (global Fisica) y en node (pruebas).
const Fisica = (() => {
  const C_KMS = 299792.458, H0 = 70, OM = 0.3, OL = 0.7;
  const DH = C_KMS / H0; // distancia de Hubble, Mpc

  const E = z => Math.sqrt(OM * (1 + z) ** 3 + OL);

  // Simpson con n pasos (par)
  function simpson(f, a, b, n = 200) {
    if (b <= a) return 0;
    const h = (b - a) / n;
    let s = f(a) + f(b);
    for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
    return s * h / 3;
  }

  const dc = z => DH * simpson(x => 1 / E(x), 0, z);
  const dl = z => (1 + z) * dc(z);
  const mu = z => 5 * Math.log10(dl(z)) + 25;
  const dVdz = z => DH * dc(z) ** 2 / E(z); // Mpc^3 sr^-1 por unidad de z
  // Comóvil plano: V = Omega Dc^3 / 3, exacto y más barato que integrar dVdz
  const volumen = (z1, z2, omegaSr) => omegaSr * (dc(z2) ** 3 - dc(z1) ** 3) / 3;
  const deg2ASr = deg2 => deg2 * (Math.PI / 180) ** 2;

  // Curva de Ia del universo de juego, magnitud absoluta contra días en reposo desde la explosión.
  function curvaIa(tRest, Mpeak) {
    if (tRest <= 0) return Infinity;
    if (tRest < 18) return Mpeak - 5 * Math.log10(tRest / 18); // flujo ∝ t² en la subida
    const d = tRest - 18;
    if (d <= 15) return Mpeak + 0.8 * (d / 15) ** 2;
    if (d <= 40) return Mpeak + 0.8 + 0.048 * (d - 15);
    return Mpeak + 2.0 + 0.03 * (d - 40);
  }

  // Sin K-corrección en la fase 1 (universo de juego).
  const magObs = (tObs, z, Mpeak) => curvaIa(tObs / (1 + z), Mpeak) + mu(z);

  // Raíz de f creciente o decreciente en [a, b] por bisección.
  function biseccion(f, a, b, n = 60) {
    const fa = f(a);
    for (let i = 0; i < n; i++) {
      const m = (a + b) / 2;
      if ((f(m) > 0) === (fa > 0)) a = m; else b = m;
    }
    return (a + b) / 2;
  }

  // Días del observador desde la explosión en que la SN está sobre el límite, o null.
  // Vale para cualquier curva unimodal con pico en tPico (las plantillas de la fase 2 también).
  function ventanaVisible(z, Mpeak, mlim, curva = curvaIa, tPico = 18, tMax = 1000) {
    const m0 = mlim - mu(z);
    const f = t => curva(t, Mpeak) - m0;
    if (f(tPico) >= 0) return null;
    const s1 = biseccion(f, 1e-6, tPico);
    const s2 = f(tMax) < 0 ? tMax : biseccion(f, tPico, tMax);
    return [s1 * (1 + z), s2 * (1 + z)];
  }

  // Gehrels (1986), ec. 9 y 14 con S = 1; n = 0 de su tabla.
  function gehrels(n) {
    if (n <= 0) return { lo: 0, hi: 1.841 };
    return {
      lo: n * (1 - 1 / (9 * n) - 1 / (3 * Math.sqrt(n))) ** 3,
      hi: n + Math.sqrt(n + 0.75) + 1,
    };
  }

  return { E, dc, dl, mu, dVdz, volumen, deg2ASr, curvaIa, magObs, ventanaVisible, gehrels, simpson };
})();

if (typeof module !== 'undefined') module.exports = Fisica;
