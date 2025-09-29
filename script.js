// script.js — Coin Aura Cabinet (open front, tall back/sides, neon-ready)

import * as THREE from './three.module.js';
import * as CANNON from './cannon-es.js';

const container = document.getElementById('container');
const scoreNum = document.getElementById('scoreNum');
const dropBtn = document.getElementById('dropBtn');

let score = 0;
const coins = [];

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x071022);
container.appendChild(renderer.domElement);

// Scene & Camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 12, -18);   // in front of cabinet
camera.lookAt(0, 6, 6);           // looking inside
scene.add(camera);

// Lights
const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
scene.add(hemi);
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(10, 30, -10);
scene.add(dir);

// Physics
const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
world.broadphase = new CANNON.SAPBroadphase(world);

// Materials
const groundMat = new CANNON.Material('ground');
const coinMat = new CANNON.Material('coin');
world.addContactMaterial(new CANNON.ContactMaterial(groundMat, coinMat, { friction: 0.4, restitution: 0.05 }));

// Helpers: mesh + body
function createBox(w, h, d, x, y, z, color, physics = true, mass = 0, material = groundMat) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color })
  );
  mesh.position.set(x, y, z);
  scene.add(mesh);

  let body = null;
  if (physics) {
    body = new CANNON.Body({ mass, material });
    body.addShape(new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2)));
    body.position.set(x, y, z);
    world.addBody(body);
  }
  return { mesh, body };
}

// Cabinet dimensions
const W = 12, H = 12, D = 14;

// Floor
createBox(W, 1, D, 0, 0, 6, 0x886644);

// Side walls
createBox(1, H, D, -W / 2, H / 2, 6, 0x654321);
createBox(1, H, D, W / 2, H / 2, 6, 0x654321);

// Back wall
createBox(W, H, 1, 0, H / 2, D + 0.5, 0x654321);

// Collector tray (front, open)
createBox(W, 1, 4, 0, -0.5, -2, 0x443322);

// Pusher
const pusherData = createBox(W - 3, 1, 3, 0, 1, 4, 0xff6633, true, 0, groundMat);
const pusherMesh = pusherData.mesh;
const pusherBody = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC, material: groundMat });
pusherBody.addShape(new CANNON.Box(new CANNON.Vec3((W - 3) / 2, 0.5, 1.5)));
pusherBody.position.set(0, 1, 4);
world.addBody(pusherBody);

let phase = 0, speed = 0.02, amp = 3;

// Drop Coin
dropBtn.addEventListener('click', () => {
  const radius = 0.6;
  const geo = new THREE.CylinderGeometry(radius, radius, 0.2, 32);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffd166, metalness: 0.5, roughness: 0.3 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, 10, 8);
  scene.add(mesh);

  const body = new CANNON.Body({
    mass: 0.3,
    shape: new CANNON.Cylinder(radius, radius, 0.2, 16),
    material: coinMat
  });
  body.position.set(0, 10, 8);
  world.addBody(body);

  coins.push({ mesh, body });
});

// Animate
function animate() {
  requestAnimationFrame(animate);
  world.step(1 / 60);

  // Update coins
  coins.forEach(({ mesh, body }) => {
    mesh.position.copy(body.position);
    mesh.quaternion.copy(body.quaternion);
  });

  // Move pusher
  phase += speed;
  const z = 4 + Math.sin(phase) * amp;
  pusherBody.position.z = z;
  pusherMesh.position.z = z;

  renderer.render(scene, camera);
}
animate();
