import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.150.1/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.150.1/examples/jsm/controls/OrbitControls.js';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a);

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// OrbitControls (optional for debugging)
const controls = new OrbitControls(camera, renderer.domElement);

// Cannon world
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
world.broadphase = new CANNON.SAPBroadphase(world);
world.allowSleep = true;

// Materials
const defaultMaterial = new CANNON.Material('default');
const contactMaterial = new CANNON.ContactMaterial(defaultMaterial, defaultMaterial, {
  friction: 0.3,
  restitution: 0.2,
});
world.addContactMaterial(contactMaterial);

// Cabinet (three walls + floor + back, front is open)
const cabinet = new THREE.Group();
const wallMaterial = new THREE.MeshBasicMaterial({ color: 0x444444, side: THREE.BackSide });
const thickness = 0.5;
const cabinetWidth = 10;
const cabinetHeight = 10;
const cabinetDepth = 10;

// Floor
const floorGeo = new THREE.BoxGeometry(cabinetWidth, thickness, cabinetDepth);
const floor = new THREE.Mesh(floorGeo, wallMaterial);
floor.position.y = -thickness / 2;
cabinet.add(floor);

// Back wall
const backGeo = new THREE.BoxGeometry(cabinetWidth, cabinetHeight, thickness);
const backWall = new THREE.Mesh(backGeo, wallMaterial);
backWall.position.z = -cabinetDepth / 2;
backWall.position.y = cabinetHeight / 2 - thickness / 2;
cabinet.add(backWall);

// Left wall
const leftGeo = new THREE.BoxGeometry(thickness, cabinetHeight, cabinetDepth);
const leftWall = new THREE.Mesh(leftGeo, wallMaterial);
leftWall.position.x = -cabinetWidth / 2;
leftWall.position.y = cabinetHeight / 2 - thickness / 2;
cabinet.add(leftWall);

// Right wall
const rightGeo = new THREE.BoxGeometry(thickness, cabinetHeight, cabinetDepth);
const rightWall = new THREE.Mesh(rightGeo, wallMaterial);
rightWall.position.x = cabinetWidth / 2;
rightWall.position.y = cabinetHeight / 2 - thickness / 2;
cabinet.add(rightWall);

scene.add(cabinet);

// Moving shelf (slightly wider than cabinet)
const shelfThickness = 0.5;
const shelfGeo = new THREE.BoxGeometry(cabinetWidth + 2, shelfThickness, cabinetDepth * 0.6); // +2 for overlap
const shelfMat = new THREE.MeshBasicMaterial({ color: 0x0000ff });
const shelf = new THREE.Mesh(shelfGeo, shelfMat);
shelf.position.set(0, 3, 0);
scene.add(shelf);

// Shelf physics body
const shelfShape = new CANNON.Box(new CANNON.Vec3((cabinetWidth + 2) / 2, shelfThickness / 2, (cabinetDepth * 0.6) / 2));
const shelfBody = new CANNON.Body({ mass: 0, material: defaultMaterial });
shelfBody.addShape(shelfShape);
shelfBody.position.copy(shelf.position);
world.addBody(shelfBody);

// Shelf movement
let shelfDirection = 1;
const shelfSpeed = 2;

// Coins
const coinGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32);
const coinMaterial = new THREE.MeshBasicMaterial({ color: 0xffd700 });
const coins = [];
const coinBodies = [];

// Coin drop button
const button = document.createElement('button');
button.innerText = 'Drop Coin';
button.style.position = 'absolute';
button.style.bottom = '20px';
button.style.left = '50%';
button.style.transform = 'translateX(-50%)';
button.style.padding = '10px 20px';
button.style.fontSize = '16px';
button.style.backgroundColor = 'green';
button.style.color = 'white';
document.body.appendChild(button);

button.addEventListener('click', () => {
  const coin = new THREE.Mesh(coinGeometry, coinMaterial);
  coin.rotation.x = Math.PI / 2; // lay flat
  scene.add(coin);

  const coinShape = new CANNON.Cylinder(0.5, 0.5, 0.1, 32);
  const coinBody = new CANNON.Body({ mass: 1, material: defaultMaterial });
  coinBody.addShape(coinShape);
  coinBody.position.set(0, 8, 0);
  coinBody.quaternion.setFromEuler(Math.PI / 2, 0, 0); // physics flat too
  world.addBody(coinBody);

  coins.push(coin);
  coinBodies.push(coinBody);
});

// Score
let score = 0;
const scoreEl = document.createElement('div');
scoreEl.innerText = `Score: ${score}`;
scoreEl.style.position = 'absolute';
scoreEl.style.top = '10px';
scoreEl.style.left = '10px';
scoreEl.style.color = 'white';
scoreEl.style.fontSize = '20px';
document.body.appendChild(scoreEl);

// Animate
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  // Update physics
  world.step(1 / 60, delta, 3);

  // Move shelf left/right
  shelfBody.position.x += shelfDirection * shelfSpeed * delta;
  if (shelfBody.position.x > 3 || shelfBody.position.x < -3) shelfDirection *= -1;
  shelf.position.copy(shelfBody.position);

  // Sync coins
  coins.forEach((coin, i) => {
    coin.position.copy(coinBodies[i].position);
    coin.quaternion.copy(coinBodies[i].quaternion);
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
