// script.js
import * as THREE from './three.module.js';
import { FontLoader } from './FontLoader.js';
import { TextGeometry } from './TextGeometry.js';
import * as CANNON from './cannon-es.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 5, 15);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Physics world
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
world.broadphase = new CANNON.NaiveBroadphase();
world.solver.iterations = 10;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 10, 7.5);
scene.add(dirLight);

// Materials
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
const coinMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700 });

// Cabinet (back + sides + floor)
function createWall(w, h, d, x, y, z, rx = 0, ry = 0, rz = 0) {
  const wallGeom = new THREE.BoxGeometry(w, h, d);
  const wallMesh = new THREE.Mesh(wallGeom, wallMaterial);
  wallMesh.position.set(x, y, z);
  wallMesh.rotation.set(rx, ry, rz);
  scene.add(wallMesh);

  const wallShape = new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2));
  const wallBody = new CANNON.Body({ mass: 0 });
  wallBody.addShape(wallShape);
  wallBody.position.set(x, y, z);
  wallBody.quaternion.setFromEuler(rx, ry, rz);
  world.addBody(wallBody);
}

// Floor
createWall(10, 1, 12, 0, -5, 0);
// Left wall
createWall(1, 10, 12, -5, 0, 0);
// Right wall
createWall(1, 10, 12, 5, 0, 0);
// Back wall (taller, extends fully)
createWall(10, 10, 1, 0, 0, -6);
// Front lip
createWall(10, 2, 1, 0, -4, 6);

// Moving shelf
const shelfGeometry = new THREE.BoxGeometry(8, 0.5, 12);
const shelfMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
scene.add(shelf);

const shelfShape = new CANNON.Box(new CANNON.Vec3(4, 0.25, 6));
const shelfBody = new CANNON.Body({
  mass: 0, // kinematic
  type: CANNON.Body.KINEMATIC,
  position: new CANNON.Vec3(0, -4.75, 0)
});
shelfBody.addShape(shelfShape);
world.addBody(shelfBody);

// Coins
const coins = [];
function dropCoin() {
  const radius = 0.5;
  const coinGeom = new THREE.CylinderGeometry(radius, radius, 0.2, 32);
  const coinMesh = new THREE.Mesh(coinGeom, coinMaterial);
  coinMesh.rotation.x = Math.PI / 2;
  scene.add(coinMesh);

  const coinShape = new CANNON.Cylinder(radius, radius, 0.2, 32);
  const coinBody = new CANNON.Body({ mass: 1 });
  coinBody.addShape(coinShape);
  coinBody.position.set(0, 5, 0);
  coinBody.quaternion.setFromEuler(Math.PI / 2, 0, 0);
  world.addBody(coinBody);

  coins.push({ mesh: coinMesh, body: coinBody });
}

document.getElementById('dropCoin').addEventListener('click', dropCoin);

// Animate shelf
const shelfSpeed = 1; // slower
const shelfRange = 2;
let shelfDirection = 1;

function animateShelf(delta) {
  shelfBody.position.z += shelfSpeed * shelfDirection * delta;

  if (shelfBody.position.z > shelfRange) shelfDirection = -1;
  if (shelfBody.position.z < -shelfRange) shelfDirection = 1;

  shelf.position.copy(shelfBody.position);
  shelf.quaternion.copy(shelfBody.quaternion);
}

// Main loop
let lastTime;
function animate(time) {
  requestAnimationFrame(animate);

  if (lastTime !== undefined) {
    const delta = (time - lastTime) / 1000;

    world.step(1 / 60, delta, 3);

    // Update coins
    coins.forEach(c => {
      c.mesh.position.copy(c.body.position);
      c.mesh.quaternion.copy(c.body.quaternion);
    });

    // Move shelf
    animateShelf(delta);
  }

  renderer.render(scene, camera);
  lastTime = time;
}
animate();
