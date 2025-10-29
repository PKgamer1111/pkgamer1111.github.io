// F1 Start Timer — Unplayable twist for GitHub Pages
// After the 5th light-strip turns on, endless red strips spawn to the right.

(function () {
  const container = document.querySelector('.f1-lights');
  const baseStrips = Array.from(container.querySelectorAll('.light-strip'));
  const timeEl = document.querySelector('.time');
  const bestEl = document.querySelector('.best span');

  let bestTime = Number(localStorage.getItem('best')) || Infinity;
  let started = false;
  let lightsOutTime = 0; // Never set in this twist — user can never play
  let raf = 0;
  let spawnInterval = 0;
  const STRIP_INTERVAL_MS = 1000; // same delay as initial red-on cadence

  // Create (or get) the growing bridge element that continues the back-board
  function ensureBridge() {
    let bridge = container.querySelector('.bridge-extra');
    if (!bridge) {
      bridge = document.createElement('div');
      bridge.className = 'bridge-extra';
      container.appendChild(bridge);
    }
    return bridge;
  }

  function formatTime(ms) {
    ms = Math.round(ms);
    let outputTime = ms / 1000;
    if (ms < 10000) outputTime = '0' + outputTime;
    outputTime = String(outputTime);
    while (outputTime.length < 6) outputTime += '0';
    return outputTime;
  }

  if (bestTime !== Infinity) bestEl.textContent = formatTime(bestTime);

  function createStrip(on) {
    const strip = document.createElement('div');
    strip.className = 'light-strip' + (on ? ' on' : '');
    for (let i = 0; i < 4; i++) {
      const l = document.createElement('div');
      l.className = 'light';
      strip.appendChild(l);
    }
    return strip;
  }

  function removeExtras() {
    container.querySelectorAll('.light-strip.extra').forEach(n => n.remove());
  }

  function beginSpawn() {
    // Measure current geometry to keep spacing consistent
    const containerRect = container.getBoundingClientRect();
    const rects = baseStrips.map(s => s.getBoundingClientRect());
    const stripWidth = rects[0].width;
    const gap = rects[1] ? (rects[1].left - rects[0].right) : 5;
    const lastRect = rects[rects.length - 1];
    let nextLeft = (lastRect.right - containerRect.left) + gap;

    // Prepare the bridge to start growing exactly at the back-board's right edge
    const bridge = ensureBridge();
    bridge.style.width = '0px';

    clearInterval(spawnInterval);
    spawnInterval = setInterval(() => {
      const extra = createStrip(true);
      extra.classList.add('extra');
      extra.style.left = `${nextLeft}px`;
      extra.style.width = `${stripWidth}px`;
      container.appendChild(extra);

      const r = extra.getBoundingClientRect();
      nextLeft += stripWidth + gap;

      // Grow the bridge in lockstep with new strips so it appears with them
      const currentWidth = parseFloat(bridge.style.width || '0');
      bridge.style.width = `${currentWidth + stripWidth + gap}px`;

      if (r.left > window.innerWidth) {
        clearInterval(spawnInterval);
      }
    }, STRIP_INTERVAL_MS);
  }

  function start() {
    // Reset state
    removeExtras();
    cancelAnimationFrame(raf);
    clearInterval(spawnInterval);
    lightsOutTime = 0; // sabotage: never set later

    for (const s of baseStrips) s.classList.remove('on');

    timeEl.textContent = '00.000';
    timeEl.classList.remove('anim');

    const lightsStart = performance.now();

    function frame(now) {
      const toLight = Math.floor((now - lightsStart) / STRIP_INTERVAL_MS) + 1; // 1 per second

      for (let i = 0; i < Math.min(toLight, baseStrips.length); i++) {
        baseStrips[i].classList.add('on');
      }

      if (toLight < 5) {
        raf = requestAnimationFrame(frame);
      } else {
        // After the 5th, do NOT proceed as normal: start spawning extras
        beginSpawn();
      }
    }

    raf = requestAnimationFrame(frame);
  }

  function end(timeStamp) {
    cancelAnimationFrame(raf);
    clearInterval(spawnInterval);

    // Since lightsOutTime never gets set, this is always a jump start
    timeEl.textContent = 'Jump start!';
    timeEl.classList.add('anim');
  }

  function tap(event) {
    const timeStamp = performance.now();

    if (
      !started &&
      event.target &&
      event.target.closest &&
      event.target.closest('a')
    ) return; // ignore link taps when idle

    event.preventDefault();

    if (started) {
      end(timeStamp);
      started = false;
    } else {
      start();
      started = true;
    }
  }

  // Input handlers
  addEventListener('touchstart', tap, { passive: false });
  addEventListener('mousedown', (e) => { if (e.button === 0) tap(e); }, { passive: false });
  addEventListener('keydown', (e) => { if (e.key === ' ') tap(e); }, { passive: false });
})();
