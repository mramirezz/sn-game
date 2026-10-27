// Gráficos mínimos en canvas: ejes, líneas, barras, puntos y bandas.
const Plot = (() => {
  const COL = { texto: '#e8ecf8', tenue: '#9aa6c8', eje: '#2c3866' };

  // Ajusta el canvas a su tamaño en pantalla y a la densidad de píxeles.
  function preparar(canvas) {
    const dpr = window.devicePixelRatio || 1, r = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, r.width, r.height);
    ctx.w = r.width; ctx.h = r.height;
    return ctx;
  }

  function marcas(a, b, n = 5) {
    const paso0 = (b - a) / n, mag = 10 ** Math.floor(Math.log10(paso0));
    const paso = [1, 2, 5, 10].map(k => k * mag).find(p => p >= paso0);
    const out = [];
    for (let v = Math.ceil(a / paso) * paso; v <= b + paso * 1e-9; v += paso) out.push(+v.toPrecision(10));
    return out;
  }

  const fmt = v => Math.abs(v) >= 1e4 || (Math.abs(v) < 1e-2 && v !== 0) ? v.toExponential(0) : String(+v.toPrecision(4));

  function ejes(ctx, { x0, x1, y0, y1, xlabel = '', ylabel = '', margen = { i: 52, d: 12, s: 12, a: 38 }, invertirY = false, sinY = false, xticks = null }) {
    const { i, d, s, a } = margen, W = ctx.w - i - d, H = ctx.h - s - a;
    const px = x => i + (x - x0) / (x1 - x0) * W;
    const py = invertirY ? y => s + (y - y0) / (y1 - y0) * H : y => s + H - (y - y0) / (y1 - y0) * H;
    ctx.strokeStyle = COL.eje; ctx.lineWidth = 1;
    ctx.strokeRect(i, s, W, H);
    ctx.fillStyle = COL.tenue; ctx.font = '11px system-ui';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (const [v, t] of xticks || marcas(x0, x1).map(v => [v, fmt(v)])) { ctx.fillText(t, px(v), s + H + 4); } // xticks: [[x, texto]] para categorías
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    if (!sinY) for (const v of marcas(Math.min(y0, y1), Math.max(y0, y1), 4)) { ctx.fillText(fmt(v), i - 5, py(v)); }
    ctx.fillStyle = COL.texto; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(xlabel, i + W / 2, ctx.h - 2);
    ctx.save(); ctx.translate(12, s + H / 2); ctx.rotate(-Math.PI / 2); ctx.textBaseline = 'middle'; ctx.fillText(ylabel, 0, 0); ctx.restore();
    return { px, py, x0, x1, y0, y1, caja: { i, s, W, H } };
  }

  function recortar(ctx, T, dibujo) {
    ctx.save(); ctx.beginPath(); ctx.rect(T.caja.i, T.caja.s, T.caja.W, T.caja.H); ctx.clip(); dibujo(); ctx.restore();
  }

  function linea(ctx, T, xs, ys, color, ancho = 2, guiones = []) {
    recortar(ctx, T, () => {
      ctx.strokeStyle = color; ctx.lineWidth = ancho; ctx.setLineDash(guiones); ctx.beginPath();
      let dentro = false;
      xs.forEach((x, k) => {
        const y = ys[k];
        if (!Number.isFinite(y)) { dentro = false; return; }
        if (dentro) ctx.lineTo(T.px(x), T.py(y)); else { ctx.moveTo(T.px(x), T.py(y)); dentro = true; }
      });
      ctx.stroke(); ctx.setLineDash([]);
    });
  }

  function barras(ctx, T, bordes, valores, color) {
    recortar(ctx, T, () => {
      ctx.fillStyle = color;
      valores.forEach((v, k) => {
        const xa = T.px(bordes[k]), xb = T.px(bordes[k + 1]), y = T.py(v), y0 = T.py(Math.max(T.y0, 0));
        ctx.fillRect(xa + 1, Math.min(y, y0), Math.max(1, xb - xa - 2), Math.abs(y0 - y));
      });
    });
  }

  function puntos(ctx, T, xs, ys, color, r = 3) {
    recortar(ctx, T, () => {
      ctx.fillStyle = color;
      xs.forEach((x, k) => { ctx.beginPath(); ctx.arc(T.px(x), T.py(ys[k]), r, 0, 2 * Math.PI); ctx.fill(); });
    });
  }

  function hline(ctx, T, y, color, etiqueta = '') {
    recortar(ctx, T, () => {
      ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(T.caja.i, T.py(y)); ctx.lineTo(T.caja.i + T.caja.W, T.py(y)); ctx.stroke(); ctx.setLineDash([]);
      if (etiqueta) { ctx.fillStyle = color; ctx.font = '11px system-ui'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText(etiqueta, T.caja.i + 6, T.py(y) - 2); }
    });
  }

  function vline(ctx, T, x, color, etiqueta = '') {
    recortar(ctx, T, () => {
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(T.px(x), T.caja.s); ctx.lineTo(T.px(x), T.caja.s + T.caja.H); ctx.stroke();
      if (etiqueta) { ctx.fillStyle = color; ctx.font = '11px system-ui'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(etiqueta, T.px(x) + 4, T.caja.s + 4); }
    });
  }

  // Banda vertical sombreada entre x0 y x1.
  function banda(ctx, T, xa, xb, color) {
    recortar(ctx, T, () => { ctx.fillStyle = color; ctx.fillRect(T.px(xa), T.caja.s, T.px(xb) - T.px(xa), T.caja.H); });
  }

  return { preparar, ejes, linea, barras, puntos, hline, vline, banda, COL };
})();
