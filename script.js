// script.js
// Replace the whole file with this. Assumes these files exist in your repo:
// - ./three.module.js
// - ./cannon-es.js
// index.html should have <button id="dropBtn">Drop Coin</button> and <script type="module" src="./script.js"></script>

import * as THREE from './three.module.js';
import * as CANNON from './cannon-es.js';

// ---------- THREE setup ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x071022);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 4.5, 12);
camera.lookAt(0, 2, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio || 1);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// lights
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);
const dir = new THREE.DirectionalLight(0xffffff, 0.6);
dir.position.set(5, 10, 5);
scene.add(dir);

// ---------- CANNON setup ----------
const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0),
});
world.broadphase = new CANNON.NaiveBroadphase();
world.solver.iterations = 10;

// materials & contact
const defaultMat = new CANNON.Material('default');
const coinMat = new CANNON.Material('coin');
const shelfMat = new CANNON.Material('shelf');

world.defaultContactMaterial = new CANNON.ContactMaterial(defaultMat, defaultMat, {
  friction: 0.3,
  restitution: 0.0,
});
// coin <> shelf: high friction so coins move with shelf
world.addContactMaterial(new CANNON.ContactMaterial(coinMat, shelfMat, {
  friction: 0.95,
  restitution: 0.0
}));

// arrays to track meshes <> bodies
const coinPool = []; // elements: {mesh, body}

// ---------- Helpers ----------
function threeBox(size, pos, color = 0x666666, opacity = 0.85) {
  const g = new THREE.BoxGeometry(size.x, size.y, size.z);
  const m = new THREE.MeshStandardMaterial({ color, transparent: true, opacity });
  const mesh = new THREE.Mesh(g, m);
  mesh.position.copy(pos);
  scene.add(mesh);
  return mesh;
}

function cannonBox(size, pos, quat = null, mass = 0) {
  const shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
  const body = new CANNON.Body({ mass, shape });
  body.position.set(pos.x, pos.y, pos.z);
  if (quat) body.quaternion.copy(quat);
  world.addBody(body);
  return body;
}

// ---------- Cabinet (floor + walls) ----------
const CAB_W = 8, CAB_H = 8, CAB_D = 8;
const floorY = 0; // world y=0 is floor
// floor (thin)
threeBox(new THREE.Vector3(CAB_W, 0.4, CAB_D), new THREE.Vector3(0, floorY - 0.2, 0), 0x222222, 1);
cannonBox(new THREE.Vector3(CAB_W, 0.4, CAB_D), new THREE.Vector3(0, floorY - 0.2, 0), null, 0);

// back wall
threeBox(new THREE.Vector3(CAB_W, CAB_H, 0.4), new THREE.Vector3(0, CAB_H / 2 - 0.2, -CAB_D / 2 + 0.2), 0x4b4b4b, 0.95);
cannonBox(new THREE.Vector3(CAB_W, CAB_H, 0.4), new THREE.Vector3(0, CAB_H / 2 - 0.2, -CAB_D / 2 + 0.2), null, 0);

// left/right walls
threeBox(new THREE.Vector3(0.4, CAB_H, CAB_D), new THREE.Vector3(-CAB_W / 2 + 0.2, CAB_H / 2 - 0.2, 0), 0x4b4b4b, 0.95);
cannonBox(new THREE.Vector3(0.4, CAB_H, CAB_D), new THREE.Vector3(-CAB_W / 2 + 0.2, CAB_H / 2 - 0.2, 0), null, 0);
threeBox(new THREE.Vector3(0.4, CAB_H, CAB_D), new THREE.Vector3(CAB_W / 2 - 0.2, CAB_H / 2 - 0.2, 0), 0x4b4b4b, 0.95);
cannonBox(new THREE.Vector3(0.4, CAB_H, CAB_D), new THREE.Vector3(CAB_W / 2 - 0.2, CAB_H / 2 - 0.2, 0), null, 0);

// front lip (so shelf doesn't fall through front)
threeBox(new THREE.Vector3(CAB_W, 0.4, 0.6), new THREE.Vector3(0, 0.2, CAB_D / 2 - 0.3), 0x333333, 1);
cannonBox(new THREE.Vector3(CAB_W, 0.4, 0.6), new THREE.Vector3(0, 0.2, CAB_D / 2 - 0.3), null, 0);

// ---------- Moving shelf (kinematic) ----------
const SHELF_W = 5.2;        // x-size (width)
const SHELF_TH = 0.45;      // y-size (thickness)
const SHELF_DEPTH = 6.0;    // z-size: made longer to block coins (user request)
const shelfGeo = new THREE.BoxGeometry(SHELF_W, SHELF_TH, SHELF_DEPTH);
const shelfMatThree = new THREE.MeshStandardMaterial({ color: 0x1133ff });
const shelfMesh = new THREE.Mesh(shelfGeo, shelfMatThree);

// place shelf inside cabinet (centered front/back-ish)
const SHELF_Y = 1.6;
const SHELF_Z_INITIAL = -1.0; // negative z = closer to back; positive = toward front
shelfMesh.position.set(0, SHELF_Y, SHELF_Z_INITIAL);
scene.add(shelfMesh);

// cannon kinematic body
const shelfShape = new CANNON.Box(new CANNON.Vec3(SHELF_W / 2, SHELF_TH / 2, SHELF_DEPTH / 2));
const shelfBody = new CANNON.Body({ mass: 0 }); // mass 0 but we'll mark kinematic
shelfBody.addShape(shelfShape);
shelfBody.position.set(shelfMesh.position.x, shelfMesh.position.y, shelfMesh.position.z);
shelfBody.type = CANNON.Body.KINEMATIC;
shelfBody.collisionResponse = true;
world.addBody(shelfBody);

// shelf motion parameters
let shelfDir = 1;
let shelfSpeed = 0.9;         // changeable - user asked slower, set < 1.0
const zMin = -1.6;            // back-most (closer to back wall)
const zMax = 1.6;             // front-most (closer to front lip)
shelfBody.velocity.set(0, 0, shelfSpeed * shelfDir);

// ---------- Ground contact shape for coins if they fall off ----------
const groundShape = new CANNON.Plane();
const groundBody = new CANNON.Body({ mass: 0 });
groundBody.addShape(groundShape);
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
groundBody.position.set(0, -0.5, 0);
world.addBody(groundBody);

// ---------- Coin drop function ----------
function dropCoin() {
  const r = 0.28;
  const h = 0.12;
  // THREE mesh
  const geom = new THREE.CylinderGeometry(r, r, h, 32);
  const mat = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.rotation.x = Math.PI / 2; // make it lie flat visually
  // spawn a bit above the shelf center; small random x offset so coins stack realistically
  const spawnX = (Math.random() - 0.5) * 1.2;
  const spawnZ = shelfMesh.position.z - 0.2; // drop near middle of shelf
  mesh.position.set(spawnX, SHELF_Y + 3.2, spawnZ);
  scene.add(mesh);

  // CANNON body (cylinder shape rotated so axis = y)
  const cylShape = new CANNON.Cylinder(r, r, h, 16);
  const coinBody = new CANNON.Body({ mass: 0.55, material: coinMat });
  const q = new CANNON.Quaternion();
  q.setFromEuler(Math.PI / 2, 0, 0); // rotate shape to lay flat
  coinBody.addShape(cylShape, new CANNON.Vec3(), q);
  coinBody.position.set(mesh.position.x, mesh.position.y, mesh.position.z);
  // give a little spin
  coinBody.angularVelocity.set(0, 1.5 * (Math.random() - 0.5), 0.5 * (Math.random() - 0.5));
  coinBody.angularDamping = 0.4;

  world.addBody(coinBody);
  coinPool.push({ mesh, body: coinBody });
}

// bind the button (index.html uses id "dropBtn" in your screenshots)
const dropBtn = document.getElementById('dropBtn');
if (dropBtn) {
  dropBtn.addEventListener('click', dropCoin);
} else {
  console.warn('Drop button (#dropBtn) not found in DOM.');
}

// ---------- sync loop ----------
const FIXED_STEP = 1 / 60;
let lastTime = undefined;

function updatePhysics(dt) {
  // Move kinematic shelf: set velocity & world.step will integrate it.
  // If using instantaneous position changes you'd break collisions; using velocity allows collision impulses.
  if (shelfBody.position.z > zMax) {
    shelfDir = -1;
    shelfBody.velocity.set(0, 0, shelfSpeed * shelfDir);
  } else if (shelfBody.position.z < zMin) {
    shelfDir = 1;
    shelfBody.velocity.set(0, 0, shelfSpeed * shelfDir);
  }
  // Step world
  world.step(FIXED_STEP, dt, 3);
}

function renderLoop(time) {
  requestAnimationFrame(renderLoop);
  const t = time / 1000;
  const dt = lastTime ? t - lastTime : FIXED_STEP;
  lastTime = t;

  // update physics
  updatePhysics(dt);

  // sync THREE meshes to CANNON bodies
  // shelf
  shelfMesh.position.copy(shelfBody.position);
  shelfMesh.quaternion.copy(shelfBody.quaternion);

  // coins
  for (let i = 0; i < coinPool.length; i++) {
    const c = coinPool[i];
    c.mesh.position.copy(c.body.position);
    c.mesh.quaternion.copy(c.body.quaternion);
  }

  renderer.render(scene, camera);
}

renderLoop();

// ---------- resize handling ----------
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// ---------- debug helper (optional) ----------
// If you want to debug in-browser, you can enable a wireframe for bodies or print positions to console.
// (Left out to keep runtime tidy.)
