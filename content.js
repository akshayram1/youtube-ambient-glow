(() => {
  'use strict';
  const defaults = { enabled: true, intensity: 55, blur: 90, saturation: 140, speed: 12, smoothing: 65 };
  let settings = { ...defaults }, video = null, layer = null, ctx = null, canvas = null;
  let callback = null, callbackType = '', last = -Infinity, blocked = false, colors = [];
  const W = 64, H = 36;
  const zones = [];
  for (let i = 0; i < 6; i++) {
    zones.push({ x: Math.floor(i * W / 6), y: 0, w: 10, h: 7, px: 14 + i * 14.4, py: 12 });
    zones.push({ x: Math.floor(i * W / 6), y: H - 7, w: 10, h: 7, px: 14 + i * 14.4, py: 88 });
  }
  for (let i = 0; i < 4; i++) {
    zones.push({ x: 0, y: i * 9, w: 9, h: 9, px: 12, py: 20 + i * 20 });
    zones.push({ x: W - 9, y: i * 9, w: 9, h: 9, px: 88, py: 20 + i * 20 });
  }
  function cancel() {
    if (callback !== null) {
      if (callbackType === 'video') video?.cancelVideoFrameCallback(callback);
      else cancelAnimationFrame(callback);
    }
    callback = null;
  }
  function remove() {
    cancel(); layer?.remove(); layer = null; ctx = null; canvas = null;
    document.documentElement.classList.remove('yag-active');
    blocked = false; colors = [];
  }
  function allowed() {
    return settings.enabled && location.pathname === '/watch' && !document.fullscreenElement && !document.hidden && video?.isConnected;
  }
  function makeLayer() {
    if (layer) return;
    layer = document.createElement('div'); layer.id = 'yag-layer'; layer.setAttribute('aria-hidden', 'true');
    for (const zone of zones) {
      const blob = document.createElement('div'); blob.className = 'yag-blob';
      blob.style.left = `${zone.px}%`; blob.style.top = `${zone.py}%`; layer.append(blob);
    }
    canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H; canvas.hidden = true;
    layer.append(canvas); ctx = canvas.getContext('2d', { willReadFrequently: true });
    document.body.prepend(layer); document.documentElement.classList.add('yag-active');
    applyStyle();
  }
  function applyStyle() {
    if (!layer) return;
    layer.style.filter = `blur(${settings.blur}px) saturate(${settings.saturation / 100})`;
    layer.style.opacity = String(settings.intensity / 100);
  }
  function sample(now, force = false) {
    if (!allowed() || !video || video.readyState < 2 || !video.videoWidth) return;
    if (!force && now - last < 1000 / settings.speed) return;
    last = now; makeLayer();
    try {
      ctx.drawImage(video, 0, 0, W, H);
      if (blocked) return;
      const pixels = ctx.getImageData(0, 0, W, H).data;
      const mix = colors.length ? Math.max(.08, 1 - settings.smoothing / 100) : 1;
      zones.forEach((zone, index) => {
        const sums = [0, 0, 0]; let count = 0;
        for (let y = zone.y; y < zone.y + zone.h; y++) {
          for (let x = zone.x; x < zone.x + zone.w; x++) {
            const p = (y * W + x) * 4;
            // Avoid letting thin black letterbox bars dominate the zone.
            if (pixels[p] + pixels[p + 1] + pixels[p + 2] < 24) continue;
            for (let c = 0; c < 3; c++) sums[c] += pixels[p + c];
            count++;
          }
        }
        const target = sums.map(v => count ? v / count : 0);
        colors[index] = target.map((v, c) => Math.round((colors[index]?.[c] ?? v) * (1 - mix) + v * mix));
        layer.children[index].style.backgroundColor = `rgb(${colors[index].join(',')})`;
      });
    } catch (error) {
      if (error.name === 'SecurityError') {
        // A tainted canvas can still be displayed; never bypass video protections.
        blocked = true; canvas.hidden = false;
        for (let i = 0; i < zones.length; i++) layer.children[i].hidden = true;
      }
    }
  }
  function schedule() {
    if (!allowed() || !video || video.paused || video.ended || callback !== null) return;
    const tick = now => { callback = null; sample(now); schedule(); };
    if (video.requestVideoFrameCallback) { callbackType = 'video'; callback = video.requestVideoFrameCallback(tick); }
    else { callbackType = 'animation'; callback = requestAnimationFrame(tick); }
  }
  function refreshFrame() { sample(performance.now(), true); schedule(); }
  function reconcile() {
    const candidate = document.querySelector('#movie_player video') || document.querySelector('video.html5-main-video');
    if (candidate !== video) {
      cancel();
      if (video) for (const event of ['play', 'pause', 'seeked', 'loadeddata', 'emptied']) video.removeEventListener(event, onVideo);
      remove(); video = candidate; colors = []; blocked = false; last = -Infinity;
      if (video) for (const event of ['play', 'pause', 'seeked', 'loadeddata', 'emptied']) video.addEventListener(event, onVideo);
    }
    if (!allowed()) { remove(); return; }
    refreshFrame();
  }
  function onVideo(event) {
    if (event.type === 'emptied') { remove(); colors = []; blocked = false; last = -Infinity; }
    if (video?.paused) cancel();
    refreshFrame();
  }
  function normalize(values) {
    settings = { ...defaults, ...values };
    for (const [key, min, max] of [['intensity', 0, 100], ['blur', 20, 160], ['saturation', 50, 250], ['speed', 5, 30], ['smoothing', 0, 95]]) {
      const value = Number(settings[key]);
      settings[key] = Math.max(min, Math.min(max, Number.isFinite(value) ? value : defaults[key]));
    }
    settings.enabled = settings.enabled !== false;
  }
  chrome.storage.local.get(defaults, values => { normalize(values); reconcile(); });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    const next = { ...settings }; for (const key of Object.keys(defaults)) if (changes[key]) next[key] = changes[key].newValue ?? defaults[key];
    normalize(next); applyStyle(); reconcile();
  });
  document.addEventListener('yt-navigate-finish', reconcile);
  document.addEventListener('visibilitychange', reconcile);
  document.addEventListener('fullscreenchange', reconcile);
  // YouTube replaces its player during SPA navigation. Check only the element identity.
  setInterval(() => { if (!video?.isConnected || (location.pathname !== '/watch' && layer)) reconcile(); }, 1000);
})();
