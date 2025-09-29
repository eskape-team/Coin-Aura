// script.js
import * as THREE from './three.module.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x071022);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 6, 12);
camera.lookAt(0, 3, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

// Cabinet dimensions
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, transparent: true, opacity: 0.8 });
const thickness = 0.3;
const width = 6;
const depth = 10;
const height = 8;

// Floor
const floor = new THREE.Mesh(new THREE.BoxGeometry(width, thickness, depth), wallMaterial);
floor.position.set(0, -thickness / 2, 0);
scene.add(floor);

// Back wall
const backWall = new THREE.Mesh(new THREE.BoxGeometry(width, height, thickness), wallMaterial);
backWall.position.set(0, height / 2, -depth / 2);
scene.add(backWall);

// Left wall
const leftWall = new THREE.Mesh(new THREE.BoxGeometry(thickness, height, depth), wallMaterial);
leftWall.position.set(-width / 2, height / 2, 0);
scene.add(leftWall);

// Right wall
const rightWall = new THREE.Mesh(new THREE.BoxGeometry(thickness, height, depth), wallMaterial);
rightWall.position.set(width / 2, height / 2, 0);
scene.add(rightWall);

// Pusher shelf
const shelfMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff }); // bright blue
const shelf = new THREE.Mesh(new THREE.BoxGeometry(width - 0.5, 0.4, depth / 2), shelfMaterial);
shelf.position.set(0, 0.5, -depth / 4); // raised above floor
scene.add(shelf);

// Shelf movement
let shelfSpeed = 0.1; // faster for visibility
function moveShelf() {
  shelf.position.z += shelfSpeed;
  if (shelf.position.z > 1 || shelf.position.z < -depth / 2 + 1) {
    shelfSpeed *= -1; // reverse direction
  }
}

// Coins
const coinMaterial = new THREE.MeshStandardMaterial({ color: 0xffd166 });
const coins = [];

function dropCoin() {
  const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32), coinMaterial);
  coin.rotation.x = Math.PI / 2;
  coin.position.set((Math.random() - 0.5) * (width - 1), height - 0.5, -depth / 2 + 1);
  scene.add(coin);
  coins.push(coin);
}

document.getElementById('dropBtn').addEventListener('click', dropCoin);

// Score display
let score = 0;
function updateScore() {
  document.getElementById('score').textContent = `Score: ${score}`;
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Move shelf
  moveShelf();

  // Gravity + pushing
  coins.forEach((coin) => {
    if (coin.position.y > 0.15) {
      coin.position.y -= 0.05; // fall
    } else {
      coin.position.y = 0.15; // rest
    }

    // Push coins with shelf
    if (
      coin.position.y <= shelf.position.y + 0.3 &&
      coin.position.y > shelf.position.y &&
      coin.position.z < shelf.position.z + depth / 4 &&
      coin.position.z > shelf.position.z - depth / 4
    ) {
      coin.position.z += shelfSpeed * 0.6; // shelf pushes coin
    }

    // Score if coin falls out
    if (coin.position.z > depth / 2) {
      score++;
      updateScore();
      scene.remove(coin);
    }
  });

  renderer.render(scene, camera);
}

animate();
