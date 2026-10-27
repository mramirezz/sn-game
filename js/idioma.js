// Idioma del juego, español o inglés: se elige en la pantalla de inicio y queda guardado. Cambiarlo recarga la página,
// porque los textos se arman al cargar. Lg('texto', 'text') devuelve el del idioma elegido.
const IDIOMA = (() => {
  const h = location.hash.slice(1); if (h === 'es' || h === 'en') return h; // un enlace con #en o #es manda
  try { const g = localStorage.getItem('juego-tasas-idioma'); if (g === 'es' || g === 'en') return g; } catch (e) { /* nada */ }
  return /^es\b/i.test(navigator.language || 'es') ? 'es' : 'en';
})();
const Lg = (es, en) => (IDIOMA === 'en' ? en : es);
// los nombres de las fuentes del sistemático vienen en castellano en data/tesis.js (los escribe el script de la tesis)
const FUENTES_EN = {
  1: 'PSN weight (SUDARE I 0 and 1, later seasons 0.19 and 0.68)',
  3: 'CT subtype mix (from the sims -> from SUDARE I, and ±50 %)',
  4: 'CT host dust (ours with E(B-V) × 0.5 and × 1.5)',
  5: 'LF (IIn LOSS -> Nyholm, Ia, II, IIb and Ibc ±0.2 mag)',
  7: 'detection cut (n_det >= 4 -> 3 and 5)',
  8: 'z of the SNe without a host: model bias ± its error, and II and Ibc without bias',
  9: 'host photometric z: sigma × 0.5 and × 1.5, and catastrophic outliers',
  10: 'AGN cleaning (R2 with e_SN -> the previous rule, and e_SN ± its error)',
  11: 'catalogue z (fitted z -> central value, without the catalogue photo-z)',
  12: 'SUDARE I conventions: classes merged, their prior and their half-normal 0.1, 0.2 and 0.3 (information)',
  13: 'multi-season rule (k = 1 with false candidates, without the rule)',
  14: 'team z flagged ignored > 1 (removed)',
  '2a': 'class prior (pre-registered sensitivities of P1(z) and P0(z))',
  '2a_info': 'prior: global P1 (0.595, biased to low z) and balanced (information)',
  '2b': 'classifier (the other two systems, information)',
  '2c': 'typing (confusion matrix of the ZTF validation, and the SUDARE I leakage to IIn as an upper bound)',
  '2d': 'noise of the ZTF matrix (bootstrap of the 567 validation SNe, 68 %)',
  '2c_sudare': 'typing, SUDARE I recipe (10/25/40 %, information)',
  '6a': 'efficiency cut (m50 -> m50 + 0.3 and + 0.5)',
  '6b': 'm50 of the later seasons (R6 ±0.38 mag)',
  '6c': 'area of the later seasons (measured footprints -> R5 1.15 deg^2)',
  zv: 'A binned by the true z (no forward modelling, information)',
};
document.documentElement.lang = IDIOMA;
// el html fijo lleva su inglés en data-en (texto), data-en-aria (aria-label) y data-en-title (title)
if (IDIOMA === 'en') {
  for (const el of document.querySelectorAll('[data-en]')) el.innerHTML = el.dataset.en;
  for (const el of document.querySelectorAll('[data-en-aria]')) el.setAttribute('aria-label', el.dataset.enAria);
  for (const el of document.querySelectorAll('[data-en-title]')) el.title = el.dataset.enTitle;
}
for (const b of document.querySelectorAll('[data-idioma]')) {
  b.classList.toggle('activo', b.dataset.idioma === IDIOMA);
  b.addEventListener('click', () => {
    if (b.dataset.idioma === IDIOMA) return;
    try { localStorage.setItem('juego-tasas-idioma', b.dataset.idioma); } catch (e) { /* sin almacenamiento: vale para esta visita */ }
    location.hash = b.dataset.idioma; location.reload(); // el #, para que valga aunque no haya almacenamiento
  });
}
