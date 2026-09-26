/* NASSA GARAGE — scripts principais */

'use strict';

  /* ---------- Preloader (ligado ao carregamento real) ---------- */
  (function () {
    const fill = document.getElementById('l-fill');
    const pct = document.getElementById('l-pct');
    const loader = document.getElementById('loader');
    if (!fill || !pct || !loader) { document.body.classList.add('loaded'); return; }

    const MIN_MS = 1100;           // tempo mínimo em tela, para a entrada não piscar
    const t0 = performance.now();
    let target = 0, shown = 0, finished = false;
    const ready = { fonts: false, load: false, logo: false };

    function paint() {
      shown += (target - shown) * 0.18;
      const v = Math.round(shown);
      fill.style.width = v + '%';
      pct.textContent = String(v).padStart(2, '0');
      if (!finished || v < 100) requestAnimationFrame(paint);
    }
    function bump() {
      const done = Object.values(ready).filter(Boolean).length;
      const elapsed = Math.min((performance.now() - t0) / MIN_MS, 1);
      target = Math.max(target, Math.round(Math.min(92, 20 * done + 32 * elapsed)));
      if (ready.fonts && ready.load && ready.logo && elapsed >= 1) finish();
    }
    function finish() {
      if (finished) return;
      finished = true;
      target = 100;
      setTimeout(() => {
        loader.classList.add('done');
        document.body.classList.add('loaded');
      }, 420);
    }
    requestAnimationFrame(paint);

    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve())
      .then(() => { ready.fonts = true; bump(); });
    const logo = document.querySelector('.hero-badge img');
    if (!logo || logo.complete) { ready.logo = true; }
    else { logo.addEventListener('load', () => { ready.logo = true; bump(); }); logo.addEventListener('error', () => { ready.logo = true; bump(); }); }
    if (document.readyState === 'complete') { ready.load = true; }
    else window.addEventListener('load', () => { ready.load = true; bump(); });

    const tick = setInterval(() => { bump(); if (finished) clearInterval(tick); }, 120);
    setTimeout(() => { ready.fonts = ready.load = ready.logo = true; finish(); }, 5000); // rede lenta: segue mesmo assim
  })();

  /* ---------- Nav: fundo sólido após o hero, esconde ao descer ---------- */
  const nav = document.getElementById('nav');
  let lastY = 0;
  function updateNav() {
    const y = window.scrollY;
    nav.classList.toggle('solid', y > 24);
    nav.classList.toggle('hide', y > 160 && y > lastY + 4 && !document.body.classList.contains('menu-open'));
    lastY = y;
  }
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  /* ---------- Menu mobile ---------- */
  const hamb = document.getElementById('hamb');
  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    hamb.setAttribute('aria-expanded', String(open));
    hamb.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  }
  hamb.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  document.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  window.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  window.matchMedia('(min-width: 901px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

  /* ---------- Link ativo conforme a seção visível ---------- */
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  const sections = [...navLinks].map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const secObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(s => secObs.observe(s));

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } });
  }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* ---------- Contadores ---------- */
  const easeOutCubic = p => 1 - Math.pow(1 - p, 3);
  function runCounter(el) {
    const to = parseFloat(el.dataset.to);
    const suffix = el.dataset.suffix || '';
    const locale = el.dataset.locale === '1';
    const dur = 1600, start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const v = Math.round(to * easeOutCubic(p));
      el.textContent = (locale ? v.toLocaleString('pt-BR') : String(v)) + (p === 1 ? suffix : '');
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  const cio = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { runCounter(e.target); cio.unobserve(e.target); } });
  }, { threshold: .6 });
  document.querySelectorAll('.cnt').forEach(el => cio.observe(el));

  /* ---------- Relógios de Performance ---------- */
  const SWEEP = 329.9; // 270° do círculo r=70 (circunferência 439.8)
  function animateGauge(card) {
    const value = parseFloat(card.dataset.value);
    const max = parseFloat(card.dataset.max);
    const decimals = parseInt(card.dataset.decimals || '0', 10);
    const useLocale = card.dataset.locale === '1';
    const pctV = Math.min(value / max, 1);
    const fill = card.querySelector('.fill');
    const needle = card.querySelector('.needle');
    const val = card.querySelector('.val');
    const dur = 1800;
    const start = performance.now();

    fill.style.transition = 'stroke-dasharray 1.8s cubic-bezier(.22,.7,.3,1)';
    requestAnimationFrame(() => {
      fill.style.strokeDasharray = (SWEEP * pctV) + ' 439.8';
      needle.style.transform = 'translate(-50%, -100%) rotate(' + (-135 + 270 * pctV) + 'deg)';
    });

    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const current = value * easeOutCubic(p);
      val.textContent = useLocale
        ? Math.round(current).toLocaleString('pt-BR')
        : current.toFixed(decimals).replace('.', ',');
      /* redline: como num carro, o arco acende vermelho quando o
         ponteiro entra no fim do curso */
      card.classList.toggle('redline', (current / max) >= 0.85);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  const gio = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { animateGauge(e.target); gio.unobserve(e.target); }
    });
  }, { threshold: .4 });
  document.querySelectorAll('.gauge-card').forEach(el => gio.observe(el));

  /* ---------- Curva de dinamômetro (SVG responsivo) ---------- */
  (function () {
    const svg = document.getElementById('dyno-svg');
    const box = document.getElementById('dyno');
    if (!svg || !box) return;
    const NS = 'http://www.w3.org/2000/svg';
    const RPM0 = 1000, RPM1 = 7000, PMAX = 450, TMAX = 600;
    /* torque de referência (Nm) por rotação — platô típico de N54 Stage 2 */
    const TQ = [[1000,240],[1500,370],[2000,520],[2500,560],[3000,560],[3500,560],[4000,558],[4500,552],[5000,540],[5500,530],[6000,500],[6500,460],[7000,410]];
    const tq = r => {
      for (let i = 0; i < TQ.length - 1; i++) {
        const [r0, t0] = TQ[i], [r1, t1] = TQ[i + 1];
        if (r >= r0 && r <= r1) {
          const p = (r - r0) / (r1 - r0);
          const s = p * p * (3 - 2 * p); // suavização
          return t0 + (t1 - t0) * s;
        }
      }
      return TQ[TQ.length - 1][1];
    };
    const cv = r => tq(r) * r / 7127; // cv = Nm × rpm / 7127
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rdRpm = document.getElementById('dr-rpm'), rdP = document.getElementById('dr-p'), rdT = document.getElementById('dr-t');

    let drawn = false, geom = null;

    function render() {
      const W = Math.max(svg.clientWidth, 320), H = Math.max(svg.clientHeight, 200);
      const narrow = W < 560;
      const PL = narrow ? 34 : 44, PR = narrow ? 34 : 44, PT = 18, PB = 30;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      while (svg.firstChild) svg.removeChild(svg.firstChild);

      const x = r => PL + (r - RPM0) / (RPM1 - RPM0) * (W - PL - PR);
      const yp = v => PT + (1 - v / PMAX) * (H - PT - PB);
      const yt = v => PT + (1 - v / TMAX) * (H - PT - PB);
      const el = (tag, attrs, parent) => {
        const n = document.createElementNS(NS, tag);
        for (const k in attrs) n.setAttribute(k, attrs[k]);
        (parent || svg).appendChild(n);
        return n;
      };

      const defs = el('defs', {});
      const grad = el('linearGradient', { id: 'dyno-fill', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      el('stop', { offset: '0%', 'stop-color': '#4A86D8', 'stop-opacity': .28 }, grad);
      el('stop', { offset: '100%', 'stop-color': '#4A86D8', 'stop-opacity': 0 }, grad);

      /* grade + eixos */
      for (let r = RPM0; r <= RPM1; r += 1000) {
        el('line', { class: 'grid', x1: x(r), x2: x(r), y1: PT, y2: H - PB });
        const t = el('text', { class: 'axis', x: x(r), y: H - 8, 'text-anchor': r === RPM0 ? 'start' : r === RPM1 ? 'end' : 'middle' });
        t.textContent = (r / 1000).toFixed(0) + 'k';
      }
      for (let v = 0; v <= PMAX; v += 150) {
        el('line', { class: 'grid', x1: PL, x2: W - PR, y1: yp(v), y2: yp(v) });
        const t = el('text', { class: 'axis', x: PL - 6, y: yp(v) + 3, 'text-anchor': 'end' });
        t.textContent = v;
        const t2 = el('text', { class: 'axis', x: W - PR + 6, y: yt(v * TMAX / PMAX) + 3, 'text-anchor': 'start' });
        t2.textContent = Math.round(v * TMAX / PMAX);
      }

      /* caminhos */
      let dP = '', dT = '';
      for (let r = RPM0; r <= RPM1; r += 50) {
        const c = r === RPM0 ? 'M' : 'L';
        dP += `${c}${x(r).toFixed(1)},${yp(cv(r)).toFixed(1)} `;
        dT += `${c}${x(r).toFixed(1)},${yt(tq(r)).toFixed(1)} `;
      }
      const area = el('path', { class: 'area-p', d: dP + `L${x(RPM1)},${H - PB} L${x(RPM0)},${H - PB} Z`, opacity: drawn ? 1 : 0 });
      const pathT = el('path', { class: 'curve curve-t', d: dT });
      const pathP = el('path', { class: 'curve curve-p', d: dP });

      /* cursor de leitura */
      const cross = el('line', { class: 'cross', x1: 0, x2: 0, y1: PT, y2: H - PB });
      const dotP = el('circle', { class: 'dot dot-p', r: 4 });
      const dotT = el('circle', { class: 'dot dot-t', r: 4 });

      if (!drawn) {
        [pathP, pathT].forEach(p => {
          const len = p.getTotalLength();
          p.style.strokeDasharray = len;
          p.style.strokeDashoffset = len;
        });
      }
      geom = { W, PL, PR, x, yp, yt, cross, dotP, dotT, pathP, pathT, area };
    }

    function draw() {
      if (drawn || !geom) return;
      drawn = true;
      [geom.pathT, geom.pathP].forEach((p, i) => {
        p.style.transition = reduced ? 'none' : `stroke-dashoffset 2.2s cubic-bezier(.22,.7,.3,1) ${i * .25}s`;
        requestAnimationFrame(() => { p.style.strokeDashoffset = 0; });
      });
      geom.area.style.transition = reduced ? 'none' : 'opacity 1.2s ease 1.4s';
      requestAnimationFrame(() => { geom.area.setAttribute('opacity', 1); });
    }

    function readAt(clientX) {
      if (!geom) return;
      const rect = svg.getBoundingClientRect();
      const px = clientX - rect.left;
      const r = Math.round(Math.min(Math.max((px - geom.PL) / (geom.W - geom.PL - geom.PR), 0), 1) * (RPM1 - RPM0) / 50) * 50 + RPM0;
      const xx = geom.x(r);
      geom.cross.setAttribute('x1', xx); geom.cross.setAttribute('x2', xx);
      geom.dotP.setAttribute('cx', xx); geom.dotP.setAttribute('cy', geom.yp(cv(r)));
      geom.dotT.setAttribute('cx', xx); geom.dotT.setAttribute('cy', geom.yt(tq(r)));
      rdRpm.textContent = r.toLocaleString('pt-BR') + ' rpm';
      rdP.textContent = Math.round(cv(r)) + ' cv';
      rdT.textContent = Math.round(tq(r)) + ' Nm';
    }

    render();
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(render, 120); }, { passive: true });
    const drawObs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { draw(); drawObs.disconnect(); } });
    }, { threshold: .35 });
    drawObs.observe(box);
    svg.addEventListener('pointermove', e => { box.classList.add('hover'); readAt(e.clientX); }, { passive: true });
    svg.addEventListener('pointerleave', () => box.classList.remove('hover'));
  })();

  /* ---------- Nassa FlowCalc ---------- */
  let fcMode = 'inj';
  const FC_BSFC = {
    gasolina: { asp: 0.50, turbo: 0.60 },
    alcool:   { asp: 0.75, turbo: 0.90 },
    metanol:  { asp: 1.10, turbo: 1.30 }
  };
  const fmt = (v, d) => v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  function fcSwitch(m) {
    fcMode = m;
    const inj = m === 'inj';
    document.getElementById('fc-tab-inj').classList.toggle('active', inj);
    document.getElementById('fc-tab-pot').classList.toggle('active', !inj);
    document.getElementById('fc-tab-inj').setAttribute('aria-selected', inj);
    document.getElementById('fc-tab-pot').setAttribute('aria-selected', !inj);
    document.getElementById('fc-f-potencia').classList.toggle('hidden', !inj);
    document.getElementById('fc-f-vazao').classList.toggle('hidden', inj);
    document.getElementById('fc-r-inj').classList.toggle('hidden', !inj);
    document.getElementById('fc-r-pot').classList.toggle('hidden', inj);
    fcCalc();
  }
  function fcGet(name) {
    return document.querySelector('input[name="' + name + '"]:checked').value;
  }
  function fcCalc() {
    const bicos = parseFloat(document.getElementById('fc-bicos').value);
    const motor = fcGet('fc-motor');
    const comb  = fcGet('fc-comb');
    const duty  = parseFloat(fcGet('fc-duty'));
    const bsfc  = FC_BSFC[comb][motor];
    if (!bicos || bicos < 1) return;

    if (fcMode === 'inj') {
      const cv = parseFloat(document.getElementById('fc-potencia').value);
      if (!cv || cv <= 0) return;
      const lbhr = (cv * bsfc) / (bicos * duty);
      document.getElementById('fc-out-lbhr').textContent = fmt(lbhr, 1);
      document.getElementById('fc-out-ccmin').textContent = fmt(lbhr * 10.5, 0);
    } else {
      const vazao = parseFloat(document.getElementById('fc-vazao').value);
      if (!vazao || vazao <= 0) return;
      const cv = (vazao * bicos * duty) / bsfc;
      document.getElementById('fc-out-cv').textContent = fmt(cv, 0);
    }
  }
  fcCalc();

  /* ---------- Wireframe 3D (Blueprint) ---------- */
  (function () {
    const canvas = document.getElementById('wf-canvas');
    const section = document.getElementById('wireframe');
    if (!canvas || !section) return;

    /* Carregamento sob demanda: a biblioteca 3D e os modelos só baixam
       quando o usuário se aproxima da seção Blueprint */
    const lazyBoot = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        lazyBoot.disconnect();
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        script.onload = init;
        script.onerror = () => { section.style.display = 'none'; };
        document.head.appendChild(script);
      });
    }, { rootMargin: '1800px' });
    lazyBoot.observe(section);

    function init() {
      try {
        const BLUE = 0x2A61AD;
        const stage = canvas.parentElement;

        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
        camera.position.set(0, 1.9, 6.6);
        camera.lookAt(0, 0.6, 0);

        const car = new THREE.Group();
        const lineMat = (op) => new THREE.LineBasicMaterial({ color: BLUE, transparent: true, opacity: op });
        const wireMat = (op) => new THREE.MeshBasicMaterial({ color: BLUE, wireframe: true, transparent: true, opacity: op });

        /* ================= E90 por LOFT de seções transversais =================
           14 estações ao longo do carro; cada uma com meio-perfil (y=altura,
           z=meia-largura) do centro do teto até o assoalho. Proporções tiradas
           da foto de referência do 335i LCI. */
        const ST = [
          [ 2.30, [[0.62,0.00],[0.60,0.30],[0.52,0.44],[0.42,0.46],[0.30,0.44],[0.24,0.40],[0.22,0.25],[0.22,0.00]]],
          [ 2.10, [[0.68,0.00],[0.66,0.42],[0.58,0.58],[0.45,0.62],[0.32,0.60],[0.26,0.52],[0.24,0.30],[0.24,0.00]]],
          [ 1.75, [[0.74,0.00],[0.72,0.50],[0.66,0.72],[0.50,0.78],[0.34,0.76],[0.28,0.62],[0.26,0.34],[0.26,0.00]]],
          [ 1.40, [[0.76,0.00],[0.74,0.52],[0.68,0.76],[0.50,0.82],[0.34,0.80],[0.28,0.64],[0.26,0.36],[0.26,0.00]]],
          [ 1.05, [[0.80,0.00],[0.78,0.52],[0.70,0.78],[0.52,0.84],[0.34,0.80],[0.28,0.64],[0.26,0.36],[0.26,0.00]]],
          [ 0.85, [[0.88,0.00],[0.85,0.50],[0.72,0.80],[0.52,0.86],[0.34,0.82],[0.28,0.66],[0.26,0.36],[0.26,0.00]]],
          [ 0.45, [[1.12,0.00],[1.08,0.44],[0.80,0.80],[0.54,0.88],[0.35,0.84],[0.28,0.66],[0.26,0.36],[0.26,0.00]]],
          [ 0.10, [[1.30,0.00],[1.26,0.42],[0.84,0.80],[0.55,0.88],[0.35,0.84],[0.28,0.66],[0.26,0.36],[0.26,0.00]]],
          [-0.55, [[1.30,0.00],[1.26,0.42],[0.85,0.80],[0.55,0.88],[0.35,0.84],[0.28,0.66],[0.26,0.36],[0.26,0.00]]],
          [-1.05, [[1.10,0.00],[1.06,0.44],[0.86,0.80],[0.56,0.88],[0.35,0.84],[0.28,0.66],[0.26,0.36],[0.26,0.00]]],
          [-1.40, [[0.92,0.00],[0.90,0.48],[0.86,0.78],[0.56,0.84],[0.35,0.82],[0.28,0.64],[0.26,0.36],[0.26,0.00]]],
          [-1.75, [[0.88,0.00],[0.86,0.50],[0.82,0.72],[0.54,0.80],[0.34,0.78],[0.28,0.62],[0.26,0.34],[0.26,0.00]]],
          [-2.10, [[0.84,0.00],[0.82,0.46],[0.76,0.62],[0.50,0.66],[0.34,0.64],[0.28,0.54],[0.26,0.30],[0.26,0.00]]],
          [-2.30, [[0.78,0.00],[0.76,0.36],[0.66,0.50],[0.46,0.54],[0.32,0.52],[0.26,0.44],[0.24,0.26],[0.24,0.00]]]
        ];

        /* Cada estação vira um anel fechado de 14 pontos (perfil + espelho) */
        function ringOf(st) {
          const x = st[0], prof = st[1], pts = [];
          for (let i = 0; i < prof.length; i++) pts.push(new THREE.Vector3(x, prof[i][0], prof[i][1]));
          for (let i = prof.length - 2; i >= 1; i--) pts.push(new THREE.Vector3(x, prof[i][0], -prof[i][1]));
          return pts; // 14 pontos
        }
        const rings = ST.map(ringOf);
        const RN = rings[0].length;

        /* Casco: malha costurando os anéis */
        const verts = [];
        rings.forEach(r => r.forEach(p => verts.push(p.x, p.y, p.z)));
        const idx = [];
        for (let s = 0; s < rings.length - 1; s++) {
          for (let i = 0; i < RN; i++) {
            const a = s * RN + i, b = s * RN + (i + 1) % RN;
            const c = (s + 1) * RN + i, d = (s + 1) * RN + (i + 1) % RN;
            idx.push(a, c, b, b, c, d);
          }
        }
        /* Tampas dianteira e traseira */
        for (let i = 1; i < RN - 1; i++) idx.push(0, i + 1, i);
        const base = (rings.length - 1) * RN;
        for (let i = 1; i < RN - 1; i++) idx.push(base, base + i, base + i + 1);

        const hullGeo = new THREE.BufferGeometry();
        hullGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
        hullGeo.setIndex(idx);
        car.add(new THREE.Mesh(hullGeo, wireMat(0.10)));

        /* Gaiola de linhas: anéis transversais + longitudinais (o visual blueprint) */
        rings.forEach(r => {
          car.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(r), lineMat(0.30)));
        });
        for (let i = 0; i < RN; i++) {
          const long = rings.map(r => r[i]);
          const strong = (i === 2 || i === RN - 2 || i === 0 || i === 3 || i === RN - 3);
          car.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(long), lineMat(strong ? 0.85 : 0.45)));
        }

        /* Arcos de roda desenhados na lateral */
        function archLine(cx, side) {
          const pts = [];
          for (let a = 200; a >= -20; a -= 12) {
            const rad = a * Math.PI / 180;
            pts.push(new THREE.Vector3(cx + Math.cos(rad) * 0.52, 0.38 + Math.sin(rad) * 0.50, 0.86 * side));
          }
          car.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat(0.8)));
        }
        [1, -1].forEach(s => { archLine(1.40, s); archLine(-1.40, s); });

        /* Linhas de detalhe: portas, contorno dos vidros e capô */
        const seg = (a, b, op) => car.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), lineMat(op || 0.5)));
        [1, -1].forEach(s => {
          const z = 0.87 * s;
          seg(new THREE.Vector3(0.98, 0.30, z * 0.76), new THREE.Vector3(0.96, 0.86, z));   // porta diant.
          seg(new THREE.Vector3(-0.10, 0.30, z * 0.76), new THREE.Vector3(-0.11, 0.87, z)); // divisa
          seg(new THREE.Vector3(-1.10, 0.30, z * 0.74), new THREE.Vector3(-1.12, 0.86, z)); // porta tras.
          /* contorno da janela lateral (DLO com Hofmeister) */
          const win = [
            new THREE.Vector3(0.90, 0.88, 0.84 * s),
            new THREE.Vector3(0.42, 1.10, 0.60 * s),
            new THREE.Vector3(-0.90, 1.10, 0.60 * s),
            new THREE.Vector3(-1.28, 0.88, 0.82 * s),
            new THREE.Vector3(0.90, 0.88, 0.84 * s)
          ];
          car.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(win), lineMat(0.7)));
          seg(new THREE.Vector3(2.28, 0.60, 0.28 * s), new THREE.Vector3(1.06, 0.83, 0.33 * s), 0.4); // vinco do capô
        });

        /* Frente: grades duplo-rim e faróis */
        const det = (geo, x, y, z, ry, op) => {
          const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 1), lineMat(op || 0.85));
          e.position.set(x, y, z);
          if (ry) e.rotation.y = ry;
          car.add(e);
          return e;
        };
        const kidney = new THREE.BoxGeometry(0.04, 0.14, 0.20);
        det(kidney, 2.30, 0.50, 0.14);
        det(kidney.clone(), 2.30, 0.50, -0.14);
        const lamp = new THREE.BoxGeometry(0.05, 0.09, 0.30);
        det(lamp, 2.24, 0.55, 0.42, 0.35);
        det(lamp.clone(), 2.24, 0.55, -0.42, -0.35);
        const tail = new THREE.BoxGeometry(0.04, 0.10, 0.34);
        det(tail, -2.24, 0.66, 0.40, -0.35, 0.75);
        det(tail.clone(), -2.24, 0.66, -0.40, 0.35, 0.75);
        const mirror = new THREE.BoxGeometry(0.12, 0.06, 0.09);
        det(mirror, 0.86, 0.92, 0.90);
        det(mirror.clone(), 0.86, 0.92, -0.90);
        const tip = new THREE.CylinderGeometry(0.045, 0.05, 0.12, 12);
        tip.rotateZ(Math.PI / 2);
        det(tip, -2.32, 0.30, 0.42, 0, 0.8);
        det(tip.clone(), -2.32, 0.30, -0.42, 0, 0.8);

        /* Rodas estilo M: pneu, tala, 5 raios duplos, cubo, disco e pinça */
        function buildWheel() {
          const w = new THREE.Group();
          w.add(new THREE.Mesh(new THREE.TorusGeometry(0.285, 0.070, 9, 26), wireMat(0.3)));
          const barrel = new THREE.CylinderGeometry(0.23, 0.23, 0.18, 24, 1, true);
          barrel.rotateX(Math.PI / 2);
          w.add(new THREE.Mesh(barrel, wireMat(0.22)));
          const rimPts = [];
          for (let i = 0; i <= 30; i++) {
            const a = i / 30 * Math.PI * 2;
            rimPts.push(new THREE.Vector3(Math.cos(a) * 0.23, Math.sin(a) * 0.23, 0.09));
          }
          w.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(rimPts), lineMat(0.85)));
          for (let i = 0; i < 5; i++) {
            const a = i / 5 * Math.PI * 2;
            [-0.028, 0.028].forEach(off => {
              const sp = new THREE.LineSegments(
                new THREE.EdgesGeometry(new THREE.BoxGeometry(0.022, 0.175, 0.024), 1), lineMat(0.8));
              sp.position.set(Math.cos(a) * 0.135 - Math.sin(a) * off, Math.sin(a) * 0.135 + Math.cos(a) * off, 0.075);
              sp.rotation.z = a - Math.PI / 2;
              w.add(sp);
            });
          }
          const hub = new THREE.CylinderGeometry(0.045, 0.045, 0.055, 12);
          hub.rotateX(Math.PI / 2);
          const hb = new THREE.LineSegments(new THREE.EdgesGeometry(hub, 12), lineMat(0.85));
          hb.position.z = 0.085;
          w.add(hb);
          const disc = new THREE.CylinderGeometry(0.155, 0.155, 0.02, 20);
          disc.rotateX(Math.PI / 2);
          const de = new THREE.LineSegments(new THREE.EdgesGeometry(disc, 12), lineMat(0.5));
          de.position.z = -0.02;
          w.add(de);
          const cal = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.08, 0.12, 0.05), 1), lineMat(0.6));
          cal.position.set(0, 0.13, -0.02);
          w.add(cal);
          return w;
        }
        [[1.40, 0.36, 0.72, 1], [1.40, 0.36, -0.72, -1], [-1.40, 0.36, 0.72, 1], [-1.40, 0.36, -0.72, -1]]
          .forEach(([x, y, z, sideSign]) => {
            const w = buildWheel();
            w.position.set(x, y, z);
            if (sideSign < 0) w.rotation.y = Math.PI;
            car.add(w);
          });

        scene.add(car);

        /* O carro procedural (linhas simples) é só reserva: fica escondido
           enquanto o modelo real baixa e só aparece se o download falhar */
        car.visible = false;
        const loadEl = document.getElementById('wf-load');
        const hintEl = section.querySelector('.wf-hint');
        function setLoad(txt) { if (loadEl) loadEl.textContent = txt; }
        function loadDone() {
          if (loadEl) loadEl.classList.add('off');
          if (hintEl) hintEl.classList.add('on');
        }
        function showProcedural() {
          car.visible = true;
          if (loadEl) loadEl.classList.add('off');
        }
        setLoad('Carregando modelo 3D');

        /* ---- Modelo 3D real: se houver um arquivo e90.glb na pasta do site,
               ele substitui o carro procedural (mesma técnica do carro denso
               em wireframe de sites de referência) ---- */
        const E90_SRC = 'e90-parts.glb';
        const WHEEL_SRC = 'wheel-359m.glb';
        window.__WHEEL_SRC = WHEEL_SRC;
        window.__ENGINE_SRC = 'engine-n54.glb';
        window.__TURBO_SRC = 'turbo.glb';
        const loaderScript = document.createElement('script');
        loaderScript.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js';
        loaderScript.onload = () => {
          try {
            new THREE.GLTFLoader().load(E90_SRC, (gltf) => {
              try {
              const model = new THREE.Group();
              window.__carPieces = [];
              gltf.scene.updateMatrixWorld(true);
              gltf.scene.traverse(node => {
                if (node.isMesh && node.geometry) {
                  const geo = node.geometry.clone();
                  geo.applyMatrix4(node.matrixWorld);
                  /* centro próprio de cada peça, para girar em torno de si mesma */
                  geo.computeBoundingBox();
                  const c = new THREE.Vector3();
                  geo.boundingBox.getCenter(c);
                  geo.translate(-c.x, -c.y, -c.z);

                  const piece = new THREE.Group();
                  /* na voadura, cada peça mostra só a malha; o contorno vem
                     depois, único e sem emendas */
                  piece.add(new THREE.Mesh(geo, wireMat(0.2)));
                  piece.position.copy(c);

                  /* estado inicial disperso: direção, giro e atraso aleatórios */
                  const dir = new THREE.Vector3(
                    (Math.random() - 0.5), (Math.random() - 0.3), (Math.random() - 0.5)
                  ).normalize();
                  piece.userData = {
                    target: c.clone(),
                    dir: dir,
                    dist: 5 + Math.random() * 5,
                    rot: new THREE.Vector3(Math.random() * 5, Math.random() * 5, Math.random() * 5),
                    delay: Math.random() * 0.45
                  };
                  window.__carPieces.push(piece);
                  model.add(piece);
                }
              });
              if (!model.children.length) return;

              /* enquadrar o conjunto */
              const box = new THREE.Box3().setFromObject(model);
              const size = new THREE.Vector3();
              box.getSize(size);
              if (size.z > size.x) model.rotation.y = Math.PI / 2;

              /* troca o procedural pelas peças, começando dispersas */
              while (car.children.length) car.remove(car.children[0]);
              car.add(model);
              window.__setAssembly && window.__setAssembly(0);
              car.visible = true;
              loadDone();

              /* contorno único do carro completo — elimina as emendas entre
                 as peças; construído num respiro para não travar a animação */
              setTimeout(() => {
                try {
                  const soup = [];
                  window.__carPieces.forEach(pc => {
                    const gNI = pc.children[0].geometry.toNonIndexed();
                    const arr = gNI.attributes.position.array;
                    const off = pc.userData.target;
                    for (let i = 0; i < arr.length; i += 3) {
                      soup.push(arr[i] + off.x, arr[i + 1] + off.y, arr[i + 2] + off.z);
                    }
                    gNI.dispose();
                  });
                  const mergedGeo = new THREE.BufferGeometry();
                  mergedGeo.setAttribute('position', new THREE.Float32BufferAttribute(soup, 3));
                  const outlineMat = lineMat(0);
                  model.add(new THREE.LineSegments(new THREE.EdgesGeometry(mergedGeo, 24), outlineMat));
                  mergedGeo.dispose();
                  window.__carOutline = outlineMat;
                  if (typeof asmT !== 'undefined' && asmT >= 1) outlineMat.opacity = 0.8;
                } catch (err) { /* sem contorno, segue só a malha */ }
              }, 150);
              } catch (err) { showProcedural(); }
            }, (ev) => {
              if (ev && ev.total) setLoad('Carregando modelo 3D · ' + Math.min(99, Math.round(ev.loaded / ev.total * 100)) + '%');
            }, () => { showProcedural(); /* sem modelo embutido: segue o carro procedural */ });
          } catch (err) { showProcedural(); /* GLTFLoader indisponível: segue o procedural */ }
        };
        loaderScript.onerror = () => { showProcedural(); /* CDN indisponível: segue o procedural */ };
        document.head.appendChild(loaderScript);

        /* Piso em grade, bem tênue */
        const grid = new THREE.GridHelper(26, 26, BLUE, BLUE);
        grid.material.transparent = true;
        grid.material.opacity = 0.07;
        scene.add(grid);

        /* Redimensionamento */
        function resize() {
          const w = stage.clientWidth, h = stage.clientHeight;
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        }
        resize();
        window.addEventListener('resize', resize, { passive: true });

        /* Rotação: rolagem manda + giro lento constante */
        const degEl = document.getElementById('wf-deg');
        const stats = section.querySelectorAll('.wf-stat');
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let idle = 0;

        /* Stats surgem em cascata quando a seção entra na tela */
        const statObs = new IntersectionObserver(entries => {
          entries.forEach(e => {
            if (e.isIntersecting) {
              stats.forEach((el, i) => setTimeout(() => el.classList.add('on'), 250 + i * 320));
              statObs.disconnect();
            }
          });
        }, { threshold: .35 });
        statObs.observe(section);

        /* Montagem estilo armadura: peças voam e se encaixam */
        let asmT = -1;            // -1 = aguardando; 0..1 = animando; 1 = montado
        let asmStart = 0;
        const ASM_DUR = 2600;     // ms
        const easeOut = (p) => 1 - Math.pow(1 - p, 3);
        window.__setAssembly = (v) => {
          asmT = v;
          if (v === 0) asmStart = 0;
          applyAssembly(v === 1 ? 1 : 0);
        };
        function applyAssembly(t) {
          if (window.__carOutline) {
            window.__carOutline.opacity = Math.max(0, (t - 0.75) / 0.25) * 0.8;
          }
          (window.__carPieces || []).forEach(pc => {
            const u = pc.userData;
            const p = easeOut(Math.min(Math.max((t - u.delay) / (1 - u.delay), 0), 1));
            pc.position.set(
              u.target.x + u.dir.x * u.dist * (1 - p),
              u.target.y + u.dir.y * u.dist * (1 - p),
              u.target.z + u.dir.z * u.dist * (1 - p)
            );
            pc.rotation.set(u.rot.x * (1 - p), u.rot.y * (1 - p), u.rot.z * (1 - p));
          });
        }
        /* dispara quando a seção está na tela — inclusive se o modelo terminar
           de carregar com a seção já visível (o observer não dispara de novo,
           então o loop de render verifica a cada quadro) */
        let asmInView = false;
        function startAssembly() { asmT = 0.0001; asmStart = performance.now(); }
        const asmObs = new IntersectionObserver(es => {
          es.forEach(e => {
            asmInView = e.isIntersecting;
            if (e.isIntersecting && asmT === 0) startAssembly();
          });
        }, { threshold: .35 });
        asmObs.observe(section);
        stage.addEventListener('click', () => {
          if (asmT >= 1 && window.__carPieces && window.__carPieces.length) {
            asmT = 0.0001;
            asmStart = performance.now();
          }
        });

        /* Giro contínuo + inclinação sutil seguindo o mouse */
        let tiltNow = 0, tiltTarget = 0;
        stage.addEventListener('mousemove', (ev) => {
          const rr = stage.getBoundingClientRect();
          tiltTarget = ((ev.clientY - rr.top) / rr.height - 0.5) * 0.2;
        }, { passive: true });
        stage.addEventListener('mouseleave', () => { tiltTarget = 0; }, { passive: true });

        /* Só renderiza com a seção na tela — CPU/GPU livres no resto do site */
        let wfVisible = false;
        const wfVisObs = new IntersectionObserver(entries => {
          entries.forEach(e => { wfVisible = e.isIntersecting; });
        }, { rootMargin: '120px' });
        wfVisObs.observe(stage);

        function frame() {
          requestAnimationFrame(frame);
          if (asmT === 0 && asmInView) startAssembly();
          if (!wfVisible && asmT >= 1) return;

          if (!reduced) idle += 0.0042;
          car.rotation.y = idle + 0.5;
          tiltNow += (tiltTarget - tiltNow) * 0.05;
          car.rotation.x = tiltNow;

          if (asmT > 0 && asmT < 1) {
            asmT = reduced ? 1 : Math.min((performance.now() - asmStart) / ASM_DUR, 1);
            applyAssembly(asmT);
          }

          const deg = Math.round((car.rotation.y * 180 / Math.PI) % 360);
          degEl.textContent = String(deg < 0 ? deg + 360 : deg).padStart(3, '0') + '°';

          renderer.render(scene, camera);
        }
        frame();
        try { initParts(); } catch (err) { /* peças 3D são opcionais */ }
      } catch (e) {
        section.style.display = 'none';
      }
    }

    /* Peças 3D dos Components: roda M, motor N54 e twin turbo */
    function initParts() {
      const lm = (op) => new THREE.LineBasicMaterial({ color: 0x2A61AD, transparent: true, opacity: op });
      const wm = (op) => new THREE.MeshBasicMaterial({ color: 0x2A61AD, wireframe: true, transparent: true, opacity: op });
      const edge = (geo, op, thr) => new THREE.LineSegments(new THREE.EdgesGeometry(geo, thr === undefined ? 10 : thr), lm(op === undefined ? 0.9 : op));

      /* Motor N54 — reconstruído com base na foto de referência:
         tampa inclinada, trem de polias e correia na frente, admissão de um
         lado e os dois turbos baixos no lado do escape */
      function partEngine() {
        const g = new THREE.Group();
        const add = (geo, x, y, z, op, rx, rz) => {
          const e = edge(geo, op === undefined ? 0.85 : op, 1);
          e.position.set(x, y, z);
          if (rx) e.rotation.x = rx;
          if (rz) e.rotation.z = rz;
          g.add(e);
          return e;
        };
        add(new THREE.BoxGeometry(1.55, 0.58, 0.60), 0, -0.08, 0, 0.9);            // bloco R6
        g.add(new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.58, 0.60), wm(0.06)));
        add(new THREE.BoxGeometry(1.55, 0.18, 0.56), 0, 0.30, 0, 0.85);            // cabeçote
        const cover = add(new THREE.BoxGeometry(1.48, 0.14, 0.50), 0, 0.47, 0.03, 0.85); // tampa
        cover.rotation.x = -0.14;                                                   // inclinação BMW
        for (let i = 0; i < 7; i++)                                                 // ribs da tampa
          add(new THREE.BoxGeometry(0.012, 0.02, 0.40), -0.55 + i * 0.18, 0.56, 0.02, 0.45);
        const plen = new THREE.CylinderGeometry(0.14, 0.14, 1.40, 12);
        plen.rotateZ(Math.PI / 2);
        add(plen, 0, 0.16, 0.46, 0.8);                                              // plenum
        for (let i = 0; i < 6; i++) {                                               // 6 dutos
          const run = new THREE.CylinderGeometry(0.045, 0.045, 0.28, 8);
          run.rotateX(Math.PI / 2.9);
          add(run, -0.60 + i * 0.24, 0.32, 0.28, 0.65);
        }
        /* Frente: polias + correia, como na foto */
        const pulley = (r, y, z, th) => {
          const p = new THREE.CylinderGeometry(r, r, th || 0.07, 16);
          p.rotateZ(Math.PI / 2);
          return add(p, 0.83, y, z, 0.85);
        };
        pulley(0.17, -0.30, 0.05, 0.09);   // virabrequim
        pulley(0.12,  0.12, 0.24);         // alternador
        pulley(0.11, -0.08, 0.30);         // ar-condicionado
        pulley(0.07,  0.02, 0.02);         // tensor
        pulley(0.06,  0.26, 0.00);         // polia guia
        const belt = [                       // correia serpentina (traçado aproximado)
          [-0.30, 0.22], [-0.08, 0.41], [0.12, 0.36], [0.26, 0.06],
          [0.02, -0.05], [-0.30, -0.12], [-0.30, 0.22]
        ].map(p => new THREE.Vector3(0.90, p[0], p[1]));
        g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(belt), lm(0.6)));
        /* Lado do escape: 6 saídas baixas + os dois turbos */
        for (let i = 0; i < 6; i++) {
          const ex = new THREE.CylinderGeometry(0.04, 0.04, 0.24, 8);
          ex.rotateX(-Math.PI / 2.5);
          add(ex, -0.60 + i * 0.24, 0.02, -0.38, 0.55);
        }
        add(new THREE.TorusGeometry(0.14, 0.06, 8, 14), -0.38, -0.22, -0.55, 0.8);  // turbo 1
        add(new THREE.TorusGeometry(0.14, 0.06, 8, 14), 0.34, -0.22, -0.55, 0.8);   // turbo 2
        add(new THREE.CylinderGeometry(0.06, 0.08, 0.30, 10), -0.02, -0.34, -0.60, 0.6, Math.PI / 2); // downpipe
        add(new THREE.BoxGeometry(0.95, 0.22, 0.46), 0, -0.48, 0.02, 0.7);          // cárter
        add(new THREE.CylinderGeometry(0.085, 0.085, 0.18, 12), 0.42, 0.46, 0.30, 0.7); // filtro de óleo
        g.rotation.y = 0.55;
        g.scale.setScalar(0.9);
        return g;
      }

      /* Twin turbo — reconstruído com base na foto: flange do coletor com 3
         saídas, caracol da turbina, CHRA, compressor de boca aberta com as
         pás visíveis, atuador da wastegate com haste */
      function partTurbo() {
        const g = new THREE.Group();
        function unit() {
          const t = new THREE.Group();
          const add = (geo, x, y, z, op, rx, rz) => {
            const e = edge(geo, op === undefined ? 0.85 : op, 1);
            e.position.set(x, y, z);
            if (rx) e.rotation.x = rx;
            if (rz) e.rotation.z = rz;
            t.add(e);
            return e;
          };
          /* flange do coletor com 3 janelas (cada turbo serve 3 cilindros) */
          const flange = add(new THREE.BoxGeometry(0.46, 0.34, 0.05), 0.10, 0.42, -0.34, 0.8);
          flange.rotation.x = 0.5;
          for (let i = 0; i < 3; i++) {
            const port = new THREE.CylinderGeometry(0.055, 0.055, 0.10, 10);
            port.rotateX(Math.PI / 2 + 0.5);
            add(port, -0.04 + i * 0.14, 0.46, -0.30, 0.7);
          }
          const bend = add(new THREE.TorusGeometry(0.14, 0.065, 8, 10, Math.PI / 2), -0.02, 0.22, -0.30, 0.75); // curva do coletor
          bend.rotation.z = Math.PI / 2;
          add(new THREE.TorusGeometry(0.20, 0.10, 8, 18), 0, 0, -0.26, 0.9);        // caracol da turbina
          const dp = new THREE.CylinderGeometry(0.10, 0.12, 0.18, 12);
          dp.rotateX(Math.PI / 2);
          add(dp, 0, 0, -0.48, 0.7);                                                // v-band de saída
          add(new THREE.CylinderGeometry(0.10, 0.10, 0.24, 12), 0, 0, -0.02, 0.8, Math.PI / 2); // CHRA
          add(new THREE.TorusGeometry(0.26, 0.115, 9, 20), 0, 0, 0.22, 0.9);        // caracol do compressor
          /* boca aberta com as pás do rotor, como na foto */
          const inPts = [];
          for (let i = 0; i <= 24; i++) {
            const a = i / 24 * Math.PI * 2;
            inPts.push(new THREE.Vector3(Math.cos(a) * 0.145, Math.sin(a) * 0.145, 0.37));
          }
          t.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(inPts), lm(0.9)));
          for (let i = 0; i < 6; i++) {                                             // pás
            const a = i / 6 * Math.PI * 2;
            const blade = edge(new THREE.BoxGeometry(0.02, 0.11, 0.05), 0.75, 1);
            blade.position.set(Math.cos(a) * 0.07, Math.sin(a) * 0.07, 0.35);
            blade.rotation.z = a + 0.6;
            t.add(blade);
          }
          add(new THREE.CylinderGeometry(0.02, 0.02, 0.06, 8), 0, 0, 0.37, 0.9, Math.PI / 2); // porca central
          const out = new THREE.CylinderGeometry(0.09, 0.09, 0.30, 10);
          out.rotateZ(Math.PI / 2);
          add(out, 0.34, 0.18, 0.22, 0.7);                                          // saída do compressor
          add(new THREE.CylinderGeometry(0.11, 0.11, 0.07, 14), -0.28, 0.28, 0.10, 0.8, Math.PI / 2); // atuador
          add(new THREE.BoxGeometry(0.16, 0.03, 0.05), -0.18, 0.22, 0.10, 0.6);     // suporte
          t.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-0.28, 0.21, 0.10), new THREE.Vector3(-0.16, 0.02, -0.14)
          ]), lm(0.55)));                                                            // haste da wastegate
          return t;
        }
        const a = unit(); a.position.set(-0.55, -0.05, 0); a.rotation.set(0.1, 0.7, 0);
        const b = unit(); b.position.set(0.55, 0.02, 0); b.rotation.set(0.15, -0.55, 0);
        g.add(a, b);
        g.scale.setScalar(0.9);
        return g;
      }

      const builders = { engine: partEngine, turbo: partTurbo };
      const items = [];
      function whenGLTF(cb) { THREE.GLTFLoader ? cb() : setTimeout(() => whenGLTF(cb), 120); }
      document.querySelectorAll('.comp-3d').forEach(cv => {
        const rend = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true, powerPreference: 'high-performance' });
        rend.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
        const sc = new THREE.Scene();
        const cam = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
        cam.position.set(0, 0.55, 3.1);
        cam.lookAt(0, 0, 0);
        const holder = new THREE.Group();
        holder.rotation.x = 0.25;
        sc.add(holder);
        /* Os três cards usam modelos 3D reais embutidos;
           as versões procedurais ficam como reserva em caso de falha */
        const SRC = {
          wheel: window.__WHEEL_SRC,
          engine: window.__ENGINE_SRC,
          turbo: window.__TURBO_SRC
        };
        const partSrc = SRC[cv.dataset.part];
        if (partSrc) {
          whenGLTF(() => {
            new THREE.GLTFLoader().load(partSrc, (gltf) => {
              gltf.scene.traverse(n => {
                if (n.isMesh && n.geometry) {
                  holder.add(new THREE.Mesh(n.geometry, wm(0.14)));
                  holder.add(new THREE.LineSegments(new THREE.EdgesGeometry(n.geometry, 22), lm(0.65)));
                }
              });
            }, undefined, () => {
              if (builders[cv.dataset.part]) holder.add(builders[cv.dataset.part]());
            });
          });
        } else if (builders[cv.dataset.part]) {
          holder.add(builders[cv.dataset.part]());
        }
        function rs() {
          const w = cv.clientWidth || 300, h = cv.clientHeight || 230;
          rend.setSize(w, h, false);
          cam.aspect = w / h;
          cam.updateProjectionMatrix();
        }
        rs();
        window.addEventListener('resize', rs, { passive: true });
        const item = { rend, sc, cam, obj: holder, visible: false };
        const vis = new IntersectionObserver(entries => {
          entries.forEach(e => { item.visible = e.isIntersecting; });
        }, { rootMargin: '80px' });
        vis.observe(cv);
        items.push(item);
      });
      function loop() {
        requestAnimationFrame(loop);
        items.forEach(it => {
          if (!it.visible) return;
          it.obj.rotation.y += 0.012;
          it.rend.render(it.sc, it.cam);
        });
      }
      if (items.length) loop();
    }
  })();

