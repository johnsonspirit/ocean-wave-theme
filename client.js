window.__ModuleLoader__.load({
  id: '@johnsonspirit/ocean-wave-theme',
  factory(require) {
    'use strict';

    const BACKDROP_ATTR = 'data-ocean-backdrop';
    const STYLE_ID = 'ocean-waves-theme-style';

    const LIGHT_TOKENS = {
      '--dsw-alias-bg-base': 'rgba(233, 244, 250, 0.52)',
      '--dsw-alias-bg-layer-1': 'rgba(255, 255, 255, 0.66)',
      '--dsw-alias-bg-layer-2': 'rgba(255, 255, 255, 0.78)',
      '--dsw-alias-bg-overlay': 'rgba(255, 255, 255, 0.86)',
      '--dsw-specific-sidebar-fill': 'rgba(240, 249, 253, 0.55)',
    };
    const DARK_TOKENS = {
      '--dsw-alias-bg-base': 'rgba(7, 18, 30, 0.55)',
      '--dsw-alias-bg-layer-1': 'rgba(13, 24, 36, 0.72)',
      '--dsw-alias-bg-layer-2': 'rgba(17, 30, 44, 0.82)',
      '--dsw-alias-bg-overlay': 'rgba(13, 22, 33, 0.92)',
      '--dsw-specific-sidebar-fill': 'rgba(9, 20, 33, 0.58)',
    };

    function tokenOverrides() {
      const out = {};
      for (const name of Object.keys(LIGHT_TOKENS)) {
        out[name] = { light: LIGHT_TOKENS[name], dark: DARK_TOKENS[name] };
      }
      return out;
    }

    /* Wave bands, ordered far -> near. Fractions of viewport height/width. */
    const WAVES = [
      { base: 0.42, amps: [[0.020, 1.7, 0.55], [0.009, 3.1, 0.9]], freq: 1.15, speed: 0.16, light: ['#8ad7ec', '#5cb8dc'], dark: ['#123a58', '#0c2b44'], alpha: 0.75 },
      { base: 0.56, amps: [[0.026, 1.3, 0.8], [0.011, 2.6, 1.35]], freq: 1.55, speed: -0.22, light: ['#57b6dd', '#2e93c4'], dark: ['#0e4b6e', '#0a3550'], alpha: 0.85 },
      { base: 0.70, amps: [[0.034, 1.0, 1.1], [0.014, 2.2, 1.9]], freq: 2.0, speed: 0.3, light: ['#2e93c4', '#1a6b9c'], dark: ['#0b3c59', '#08283d'], alpha: 0.92 },
      { base: 0.84, amps: [[0.042, 0.8, 1.4], [0.018, 1.8, 2.4]], freq: 2.6, speed: -0.4, light: ['#1a6b9c', '#0d4a75'], dark: ['#082a40', '#051a2b'], alpha: 1.0 },
    ];

    const SPARKLES = 26;

    /* Whale: swims left -> right on a loop, rides the mid wave crest. */
    const WHALE_DURATION = 28; // seconds per crossing
    const WHALE_BUBBLES = 7;

    function sparkleSeed(i) {
      const a = Math.sin(i * 127.1 + 311.7) * 43758.5453;
      const b = Math.sin(i * 269.5 + 183.3) * 28073.1234;
      return { x: a - Math.floor(a), y: b - Math.floor(b), p: (i * 0.618) % 1 };
    }

    function crestY(wave, xUnit, t, h) {
      let y = wave.base * h;
      for (const [amp, k, phase] of wave.amps) {
        y += Math.sin(xUnit * wave.freq * k * Math.PI * 2 + t * wave.speed * k + phase) * amp * h;
      }
      return y;
    }

    function paintWaveBand(ctx2d, w, h, t, dark, i) {
      const wave = WAVES[i];
      const step = Math.max(4, w / 220);
      const colors = dark ? wave.dark : wave.light;
      ctx2d.beginPath();
      ctx2d.moveTo(-2, h + 2);
      for (let x = -2; x <= w + 2; x += step) {
        ctx2d.lineTo(x, crestY(wave, x / w, t, h));
      }
      ctx2d.lineTo(w + 2, h + 2);
      ctx2d.closePath();
      const fill = ctx2d.createLinearGradient(0, h * (wave.base - 0.06), 0, h);
      fill.addColorStop(0, colors[0]);
      fill.addColorStop(1, colors[1]);
      ctx2d.globalAlpha = wave.alpha;
      ctx2d.fillStyle = fill;
      ctx2d.fill();

      /* Foam crest */
      ctx2d.beginPath();
      for (let x = -2; x <= w + 2; x += step) {
        const y = crestY(wave, x / w, t, h);
        if (x === -2) ctx2d.moveTo(x, y); else ctx2d.lineTo(x, y);
      }
      ctx2d.globalAlpha = (dark ? 0.25 : 0.5) * wave.alpha;
      ctx2d.strokeStyle = dark ? '#9fc4d8' : '#ffffff';
      ctx2d.lineWidth = Math.max(1.2, h * 0.0035);
      ctx2d.stroke();
      ctx2d.globalAlpha = 1;
    }

    function whaleState(w, h, t) {
      const s = Math.max(34, Math.min(110, Math.min(w, h) * 0.095));
      const margin = s * 2.6;
      const p = (((t / WHALE_DURATION) % 1) + 1) % 1;
      const x = -margin + p * (w + margin * 2);
      const xUnit = Math.min(1, Math.max(0, x / w));
      /* Ride just under the second (mid-far) wave crest so front waves overlap the body. */
      const crest = crestY(WAVES[1], xUnit, t, h);
      const eps = 4 / Math.max(1, w);
      const slope = (crestY(WAVES[1], Math.min(1, xUnit + eps), t, h) - crestY(WAVES[1], Math.max(0, xUnit - eps), t, h)) / Math.max(1, w * eps * 2);
      const y = crest + h * 0.085 + Math.sin(t * 1.1 + p * Math.PI * 2) * h * 0.008;
      return { x, y, s, pitch: Math.atan(slope) * 0.6, p };
    }

    function drawWhale(ctx2d, w, h, t, dark) {
      const { x, y, s, pitch } = whaleState(w, h, t);
      /* Fully off-screen: skip (keeps wrap-around clean). */
      if (x < -s * 2.8 || x > w + s * 2.8) return;

      const bodyTop = dark ? '#4b9ac7' : '#186088';
      const bodyBottom = dark ? '#1e5d86' : '#0b3a58';
      const belly = dark ? 'rgba(214, 238, 250, 0.92)' : 'rgba(238, 250, 255, 0.95)';
      const fin = dark ? '#174a6b' : '#09334f';

      ctx2d.save();
      ctx2d.translate(x, y);
      ctx2d.rotate(pitch * 0.7);
      ctx2d.globalAlpha = 0.96;

      /* Soft wake trail behind the tail */
      ctx2d.save();
      ctx2d.globalAlpha = dark ? 0.16 : 0.22;
      ctx2d.fillStyle = dark ? '#9fd0e8' : '#ffffff';
      for (let k = 0; k < 3; k++) {
        const wx = -s * (1.9 + k * 0.75) - Math.sin(t * 2 + k) * s * 0.06;
        const wr = s * (0.34 - k * 0.08);
        ctx2d.beginPath();
        ctx2d.ellipse(wx, s * 0.06 + k * s * 0.02, wr, wr * 0.42, 0, 0, Math.PI * 2);
        ctx2d.fill();
      }
      ctx2d.restore();

      const flap = Math.sin(t * 2.4) * 0.32;

      /* Tail stock */
      ctx2d.fillStyle = bodyBottom;
      ctx2d.beginPath();
      ctx2d.moveTo(-s * 0.82, -s * 0.05);
      ctx2d.quadraticCurveTo(-s * 1.25, 0, -s * 1.42, flap * s * 0.35);
      ctx2d.lineTo(-s * 1.3, flap * s * 0.35 + s * 0.12);
      ctx2d.quadraticCurveTo(-s * 1.05, s * 0.12, -s * 0.82, s * 0.22);
      ctx2d.closePath();
      ctx2d.fill();

      /* Tail fluke (two lobes, animated up/down) */
      ctx2d.save();
      ctx2d.translate(-s * 1.42, flap * s * 0.35 + s * 0.06);
      ctx2d.rotate(flap * 0.7);
      ctx2d.fillStyle = fin;
      ctx2d.beginPath();
      ctx2d.moveTo(0, 0);
      ctx2d.quadraticCurveTo(-s * 0.5, -s * 0.12, -s * 0.72, -s * 0.5);
      ctx2d.quadraticCurveTo(-s * 0.4, -s * 0.28, -s * 0.1, -s * 0.22);
      ctx2d.closePath();
      ctx2d.fill();
      ctx2d.beginPath();
      ctx2d.moveTo(0, 0);
      ctx2d.quadraticCurveTo(-s * 0.5, s * 0.16, -s * 0.68, s * 0.52);
      ctx2d.quadraticCurveTo(-s * 0.38, s * 0.3, -s * 0.08, s * 0.24);
      ctx2d.closePath();
      ctx2d.fill();
      ctx2d.restore();

      /* Body */
      const bodyGrad = ctx2d.createLinearGradient(0, -s * 0.55, 0, s * 0.55);
      bodyGrad.addColorStop(0, bodyTop);
      bodyGrad.addColorStop(1, bodyBottom);
      ctx2d.fillStyle = bodyGrad;
      ctx2d.beginPath();
      ctx2d.ellipse(0, 0, s, s * 0.55, 0, 0, Math.PI * 2);
      ctx2d.fill();

      /* Belly */
      ctx2d.fillStyle = belly;
      ctx2d.beginPath();
      ctx2d.ellipse(s * 0.12, s * 0.26, s * 0.68, s * 0.26, -0.06, 0, Math.PI * 2);
      ctx2d.fill();

      /* Back highlight */
      ctx2d.globalAlpha = 0.35;
      ctx2d.strokeStyle = dark ? '#cdeaf8' : '#bfe9fa';
      ctx2d.lineWidth = Math.max(1.5, s * 0.035);
      ctx2d.beginPath();
      ctx2d.ellipse(0, -s * 0.04, s * 0.78, s * 0.4, -0.08, Math.PI * 1.15, Math.PI * 1.75);
      ctx2d.stroke();
      ctx2d.globalAlpha = 0.96;

      /* Dorsal fin */
      ctx2d.fillStyle = fin;
      ctx2d.beginPath();
      ctx2d.moveTo(-s * 0.12, -s * 0.5);
      ctx2d.quadraticCurveTo(-s * 0.02, -s * 0.78, s * 0.16, -s * 0.62);
      ctx2d.quadraticCurveTo(s * 0.02, -s * 0.48, -s * 0.12, -s * 0.5);
      ctx2d.closePath();
      ctx2d.fill();

      /* Pectoral fin (gentle paddling) */
      const paddle = 0.45 + Math.sin(t * 2.4 + 0.9) * 0.18;
      ctx2d.save();
      ctx2d.translate(s * 0.05, s * 0.3);
      ctx2d.rotate(paddle);
      ctx2d.fillStyle = fin;
      ctx2d.beginPath();
      ctx2d.ellipse(s * 0.18, 0, s * 0.3, s * 0.11, 0, 0, Math.PI * 2);
      ctx2d.fill();
      ctx2d.restore();

      /* Eye + smile */
      ctx2d.fillStyle = '#ffffff';
      ctx2d.beginPath();
      ctx2d.arc(s * 0.55, -s * 0.08, s * 0.085, 0, Math.PI * 2);
      ctx2d.fill();
      ctx2d.fillStyle = '#0a2233';
      ctx2d.beginPath();
      ctx2d.arc(s * 0.575, -s * 0.075, s * 0.042, 0, Math.PI * 2);
      ctx2d.fill();
      ctx2d.fillStyle = '#ffffff';
      ctx2d.beginPath();
      ctx2d.arc(s * 0.588, -s * 0.088, s * 0.013, 0, Math.PI * 2);
      ctx2d.fill();
      ctx2d.strokeStyle = 'rgba(6, 30, 46, 0.75)';
      ctx2d.lineWidth = Math.max(1, s * 0.022);
      ctx2d.lineCap = 'round';
      ctx2d.beginPath();
      ctx2d.arc(s * 0.52, s * 0.05, s * 0.16, 0.25, 1.15);
      ctx2d.stroke();

      ctx2d.restore();

      /* Rising bubbles from the blowhole, drifting up through the water */
      const bx = x + s * 0.02;
      const by = y - s * 0.55;
      for (let i = 0; i < WHALE_BUBBLES; i++) {
        const age = ((t * 0.32 + i / WHALE_BUBBLES) % 1 + 1) % 1;
        const wob = Math.sin(t * 2 + i * 2.1) * s * 0.08 * age;
        const r = s * (0.03 + age * 0.05) * (0.7 + (i % 3) * 0.2);
        ctx2d.globalAlpha = (1 - age) * (dark ? 0.5 : 0.65);
        ctx2d.strokeStyle = dark ? '#c4e5f5' : '#ffffff';
        ctx2d.lineWidth = Math.max(1, s * 0.018);
        ctx2d.beginPath();
        ctx2d.arc(bx + wob - age * s * 0.5, by - age * h * 0.12, r, 0, Math.PI * 2);
        ctx2d.stroke();
      }
      ctx2d.globalAlpha = 1;
    }

    function paint(ctx2d, w, h, t, dark) {
      const sky = ctx2d.createLinearGradient(0, 0, 0, h);
      if (dark) {
        sky.addColorStop(0, '#04101d');
        sky.addColorStop(0.5, '#082439');
        sky.addColorStop(1, '#0a3352');
      } else {
        sky.addColorStop(0, '#cfeefb');
        sky.addColorStop(0.45, '#8fd8f0');
        sky.addColorStop(1, '#3f9fd0');
      }
      ctx2d.fillStyle = sky;
      ctx2d.fillRect(0, 0, w, h);

      /* Sun/moon glow */
      const glow = ctx2d.createRadialGradient(w * 0.78, h * 0.18, 0, w * 0.78, h * 0.18, h * 0.38);
      glow.addColorStop(0, dark ? 'rgba(190, 215, 235, 0.30)' : 'rgba(255, 246, 214, 0.55)');
      glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx2d.fillStyle = glow;
      ctx2d.fillRect(0, 0, w, h);

      /* Light column reflection on the water */
      const refl = ctx2d.createLinearGradient(0, h * 0.3, 0, h);
      refl.addColorStop(0, dark ? 'rgba(160, 200, 230, 0.10)' : 'rgba(255, 250, 230, 0.18)');
      refl.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx2d.fillStyle = refl;
      ctx2d.beginPath();
      ctx2d.moveTo(w * 0.66, h * 0.28);
      ctx2d.lineTo(w * 0.9, h * 0.28);
      ctx2d.lineTo(w * 1.05, h);
      ctx2d.lineTo(w * 0.5, h);
      ctx2d.closePath();
      ctx2d.fill();

      /* Far bands -> whale (mid-water) -> near bands: whale is occluded naturally. */
      paintWaveBand(ctx2d, w, h, t, dark, 0);
      paintWaveBand(ctx2d, w, h, t, dark, 1);
      drawWhale(ctx2d, w, h, t, dark);
      paintWaveBand(ctx2d, w, h, t, dark, 2);
      paintWaveBand(ctx2d, w, h, t, dark, 3);

      /* Twinkling sparkles on the near water */
      for (let i = 0; i < SPARKLES; i++) {
        const s = sparkleSeed(i);
        const x = s.x * w;
        const y = h * (0.5 + s.y * 0.45);
        const tw = 0.5 + 0.5 * Math.sin(t * 1.7 + s.p * Math.PI * 2);
        ctx2d.globalAlpha = (dark ? 0.35 : 0.55) * tw * tw;
        ctx2d.fillStyle = dark ? '#bfe2f2' : '#ffffff';
        ctx2d.beginPath();
        ctx2d.arc(x, y, Math.max(1, w * 0.0012) * (0.6 + tw), 0, Math.PI * 2);
        ctx2d.fill();
      }
      ctx2d.globalAlpha = 1;
    }

    function ensureStyle() {
      if (document.getElementById(STYLE_ID)) return;
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent =
        '.dso-backdrop{position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden}' +
        '.dso-backdrop canvas{display:block;width:100%;height:100%}';
      document.head.appendChild(style);
    }

    function startBackdrop() {
      ensureStyle();
      const previous = document.querySelector('[' + BACKDROP_ATTR + ']');
      if (previous) previous.remove();

      const host = document.createElement('div');
      host.setAttribute(BACKDROP_ATTR, '');
      host.className = 'dso-backdrop';
      host.setAttribute('aria-hidden', 'true');
      const canvas = document.createElement('canvas');
      host.appendChild(canvas);
      document.body.appendChild(host);

      const ctx2d = canvas.getContext('2d');
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      let raf = 0;
      let w = 0;
      let h = 0;
      let start = performance.now();

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = Math.max(1, window.innerWidth);
        h = Math.max(1, window.innerHeight);
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (reduceMotion.matches) frame();
      };

      let dark = document.body.hasAttribute('data-ds-dark-theme');

      function frame() {
        const t = reduceMotion.matches ? 12 : (performance.now() - start) / 1000;
        dark = document.body.hasAttribute('data-ds-dark-theme');
        paint(ctx2d, w, h, t, dark);
        if (!reduceMotion.matches) raf = window.requestAnimationFrame(frame);
      }

      const onVisibility = () => {
        if (reduceMotion.matches) return;
        if (document.hidden) {
          window.cancelAnimationFrame(raf);
          raf = 0;
        } else if (!raf) {
          start = performance.now() - 12000;
          raf = window.requestAnimationFrame(frame);
        }
      };

      const onSchemeChange = () => { if (!raf || reduceMotion.matches) frame(); };

      resize();
      window.addEventListener('resize', resize);
      document.addEventListener('visibilitychange', onVisibility);
      const observer = new MutationObserver(onSchemeChange);
      observer.observe(document.body, { attributes: true, attributeFilter: ['data-ds-dark-theme'] });
      reduceMotion.addEventListener('change', onSchemeChange);
      if (!reduceMotion.matches) raf = window.requestAnimationFrame(frame);
      else frame();

      return () => {
        window.cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
        document.removeEventListener('visibilitychange', onVisibility);
        reduceMotion.removeEventListener('change', onSchemeChange);
        observer.disconnect();
        host.remove();
      };
    }

    return {
      inject: ['theme'],
      apply(ctx) {
        ctx.effect(() => {
          const disposeTheme = ctx.theme.overrideTokens('ocean-wave-theme', tokenOverrides());
          const disposeBackdrop = startBackdrop();
          return () => {
            disposeBackdrop();
            disposeTheme();
          };
        }, 'ocean-wave: backdrop + translucent surfaces');
      },
    };
  },
});
