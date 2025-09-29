// script.js
import * as THREE from './three.module.js';
import * as CANNON from './cannon-es.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 6, 10);
camera.lookAt(0, 2, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Physics world
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
world.broadphase = new CANNON.NaiveBroadphase();
world.solver.iterations = 20;

// Lighting
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

// Materials
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, side: THREE.DoubleSide });
const shelfMaterial = new THREE.MeshStandardMaterial({ color: 0x3333ff });
const coinMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700 });

// Cabinet walls + floor (visual + physics)
function createWall(w, h, d, x, y, z) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, wallMaterial);
  mesh.position.set(x, y, z);
  scene.add(mesh);

  const shape = new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2));
  const body = new CANNON.Body({ mass: 0 });
  body.addShape(shape);
  body.position.set(x, y, z);
  world.addBody(body);

  return { mesh, body };
}

// Cabinet size
const cabinetWidth = 6;
const cabinetHeight = 6;
const cabinetDepth = 8;

// Floor
createWall(cabinetWidth, 0.2, cabinetDepth, 0, 0, 0);
// Back wall
createWall(cabinetWidth, cabinetHeight, 0.2, 0, cabinetHeight / 2, -cabinetDepth / 2);
// Left wall
createWall(0.2, cabinetHeight, cabinetDepth, -cabinetWidth / 2, cabinetHeight / 2, 0);
// Right wall
createWall(0.2, cabinetHeight, cabinetDepth, cabinetWidth / 2, cabinetHeight / 2, 0);

// Moving shelf
const shelfDepth = 3; // extended so no gap at back
const shelfGeo = new THREE.BoxGeometry(cabinetWidth - 0.4, 0.3, shelfDepth);
const shelfMesh = new THREE.Mesh(shelfGeo, shelfMaterial);
shelfMesh.position.set(0, 1, -cabinetDepth / 2 + shelfDepth / 2);
scene.add(shelfMesh);

const shelfShape = new CANNON.Box(new CANNON.Vec3((cabinetWidth - 0.4) / 2, 0.15, shelfDepth / 2));
const shelfBody = new CANNON.Body({ mass: 0 });
shelfBody.addShape(shelfShape);
shelfBody.position.copy(shelfMesh.position);
world.addBody(shelfBody);

let shelfDirection = 1;
const shelfSpeed = 0.005; // half the old speed
const shelfTravel = 2; // how far it moves forward/back
const shelfOriginZ = shelfMesh.position.z;

// Coins
const coins = [];

function dropCoin() {
  const radius = 0.4;
  const height = 0.15;

  const geo = new THREE.CylinderGeometry(radius, radius, height, 32);
  const mesh = new THREE.Mesh(geo, coinMaterial);
  mesh.position.set(0, 5, -cabinetDepth / 2 + 1);
  scene.add(mesh);

  const shape = new CANNON.Cylinder(radius, radius, height, 16);
  const body = new CANNON.Body({ mass: 1, material: new CANNON.Material({ friction: 0.3, restitution: 0.1 }) });
  body.addShape(shape);
  body.position.copy(mesh.position);
  world.addBody(body);

  coins.push({ mesh, body });
}

// Button event
document.getElementById('dropBtn').addEventListener('click', dropCoin);

// Animate
function animate() {
  requestAnimationFrame(animate);

  // Move shelf
  shelfMesh.position.z += shelfSpeed * shelfDirection;
  if (shelfMesh.position.z > shelfOriginZ + shelfTravel || shelfMesh.position.z < shelfOriginZ) {
    shelfDirection *= -1;
  }
  shelfBody.position.copy(shelfMesh.position);

  // Step physics
  world.step(1 / 60);

  // Sync coin meshes
  coins.forEach(c => {
    c.mesh.position.copy(c.body.position);
    c.mesh.quaternion.copy(c.body.quaternion);
  });

  renderer.render(scene, camera);
}

animate();

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
