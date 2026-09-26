window.__ModuleLoader__.load({
  id: '@local/ocean-waves-theme',
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

      const step = Math.max(4, w / 220);
      for (let i = 0; i < WAVES.length; i++) {
        const wave = WAVES[i];
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
          const disposeTheme = ctx.theme.overrideTokens('ocean-waves-theme', tokenOverrides());
          const disposeBackdrop = startBackdrop();
          return () => {
            disposeBackdrop();
            disposeTheme();
          };
        }, 'ocean-waves: backdrop + translucent surfaces');
      },
    };
  },
});
