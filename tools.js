/* NASSA GARAGE — ferramentas
   Monta as calculadoras dentro de qualquer elemento com [data-tools].
   Usado pela home e pela página flowcalc.html (tela cheia). */

'use strict';

(function () {
  const host = document.querySelector('[data-tools]');
  if (!host) return;
  const CAR = (window.NASSA && window.NASSA.carro) || {};
  const $ = id => document.getElementById(id);
  const nf = (v, d) => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const num = el => parseFloat(String(el.value).replace(',', '.'));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const TABS = [
    { id: 'injetores', label: 'Injetores' },
    { id: 'pneus', label: 'Pneus e marchas' },
    { id: 'conversor', label: 'Conversor' },
    { id: 'datalog', label: 'Datalog' }
  ];

  const seg = (name, opts, checked) => `<div class="fc-seg">${opts.map(([v, l]) =>
    `<input type="radio" name="${name}" id="${name}-${v}" value="${v}"${v === checked ? ' checked' : ''}><label for="${name}-${v}">${l}</label>`).join('')}</div>`;
  const field = (id, label, value, attrs) =>
    `<div class="fc-field"><label class="t mono" for="${id}">${label}</label><input type="number" id="${id}" value="${value}" ${attrs || ''}></div>`;

  host.innerHTML = `
    <div class="tl-tabs" role="tablist" aria-label="Ferramentas">
      ${TABS.map((t, i) => `<button type="button" role="tab" class="tl-tab" id="tl-tab-${t.id}" aria-controls="tl-p-${t.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${t.label}</button>`).join('')}
    </div>

    <!-- INJETORES -->
    <div class="tl-panel" role="tabpanel" id="tl-p-injetores" aria-labelledby="tl-tab-injetores" tabindex="0">
      <div class="tl-copy">
        <h3>Nassa FlowCalc</h3>
        <p>Calcule a vazão de bico necessária para a potência que você quer, ou a potência que os seus injetores conseguem alimentar.</p>
        <div class="formula mono" aria-label="Fórmula usada">
          <span class="f-l">lb/h por bico</span><span class="f-eq">=</span>
          <span class="f-frac"><span>cv × BSFC</span><span>bicos × duty</span></span>
        </div>
        <ul class="tool-notes">
          <li><b>BSFC</b> típicos em lb/cv·h: gasolina 0,50 aspirado e 0,60 turbo, álcool 0,75 e 0,90, metanol 1,10 e 1,30.</li>
          <li>1 lb/h equivale a cerca de 10,5 cc/min de gasolina.</li>
          <li>É uma estimativa para dimensionamento. Valide o acerto com equipamento adequado.</li>
        </ul>
      </div>
      <div class="fc-card">
        <div class="fc-field"><span class="t mono">O que calcular</span>${seg('tl-inj-mode', [['inj', 'Vazão necessária'], ['pot', 'Potência suportada']], 'inj')}</div>
        <div id="tl-f-cv">${field('tl-cv', 'Potência desejada (cv)', CAR.potenciaCv || 420, 'min="1" inputmode="decimal"')}</div>
        <div id="tl-f-flow" hidden>${field('tl-flow', 'Vazão de cada bico (lb/h)', 80, 'min="1" inputmode="decimal"')}</div>
        ${field('tl-inj-n', 'Número de bicos', 6, 'min="1" max="16" inputmode="numeric"')}
        <div class="fc-field"><span class="t mono">Motor</span>${seg('tl-motor', [['asp', 'Aspirado'], ['turbo', 'Turbo']], 'turbo')}</div>
        <div class="fc-field"><span class="t mono">Combustível</span>${seg('tl-fuel', [['gasolina', 'Gasolina'], ['alcool', 'Álcool'], ['metanol', 'Metanol']], 'gasolina')}</div>
        <div class="fc-field"><span class="t mono">Capacidade usada do bico</span>${seg('tl-duty', [['0.80', '80%'], ['0.90', '90%'], ['1.00', '100%']], '0.80')}</div>
        <div class="fc-result" aria-live="polite">
          <h4 class="mono" id="tl-inj-title">Vazão necessária por bico</h4>
          <div class="fc-rgrid" id="tl-inj-out"></div>
          <p class="fc-err" id="tl-inj-err" hidden></p>
        </div>
      </div>
    </div>

    <!-- PNEUS E MARCHAS -->
    <div class="tl-panel" role="tabpanel" id="tl-p-pneus" aria-labelledby="tl-tab-pneus" tabindex="0" hidden>
      <div class="tl-copy">
        <h3>Pneus e marchas</h3>
        <p>Veja a velocidade de cada marcha no corte de giro e quanto o motor gira a 100 km/h. Troque o pneu ou o diferencial e compare.</p>
        <div class="formula mono" aria-label="Fórmula usada">
          <span class="f-l">km/h</span><span class="f-eq">=</span>
          <span class="f-frac"><span>rpm × perímetro × 0,06</span><span>marcha × diferencial</span></span>
        </div>
        <ul class="tool-notes">
          <li>As relações iniciais são de referência para o 335i. Confira as do seu câmbio antes de usar.</li>
          <li>Perímetro calculado pela medida nominal do pneu, sem considerar deformação em carga.</li>
        </ul>
      </div>
      <div class="fc-card">
        <div class="fc-field">
          <label class="t mono" for="tl-preset">Câmbio de referência</label>
          <select id="tl-preset" class="tl-select">
            <option value="man">335i manual · 6 marchas</option>
            <option value="auto">335i automático · 6 marchas</option>
            <option value="custom">Personalizado</option>
          </select>
        </div>
        <div class="tl-row3">
          ${field('tl-tw', 'Largura (mm)', 255, 'min="100" max="400" step="5" inputmode="numeric"')}
          ${field('tl-tp', 'Perfil (%)', 35, 'min="20" max="90" step="5" inputmode="numeric"')}
          ${field('tl-tr', 'Aro (pol)', 18, 'min="12" max="24" inputmode="numeric"')}
        </div>
        <div class="tl-row3">
          ${field('tl-fd', 'Diferencial', '3.08', 'min="1" max="6" step="0.01" inputmode="decimal"')}
          ${field('tl-rl', 'Corte (rpm)', CAR.corteRpm || 7000, 'min="1000" max="12000" step="100" inputmode="numeric"')}
          <div></div>
        </div>
        <div class="fc-field">
          <span class="t mono">Relações das marchas</span>
          <div class="tl-gears" id="tl-gears"></div>
        </div>
        <div class="fc-result" aria-live="polite">
          <h4 class="mono">Resultado</h4>
          <div class="fc-rgrid" id="tl-tire-out"></div>
          <div class="tl-table-wrap"><table class="tl-table" id="tl-gear-table"></table></div>
        </div>
      </div>
    </div>

    <!-- CONVERSOR -->
    <div class="tl-panel tl-wide" role="tabpanel" id="tl-p-conversor" aria-labelledby="tl-tab-conversor" tabindex="0" hidden>
      <div class="tl-conv" id="tl-conv"></div>
    </div>

    <!-- DATALOG -->
    <div class="tl-panel tl-wide" role="tabpanel" id="tl-p-datalog" aria-labelledby="tl-tab-datalog" tabindex="0" hidden>
      <div class="dl-bar">
        <div class="dl-file">
          <input type="file" id="dl-file" accept=".csv,.txt,text/csv">
          <label for="dl-file" class="btn ghost">Abrir CSV<i aria-hidden="true">↑</i></label>
          <span class="dl-status mono" id="dl-status">Exemplo sintético carregado</span>
        </div>
        <div class="dl-pick">
          <label class="t mono" for="dl-x">Eixo X</label>
          <select id="dl-x" class="tl-select"></select>
        </div>
      </div>
      <div class="dl-series" id="dl-series" role="group" aria-label="Séries no gráfico"></div>
      <div class="dl-chart" id="dl-drop">
        <svg id="dl-svg" role="img" aria-label="Gráfico do datalog"></svg>
        <div class="dyno-readout mono" id="dl-readout" aria-hidden="true"></div>
        <div class="dl-hint mono">Arraste um CSV para cá. Exportações do MHD, JB4, bootmod3 e similares funcionam.</div>
      </div>
      <div class="tl-table-wrap"><table class="tl-table" id="dl-stats"></table></div>
      <p class="dl-note mono">O arquivo é lido no seu navegador e não sai do seu computador.</p>
    </div>
  `;

  /* ---------- Abas com teclado (setas, Home, End) ---------- */
  const tabs = TABS.map(t => $('tl-tab-' + t.id));
  function select(i, focus) {
    tabs.forEach((b, j) => {
      const on = i === j;
      b.setAttribute('aria-selected', on);
      b.tabIndex = on ? 0 : -1;
      $('tl-p-' + TABS[j].id).hidden = !on;
    });
    if (focus) tabs[i].focus();
    if (TABS[i].id === 'datalog') dlRender();
  }
  tabs.forEach((b, i) => {
    b.addEventListener('click', () => select(i));
    b.addEventListener('keydown', e => {
      let k = null;
      if (e.key === 'ArrowRight') k = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') k = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') k = 0;
      else if (e.key === 'End') k = tabs.length - 1;
      if (k !== null) { e.preventDefault(); select(k, true); }
    });
  });
  const fromHash = () => {
    const i = TABS.findIndex(t => '#' + t.id === location.hash);
    if (i >= 0) select(i);
  };
  window.addEventListener('hashchange', fromHash);

  /* ================= INJETORES ================= */
  const BSFC = { gasolina: { asp: 0.50, turbo: 0.60 }, alcool: { asp: 0.75, turbo: 0.90 }, metanol: { asp: 1.10, turbo: 1.30 } };
  const radio = name => host.querySelector(`input[name="${name}"]:checked`).value;
  function injCalc() {
    const mode = radio('tl-inj-mode');
    $('tl-f-cv').hidden = mode !== 'inj';
    $('tl-f-flow').hidden = mode !== 'pot';
    $('tl-inj-title').textContent = mode === 'inj' ? 'Vazão necessária por bico' : 'Potência que os bicos suportam';
    const n = num($('tl-inj-n'));
    const bsfc = BSFC[radio('tl-fuel')][radio('tl-motor')];
    const duty = parseFloat(radio('tl-duty'));
    const err = $('tl-inj-err'), out = $('tl-inj-out');
    const fail = msg => { err.textContent = msg; err.hidden = false; out.innerHTML = ''; };
    if (!(n >= 1 && n <= 16)) return fail('Informe de 1 a 16 bicos.');
    if (mode === 'inj') {
      const cv = num($('tl-cv'));
      if (!(cv > 0)) return fail('Informe a potência desejada em cv, maior que zero.');
      const lbh = cv * bsfc / (n * duty);
      out.innerHTML = `<div class="fc-rbox"><b>${nf(lbh, 1)}</b><i class="mono">lb/h</i></div><div class="fc-rbox"><b>${nf(lbh * 10.5, 0)}</b><i class="mono">cc/min</i></div>`;
    } else {
      const flow = num($('tl-flow'));
      if (!(flow > 0)) return fail('Informe a vazão de cada bico em lb/h, maior que zero.');
      out.innerHTML = `<div class="fc-rbox"><b>${nf(flow * n * duty / bsfc, 0)}</b><i class="mono">cv</i></div>`;
    }
    err.hidden = true;
  }
  $('tl-p-injetores').addEventListener('input', injCalc);
  $('tl-p-injetores').addEventListener('change', injCalc);
  injCalc();

  /* ================= PNEUS E MARCHAS ================= */
  const PRESETS = {
    man: { gears: [4.055, 2.396, 1.582, 1.192, 1.000, 0.872], fd: 3.08 },
    auto: { gears: [4.171, 2.340, 1.521, 1.143, 0.867, 0.691], fd: 3.08 }
  };
  const gearsBox = $('tl-gears');
  gearsBox.innerHTML = PRESETS.man.gears.map((g, i) =>
    `<label class="tl-gear"><span class="mono">${i + 1}ª</span><input type="number" id="tl-g${i}" value="${g}" step="0.001" min="0.3" max="8" inputmode="decimal" aria-label="Relação da ${i + 1}ª marcha"></label>`).join('');
  function applyPreset() {
    const p = PRESETS[$('tl-preset').value];
    if (!p) return;
    p.gears.forEach((g, i) => { $('tl-g' + i).value = g; });
    $('tl-fd').value = p.fd;
    tireCalc();
  }
  function tireCalc() {
    const w = num($('tl-tw')), p = num($('tl-tp')), r = num($('tl-tr'));
    const fd = num($('tl-fd')), rl = num($('tl-rl'));
    const out = $('tl-tire-out'), table = $('tl-gear-table');
    if (!(w > 0 && p > 0 && r > 0 && fd > 0 && rl > 0)) {
      out.innerHTML = '<p class="fc-err">Preencha pneu, diferencial e corte com valores maiores que zero.</p>';
      table.innerHTML = '';
      return;
    }
    const dia = r * 25.4 + 2 * w * p / 100;            // mm
    const per = Math.PI * dia / 1000;                  // m
    const gears = [0, 1, 2, 3, 4, 5].map(i => num($('tl-g' + i))).filter(g => g > 0);
    const kmh = (rpm, g) => rpm / (g * fd) * per * 0.06;
    const top = gears[gears.length - 1];
    out.innerHTML = `
      <div class="fc-rbox"><b>${nf(dia, 0)}</b><i class="mono">mm de diâmetro</i></div>
      <div class="fc-rbox"><b>${nf(kmh(1000, top), 1)}</b><i class="mono">km/h a cada 1.000 rpm na última</i></div>`;
    table.innerHTML = `<thead><tr><th scope="col">Marcha</th><th scope="col">Relação</th><th scope="col">No corte</th><th scope="col">rpm a 100 km/h</th></tr></thead><tbody>${
      gears.map((g, i) => {
        const rpm100 = 100 / kmh(1, g);
        return `<tr><th scope="row">${i + 1}ª</th><td>${nf(g, 3)}</td><td>${nf(kmh(rl, g), 0)} km/h</td><td>${rpm100 > rl ? '<span class="dim">acima do corte</span>' : nf(Math.round(rpm100 / 10) * 10, 0)}</td></tr>`;
      }).join('')}</tbody>`;
  }
  $('tl-preset').addEventListener('change', applyPreset);
  $('tl-p-pneus').addEventListener('input', e => {
    if (/^tl-(g\d|fd)$/.test(e.target.id)) $('tl-preset').value = 'custom';
    tireCalc();
  });
  tireCalc();

  /* ================= CONVERSOR ================= */
  const GROUPS = [
    { id: 'pot', title: 'Potência', units: [['cv', 0.73549875], ['kW', 1], ['hp', 0.7456999]], start: CAR.potenciaCv || 420 },
    { id: 'tq', title: 'Torque', units: [['Nm', 1], ['kgfm', 9.80665], ['lb·ft', 1.3558179]], start: CAR.torqueNm || 560 },
    { id: 'pr', title: 'Pressão', units: [['bar', 100], ['psi', 6.8947573], ['kPa', 1]], start: CAR.boostBar || 1.2 },
    { id: 'fl', title: 'Vazão de bico', units: [['lb/h', 10.5], ['cc/min', 1]], start: 52.5, note: 'Gasolina, 1 lb/h ≈ 10,5 cc/min' }
  ];
  const trim = v => {
    const d = Math.abs(v) >= 100 ? 1 : Math.abs(v) >= 10 ? 2 : 3;
    return String(parseFloat(v.toFixed(d)));
  };
  $('tl-conv').innerHTML = GROUPS.map(g => `
    <div class="tl-conv-card">
      <h3>${g.title}</h3>
      ${g.units.map(([u], i) => `<div class="fc-field tl-unit"><input type="number" id="tl-c-${g.id}-${i}" inputmode="decimal" step="any" aria-label="${g.title} em ${u}"><span class="mono">${u}</span></div>`).join('')}
      ${g.note ? `<p class="tl-conv-note mono">${g.note}</p>` : ''}
    </div>`).join('');
  GROUPS.forEach(g => {
    const inputs = g.units.map((_, i) => $(`tl-c-${g.id}-${i}`));
    const setFrom = (src, val) => {
      const base = val * g.units[src][1];
      inputs.forEach((inp, i) => { if (i !== src) inp.value = isFinite(base) ? trim(base / g.units[i][1]) : ''; });
    };
    inputs.forEach((inp, i) => inp.addEventListener('input', () => {
      const v = num(inp);
      if (isFinite(v)) setFrom(i, v); else inputs.forEach((o, j) => { if (j !== i) o.value = ''; });
    }));
    inputs[0].value = g.start;
    setFrom(0, g.start);
  });

  /* ================= DATALOG ================= */
  const COLORS = ['var(--blue-2)', 'var(--text)', 'var(--amber)'];
  let LOG = null;            // { cols: [nomes], data: [[...col0], [...col1]] }
  let xCol = 0, ySel = [];

  function sampleLog() {
    /* puxada sintética em 3ª marcha, só para demonstrar a ferramenta */
    const rows = [];
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 - 0.5; };
    for (let t = 0; t <= 6.5; t += 0.05) {
      const rpm = 2500 + 4500 * Math.min(1, Math.pow(t / 6.5, 0.85));
      const spool = Math.min(1, Math.max(0, (rpm - 2500) / 1100));
      const boost = Math.max(0, 1.2 * spool - Math.max(0, (rpm - 5200) / 1800) * 0.22 + rnd() * 0.03);
      const afr = 12.1 - spool * 0.4 + rnd() * 0.12;
      const adv = 3 + (rpm - 2500) / 600 + rnd() * 0.4;
      rows.push([t.toFixed(2), Math.round(rpm), boost.toFixed(2), afr.toFixed(2), adv.toFixed(1)]);
    }
    return { cols: ['Tempo (s)', 'RPM', 'Boost (bar)', 'AFR', 'Avanço (°)'], rows };
  }

  function parseCSV(text) {
    const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim());
    if (lines.length < 3) throw new Error('O arquivo tem poucas linhas.');
    const probe = lines.slice(0, 20).join('\n');
    const delim = [';', '\t', ','].map(d => [d, probe.split(d).length]).sort((a, b) => b[1] - a[1])[0][0];
    const split = l => l.split(delim).map(s => s.trim().replace(/^"|"$/g, ''));
    const toNum = s => {
      if (s === '') return NaN;
      const v = Number(delim === ',' ? s : s.replace(',', '.'));
      return v;
    };
    const rows = lines.map(split);
    /* cabeçalho = última linha antes do primeiro bloco numérico */
    let start = rows.findIndex((r, i) => i > 0 && r.length > 1 && r.filter(c => isFinite(toNum(c))).length >= r.length * 0.6);
    if (start < 1) throw new Error('Não encontrei colunas numéricas.');
    const header = rows[start - 1];
    const data = rows.slice(start).filter(r => r.length >= header.length * 0.6);
    const cols = [], series = [];
    header.forEach((name, j) => {
      const vals = data.map(r => toNum(r[j] || ''));
      if (vals.filter(isFinite).length >= vals.length * 0.8) {
        cols.push(name || 'Coluna ' + (j + 1));
        series.push(vals);
      }
    });
    if (cols.length < 2) throw new Error('São precisas pelo menos duas colunas numéricas.');
    return { cols, data: series };
  }

  function setLog(log, status) {
    LOG = log;
    const find = re => LOG.cols.findIndex(c => re.test(c));
    xCol = Math.max(0, find(/tempo|time|seg|sec/i));
    const prefs = [/rpm/i, /boost|press|map/i, /afr|lambda/i];
    ySel = [];
    prefs.forEach(re => { const i = find(re); if (i >= 0 && i !== xCol && ySel.length < 3 && !ySel.includes(i)) ySel.push(i); });
    for (let i = 0; ySel.length < 2 && i < LOG.cols.length; i++) if (i !== xCol && !ySel.includes(i)) ySel.push(i);
    $('dl-status').textContent = status;
    $('dl-x').innerHTML = LOG.cols.map((c, i) => `<option value="${i}"${i === xCol ? ' selected' : ''}>${esc(c)}</option>`).join('');
    renderSeries();
    dlRender();
  }
  function renderSeries() {
    $('dl-series').innerHTML = LOG.cols.map((c, i) => i === xCol ? '' : `
      <label class="dl-chip${ySel.includes(i) ? ' on' : ''}" style="--c:${ySel.includes(i) ? COLORS[ySel.indexOf(i)] : 'var(--faint)'}">
        <input type="checkbox" value="${i}"${ySel.includes(i) ? ' checked' : ''}>
        <i aria-hidden="true"></i>${esc(c)}
      </label>`).join('');
  }
  $('dl-series').addEventListener('change', e => {
    const i = +e.target.value;
    if (e.target.checked) { if (ySel.length >= 3) ySel.shift(); ySel.push(i); }
    else ySel = ySel.filter(v => v !== i);
    renderSeries(); dlRender();
  });
  $('dl-x').addEventListener('change', e => {
    xCol = +e.target.value;
    ySel = ySel.filter(v => v !== xCol);
    renderSeries(); dlRender();
  });

  function readFile(file) {
    if (!file) return;
    if (file.size > 25e6) { $('dl-status').textContent = 'Arquivo grande demais. O limite é 25 MB.'; return; }
    const fr = new FileReader();
    fr.onload = () => {
      try { setLog(parseCSV(fr.result), file.name); }
      catch (err) { $('dl-status').textContent = 'Não consegui ler o arquivo. ' + err.message; }
    };
    fr.readAsText(file);
  }
  $('dl-file').addEventListener('change', e => readFile(e.target.files[0]));
  const drop = $('dl-drop');
  ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('drag'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('drag'); }));
  drop.addEventListener('drop', e => readFile(e.dataTransfer.files[0]));

  const NS = 'http://www.w3.org/2000/svg';
  let dlGeom = null;
  function ticks(min, max, count) {
    const span = max - min || 1;
    const step0 = span / count, mag = Math.pow(10, Math.floor(Math.log10(step0)));
    const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= step0);
    const out = [];
    for (let v = Math.floor(min / step) * step; v <= Math.ceil(max / step) * step + 1e-9; v += step) out.push(+v.toFixed(10));
    return out;
  }
  const short = v => Math.abs(v) >= 1000 ? nf(v, 0) : Math.abs(v) >= 10 ? nf(v, Math.abs(v % 1) > 1e-9 ? 1 : 0) : nf(v, Math.abs(v * 10 % 1) > 1e-9 ? 2 : 1);

  function dlRender() {
    const svg = $('dl-svg');
    if (!LOG || $('tl-p-datalog').hidden) return;
    const W = Math.max(svg.clientWidth, 300), H = Math.max(svg.clientHeight, 220);
    const PL = 48, PR = 48, PT = 14, PB = 28;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const el = (tag, a) => { const n = document.createElementNS(NS, tag); for (const k in a) n.setAttribute(k, a[k]); svg.appendChild(n); return n; };

    const X = LOG.data[xCol];
    const idx = X.map((_, i) => i).filter(i => isFinite(X[i]));
    const xs = idx.map(i => X[i]);
    const xmin = Math.min(...xs), xmax = Math.max(...xs);
    const sx = v => PL + (v - xmin) / ((xmax - xmin) || 1) * (W - PL - PR);
    const step = Math.max(1, Math.floor(idx.length / 1500));

    const scales = ySel.map(c => {
      const vals = idx.map(i => LOG.data[c][i]).filter(isFinite);
      let mn = Math.min(...vals), mx = Math.max(...vals);
      if (mn === mx) { mn -= 1; mx += 1; }
      const t = ticks(mn, mx, 4);
      mn = t[0]; mx = t[t.length - 1];
      return { c, mn, mx, t, vals, sy: v => PT + (1 - (v - mn) / (mx - mn)) * (H - PT - PB) };
    });

    const xt = ticks(xmin, xmax, Math.max(3, Math.floor((W - PL - PR) / 110))).filter(v => v >= xmin - 1e-9 && v <= xmax + 1e-9);
    xt.forEach(v => {
      el('line', { class: 'grid', x1: sx(v), x2: sx(v), y1: PT, y2: H - PB });
      el('text', { class: 'axis', x: sx(v), y: H - 8, 'text-anchor': 'middle' }).textContent = short(v);
    });
    if (scales[0]) scales[0].t.forEach(v => {
      el('line', { class: 'grid', x1: PL, x2: W - PR, y1: scales[0].sy(v), y2: scales[0].sy(v) });
      el('text', { class: 'axis', x: PL - 6, y: scales[0].sy(v) + 3, 'text-anchor': 'end', fill: COLORS[0] }).textContent = short(v);
    });
    if (scales[1]) scales[1].t.forEach(v => {
      el('text', { class: 'axis', x: W - PR + 6, y: scales[1].sy(v) + 3, 'text-anchor': 'start', fill: COLORS[1] }).textContent = short(v);
    });
    scales.forEach((s, k) => {
      let d = '';
      for (let j = 0; j < idx.length; j += step) {
        const v = LOG.data[s.c][idx[j]];
        if (!isFinite(v)) continue;
        d += (d ? 'L' : 'M') + sx(X[idx[j]]).toFixed(1) + ',' + s.sy(v).toFixed(1);
      }
      el('path', { d, fill: 'none', stroke: COLORS[k], 'stroke-width': 1.8, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
    });
    const cross = el('line', { class: 'cross', x1: 0, x2: 0, y1: PT, y2: H - PB });
    const dots = scales.map((_, k) => el('circle', { class: 'dot', r: 3.5, fill: 'var(--bg)', stroke: COLORS[k], 'stroke-width': 2 }));
    dlGeom = { svg, W, PL, PR, xmin, xmax, X, idx, scales, cross, dots, sx };

    $('dl-stats').innerHTML = scales.length ? `<thead><tr><th scope="col">Série</th><th scope="col">Mínimo</th><th scope="col">Máximo</th><th scope="col">Média</th></tr></thead><tbody>${
      scales.map((s, k) => {
        const avg = s.vals.reduce((a, b) => a + b, 0) / s.vals.length;
        return `<tr><th scope="row"><i class="dl-sw" style="background:${COLORS[k]}"></i>${esc(LOG.cols[s.c])}</th><td>${short(Math.min(...s.vals))}</td><td>${short(Math.max(...s.vals))}</td><td>${short(avg)}</td></tr>`;
      }).join('')}</tbody>` : '';
  }
  $('dl-svg').addEventListener('pointermove', e => {
    if (!dlGeom || !dlGeom.scales.length) return;
    const g = dlGeom, rect = g.svg.getBoundingClientRect();
    const t = Math.min(Math.max((e.clientX - rect.left - g.PL) / (g.W - g.PL - g.PR), 0), 1);
    const target = g.xmin + t * (g.xmax - g.xmin);
    let best = g.idx[0];
    for (const i of g.idx) if (Math.abs(g.X[i] - target) < Math.abs(g.X[best] - target)) best = i;
    const xx = g.sx(g.X[best]);
    g.cross.setAttribute('x1', xx); g.cross.setAttribute('x2', xx);
    g.scales.forEach((s, k) => {
      const v = LOG.data[s.c][best];
      g.dots[k].setAttribute('cx', xx); g.dots[k].setAttribute('cy', isFinite(v) ? s.sy(v) : -10);
    });
    $('dl-readout').innerHTML = `<b>${esc(LOG.cols[xCol])} ${short(g.X[best])}</b>` +
      g.scales.map((s, k) => `<span style="color:${COLORS[k]}">${short(LOG.data[s.c][best])} ${esc(LOG.cols[s.c].replace(/\s*\(.*\)/, ''))}</span>`).join('');
    drop.classList.add('hover');
  }, { passive: true });
  $('dl-svg').addEventListener('pointerleave', () => drop.classList.remove('hover'));
  let dlt;
  window.addEventListener('resize', () => { clearTimeout(dlt); dlt = setTimeout(dlRender, 120); }, { passive: true });

  const s = sampleLog();
  setLog({ cols: s.cols, data: s.cols.map((_, j) => s.rows.map(r => +r[j])) }, 'Exemplo sintético. Abra o seu CSV para ver o seu log.');

  fromHash();
})();
