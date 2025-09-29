// script.js — Coin Pusher (short lower platform, open front)

import * as THREE from './three.module.js';
import * as CANNON from './cannon-es.js';

const container = document.getElementById('container');
const scoreNum = document.getElementById('scoreNum');
const dropBtn = document.getElementById('dropBtn');
const overlay = document.getElementById('overlay');
const restartBtn = document.getElementById('restartBtn');

let score = 0;
let gameOver = false;
const coins = [];

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setClearColor(0x071022);
container.appendChild(renderer.domElement);

// Scene + Camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 50, 120);
camera.lookAt(0, 15, 0);

// Lights
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.6));
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(40, 120, 60);
scene.add(dir);

// Physics world
const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
world.broadphase = new CANNON.SAPBroadphase(world);
world.solver.iterations = 12;

// Materials
const groundMat = new CANNON.Material('ground');
const coinMat = new CANNON.Material('coin');
const metalMat = new CANNON.Material('metal');
world.addContactMaterial(new CANNON.ContactMaterial(groundMat, coinMat, { friction: 0.45, restitution: 0.03 }));
world.addContactMaterial(new CANNON.ContactMaterial(coinMat, coinMat, { friction: 0.35, restitution: 0.02 }));
world.addContactMaterial(new CANNON.ContactMaterial(coinMat, metalMat, { friction: 0.4, restitution: 0.02 }));

// Dimensions
const PW = 40, PD = 80;

// Walls
function addWall(x, y, z, w, h, d) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: 0x4b2f1b }));
  mesh.position.set(x, y + h / 2, z);
  scene.add(mesh);
  const body = new CANNON.Body({ mass: 0 });
  body.addShape(new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2)));
  body.position.set(x, y + h / 2, z);
  world.addBody(body);
}
addWall(-PW / 2 - 1, 0, 0, 2, 30, PD + 6); // left
addWall(PW / 2 + 1, 0, 0, 2, 30, PD + 6);  // right
addWall(0, 0, PD / 2 + 1, PW + 6, 30, 2);  // back
// 👀 no front wall

// Platforms
const platMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2b });

// Upper platform (thin slab)
const upperGeo = new THREE.BoxGeometry(PW, 0.5, PD / 2);
const upperMesh = new THREE.Mesh(upperGeo, platMat);
upperMesh.position.set(0, -1, 0);
scene.add(upperMesh);
const upperBody = new CANNON.Body({ mass: 0, material: groundMat });
upperBody.addShape(new CANNON.Box(new CANNON.Vec3(PW / 2, 0.25, PD / 4)));
upperBody.position.set(0, -1, 0);
world.addBody(upperBody);

// Lower platform (shorter slab pulled back)
const lowerDepth = PD / 2 - 15; // shorter depth
const lowerGeo = new THREE.BoxGeometry(PW, 0.5, lowerDepth);
const lowerMesh = new THREE.Mesh(lowerGeo, platMat);
lowerMesh.position.set(0, -6, -15); // pulled back
scene.add(lowerMesh);
const lowerBody = new CANNON.Body({ mass: 0, material: groundMat });
lowerBody.addShape(new CANNON.Box(new CANNON.Vec3(PW / 2, 0.25, lowerDepth / 2)));
lowerBody.position.set(0, -6, -15);
world.addBody(lowerBody);

// Collector tray (flat)
const trayGeo = new THREE.PlaneGeometry(PW + 6, 10);
const trayMat = new THREE.MeshStandardMaterial({ color: 0x3b2415, side: THREE.DoubleSide });
const trayMesh = new THREE.Mesh(trayGeo, trayMat);
trayMesh.rotation.x = -Math.PI / 2;
trayMesh.position.set(0, -7.5, -PD / 2 - 5);
scene.add(trayMesh);

const trayBody = new CANNON.Body({ mass: 0, material: groundMat });
trayBody.addShape(new CANNON.Box(new CANNON.Vec3((PW + 6) / 2, 0.1, 5)));
trayBody.position.set(0, -7.5, -PD / 2 - 5);
world.addBody(trayBody);

const collectorZ = -PD / 2 - 8;

// Pusher
const pW = PW - 8, pH = 2, pD = 12;
const pMesh = new THREE.Mesh(new THREE.BoxGeometry(pW, pH, pD), new THREE.MeshStandardMaterial({ color: 0xff8a4b, metalness: 0.7, roughness: 0.25 }));
pMesh.position.set(0, pH / 2, -5);
scene.add(pMesh);
const pBody = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC, material: metalMat });
pBody.addShape(new CANNON.Box(new CANNON.Vec3(pW / 2, pH / 2, pD / 2)));
pBody.position.set(0, pH / 2, -5);
world.addBody(pBody);

let phase = 0;
let pSpeed = 0.004;
let pAmp = 10;

// Drop coin
dropBtn.addEventListener('click', () => {
  if (gameOver) return;
  const radius = 2;
  const geo = new THREE.CylinderGeometry(radius, radius, 0.5, 32);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffd166, metalness: 0.6, roughness: 0.3 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, 20, PD / 4);
  scene.add(mesh);

  const body = new CANNON.Body({
    mass: 0.3,
    shape: new CANNON.Cylinder(radius, radius, 0.5, 16),
    material: coinMat
  });
  body.position.set(0, 20, PD / 4);
  world.addBody(body);

  coins.push({ mesh, body });
});

// Restart
restartBtn.addEventListener('click', () => window.location.reload());

// Animate
function animate() {
  requestAnimationFrame(animate);
  world.step(1 / 60);

  for (let i = coins.length - 1; i >= 0; i--) {
    const { mesh, body } = coins[i];
    mesh.position.copy(body.position);
    mesh.quaternion.copy(body.quaternion);
    if (body.position.z < collectorZ) {
      world.removeBody(body);
      scene.remove(mesh);
      coins.splice(i, 1);
      score++;
      scoreNum.textContent = score;
    }
  }

  phase += pSpeed;
  const z = -5 + Math.sin(phase) * pAmp;
  pBody.position.z = z;
  pMesh.position.z = z;

  renderer.render(scene, camera);
}
animate();