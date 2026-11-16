(() => {
  // Fixed acquisition and display scales shared by the model and renderer.
  const timeWindowNs = 200;
  const chargeMaxPE = 6;

  // A measured event can be supplied before loading this script:
  // window.kamlandPromptEvent = { hits: [{ x, y, timeNs, chargePE }], credit }.
  // Supply one record per hit PMT, with coordinates in kamlandProjection's
  // image space, times relative to a common origin, and calibrated charge in p.e.
  // The older charge field is also accepted for input already calibrated in p.e.
  const measured = window.kamlandPromptEvent;

  function seededRandom(seed) {
    let state = seed;
    return () => {
      state = (Math.imul(1664525, state) + 1013904223) >>> 0;
      return (state + 0.5) / 4294967296;
    };
  }

  function exponential(random, mean) {
    return -mean * Math.log1p(-random());
  }

  function sampleTime(random) {
    // Convolve a 2.2 ns rise with a fast exponential and a weaker slow component.
    // Parameters are illustrative and are not fitted to the historical event.
    let time;
    do {
      const decayNs = random() < 0.17 ? 35 : 13;
      time = 32 + exponential(random, 2.2) + exponential(random, decayNs);
    } while (time >= timeWindowNs);
    return time;
  }

  function sampleCharge(random) {
    // Zero-truncated Poisson for fired PMTs, mean occupancy 0.32.
    const occupancy = 0.32;
    const threshold = Math.exp(-occupancy);
    let photoelectrons;
    do {
      let product = random();
      photoelectrons = 0;
      while (product > threshold) {
        product *= random();
        photoelectrons++;
      }
    } while (photoelectrons === 0);

    // Gamma single-photoelectron response (mean 1 p.e., relative width ~32%).
    // Adding independent responses is equivalent to a sum of 10 exponentials
    // per photoelectron, so the integrated spectrum is continuous and positive.
    let charge = 0;
    for (let i = 0; i < 10 * photoelectrons; i++) charge += exponential(random, 0.1);
    return charge;
  }

  function fitHistoricalPosition(x, y) {
    const { centerX, centerY, radiusX, radiusY } = window.kamlandProjection;
    const dx = x - centerX;
    const dy = y - centerY;
    const radius = Math.hypot(dx / radiusX, dy / radiusY);
    // Softly compress only the outer fringe of the digitized image to the
    // exact ellipse. The interior and angular ordering are unchanged.
    const shoulder = 0.97;
    if (radius <= shoulder) return { x, y };
    const fitted = shoulder + (0.996 - shoulder) * -Math.expm1(-(radius - shoulder) / (0.996 - shoulder));
    return { x: centerX + dx * fitted / radius, y: centerY + dy * fitted / radius };
  }

  function illustrativeHits(markers) {
    const timingRandom = seededRandom(21851);
    const orderingRandom = seededRandom(94187);
    const chargeRandom = seededRandom(60211);
    const times = markers.map(() => sampleTime(timingRandom)).sort((a, b) => a - b);
    // The archived marker colors give a coarse indication of arrival order.
    // Preserve that order while shuffling within each color group. The groups
    // never determine the pulse shape or create independently timed bursts.
    return markers.map(([x, y, group]) => ({
      ...fitHistoricalPosition(x, y),
      group,
      order: orderingRandom(),
      chargePE: sampleCharge(chargeRandom),
    })).sort((a, b) => a.group - b.group || a.order - b.order)
      .map(({ x, y, chargePE }, i) => ({ x, y, timeNs: times[i], chargePE }));
  }

  window.kamlandEventModel = {
    timeWindowNs,
    chargeMaxPE,
    hits: measured?.hits.map(hit => ({ ...hit, chargePE: hit.chargePE ?? hit.charge }))
      ?? illustrativeHits(window.kamlandPromptMarkers),
    credit: measured?.credit,
  };
})();
