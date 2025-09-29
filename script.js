import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.150.1/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.150.1/examples/jsm/controls/OrbitControls.js';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a);

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 15);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);

// Cannon world
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

// Materials
const defaultMaterial = new CANNON.Material('default');
world.addContactMaterial(new CANNON.ContactMaterial(defaultMaterial, defaultMaterial, {
  friction: 0.3,
  restitution: 0.2,
}));

// Cabinet dimensions
const cabinetWidth = 10;
const cabinetHeight = 10;
const cabinetDepth = 10;
const thickness = 0.5;
const wallMaterial = new THREE.MeshBasicMaterial({ color: 0x444444, side: THREE.FrontSide });

// Floor
const floor = new THREE.Mesh(new THREE.BoxGeometry(cabinetWidth, thickness, cabinetDepth), wallMaterial);
floor.position.set(0, -thickness / 2, 0);
scene.add(floor);

// Back wall
const backWall = new THREE.Mesh(new THREE.BoxGeometry(cabinetWidth, cabinetHeight, thickness), wallMaterial);
backWall.position.set(0, cabinetHeight / 2 - thickness / 2, -cabinetDepth / 2);
scene.add(backWall);

// Left wall
const leftWall = new THREE.Mesh(new THREE.BoxGeometry(thickness, cabinetHeight, cabinetDepth), wallMaterial);
leftWall.position.set(-cabinetWidth / 2, cabinetHeight / 2 - thickness / 2, 0);
scene.add(leftWall);

// Right wall
const rightWall = new THREE.Mesh(new THREE.BoxGeometry(thickness, cabinetHeight, cabinetDepth), wallMaterial);
rightWall.position.set(cabinetWidth / 2, cabinetHeight / 2 - thickness / 2, 0);
scene.add(rightWall);

// Moving shelf (slightly wider than cabinet to avoid gaps)
const shelfThickness = 0.5;
const shelf = new THREE.Mesh(
  new THREE.BoxGeometry(cabinetWidth + 2, shelfThickness, cabinetDepth * 0.6),
  new THREE.MeshBasicMaterial({ color: 0x0000ff })
);
shelf.position.set(0, 3, 0);
scene.add(shelf);

// Shelf physics
const shelfBody = new CANNON.Body({ mass: 0, material: defaultMaterial });
shelfBody.addShape(new CANNON.Box(new CANNON.Vec3((cabinetWidth + 2) / 2, shelfThickness / 2, (cabinetDepth * 0.6) / 2)));
shelfBody.position.copy(shelf.position);
world.addBody(shelfBody);

let shelfDirection = 1;
const shelfSpeed = 2;

// Coin setup
const coins = [];
const coinBodies = [];
const coinGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32);
const coinMaterial = new THREE.MeshBasicMaterial({ color: 0xffd700 });

// Drop Coin button
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
  coin.rotation.x = Math.PI / 2;
  scene.add(coin);

  const coinBody = new CANNON.Body({ mass: 1, material: defaultMaterial });
  coinBody.addShape(new CANNON.Cylinder(0.5, 0.5, 0.1, 32));
  coinBody.position.set(0, 8, 0);
  coinBody.quaternion.setFromEuler(Math.PI / 2, 0, 0);
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

// Animation loop
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  world.step(1 / 60, delta, 3);

  // Shelf movement
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
