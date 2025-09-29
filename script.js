// script.js
// Full single-file scene using three.module.js + cannon-es.js
// Drop this into your repo (replace your current script.js).
// Expects index.html to include: <script type="module" src="./script.js"></script>
// and a button with id="dropBtn" (your index.html already has that).

import * as THREE from './three.module.js';
import * as CANNON from './cannon-es.js';

/* ================== Scene & Renderer ================== */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x071022);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 12);
camera.lookAt(0, 2, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

/* ================== Lights ================== */
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);
const dir = new THREE.DirectionalLight(0xffffff, 0.6);
dir.position.set(5, 10, 5);
scene.add(dir);

/* ================== Physics world ================== */
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
world.broadphase = new CANNON.SAPBroadphase(world);
world.solver.iterations = 20;

/* Materials & contact behaviour */
const defaultMat = new CANNON.Material('default');
const shelfMat = new CANNON.Material('shelf');
const coinMat = new CANNON.Material('coin');
const wallMat = new CANNON.Material('wall');

// high friction between coin and shelf so coins move with shelf
world.addContactMaterial(new CANNON.ContactMaterial(coinMat, shelfMat, {
  friction: 0.95,
  restitution: 0.05
}));

// general coin-to-floor friction (so coins don't slide wildly)
world.addContactMaterial(new CANNON.ContactMaterial(coinMat, defaultMat, {
  friction: 0.6,
  restitution: 0.01
}));

/* ================== Utility arrays ================== */
const meshes = [];
const bodies = [];

/* ================== Cabinet (static) ================== */
/* These constants are tuned to give the "middle-screen" cabinet look you liked */
const CABINET_WIDTH = 6.0;
const CABINET_DEPTH = 8.0;
const CABINET_HEIGHT = 6.0;

const wallMaterialThree = new THREE.MeshStandardMaterial({ color: 0x555555, opacity: 0.9, transparent: true });

function addStaticBoxThreeCannon(w, h, d, x, y, z, threeMat = wallMaterialThree, cannonMat = defaultMat) {
  // THREE mesh
  const geo = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, threeMat);
  mesh.position.set(x, y, z);
  scene.add(mesh);

  // CANNON body (static)
  const boxShape = new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2));
  const body = new CANNON.Body({ mass: 0, material: cannonMat });
  body.addShape(boxShape);
  body.position.set(x, y, z);
  world.addBody(body);

  return { mesh, body };
}

// Back wall (thin)
addStaticBoxThreeCannon(CABINET_WIDTH, CABINET_HEIGHT, 0.2, 0, CABINET_HEIGHT / 2, -CABINET_DEPTH / 2);

// Left and right walls
addStaticBoxThreeCannon(0.2, CABINET_HEIGHT, CABINET_DEPTH, -CABINET_WIDTH / 2, CABINET_HEIGHT / 2, 0);
addStaticBoxThreeCannon(0.2, CABINET_HEIGHT, CABINET_DEPTH, CABINET_WIDTH / 2, CABINET_HEIGHT / 2, 0);

// Floor
addStaticBoxThreeCannon(CABINET_WIDTH, 0.2, CABINET_DEPTH, 0, 0, 0);

/* ================== Shelf (kinematic) ================== */
/* Extended depth to prevent coins slipping behind it — we'll keep the visible top area centered
   but the shelf's back edge extends further back so coins cannot fall behind it. */
const SHELF_WIDTH = 3.0;           // x size
const SHELF_THICKNESS = 0.25;      // y thickness
const SHELF_DEPTH_VISIBLE = 2.2;   // visible front depth (what the player sees)
const SHELF_DEPTH_EXTENDED = SHELF_DEPTH_VISIBLE * 2.1; // extended back, prevents falling behind

// shelf initial position
const SHELF_Y = 1.0;
const SHELF_Z = 0.0; // center of cabinet

const shelfGeo = new THREE.BoxGeometry(SHELF_WIDTH, SHELF_THICKNESS, SHELF_DEPTH_VISIBLE);
const shelfMatThree = new THREE.MeshStandardMaterial({ color: 0x0a5cff, metalness: 0.2, roughness: 0.6 });
const shelfMesh = new THREE.Mesh(shelfGeo, shelfMatThree);
shelfMesh.position.set(0, SHELF_Y, SHELF_Z);
scene.add(shelfMesh);

// physics body uses the extended depth so coins cannot slip behind the visible top
const shelfBody = new CANNON.Body({
  mass: 0,
  type: CANNON.Body.KINEMATIC,
  material: shelfMat
});
const shelfShape = new CANNON.Box(new CANNON.Vec3(SHELF_WIDTH / 2, SHELF_THICKNESS / 2, SHELF_DEPTH_EXTENDED / 2));
shelfBody.addShape(shelfShape);
shelfBody.position.set(0, SHELF_Y, SHELF_Z);
world.addBody(shelfBody);

// Keep a trailing position for velocity calculation (important for kinematic collisions)
let prevShelfPos = new CANNON.Vec3().copy(shelfBody.position);

/* Shelf movement params (slow, coin-pusher style) */
const SHELF_AMPLITUDE = 1.2;  // how far forward/back from center (z)
const SHELF_SPEED = 0.9;      // angular speed (lower = slower). You asked for slower — this is gentle

/* ================== Coin creation (cylinder) ================== */
const COIN_RADIUS = 0.25;
const COIN_THICKNESS = 0.12;
const COIN_MASS = 0.18;

function createCoin(x = 0, z = 0) {
  // THREE mesh — cylinder axis is Y (what we want visually)
  const coinGeo = new THREE.CylinderGeometry(COIN_RADIUS, COIN_RADIUS, COIN_THICKNESS, 24);
  const coinMatThree = new THREE.MeshStandardMaterial({ color: 0xFFD800, metalness: 0.8, roughness: 0.4 });
  const coinMesh = new THREE.Mesh(coinGeo, coinMatThree);
  coinMesh.position.set(x, SHELF_Y + 1.2, z);
  scene.add(coinMesh);

  // CANNON body — Cylinder default axis is X; rotate the shape so it lines up with Y
  const coinBody = new CANNON.Body({
    mass: COIN_MASS,
    material: coinMat,
    linearDamping: 0.22,
    angularDamping: 0.5
  });

  // Cylinder shape (radiusTop, radiusBottom, height, segments)
  const cylShape = new CANNON.Cylinder(COIN_RADIUS, COIN_RADIUS, COIN_THICKNESS, 16);
  // rotate shape so cylinder axis matches Y
  const q = new CANNON.Quaternion();
  q.setFromEuler(Math.PI / 2, 0, 0); // rotate cylinder axis X->Y
  coinBody.addShape(cylShape, new CANNON.Vec3(), q);

  coinBody.position.set(x, SHELF_Y + 1.2, z);
  // small random spin so coins fall naturally
  coinBody.angularVelocity.set((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);

  world.addBody(coinBody);

  meshes.push(coinMesh);
  bodies.push(coinBody);
  return {mesh: coinMesh, body: coinBody};
}

/* ================== Walls & floor friction tuning ================== */
// Give walls a default contact material with normal friction
world.addContactMaterial(new CANNON.ContactMaterial(wallMat, defaultMat, {
  friction: 0.6,
  restitution: 0.01
}));

/* ================== Drop button hookup ================== */
const dropBtn = document.getElementById('dropBtn');
if (dropBtn) {
  dropBtn.addEventListener('click', () => {
    // spawn coin near center with a small random offset
    const rx = (Math.random() - 0.5) * (SHELF_WIDTH * 0.6);
    const rz = (Math.random() - 0.5) * (SHELF_DEPTH_VISIBLE * 0.3);
    createCoin(rx, SHELF_Z + rz);
  });
} else {
  console.warn('Drop button with id "dropBtn" not found.');
}

/* ================== Sync helper ================== */
function syncMeshToBody(mesh, body) {
  mesh.position.copy(body.position);
  mesh.quaternion.copy(body.quaternion);
}

/* ================== Resize handling ================== */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ================== Animation / Physics step ================== */
const fixedTimeStep = 1.0 / 60.0;
let lastTime = undefined;
const maxSubSteps = 3;

function animate(time) {
  requestAnimationFrame(animate);

  if (lastTime === undefined) lastTime = time;
  const dtSec = Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;

  // ---- Move shelf kinematically ----
  // Use elapsed time (world time) to compute a smooth back/forward movement
  const t = performance.now() / 1000;
  const newZ = SHELF_Z + Math.sin(t * SHELF_SPEED) * SHELF_AMPLITUDE;

  // compute velocity for kinematic body (important so collisions react properly)
  const newShelfPos = new CANNON.Vec3(0, SHELF_Y, newZ);
  const velocity = newShelfPos.vsub(prevShelfPos).scale(1 / Math.max(dtSec, fixedTimeStep));
  shelfBody.velocity.copy(velocity);
  shelfBody.position.copy(newShelfPos);
  prevShelfPos.copy(newShelfPos);

  // step world
  world.step(fixedTimeStep, dtSec, maxSubSteps);

  // Sync shelf mesh to its body (body.position is authoritative)
  shelfMesh.position.copy(shelfBody.position);
  shelfMesh.quaternion.copy(shelfBody.quaternion);

  // Sync other meshes (coins) to bodies
  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i];
    const m = meshes[i];
    if (b && m) syncMeshToBody(m, b);
  }

  renderer.render(scene, camera);
}
requestAnimationFrame(animate);

/* ================== Debug / helper (optional) ================== */
// If cabinet ever disappears again: make sure the file names are correct, and that this script
// is saved as script.js and your index.html references it with type="module".
// Also make sure cannon-es.js and three.module.js are reachable in the same folder.

/* ================== End ================== */
