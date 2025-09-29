// Import Three.js
import * as THREE from './three.module.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 5, 12);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("container").appendChild(renderer.domElement);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(10, 15, 10);
scene.add(pointLight);

// ----- Cabinet (simple box with walls and floor) -----
const cabinetGroup = new THREE.Group();

// Floor
const floorGeometry = new THREE.BoxGeometry(8, 0.5, 8);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.position.y = -2;
cabinetGroup.add(floor);

// Back wall
const backWallGeometry = new THREE.BoxGeometry(8, 6, 0.5);
const backWall = new THREE.Mesh(backWallGeometry, floorMaterial);
backWall.position.set(0, 1, -4);
cabinetGroup.add(backWall);

// Left wall
const leftWallGeometry = new THREE.BoxGeometry(0.5, 6, 8);
const leftWall = new THREE.Mesh(leftWallGeometry, floorMaterial);
leftWall.position.set(-4, 1, 0);
cabinetGroup.add(leftWall);

// Right wall
const rightWallGeometry = new THREE.BoxGeometry(0.5, 6, 8);
const rightWall = new THREE.Mesh(rightWallGeometry, floorMaterial);
rightWall.position.set(4, 1, 0);
cabinetGroup.add(rightWall);

// Front barrier (low wall)
const frontBarrierGeometry = new THREE.BoxGeometry(8, 1, 0.5);
const frontBarrier = new THREE.Mesh(frontBarrierGeometry, floorMaterial);
frontBarrier.position.set(0, -1.5, 4);
cabinetGroup.add(frontBarrier);

scene.add(cabinetGroup);

// ----- Coin dropping -----
let score = 0;
const scoreElement = document.getElementById("score");

function dropCoin() {
  const coinGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 32);
  const coinMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700 });
  const coin = new THREE.Mesh(coinGeometry, coinMaterial);

  coin.position.set(0, 5, 0);
  scene.add(coin);

  // Animate falling
  let speed = 0.05;
  function fall() {
    if (coin.position.y > -1.5) {
      coin.position.y -= speed;
      requestAnimationFrame(fall);
    } else {
      score++;
      scoreElement.innerText = "Score: " + score;
    }
  }
  fall();
}

// Button listener
document.getElementById("dropBtn").addEventListener("click", dropCoin);

// ----- Animation loop -----
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// Resize handling
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
