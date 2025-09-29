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
scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(5, 10, 7.5);
scene.add(dirLight);

// Physics world
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
world.broadphase = new CANNON.NaiveBroadphase();
world.solver.iterations = 10;

// Materials
const coinMaterial = new CANNON.Material("coinMaterial");
const shelfMaterial = new CANNON.Material("shelfMaterial");

// Friction so coins stick to shelf
const shelfCoinContact = new CANNON.ContactMaterial(shelfMaterial, coinMaterial, {
  friction: 0.6, // enough to drag coins
  restitution: 0.1
});
world.addContactMaterial(shelfCoinContact);

// Cabinet walls
function createWall(x, y, z, w, h, d) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color: 0x555555, transparent: true, opacity: 0.8 })
  );
  mesh.position.set(x, y, z);
  scene.add(mesh);

  const shape = new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2));
  const body = new CANNON.Body({ mass: 0 });
  body.addShape(shape);
  body.position.set(x, y, z);
  world.addBody(body);
}

// Cabinet centered
createWall(0, -5, -10, 10, 10, 1); // back
createWall(-5, -5, 0, 1, 10, 20);  // left
createWall(5, -5, 0, 1, 10, 20);   // right
createWall(0, -10, 0, 10, 1, 20);  // bottom

// Shelf (slightly extended depth)
const shelfGeometry = new THREE.BoxGeometry(8, 0.5, 14); 
const shelfMesh = new THREE.Mesh(shelfGeometry, new THREE.MeshStandardMaterial({ color: 0x0000ff }));
scene.add(shelfMesh);

const shelfShape = new CANNON.Box(new CANNON.Vec3(4, 0.25, 7));
const shelfBody = new CANNON.Body({
  mass: 0,
  type: CANNON.Body.KINEMATIC,
  material: shelfMaterial,
  position: new CANNON.Vec3(0, -4.75, 0)
});
shelfBody.addShape(shelfShape);
world.addBody(shelfBody);

// Coins
const coins = [];

function dropCoin() {
  const radius = 0.5;
  const geometry = new THREE.CylinderGeometry(radius, radius, 0.2, 32);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0xFFD700 }));
  mesh.position.set(0, 5, 0);
  scene.add(mesh);

  const shape = new CANNON.Cylinder(radius, radius, 0.2, 16);
  const body = new CANNON.Body({ mass: 1, material: coinMaterial });
  body.addShape(shape);
  body.position.set(0, 5, 0);
  world.addBody(body);

  coins.push({ mesh, body });
}

document.getElementById("dropBtn").addEventListener("click", dropCoin);

// Shelf motion
let shelfDirection = 1;
const shelfSpeed = 0.5;

function updateShelf() {
  shelfBody.position.z += shelfDirection * shelfSpeed * 0.05;
  if (shelfBody.position.z > 2 || shelfBody.position.z < -2) {
    shelfDirection *= -1;
  }
  shelfMesh.position.copy(shelfBody.position);
  shelfMesh.quaternion.copy(shelfBody.quaternion);
}

// Animate
function animate() {
  requestAnimationFrame(animate);

  world.step(1 / 60);
  updateShelf();

  coins.forEach(({ mesh, body }) => {
    mesh.position.copy(body.position);
    mesh.quaternion.copy(body.quaternion);
  });

  renderer.render(scene, camera);
}

camera.position.set(0, 0, 15);
animate();
