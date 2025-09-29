// script.js - full, self-contained example
import * as THREE from 'https://unpkg.com/three@0.152.0/build/three.module.js';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';

// ----- Scene setup -----
const container = document.getElementById('container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x071022);

const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
camera.position.set(0, 2.2, 4); // pulled back so cabinet is visible
camera.lookAt(0, 0.6, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  renderer.setSize(container.clientWidth, container.clientHeight);
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
});

// lighting
const amb = new THREE.AmbientLight(0xffffff, 0.45);
scene.add(amb);
const dir = new THREE.DirectionalLight(0xffffff, 0.6);
dir.position.set(4, 6, 2);
scene.add(dir);

// ----- Physics (cannon-es) -----
const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
world.broadphase = new CANNON.SAPBroadphase(world);
world.allowSleep = true;

// materials
const defaultMat = new CANNON.Material('default');
const contactMat = new CANNON.ContactMaterial(defaultMat, defaultMat, { friction: 0.4, restitution: 0.1 });
world.addContactMaterial(contactMat);

// helper to sync three mesh with cannon body
function syncMesh(body, mesh) {
  mesh.position.copy(body.position);
  mesh.quaternion.copy(body.quaternion);
}

// ----- Cabinet (walls + floor + back) -----
// Dimensions (units tuned for mobile view)
const cabinet = {
  innerWidth: 2.4,
  innerHeight: 2.0,
  innerDepth: 2.2,
  wallThickness: 0.12
};

// Colors / materials
const wallMat = new THREE.MeshStandardMaterial({ color: 0x5a5a5a, opacity: 0.95, transparent: false });
const floorMat = new THREE.MeshStandardMaterial({ color: 0x424242 });

// Floor (visual)
const floorGeo = new THREE.BoxGeometry(cabinet.innerWidth + 0.6, cabinet.wallThickness, cabinet.innerDepth + 0.6);
const floorMesh = new THREE.Mesh(floorGeo, floorMat);
floorMesh.position.set(0, -cabinet.wallThickness / 2, 0.15);
scene.add(floorMesh);

// Floor (physics) - static
const floorBody = new CANNON.Body({
  type: CANNON.Body.STATIC,
  shape: new CANNON.Box(new CANNON.Vec3((cabinet.innerWidth + 0.6)/2, cabinet.wallThickness/2, (cabinet.innerDepth + 0.6)/2)),
  position: new CANNON.Vec3(0, -cabinet.wallThickness/2, 0.15),
});
world.addBody(floorBody);

// Back wall (visual + physics)
const backGeo = new THREE.BoxGeometry(cabinet.innerWidth + 0.6, cabinet.innerHeight + 0.6, cabinet.wallThickness);
const backMesh = new THREE.Mesh(backGeo, wallMat);
backMesh.position.set(0, cabinet.innerHeight/2 - 0.1, -(cabinet.innerDepth/2) + 0.15);
scene.add(backMesh);

const backBody = new CANNON.Body({
  type: CANNON.Body.STATIC,
  shape: new CANNON.Box(new CANNON.Vec3((cabinet.innerWidth + 0.6)/2, (cabinet.innerHeight + 0.6)/2, cabinet.wallThickness/2)),
  position: new CANNON.Vec3(0, cabinet.innerHeight/2 - 0.1, -(cabinet.innerDepth/2) + 0.15)
});
world.addBody(backBody);

// Side walls (left + right)
const sideGeo = new THREE.BoxGeometry(cabinet.wallThickness, cabinet.innerHeight + 0.6, cabinet.innerDepth + 0.6);
const leftMesh = new THREE.Mesh(sideGeo, wallMat);
const rightMesh = new THREE.Mesh(sideGeo, wallMat);
leftMesh.position.set(-(cabinet.innerWidth/2 + cabinet.wallThickness/2) + 0.15, cabinet.innerHeight/2 - 0.1, 0);
rightMesh.position.set((cabinet.innerWidth/2 + cabinet.wallThickness/2) - 0.15, cabinet.innerHeight/2 - 0.1, 0);
scene.add(leftMesh, rightMesh);

const leftBody = new CANNON.Body({
  type:CANNON.Body.STATIC,
  shape: new CANNON.Box(new CANNON.Vec3(cabinet.wallThickness/2, (cabinet.innerHeight + 0.6)/2, (cabinet.innerDepth + 0.6)/2)),
  position: new CANNON.Vec3(-(cabinet.innerWidth/2 + cabinet.wallThickness/2) + 0.15, cabinet.innerHeight/2 - 0.1, 0)
});
const rightBody = leftBody.clone();
rightBody.position = new CANNON.Vec3((cabinet.innerWidth/2 + cabinet.wallThickness/2) - 0.15, cabinet.innerHeight/2 - 0.1, 0);
world.addBody(leftBody); world.addBody(rightBody);

// Front is intentionally open (no front wall) so you can see inside.

// ----- Moving shelf (kinematic) -----
const shelfWidth = cabinet.innerWidth + 0.4;   // deliberately wider than inner cabinet to close side gaps
const shelfDepth = 0.9;                        // how far the shelf reaches (extend toward the back)
const shelfThickness = 0.12;
const shelfY = 0.35; // height of shelf above floor

const shelfGeo = new THREE.BoxGeometry(shelfWidth, shelfThickness, shelfDepth);
const shelfMat = new THREE.MeshStandardMaterial({ color: 0x1536ff });
const shelfMesh = new THREE.Mesh(shelfGeo, shelfMat);
shelfMesh.position.set(0, shelfY, 0.2);
scene.add(shelfMesh);

// Kinematic body
const shelfBody = new CANNON.Body({
  mass: 0,
  type: CANNON.Body.KINEMATIC,
  shape: new CANNON.Box(new CANNON.Vec3(shelfWidth/2, shelfThickness/2, shelfDepth/2)),
  position: new CANNON.Vec3(0, shelfY, 0.2)
});
world.addBody(shelfBody);

// shelf oscillation parameters
const shelfStartZ = 0.2;
const shelfAmplitude = 0.45;   // how far forward/back from start
const shelfSpeed = 1.2;        // speed multiplier
let shelfTime = 0;

// ----- coin factory -----
const coins = []; // array of { body, mesh }

function makeCoin(x=0, y=1.3, z=0) {
  // coin dimensions
  const radius = 0.14;
  const thickness = 0.06;

  // Three mesh
  const geom = new THREE.CylinderGeometry(radius, radius, thickness, 24);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffd300, metalness: 0.3, roughness: 0.5 });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.rotation.x = Math.PI / 2; // lay flat by default visually
  scene.add(mesh);

  // Cannon body (cylinder axis is X? We'll use sphere-ish compound for stable contact)
  // A cylinder can be used, but using a few spheres stacked gives better rolling on simple shape
  const body = new CANNON.Body({
    mass: 0.12,
    shape: new CANNON.Cylinder(radius, radius, thickness, 12),
    position: new CANNON.Vec3(x, y, z),
    material: defaultMat
  });
  // Align orientation of cannon cylinder to match three (cannon cylinder axis is x by default):
  const q = new CANNON.Quaternion();
  q.setFromEuler(Math.PI / 2, 0, 0, 'XYZ');
  body.quaternion.copy(q);

  // slight damping so coins settle but still move with shelf
  body.linearDamping = 0.12;
  body.angularDamping = 0.8;
  world.addBody(body);

  coins.push({ body, mesh });
  return { body, mesh };
}

// Drop coin button
document.getElementById('dropBtn').addEventListener('click', () => {
  // spawn coin slightly forward of camera, drop near center of shelf
  const dropX = (Math.random() - 0.5) * 0.3;
  const dropZ = shelfBody.position.z - 0.1; // drop slightly in front of shelf
  makeCoin(dropX, shelfY + 1.2, dropZ);
});

// ----- simple camera controls (drag to rotate horizontally) -----
let isPointerDown = false;
let startX = 0, startY = 0, startCamRot = 0;

renderer.domElement.addEventListener('pointerdown', (e) => {
  isPointerDown = true;
  startX = e.clientX; startY = e.clientY;
  startCamRot = camera.rotation.y;
});
window.addEventListener('pointerup', () => { isPointerDown = false; });
window.addEventListener('pointermove', (e) => {
  if (!isPointerDown) return;
  const dx = (e.clientX - startX) / container.clientWidth;
  camera.rotation.y = startCamRot - dx * 1.0;
});

// ----- animate loop: physics step + render -----
const fixedTimeStep = 1 / 60;
let lastTime;

function animate(time) {
  requestAnimationFrame(animate);

  // time in seconds
  const t = time / 1000;
  const dt = lastTime ? (t - lastTime) : fixedTimeStep;
  lastTime = t;

  // update shelf kinematic position (sinusoidal)
  shelfTime += dt;
  const targetZ = shelfStartZ + Math.sin(shelfTime * shelfSpeed) * shelfAmplitude;
  // compute velocity to reach target (smooth)
  const velZ = (targetZ - shelfBody.position.z) / Math.max(dt, 1/120);
  shelfBody.velocity.set(0, 0, velZ);
  // also keep shelf body exactly at desired Y and X (just in case)
  shelfBody.position.x = 0;
  shelfBody.position.y = shelfY;
  // sync mesh
  shelfMesh.position.copy(shelfBody.position);
  shelfMesh.quaternion.copy(shelfBody.quaternion);

  // step physics (cannon)
  world.step(fixedTimeStep, dt, 3);

  // sync coins
  for (let i = coins.length - 1; i >= 0; i--) {
    const c = coins[i];
    c.mesh.position.copy(c.body.position);
    c.mesh.quaternion.copy(c.body.quaternion);

    // very simple cleanup: if coin falls far below floor, remove it
    if (c.body.position.y < -4) {
      world.removeBody(c.body);
      scene.remove(c.mesh);
      coins.splice(i, 1);
    }
  }

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);

// ----- quick debug: make a few starter coins so you can see physics working -----
for (let i = 0; i < 3; i++) {
  makeCoin((i - 1) * 0.12, shelfY + 0.8 + i * 0.05, shelfBody.position.z - 0.1);
}
