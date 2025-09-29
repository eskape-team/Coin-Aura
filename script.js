// Import three.js and extras
import * as THREE from './three.module.js';
import { FontLoader } from './FontLoader.js';
import { TextGeometry } from './TextGeometry.js';
import * as CANNON from './cannon-es.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(5, 10, 7.5);
scene.add(dirLight);

// Physics world
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

// Materials
const coinMaterial = new CANNON.Material("coinMaterial");
const shelfMaterial = new CANNON.Material("shelfMaterial");

// Cabinet (static walls)
function createWall(x, y, z, w, h, d) {
  const wallGeometry = new THREE.BoxGeometry(w, h, d);
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, transparent: true, opacity: 0.8 });
  const wall = new THREE.Mesh(wallGeometry, wallMaterial);
  wall.position.set(x, y, z);
  scene.add(wall);

  const wallShape = new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2));
  const wallBody = new CANNON.Body({ mass: 0 });
  wallBody.addShape(wallShape);
  wallBody.position.set(x, y, z);
  world.addBody(wallBody);
}

createWall(0, -5, -10, 10, 10, 1); // back
createWall(-5, -5, 0, 1, 10, 20); // left
createWall(5, -5, 0, 1, 10, 20); // right
createWall(0, -10, 0, 10, 1, 20); // bottom

// Moving shelf (extended depth so coins can't fall behind)
const shelfGeometry = new THREE.BoxGeometry(8, 0.5, 24); 
const shelfMesh = new THREE.Mesh(shelfGeometry, new THREE.MeshStandardMaterial({ color: 0x0000ff }));
scene.add(shelfMesh);

const shelfShape = new CANNON.Box(new CANNON.Vec3(4, 0.25, 12));
const shelfBody = new CANNON.Body({
  mass: 0, 
  type: CANNON.Body.KINEMATIC,
  position: new CANNON.Vec3(0, -4.75, 0)
});
shelfBody.addShape(shelfShape);
world.addBody(shelfBody);

// Coins
const coins = [];

function dropCoin() {
  const radius = 0.5;
  const coinGeometry = new THREE.CylinderGeometry(radius, radius, 0.2, 32);
  const coinMesh = new THREE.Mesh(coinGeometry, new THREE.MeshStandardMaterial({ color: 0xFFD700 }));
  coinMesh.position.set(0, 5, 0);
  scene.add(coinMesh);

  const coinShape = new CANNON.Cylinder(radius, radius, 0.2, 16);
  const coinBody = new CANNON.Body({ mass: 1, material: coinMaterial });
  coinBody.addShape(coinShape);
  coinBody.position.set(0, 5, 0);
  world.addBody(coinBody);

  coins.push({ mesh: coinMesh, body: coinBody });
}

document.getElementById("dropBtn").addEventListener("click", dropCoin);

// Animate shelf (forward and backward)
let shelfDirection = 1;
const shelfSpeed = 0.5; // slower speed

// Track coins on shelf
function updateShelfAndCoins() {
  // Move shelf
  shelfBody.position.z += shelfDirection * shelfSpeed * 0.1;
  if (shelfBody.position.z > 2 || shelfBody.position.z < -2) {
    shelfDirection *= -1;
  }

  // Sync THREE mesh
  shelfMesh.position.copy(shelfBody.position);
  shelfMesh.quaternion.copy(shelfBody.quaternion);

  // Check if coins are on top of the shelf
  coins.forEach(({ body }) => {
    const relativeY = body.position.y - shelfBody.position.y;
    if (relativeY > 0 && relativeY < 1) {
      // Apply shelf movement to coin
      body.velocity.z += shelfDirection * shelfSpeed * 0.05;
    }
  });
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  world.step(1 / 60);

  // Update shelf + coins on top
  updateShelfAndCoins();

  // Update coin meshes
  coins.forEach(({ mesh, body }) => {
    mesh.position.copy(body.position);
    mesh.quaternion.copy(body.quaternion);
  });

  renderer.render(scene, camera);
}

camera.position.set(0, 0, 15);
animate();
