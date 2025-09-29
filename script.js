// script.js — Coin Pusher (front-facing, back closed, coins pushed forward)

import * as THREE from './three.module.js';
import * as CANNON from './cannon-es.js';

const container = document.getElementById('container');
const scoreNum = document.getElementById('scoreNum');
const dropBtn = document.getElementById('dropBtn');
const restartBtn = document.getElementById('restartBtn');

let score = 0;
const coins = [];

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setClearColor(0x071022);
container.appendChild(renderer.domElement);

// Scene + Camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
// place camera in front of cabinet (positive Z)
camera.position.set(0, 50, 120);
camera.lookAt(0, 0, 0);

// Lights
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.7));
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(40, 120, 50);
scene.add(dir);

// Physics world
const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
world.broadphase = new CANNON.SAPBroadphase(world);
world.solver.iterations = 12;

// Materials
const groundMat = new CANNON.Material('ground');
const coinMat = new CANNON.Material('coin');
const metalMat = new CANNON.Material('metal');

world.addContactMaterial(new CANNON.ContactMaterial(groundMat, coinMat, { friction: 0.45, restitution: 0.02 }));
world.addContactMaterial(new CANNON.ContactMaterial(coinMat, coinMat, { friction: 0.35, restitution: 0.02 }));
world.addContactMaterial(new CANNON.ContactMaterial(coinMat, metalMat, { friction: 0.4, restitution: 0.02 }));

// Cabinet dimensions
const PW = 40;  // width
const PD = 80;  // depth

// Helper to add static walls (sides/back)
function addWall(x, y, z, w, h, d) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: 0x4b2f1b }));
  mesh.position.set(x, y + h / 2, z);
  scene.add(mesh);

  const body = new CANNON.Body({ mass: 0 });
  body.addShape(new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2)));
  body.position.set(x, y + h / 2, z);
  world.addBody(body);
}

// --- Place walls so the back is at negative Z (front faces camera) ---
// left & right walls (same)
addWall(-PW / 2 - 1, 0, 0, 2, 30, PD + 6);
addWall(PW / 2 + 1, 0, 0, 2, 30, PD + 6);

// BACK wall: negative Z side (far side)
addWall(0, 0, -PD / 2 - 1, PW + 6, 30, 2);

// --- Platforms and tray ---
// Material for platforms
const platMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 0.8, metalness: 0.05 });

// Upper platform: thin and pulled back (near the back wall)
const upperDepth = PD / 2 - 10; // make it a bit shorter than full depth
const upperZ = -PD / 4 - 6;      // pulled toward the back
const upperY = -3;

const upperGeo = new THREE.BoxGeometry(PW, 0.5, upperDepth);
const upperMesh = new THREE.Mesh(upperGeo, platMat);
upperMesh.position.set(0, upperY, upperZ);
scene.add(upperMesh);

const upperBody = new CANNON.Body({ mass: 0, material: groundMat });
upperBody.addShape(new CANNON.Box(new CANNON.Vec3(PW / 2, 0.25, upperDepth / 2)));
upperBody.position.set(0, upperY, upperZ);
world.addBody(upperBody);

// Lower platform: shallower and closer to front (so front stays open)
const lowerDepth = PD / 2 - 10;
const lowerZ = -6;   // closer to front than upper
const lowerY = -8;

const lowerGeo = new THREE.BoxGeometry(PW, 0.5, lowerDepth);
const lowerMesh = new THREE.Mesh(lowerGeo, platMat);
lowerMesh.position.set(0, lowerY, lowerZ);
scene.add(lowerMesh);

const lowerBody = new CANNON.Body({ mass: 0, material: groundMat });
lowerBody.addShape(new CANNON.Box(new CANNON.Vec3(PW / 2, 0.25, lowerDepth / 2)));
lowerBody.position.set(0, lowerY, lowerZ);
world.addBody(lowerBody);

// Collector tray (flat, at the very front)
const trayZ = 18; // position positive Z in front of lower platform
const trayGeo = new THREE.PlaneGeometry(PW + 6, 12);
const trayMat = new THREE.MeshStandardMaterial({ color: 0x3b2415, side: THREE.DoubleSide });
const trayMesh = new THREE.Mesh(trayGeo, trayMat);
trayMesh.rotation.x = -Math.PI / 2;
trayMesh.position.set(0, -9.5, trayZ);
scene.add(trayMesh);

const trayBody = new CANNON.Body({ mass: 0, material: groundMat });
trayBody.addShape(new CANNON.Box(new CANNON.Vec3((PW + 6) / 2, 0.1, 6)));
trayBody.position.set(0, -9.5, trayZ);
world.addBody(trayBody);

// When coin z > collectorZ it's into the tray (front)
const collectorZ = trayZ - 2;

// --- Pusher (on the upper platform) ---
const pW = PW - 8, pH = 2, pD = 12;
const pMaterial = new THREE.MeshStandardMaterial({ color: 0xff8a4b, metalness: 0.6, roughness: 0.25 });

// put pusher on the upper platform (near its center)
const pCenterZ = upperZ + 6; // slightly towards the center of the upper platform
const pCenterY = upperY + pH / 2;

const pMesh = new THREE.Mesh(new THREE.BoxGeometry(pW, pH, pD), pMaterial);
pMesh.position.set(0, pCenterY, pCenterZ);
scene.add(pMesh);

const pBody = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC, material: metalMat });
pBody.addShape(new CANNON.Box(new CANNON.Vec3(pW / 2, pH / 2, pD / 2)));
pBody.position.set(0, pCenterY, pCenterZ);
world.addBody(pBody);

let phase = 0;
let pSpeed = 0.005;
let pAmp = 14; // how far the pusher moves (adjust if it over-extends)

// --- Drop coin (spawn at the back, on top of the upper platform) ---
dropBtn.addEventListener('click', () => {
  const radius = 2;
  const height = 0.5;

  const geo = new THREE.CylinderGeometry(radius, radius, height, 24);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffd166, metalness: 0.6, roughness: 0.3 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;

  // spawn near the back (above the upper platform)
  const spawnZ = upperZ - (upperDepth / 2) + 6; // close to the back wall
  mesh.position.set((Math.random() - 0.5) * (PW - 6), 20, spawnZ);
  scene.add(mesh);

  // cannon cylinder (aligned with Y axis)
  const body = new CANNON.Body({
    mass: 0.3,
    shape: new CANNON.Cylinder(radius, radius, height, 16),
    position: new CANNON.Vec3(mesh.position.x, mesh.position.y, mesh.position.z),
    material: coinMat
  });
  // cannon cylinder axes need rotation to match three.js orientation
  body.quaternion.setFromEuler(Math.PI / 2, 0, 0, 'XYZ');

  world.addBody(body);
  coins.push({ mesh, body });
});

// Restart (just reload page)
restartBtn.addEventListener('click', () => window.location.reload());

// --- Animate loop ---
function animate() {
  requestAnimationFrame(animate);

  world.step(1 / 60);

  // update coins
  for (let i = coins.length - 1; i >= 0; i--) {
    const { mesh, body } = coins[i];
    mesh.position.copy(body.position);
    mesh.quaternion.copy(body.quaternion);

    // coin fell into the front tray?
    if (body.position.z > collectorZ + 1) {
      world.removeBody(body);
      scene.remove(mesh);
      coins.splice(i, 1);
      score++;
      scoreNum.textContent = score;
    }
  }

  // move pusher back-and-forth along Z (pushes towards positive Z/front)
  phase += pSpeed;
  const z = pCenterZ + Math.sin(phase) * pAmp;
  pBody.position.z = z;
  pMesh.position.z = z;

  renderer.render(scene, camera);
}
animate();
