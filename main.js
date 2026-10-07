/* NASSA GARAGE — scripts principais
   O 3D fica em three-scene.js e só é baixado perto da seção Blueprint. */

'use strict';

(function () {
  window.__ngReady = true;
  const root = document.documentElement;
  const DATA = window.NASSA || {};
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const easeOutCubic = p => 1 - Math.pow(1 - p, 3);
  const fmtNum = (v, dec, locale) => {
    if (locale || dec) return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 });
    return String(v);
  };
  const get = path => path.split('.').reduce((o, k) => (o == null ? o : o[k]), DATA);

  /* ---------- Dados: preenche tudo que tem data-k a partir de data.js ---------- */
  document.querySelectorAll('[data-k]').forEach(el => {
    const v = get(el.dataset.k);
    if (v == null) return;
    if (el.classList.contains('gauge-card')) { el.dataset.value = v; return; }
    const dec = parseInt(el.dataset.dec || '0', 10);
    const locale = el.dataset.locale === '1';
    if (el.classList.contains('cnt')) el.dataset.to = v;
    el.textContent = (typeof v === 'number' ? fmtNum(v, dec, locale) : v) + (el.dataset.suffix || '');
  });

  /* ---------- Preloader: só na primeira visita da sessão ---------- */
  (function () {
    const loader = document.getElementById('loader');
    const fill = document.getElementById('l-fill');
    const pct = document.getElementById('l-pct');
    const markSeen = () => { try { sessionStorage.setItem('ng-seen', '1'); } catch (e) {} };
    if (!loader || root.classList.contains('seen')) {
      document.body.classList.add('loaded');
      markSeen();
      return;
    }
    const MIN_MS = 900;
    const t0 = performance.now();
    let target = 0, shown = 0, finished = false;
    const ready = { fonts: false, load: false };

    function paint() {
      shown += (target - shown) * 0.2;
      const v = Math.round(shown);
      fill.style.width = v + '%';
      pct.textContent = String(v).padStart(2, '0');
      if (!finished || v < 100) requestAnimationFrame(paint);
    }
    function bump() {
      const done = (ready.fonts ? 1 : 0) + (ready.load ? 1 : 0);
      const elapsed = Math.min((performance.now() - t0) / MIN_MS, 1);
      target = Math.max(target, Math.round(Math.min(92, 30 * done + 32 * elapsed)));
      if (ready.fonts && ready.load && elapsed >= 1) finish();
    }
    function finish() {
      if (finished) return;
      finished = true;
      target = 100;
      markSeen();
      setTimeout(() => {
        loader.classList.add('done');
        document.body.classList.add('loaded');
      }, 320);
    }
    requestAnimationFrame(paint);
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => { ready.fonts = true; bump(); });
    if (document.readyState === 'complete') ready.load = true;
    else window.addEventListener('load', () => { ready.load = true; bump(); });
    const tick = setInterval(() => { bump(); if (finished) clearInterval(tick); }, 120);
    setTimeout(() => { ready.fonts = ready.load = true; finish(); }, 3500); // rede lenta: segue mesmo assim
  })();

  /* ---------- Nav: fundo sólido ao rolar, esconde ao descer ---------- */
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

  /* ---------- Menu mobile com foco preso dentro dele ---------- */
  const hamb = document.getElementById('hamb');
  const menu = document.getElementById('navLinks');
  const outside = [...document.body.children].filter(el => el !== nav && el.tagName !== 'SCRIPT');
  function setMenu(open) {
    const was = document.body.classList.contains('menu-open');
    document.body.classList.toggle('menu-open', open);
    hamb.setAttribute('aria-expanded', String(open));
    hamb.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    outside.forEach(el => { if (open) el.setAttribute('inert', ''); else el.removeAttribute('inert'); });
    if (open) {
      const first = menu.querySelector('a');
      if (first) setTimeout(() => first.focus(), 60);
    } else if (was) {
      hamb.focus();
    }
  }
  hamb.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    if (document.body.classList.contains('menu-open')) {
      document.body.classList.remove('menu-open');
      hamb.setAttribute('aria-expanded', 'false');
      hamb.setAttribute('aria-label', 'Abrir menu');
      outside.forEach(el => el.removeAttribute('inert'));
    }
  }));
  document.addEventListener('keydown', e => {
    if (!document.body.classList.contains('menu-open')) return;
    if (e.key === 'Escape') { setMenu(false); return; }
    if (e.key !== 'Tab') return;
    const items = [hamb, ...menu.querySelectorAll('a')];
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  window.matchMedia('(min-width: 901px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

  /* ---------- Link ativo conforme a seção visível ---------- */
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  const sections = [...navLinks].map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const secObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(s => secObs.observe(s));

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } });
  }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* ---------- Contadores ---------- */
  function runCounter(el) {
    const to = parseFloat(el.dataset.to || el.textContent.replace(/\D/g, ''));
    if (!isFinite(to)) return;
    const suffix = el.dataset.suffix || '';
    const locale = el.dataset.locale === '1';
    if (reduced) return;
    const dur = 1600, start = performance.now();
    (function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = fmtNum(Math.round(to * easeOutCubic(p)), 0, locale) + (p === 1 ? suffix : '');
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }
  const cio = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { runCounter(e.target); cio.unobserve(e.target); } });
  }, { threshold: .6 });
  document.querySelectorAll('.cnt').forEach(el => cio.observe(el));

  /* ---------- Relógios ---------- */
  const SWEEP = 329.9; // 270° do círculo r=70 (circunferência 439.8)
  function animateGauge(card) {
    const value = parseFloat(card.dataset.value);
    const max = parseFloat(card.dataset.max);
    const redline = card.dataset.redline ? parseFloat(card.dataset.redline) : null;
    const decimals = parseInt(card.dataset.decimals || '0', 10);
    const useLocale = card.dataset.locale === '1';
    const pctV = Math.min(value / max, 1);
    const fill = card.querySelector('.fill');
    const needle = card.querySelector('.needle');
    const val = card.querySelector('.val');
    const show = v => { val.textContent = fmtNum(v, decimals, useLocale || decimals > 0); };
    const finalPose = () => {
      fill.style.strokeDasharray = (SWEEP * pctV) + ' 439.8';
      needle.style.transform = 'translate(-50%, -100%) rotate(' + (-135 + 270 * pctV) + 'deg)';
    };
    if (reduced) {
      fill.style.transition = needle.style.transition = 'none';
      finalPose(); show(value);
      card.classList.toggle('redline', redline !== null && value >= redline);
      return;
    }
    fill.style.transition = 'stroke-dasharray 1.8s cubic-bezier(.22,.7,.3,1)';
    requestAnimationFrame(finalPose);
    const dur = 1800, start = performance.now();
    (function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const current = value * easeOutCubic(p);
      show(decimals ? current : Math.round(current));
      /* como no painel: só o conta-giros acende vermelho, e só na faixa de corte */
      card.classList.toggle('redline', redline !== null && current >= redline - 1e-6);
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }
  const gio = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { animateGauge(e.target); gio.unobserve(e.target); } });
  }, { threshold: .4 });
  document.querySelectorAll('.gauge-card').forEach(el => gio.observe(el));

  /* ---------- Curva de dinamômetro (SVG responsivo, dados de data.js) ---------- */
  (function () {
    const svg = document.getElementById('dyno-svg');
    const box = document.getElementById('dyno');
    if (!svg || !box) return;
    const dyno = DATA.dyno || {};
    const TQ = (dyno.pontos || []).slice().sort((a, b) => a[0] - b[0]);
    if (TQ.length < 2) { box.hidden = true; return; }
    const NS = 'http://www.w3.org/2000/svg';
    const RPM0 = TQ[0][0], RPM1 = TQ[TQ.length - 1][0];
    const tq = r => {
      for (let i = 0; i < TQ.length - 1; i++) {
        const [r0, t0] = TQ[i], [r1, t1] = TQ[i + 1];
        if (r >= r0 && r <= r1) {
          const p = (r - r0) / (r1 - r0);
          return t0 + (t1 - t0) * p * p * (3 - 2 * p);
        }
      }
      return TQ[TQ.length - 1][1];
    };
    const cv = r => tq(r) * r / 7127; // cv = Nm × rpm ÷ 7127

    /* rótulos calculados a partir da própria curva */
    let pk = { r: RPM0, v: 0 }, tk = { r: RPM0, v: 0 };
    for (let r = RPM0; r <= RPM1; r += 50) {
      if (cv(r) > pk.v) pk = { r, v: cv(r) };
      if (tq(r) > tk.v + 0.5) tk = { r, v: tq(r) };
    }
    const n = v => Math.round(v).toLocaleString('pt-BR');
    document.getElementById('dyno-peak-p').textContent = n(pk.v) + ' cv @ ' + n(pk.r) + ' rpm';
    document.getElementById('dyno-peak-t').textContent = n(tk.v) + ' Nm @ ' + n(tk.r) + ' rpm';
    if (dyno.fonte === 'banco') {
      document.getElementById('dyno-src').textContent = 'Puxada no dinamômetro';
      document.getElementById('dyno-note').textContent = 'Curva medida em banco de rolo.';
    }

    const niceMax = v => { const step = v > 300 ? 150 : 50; return Math.ceil(v / step) * step; };
    const PMAX = niceMax(pk.v * 1.05), TMAX = niceMax(tk.v * 1.05);
    const rdRpm = document.getElementById('dr-rpm'), rdP = document.getElementById('dr-p'), rdT = document.getElementById('dr-t');
    let drawn = false, geom = null;

    function render() {
      const W = Math.max(svg.clientWidth, 300), H = Math.max(svg.clientHeight, 200);
      const PL = W < 560 ? 34 : 44, PR = PL, PT = 18, PB = 30;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      const x = r => PL + (r - RPM0) / (RPM1 - RPM0) * (W - PL - PR);
      const yp = v => PT + (1 - v / PMAX) * (H - PT - PB);
      const yt = v => PT + (1 - v / TMAX) * (H - PT - PB);
      const el = (tag, attrs, parent) => {
        const node = document.createElementNS(NS, tag);
        for (const k in attrs) node.setAttribute(k, attrs[k]);
        (parent || svg).appendChild(node);
        return node;
      };
      const defs = el('defs', {});
      const grad = el('linearGradient', { id: 'dyno-fill', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      el('stop', { offset: '0%', 'stop-color': '#4A86D8', 'stop-opacity': .28 }, grad);
      el('stop', { offset: '100%', 'stop-color': '#4A86D8', 'stop-opacity': 0 }, grad);

      for (let r = Math.ceil(RPM0 / 1000) * 1000; r <= RPM1; r += 1000) {
        el('line', { class: 'grid', x1: x(r), x2: x(r), y1: PT, y2: H - PB });
        const t = el('text', { class: 'axis', x: x(r), y: H - 8, 'text-anchor': r === RPM0 ? 'start' : r === RPM1 ? 'end' : 'middle' });
        t.textContent = (r / 1000) + 'k';
      }
      const STEPS = 3;
      for (let i = 0; i <= STEPS; i++) {
        const vp = PMAX * i / STEPS, vt = TMAX * i / STEPS;
        el('line', { class: 'grid', x1: PL, x2: W - PR, y1: yp(vp), y2: yp(vp) });
        el('text', { class: 'axis', x: PL - 6, y: yp(vp) + 3, 'text-anchor': 'end' }).textContent = Math.round(vp);
        el('text', { class: 'axis', x: W - PR + 6, y: yt(vt) + 3, 'text-anchor': 'start' }).textContent = Math.round(vt);
      }

      let dP = '', dT = '';
      for (let r = RPM0; r <= RPM1; r += 50) {
        const c = r === RPM0 ? 'M' : 'L';
        dP += `${c}${x(r).toFixed(1)},${yp(cv(r)).toFixed(1)} `;
        dT += `${c}${x(r).toFixed(1)},${yt(tq(r)).toFixed(1)} `;
      }
      const area = el('path', { class: 'area-p', d: dP + `L${x(RPM1)},${H - PB} L${x(RPM0)},${H - PB} Z`, opacity: drawn || reduced ? 1 : 0 });
      const pathT = el('path', { class: 'curve curve-t', d: dT });
      const pathP = el('path', { class: 'curve curve-p', d: dP });
      const cross = el('line', { class: 'cross', x1: 0, x2: 0, y1: PT, y2: H - PB });
      const dotP = el('circle', { class: 'dot dot-p', r: 4 });
      const dotT = el('circle', { class: 'dot dot-t', r: 4 });
      if (!drawn && !reduced) {
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
      if (reduced) return;
      [geom.pathT, geom.pathP].forEach((p, i) => {
        p.style.transition = `stroke-dashoffset 2.2s cubic-bezier(.22,.7,.3,1) ${i * .25}s`;
        requestAnimationFrame(() => { p.style.strokeDashoffset = 0; });
      });
      geom.area.style.transition = 'opacity 1.2s ease 1.4s';
      requestAnimationFrame(() => geom.area.setAttribute('opacity', 1));
    }
    function readAt(clientX) {
      if (!geom) return;
      const rect = svg.getBoundingClientRect();
      const t = Math.min(Math.max((clientX - rect.left - geom.PL) / (geom.W - geom.PL - geom.PR), 0), 1);
      const r = Math.round((RPM0 + t * (RPM1 - RPM0)) / 50) * 50;
      const xx = geom.x(r);
      geom.cross.setAttribute('x1', xx); geom.cross.setAttribute('x2', xx);
      geom.dotP.setAttribute('cx', xx); geom.dotP.setAttribute('cy', geom.yp(cv(r)));
      geom.dotT.setAttribute('cx', xx); geom.dotT.setAttribute('cy', geom.yt(tq(r)));
      rdRpm.textContent = n(r) + ' rpm';
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

  /* ---------- Diário do build e lista de peças (aparecem quando houver dados) ---------- */
  (function () {
    const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const log = Array.isArray(DATA.log) ? DATA.log.slice() : [];
    if (log.length) {
      log.sort((a, b) => String(b.data).localeCompare(String(a.data)));
      const fmtDate = d => {
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || '');
        return m ? `${m[3]}.${m[2]}.${m[1]}` : esc(d);
      };
      document.getElementById('bl-list').innerHTML = log.map(it => `
        <li class="bl-item">
          <time class="mono" datetime="${esc(it.data)}">${fmtDate(it.data)}</time>
          <div class="bl-body">
            <h4>${esc(it.titulo)}</h4>
            ${it.texto ? `<p>${esc(it.texto)}</p>` : ''}
          </div>
          ${it.antes || it.depois ? `<div class="bl-delta mono"><span>${esc(it.antes || '—')}</span><i aria-hidden="true">→</i><b>${esc(it.depois || '—')}</b></div>` : '<div></div>'}
        </li>`).join('');
      document.getElementById('buildlog').hidden = false;
    }
    const pecas = Array.isArray(DATA.pecas) ? DATA.pecas : [];
    if (pecas.length) {
      const groups = {};
      pecas.forEach(p => { (groups[p.grupo || 'Outros'] = groups[p.grupo || 'Outros'] || []).push(p); });
      document.getElementById('parts-grid').innerHTML = Object.keys(groups).map(g => `
        <div class="parts-group">
          <h4 class="mono">${esc(g)}</h4>
          <ul>${groups[g].map(p => `<li><span>${esc(p.item)}</span>${p.marca ? `<i class="mono">${esc(p.marca)}</i>` : ''}</li>`).join('')}</ul>
        </div>`).join('');
      document.getElementById('parts').hidden = false;
    }
  })();

  /* ---------- 3D sob demanda: baixa o módulo quando faltam ~2 telas ---------- */
  (function () {
    const targets = [document.getElementById('blueprint'), document.getElementById('components')].filter(Boolean);
    if (!targets.length) return;
    const loadEl = document.getElementById('wf-load');
    let started = false;
    const boot = new IntersectionObserver(entries => {
      if (started || !entries.some(e => e.isIntersecting)) return;
      started = true;
      boot.disconnect();
      if (loadEl) loadEl.textContent = 'Carregando modelo 3D';
      import('./three-scene.js?v=20261008')
        .then(m => m.boot())
        .catch(() => { if (loadEl) { loadEl.textContent = 'Não foi possível carregar o 3D neste navegador.'; loadEl.classList.add('err'); } });
    }, { rootMargin: '1800px 0px' });
    targets.forEach(t => boot.observe(t));
  })();
})();
