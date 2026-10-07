/* NASSA GARAGE — cenas 3D (Blueprint e Peças)
   Módulo carregado sob demanda por main.js. Three.js, GLTFLoader e o
   decodificador Draco ficam em vendor/, os modelos comprimidos em models/. */

import * as THREE from './vendor/three/three.module.min.js';
import { GLTFLoader } from './vendor/three/GLTFLoader.js';
import { DRACOLoader } from './vendor/three/DRACOLoader.js';

const BLUE = 0x2A61AD;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const DPR = Math.min(window.devicePixelRatio || 1, 1.5);

const draco = new DRACOLoader().setDecoderPath(new URL('./vendor/three/draco/', import.meta.url).href);
const gltfLoader = new GLTFLoader().setDRACOLoader(draco);

/* window.NG_MODEL_BASE / NG_MODEL_JSON existem só para a prévia hospedada,
   onde os modelos vão embalados em JSON. No site normal, nada disso é usado. */
function loadModel(name, onProgress) {
  const base = window.NG_MODEL_BASE != null ? window.NG_MODEL_BASE : 'models/';
  const url = new URL(base + name, document.baseURI).href;
  if (window.NG_MODEL_JSON) {
    return fetch(url + '.json').then(r => r.json()).then(j => {
      const bin = Uint8Array.from(atob(j.b64), c => c.charCodeAt(0)).buffer;
      return gltfLoader.parseAsync(bin, '');
    });
  }
  return gltfLoader.loadAsync(url, onProgress);
}

const lineMat = op => new THREE.LineBasicMaterial({ color: BLUE, transparent: true, opacity: op });
const wireMat = op => new THREE.MeshBasicMaterial({ color: BLUE, wireframe: true, transparent: true, opacity: op });
const easeOut = p => 1 - Math.pow(1 - p, 3);

const tickers = [];
function loop() {
  requestAnimationFrame(loop);
  for (const t of tickers) t();
}

export function boot() {
  try { initBlueprint(); } catch (e) { blueprintError(); }
  try { initParts(); } catch (e) { /* peças 3D são opcionais */ }
  requestAnimationFrame(loop);
}

/* ================================================================
   BLUEPRINT — o carro em 26 peças que voam e se encaixam
================================================================ */
function blueprintError() {
  const el = document.getElementById('wf-load');
  if (el) { el.textContent = 'Não foi possível carregar o modelo 3D.'; el.classList.add('err'); }
}

function initBlueprint() {
  const canvas = document.getElementById('wf-canvas');
  const section = document.getElementById('blueprint');
  if (!canvas || !section) return;
  const stage = canvas.parentElement;
  const loadEl = document.getElementById('wf-load');
  const hintEl = section.querySelector('.wf-hint');
  const degEl = document.getElementById('wf-deg');
  const stats = section.querySelectorAll('.wf-stat');

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(DPR);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  const car = new THREE.Group();
  scene.add(car);

  const grid = new THREE.GridHelper(26, 26, BLUE, BLUE);
  grid.material.transparent = true;
  grid.material.opacity = 0.07;
  scene.add(grid);

  /* enquadramento: em tela retrato a câmera recua para o carro caber */
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const dist = Math.min(17, Math.max(6.6, 2.5 / (0.3443 * camera.aspect)));
    camera.position.set(0, 1.9 * dist / 6.6, dist);
    camera.lookAt(0, 0.6, 0);
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(stage);

  /* stats em cascata quando a seção entra na tela */
  const statObs = new IntersectionObserver(entries => {
    if (!entries.some(e => e.isIntersecting)) return;
    stats.forEach((el, i) => setTimeout(() => el.classList.add('on'), reduced ? 0 : 250 + i * 320));
    statObs.disconnect();
  }, { threshold: .35 });
  statObs.observe(section);

  /* montagem */
  const pieces = [];
  let outline = null;
  let asmT = -1;            // -1 aguardando o modelo · 0 pronto · 0..1 animando · 1 montado
  let asmStart = 0;
  let inView = false;
  const ASM_DUR = 2600;

  function applyAssembly(t) {
    if (outline) outline.opacity = Math.max(0, (t - 0.75) / 0.25) * 0.8;
    for (const pc of pieces) {
      const u = pc.userData;
      const p = easeOut(Math.min(Math.max((t - u.delay) / (1 - u.delay), 0), 1));
      const k = u.dist * (1 - p);
      pc.position.set(u.target.x + u.dir.x * k, u.target.y + u.dir.y * k, u.target.z + u.dir.z * k);
      pc.rotation.set(u.rot.x * (1 - p), u.rot.y * (1 - p), u.rot.z * (1 - p));
    }
  }
  function startAssembly() {
    if (reduced) { asmT = 1; applyAssembly(1); return; }
    asmT = 0.0001;
    asmStart = performance.now();
  }
  new IntersectionObserver(es => {
    es.forEach(e => {
      inView = e.isIntersecting;
      if (inView && asmT === 0) startAssembly();
    });
  }, { threshold: .35 }).observe(section);
  stage.addEventListener('click', () => { if (asmT >= 1 && pieces.length) startAssembly(); });

  /* carregamento do modelo, com progresso */
  if (loadEl) loadEl.textContent = 'Carregando modelo 3D';
  loadModel('e90-parts.glb', ev => {
    if (loadEl && ev && ev.total) loadEl.textContent = 'Carregando modelo 3D · ' + Math.min(99, Math.round(ev.loaded / ev.total * 100)) + '%';
  }).then(gltf => {
    const model = new THREE.Group();
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse(node => {
      if (!node.isMesh || !node.geometry) return;
      const geo = node.geometry.clone();
      geo.applyMatrix4(node.matrixWorld);
      geo.computeBoundingBox();
      const c = new THREE.Vector3();
      geo.boundingBox.getCenter(c);
      geo.translate(-c.x, -c.y, -c.z);
      const piece = new THREE.Group();
      piece.add(new THREE.Mesh(geo, wireMat(0.2)));
      piece.position.copy(c);
      piece.userData = {
        target: c.clone(),
        dir: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.3, Math.random() - 0.5).normalize(),
        dist: 5 + Math.random() * 5,
        rot: new THREE.Vector3(Math.random() * 5, Math.random() * 5, Math.random() * 5),
        delay: Math.random() * 0.45
      };
      pieces.push(piece);
      model.add(piece);
    });
    if (!pieces.length) throw new Error('modelo vazio');

    const size = new THREE.Vector3();
    new THREE.Box3().setFromObject(model).getSize(size);
    if (size.z > size.x) model.rotation.y = Math.PI / 2;
    car.add(model);

    asmT = 0;
    applyAssembly(0);
    if (loadEl) loadEl.classList.add('off');
    if (hintEl) hintEl.classList.add('on');
    if (inView) startAssembly();

    /* contorno único do carro montado, sem as emendas entre peças;
       montado num respiro para não travar a animação */
    setTimeout(() => {
      try {
        const soup = [];
        for (const pc of pieces) {
          const g = pc.children[0].geometry.index ? pc.children[0].geometry.toNonIndexed() : pc.children[0].geometry;
          const arr = g.attributes.position.array, off = pc.userData.target;
          for (let i = 0; i < arr.length; i += 3) soup.push(arr[i] + off.x, arr[i + 1] + off.y, arr[i + 2] + off.z);
          if (g !== pc.children[0].geometry) g.dispose();
        }
        const merged = new THREE.BufferGeometry();
        merged.setAttribute('position', new THREE.Float32BufferAttribute(soup, 3));
        outline = lineMat(0);
        model.add(new THREE.LineSegments(new THREE.EdgesGeometry(merged, 24), outline));
        merged.dispose();
        if (asmT >= 1) outline.opacity = 0.8;
      } catch (err) { /* sem contorno, segue só a malha */ }
    }, 150);
  }).catch(blueprintError);

  /* giro contínuo + inclinação seguindo o mouse */
  let idle = 0, tiltNow = 0, tiltTarget = 0;
  stage.addEventListener('mousemove', ev => {
    const rr = stage.getBoundingClientRect();
    tiltTarget = ((ev.clientY - rr.top) / rr.height - 0.5) * 0.2;
  }, { passive: true });
  stage.addEventListener('mouseleave', () => { tiltTarget = 0; }, { passive: true });

  /* só renderiza com a seção na tela */
  let visible = false;
  new IntersectionObserver(es => es.forEach(e => { visible = e.isIntersecting; }), { rootMargin: '120px' }).observe(stage);

  tickers.push(() => {
    if (asmT === 0 && inView) startAssembly();
    if (!visible) return;
    if (!reduced) idle += 0.0042;
    car.rotation.y = idle + 0.5;
    tiltNow += (tiltTarget - tiltNow) * 0.05;
    car.rotation.x = tiltNow;
    if (asmT > 0 && asmT < 1) {
      asmT = Math.min((performance.now() - asmStart) / ASM_DUR, 1);
      applyAssembly(asmT);
    }
    if (degEl) {
      const deg = Math.round((car.rotation.y * 180 / Math.PI) % 360);
      degEl.textContent = String(deg < 0 ? deg + 360 : deg).padStart(3, '0') + '°';
    }
    renderer.render(scene, camera);
  });
}

/* ================================================================
   PEÇAS — roda, motor e turbos com UM renderizador compartilhado,
   copiado para cada card (antes eram três contextos WebGL)
================================================================ */
function initParts() {
  const canvases = [...document.querySelectorAll('.comp-3d')];
  if (!canvases.length) return;
  const SRC = { wheel: 'wheel-359m.glb', engine: 'engine-n54.glb', turbo: 'turbo.glb' };

  const glCanvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, alpha: true, antialias: true });
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000, 0);
  renderer.setScissorTest(true);

  const items = canvases.map(cv => {
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
    cam.position.set(0, 0.55, 3.1);
    cam.lookAt(0, 0, 0);
    const holder = new THREE.Group();
    holder.rotation.x = 0.25;
    scene.add(holder);
    const item = { cv, ctx: cv.getContext('2d'), scene, cam, holder, visible: false };
    const src = SRC[cv.dataset.part];
    if (src) {
      loadModel(src).then(gltf => {
        gltf.scene.traverse(n => {
          if (!n.isMesh || !n.geometry) return;
          holder.add(new THREE.Mesh(n.geometry, wireMat(0.14)));
          holder.add(new THREE.LineSegments(new THREE.EdgesGeometry(n.geometry, 22), lineMat(0.65)));
        });
      }).catch(() => { /* card fica só com o texto */ });
    }
    new IntersectionObserver(es => es.forEach(e => { item.visible = e.isIntersecting; }), { rootMargin: '80px' }).observe(cv);
    return item;
  });

  let bufW = 0, bufH = 0;
  function resize() {
    bufW = bufH = 0;
    for (const it of items) {
      const w = Math.round((it.cv.clientWidth || 300) * DPR), h = Math.round((it.cv.clientHeight || 230) * DPR);
      it.cv.width = w; it.cv.height = h;
      it.cam.aspect = w / h;
      it.cam.updateProjectionMatrix();
      bufW = Math.max(bufW, w); bufH = Math.max(bufH, h);
    }
    renderer.setSize(bufW, bufH, false);
  }
  resize();
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 120); }, { passive: true });

  tickers.push(() => {
    for (const it of items) {
      if (!it.visible) continue;
      if (!reduced) it.holder.rotation.y += 0.012;
      const w = it.cv.width, h = it.cv.height;
      renderer.setViewport(0, 0, w, h);
      renderer.setScissor(0, 0, w, h);
      renderer.clear();
      renderer.render(it.scene, it.cam);
      it.ctx.clearRect(0, 0, w, h);
      it.ctx.drawImage(glCanvas, 0, bufH - h, w, h, 0, 0, w, h);
    }
  });
}
