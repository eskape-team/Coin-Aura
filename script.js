// Import Three.js
import * as THREE from './three.module.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x071022); // dark blue background

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 5, 15);
camera.lookAt(0, 0, 0);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("container").appendChild(renderer.domElement);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(5, 10, 10);
scene.add(pointLight);

// ----- Cabinet -----
const cabinetGroup = new THREE.Group();
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff }); // bright white

// Floor
const floor = new THREE.Mesh(new THREE.BoxGeometry(8, 0.5, 8), wallMaterial);
floor.position.y = -2;
cabinetGroup.add(floor);

// Back wall
const backWall = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 0.5), wallMaterial);
backWall.position.set(0, 1, -4);
cabinetGroup.add(backWall);

// Left wall
const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6, 8), wallMaterial);
leftWall.position.set(-4, 1, 0);
cabinetGroup.add(leftWall);

// Right wall
const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6, 8), wallMaterial);
rightWall.position.set(4, 1, 0);
cabinetGroup.add(rightWall);

// Front barrier
const frontBarrier = new THREE.Mesh(new THREE.BoxGeometry(8, 1, 0.5), wallMaterial);
frontBarrier.position.set(0, -1.5, 4);
cabinetGroup.add(frontBarrier);

scene.add(cabinetGroup);

// ----- Coin dropping -----
let score = 0;
const scoreElement = document.getElementById("score");

function dropCoin() {
  const coin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 0.2, 32),
    new THREE.MeshStandardMaterial({ color: 0xffd700 })
  );

  coin.position.set(0, 5, 0);
  scene.add(coin);

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

document.getElementById("dropBtn").addEventListener("click", dropCoin);

// Animation loop
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
