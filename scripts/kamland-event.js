(() => {
  const figure = document.querySelector('[data-kamland-event]');
  const canvas = figure?.querySelector('canvas');
  const ctx = canvas?.getContext('2d');
  if (!ctx) return;

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const wideLayout = matchMedia('(min-width: 992px)');
  const pause = figure.querySelector('button');
  const projection = window.kamlandProjection;
  const { centerX, centerY, radiusX, radiusY } = projection;
  const outline = new Path2D();
  outline.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
  const segments = new Path2D(projection.segments);

  const { hits: records, chargeMaxPE, credit } = window.kamlandEventModel;
  // Select the prompt pulse and its visible tail without remapping any hit times.
  const timeStartNs = 30;
  const timeEndNs = 90;
  const timeSpanNs = timeEndNs - timeStartNs;
  const timeBinCount = 90;
  const timeBinWidthNs = timeSpanNs / timeBinCount;
  const chargeBinCount = 100;
  const revealMs = 9500;
  const fadeMs = 500;
  const loopMs = revealMs + fadeMs;
  const lightUpNs = 5;

  // Use one timing palette for the PMTs and the arrival-time histogram.
  const palette = [
    [0, [240, 92, 75]],
    [34, [236, 142, 68]],
    [38, [224, 194, 91]],
    [45, [187, 211, 108]],
    [58, [117, 204, 122]],
    [80, [89, 197, 153]],
    [105, [87, 185, 190]],
    [133, [104, 159, 225]],
    [200, [133, 145, 235]],
  ];

  function timingColor(timeNs) {
    const upper = palette.findIndex(([time]) => time >= timeNs);
    if (upper <= 0) return `rgb(${palette[upper === 0 ? 0 : palette.length - 1][1].join(',')})`;
    const [from, start] = palette[upper - 1];
    const [to, end] = palette[upper];
    const t = (timeNs - from) / (to - from);
    return `rgb(${start.map((value, i) => Math.round(value + (end[i] - value) * t)).join(',')})`;
  }

  if (credit) {
    document.querySelector('[data-event-provenance]').textContent = credit;
    canvas.setAttribute('aria-label', 'KamLAND PMT projection and measured histograms of integrated charge per hit PMT in photoelectrons and PMT arrival times from 30 to 90 nanoseconds in 90 equal-width bins.');
  }

  const validHits = records.filter(({ x, y, timeNs, chargePE }) => (
    Number.isFinite(x) && Number.isFinite(y) && ctx.isPointInPath(outline, x, y) &&
    Number.isFinite(timeNs) && timeNs >= timeStartNs && timeNs <= timeEndNs &&
    Number.isFinite(chargePE) && chargePE >= 0
  ));
  const chargeRangePE = Math.ceil(validHits.reduce((max, hit) => Math.max(max, hit.chargePE), chargeMaxPE));
  const hits = validHits.map(hit => ({
    ...hit,
    timeBin: Math.min(timeBinCount - 1, Math.floor((hit.timeNs - timeStartNs) / timeBinWidthNs)),
    chargeBin: Math.min(chargeBinCount - 1, Math.floor(hit.chargePE / chargeRangePE * chargeBinCount)),
    color: timingColor(hit.timeNs),
  })).sort((a, b) => a.timeNs - b.timeNs);
  const binColors = Array.from({ length: timeBinCount }, (_, i) => timingColor(timeStartNs + (i + 0.5) * timeBinWidthNs));
  const chargeBins = new Uint32Array(chargeBinCount);
  const timeBins = new Uint32Array(timeBinCount);
  for (const hit of hits) {
    chargeBins[hit.chargeBin]++;
    timeBins[hit.timeBin]++;
  }
  const maxCharge = Math.max(1, ...chargeBins);
  const maxTime = Math.max(1, ...timeBins);

  let width = 0;
  let height = 0;
  let projectionScale = 1;

  function resize() {
    const newWidth = canvas.clientWidth;
    if (newWidth === 0 || width === newWidth) return;
    width = newWidth;
    projectionScale = (width - 4) / (2 * radiusX);
    height = Math.ceil(2 * radiusY * projectionScale) + 132;
    const density = Math.min(devicePixelRatio || 1, 2);
    canvas.style.height = `${height}px`;
    canvas.width = Math.round(width * density);
    canvas.height = Math.round(height * density);
    ctx.setTransform(density, 0, 0, density, 0, 0);
  }

  function drawHistogram(bins, max, label, top, opacity, useTimingColors) {
    const left = wideLayout.matches ? width * 0.16 : 4;
    const plotWidth = width - left - 4;
    const binPixels = plotWidth / bins.length;
    const gap = Math.min(1, binPixels * 0.22);
    const baseline = top + 40;
    const barHeight = 23;
    ctx.fillStyle = '#9fbdd4';
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText(label, left, top + 11);
    ctx.fillStyle = 'rgba(137, 180, 212, .24)';
    ctx.fillRect(left, baseline, plotWidth, 1);

    ctx.globalAlpha = opacity * (useTimingColors ? 0.88 : 0.65);
    for (let i = 0; i < bins.length; i++) {
      const h = bins[i] / max * barHeight;
      if (h <= 0) continue;
      ctx.fillStyle = useTimingColors ? binColors[i] : '#c5e6f5';
      ctx.fillRect(left + i * binPixels, baseline - h, binPixels - gap, h);
    }
    ctx.globalAlpha = 1;
  }

  function draw(timeNs, opacity) {
    if (width < 8) return;
    ctx.clearRect(0, 0, width, height);
    chargeBins.fill(0);
    timeBins.fill(0);

    ctx.save();
    ctx.translate(2, 2 + (radiusY - centerY) * projectionScale);
    ctx.scale(projectionScale, projectionScale);
    ctx.clip(outline);
    ctx.strokeStyle = 'rgba(157, 190, 216, .32)';
    ctx.lineWidth = 0.8 / projectionScale;
    ctx.stroke(segments);
    ctx.lineWidth = 1.7 / projectionScale;
    ctx.stroke(outline);

    for (const hit of hits) {
      if (hit.timeNs > timeNs) break;
      const gain = Math.min(1, (timeNs - hit.timeNs) / lightUpNs);
      const brightness = 0.18 + 0.82 * gain * gain * (3 - 2 * gain);
      chargeBins[hit.chargeBin]++;
      timeBins[hit.timeBin]++;
      ctx.fillStyle = hit.color;
      ctx.globalAlpha = 0.12 * opacity * brightness;
      ctx.beginPath();
      ctx.arc(hit.x, hit.y, 7.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.96 * opacity * brightness;
      ctx.beginPath();
      ctx.arc(hit.x, hit.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    const top = Math.ceil(2 * radiusY * projectionScale) + 17;
    drawHistogram(chargeBins, maxCharge, 'Charge', top, opacity, false);
    drawHistogram(timeBins, maxTime, 'Hit time', top + 49, opacity, true);
  }

  let elapsed = 0;
  let previous;
  let frameId = 0;
  let paused = false;
  let onScreen = true;

  function paint() {
    if (motion.matches) {
      draw(timeEndNs + lightUpNs, 1);
      return;
    }
    const phase = elapsed % loopMs;
    const time = timeStartNs + timeSpanNs * Math.min(1, phase / revealMs);
    const fade = Math.max(0, (phase - revealMs) / fadeMs);
    draw(time, 1 - fade * fade * (3 - 2 * fade));
  }

  function tick(now) {
    if (previous !== undefined) elapsed += now - previous;
    previous = now;
    paint();
    frameId = requestAnimationFrame(tick);
  }

  function syncPlayback() {
    cancelAnimationFrame(frameId);
    previous = undefined;
    pause.hidden = motion.matches;
    pause.textContent = paused ? 'Resume' : 'Pause';
    pause.setAttribute('aria-label', paused ? 'Resume KamLAND animation' : 'Pause KamLAND animation');
    paint();
    if (!paused && !motion.matches && !document.hidden && onScreen) {
      frameId = requestAnimationFrame(tick);
    }
  }

  pause.addEventListener('click', () => {
    paused = !paused;
    syncPlayback();
  });
  motion.addEventListener('change', syncPlayback);
  document.addEventListener('visibilitychange', syncPlayback);
  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    syncPlayback();
  }).observe(figure);
  new ResizeObserver(() => {
    resize();
    paint();
  }).observe(figure);
  resize();
  syncPlayback();
})();
