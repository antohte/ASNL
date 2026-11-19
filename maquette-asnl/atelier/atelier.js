import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { createCrest, makeSpin, rotationSeconds } from './model.js';
import './atelier.css';

const get = id => document.getElementById(id);
const viewport = get('viewport');
const status = get('status');
const instructions = get('instructions');
const angleButtons = document.querySelectorAll('[data-view]');
const views = {
  angle: [1.66, 0.72, 2.55],
  front: [0, 0, 3.1],
  side: [3.1, 0, 0],
  back: [0, 0, -3.1]
};

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function setupStage(crest) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', 'Écusson ASNL en trois dimensions');
  canvas.setAttribute('aria-describedby', 'instructions');

  const scene = new THREE.Scene();
  const room = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(room, 0.03).texture;
  scene.environmentIntensity = 0.82;
  scene.environmentRotation.y = Math.PI / 6;
  room.dispose();
  pmrem.dispose();

  const key = new THREE.DirectionalLight(0xfff3ed, 1.9);
  key.position.set(-1.8, 2.5, 2.15);
  key.castShadow = true;
  key.shadow.mapSize.set(1536, 1536);
  Object.assign(key.shadow.camera, { left: -0.72, right: 0.72, top: 0.72, bottom: -0.72, near: 0.5, far: 6 });
  key.shadow.normalBias = 0.001;
  key.shadow.bias = -0.00008;
  const edgeLight = new THREE.DirectionalLight(0xdbe7ff, 1.3);
  edgeLight.position.set(2, 0.8, -2);
  scene.add(crest, key, edgeLight);

  const halfHeight = 0.65;
  const camera = new THREE.OrthographicCamera(-halfHeight, halfHeight, halfHeight, -halfHeight, 0.1, 12);
  camera.position.set(...views.angle);
  viewport.append(canvas);
  const orbit = new OrbitControls(camera, canvas);
  orbit.enablePan = false;
  orbit.minZoom = 0.65;
  orbit.maxZoom = 3.5;
  orbit.zoomSpeed = 0.85;
  orbit.addEventListener('change', render);

  const spin = get('spin');
  let spinning = false;
  let previousFrame;

  function render() {
    renderer.render(scene, camera);
  }

  function resize() {
    const { clientWidth: width, clientHeight: height } = viewport;
    if (!width || !height) return;
    const aspect = width / height;
    camera.left = -halfHeight * aspect;
    camera.right = halfHeight * aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    render();
  }

  new ResizeObserver(resize).observe(viewport);
  resize();

  function animate(time) {
    if (previousFrame !== undefined) {
      crest.rotation.y += Math.min((time - previousFrame) / 1000, 0.05) * Math.PI * 2 / rotationSeconds;
    }
    previousFrame = time;
    render();
  }

  function setSpin(enabled) {
    spinning = enabled;
    previousFrame = undefined;
    spin.setAttribute('aria-pressed', String(enabled));
    renderer.setAnimationLoop(enabled ? animate : null);
  }

  function selectView(view) {
    setSpin(false);
    crest.rotation.y = 0;
    camera.zoom = 1;
    camera.updateProjectionMatrix();
    camera.position.set(...views[view]);
    orbit.update();
    for (const button of angleButtons) button.setAttribute('aria-pressed', String(button.dataset.view === view));
    render();
  }

  function clearSelectedView() {
    for (const button of angleButtons) button.setAttribute('aria-pressed', 'false');
  }

  for (const button of angleButtons) button.addEventListener('click', () => selectView(button.dataset.view));
  spin.addEventListener('click', () => {
    clearSelectedView();
    setSpin(!spinning);
  });
  orbit.addEventListener('start', () => {
    setSpin(false);
    clearSelectedView();
  });
  canvas.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const controls = {
      ArrowLeft: () => orbit.rotateLeft(0.12),
      ArrowRight: () => orbit.rotateLeft(-0.12),
      ArrowUp: () => orbit.rotateUp(0.12),
      ArrowDown: () => orbit.rotateUp(-0.12),
      '+': () => orbit.dollyIn(0.89),
      '=': () => orbit.dollyIn(0.89),
      '-': () => orbit.dollyOut(0.89),
      '−': () => orbit.dollyOut(0.89)
    };
    if (!Object.hasOwn(controls, event.key)) return;
    event.preventDefault();
    setSpin(false);
    clearSelectedView();
    controls[event.key]();
  });

  function capture() {
    const size = 1200;
    const pixelRatio = renderer.getPixelRatio();
    const captureCamera = camera.clone();
    captureCamera.left = -halfHeight;
    captureCamera.right = halfHeight;
    captureCamera.updateProjectionMatrix();

    const poster = document.createElement('canvas');
    poster.width = poster.height = size;
    const context = poster.getContext('2d');
    const background = context.createRadialGradient(550, 485, 30, 590, 590, 790);
    background.addColorStop(0, '#423638');
    background.addColorStop(0.65, '#201d22');
    background.addColorStop(1, '#131217');
    context.fillStyle = background;
    context.fillRect(0, 0, size, size);
    context.shadowColor = 'rgba(8, 3, 6, .53)';
    context.shadowBlur = 50;
    context.shadowOffsetY = 28;

    try {
      renderer.setPixelRatio(1);
      renderer.setSize(size, size, false);
      renderer.render(scene, captureCamera);
      context.drawImage(canvas, 0, 0);
    } finally {
      renderer.setPixelRatio(pixelRatio);
      resize();
    }

    return new Promise((resolve, reject) => {
      poster.toBlob(blob => blob ? resolve(blob) : reject(new Error('Impossible de créer l’image.')), 'image/png');
    });
  }

  return { render, capture };
}

try {
  const model = await createCrest();
  const stage = setupStage(model.crest);
  const relief = get('relief');
  const finish = get('finish');
  const number = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

  function updateModel() {
    model.setRelief(relief.valueAsNumber);
    model.setFinish(finish.valueAsNumber);
    const depth = number.format(relief.valueAsNumber) + ' %';
    get('relief-value').textContent = depth;
    relief.setAttribute('aria-valuetext', depth + ' de la hauteur de l’écusson');
    const satin = (finish.valueAsNumber - Number(finish.min)) / (Number(finish.max) - Number(finish.min));
    finish.setAttribute('aria-valuetext', number.format(Math.round(satin * 100)) + ' % satiné');
    stage.render();
  }

  relief.addEventListener('input', updateModel);
  finish.addEventListener('input', updateModel);
  updateModel();
  get('fallback').hidden = true;
  get('tools').disabled = false;

  async function exportFile(button, createFile, filename) {
    button.disabled = true;
    status.textContent = '';
    try {
      const file = await createFile();
      download(file, filename);
      status.textContent = 'Téléchargement lancé.';
    } catch (error) {
      status.textContent = 'Le fichier n’a pas pu être créé. Réessaie.';
      console.error(error);
    } finally {
      button.disabled = false;
    }
  }

  const glbButton = get('export-glb');
  glbButton.addEventListener('click', () => exportFile(glbButton, async () => {
    const crest = model.crest.clone();
    crest.rotation.set(0, 0, 0);
    const file = await new GLTFExporter().parseAsync(crest, { binary: true, animations: [makeSpin()] });
    return new Blob([file], { type: 'model/gltf-binary' });
  }, 'ecusson-asnl-metal.glb'));

  const pngButton = get('export-png');
  pngButton.addEventListener('click', () => exportFile(pngButton, stage.capture, 'apercu-ecusson-asnl-metal.png'));
} catch (error) {
  viewport.querySelector('canvas')?.remove();
  instructions.textContent = 'La vue 3D est indisponible. Recharge la page dans un navigateur compatible avec WebGL.';
  console.error(error);
}
