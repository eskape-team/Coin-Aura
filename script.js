// script.js
import * as THREE from './three.module.js';

// Scene setup
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 3, 10);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Cabinet function
function createCabinet() {
  const material = new THREE.MeshStandardMaterial({
    color: 0x444444, // dark gray cabinet
    metalness: 0.3,
    roughness: 0.8,
  });

  // Left wall
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 5, 5), material);
  leftWall.position.set(-3, 0, 0);
  scene.add(leftWall);

  // Right wall
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 5, 5), material);
  rightWall.position.set(3, 0, 0);
  scene.add(rightWall);

  // Back wall
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(6, 5, 0.2), material);
  backWall.position.set(0, 0, -2.5);
  scene.add(backWall);

  // Floor
  const floor = new THREE.Mesh(new THREE.BoxGeometry(6, 0.2, 5), material);
  floor.position.set(0, -2.5, 0);
  scene.add(floor);
}

createCabinet();

// --- Coin drop ---
const coins = [];
const coinGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 32);
const coinMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700 }); // gold

function dropCoin() {
  const coin = new THREE.Mesh(coinGeometry, coinMaterial);
  coin.position.set(0, 3, 0); // drop from top center
  scene.add(coin);
  coins.push({ mesh: coin, velocity: 0 });
}

document.getElementById('dropBtn').addEventListener('click', dropCoin);

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Basic gravity for coins
  coins.forEach((coinData) => {
    coinData.velocity -= 0.02; // gravity
    coinData.mesh.position.y += coinData.velocity;

    // stop when hitting the floor
    if (coinData.mesh.position.y < -2.2) {
      coinData.mesh.position.y = -2.2;
      coinData.velocity = 0;
    }
  });

  renderer.render(scene, camera);
}
animate();

// Resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
